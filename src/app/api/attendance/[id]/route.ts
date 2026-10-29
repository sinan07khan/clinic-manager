import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { checkIn, checkOut, status, notes } = body

    const existing = await db.attendance.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    const attendance = await db.attendance.update({
      where: { id },
      data: {
        ...(checkIn !== undefined && { checkIn: checkIn ? new Date(checkIn) : null }),
        ...(checkOut !== undefined && { checkOut: checkOut ? new Date(checkOut) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null }),
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

    return NextResponse.json(attendance)
  } catch (error: unknown) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    )
  }
}
