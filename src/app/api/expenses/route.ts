import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/expenses - List expenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}

    if (category) {
      where.category = category
    }
    if (startDate || endDate) {
      where.date = {} as Record<string, unknown>
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    // Calculate monthly summary by category
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const monthlyExpenses = await db.expense.findMany({
      where: {
        date: { gte: currentMonthStart, lte: currentMonthEnd },
      },
    })

    const categorySummary = monthlyExpenses.reduce(
      (acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = 0
        }
        acc[expense.category] += expense.amount
        return acc
      },
      {} as Record<string, number>
    )

    const totalMonthlyExpense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0)

    return NextResponse.json({
      expenses,
      monthlySummary: {
        categories: categorySummary,
        total: totalMonthlyExpense,
        month: now.getMonth(),
        year: now.getFullYear(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch expenses'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/expenses - Create expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, description, amount, date, reference } = body

    if (!category || !description || !amount || !date) {
      return NextResponse.json(
        { error: 'Category, description, amount, and date are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    const expense = await db.expense.create({
      data: {
        category,
        description,
        amount,
        date: new Date(date),
        reference: reference || null,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create expense'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
