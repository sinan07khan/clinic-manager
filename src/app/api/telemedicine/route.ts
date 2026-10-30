import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')

    const where: any = {}
    if (doctorId) where.doctorId = doctorId
    if (patientId) where.patientId = patientId
    if (status && status !== 'ALL') where.status = status

    const sessions = await db.telemedicineSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        appointment: {
          include: {
            patient: { select: { id: true, name: true, patientId: true, phone: true } },
            doctor: { select: { id: true, name: true, specialization: true } },
          },
        },
      },
    })

    return NextResponse.json(sessions)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch telemedicine sessions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, paymentAmount, paymentMethod, notes } = body

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 })
    }

    const appt = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
    })

    if (!appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const roomCode = `TELE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const session = await db.telemedicineSession.create({
      data: {
        appointmentId,
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        roomCode,
        status: 'WAITING',
        paymentVerified: true,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : 500,
        paymentMethod: paymentMethod || 'bKash',
        notes: notes || null,
      },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
          },
        },
      },
    })

    // Notify patient with room link
    if (appt.patient.phone) {
      await db.notificationLog.create({
        data: {
          patientId: appt.patient.id,
          recipient: appt.patient.phone,
          channel: 'WHATSAPP',
          type: 'APPOINTMENT_CONFIRMATION',
          message: `Hello ${appt.patient.name}, your Telemedicine consultation with Dr. ${appt.doctor.name} is confirmed! Payment verified: BDT ${session.paymentAmount}. Join room: ${roomCode}`,
          status: 'DELIVERED',
        },
      })
    }

    await logAudit({
      action: 'CREATE',
      module: 'TELEMEDICINE',
      recordId: session.id,
      details: `Started Telemedicine session ${roomCode} for patient ${appt.patient.name} with Dr. ${appt.doctor.name}`,
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'ACTIVE') updateData.startedAt = new Date()
      if (status === 'COMPLETED') updateData.endedAt = new Date()
    }
    if (notes !== undefined) updateData.notes = notes

    const session = await db.telemedicineSession.update({
      where: { id },
      data: updateData,
    })

    await logAudit({
      action: 'UPDATE',
      module: 'TELEMEDICINE',
      recordId: id,
      details: `Telemedicine session status updated to ${status}`,
    })

    return NextResponse.json(session)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

