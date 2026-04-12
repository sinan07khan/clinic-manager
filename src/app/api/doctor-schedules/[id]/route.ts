import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/doctor-schedules/[id] - Get single schedule
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const schedule = await db.doctorSchedule.findUnique({
      where: { id },
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

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching doctor schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch doctor schedule' },
      { status: 500 }
    )
  }
}

// PUT /api/doctor-schedules/[id] - Update schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
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

    // Validate time format if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (startTime && !timeRegex.test(startTime)) {
      return NextResponse.json(
        { error: 'Invalid start time format. Use HH:mm format.' },
        { status: 400 }
      )
    }
    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid end time format. Use HH:mm format.' },
        { status: 400 }
      )
    }

    // Validate start < end if both provided
    if (startTime && endTime && startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Validate break times
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
    }

    const existing = await db.doctorSchedule.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // If dayOfWeek is being changed, check for unique constraint
    if (dayOfWeek !== undefined) {
      const newDayOfWeek = parseInt(dayOfWeek, 10)
      const conflicting = await db.doctorSchedule.findUnique({
        where: {
          staffId_dayOfWeek: {
            staffId: existing.staffId,
            dayOfWeek: newDayOfWeek,
          },
        },
      })
      if (conflicting && conflicting.id !== id) {
        return NextResponse.json(
          { error: 'A schedule already exists for this doctor on this day. Please edit the existing schedule.' },
          { status: 409 }
        )
      }
    }

    // Validate break times fall within working hours if both are provided
    const effectiveStart = startTime || existing.startTime
    const effectiveEnd = endTime || existing.endTime
    const effectiveBreakStart = breakStart !== undefined ? (breakStart || null) : existing.breakStart
    const effectiveBreakEnd = breakEnd !== undefined ? (breakEnd || null) : existing.breakEnd
    if (effectiveBreakStart && effectiveBreakEnd) {
      if (effectiveBreakStart < effectiveStart || effectiveBreakEnd > effectiveEnd) {
        return NextResponse.json(
          { error: 'Break time must fall within working hours' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (dayOfWeek !== undefined) updateData.dayOfWeek = parseInt(dayOfWeek, 10)
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (slotDuration !== undefined) updateData.slotDuration = parseInt(slotDuration, 10)
    if (maxPatients !== undefined) updateData.maxPatients = parseInt(maxPatients, 10)
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable
    if (breakStart !== undefined) updateData.breakStart = breakStart || null
    if (breakEnd !== undefined) updateData.breakEnd = breakEnd || null
    if (consultationFee !== undefined) updateData.consultationFee = parseFloat(consultationFee)
    if (notes !== undefined) updateData.notes = notes || null

    const schedule = await db.doctorSchedule.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error updating doctor schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update doctor schedule' },
      { status: 500 }
    )
  }
}

// DELETE /api/doctor-schedules/[id] - Delete schedule
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.doctorSchedule.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    await db.doctorSchedule.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Schedule deleted successfully' })
  } catch (error) {
    console.error('Error deleting doctor schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete doctor schedule' },
      { status: 500 }
    )
  }
}
