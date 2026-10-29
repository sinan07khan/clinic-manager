import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const patientId = searchParams.get('patientId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (patientId) where.patientId = patientId

    const samples = await db.sample.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, patientId: true } },
        collectedByStaff: { select: { id: true, name: true } },
        labReport: { select: { id: true, reportNo: true } },
      },
      orderBy: { collectedAt: 'desc' },
    })

    return NextResponse.json(samples)
  } catch (error) {
    console.error('Error fetching samples:', error)
    return NextResponse.json({ error: 'Failed to fetch samples' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { patientId, collectedBy, reportId } = body

    if (!patientId) {
      return NextResponse.json({ error: 'Patient is required' }, { status: 400 })
    }

    // Auto-generate sampleId
    const lastSample = await db.sample.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { sampleId: true },
    })

    let nextNum = 1
    if (lastSample?.sampleId) {
      const match = lastSample.sampleId.match(/SMP-(\d+)/)
      if (match) {
        nextNum = parseInt(match[1], 10) + 1
      }
    }
    const sampleId = `SMP-${String(nextNum).padStart(4, '0')}`

    const sample = await db.sample.create({
      data: {
        sampleId,
        patientId,
        collectedBy: collectedBy || null,
        reportId: reportId || null,
        status: 'COLLECTED',
      },
      include: {
        patient: { select: { id: true, name: true, patientId: true } },
        collectedByStaff: { select: { id: true, name: true } },
      },
    })

    // If reportId is provided, link the sample to the lab report
    if (reportId) {
      await db.labReport.update({
        where: { id: reportId },
        data: { sampleId: sample.id },
      })
    }

    return NextResponse.json(sample, { status: 201 })
  } catch (error) {
    console.error('Error creating sample:', error)
    return NextResponse.json({ error: 'Failed to create sample' }, { status: 500 })
  }
}
