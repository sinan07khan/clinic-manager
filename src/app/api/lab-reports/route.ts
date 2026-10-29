import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const testTypeId = searchParams.get('testTypeId')
    const patientId = searchParams.get('patientId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }
    if (testTypeId) {
      where.testTypeId = testTypeId
    }
    if (patientId) {
      where.patientId = patientId
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        ;(where.createdAt as Record<string, unknown>).lte = toDate
      }
    }

    const reports = await db.labReport.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, patientId: true } },
        testType: { select: { id: true, name: true, category: true } },
        technician: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        sample: { select: { id: true, sampleId: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching lab reports:', error)
    return NextResponse.json({ error: 'Failed to fetch lab reports' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { patientId, testTypeId, technicianId, sampleId, notes } = body

    if (!patientId || !testTypeId) {
      return NextResponse.json({ error: 'Patient and test type are required' }, { status: 400 })
    }

    // Auto-generate reportNo
    const lastReport = await db.labReport.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { reportNo: true },
    })

    let nextNum = 1
    if (lastReport?.reportNo) {
      const match = lastReport.reportNo.match(/RPT-(\d+)/)
      if (match) {
        nextNum = parseInt(match[1], 10) + 1
      }
    }
    const reportNo = `RPT-${String(nextNum).padStart(4, '0')}`

    const report = await db.labReport.create({
      data: {
        reportNo,
        patientId,
        testTypeId,
        technicianId: technicianId || null,
        sampleId: sampleId || null,
        notes: notes || null,
        status: 'PENDING',
      },
      include: {
        patient: { select: { id: true, name: true, patientId: true } },
        testType: { select: { id: true, name: true, category: true } },
        technician: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating lab report:', error)
    return NextResponse.json({ error: 'Failed to create lab report' }, { status: 500 })
  }
}
