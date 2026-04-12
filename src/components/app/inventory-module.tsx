"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Package, Plus, MoreVertical, Eye, Edit, Trash2, Search,
  AlertTriangle, ArrowUpCircle, ArrowDownCircle, RefreshCw,
  ShoppingCart, Truck, CheckCircle, XCircle, FileText,
  PackageOpen, ArrowRight, Filter, BarChart3, Store
} from "lucide-react"

// Types
interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  minStock: number
  unitPrice: number
  supplierId: string | null
  description: string | null
  expiryDate: string | null
  createdAt: string
  supplier: { id: string; name: string } | null
  _count?: { transactions: number; orderItems: number }
}

interface Supplier {
  id: string
  name: string
  contactPerson: string | null
  phone: string
  email: string | null
  address: string | null
  _count?: { items: number; purchaseOrders: number }
}

interface StockTransaction {
  id: string
  itemId: string
  type: string
  quantity: number
  reason: string | null
  reference: string | null
  createdAt: string
  item: { id: string; name: string; unit: string }
}

interface PurchaseOrder {
  id: string
  supplierId: string
  status: string
  notes: string | null
  createdAt: string
  supplier: { id: string; name: string; phone: string }
  _count?: { items: number }
  items: PurchaseOrderItem[]
}

interface PurchaseOrderItem {
  id: string
  orderId: string
  itemId: string
  quantity: number
  unitPrice: number
  item?: { id: string; name: string; unit: string }
}

const CATEGORIES = ["MEDICINE", "CHEMICAL", "SYRINGE", "CONSUMABLE", "EQUIPMENT", "OTHER"]
const UNITS = ["pcs", "box", "bottle", "pack", "vial", "tube", "set", "kit"]

function getPOStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    APPROVED: { label: "Approved", className: "bg-blue-100 text-blue-800 border-blue-200" },
    ORDERED: { label: "Ordered", className: "bg-orange-100 text-orange-800 border-orange-200" },
    DELIVERED: { label: "Delivered", className: "bg-green-100 text-green-800 border-green-200" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" },
  }
  const s = map[status] || { label: status, className: "" }
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>
}

function getCategoryBadge(category: string) {
  const colors: Record<string, string> = {
    MEDICINE: "bg-green-100 text-green-900 border-green-200",
    CHEMICAL: "bg-purple-100 text-purple-800 border-purple-200",
    SYRINGE: "bg-blue-100 text-blue-800 border-blue-200",
    CONSUMABLE: "bg-gray-100 text-gray-800 border-gray-200",
    EQUIPMENT: "bg-amber-100 text-amber-800 border-amber-200",
    OTHER: "bg-slate-100 text-slate-800 border-slate-200",
  }
  return <Badge variant="outline" className={colors[category] || ""}>{category}</Badge>
}

function StockLevelBar({ quantity, minStock }: { quantity: number; minStock: number }) {
  const percentage = Math.min((quantity / (minStock * 2)) * 100, 100)
  const isLow = quantity < minStock
  const isCritical = quantity === 0

  return (
    <div className="w-full">
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isCritical ? "bg-red-500" : isLow ? "bg-orange-400" : "bg-green-600"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className={`text-xs ${isCritical ? "text-red-600 font-bold" : isLow ? "text-orange-600 font-medium" : "text-green-700"}`}>
          {quantity} {isLow ? "(Low!)" : ""}
        </span>
        <span className="text-xs text-muted-foreground">Min: {minStock}</span>
      </div>
    </div>
  )
}

