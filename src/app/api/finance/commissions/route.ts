import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')

    const where: any = {}
    if (doctorId && doctorId !== 'ALL') where.doctorId = doctorId

    const commissions = await db.doctorCommission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const doctorIds = Array.from(new Set(commissions.map((c) => c.doctorId)))
    const doctors = await db.staff.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, name: true, specialization: true },
    })
    const docMap = new Map(doctors.map((d) => [d.id, d]))

    const enriched = commissions.map((c) => ({
      ...c,
      doctor: docMap.get(c.doctorId) || null,
    }))

    const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0)
    const pendingCommissions = commissions
      .filter((c) => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.commissionAmount, 0)
    const paidCommissions = commissions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + c.commissionAmount, 0)

    return NextResponse.json({
      summary: { totalCommissions, pendingCommissions, paidCommissions },
      commissions: enriched,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch commissions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { doctorId, patientName, consultationFee, commissionPercent } = body

    if (!doctorId || !consultationFee) {
      return NextResponse.json({ error: 'Doctor and Fee are required' }, { status: 400 })
    }

    const fee = parseFloat(consultationFee)
    const pct = parseFloat(commissionPercent) || 70 // default 70% doctor share
    const amount = parseFloat(((fee * pct) / 100).toFixed(2))

    const comm = await db.doctorCommission.create({
      data: {
        doctorId,
        patientName: patientName || 'Consultation Patient',
        consultationFee: fee,
        commissionPercent: pct,
        commissionAmount: amount,
        status: 'PENDING',
      },
    })

    return NextResponse.json(comm, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create commission'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Commission ID and status are required' }, { status: 400 })
    }

    const comm = await db.doctorCommission.update({
      where: { id },
      data: {
        status,
        paidDate: status === 'PAID' ? new Date() : null,
      },
    })

    await logAudit({
      action: 'UPDATE',
      module: 'BILLING',
      recordId: id,
      details: `Doctor commission payout marked as ${status} (BDT ${comm.commissionAmount})`,
    })

    return NextResponse.json(comm)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update commission'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

