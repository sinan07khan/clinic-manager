import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId

    const orders = await db.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        _count: { select: { items: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { supplierId, items, notes } = body

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Supplier and at least one item are required' }, { status: 400 })
    }

    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.purchaseOrder.create({
        data: {
          supplierId,
          status: 'PENDING',
          notes: notes || null,
          items: {
            create: items.map((item: { itemId: string; quantity: number; unitPrice: number }) => ({
              itemId: item.itemId,
              quantity: parseInt(String(item.quantity)),
              unitPrice: parseFloat(String(item.unitPrice)),
            })),
          },
        },
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              item: { select: { id: true, name: true, unit: true } },
            },
          },
        },
      })

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
}
