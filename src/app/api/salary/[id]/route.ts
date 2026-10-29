import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const salary = await db.salary.findUnique({
      where: { id },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            department: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    if (!salary) {
      return NextResponse.json({ error: 'Salary record not found' }, { status: 404 })
    }

    return NextResponse.json(salary)
  } catch (error: unknown) {
    console.error('Error fetching salary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salary record' },
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
    const { baseSalary, deductions, bonuses, status, paidDate } = body

    const existing = await db.salary.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Salary record not found' }, { status: 404 })
    }

    const updatedBaseSalary = baseSalary !== undefined ? baseSalary : existing.baseSalary
    const updatedDeductions = deductions !== undefined ? deductions : existing.deductions
    const updatedBonuses = bonuses !== undefined ? bonuses : existing.bonuses
    const netSalary = updatedBaseSalary - updatedDeductions + updatedBonuses

    const salary = await db.salary.update({
      where: { id },
      data: {
        ...(baseSalary !== undefined && { baseSalary }),
        ...(deductions !== undefined && { deductions }),
        ...(bonuses !== undefined && { bonuses }),
        netSalary,
        ...(status !== undefined && { status }),
        ...(paidDate !== undefined && { paidDate: paidDate ? new Date(paidDate) : null }),
        ...(status === 'PAID' && !paidDate && { paidDate: new Date() }),
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

    return NextResponse.json(salary)
  } catch (error: unknown) {
    console.error('Error updating salary:', error)
    return NextResponse.json(
      { error: 'Failed to update salary record' },
      { status: 500 }
    )
  }
}
