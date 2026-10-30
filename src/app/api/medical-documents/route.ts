import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    const where: any = {}
    if (patientId) where.patientId = patientId

    const documents = await db.medicalDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, name: true, patientId: true } },
      },
    })

    return NextResponse.json(documents)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch medical documents'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, title, category, fileUrl, fileType, notes, uploadedBy } = body

    if (!patientId || !title || !category || !fileUrl) {
      return NextResponse.json({ error: 'Patient ID, title, category, and file URL are required' }, { status: 400 })
    }

    const doc = await db.medicalDocument.create({
      data: {
        patientId,
        title,
        category,
        fileUrl,
        fileType: fileType || 'image/png',
        notes: notes || null,
        uploadedBy: uploadedBy || 'Staff',
      },
      include: {
        patient: { select: { name: true, patientId: true } },
      },
    })

    await logAudit({
      action: 'CREATE',
      module: 'EMR',
      recordId: doc.id,
      details: `Archived medical document (${category}): "${title}" for ${doc.patient.name}`,
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to archive document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    await db.medicalDocument.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete document'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

