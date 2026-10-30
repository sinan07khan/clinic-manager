import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')
    const branchId = searchParams.get('branchId')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const where: any = {
      date: {
        gte: today,
        lt: tomorrow,
      },
      status: {
        notIn: ['CANCELLED'],
      },
    }

    if (doctorId && doctorId !== 'ALL') where.doctorId = doctorId
    if (branchId && branchId !== 'ALL') where.branchId = branchId

    const appointments = await db.appointment.findMany({
      where,
      orderBy: [
        { triageTag: 'desc' }, // EMERGENCY > FAST_TRACK > NORMAL
        { tokenNumber: 'asc' },
      ],
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true } },
        doctor: { select: { id: true, name: true, department: true } },
      },
    })

    const calling = appointments.filter((a) => a.queueStatus === 'CALLING')
    const inConsultation = appointments.filter((a) => a.queueStatus === 'IN_CONSULTATION')
    const waiting = appointments.filter((a) => a.queueStatus === 'WAITING')
    const completed = appointments.filter((a) => a.queueStatus === 'COMPLETED')

    return NextResponse.json({
      totalToday: appointments.length,
      calling,
      inConsultation,
      waiting,
      completed,
      queue: appointments,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch queue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, queueStatus, estimatedWaitMins } = body

    if (!appointmentId || !queueStatus) {
      return NextResponse.json({ error: 'Appointment ID and Queue Status are required' }, { status: 400 })
    }

    const appt = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        queueStatus,
        estimatedWaitMins: estimatedWaitMins ? parseInt(estimatedWaitMins) : undefined,
        status: queueStatus === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED',
      },
      include: {
        patient: { select: { name: true, patientId: true, phone: true } },
        doctor: { select: { name: true } },
      },
    })

    if (queueStatus === 'CALLING' && appt.patient.phone) {
      await db.notificationLog.create({
        data: {
          patientId: appt.patientId,
          recipient: appt.patient.phone,
          channel: 'SMS',
          type: 'QUEUE_ALERT',
          message: `Token #${appt.tokenNumber || 'A-101'}: ${appt.patient.name}, please proceed to Dr. ${appt.doctor.name}'s consultation room now.`,
          status: 'DELIVERED',
        },
      })
    }

    await logAudit({
      action: 'CALL_TOKEN',
      module: 'PATIENTS',
      recordId: appointmentId,
      details: `Queue status changed to ${queueStatus} for Token #${appt.tokenNumber || 'A-101'} (${appt.patient.name}) with Dr. ${appt.doctor.name}`,
    })

    return NextResponse.json(appt)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update queue status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
