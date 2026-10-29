import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/patients - List patients with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const gender = searchParams.get('gender') || ''
    const bloodGroup = searchParams.get('bloodGroup') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { patientId: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (gender) {
      where.gender = gender
    }

    if (bloodGroup) {
      where.bloodGroup = bloodGroup
    }

    const [patients, total] = await Promise.all([
      db.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.patient.count({ where }),
    ])

    return NextResponse.json({
      patients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}

// POST /api/patients - Create new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      emergencyPhone,
    } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Auto-generate patientId: P-0001, P-0002, etc.
    const lastPatient = await db.patient.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { patientId: true },
    })

    let nextNum = 1
    if (lastPatient) {
      const lastNum = parseInt(lastPatient.patientId.replace('P-', ''), 10)
      nextNum = lastNum + 1
    }

    const patientId = `P-${String(nextNum).padStart(4, '0')}`

    const patient = await db.patient.create({
      data: {
        patientId,
        name,
        email: email || null,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        address: address || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}
