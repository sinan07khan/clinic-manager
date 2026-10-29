import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')
    const staffId = searchParams.get('staffId')

    const where: Record<string, unknown> = {}

    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (status) where.status = status
    if (staffId) where.staffId = staffId

    const salaries = await db.salary.findMany({
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
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { staff: { name: 'asc' } }],
    })

    return NextResponse.json(salaries)
  } catch (error: unknown) {
    console.error('Error fetching salaries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salary records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, staffId } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    const m = parseInt(month)
    const y = parseInt(year)

    // Get all active staff
    const whereClause: Record<string, unknown> = { isActive: true }
    if (staffId) whereClause.id = staffId

    const activeStaff = await db.staff.findMany({
      where: whereClause,
      select: { id: true },
    })

    if (activeStaff.length === 0) {
      return NextResponse.json(
        { error: 'No active staff found' },
        { status: 400 }
      )
    }

    const results: Array<{ staffId: string; salary?: unknown; error?: string }> = []
    const createdSalaries: unknown[] = []

    for (const staff of activeStaff) {
      // Check if salary already exists
      const existing = await db.salary.findUnique({
        where: {
          staffId_month_year: {
            staffId: staff.id,
            month: m,
            year: y,
          },
        },
      })

      if (existing) {
        results.push({ staffId: staff.id, error: 'Salary already exists for this period' })
        continue
      }

      // Default base salary based on role
      const staffMember = await db.staff.findUnique({
        where: { id: staff.id },
        select: { role: true },
      })

      let baseSalary = 15000 // Default for STAFF
      if (staffMember) {
        switch (staffMember.role) {
          case 'DOCTOR': baseSalary = 80000; break
          case 'NURSE': baseSalary = 25000; break
          case 'LAB_TECHNICIAN': baseSalary = 30000; break
          case 'ADMIN': baseSalary = 35000; break
          case 'RECEPTIONIST': baseSalary = 18000; break
          case 'ACCOUNTANT': baseSalary = 40000; break
          case 'HR_MANAGER': baseSalary = 50000; break
          case 'INVENTORY_MANAGER': baseSalary = 30000; break
          case 'SUPER_ADMIN': baseSalary = 60000; break
          default: baseSalary = 15000; break
        }
      }

      const salary = await db.salary.create({
        data: {
          staffId: staff.id,
          month: m,
          year: y,
          baseSalary,
          deductions: 0,
          bonuses: 0,
          netSalary: baseSalary,
          status: 'PENDING',
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

      createdSalaries.push(salary)
      results.push({ staffId: staff.id, salary })
    }

    return NextResponse.json({
      message: `Payroll generated for ${createdSalaries.length} staff member(s)`,
      count: createdSalaries.length,
      salaries: createdSalaries,
      errors: results.filter((r) => r.error),
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error generating payroll:', error)
    return NextResponse.json(
      { error: 'Failed to generate payroll' },
      { status: 500 }
    )
  }
}
