import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

// GET /api/appointments - List appointments with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || ''
    const doctorId = searchParams.get('doctorId') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''

    const where: Record<string, unknown> = {}

    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const appointments = await db.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            name: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            department: true,
          },
        },
        prescription: true,
      },
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// POST /api/appointments - Create appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      doctorId,
      date,
      timeSlot,
      type,
      notes,
      bookingChannel = 'WALK_IN',
      triageTag = 'NORMAL',
      branchId,
    } = body

    if (!patientId || !doctorId || !date || !timeSlot) {
      return NextResponse.json(
        { error: 'Patient, doctor, date, and time slot are required' },
        { status: 400 }
      )
    }

    const apptDate = new Date(date)
    const dayStart = new Date(apptDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(apptDate)
    dayEnd.setHours(23, 59, 59, 999)

    // Calculate sequential token number for this doctor on this day
    const countForDay = await db.appointment.count({
      where: {
        doctorId,
        date: { gte: dayStart, lte: dayEnd },
      },
    })
    const tokenNumber = countForDay + 1

    const appointment = await db.appointment.create({
      data: {
        patientId,
        doctorId,
        date: apptDate,
        timeSlot,
        type: type || 'CONSULTATION',
        notes: notes || null,
        tokenNumber,
        queueStatus: 'WAITING',
        triageTag,
        bookingChannel,
        branchId: branchId || null,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientId: true,
            name: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
    })

    // Auto-create confirmation notification log
    if (appointment.patient.phone) {
      await db.notificationLog.create({
        data: {
          patientId: appointment.patient.id,
          recipient: appointment.patient.phone,
          channel: bookingChannel === 'ONLINE' ? 'WHATSAPP' : 'SMS',
          type: 'APPOINTMENT_CONFIRMATION',
          message: `Appointment Confirmed! Token #${tokenNumber} for ${appointment.patient.name} with Dr. ${appointment.doctor.name} on ${apptDate.toLocaleDateString()} at ${timeSlot}. Channel: ${bookingChannel}`,
          status: 'DELIVERED',
        },
      })
    }

    // Audit log
    await logAudit({
      action: 'CREATE',
      module: 'PATIENTS',
      recordId: appointment.id,
      details: `Appointment created: Token #${tokenNumber} for ${appointment.patient.name} with Dr. ${appointment.doctor.name}`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
