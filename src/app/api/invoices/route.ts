import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }
    if (startDate || endDate) {
      where.createdAt = {} as Record<string, unknown>
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          patient: {
            select: { id: true, name: true, phone: true },
          },
          appointment: {
            select: { id: true, date: true, type: true },
          },
          payments: {
            select: { id: true, amount: true, method: true, createdAt: true },
          },
          refunds: {
            select: { id: true, amount: true, voucherNo: true, createdAt: true },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch invoices'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/invoices - Create invoice with items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      appointmentId,
      items,
      discount = 0,
      discountCode,
      vatPercent = 0,
      taxAmount = 0,
      copayAmount = 0,
      corporateTieUp,
      branchId,
      notes,
      initialPayments = [], // support split payments upfront [{ amount, method, reference }]
    } = body

    if (!patientId) {
      return NextResponse.json({ error: 'Patient is required' }, { status: 400 })
    }
    if (!items || !items.length) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    const totalAmount = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => {
      return sum + item.quantity * item.unitPrice
    }, 0)

    const finalTax = taxAmount || (vatPercent > 0 ? (totalAmount * vatPercent) / 100 : 0)
    const netAmount = Math.max(0, totalAmount + finalTax - discount - copayAmount)

    // Generate invoice number
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { invoiceNo: true },
    })

    let nextNum = 1
    if (lastInvoice?.invoiceNo) {
      const match = lastInvoice.invoiceNo.match(/INV-(\d+)/)
      if (match) {
        nextNum = parseInt(match[1]) + 1
      }
    }
    const invoiceNo = `INV-${String(nextNum).padStart(4, '0')}`

    const invoice = await db.$transaction(async (tx) => {
      const paidUpfront = initialPayments.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0)
      const invoiceStatus = paidUpfront >= netAmount ? 'PAID' : paidUpfront > 0 ? 'PARTIALLY_PAID' : 'PENDING'

      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNo,
          patientId,
          appointmentId: appointmentId || null,
          totalAmount,
          discount: parseFloat(discount) || 0,
          discountCode: discountCode || null,
          taxAmount: parseFloat(finalTax.toString()) || 0,
          vatPercent: parseFloat(vatPercent) || 0,
          copayAmount: parseFloat(copayAmount) || 0,
          corporateTieUp: corporateTieUp || null,
          netAmount,
          status: invoiceStatus,
          branchId: branchId || null,
          notes: notes || null,
        },
        include: {
          patient: {
            select: { id: true, name: true, phone: true },
          },
        },
      })

      // Add invoice items
      await tx.invoiceItem.createMany({
        data: items.map((item: { description: string; category: string; quantity: number; unitPrice: number }) => ({
          invoiceId: newInvoice.id,
          description: item.description,
          category: item.category || 'OTHER',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      })

      // Record split payments upfront if provided
      if (initialPayments && initialPayments.length > 0) {
        for (const p of initialPayments) {
          if (p.amount > 0) {
            await tx.payment.create({
              data: {
                invoiceId: newInvoice.id,
                amount: parseFloat(p.amount),
                method: p.method || 'CASH',
                reference: p.reference || null,
              },
            })
          }
        }
      }

      return newInvoice
    })

      return newInvoice
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
