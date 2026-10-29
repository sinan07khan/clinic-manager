import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { staffId, date, shift, isOnCall, notes } = body

    const existing = await db.dutyRoster.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Duty assignment not found' },
        { status: 404 }
      )
    }

    if (staffId) {
      const staff = await db.staff.findUnique({ where: { id: staffId } })
      if (!staff) {
        return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
      }
    }

    const duty = await db.dutyRoster.update({
      where: { id },
      data: {
        ...(staffId && { staffId }),
        ...(date && { date: new Date(date) }),
        ...(shift && { shift }),
        ...(isOnCall !== undefined && { isOnCall }),
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

    return NextResponse.json(duty)
  } catch (error: unknown) {
    console.error('Error updating duty assignment:', error)
    return NextResponse.json(
      { error: 'Failed to update duty assignment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.dutyRoster.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Duty assignment not found' },
        { status: 404 }
      )
    }

    await db.dutyRoster.delete({ where: { id } })

    return NextResponse.json({ message: 'Duty assignment removed' })
  } catch (error: unknown) {
    console.error('Error deleting duty assignment:', error)
    return NextResponse.json(
      { error: 'Failed to remove duty assignment' },
      { status: 500 }
    )
  }
}
