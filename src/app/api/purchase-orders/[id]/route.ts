import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await db.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            item: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, notes } = body

    const existing = await db.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) updateData.status = status

    // If status is changing to DELIVERED, auto-add stock transactions
    if (status === 'DELIVERED' && existing.status !== 'DELIVERED') {
      await db.$transaction(async (tx) => {
        // Update the PO status
        await tx.purchaseOrder.update({
          where: { id },
          data: updateData,
        })

        // Create stock transactions for each item
        for (const poItem of existing.items) {
          await tx.stockTransaction.create({
            data: {
              itemId: poItem.itemId,
              type: 'IN',
              quantity: poItem.quantity,
              reason: `Purchase Order Delivered - PO #${id.substring(0, 8)}`,
              reference: `PO-${id.substring(0, 8)}`,
            },
          })

          // Update item quantity
          await tx.inventoryItem.update({
            where: { id: poItem.itemId },
            data: {
              quantity: {
                increment: poItem.quantity,
              },
            },
          })
        }
      })

      // Return the updated order
      const updatedOrder = await db.purchaseOrder.findUnique({
        where: { id },
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          _count: { select: { items: true } },
          items: {
            include: {
              item: { select: { id: true, name: true, unit: true } },
            },
          },
        },
      })

      return NextResponse.json(updatedOrder)
    }

    const order = await db.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        _count: { select: { items: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, unit: true } },
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.purchaseOrder.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (existing.status === 'DELIVERED') {
      return NextResponse.json(
        { error: 'Cannot delete a delivered purchase order' },
        { status: 400 }
      )
    }

    await db.purchaseOrder.delete({ where: { id } })

    return NextResponse.json({ message: 'Purchase order deleted successfully' })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json({ error: 'Failed to delete purchase order' }, { status: 500 })
  }
}
