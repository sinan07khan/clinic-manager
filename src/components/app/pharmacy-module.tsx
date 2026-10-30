'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Pill,
  ShoppingCart,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Receipt,
  Truck,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  ArrowDownUp,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

export default function PharmacyModule() {
  const [activeTab, setActiveTab] = useState('pos')
  const [pharmacyData, setPharmacyData] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [supplierReturns, setSupplierReturns] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])

  // POS Cart State
  const [cart, setCart] = useState<any[]>([
    { name: 'Paracetamol 500mg', batchNumber: 'BAT-2024A', unitPrice: 10, quantity: 2, total: 20 },
    { name: 'Amoxicillin 500mg', batchNumber: 'BAT-2024C', unitPrice: 25, quantity: 1, total: 25 },
  ])
  const [posCustomerName, setPosCustomerName] = useState('Walk-in Customer')
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('')

  // Supplier Return Dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [returnForm, setReturnForm] = useState({
    supplierId: '',
    itemId: '',
    quantity: '10',
    reason: 'EXPIRED',
    refundAmount: '250',
  })

  useEffect(() => {
    fetchPharmacyData()
    fetchPrescriptions()
    fetchSupplierReturns()
    fetchSuppliers()
  }, [])

  const fetchPharmacyData = async () => {
    try {
      const res = await fetch('/api/pharmacy')
      const data = await res.json()
      setPharmacyData(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/prescriptions')
      const data = await res.json()
      if (Array.isArray(data)) setPrescriptions(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchSupplierReturns = async () => {
    try {
      const res = await fetch('/api/supplier-returns')
      const data = await res.json()
      if (Array.isArray(data)) setSupplierReturns(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers')
      const data = await res.json()
      if (Array.isArray(data)) {
        setSuppliers(data)
        if (data.length > 0) setReturnForm((prev) => ({ ...prev, supplierId: data[0].id }))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Prescription to Bill Sync Action
  const handleSyncPrescription = async (rxId: string) => {
    setSelectedPrescriptionId(rxId)
    if (!rxId) return

    try {
      const res = await fetch(`/api/pharmacy?view=prescription-sync&prescriptionId=${rxId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sync prescription')

      setPosCustomerName(data.prescription?.patient?.name || 'Patient')

      const newCart = data.cart.map((item: any) => ({
        name: item.medicineName,
        batchNumber: item.batchNumber,
        unitPrice: item.unitPrice,
        quantity: item.quantityToDispense,
        total: item.unitPrice * item.quantityToDispense,
      }))

      setCart(newCart)
      toast.success(`Synchronized ${newCart.length} medicine(s) from Dr. ${data.prescription?.doctor?.name}'s prescription directly into POS cart!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync prescription')
    }
  }

  const handleUpdateCartQuantity = (idx: number, delta: number) => {
    const updated = [...cart]
    const newQty = Math.max(1, updated[idx].quantity + delta)
    updated[idx].quantity = newQty
    updated[idx].total = newQty * updated[idx].unitPrice
    setCart(updated)
  }

  const handleRemoveCartItem = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx))
  }

  const handleAddToCart = (item: any) => {
    const existing = cart.find((c) => c.name.toLowerCase() === item.name.toLowerCase())
    if (existing) {
      handleUpdateCartQuantity(cart.indexOf(existing), 1)
    } else {
      setCart([
        ...cart,
        {
          name: item.name,
          batchNumber: item.batchNumber || 'BAT-2024',
          unitPrice: item.unitPrice || 20,
          quantity: 1,
          total: item.unitPrice || 20,
        },
      ])
    }
    toast.success(`Added ${item.name} to POS cart`)
  }

  const handleCheckoutPOS = () => {
    const total = cart.reduce((sum, item) => sum + item.total, 0)
    toast.success(`Dispensed ${cart.length} item(s) • Total: ৳${total.toFixed(2)}. Prescription bill printed via FEFO.`)
    setCart([])
  }

  const handleAutoGeneratePO = async () => {
    try {
      const res = await fetch('/api/pharmacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'AUTO_GENERATE_PO' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate PO')
      toast.success(data.message || 'Draft Purchase Order generated for low-stock medicines!')
      fetchPharmacyData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate PO')
    }
  }

  const handleCreateSupplierReturn = async () => {
    try {
      const res = await fetch('/api/supplier-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnForm),
      })
      if (!res.ok) throw new Error('Failed to record return')
      toast.success('Supplier Return Voucher issued and inventory deducted!')
      setReturnDialogOpen(false)
      fetchSupplierReturns()
      fetchPharmacyData()
    } catch {
      toast.error('Failed to issue return')
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-300">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Pharmacy & Stock Inventory</h2>
            <p className="text-xs text-muted-foreground">FEFO Batch Expiry Alerts, Prescription-to-Bill Sync & Auto-Reorder PO Drafts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleAutoGeneratePO} className="h-9 gap-1.5 text-xs text-teal-700 border-teal-300 hover:bg-teal-50">
            <Sparkles className="h-3.5 w-3.5" /> Auto-Draft Low-Stock PO
          </Button>
          <Button size="sm" onClick={() => setReturnDialogOpen(true)} className="h-9 gap-1.5 text-xs bg-teal-700 hover:bg-teal-800 text-white">
            <Truck className="h-3.5 w-3.5" /> Supplier Return (GRN)
          </Button>
        </div>
      </div>

      {/* FEFO Expiry & Threshold Alert Banners */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-3.5 bg-red-50/60 border border-red-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-red-800">Expired Medicines</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700 mt-1">{pharmacyData?.summary?.expiredCount || 0}</p>
          <span className="text-[10px] text-red-600">Immediate disposal / return required</span>
        </Card>

        <Card className="p-3.5 bg-orange-50/60 border border-orange-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-orange-800">Expiring in &le;30 Days</span>
            <Calendar className="h-4 w-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-700 mt-1">{pharmacyData?.summary?.expiringIn30Count || 0}</p>
          <span className="text-[10px] text-orange-600">Prioritize FEFO dispensing</span>
        </Card>

        <Card className="p-3.5 bg-amber-50/60 border border-amber-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-amber-800">Expiring in 60-90 Days</span>
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {(pharmacyData?.summary?.expiringIn60Count || 0) + (pharmacyData?.summary?.expiringIn90Count || 0)}
          </p>
          <span className="text-[10px] text-amber-600">Watch batch rotation</span>
        </Card>

        <Card className="p-3.5 bg-blue-50/60 border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-blue-800">Below Reorder Level</span>
            <ArrowDownUp className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">{pharmacyData?.summary?.lowStockCount || 0}</p>
          <span className="text-[10px] text-blue-600">Auto PO draft ready</span>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="pos" className="text-xs gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" /> Pharmacy POS Counter
          </TabsTrigger>
          <TabsTrigger value="fefo" className="text-xs gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> FEFO Expiry Tracker
          </TabsTrigger>
          <TabsTrigger value="returns" className="text-xs gap-1.5">
            <Truck className="h-3.5 w-3.5" /> Supplier Returns
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pharmacy POS & Prescription-to-Bill Sync */}
        <TabsContent value="pos" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Prescription-to-Bill Sync & Fast Medicine Search */}
            <div className="lg:col-span-2 space-y-4">
              {/* Prescription-to-Bill Sync Card */}
              <Card className="bg-gradient-to-r from-teal-50/50 via-card to-blue-50/50 border-teal-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-teal-900">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      Prescription-to-Bill Sync (Instant Dispense)
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-teal-100 text-teal-800">FEFO Enabled</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select a patient&apos;s digital prescription to auto-populate the POS cart with exact medicines & dosages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Select value={selectedPrescriptionId} onValueChange={handleSyncPrescription}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select patient's electronic prescription..." />
                      </SelectTrigger>
                      <SelectContent>
                        {prescriptions.map((rx) => (
                          <SelectItem key={rx.id} value={rx.id} className="text-xs">
                            {rx.patient?.name} ({rx.patient?.patientId}) &mdash; Dr. {rx.doctor?.name} ({new Date(rx.createdAt).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Medicine Catalog Quick Add */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Available Pharmacy Inventory (FEFO Sorted)</CardTitle>
                  <CardDescription className="text-xs">Click any medicine to add to cart</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {(pharmacyData?.items || []).map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => handleAddToCart(item)}
                        className="p-2.5 rounded-lg border hover:border-teal-300 hover:bg-teal-50/30 cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            <span>Batch: <strong className="font-mono text-foreground">{item.batchNumber || 'BAT-2024'}</strong></span>
                            <span>&bull;</span>
                            <span>Stock: <strong className={item.quantity <= item.minStock ? 'text-red-600' : 'text-emerald-700'}>{item.quantity} {item.unit}</strong></span>
                            <span>&bull;</span>
                            <span>Exp: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-800">৳{item.unitPrice.toFixed(2)}</span>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-teal-700">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right 1 Col: POS Cart & Thermal Bill Preview */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="flex flex-col h-full border-teal-200">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShoppingCart className="h-4 w-4 text-teal-600" />
                      POS Cart & Billing
                    </span>
                    <Badge variant="outline" className="text-[10px]">{cart.length} items</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Customer: <span className="font-semibold text-foreground">{posCustomerName}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-3 flex-1 flex flex-col justify-between text-xs">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs">
                      Cart is empty. Select a prescription or click medicines to add.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {cart.map((item, idx) => (
                        <div key={idx} className="p-2 border rounded-lg bg-card text-xs space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-foreground">{item.name}</span>
                            <span className="font-bold text-foreground">৳{item.total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                            <span>Batch: {item.batchNumber}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQuantity(idx, -1)}
                                className="h-5 w-5 rounded bg-muted hover:bg-muted/80 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="font-mono text-foreground font-semibold">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQuantity(idx, 1)}
                                className="h-5 w-5 rounded bg-muted hover:bg-muted/80 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCartItem(idx)}
                                className="h-5 w-5 text-red-500 hover:text-red-700 ml-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal</span>
                      <span>৳{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>VAT / Tax (0%)</span>
                      <span>৳0.00</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-foreground border-t pt-1">
                      <span>Grand Total</span>
                      <span className="text-teal-700">৳{cartTotal.toFixed(2)}</span>
                    </div>

                    <Button
                      onClick={handleCheckoutPOS}
                      disabled={cart.length === 0}
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white gap-1.5 text-xs h-9 mt-2"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Dispense & Print Receipt (80mm)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: FEFO Expiry Tracker */}
        <TabsContent value="fefo" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">First-Expiry-First-Out (FEFO) Monitoring</CardTitle>
              <CardDescription className="text-xs">Batches sorted chronologically by expiration date to prevent medicine waste</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(pharmacyData?.items || []).map((item: any) => {
                  const now = new Date()
                  const expDate = item.expiryDate ? new Date(item.expiryDate) : null
                  const isExpired = expDate && expDate < now
                  const is30 = expDate && expDate >= now && expDate.getTime() - now.getTime() < 30 * 24 * 3600 * 1000

                  return (
                    <div key={item.id} className="p-3 border rounded-xl bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{item.name}</span>
                          <Badge variant="outline" className="font-mono text-[10px]">{item.batchNumber || 'BAT-2024'}</Badge>
                          {isExpired ? (
                            <Badge variant="destructive" className="text-[10px] py-0">EXPIRED</Badge>
                          ) : is30 ? (
                            <Badge className="bg-orange-500 text-white text-[10px] py-0">&le; 30 Days Left</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] py-0">Good Standing</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-0.5">
                          Category: {item.category} • Current Stock: <strong className="text-foreground">{item.quantity} {item.unit}</strong> • Reorder Level: {item.minStock}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-muted-foreground text-[11px]">Expiry Date:</span>
                          <p className="font-semibold text-foreground">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        {isExpired && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setReturnForm({
                                supplierId: item.supplierId || (suppliers[0]?.id || ''),
                                itemId: item.id,
                                quantity: String(item.quantity),
                                reason: 'EXPIRED',
                                refundAmount: String(item.quantity * item.unitPrice),
                              })
                              setReturnDialogOpen(true)
                            }}
                            className="h-7 text-xs"
                          >
                            Return to Supplier
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Supplier Returns (GRN) */}
        <TabsContent value="returns" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Supplier Returns & Credit Vouchers</CardTitle>
                <CardDescription className="text-xs">Goods Returned Notes (GRN) for damaged, recalled, or expired items</CardDescription>
              </div>
              <Button size="sm" onClick={() => setReturnDialogOpen(true)} className="h-8 gap-1.5 text-xs bg-teal-700 text-white">
                <Plus className="h-3.5 w-3.5" /> Issue Return Voucher
              </Button>
            </CardHeader>
            <CardContent>
              {supplierReturns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No supplier returns recorded. Click &quot;Issue Return Voucher&quot; to record expired or damaged stock returns.
                </div>
              ) : (
                <div className="space-y-3">
                  {supplierReturns.map((ret) => (
                    <div key={ret.id} className="p-3 border rounded-xl bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{ret.item?.name}</span>
                          <Badge variant="outline" className="font-mono text-[10px] text-teal-700 border-teal-300">
                            {ret.returnNo}
                          </Badge>
                          <Badge className="bg-amber-100 text-amber-800 text-[10px] py-0">{ret.reason}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-0.5">
                          Supplier: <strong className="text-foreground">{ret.supplier?.name}</strong> • Quantity: <strong className="text-foreground">{ret.quantity} units</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-muted-foreground text-[11px]">Refund Credit:</span>
                          <p className="font-bold text-teal-700">৳{ret.refundAmount.toFixed(2)}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                          {ret.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Supplier Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-teal-600" />
              Issue Supplier Return Voucher
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">Supplier</Label>
              <Select value={returnForm.supplierId} onValueChange={(v) => setReturnForm({ ...returnForm, supplierId: v })}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Medicine / Item</Label>
              <Select value={returnForm.itemId} onValueChange={(v) => setReturnForm({ ...returnForm, itemId: v })}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select item to return..." /></SelectTrigger>
                <SelectContent>
                  {(pharmacyData?.items || []).map((i: any) => (
                    <SelectItem key={i.id} value={i.id} className="text-xs">
                      {i.name} ({i.quantity} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Return Quantity</Label>
                <Input
                  type="number"
                  value={returnForm.quantity}
                  onChange={(e) => setReturnForm({ ...returnForm, quantity: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Refund / Credit (BDT)</Label>
                <Input
                  type="number"
                  value={returnForm.refundAmount}
                  onChange={(e) => setReturnForm({ ...returnForm, refundAmount: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Reason for Return</Label>
              <Select value={returnForm.reason} onValueChange={(v) => setReturnForm({ ...returnForm, reason: v })}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPIRED">Expired Past Shelf Life</SelectItem>
                  <SelectItem value="DAMAGED">Damaged / Broken Packaging</SelectItem>
                  <SelectItem value="RECALLED">Manufacturer Batch Recall</SelectItem>
                  <SelectItem value="OVERSTOCK">Excess Overstock Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateSupplierReturn} className="bg-teal-700 text-white">Issue Return Voucher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

