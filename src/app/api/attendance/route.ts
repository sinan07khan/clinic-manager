import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}

    if (date) {
      const d = new Date(date)
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
      where.date = { gte: startOfDay, lte: endOfDay }
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (staffId) where.staffId = staffId
    if (status) where.status = status

    if (department) {
      where.staff = { department }
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { staff: { name: 'asc' } }],
    })

    return NextResponse.json(attendance)
  } catch (error: unknown) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staffId, date, checkIn, checkOut, status, notes } = body

    if (!staffId || !date) {
      return NextResponse.json(
        { error: 'Staff ID and date are required' },
        { status: 400 }
      )
    }

    const staff = await db.staff.findUnique({ where: { id: staffId } })
    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Check if attendance already exists for this staff on this date
    const d = new Date(date)
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

    const existing = await db.attendance.findFirst({
      where: {
        staffId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Attendance already recorded for this staff on this date' },
        { status: 409 }
      )
    }

    const attendance = await db.attendance.create({
      data: {
        staffId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status || 'PRESENT',
        notes: notes || null,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            department: true,
          },
        },
      },
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (error: unknown) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { error: 'Failed to record attendance' },
      { status: 500 }
    )
  }
}
