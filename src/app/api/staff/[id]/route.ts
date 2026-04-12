import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const staff = await db.staff.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendance: true,
            salary: true,
            duties: true,
            appointments: true,
            prescriptions: true,
          },
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        salary: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 6,
        },
      },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    return NextResponse.json(staff)
  } catch (error: unknown) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff member' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, phone, role, department, specialization, isActive } = body

    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    if (email && email !== existing.email) {
      const emailExists = await db.staff.findUnique({ where: { email } })
      if (emailExists) {
        return NextResponse.json(
          { error: 'A staff member with this email already exists' },
          { status: 409 }
        )
      }
    }

    const staff = await db.staff.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
        ...(department !== undefined && { department: department || null }),
        ...(specialization !== undefined && { specialization: specialization || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(staff)
  } catch (error: unknown) {
    console.error('Error updating staff:', error)
    return NextResponse.json(
      { error: 'Failed to update staff member' },
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

    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const staff = await db.staff.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(staff)
  } catch (error: unknown) {
    console.error('Error deactivating staff:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate staff member' },
      { status: 500 }
    )
  }
}
