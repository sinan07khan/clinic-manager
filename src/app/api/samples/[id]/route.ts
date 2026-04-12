import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sample = await db.sample.findUnique({
      where: { id },
      include: {
        patient: true,
        collectedByStaff: { select: { id: true, name: true } },
        labReport: {
          include: {
            testType: { select: { name: true } },
          },
        },
      },
    })

    if (!sample) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
    }

    return NextResponse.json(sample)
  } catch (error) {
    console.error('Error fetching sample:', error)
    return NextResponse.json({ error: 'Failed to fetch sample' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, reportId, collectedBy } = body

    const existing = await db.sample.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (reportId !== undefined) updateData.reportId = reportId
    if (collectedBy !== undefined) updateData.collectedBy = collectedBy

    // If linking to a report, also update the lab report's sampleId
    if (reportId !== undefined && reportId !== null && reportId !== '') {
      await db.labReport.update({
        where: { id: reportId as string },
        data: { sampleId: id },
      })
    }

    const sample = await db.sample.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, name: true, patientId: true } },
        collectedByStaff: { select: { id: true, name: true } },
        labReport: { select: { id: true, reportNo: true } },
      },
    })

    return NextResponse.json(sample)
  } catch (error) {
    console.error('Error updating sample:', error)
    return NextResponse.json({ error: 'Failed to update sample' }, { status: 500 })
  }
}
