import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    const history = await db.clinicalHistory.findUnique({
      where: { patientId },
      include: {
        patient: { select: { id: true, name: true, patientId: true } },
      },
    })

    return NextResponse.json(history || {
      patientId,
      allergies: JSON.stringify([]),
      chronicConditions: JSON.stringify([]),
      surgicalHistory: '',
      familyHistory: '',
      notes: '',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch clinical history'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      allergies,
      chronicConditions,
      surgicalHistory,
      familyHistory,
      notes,
    } = body

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    const allergiesStr = typeof allergies === 'string' ? allergies : JSON.stringify(allergies || [])
    const chronicStr = typeof chronicConditions === 'string' ? chronicConditions : JSON.stringify(chronicConditions || [])

    const record = await db.clinicalHistory.upsert({
      where: { patientId },
      update: {
        allergies: allergiesStr,
        chronicConditions: chronicStr,
        surgicalHistory: surgicalHistory || null,
        familyHistory: familyHistory || null,
        notes: notes || null,
      },
      create: {
        patientId,
        allergies: allergiesStr,
        chronicConditions: chronicStr,
        surgicalHistory: surgicalHistory || null,
        familyHistory: familyHistory || null,
        notes: notes || null,
      },
      include: {
        patient: { select: { name: true, patientId: true } },
      },
    })

    await logAudit({
      action: 'UPDATE',
      module: 'EMR',
      recordId: record.id,
      details: `Updated EMR clinical history & allergies for ${record.patient.name} (${record.patient.patientId})`,
    })

    return NextResponse.json(record)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save clinical history'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

