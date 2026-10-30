import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

// Pre-defined allergy & drug interaction warnings list
const KNOWN_DRUG_ALLERGIES: Record<string, string[]> = {
  penicillin: ['amoxicillin', 'ampicillin', 'augmentin', 'penicillin', 'piperacillin'],
  sulfa: ['sulfamethoxazole', 'bactrim', 'septra', 'sulfasalazine'],
  aspirin: ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac'],
  nsaid: ['ibuprofen', 'naproxen', 'ketorolac', 'diclofenac', 'indomethacin'],
  cephalosporin: ['cephalexin', 'cefixime', 'ceftriaxone', 'cefuroxime'],
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const doctorId = searchParams.get('doctorId')
    const appointmentId = searchParams.get('appointmentId')

    const where: any = {}
    if (patientId) where.patientId = patientId
    if (doctorId) where.doctorId = doctorId
    if (appointmentId) where.appointmentId = appointmentId

    const prescriptions = await db.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, bloodGroup: true } },
        doctor: { select: { id: true, name: true, specialization: true, department: true } },
        appointment: { select: { id: true, date: true, timeSlot: true, type: true } },
      },
    })

    return NextResponse.json(prescriptions)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch prescriptions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      appointmentId,
      doctorId,
      patientId,
      chiefComplaints,
      clinicalFindings,
      symptoms,
      diagnosis,
      medicines,
      investigations,
      adviceTemplates,
      notes,
      followUpDate,
      dispatchChannel,
    } = body

    if (!appointmentId || !doctorId || !patientId) {
      return NextResponse.json({ error: 'Appointment ID, Doctor ID, and Patient ID are required' }, { status: 400 })
    }

    // Check drug allergy interactions against patient's clinical history
    const clinicalHistory = await db.clinicalHistory.findUnique({ where: { patientId } })
    const warnings: string[] = []

    if (clinicalHistory?.allergies && medicines) {
      try {
        const allergies = JSON.parse(clinicalHistory.allergies)
        const medList = typeof medicines === 'string' ? JSON.parse(medicines) : medicines

        if (Array.isArray(allergies) && Array.isArray(medList)) {
          for (const med of medList) {
            const medName = (med.name || '').toLowerCase()
            for (const allergy of allergies) {
              const allergyLower = (allergy.allergen || allergy || '').toLowerCase()
              for (const [classKey, drugs] of Object.entries(KNOWN_DRUG_ALLERGIES)) {
                if (allergyLower.includes(classKey) && drugs.some((d) => medName.includes(d))) {
                  warnings.push(`⚠️ ALLERGY WARNING: Patient is allergic to ${allergyLower.toUpperCase()}! Prescribed medication "${med.name}" may cause severe adverse reaction.`)
                }
              }
            }
          }
        }
      } catch {
        // Safe JSON parsing fallback
      }
    }

    const medicinesStr = typeof medicines === 'string' ? medicines : JSON.stringify(medicines || [])
    const investigationsStr = typeof investigations === 'string' ? investigations : JSON.stringify(investigations || [])
    const adviceStr = typeof adviceTemplates === 'string' ? adviceTemplates : JSON.stringify(adviceTemplates || [])

    const prescription = await db.prescription.create({
      data: {
        appointmentId,
        doctorId,
        patientId,
        chiefComplaints: chiefComplaints || null,
        clinicalFindings: clinicalFindings || null,
        symptoms: symptoms || null,
        diagnosis: diagnosis || null,
        medicines: medicinesStr,
        investigations: investigationsStr,
        adviceTemplates: adviceStr,
        notes: notes || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        isDispatched: Boolean(dispatchChannel),
        dispatchChannel: dispatchChannel || null,
      },
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true } },
        doctor: { select: { id: true, name: true, specialization: true } },
      },
    })

    // Log notification if dispatched
    if (dispatchChannel && prescription.patient.phone) {
      await db.notificationLog.create({
        data: {
          patientId: prescription.patient.id,
          recipient: prescription.patient.phone,
          channel: dispatchChannel,
          type: 'PRESCRIPTION',
          message: `Dear ${prescription.patient.name}, your digital prescription from Dr. ${prescription.doctor.name} is ready. Follow-up: ${followUpDate ? new Date(followUpDate).toLocaleDateString() : 'As advised'}. Download: https://clinic.local/rx/${prescription.id}`,
          status: 'DELIVERED',
        },
      })
    }

    // If follow-up date is provided, auto-create a scheduled follow-up appointment
    if (followUpDate) {
      await db.appointment.create({
        data: {
          patientId,
          doctorId,
          date: new Date(followUpDate),
          timeSlot: '10:00 AM',
          type: 'FOLLOW_UP',
          status: 'BOOKED',
          notes: `Follow-up review scheduled from Prescription #${prescription.id.slice(-6)}`,
          bookingChannel: 'WALK_IN',
        },
      })
    }

    await logAudit({
      action: 'CREATE',
      module: 'EMR',
      recordId: prescription.id,
      details: `Generated digital prescription for ${prescription.patient.name} by Dr. ${prescription.doctor.name}${warnings.length > 0 ? ' [With Warnings]' : ''}`,
    })

    return NextResponse.json({ ...prescription, warnings }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate prescription'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

