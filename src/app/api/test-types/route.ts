import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const isActive = searchParams.get('isActive')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    if (category) {
      where.category = category
    }

    const testTypes = await db.testType.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(testTypes)
  } catch (error) {
    console.error('Error fetching test types:', error)
    return NextResponse.json({ error: 'Failed to fetch test types' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, category, price, description, isActive } = body

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
    }

    const testType = await db.testType.create({
      data: {
        name,
        category: category || null,
        price: parseFloat(price),
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(testType, { status: 201 })
  } catch (error) {
    console.error('Error creating test type:', error)
    return NextResponse.json({ error: 'Failed to create test type' }, { status: 500 })
  }
}
