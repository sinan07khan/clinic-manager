import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    let beds = await db.bed.findMany({
      orderBy: { bedNumber: 'asc' },
      include: {
        admissions: {
          where: { status: 'ACTIVE' },
          include: {
            patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true } },
          },
        },
      },
    })

    // Seed default floor plan beds if empty
    if (beds.length === 0) {
      await db.bed.createMany({
        data: [
          { bedNumber: 'DAY-101', ward: 'DAYCARE', type: 'DAYCARE', status: 'AVAILABLE', dailyRate: 1500 },
          { bedNumber: 'DAY-102', ward: 'DAYCARE', type: 'DAYCARE', status: 'AVAILABLE', dailyRate: 1500 },
          { bedNumber: 'DAY-103', ward: 'DAYCARE', type: 'DAYCARE', status: 'AVAILABLE', dailyRate: 1500 },
          { bedNumber: 'CAB-201', ward: 'CABIN_1', type: 'CABIN', status: 'AVAILABLE', dailyRate: 3500 },
          { bedNumber: 'CAB-202', ward: 'CABIN_2', type: 'CABIN', status: 'AVAILABLE', dailyRate: 3500 },
          { bedNumber: 'GEN-M01', ward: 'MALE_WARD', type: 'GENERAL', status: 'AVAILABLE', dailyRate: 800 },
          { bedNumber: 'GEN-M02', ward: 'MALE_WARD', type: 'GENERAL', status: 'AVAILABLE', dailyRate: 800 },
          { bedNumber: 'GEN-F01', ward: 'FEMALE_WARD', type: 'GENERAL', status: 'AVAILABLE', dailyRate: 800 },
          { bedNumber: 'ICU-01', ward: 'ICU', type: 'ICU', status: 'AVAILABLE', dailyRate: 7500 },
          { bedNumber: 'POST-01', ward: 'POST_OP', type: 'GENERAL', status: 'AVAILABLE', dailyRate: 2000 },
        ],
      })
      beds = await db.bed.findMany({
        orderBy: { bedNumber: 'asc' },
        include: {
          admissions: {
            where: { status: 'ACTIVE' },
            include: {
              patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true } },
            },
          },
        },
      })
    }

    return NextResponse.json(beds)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch beds'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, bedId, patientId, diagnosis, doctorNotes, newStatus } = body

    if (action === 'ADMIT') {
      if (!bedId || !patientId) {
        return NextResponse.json({ error: 'Bed ID and Patient ID are required' }, { status: 400 })
      }

      // Create admission
      const admission = await db.bedAdmission.create({
        data: {
          bedId,
          patientId,
          diagnosis: diagnosis || 'Under observation',
          doctorNotes: doctorNotes || null,
          status: 'ACTIVE',
        },
        include: {
          patient: { select: { name: true, patientId: true } },
          bed: { select: { bedNumber: true } },
        },
      })

      // Update bed status
      await db.bed.update({
        where: { id: bedId },
        data: {
          status: 'OCCUPIED',
          currentPatientId: patientId,
        },
      })

      await logAudit({
        action: 'ADMIT',
        module: 'BEDS',
        recordId: admission.id,
        details: `Admitted patient ${admission.patient.name} (${admission.patient.patientId}) to bed ${admission.bed.bedNumber}`,
      })

      return NextResponse.json(admission, { status: 201 })
    }

    if (action === 'DISCHARGE') {
      if (!bedId) {
        return NextResponse.json({ error: 'Bed ID is required' }, { status: 400 })
      }

      await db.bedAdmission.updateMany({
        where: { bedId, status: 'ACTIVE' },
        data: { status: 'DISCHARGED', dischargedAt: new Date() },
      })

      await db.bed.update({
        where: { id: bedId },
        data: { status: 'CLEANING', currentPatientId: null },
      })

      await logAudit({
        action: 'DISCHARGE',
        module: 'BEDS',
        recordId: bedId,
        details: `Discharged patient from bed ${bedId}. Status set to CLEANING`,
      })

      return NextResponse.json({ success: true, message: 'Bed discharged and marked for cleaning' })
    }

    if (action === 'UPDATE_STATUS') {
      if (!bedId || !newStatus) {
        return NextResponse.json({ error: 'Bed ID and new status required' }, { status: 400 })
      }

      const updated = await db.bed.update({
        where: { id: bedId },
        data: { status: newStatus },
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process bed request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

