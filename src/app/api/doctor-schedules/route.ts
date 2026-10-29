import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/doctor-schedules - List all doctor schedules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const dayOfWeek = searchParams.get('dayOfWeek')

    const where: Record<string, unknown> = {}

    if (staffId) {
      where.staffId = staffId
    }
    if (dayOfWeek !== null && dayOfWeek !== '') {
      where.dayOfWeek = parseInt(dayOfWeek, 10)
    }

    const schedules = await db.doctorSchedule.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            department: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching doctor schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch doctor schedules' },
      { status: 500 }
    )
  }
}

// POST /api/doctor-schedules - Create a new schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      staffId,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration,
      maxPatients,
      isAvailable,
      breakStart,
      breakEnd,
      consultationFee,
      notes,
    } = body

    if (!staffId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Doctor, day of week, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:mm format.' },
        { status: 400 }
      )
    }

    // Validate start < end
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Validate break times if provided
    if (breakStart && breakEnd) {
      if (!timeRegex.test(breakStart) || !timeRegex.test(breakEnd)) {
        return NextResponse.json(
          { error: 'Invalid break time format. Use HH:mm format.' },
          { status: 400 }
        )
      }
      if (breakStart >= breakEnd) {
        return NextResponse.json(
          { error: 'Break end time must be after break start time' },
          { status: 400 }
        )
      }
      // Validate break falls within working hours
      if (breakStart < startTime || breakEnd > endTime) {
        return NextResponse.json(
          { error: 'Break time must fall within working hours' },
          { status: 400 }
        )
      }
    }

    // Check for existing schedule for same doctor + day
    const existing = await db.doctorSchedule.findUnique({
      where: {
        staffId_dayOfWeek: {
          staffId,
          dayOfWeek: parseInt(dayOfWeek, 10),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A schedule already exists for this doctor on this day. Please edit the existing schedule.' },
        { status: 409 }
      )
    }

    // Verify staff member exists
    const staff = await db.staff.findUnique({
      where: { id: staffId },
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const schedule = await db.doctorSchedule.create({
      data: {
        staffId,
        dayOfWeek: parseInt(dayOfWeek, 10),
        startTime,
        endTime,
        slotDuration: slotDuration ? parseInt(slotDuration, 10) : 30,
        maxPatients: maxPatients ? parseInt(maxPatients, 10) : 1,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        breakStart: breakStart || null,
        breakEnd: breakEnd || null,
        consultationFee: consultationFee ? parseFloat(consultationFee) : 0,
        notes: notes || null,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            department: true,
          },
        },
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Error creating doctor schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create doctor schedule' },
      { status: 500 }
    )
  }
}
