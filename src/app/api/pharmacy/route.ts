import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') // 'fefo', 'alerts', 'reorder', 'prescription-sync'
    const prescriptionId = searchParams.get('prescriptionId')

    // 1. Prescription to Cart Sync
    if (view === 'prescription-sync' && prescriptionId) {
      const rx = await db.prescription.findUnique({
        where: { id: prescriptionId },
        include: {
          patient: { select: { id: true, name: true, patientId: true, phone: true } },
          doctor: { select: { id: true, name: true } },
        },
      })

      if (!rx) {
        return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
      }

      let parsedMedicines: any[] = []
      try {
        parsedMedicines = rx.medicines ? JSON.parse(rx.medicines) : []
      } catch {
        parsedMedicines = []
      }

      // Match with inventory stock
      const inventory = await db.inventoryItem.findMany({
        where: { category: 'MEDICINE' },
        select: { id: true, name: true, quantity: true, unitPrice: true, batchNumber: true, expiryDate: true },
      })

      const matchedCart = parsedMedicines.map((med: any) => {
        const item = inventory.find((inv) =>
          inv.name.toLowerCase().includes((med.name || '').toLowerCase()) ||
          (med.name || '').toLowerCase().includes(inv.name.toLowerCase())
        )
        return {
          medicineName: med.name,
          dosage: med.dosage,
          duration: med.duration,
          matchedInventoryId: item?.id || null,
          availableStock: item?.quantity || 0,
          batchNumber: item?.batchNumber || 'BATCH-STD',
          unitPrice: item?.unitPrice || 15.0,
          quantityToDispense: 10,
        }
      })

      return NextResponse.json({
        prescription: rx,
        cart: matchedCart,
      })
    }

    // 2. FEFO Expiry Alerts (Expired, <30 days, <60 days, <90 days)
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    const allItems = await db.inventoryItem.findMany({
      orderBy: { expiryDate: 'asc' },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
      },
    })

    const expired = allItems.filter((i) => i.expiryDate && new Date(i.expiryDate) < now)
    const expiringIn30 = allItems.filter((i) => i.expiryDate && new Date(i.expiryDate) >= now && new Date(i.expiryDate) <= in30Days)
    const expiringIn60 = allItems.filter((i) => i.expiryDate && new Date(i.expiryDate) > in30Days && new Date(i.expiryDate) <= in60Days)
    const expiringIn90 = allItems.filter((i) => i.expiryDate && new Date(i.expiryDate) > in60Days && new Date(i.expiryDate) <= in90Days)
    const lowStock = allItems.filter((i) => i.quantity <= i.minStock)

    return NextResponse.json({
      summary: {
        totalItems: allItems.length,
        expiredCount: expired.length,
        expiringIn30Count: expiringIn30.length,
        expiringIn60Count: expiringIn60.length,
        expiringIn90Count: expiringIn90.length,
        lowStockCount: lowStock.length,
      },
      expired,
      expiringIn30,
      expiringIn60,
      expiringIn90,
      lowStock,
      items: allItems,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pharmacy data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Auto-generate Purchase Order draft from Low Stock items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'AUTO_GENERATE_PO') {
      const lowStockItems = await db.inventoryItem.findMany({
        where: {
          quantity: { lte: db.inventoryItem.fields ? undefined : 10 },
        },
        include: { supplier: true },
      })

      const filtered = lowStockItems.filter((i) => i.quantity <= i.minStock)

      if (filtered.length === 0) {
        return NextResponse.json({ message: 'No items currently below reorder threshold.' })
      }

      // Group by supplier
      const supplierId = filtered[0].supplierId || (await db.supplier.findFirst())?.id

      if (!supplierId) {
        return NextResponse.json({ error: 'No suppliers registered to generate PO' }, { status: 400 })
      }

      const po = await db.purchaseOrder.create({
        data: {
          supplierId,
          status: 'PENDING',
          notes: `Auto-generated Draft PO for ${filtered.length} low-stock item(s)`,
          items: {
            create: filtered.map((item) => ({
              itemId: item.id,
              quantity: Math.max(item.minStock * 2, 20),
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          items: { include: { item: true } },
          supplier: true,
        },
      })

      await logAudit({
        action: 'CREATE',
        module: 'PHARMACY',
        recordId: po.id,
        details: `Auto-generated low-stock Purchase Order for supplier ${po.supplier.name} (${filtered.length} items)`,
      })

      return NextResponse.json({ message: 'Auto PO generated successfully', po }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process pharmacy request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

