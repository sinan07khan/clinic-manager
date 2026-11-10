import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    let branches = await db.branch.findMany({
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    })

    // Initialize a single clean starter branch if empty
    if (branches.length === 0) {
      await db.branch.create({
        data: {
          name: 'Main Clinic',
          code: 'MAIN',
          address: null,
          phone: null,
          isMain: true,
          isActive: true,
        },
      })
      branches = await db.branch.findMany({
        orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
      })
    }

    return NextResponse.json(branches)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch branches'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, address, phone, isMain } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 })
    }

    // If this branch is being set as main, unset the existing main
    if (isMain) {
      await db.branch.updateMany({
        where: { isMain: true },
        data: { isMain: false },
      })
    }

    const branch = await db.branch.create({
      data: { name, code, address: address || null, phone: phone || null, isMain: isMain ?? false },
    })

    await logAudit({
      action: 'CREATE',
      module: 'AUDIT',
      recordId: branch.id,
      details: `Created new clinic branch: ${name} (${code})${isMain ? ' [Main]' : ''}`,
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create branch'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, code, address, phone, isMain, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    // If setting as main, unset others first
    if (isMain) {
      await db.branch.updateMany({
        where: { isMain: true, id: { not: id } },
        data: { isMain: false },
      })
    }

    const branch = await db.branch.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(isMain !== undefined && { isMain }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    await logAudit({
      action: 'UPDATE',
      module: 'AUDIT',
      recordId: branch.id,
      details: `Updated clinic branch: ${branch.name} (${branch.code})`,
    })

    return NextResponse.json(branch)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update branch'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Branch ID is required' }, { status: 400 })
    }

    const branch = await db.branch.findUnique({ where: { id } })
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }
    if (branch.isMain) {
      return NextResponse.json({ error: 'Cannot delete the main branch' }, { status: 400 })
    }

    await db.branch.delete({ where: { id } })

    await logAudit({
      action: 'DELETE',
      module: 'AUDIT',
      recordId: id,
      details: `Deleted clinic branch: ${branch.name} (${branch.code})`,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete branch'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
