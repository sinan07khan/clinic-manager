import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const module = searchParams.get('module')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (module && module !== 'ALL') where.module = module
    if (action && action !== 'ALL') where.action = action

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch audit logs'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
