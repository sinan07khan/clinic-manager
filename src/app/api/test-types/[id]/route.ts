import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const testType = await db.testType.findUnique({
      where: { id },
      include: {
        _count: { select: { labReports: true } },
      },
    })

    if (!testType) {
      return NextResponse.json({ error: 'Test type not found' }, { status: 404 })
    }

    return NextResponse.json(testType)
  } catch (error) {
    console.error('Error fetching test type:', error)
    return NextResponse.json({ error: 'Failed to fetch test type' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, category, price, description, isActive } = body

    const testType = await db.testType.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(testType)
  } catch (error) {
    console.error('Error updating test type:', error)
    return NextResponse.json({ error: 'Failed to update test type' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const hasReports = await db.labReport.count({
      where: { testTypeId: id },
    })

    if (hasReports > 0) {
      return NextResponse.json(
        { error: 'Cannot delete test type with existing lab reports' },
        { status: 400 }
      )
    }

    await db.testType.delete({ where: { id } })

    return NextResponse.json({ message: 'Test type deleted successfully' })
  } catch (error) {
    console.error('Error deleting test type:', error)
    return NextResponse.json({ error: 'Failed to delete test type' }, { status: 500 })
  }
}
