import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    const returns = await db.supplierReturn.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        item: { select: { id: true, name: true, batchNumber: true, unitPrice: true } },
      },
    })

    return NextResponse.json(returns)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch supplier returns'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, itemId, quantity, reason, refundAmount } = body

    if (!supplierId || !itemId || !quantity) {
      return NextResponse.json({ error: 'Supplier ID, Item ID, and quantity are required' }, { status: 400 })
    }

    const returnNo = `RET-${Date.now().toString().slice(-6)}`

    const ret = await db.$transaction(async (tx) => {
      // 1. Create return voucher
      const newReturn = await tx.supplierReturn.create({
        data: {
          returnNo,
          supplierId,
          itemId,
          quantity: parseInt(quantity),
          reason: reason || 'EXPIRED',
          refundAmount: refundAmount ? parseFloat(refundAmount) : 0,
          status: 'APPROVED',
        },
        include: {
          supplier: true,
          item: true,
        },
      })

      // 2. Deduct returned inventory
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: { decrement: parseInt(quantity) },
        },
      })

      // 3. Log stock transaction
      await tx.stockTransaction.create({
        data: {
          itemId,
          type: 'OUT',
          quantity: parseInt(quantity),
          reason: `Supplier return #${returnNo} (${reason})`,
          reference: returnNo,
        },
      })

      return newReturn
    })

    await logAudit({
      action: 'CREATE',
      module: 'PHARMACY',
      recordId: ret.id,
      details: `Created supplier return #${returnNo} for ${ret.item.name} (${ret.quantity} units, Reason: ${ret.reason})`,
    })

    return NextResponse.json(ret, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to record supplier return'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

