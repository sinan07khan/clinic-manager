import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await db.labReport.findUnique({
      where: { id },
      include: {
        patient: true,
        testType: true,
        technician: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        sample: true,
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Lab report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error fetching lab report:', error)
    return NextResponse.json({ error: 'Failed to fetch lab report' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, results, notes, technicianId, sampleId, reviewedBy } = body

    const existing = await db.labReport.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lab report not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (results !== undefined) updateData.results = typeof results === 'string' ? results : JSON.stringify(results)
    if (notes !== undefined) updateData.notes = notes
    if (technicianId !== undefined) updateData.technicianId = technicianId
    if (sampleId !== undefined) updateData.sampleId = sampleId
    if (reviewedBy !== undefined) updateData.reviewedBy = reviewedBy

    const report = await db.labReport.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, name: true, patientId: true } },
        testType: { select: { id: true, name: true, category: true } },
        technician: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        sample: { select: { id: true, sampleId: true } },
      },
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error updating lab report:', error)
    return NextResponse.json({ error: 'Failed to update lab report' }, { status: 500 })
  }
}
