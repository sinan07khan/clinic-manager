import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    const procedures = await db.otProcedure.findMany({
      orderBy: { scheduledDate: 'desc' },
      take: 50,
    })

    // Fetch related patient and doctor names
    const patientIds = procedures.map((p) => p.patientId)
    const doctorIds = procedures.map((p) => p.leadSurgeonId)

    const patients = await db.patient.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, name: true, patientId: true, phone: true },
    })
    const doctors = await db.staff.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, name: true, specialization: true },
    })

    const patientMap = new Map(patients.map((p) => [p.id, p]))
    const doctorMap = new Map(doctors.map((d) => [d.id, d]))

    const enriched = procedures.map((p) => ({
      ...p,
      patient: patientMap.get(p.patientId) || null,
      leadSurgeon: doctorMap.get(p.leadSurgeonId) || null,
    }))

    return NextResponse.json(enriched)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch OT procedures'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      procedureName,
      otRoom,
      scheduledDate,
      startTime,
      endTime,
      leadSurgeonId,
      anesthetistId,
      notes,
    } = body

    if (!patientId || !procedureName || !scheduledDate || !leadSurgeonId) {
      return NextResponse.json({ error: 'Patient, procedure name, date, and surgeon are required' }, { status: 400 })
    }

    const procedureNo = `OT-${Date.now().toString().slice(-6)}`

    const procedure = await db.otProcedure.create({
      data: {
        procedureNo,
        patientId,
        procedureName,
        otRoom: otRoom || 'MINOR_OT_1',
        scheduledDate: new Date(scheduledDate),
        startTime: startTime || '10:00 AM',
        endTime: endTime || '11:30 AM',
        leadSurgeonId,
        anesthetistId: anesthetistId || null,
        notes: notes || null,
      },
    })

    await logAudit({
      action: 'CREATE',
      module: 'BEDS',
      recordId: procedure.id,
      details: `Scheduled ${procedureName} in ${otRoom || 'MINOR_OT_1'} (#${procedureNo})`,
    })

    return NextResponse.json(procedure, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to schedule OT procedure'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Procedure ID and status are required' }, { status: 400 })
    }

    const procedure = await db.otProcedure.update({
      where: { id },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined,
      },
    })

    await logAudit({
      action: 'UPDATE',
      module: 'BEDS',
      recordId: id,
      details: `OT Procedure #${procedure.procedureNo} status updated to ${status}`,
    })

    return NextResponse.json(procedure)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update procedure'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

