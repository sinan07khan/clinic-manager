import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, role, department, specialization } = body

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Name, email, phone, and password are required.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      )
    }

    // Check email uniqueness
    const existing = await db.staff.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    // Check if this is the very first user — if so, make them SUPER_ADMIN automatically
    const userCount = await db.staff.count()
    const assignedRole = userCount === 0 ? 'SUPER_ADMIN' : (role || 'RECEPTIONIST')

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create staff record
    const staff = await db.staff.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone.trim(),
        role: assignedRole,
        department: department || null,
        specialization: specialization || null,
        isActive: true,
      },
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
      },
    })

    // Log audit event
    await logAudit({
      userId: staff.id,
      userName: staff.name,
      userRole: staff.role,
      action: 'CREATE',
      module: 'HR',
      recordId: staff.id,
      details: `New user registered: ${staff.name} (${staff.role})`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json(
      { message: 'Account created successfully.', staff },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Signup error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create account'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

