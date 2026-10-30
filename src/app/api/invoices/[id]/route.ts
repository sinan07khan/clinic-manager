import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices/[id] - Get single invoice with items and payments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, patientId: true, name: true, phone: true, email: true, address: true },
        },
        appointment: {
          select: { id: true, date: true, type: true, doctor: { select: { name: true } } },
        },
        items: true,
        payments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Calculate total paid
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({ ...invoice, totalPaid })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { discount, status, items } = body

    const existingInvoice = await db.invoice.findUnique({
      where: { id },
      include: { items: true, payments: true },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (existingInvoice.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot update a cancelled invoice' }, { status: 400 })
    }

    const invoice = await db.$transaction(async (tx) => {
      let totalAmount = existingInvoice.totalAmount

      // If items are being updated, recalculate
      if (items && items.length > 0) {
        // Delete existing items
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })

        totalAmount = items.reduce(
          (sum: number, item: { quantity: number; unitPrice: number }) =>
            sum + item.quantity * item.unitPrice,
          0
        )

        // Create new items
        await tx.invoiceItem.createMany({
          data: items.map((item: { description: string; category: string; quantity: number; unitPrice: number }) => ({
            invoiceId: id,
            description: item.description,
            category: item.category,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        })
      }

      const updateData: Record<string, unknown> = {}
      if (discount !== undefined) updateData.discount = discount
      updateData.totalAmount = totalAmount
      updateData.netAmount = totalAmount - (discount !== undefined ? discount : existingInvoice.discount)

      // Calculate total paid to determine status
      const totalPaid = existingInvoice.payments.reduce((sum, p) => sum + p.amount, 0)
      const netAmount = totalAmount - (discount !== undefined ? discount : existingInvoice.discount)

      if (!status) {
        if (totalPaid >= netAmount) {
          updateData.status = 'PAID'
        } else if (totalPaid > 0) {
          updateData.status = 'PARTIALLY_PAID'
        } else {
          updateData.status = 'PENDING'
        }
      } else {
        updateData.status = status
      }

      const updated = await tx.invoice.update({
        where: { id },
        data: updateData,
        include: {
          patient: { select: { id: true, name: true, phone: true } },
        },
      })

      return updated
    })

    return NextResponse.json(invoice)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/invoices/[id] - Cancel invoice
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await db.invoice.findUnique({ where: { id } })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Invoice is already cancelled' }, { status: 400 })
    }

    const cancelled = await db.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        patient: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(cancelled)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to cancel invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
