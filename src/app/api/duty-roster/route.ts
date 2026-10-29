import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('weekStart')
    const weekEnd = searchParams.get('weekEnd')
    const staffId = searchParams.get('staffId')
    const role = searchParams.get('role')
    const date = searchParams.get('date')

    const where: Record<string, unknown> = {}

    if (weekStart && weekEnd) {
      where.date = {
        gte: new Date(weekStart),
        lte: new Date(weekEnd),
      }
    } else if (date) {
      const d = new Date(date)
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
      where.date = { gte: startOfDay, lte: endOfDay }
    }

    if (staffId) where.staffId = staffId
    if (role) where.staff = { role }

    const duties = await db.dutyRoster.findMany({
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
      orderBy: [{ date: 'asc' }, { shift: 'asc' }],
    })

    return NextResponse.json(duties)
  } catch (error: unknown) {
    console.error('Error fetching duty roster:', error)
    return NextResponse.json(
      { error: 'Failed to fetch duty roster' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staffId, date, shift, isOnCall, notes } = body

    if (!staffId || !date || !shift) {
      return NextResponse.json(
        { error: 'Staff ID, date, and shift are required' },
        { status: 400 }
      )
    }

    const staff = await db.staff.findUnique({ where: { id: staffId } })
    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Check if duty already assigned for this staff on this date
    const d = new Date(date)
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

    const existing = await db.dutyRoster.findFirst({
      where: {
        staffId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Duty already assigned for this staff on this date' },
        { status: 409 }
      )
    }

    const duty = await db.dutyRoster.create({
      data: {
        staffId,
        date: new Date(date),
        shift,
        isOnCall: isOnCall || false,
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

    return NextResponse.json(duty, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating duty assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create duty assignment' },
      { status: 500 }
    )
  }
}
