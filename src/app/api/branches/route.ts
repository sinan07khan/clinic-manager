import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    let branches = await db.branch.findMany({
      orderBy: { name: 'asc' },
    })

    // Seed default branches if empty
    if (branches.length === 0) {
      await db.branch.createMany({
        data: [
          { name: 'Main Clinic - Central', code: 'BR-CENTRAL', address: '12 Medical Square, Dhaka', phone: '+880 1711 000001' },
          { name: 'North Diagnostics Center', code: 'BR-NORTH', address: '45 Health Avenue, Gulshan', phone: '+880 1711 000002' },
          { name: 'West Daycare & Surgery Wing', code: 'BR-WEST', address: '88 Care Road, Dhanmondi', phone: '+880 1711 000003' },
        ],
      })
      branches = await db.branch.findMany({ orderBy: { name: 'asc' } })
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
    const { name, code, address, phone } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 })
    }

    const branch = await db.branch.create({
      data: { name, code, address, phone },
    })

    await logAudit({
      action: 'CREATE',
      module: 'AUDIT',
      recordId: branch.id,
      details: `Created new clinic branch: ${name} (${code})`,
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create branch'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
