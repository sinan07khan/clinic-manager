import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/payments - List payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (method) {
      where.method = method
    }
    if (startDate || endDate) {
      where.createdAt = {} as Record<string, unknown>
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              invoiceNo: true,
              patient: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
    ])

    // Calculate daily and monthly summaries
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const [dailyTotal, monthlyTotal] = await Promise.all([
      db.payment.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ])

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        dailyTotal: dailyTotal._sum.amount || 0,
        monthlyTotal: monthlyTotal._sum.amount || 0,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payments'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/payments - Create payment and update invoice status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, amount, method, reference } = body

    if (!invoiceId || !amount || !method) {
      return NextResponse.json(
        { error: 'Invoice ID, amount, and payment method are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      // Check invoice exists and is not cancelled
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true },
      })

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      if (invoice.status === 'CANCELLED') {
        throw new Error('Cannot record payment for a cancelled invoice')
      }

      // Check if payment amount exceeds remaining balance
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
      const remaining = invoice.netAmount - totalPaid

      if (amount > remaining + 0.01) {
        throw new Error(`Payment amount (৳${amount}) exceeds remaining balance (৳${remaining.toFixed(2)})`)
      }

      // Create payment
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          method,
          reference: reference || null,
        },
        include: {
          invoice: {
            select: {
              invoiceNo: true,
              patient: { select: { id: true, name: true } },
            },
          },
        },
      })

      // Recalculate total paid
      const newTotalPaid = totalPaid + amount
      let newStatus = invoice.status

      if (newTotalPaid >= invoice.netAmount) {
        newStatus = 'PAID'
      } else if (newTotalPaid > 0) {
        newStatus = 'PARTIALLY_PAID'
      }

      // Update invoice status
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      })

      return { ...payment, newStatus }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create payment'
    return NextResponse.json({ error: message }, { status: error instanceof Error && error.message.includes('exceeds') || error.message.includes('not found') || error.message.includes('cancelled') ? 400 : 500 })
  }
}
