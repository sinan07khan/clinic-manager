import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (lowStock === 'true') {
      where.quantity = { lt: db.inventoryItem.fields.minStock ? undefined : 0 }
    }
    if (search) {
      where.name = { contains: search }
    }

    let items
    if (lowStock === 'true') {
      // SQLite doesn't support column references in where directly, so filter in code
      const allItems = await db.inventoryItem.findMany({
        where: category ? { category } : search ? { name: { contains: search } } : {},
        include: {
          supplier: { select: { id: true, name: true } },
          _count: { select: { transactions: true, orderItems: true } },
        },
        orderBy: { name: 'asc' },
      })
      items = allItems.filter((item) => item.quantity < item.minStock)
    } else {
      items = await db.inventoryItem.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          _count: { select: { transactions: true, orderItems: true } },
        },
        orderBy: { name: 'asc' },
      })
    }

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, category, unit, quantity, minStock, unitPrice, supplierId, description, expiryDate } = body

    if (!name || !category || !unit) {
      return NextResponse.json({ error: 'Name, category, and unit are required' }, { status: 400 })
    }

    const item = await db.inventoryItem.create({
      data: {
        name,
        category,
        unit,
        quantity: parseInt(quantity) || 0,
        minStock: parseInt(minStock) || 10,
        unitPrice: parseFloat(unitPrice) || 0,
        supplierId: supplierId || null,
        description: description || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}
