import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    const where: any = {}
    if (patientId) where.patientId = patientId

    const vitals = await db.vitals.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        patient: {
          select: { id: true, name: true, patientId: true },
        },
      },
    })

    return NextResponse.json(vitals)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch vitals'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      appointmentId,
      bpSystolic,
      bpDiastolic,
      pulse,
      temperature,
      spO2,
      heightCm,
      weightKg,
      bloodSugar,
      triagePriority,
      notes,
      recordedBy,
    } = body

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    // Auto calculate BMI
    let bmi: number | null = null
    if (heightCm && weightKg && heightCm > 0) {
      const heightM = heightCm / 100
      bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1))
    }

    // Auto determine triage priority if not provided
    let priority = triagePriority || 'NORMAL'
    if (
      (bpSystolic && (bpSystolic > 180 || bpSystolic < 90)) ||
      (spO2 && spO2 < 92) ||
      (pulse && (pulse > 130 || pulse < 50))
    ) {
      priority = 'EMERGENCY'
    } else if (
      (bpSystolic && bpSystolic > 150) ||
      (temperature && temperature > 102) ||
      (spO2 && spO2 < 95)
    ) {
      priority = 'URGENT'
    }

    const vitalsRecord = await db.vitals.create({
      data: {
        patientId,
        appointmentId: appointmentId || undefined,
        bpSystolic: bpSystolic ? parseInt(bpSystolic) : null,
        bpDiastolic: bpDiastolic ? parseInt(bpDiastolic) : null,
        pulse: pulse ? parseInt(pulse) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        spO2: spO2 ? parseInt(spO2) : null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        bmi,
        bloodSugar: bloodSugar ? parseFloat(bloodSugar) : null,
        triagePriority: priority,
        notes: notes || null,
        recordedBy: recordedBy || 'Nurse Staff',
      },
      include: {
        patient: { select: { name: true, patientId: true } },
      },
    })

    await logAudit({
      action: 'CREATE',
      module: 'EMR',
      recordId: vitalsRecord.id,
      details: `Logged vitals for patient ${vitalsRecord.patient.name} (${vitalsRecord.patient.patientId}) - Triage: ${priority}`,
    })

    return NextResponse.json(vitalsRecord, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record vitals'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

