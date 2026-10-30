import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/patients/[id] - Get single patient with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const patient = await db.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            doctor: {
              select: { name: true, specialization: true, department: true },
            },
            prescription: true,
          },
          orderBy: { date: 'desc' },
        },
        prescriptions: {
          include: {
            doctor: {
              select: { name: true, specialization: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        labReports: {
          include: {
            testType: true,
            technician: { select: { name: true } },
            reviewer: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        vitals: {
          orderBy: { createdAt: 'desc' },
        },
        clinicalHistory: true,
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        bedAdmissions: {
          where: { status: 'ACTIVE' },
          include: { bed: true },
        },
      },
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    )
  }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const patient = await db.patient.findUnique({ where: { id } })
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

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

    const updatedPatient = await db.patient.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone && { phone }),
        ...(dateOfBirth !== undefined && {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }),
        ...(gender !== undefined && { gender: gender || null }),
        ...(bloodGroup !== undefined && { bloodGroup: bloodGroup || null }),
        ...(address !== undefined && { address: address || null }),
        ...(emergencyContact !== undefined && {
          emergencyContact: emergencyContact || null,
        }),
        ...(emergencyPhone !== undefined && {
          emergencyPhone: emergencyPhone || null,
        }),
      },
    })

    return NextResponse.json(updatedPatient)
  } catch (error) {
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    )
  }
}

// DELETE /api/patients/[id] - Delete patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const patient = await db.patient.findUnique({ where: { id } })
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    await db.patient.delete({ where: { id } })

    return NextResponse.json({ message: 'Patient deleted successfully' })
  } catch (error) {
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    )
  }
}
