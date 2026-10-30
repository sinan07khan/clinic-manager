import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    const where: any = {}
    if (patientId) where.patientId = patientId

    const logs = await db.notificationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(logs)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notification logs'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, recipient, channel, type, message } = body

    if (!recipient || !message) {
      return NextResponse.json({ error: 'Recipient and message are required' }, { status: 400 })
    }

    const log = await db.notificationLog.create({
      data: {
        patientId: patientId || null,
        recipient,
        channel: channel || 'SMS',
        type: type || 'REMINDER',
        message,
        status: 'DELIVERED',
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send notification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
