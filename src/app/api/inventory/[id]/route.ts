import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await db.inventoryItem.findUnique({
      where: { id },
      include: {
        supplier: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        orderItems: {
          include: {
            order: {
              include: {
                supplier: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory item' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, category, unit, quantity, minStock, unitPrice, supplierId, description, expiryDate } = body

    const existing = await db.inventoryItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (unit !== undefined) updateData.unit = unit
    if (quantity !== undefined) updateData.quantity = parseInt(quantity)
    if (minStock !== undefined) updateData.minStock = parseInt(minStock)
    if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice)
    if (supplierId !== undefined) updateData.supplierId = supplierId || null
    if (description !== undefined) updateData.description = description
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null

    const item = await db.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const hasTransactions = await db.stockTransaction.count({
      where: { itemId: id },
    })

    if (hasTransactions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete item with existing stock transactions' },
        { status: 400 }
      )
    }

    await db.inventoryItem.delete({ where: { id } })

    return NextResponse.json({ message: 'Inventory item deleted successfully' })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
