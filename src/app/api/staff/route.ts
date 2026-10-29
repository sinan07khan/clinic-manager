import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const department = searchParams.get('department')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (role) where.role = role
    if (department) where.department = department
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (search) {
      where.name = { contains: search }
    }

    const staff = await db.staff.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        specialization: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            attendance: true,
            salary: true,
            duties: true,
          },
        },
      },
    })

    return NextResponse.json(staff)
  } catch (error: unknown) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, role, department, specialization, isActive } = body

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      )
    }

    const existingStaff = await db.staff.findUnique({
      where: { email },
    })

    if (existingStaff) {
      return NextResponse.json(
        { error: 'A staff member with this email already exists' },
        { status: 409 }
      )
    }

    const staff = await db.staff.create({
      data: {
        name,
        email,
        phone,
        role: role || 'STAFF',
        department: department || null,
        specialization: specialization || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating staff:', error)
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    )
  }
}
