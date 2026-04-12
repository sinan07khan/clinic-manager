import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { category, description, amount, date, reference } = body

    const existing = await db.expense.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const expense = await db.expense.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(reference !== undefined && { reference: reference || null }),
      },
    })

    return NextResponse.json(expense)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update expense'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.expense.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await db.expense.delete({ where: { id } })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete expense'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
