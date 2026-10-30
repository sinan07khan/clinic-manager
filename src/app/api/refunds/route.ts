import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    const refunds = await db.refundVoucher.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          include: {
            patient: { select: { name: true, patientId: true, phone: true } },
          },
        },
      },
    })

    return NextResponse.json(refunds)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch refunds'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, amount, reason, approvedBy } = body

    if (!invoiceId || !amount || !reason) {
      return NextResponse.json({ error: 'Invoice ID, amount, and reason are required' }, { status: 400 })
    }

    const voucherNo = `REF-${Date.now().toString().slice(-6)}`

    const refund = await db.refundVoucher.create({
      data: {
        invoiceId,
        voucherNo,
        amount: parseFloat(amount),
        reason,
        approvedBy: approvedBy || 'Clinic Manager',
      },
      include: {
        invoice: {
          include: { patient: { select: { name: true, patientId: true } } },
        },
      },
    })

    await logAudit({
      action: 'CREATE',
      module: 'BILLING',
      recordId: refund.id,
      details: `Issued refund voucher #${voucherNo} for BDT ${amount} on Invoice #${refund.invoice.invoiceNo} (${reason})`,
    })

    return NextResponse.json(refund, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to issue refund'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

