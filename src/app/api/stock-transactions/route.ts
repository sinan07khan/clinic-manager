import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const itemId = searchParams.get('itemId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = {}

    if (type) where.type = type
    if (itemId) where.itemId = itemId
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        ;(where.createdAt as Record<string, unknown>).lte = toDate
      }
    }

    const transactions = await db.stockTransaction.findMany({
      where,
      include: {
        item: { select: { id: true, name: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching stock transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch stock transactions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { itemId, type, quantity, reason, reference } = body

    if (!itemId || !type || !quantity) {
      return NextResponse.json({ error: 'Item, type, and quantity are required' }, { status: 400 })
    }

    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
      return NextResponse.json({ error: 'Type must be IN, OUT, or ADJUSTMENT' }, { status: 400 })
    }

    const parsedQuantity = parseInt(quantity)
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 })
    }

    // Update item quantity
    const item = await db.inventoryItem.findUnique({ where: { id: itemId } })
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    let newQuantity = item.quantity
    if (type === 'IN') {
      newQuantity += parsedQuantity
    } else if (type === 'OUT') {
      if (item.quantity < parsedQuantity) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
      }
      newQuantity -= parsedQuantity
    } else {
      // ADJUSTMENT: set to the given quantity
      newQuantity = parsedQuantity
    }

    const transaction = await db.$transaction(async (tx) => {
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity },
      })

      const txn = await tx.stockTransaction.create({
        data: {
          itemId,
          type,
          quantity: parsedQuantity,
          reason: reason || null,
          reference: reference || null,
        },
        include: {
          item: { select: { id: true, name: true, unit: true } },
        },
      })

      return txn
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating stock transaction:', error)
    return NextResponse.json({ error: 'Failed to create stock transaction' }, { status: 500 })
  }
}
