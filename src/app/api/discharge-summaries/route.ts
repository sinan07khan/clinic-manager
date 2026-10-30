import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    const where: any = {}
    if (patientId) where.patientId = patientId

    const summaries = await db.dischargeSummary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const patientIds = summaries.map((s) => s.patientId)
    const doctorIds = summaries.map((s) => s.doctorId)

    const patients = await db.patient.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, name: true, patientId: true, phone: true, gender: true },
    })
    const doctors = await db.staff.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, name: true, specialization: true },
    })

    const patientMap = new Map(patients.map((p) => [p.id, p]))
    const doctorMap = new Map(doctors.map((d) => [d.id, d]))

    const enriched = summaries.map((s) => ({
      ...s,
      patient: patientMap.get(s.patientId) || null,
      doctor: doctorMap.get(s.doctorId) || null,
    }))

    return NextResponse.json(enriched)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch discharge summaries'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      admissionDate,
      dischargeDate,
      finalDiagnosis,
      treatmentGiven,
      conditionOnDischarge,
      followUpAdvice,
      medicationsOnDischarge,
      emergencyRedFlags,
      doctorId,
    } = body

    if (!patientId || !finalDiagnosis || !doctorId) {
      return NextResponse.json({ error: 'Patient ID, final diagnosis, and doctor are required' }, { status: 400 })
    }

    const summaryNo = `DIS-${Date.now().toString().slice(-6)}`

    const summary = await db.dischargeSummary.create({
      data: {
        summaryNo,
        patientId,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        dischargeDate: dischargeDate ? new Date(dischargeDate) : new Date(),
        finalDiagnosis,
        treatmentGiven: treatmentGiven || 'Standard conservative care',
        conditionOnDischarge: conditionOnDischarge || 'Stable, hemodynamically settled',
        followUpAdvice: followUpAdvice || 'Follow-up in OPD after 7 days or SOS in emergency',
        medicationsOnDischarge: medicationsOnDischarge || null,
        emergencyRedFlags: emergencyRedFlags || 'High fever >102°F, shortness of breath, severe pain, bleeding',
        doctorId,
      },
    })

    await logAudit({
      action: 'CREATE',
      module: 'BEDS',
      recordId: summary.id,
      details: `Generated standardized discharge summary #${summaryNo}`,
    })

    return NextResponse.json(summary, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create discharge summary'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

