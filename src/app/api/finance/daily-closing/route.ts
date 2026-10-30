import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    const closings = await db.dailyClosing.findMany({
      orderBy: { closingDate: 'desc' },
      take: 30,
    })

    // Calculate current shift collections for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayPayments = await db.payment.findMany({
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
    })

    const todayExpenses = await db.expense.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
      },
    })

    const cashCollected = todayPayments
      .filter((p) => p.method === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0)

    const cardCollected = todayPayments
      .filter((p) => p.method === 'CARD')
      .reduce((sum, p) => sum + p.amount, 0)

    const digitalCollected = todayPayments
      .filter((p) => ['BKASH', 'NAGAD', 'ROCKET'].includes(p.method))
      .reduce((sum, p) => sum + p.amount, 0)

    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0)
    const expectedCashInHand = Math.max(0, cashCollected - totalExpenses)

    return NextResponse.json({
      history: closings,
      liveToday: {
        cashCollected,
        cardCollected,
        digitalCollected,
        totalCollected: cashCollected + cardCollected + digitalCollected,
        totalExpenses,
        expectedCashInHand,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch daily closings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      closingDate,
      shift,
      cashCollected,
      cardCollected,
      digitalCollected,
      totalExpenses,
      expectedCashInHand,
      actualCashInHand,
      closedBy,
      notes,
    } = body

    const expected = parseFloat(expectedCashInHand) || 0
    const actual = parseFloat(actualCashInHand) || 0
    const discrepancy = parseFloat((actual - expected).toFixed(2))

    const closing = await db.dailyClosing.create({
      data: {
        closingDate: closingDate ? new Date(closingDate) : new Date(),
        shift: shift || 'FULL_DAY',
        cashCollected: parseFloat(cashCollected) || 0,
        cardCollected: parseFloat(cardCollected) || 0,
        digitalCollected: parseFloat(digitalCollected) || 0,
        totalExpenses: parseFloat(totalExpenses) || 0,
        expectedCashInHand: expected,
        actualCashInHand: actual,
        discrepancy,
        closedBy: closedBy || 'Front Desk Staff',
        notes: notes || null,
      },
    })

    await logAudit({
      action: 'CREATE',
      module: 'BILLING',
      recordId: closing.id,
      details: `Submitted Daily Cash Closing for ${shift || 'FULL_DAY'}. Expected: ${expected}, Actual: ${actual}, Discrepancy: ${discrepancy}`,
    })

    return NextResponse.json(closing, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit daily closing'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