export default function InventoryModule() {
  const [activeTab, setActiveTab] = useState("stock-items")

  // Inventory Items state
  const queryClient = useQueryClient()
  const [itemFilter, setItemFilter] = useState({ category: "", lowStock: false, search: "" })
  const [supplierSearch, setSupplierSearch] = useState("")

  const { data: items = [] } = useQuery({
    queryKey: ["inventory", itemFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (itemFilter.category) params.set("category", itemFilter.category)
      if (itemFilter.lowStock) params.set("lowStock", "true")
      if (itemFilter.search) params.set("search", itemFilter.search)
      const res = await fetch(`/api/inventory?${params.toString()}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers", supplierSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (supplierSearch) params.set("search", supplierSearch)
      const res = await fetch(`/api/suppliers?${params.toString()}`)
      if (!res.ok) return []
      return res.json()
    },
  })
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [itemForm, setItemForm] = useState({
    name: "", category: "", unit: "", quantity: "", minStock: "",
    unitPrice: "", supplierId: "", description: "", expiryDate: "",
  })

  // Suppliers state

  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState({
    name: "", contactPerson: "", phone: "", email: "", address: "",
  })
  const [showSupplierDetail, setShowSupplierDetail] = useState<Supplier | null>(null)
  const [supplierDetailData, setSupplierDetailData] = useState<any>(null)

  // Stock Transactions state

  const [txnFilter, setTxnFilter] = useState({ type: "", itemId: "", dateFrom: "", dateTo: "" })
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [txnForm, setTxnForm] = useState({ itemId: "", type: "", quantity: "", reason: "", reference: "" })


  // Purchase Orders state
  const { data: transactions = [] } = useQuery({
    queryKey: ["stock-transactions", txnFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (txnFilter.type) params.set("type", txnFilter.type)
      if (txnFilter.itemId) params.set("itemId", txnFilter.itemId)
      if (txnFilter.dateFrom) params.set("dateFrom", txnFilter.dateFrom)
      if (txnFilter.dateTo) params.set("dateTo", txnFilter.dateTo)
      const res = await fetch(`/api/stock-transactions?${params.toString()}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  // Transaction summary
  const txnSummary = (() => {
    const totalIn = transactions.filter((t: StockTransaction) => t.type === "IN").reduce((sum: number, t: StockTransaction) => sum + t.quantity, 0)
    const totalOut = transactions.filter((t: StockTransaction) => t.type === "OUT").reduce((sum: number, t: StockTransaction) => sum + t.quantity, 0)
    return { totalIn, totalOut, netChange: totalIn - totalOut }
  })()

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await fetch("/api/purchase-orders")
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["inventory-low-stock"],
    queryFn: async () => {
      const res = await fetch("/api/inventory?lowStock=true")
      if (!res.ok) return []
      return res.json()
    },
  })
  const [showPODialog, setShowPODialog] = useState(false)
  const [poForm, setPoForm] = useState({ supplierId: "", notes: "", items: [] as { itemId: string; quantity: string; unitPrice: string }[] })

  // ---- Inventory Item CRUD ----
  const openItemDialog = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item)
      setItemForm({
        name: item.name,
        category: item.category,
        unit: item.unit,
        quantity: String(item.quantity),
        minStock: String(item.minStock),
        unitPrice: String(item.unitPrice),
        supplierId: item.supplierId || "",
        description: item.description || "",
        expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : "",
      })
    } else {
      setEditingItem(null)
      setItemForm({ name: "", category: "", unit: "", quantity: "0", minStock: "10", unitPrice: "", supplierId: "", description: "", expiryDate: "" })
    }
    setShowItemDialog(true)
  }

  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.category || !itemForm.unit) {
      toast.error("Name, category, and unit are required")
      return
    }
    try {
      const url = editingItem ? `/api/inventory/${editingItem.id}` : "/api/inventory"
      const method = editingItem ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(itemForm) })
      if (res.ok) {
        toast.success(editingItem ? "Item updated" : "Item created")
        setShowItemDialog(false)
        queryClient.invalidateQueries({ queryKey: ["inventory"] })
        queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save item")
      }
    } catch { toast.error("Failed to save item") }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Item deleted")
        queryClient.invalidateQueries({ queryKey: ["inventory"] })
        queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to delete")
      }
    } catch { toast.error("Failed to delete item") }
  }

  // ---- Supplier CRUD ----
  const openSupplierDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setSupplierForm({
        name: supplier.name,
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone,
        email: supplier.email || "",
        address: supplier.address || "",
      })
    } else {
      setEditingSupplier(null)
      setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", address: "" })
    }
    setShowSupplierDialog(true)
  }

  const handleSaveSupplier = async () => {
    if (!supplierForm.name || !supplierForm.phone) {
      toast.error("Name and phone are required")
      return
    }
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers"
      const method = editingSupplier ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(supplierForm) })
      if (res.ok) {
        toast.success(editingSupplier ? "Supplier updated" : "Supplier created")
        setShowSupplierDialog(false)
        queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      } else {
        toast.error("Failed to save supplier")
      }
    } catch { toast.error("Failed to save supplier") }
  }

  const handleDeleteSupplier = async (id: string) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Supplier deleted")
        queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to delete")
      }
    } catch { toast.error("Failed to delete supplier") }
  }

  const viewSupplierDetail = async (supplier: Supplier) => {
    setShowSupplierDetail(supplier)
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`)
      if (res.ok) setSupplierDetailData(await res.json())
    } catch { /* silent */ }
  }

  // ---- Stock Transaction ----
  const handleCreateTransaction = async () => {
    if (!txnForm.itemId || !txnForm.type || !txnForm.quantity) {
      toast.error("Item, type, and quantity are required")
      return
    }
    try {
      const res = await fetch("/api/stock-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txnForm),
      })
      if (res.ok) {
        toast.success("Transaction recorded")
        setShowTransactionDialog(false)
        setTxnForm({ itemId: "", type: "", quantity: "", reason: "", reference: "" })
        queryClient.invalidateQueries({ queryKey: ["stock-transactions"] })
        queryClient.invalidateQueries({ queryKey: ["inventory"] })
        queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to record transaction")
      }
    } catch { toast.error("Failed to record transaction") }
  }

  // ---- Purchase Order ----
  const openPODialog = (preselectedSupplierId?: string) => {
    setPoForm({ supplierId: preselectedSupplierId || "", notes: "", items: [{ itemId: "", quantity: "", unitPrice: "" }] })
    setShowPODialog(true)
  }

  const addPOItem = () => {
    setPoForm(f => ({ ...f, items: [...f.items, { itemId: "", quantity: "", unitPrice: "" }] }))
  }

  const removePOItem = (index: number) => {
    setPoForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  }

  const updatePOItem = (index: number, field: string, value: string) => {
    const updated = [...poForm.items]
    updated[index] = { ...updated[index], [field]: value }
    setPoForm(f => ({ ...f, items: updated }))
  }

  const handleCreatePO = async () => {
    if (!poForm.supplierId || poForm.items.length === 0 || poForm.items.every(i => !i.itemId)) {
      toast.error("Supplier and at least one item are required")
      return
    }
    const validItems = poForm.items.filter(i => i.itemId && i.quantity && i.unitPrice)
    if (validItems.length === 0) {
      toast.error("Please add at least one complete item")
      return
    }
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: poForm.supplierId,
          notes: poForm.notes,
          items: validItems,
        }),
      })
      if (res.ok) {
        toast.success("Purchase order created")
        setShowPODialog(false)
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })
      } else {
        toast.error("Failed to create purchase order")
      }
    } catch { toast.error("Failed to create purchase order") }
  }

  const handleUpdatePOStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`PO status updated to ${status}`)
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })
        queryClient.invalidateQueries({ queryKey: ["inventory"] })
        queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] })
        queryClient.invalidateQueries({ queryKey: ["stock-transactions"] })
      } else {
        toast.error("Failed to update PO status")
      }
    } catch { toast.error("Failed to update PO status") }
  }

  const handleDeletePO = async (id: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Purchase order deleted")
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to delete")
      }
    } catch { toast.error("Failed to delete PO") }
  }

  const poTotal = poForm.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice) || 0), 0)

  // Urgency sorting for alerts
  const sortedAlerts = [...lowStockItems].sort((a, b) => {
    const aRatio = a.minStock > 0 ? a.quantity / a.minStock : (a.quantity === 0 ? 0 : 1)
    const bRatio = b.minStock > 0 ? b.quantity / b.minStock : (b.quantity === 0 ? 0 : 1)
    return aRatio - bRatio
  })

  // Alert summary
  const alertCategoryCount: Record<string, number> = {}
  lowStockItems.forEach(item => {
    alertCategoryCount[item.category] = (alertCategoryCount[item.category] || 0) + 1
  })
  const mostCriticalCategory = Object.entries(alertCategoryCount).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-green-950">Inventory Management</h2>
        <p className="text-muted-foreground">Track stock levels, suppliers, and purchase orders</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-green-50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="stock-items" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">
            <Package className="size-4 mr-1" /> Stock Items
            {lowStockItems.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">{lowStockItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stock-alerts" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">
            <AlertTriangle className="size-4 mr-1" /> Stock Alerts
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">
            <Store className="size-4 mr-1" /> Suppliers
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">
            <ArrowRight className="size-4 mr-1" /> Transactions
          </TabsTrigger>
          <TabsTrigger value="purchase-orders" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">
            <ShoppingCart className="size-4 mr-1" /> Purchase Orders
          </TabsTrigger>
        </TabsList>

        {/* Stock Items Tab */}
        <TabsContent value="stock-items" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="size-5 text-green-700" /> Stock Items
                  </CardTitle>
                  <CardDescription>Manage inventory stock levels and item details</CardDescription>
                </div>
                <Button onClick={() => openItemDialog()} className="bg-green-700 hover:bg-green-800">
                  <Plus className="size-4 mr-2" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-8"
                    placeholder="Search items..."
                    value={itemFilter.search}
                    onChange={(e) => setItemFilter(f => ({ ...f, search: e.target.value }))}
                  />
                </div>
                <Select value={itemFilter.category} onValueChange={(v) => setItemFilter(f => ({ ...f, category: v === "ALL" ? "" : v }))}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemFilter.lowStock}
                    onChange={(e) => setItemFilter(f => ({ ...f, lowStock: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Low Stock Only</span>
                </label>
              </div>

              <div className="max-h-[500px] overflow-y-auto overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50/50">
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Category</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Unit</TableHead>
                      <TableHead className="min-w-[120px]">Stock Level</TableHead>
                      <TableHead className="whitespace-nowrap">Unit Price</TableHead>
                      <TableHead className="whitespace-nowrap hidden lg:table-cell">Supplier</TableHead>
                      <TableHead className="whitespace-nowrap hidden xl:table-cell">Expiry</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No inventory items found. Add your first item to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map(item => {
                        const isLow = item.quantity < item.minStock
                        return (
                          <TableRow key={item.id} className={isLow ? "bg-red-50/50" : ""}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">{getCategoryBadge(item.category)}</TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">{item.unit}</TableCell>
                            <TableCell>
                              <StockLevelBar quantity={item.quantity} minStock={item.minStock} />
                            </TableCell>
                            <TableCell className="font-mono">৳{item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-muted-foreground hidden lg:table-cell">{item.supplier?.name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground hidden xl:table-cell">
                              {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openItemDialog(item)}>
                                    <Edit className="size-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteItem(item.id)} className="text-red-600">
                                    <Trash2 className="size-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Alerts Tab */}
        <TabsContent value="stock-alerts" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-100 p-2">
                    <AlertTriangle className="size-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Alerts</p>
                    <p className="text-2xl font-bold text-red-700">{lowStockItems.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <PackageOpen className="size-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {lowStockItems.filter(i => i.quantity === 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <BarChart3 className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Most Critical Category</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {mostCriticalCategory ? mostCriticalCategory[0] : "None"}
                    </p>
                    {mostCriticalCategory && (
                      <p className="text-xs text-muted-foreground">{mostCriticalCategory[1]} items below stock</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-red-500" /> Low Stock Items
                  </CardTitle>
                  <CardDescription>Items below minimum stock level, sorted by urgency</CardDescription>
                </div>
                <Button onClick={() => openPODialog()} className="bg-red-600 hover:bg-red-700">
                  <ShoppingCart className="size-4 mr-2" /> Create Purchase Order
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortedAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="size-12 mx-auto mb-3 text-green-600" />
                  <p className="font-medium">All stock levels are healthy!</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-50/50">
                        <TableHead className="whitespace-nowrap">Priority</TableHead>
                        <TableHead className="whitespace-nowrap">Item Name</TableHead>
                        <TableHead className="whitespace-nowrap hidden sm:table-cell">Category</TableHead>
                        <TableHead className="whitespace-nowrap">Current Stock</TableHead>
                        <TableHead className="whitespace-nowrap hidden md:table-cell">Min Stock</TableHead>
                        <TableHead className="whitespace-nowrap hidden lg:table-cell">Supplier</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAlerts.map((item, idx) => (
                        <TableRow key={item.id} className={item.quantity === 0 ? "bg-red-100/50" : "bg-orange-50/50"}>
                          <TableCell>
                            <Badge variant={idx === 0 ? "destructive" : "secondary"} className="font-mono">
                              #{idx + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">{getCategoryBadge(item.category)}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${item.quantity === 0 ? "text-red-600" : "text-orange-600"}`}>
                              {item.quantity} {item.unit}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{item.minStock} {item.unit}</TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">{item.supplier?.name || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={() => openPODialog(item.supplierId || undefined)}>
                              <ShoppingCart className="size-3 mr-1" /> Order
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="size-5 text-green-700" /> Suppliers
                  </CardTitle>
                  <CardDescription>Manage supplier information and contacts</CardDescription>
                </div>
                <Button onClick={() => openSupplierDialog()} className="bg-green-700 hover:bg-green-800">
                  <Plus className="size-4 mr-2" /> Add Supplier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative w-[300px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    className="h-9 pl-8"
                    placeholder="Search suppliers..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50/50">
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Contact Person</TableHead>
                      <TableHead className="whitespace-nowrap">Phone</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Email</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Items Supplied</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No suppliers found. Add one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      suppliers.map(supplier => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">{supplier.contactPerson || "—"}</TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell">{supplier.email || "—"}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="secondary">{supplier._count?.items || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => viewSupplierDetail(supplier)}>
                                  <Eye className="size-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openSupplierDialog(supplier)}>
                                  <Edit className="size-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-600">
                                  <Trash2 className="size-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <ArrowUpCircle className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Stock In</p>
                    <p className="text-2xl font-bold text-green-700">{txnSummary.totalIn}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-100 p-2">
                    <ArrowDownCircle className="size-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Stock Out</p>
                    <p className="text-2xl font-bold text-red-700">{txnSummary.totalOut}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <RefreshCw className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Change</p>
                    <p className={`text-2xl font-bold ${txnSummary.netChange >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {txnSummary.netChange >= 0 ? "+" : ""}{txnSummary.netChange}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="size-5 text-green-700" /> Stock Transactions
                  </CardTitle>
                  <CardDescription>Record of all stock movements</CardDescription>
                </div>
                <Button onClick={() => setShowTransactionDialog(true)} className="bg-green-700 hover:bg-green-800">
                  <Plus className="size-4 mr-2" /> Record Transaction
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                <Select value={txnFilter.type} onValueChange={(v) => setTxnFilter(f => ({ ...f, type: v === "ALL" ? "" : v }))}>
                  <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="IN">Stock In</SelectItem>
                    <SelectItem value="OUT">Stock Out</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={txnFilter.itemId} onValueChange={(v) => setTxnFilter(f => ({ ...f, itemId: v === "ALL" ? "" : v }))}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Items</SelectItem>
                    {items.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">From:</Label>
                  <Input type="date" className="h-9 w-[140px]" value={txnFilter.dateFrom} onChange={(e) => setTxnFilter(f => ({ ...f, dateFrom: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">To:</Label>
                  <Input type="date" className="h-9 w-[140px]" value={txnFilter.dateTo} onChange={(e) => setTxnFilter(f => ({ ...f, dateTo: e.target.value }))} />
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50/50">
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Item</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">Quantity</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Reason</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No transactions recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map(txn => (
                        <TableRow key={txn.id}>
                          <TableCell className="text-muted-foreground">
                            {new Date(txn.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">{txn.item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              txn.type === "IN" ? "bg-green-100 text-green-800 border-green-200" :
                              txn.type === "OUT" ? "bg-red-100 text-red-800 border-red-200" :
                              "bg-blue-100 text-blue-800 border-blue-200"
                            }>
                              {txn.type === "IN" && <ArrowUpCircle className="size-3 mr-1" />}
                              {txn.type === "OUT" && <ArrowDownCircle className="size-3 mr-1" />}
                              {txn.type === "ADJUSTMENT" && <RefreshCw className="size-3 mr-1" />}
                              {txn.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-medium">{txn.quantity} {txn.item.unit}</TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate hidden sm:table-cell">{txn.reason || "—"}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-xs hidden md:table-cell">{txn.reference || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="purchase-orders" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="size-5 text-green-700" /> Purchase Orders
                  </CardTitle>
                  <CardDescription>Manage purchase orders and track deliveries</CardDescription>
                </div>
                <Button onClick={() => openPODialog()} className="bg-green-700 hover:bg-green-800">
                  <Plus className="size-4 mr-2" /> Create Purchase Order
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50/50">
                      <TableHead className="whitespace-nowrap">PO ID</TableHead>
                      <TableHead className="whitespace-nowrap">Supplier</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Items</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No purchase orders found. Create one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchaseOrders.map(po => (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono font-medium">PO-{po.id.substring(0, 8)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{po.supplier.name}</div>
                            <div className="text-xs text-muted-foreground">{po.supplier.phone}</div>
                          </TableCell>
                          <TableCell>{getPOStatusBadge(po.status)}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="secondary">{po.items?.length || po._count?.items || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">
                            {new Date(po.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {po.status === "PENDING" && (
                                  <DropdownMenuItem onClick={() => handleUpdatePOStatus(po.id, "APPROVED")}>
                                    <CheckCircle className="size-4 mr-2" /> Approve
                                  </DropdownMenuItem>
                                )}
                                {po.status === "APPROVED" && (
                                  <DropdownMenuItem onClick={() => handleUpdatePOStatus(po.id, "ORDERED")}>
                                    <ShoppingCart className="size-4 mr-2" /> Mark Ordered
                                  </DropdownMenuItem>
                                )}
                                {po.status === "ORDERED" && (
                                  <DropdownMenuItem onClick={() => handleUpdatePOStatus(po.id, "DELIVERED")}>
                                    <Truck className="size-4 mr-2" /> Mark Delivered
                                  </DropdownMenuItem>
                                )}
                                {(po.status === "PENDING" || po.status === "APPROVED") && (
                                  <DropdownMenuItem onClick={() => handleUpdatePOStatus(po.id, "CANCELLED")} className="text-red-600">
                                    <XCircle className="size-4 mr-2" /> Cancel
                                  </DropdownMenuItem>
                                )}
                                {!["DELIVERED"].includes(po.status) && (
                                  <DropdownMenuItem onClick={() => handleDeletePO(po.id)} className="text-red-600">
                                    <Trash2 className="size-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Inventory Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update inventory item details" : "Add a new item to inventory"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={itemForm.name} onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={itemForm.category} onValueChange={(v) => setItemForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit *</Label>
                <Select value={itemForm.unit} onValueChange={(v) => setItemForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={itemForm.quantity} onChange={(e) => setItemForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Min Stock Level</Label>
                <Input type="number" value={itemForm.minStock} onChange={(e) => setItemForm(f => ({ ...f, minStock: e.target.value }))} placeholder="10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Unit Price (৳)</Label>
              <Input type="number" step="0.01" value={itemForm.unitPrice} onChange={(e) => setItemForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={itemForm.supplierId} onValueChange={(v) => setItemForm(f => ({ ...f, supplierId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {suppliers.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={itemForm.description} onChange={(e) => setItemForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" value={itemForm.expiryDate} onChange={(e) => setItemForm(f => ({ ...f, expiryDate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} className="bg-green-700 hover:bg-green-800">
              {editingItem ? "Update" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
            <DialogDescription>
              {editingSupplier ? "Update supplier information" : "Add a new supplier"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={supplierForm.name} onChange={(e) => setSupplierForm(f => ({ ...f, name: e.target.value }))} placeholder="Supplier name" />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input value={supplierForm.contactPerson} onChange={(e) => setSupplierForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="Contact person name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={supplierForm.phone} onChange={(e) => setSupplierForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={supplierForm.address} onChange={(e) => setSupplierForm(f => ({ ...f, address: e.target.value }))} placeholder="Address" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupplierDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSupplier} className="bg-green-700 hover:bg-green-800">
              {editingSupplier ? "Update" : "Add Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Detail Dialog */}
      <Dialog open={!!showSupplierDetail} onOpenChange={() => { setShowSupplierDetail(null); setSupplierDetailData(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="size-5 text-green-700" />
              {showSupplierDetail?.name}
            </DialogTitle>
            <DialogDescription>Supplier details and linked items</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Contact Person:</span>{" "}
                  {showSupplierDetail?.contactPerson || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span> {showSupplierDetail?.phone}
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span> {showSupplierDetail?.email || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span> {showSupplierDetail?.address || "—"}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Supplied Items ({supplierDetailData?.items?.length || 0})</h4>
                {supplierDetailData?.items?.length > 0 ? (
                  <div className="space-y-1">
                    {supplierDetailData.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex gap-2 text-muted-foreground">
                          <span>{getCategoryBadge(item.category)}</span>
                          <span>Qty: {item.quantity} {item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No items linked to this supplier.</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Purchase Order History ({supplierDetailData?.purchaseOrders?.length || 0})</h4>
                {supplierDetailData?.purchaseOrders?.length > 0 ? (
                  <div className="space-y-1">
                    {supplierDetailData.purchaseOrders.map((order: any) => (
                      <div key={order.id} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                        <span className="font-mono">PO-{order.id.substring(0, 8)}</span>
                        <div className="flex gap-2 items-center">
                          {getPOStatusBadge(order.status)}
                          <span className="text-muted-foreground text-xs">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No purchase orders with this supplier.</p>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Record Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Stock Transaction</DialogTitle>
            <DialogDescription>Record a stock movement (in, out, or adjustment)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Item *</Label>
              <Select value={txnForm.itemId} onValueChange={(v) => setTxnForm(f => ({ ...f, itemId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.name} (Stock: {item.quantity})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={txnForm.type} onValueChange={(v) => setTxnForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">
                    <span className="flex items-center gap-2"><ArrowUpCircle className="size-4 text-green-500" /> Stock In</span>
                  </SelectItem>
                  <SelectItem value="OUT">
                    <span className="flex items-center gap-2"><ArrowDownCircle className="size-4 text-red-500" /> Stock Out</span>
                  </SelectItem>
                  <SelectItem value="ADJUSTMENT">
                    <span className="flex items-center gap-2"><RefreshCw className="size-4 text-blue-500" /> Adjustment</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input type="number" value={txnForm.quantity} onChange={(e) => setTxnForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" min="1" />
              {txnForm.type === "ADJUSTMENT" && (
                <p className="text-xs text-muted-foreground">For adjustments, this sets the new total quantity</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={txnForm.reason} onChange={(e) => setTxnForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for transaction" />
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input value={txnForm.reference} onChange={(e) => setTxnForm(f => ({ ...f, reference: e.target.value }))} placeholder="Optional reference number" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTransaction} className="bg-green-700 hover:bg-green-800">Record Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Purchase Order Dialog */}
      <Dialog open={showPODialog} onOpenChange={setShowPODialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Create a new purchase order for stock replenishment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={poForm.supplierId} onValueChange={(v) => setPoForm(f => ({ ...f, supplierId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items *</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addPOItem}>
                  <Plus className="size-3 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {poForm.items.map((poItem, idx) => (
                  <div key={idx} className="flex gap-2 items-end p-2 bg-muted/30 rounded-md">
                    <div className="flex-1">
                      <Label className="text-xs">Item</Label>
                      <Select value={poItem.itemId} onValueChange={(v) => updatePOItem(idx, "itemId", v)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {items.map(item => (
                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" className="h-8" value={poItem.quantity} onChange={(e) => updatePOItem(idx, "quantity", e.target.value)} placeholder="0" min="1" />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Price</Label>
                      <Input type="number" step="0.01" className="h-8" value={poItem.unitPrice} onChange={(e) => updatePOItem(idx, "unitPrice", e.target.value)} placeholder="0.00" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0" onClick={() => removePOItem(idx)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {poTotal > 0 && (
              <div className="flex justify-end p-2 bg-green-50 rounded-md">
                <span className="text-sm text-muted-foreground mr-2">Total:</span>
                <span className="font-bold text-green-800">৳{poTotal.toFixed(2)}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={poForm.notes} onChange={(e) => setPoForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPODialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePO} className="bg-green-700 hover:bg-green-800">Create PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
