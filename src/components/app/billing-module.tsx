"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  Printer,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Patient {
  id: string
  name: string
  phone: string
  email?: string
}

interface Appointment {
  id: string
  date: string
  type: string
  doctor?: { name: string }
}

interface InvoiceItem {
  id?: string
  description: string
  category: string
  quantity: number
  unitPrice: number
  total: number
}

interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: string
  reference: string | null
  createdAt: string
  invoice?: { invoiceNo: string; patient?: { name: string } }
}

interface Invoice {
  id: string
  invoiceNo: string
  patientId: string
  patient?: Patient
  appointmentId?: string | null
  appointment?: Appointment
  totalAmount: number
  discount: number
  netAmount: number
  status: string
  createdAt: string
  items?: InvoiceItem[]
  payments?: Payment[]
  totalPaid?: number
}

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  reference: string | null
  createdAt: string
}

interface LineItemForm {
  description: string
  category: string
  quantity: number
  unitPrice: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CURRENCY = (amount: number) => `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PAID: "bg-green-100 text-green-900 border-green-300",
  PARTIALLY_PAID: "bg-orange-100 text-orange-800 border-orange-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PARTIALLY_PAID: "Partially Paid",
  CANCELLED: "Cancelled",
}

const METHOD_COLORS: Record<string, string> = {
  CASH: "bg-green-100 text-green-800",
  CARD: "bg-blue-100 text-blue-800",
  BKASH: "bg-pink-100 text-pink-800",
  OTHER: "bg-gray-100 text-gray-800",
}

const CATEGORY_LABELS: Record<string, string> = {
  CONSULTATION: "Consultation",
  LAB_TEST: "Lab Test",
  MEDICINE: "Medicine",
  SALARY: "Salary",
  UTILITY: "Utility",
  MAINTENANCE: "Maintenance",
  SUPPLIES: "Supplies",
  OTHER: "Other",
}

const EXPENSE_COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(173, 80%, 40%)",
  "hsl(186, 72%, 45%)",
  "hsl(200, 60%, 50%)",
  "hsl(142, 70%, 45%)",
  "hsl(30, 80%, 55%)",
]

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "hsl(160, 84%, 39%)" },
  expenses: { label: "Expenses", color: "hsl(0, 84%, 60%)" },
  profit: { label: "Profit", color: "hsl(142, 70%, 45%)" },
}

const expenseBarConfig = {
  SALARY: { label: "Salary", color: EXPENSE_COLORS[0] },
  UTILITY: { label: "Utility", color: EXPENSE_COLORS[1] },
  MAINTENANCE: { label: "Maintenance", color: EXPENSE_COLORS[2] },
  SUPPLIES: { label: "Supplies", color: EXPENSE_COLORS[3] },
  OTHER: { label: "Other", color: EXPENSE_COLORS[4] },
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BillingModule() {
  // ─── Invoice Tab State ───
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1)
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("ALL")
  const [invoiceLoading, setInvoiceLoading] = useState(true)

  // Create Invoice Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createPatients, setCreatePatients] = useState<Patient[]>([])
  const [createAppointments, setCreateAppointments] = useState<Appointment[]>([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState("")
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { description: "", category: "CONSULTATION", quantity: 1, unitPrice: 0 },
  ])
  const [discount, setDiscount] = useState(0)
  const [creating, setCreating] = useState(false)
  const [patientSearch, setPatientSearch] = useState("")

  // Invoice Detail Dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Record Payment Dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [paymentReference, setPaymentReference] = useState("")
  const [recordingPayment, setRecordingPayment] = useState(false)

  // Cancel Invoice Dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // ─── Payments Tab State ───
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentPage, setPaymentPage] = useState(1)
  const [paymentTotalPages, setPaymentTotalPages] = useState(1)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL")
  const [paymentDateStart, setPaymentDateStart] = useState("")
  const [paymentDateEnd, setPaymentDateEnd] = useState("")
  const [paymentLoading, setPaymentLoading] = useState(true)
  const [paymentSummary, setPaymentSummary] = useState({ dailyTotal: 0, monthlyTotal: 0 })

  // ─── Expenses Tab State ───
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseLoading, setExpenseLoading] = useState(true)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editExpenseDialogOpen, setEditExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseCategory, setExpenseCategory] = useState("SALARY")
  const [expenseDescription, setExpenseDescription] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [expenseReference, setExpenseReference] = useState("")
  const [deleteExpenseDialogOpen, setDeleteExpenseDialogOpen] = useState(false)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [savingExpense, setSavingExpense] = useState(false)
  const [monthlyExpenseSummary, setMonthlyExpenseSummary] = useState<Record<string, number>>({})

  // ─── Financial Summary State ───
  const [financialData, setFinancialData] = useState({
    currentMonthRevenue: 0,
    currentMonthExpenses: 0,
    currentMonthProfit: 0,
    lastMonthRevenue: 0,
    lastMonthExpenses: 0,
    lastMonthProfit: 0,
    trendData: [] as { month: string; revenue: number; expenses: number; profit: number }[],
  })
  const [financialLoading, setFinancialLoading] = useState(true)

  // ─── Data Fetching ───

  const fetchInvoices = useCallback(async () => {
    setInvoiceLoading(true)
    try {
      const params = new URLSearchParams({ page: String(invoicePage), limit: "10" })
      if (invoiceStatusFilter !== "ALL") params.set("status", invoiceStatusFilter)
      const res = await fetch(`/api/invoices?${params}`)
      const data = await res.json()
      if (res.ok) {
        setInvoices(data.invoices)
        setInvoiceTotalPages(data.pagination.totalPages)
      }
    } catch {
      toast.error("Failed to load invoices")
    } finally {
      setInvoiceLoading(false)
    }
  }, [invoicePage, invoiceStatusFilter])

  const fetchPayments = useCallback(async () => {
    setPaymentLoading(true)
    try {
      const params = new URLSearchParams({ page: String(paymentPage), limit: "10" })
      if (paymentMethodFilter !== "ALL") params.set("method", paymentMethodFilter)
      if (paymentDateStart) params.set("startDate", paymentDateStart)
      if (paymentDateEnd) params.set("endDate", paymentDateEnd)
      const res = await fetch(`/api/payments?${params}`)
      const data = await res.json()
      if (res.ok) {
        setPayments(data.payments)
        setPaymentTotalPages(data.pagination.totalPages)
        setPaymentSummary(data.summary)
      }
    } catch {
      toast.error("Failed to load payments")
    } finally {
      setPaymentLoading(false)
    }
  }, [paymentPage, paymentMethodFilter, paymentDateStart, paymentDateEnd])

  const fetchExpenses = useCallback(async () => {
    setExpenseLoading(true)
    try {
      const res = await fetch("/api/expenses")
      const data = await res.json()
      if (res.ok) {
        setExpenses(data.expenses)
        setMonthlyExpenseSummary(data.monthlySummary?.categories || {})
      }
    } catch {
      toast.error("Failed to load expenses")
    } finally {
      setExpenseLoading(false)
    }
  }, [])

  const fetchFinancialSummary = useCallback(async () => {
    setFinancialLoading(true)
    try {
      // Fetch all invoices to compute revenue
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

      const [invoicesRes, expensesRes] = await Promise.all([
        fetch("/api/invoices?limit=1000"),
        fetch("/api/expenses"),
      ])

      const invoicesData = invoicesRes.ok ? await invoicesRes.json() : { invoices: [] }
      const expensesData = expensesRes.ok ? await expensesRes.json() : { expenses: [] }

      const allInvoices = invoicesData.invoices || []
      const allExpenses = expensesData.expenses || []

      // Calculate current month revenue (from paid/partially paid invoices created this month)
      const currentMonthInvoices = allInvoices.filter(
        (inv: Invoice) => new Date(inv.createdAt) >= currentMonthStart && inv.status !== "CANCELLED"
      )
      const currentMonthRevenue = currentMonthInvoices.reduce((sum: number, inv: Invoice) => sum + inv.netAmount, 0)

      // Calculate current month expenses
      const currentMonthExpenses = allExpenses.filter(
        (exp: Expense) => new Date(exp.date) >= currentMonthStart
      )
      const currentMonthExp = currentMonthExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0)

      // Calculate last month revenue
      const lastMonthInvoices = allInvoices.filter(
        (inv: Invoice) => {
          const d = new Date(inv.createdAt)
          return d >= lastMonthStart && d <= lastMonthEnd && inv.status !== "CANCELLED"
        }
      )
      const lastMonthRevenue = lastMonthInvoices.reduce((sum: number, inv: Invoice) => sum + inv.netAmount, 0)

      // Calculate last month expenses
      const lastMonthExpenses = allExpenses.filter(
        (exp: Expense) => {
          const d = new Date(exp.date)
          return d >= lastMonthStart && d <= lastMonthEnd
        }
      )
      const lastMonthExp = lastMonthExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0)

      // Trend data - last 6 months
      const trendData: { month: string; revenue: number; expenses: number; profit: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
        const monthLabel = format(monthStart, "MMM yyyy")

        const monthInvoices = allInvoices.filter(
          (inv: Invoice) => {
            const d = new Date(inv.createdAt)
            return d >= monthStart && d <= monthEnd && inv.status !== "CANCELLED"
          }
        )
        const revenue = monthInvoices.reduce((sum: number, inv: Invoice) => sum + inv.netAmount, 0)

        const monthExpenses = allExpenses.filter(
          (exp: Expense) => {
            const d = new Date(exp.date)
            return d >= monthStart && d <= monthEnd
          }
        )
        const expenses = monthExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0)

        trendData.push({ month: monthLabel, revenue, expenses, profit: revenue - expenses })
      }

      setFinancialData({
        currentMonthRevenue,
        currentMonthExpenses: currentMonthExp,
        currentMonthProfit: currentMonthRevenue - currentMonthExp,
        lastMonthRevenue,
        lastMonthExpenses: lastMonthExp,
        lastMonthProfit: lastMonthRevenue - lastMonthExp,
        trendData,
      })
    } catch {
      toast.error("Failed to load financial summary")
    } finally {
      setFinancialLoading(false)
    }
  }, [])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])
  useEffect(() => { fetchPayments() }, [fetchPayments])
  useEffect(() => { fetchExpenses() }, [fetchExpenses])
  useEffect(() => { fetchFinancialSummary() }, [fetchFinancialSummary])

  // ─── Patient Search for Create Invoice ───

  const searchPatients = useCallback(async (query: string) => {
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setCreatePatients(data.patients || [])
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (patientSearch.length >= 1) {
      const timer = setTimeout(() => searchPatients(patientSearch), 300)
      return () => clearTimeout(timer)
    } else {
      searchPatients("")
    }
  }, [patientSearch, searchPatients])

  // Fetch appointments for selected patient
  useEffect(() => {
    if (selectedPatient) {
      fetch(`/api/appointments?patientId=${selectedPatient}&status=COMPLETED&limit=20`)
        .then((res) => res.ok ? res.json() : { appointments: [] })
        .then((data) => setCreateAppointments(data.appointments || []))
        .catch(() => setCreateAppointments([]))
    }
  }, [selectedPatient])

  // ─── Create Invoice Handlers ───

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", category: "CONSULTATION", quantity: 1, unitPrice: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: keyof LineItemForm, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const netAmount = totalAmount - discount

  const handleCreateInvoice = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient")
      return
    }
    const validItems = lineItems.filter((item) => item.description && item.unitPrice > 0)
    if (!validItems.length) {
      toast.error("Please add at least one valid item")
      return
    }
    if (discount > totalAmount) {
      toast.error("Discount cannot exceed total amount")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient,
          appointmentId: selectedAppointment || undefined,
          items: validItems,
          discount,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Invoice created successfully", { icon: <CheckCircle2 className="text-green-600" /> })
        setCreateDialogOpen(false)
        resetCreateForm()
        fetchInvoices()
      } else {
        toast.error(data.error || "Failed to create invoice")
      }
    } catch {
      toast.error("Failed to create invoice")
    } finally {
      setCreating(false)
    }
  }

  const resetCreateForm = () => {
    setSelectedPatient("")
    setSelectedAppointment("")
    setLineItems([{ description: "", category: "CONSULTATION", quantity: 1, unitPrice: 0 }])
    setDiscount(0)
    setPatientSearch("")
  }

  // ─── Invoice Detail Handlers ───

  const openInvoiceDetail = async (invoice: Invoice) => {
    setDetailLoading(true)
    setDetailDialogOpen(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`)
      const data = await res.json()
      if (res.ok) {
        setSelectedInvoice({ ...data, payments: data.payments ?? [], items: data.items ?? [] })
      } else {
        toast.error("Failed to load invoice details")
      }
    } catch {
      toast.error("Failed to load invoice details")
    } finally {
      setDetailLoading(false)
    }
  }

  // ─── Record Payment Handlers ───

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    const remaining = (invoice.netAmount - (invoice.totalPaid || 0)).toFixed(2)
    setPaymentAmount(remaining > 0 ? remaining : "")
    setPaymentMethod("CASH")
    setPaymentReference("")
    setPaymentDialogOpen(true)
  }

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return
    const amt = parseFloat(paymentAmount)
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    setRecordingPayment(true)
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: amt,
          method: paymentMethod,
          reference: paymentReference || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Payment recorded successfully", { icon: <CheckCircle2 className="text-green-600" /> })
        setPaymentDialogOpen(false)
        // Refresh detail
        const detailRes = await fetch(`/api/invoices/${selectedInvoice.id}`)
        if (detailRes.ok) { const detailData = await detailRes.json(); setSelectedInvoice({ ...detailData, payments: detailData.payments ?? [], items: detailData.items ?? [] }) }
        fetchInvoices()
        fetchPayments()
      } else {
        toast.error(data.error || "Failed to record payment")
      }
    } catch {
      toast.error("Failed to record payment")
    } finally {
      setRecordingPayment(false)
    }
  }

  // ─── Cancel Invoice Handlers ───

  const handleCancelInvoice = async () => {
    if (!selectedInvoice) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Invoice cancelled successfully", { icon: <CheckCircle2 className="text-green-600" /> })
        setCancelDialogOpen(false)
        setDetailDialogOpen(false)
        setSelectedInvoice(null)
        fetchInvoices()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to cancel invoice")
      }
    } catch {
      toast.error("Failed to cancel invoice")
    } finally {
      setCancelling(false)
    }
  }

  // ─── Expense Handlers ───

  const handleCreateExpense = async () => {
    if (!expenseDescription || !expenseAmount || !expenseDate) {
      toast.error("Please fill in all required fields")
      return
    }
    setSavingExpense(true)
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: expenseCategory,
          description: expenseDescription,
          amount: parseFloat(expenseAmount),
          date: expenseDate,
          reference: expenseReference || undefined,
        }),
      })
      if (res.ok) {
        toast.success("Expense added successfully", { icon: <CheckCircle2 className="text-green-600" /> })
        setExpenseDialogOpen(false)
        resetExpenseForm()
        fetchExpenses()
        fetchFinancialSummary()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to add expense")
      }
    } catch {
      toast.error("Failed to add expense")
    } finally {
      setSavingExpense(false)
    }
  }

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseCategory(expense.category)
    setExpenseDescription(expense.description)
    setExpenseAmount(String(expense.amount))
    setExpenseDate(format(new Date(expense.date), "yyyy-MM-dd"))
    setExpenseReference(expense.reference || "")
    setEditExpenseDialogOpen(true)
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense) return
    setSavingExpense(true)
    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: expenseCategory,
          description: expenseDescription,
          amount: parseFloat(expenseAmount),
          date: expenseDate,
          reference: expenseReference || null,
        }),
      })
      if (res.ok) {
        toast.success("Expense updated successfully", { icon: <CheckCircle2 className="text-green-600" /> })
        setEditExpenseDialogOpen(false)
        fetchExpenses()
        fetchFinancialSummary()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update expense")
      }
    } catch {
      toast.error("Failed to update expense")
    } finally {
      setSavingExpense(false)
    }
  }

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return
    setSavingExpense(true)
    try {
      const res = await fetch(`/api/expenses/${deletingExpense.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Expense deleted successfully", { icon: <CheckCircle2 className="text-green-600" /> })
        setDeleteExpenseDialogOpen(false)
        setDeletingExpense(null)
        fetchExpenses()
        fetchFinancialSummary()
      } else {
        toast.error("Failed to delete expense")
      }
    } catch {
      toast.error("Failed to delete expense")
    } finally {
      setSavingExpense(false)
    }
  }

  const resetExpenseForm = () => {
    setExpenseCategory("SALARY")
    setExpenseDescription("")
    setExpenseAmount("")
    setExpenseDate(format(new Date(), "yyyy-MM-dd"))
    setExpenseReference("")
  }

  // ─── Expense bar chart data ───
  const expenseBarData = Object.entries(monthlyExpenseSummary).map(([key, value]) => ({
    category: CATEGORY_LABELS[key] || key,
    amount: value,
    fill: EXPENSE_COLORS[Object.keys(monthlyExpenseSummary).indexOf(key) % EXPENSE_COLORS.length],
  }))

  // ─── Financial helpers ───
  const revenueChange = financialData.lastMonthRevenue
    ? ((financialData.currentMonthRevenue - financialData.lastMonthRevenue) / financialData.lastMonthRevenue * 100).toFixed(1)
    : "0"
  const expenseChange = financialData.lastMonthExpenses
    ? ((financialData.currentMonthExpenses - financialData.lastMonthExpenses) / financialData.lastMonthExpenses * 100).toFixed(1)
    : "0"
  const profitChange = financialData.lastMonthProfit
    ? ((financialData.currentMonthProfit - financialData.lastMonthProfit) / Math.abs(financialData.lastMonthProfit) * 100).toFixed(1)
    : "0"

  // ─── Render: Skeleton ───
  const TableSkeleton = () => (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-muted rounded-md animate-pulse" />
      ))}
    </div>
  )

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Billing & Accounting</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage invoices, payments, expenses, and financial reports</p>
        </div>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="bg-green-50/50 border border-green-200/50">
          <TabsTrigger value="invoices" className="data-[state=active]:bg-green-700 data-[state=active]:text-white gap-1.5">
            <FileText className="size-4" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-green-700 data-[state=active]:text-white gap-1.5">
            <CreditCard className="size-4" /> Payments
          </TabsTrigger>
          <TabsTrigger value="expenses" className="data-[state=active]:bg-green-700 data-[state=active]:text-white gap-1.5">
            <Receipt className="size-4" /> Expenses
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-green-700 data-[state=active]:text-white gap-1.5">
            <BarChart3 className="size-4" /> Financial Summary
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════ TAB 1: INVOICES ═══════════════════════════ */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Select value={invoiceStatusFilter} onValueChange={(v) => { setInvoiceStatusFilter(v); setInvoicePage(1) }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { resetCreateForm(); setCreateDialogOpen(true) }} className="bg-green-700 hover:bg-green-800 text-white gap-1.5">
              <Plus className="size-4" /> Create Invoice
            </Button>
          </div>

          <Card className="border-green-100">
            <CardContent className="p-0">
              <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50/50 hover:bg-green-50/50">
                      <TableHead className="whitespace-nowrap">Invoice No</TableHead>
                      <TableHead className="whitespace-nowrap">Patient</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                      <TableHead className="text-right whitespace-nowrap hidden sm:table-cell">Discount</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Net Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceLoading ? (
                      <TableRow><TableCell colSpan={8}><TableSkeleton /></TableCell></TableRow>
                    ) : invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          <FileText className="size-10 mx-auto mb-2 opacity-30" />
                          No invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono font-medium text-green-800">{inv.invoiceNo}</TableCell>
                          <TableCell>{inv.patient?.name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(inv.createdAt), "dd MMM yyyy")}</TableCell>
                          <TableCell className="text-right font-mono">{CURRENCY(inv.totalAmount)}</TableCell>
                          <TableCell className="text-right font-mono text-orange-600 hidden sm:table-cell">{inv.discount > 0 ? `-${CURRENCY(inv.discount)}` : "—"}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{CURRENCY(inv.netAmount)}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[inv.status] || ""}`}>
                              {STATUS_LABELS[inv.status] || inv.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openInvoiceDetail(inv)} title="View Details">
                              <Eye className="size-4 text-green-700" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {invoiceTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {invoicePage} of {invoiceTotalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" disabled={invoicePage <= 1} onClick={() => setInvoicePage(invoicePage - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={invoicePage >= invoiceTotalPages} onClick={() => setInvoicePage(invoicePage + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════ TAB 2: PAYMENTS ═══════════════════════════ */}
        <TabsContent value="payments" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-green-100 bg-gradient-to-br from-green-50 to-green-50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3"><DollarSign className="size-5 text-green-700" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Today&apos;s Collection</p>
                  <p className="text-2xl font-bold text-green-800">{CURRENCY(paymentSummary.dailyTotal)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-100 bg-gradient-to-br from-green-50 to-green-50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3"><TrendingUp className="size-5 text-green-700" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month&apos;s Collection</p>
                  <p className="text-2xl font-bold text-green-800">{CURRENCY(paymentSummary.monthlyTotal)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Select value={paymentMethodFilter} onValueChange={(v) => { setPaymentMethodFilter(v); setPaymentPage(1) }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Methods</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="BKASH">bKash</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" value={paymentDateStart} onChange={(e) => setPaymentDateStart(e.target.value)} className="w-[150px]" placeholder="From" />
              <Input type="date" value={paymentDateEnd} onChange={(e) => setPaymentDateEnd(e.target.value)} className="w-[150px]" placeholder="To" />
            </div>
            {(paymentDateStart || paymentDateEnd || paymentMethodFilter !== "ALL") && (
              <Button variant="ghost" size="sm" onClick={() => { setPaymentDateStart(""); setPaymentDateEnd(""); setPaymentMethodFilter("ALL") }}>
                <X className="size-3 mr-1" /> Clear filters
              </Button>
            )}
          </div>

          <Card className="border-green-100">
            <CardContent className="p-0">
              <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50/50 hover:bg-green-50/50">
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Invoice No</TableHead>
                      <TableHead className="whitespace-nowrap">Patient</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Method</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentLoading ? (
                      <TableRow><TableCell colSpan={6}><TableSkeleton /></TableCell></TableRow>
                    ) : payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <CreditCard className="size-10 mx-auto mb-2 opacity-30" />
                          No payments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((pmt) => (
                        <TableRow key={pmt.id}>
                          <TableCell className="text-muted-foreground">{format(new Date(pmt.createdAt), "dd MMM yyyy")}</TableCell>
                          <TableCell className="font-mono font-medium text-green-800">{pmt.invoice?.invoiceNo || "—"}</TableCell>
                          <TableCell>{pmt.invoice?.patient?.name || "—"}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{CURRENCY(pmt.amount)}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${METHOD_COLORS[pmt.method] || METHOD_COLORS.OTHER}`}>
                              {pmt.method}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">{pmt.reference || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {paymentTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {paymentPage} of {paymentTotalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" disabled={paymentPage <= 1} onClick={() => setPaymentPage(paymentPage - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={paymentPage >= paymentTotalPages} onClick={() => setPaymentPage(paymentPage + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════ TAB 3: EXPENSES ═══════════════════════════ */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetExpenseForm(); setExpenseDialogOpen(true) }} className="bg-green-700 hover:bg-green-800 text-white gap-1.5">
              <Plus className="size-4" /> Add Expense
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Expense Table */}
            <Card className="lg:col-span-2 border-green-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Expense Records</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[440px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-green-50/50 hover:bg-green-50/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Ref</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseLoading ? (
                        <TableRow><TableCell colSpan={6}><TableSkeleton /></TableCell></TableRow>
                      ) : expenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            <Receipt className="size-10 mx-auto mb-2 opacity-30" />
                            No expenses recorded
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenses.map((exp) => (
                          <TableRow key={exp.id}>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{format(new Date(exp.date), "dd MMM yyyy")}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{CATEGORY_LABELS[exp.category] || exp.category}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{exp.description}</TableCell>
                            <TableCell className="text-right font-mono font-semibold text-red-600">{CURRENCY(exp.amount)}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{exp.reference || "—"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditExpense(exp)} title="Edit">
                                  <Edit2 className="size-3.5 text-green-700" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setDeletingExpense(exp); setDeleteExpenseDialogOpen(true) }} title="Delete">
                                  <Trash2 className="size-3.5 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Expense Summary Chart */}
            <Card className="border-green-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Monthly Expense Summary</CardTitle>
                <CardDescription>Current month breakdown by category</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {expenseBarData.length > 0 ? (
                  <ChartContainer config={expenseBarConfig} className="h-[320px] w-full">
                    <BarChart data={expenseBarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                      <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {expenseBarData.map((entry, index) => (
                          <rect key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
                    No expense data for this month
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════ TAB 4: FINANCIAL SUMMARY ═══════════════════════════ */}
        <TabsContent value="summary" className="space-y-4">
          {financialLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-6"><div className="h-20 bg-muted rounded animate-pulse" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground font-medium">Revenue (This Month)</p>
                      <div className="rounded-full bg-green-100 p-2"><TrendingUp className="size-4 text-green-700" /></div>
                    </div>
                    <p className="text-2xl font-bold text-green-800">{CURRENCY(financialData.currentMonthRevenue)}</p>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${parseFloat(revenueChange) >= 0 ? "text-green-700" : "text-red-500"}`}>
                      {parseFloat(revenueChange) >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {Math.abs(parseFloat(revenueChange))}% vs last month
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground font-medium">Expenses (This Month)</p>
                      <div className="rounded-full bg-red-100 p-2"><TrendingDown className="size-4 text-red-500" /></div>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{CURRENCY(financialData.currentMonthExpenses)}</p>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${parseFloat(expenseChange) <= 0 ? "text-green-700" : "text-red-500"}`}>
                      {parseFloat(expenseChange) <= 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
                      {Math.abs(parseFloat(expenseChange))}% vs last month
                    </p>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${financialData.currentMonthProfit >= 0 ? "border-green-300 bg-gradient-to-br from-green-50 to-white" : "border-red-300 bg-gradient-to-br from-red-50 to-white"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground font-medium">Net Profit (This Month)</p>
                      <div className={`rounded-full p-2 ${financialData.currentMonthProfit >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                        <DollarSign className={`size-4 ${financialData.currentMonthProfit >= 0 ? "text-green-700" : "text-red-500"}`} />
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${financialData.currentMonthProfit >= 0 ? "text-green-800" : "text-red-600"}`}>
                      {CURRENCY(financialData.currentMonthProfit)}
                    </p>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${parseFloat(profitChange) >= 0 ? "text-green-700" : "text-red-500"}`}>
                      {parseFloat(profitChange) >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {Math.abs(parseFloat(profitChange))}% vs last month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Trend Chart */}
              <Card className="border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue vs Expenses Trend</CardTitle>
                  <CardDescription>Last 6 months overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={revenueChartConfig} className="h-[350px] w-full">
                    <LineChart data={financialData.trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(160, 84%, 39%)" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="expenses" stroke="hsl(0, 84%, 60%)" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="profit" stroke="hsl(142, 70%, 45%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* P/L Summary Table */}
              <Card className="border-green-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Profit / Loss Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-green-50/50 hover:bg-green-50/50">
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Profit / Loss</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.trendData.map((row) => (
                        <TableRow key={row.month}>
                          <TableCell className="font-medium">{row.month}</TableCell>
                          <TableCell className="text-right font-mono text-green-800">{CURRENCY(row.revenue)}</TableCell>
                          <TableCell className="text-right font-mono text-red-600">{CURRENCY(row.expenses)}</TableCell>
                          <TableCell className={`text-right font-mono font-semibold ${row.profit >= 0 ? "text-green-800" : "text-red-600"}`}>
                            {row.profit >= 0 ? "+" : ""}{CURRENCY(row.profit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════ CREATE INVOICE DIALOG ═══════════════════════════ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="size-5 text-green-700" /> Create Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a patient</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Search */}
            <div className="space-y-2">
              <Label>Patient *</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search patient by name..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {createPatients.length > 0 && !selectedPatient && (
                <div className="border rounded-md max-h-40 overflow-y-auto bg-popover">
                  {createPatients.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center justify-between transition-colors"
                      onClick={() => {
                        setSelectedPatient(p.id)
                        setPatientSearch(p.name)
                        setCreatePatients([])
                      }}
                    >
                      <span>{p.name}</span>
                      <span className="text-muted-foreground text-xs">{p.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className="flex items-center gap-2 bg-green-50 text-green-800 px-3 py-1.5 rounded-md text-sm">
                  <CheckCircle2 className="size-4" />
                  {createPatients.find((p) => p.id === selectedPatient)?.name || "Patient selected"}
                  <button onClick={() => { setSelectedPatient(""); setPatientSearch(""); }} className="ml-auto">
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Appointment Selection */}
            <div className="space-y-2">
              <Label>Link to Appointment (Optional)</Label>
              <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select appointment..." />
                </SelectTrigger>
                <SelectContent>
                  {createAppointments.length === 0 ? (
                    <SelectItem value="none" disabled>No completed appointments</SelectItem>
                  ) : (
                    createAppointments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {format(new Date(apt.date), "dd MMM yyyy")} — {apt.type} {apt.doctor ? `(${apt.doctor.name})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="gap-1 text-green-700 border-green-300">
                  <Plus className="size-3.5" /> Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-muted/50 p-3 rounded-lg">
                    <div className="col-span-12 sm:col-span-4">
                      {idx === 0 ? <Label className="text-xs mb-1">Description</Label> : null}
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      {idx === 0 ? <Label className="text-xs mb-1">Category</Label> : null}
                      <Select value={item.category} onValueChange={(v) => updateLineItem(idx, "category", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSULTATION">Consultation</SelectItem>
                          <SelectItem value="LAB_TEST">Lab Test</SelectItem>
                          <SelectItem value="MEDICINE">Medicine</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      {idx === 0 ? <Label className="text-xs mb-1">Qty</Label> : null}
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      {idx === 0 ? <Label className="text-xs mb-1">Unit Price (৳)</Label> : null}
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice || ""}
                        onChange={(e) => updateLineItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex items-center justify-center">
                      <span className="font-mono text-sm font-medium whitespace-nowrap">
                        ৳{(item.quantity * item.unitPrice).toLocaleString()}
                      </span>
                    </div>
                    {lineItems.length > 1 && (
                      <div className="col-span-12 sm:col-span-0 flex justify-end sm:justify-start">
                        <Button variant="ghost" size="icon" onClick={() => removeLineItem(idx)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{CURRENCY(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <Label className="text-muted-foreground shrink-0">Discount (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  max={totalAmount}
                  step={0.01}
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-32 text-right"
                />
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Net Amount</span>
                <span className="font-mono text-green-800">{CURRENCY(netAmount)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} disabled={creating} className="bg-green-700 hover:bg-green-800 text-white">
              {creating ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════ INVOICE DETAIL DIALOG ═══════════════════════════ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" showCloseButton={!paymentDialogOpen}>
          {detailLoading ? (
            <div className="space-y-4 p-4">
              <div className="h-8 bg-muted rounded animate-pulse" />
              <div className="h-40 bg-muted rounded animate-pulse" />
              <div className="h-20 bg-muted rounded animate-pulse" />
            </div>
          ) : selectedInvoice ? (
            <div className="space-y-6" id="invoice-printable">
              {/* Invoice Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold text-green-800">INVOICE</h2>
                <p className="text-2xl font-mono font-bold mt-1">{selectedInvoice.invoiceNo}</p>
                <p className="text-sm text-muted-foreground mt-1">{format(new Date(selectedInvoice.createdAt), "dd MMM yyyy, hh:mm a")}</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mt-2 ${STATUS_COLORS[selectedInvoice.status]}`}>
                  {STATUS_LABELS[selectedInvoice.status]}
                </span>
              </div>

              {/* Patient & Appointment Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Patient</p>
                  <p className="font-semibold">{selectedInvoice.patient?.name || "—"}</p>
                  <p className="text-muted-foreground">{selectedInvoice.patient?.phone || ""}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Appointment</p>
                  <p className="font-semibold">
                    {selectedInvoice.appointment
                      ? `${format(new Date(selectedInvoice.appointment.date), "dd MMM yyyy")} — ${selectedInvoice.appointment?.type}`
                      : "N/A"}
                  </p>
                  {selectedInvoice.appointment?.doctor && (
                    <p className="text-muted-foreground">Dr. {selectedInvoice.appointment.doctor.name}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="text-sm font-semibold mb-2">Items</p>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{CURRENCY(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-mono font-medium">{CURRENCY(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{CURRENCY(selectedInvoice.totalAmount)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Discount</span>
                    <span className="font-mono">-{CURRENCY(selectedInvoice.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Net Amount</span>
                  <span className="font-mono text-green-800">{CURRENCY(selectedInvoice.netAmount)}</span>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Payment History</p>
                  <p className="text-sm text-muted-foreground">
                    Paid: <span className="font-mono font-semibold text-green-800">{CURRENCY(selectedInvoice.totalPaid || 0)}</span>
                    {" / "}{CURRENCY(selectedInvoice.netAmount)}
                  </p>
                </div>
                {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((pmt) => (
                      <div key={pmt.id} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">{format(new Date(pmt.createdAt), "dd MMM yyyy")}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${METHOD_COLORS[pmt.method]}`}>{pmt.method}</span>
                          {pmt.reference && <span className="text-muted-foreground text-xs">Ref: {pmt.reference}</span>}
                        </div>
                        <span className="font-mono font-medium">{CURRENCY(pmt.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No payments recorded yet.</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {selectedInvoice.status !== "CANCELLED" && selectedInvoice.status !== "PAID" && (
                  <Button onClick={() => openPaymentDialog(selectedInvoice)} className="bg-green-700 hover:bg-green-800 text-white gap-1.5 flex-1">
                    <DollarSign className="size-4" /> Record Payment
                  </Button>
                )}
                {selectedInvoice.status !== "CANCELLED" && (
                  <Button variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setCancelDialogOpen(true)}>
                    <AlertCircle className="size-4" /> Cancel Invoice
                  </Button>
                )}
                <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
                  <Printer className="size-4" /> Print
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════ RECORD PAYMENT DIALOG ═══════════════════════════ */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><DollarSign className="size-5 text-green-700" /> Record Payment</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNo} — Remaining: <span className="font-semibold text-green-800">{selectedInvoice ? CURRENCY((selectedInvoice.netAmount - (selectedInvoice.totalPaid || 0))) : ""}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (৳) *</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BKASH">bKash</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction reference"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={recordingPayment} className="bg-green-700 hover:bg-green-800 text-white">
              {recordingPayment ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════ CANCEL INVOICE ALERT ═══════════════════════════ */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel invoice <span className="font-semibold">{selectedInvoice?.invoiceNo}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvoice} disabled={cancelling} className="bg-red-600 hover:bg-red-700 text-white">
              {cancelling ? "Cancelling..." : "Yes, cancel invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════ ADD EXPENSE DIALOG ═══════════════════════════ */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="size-5 text-green-700" /> Add Expense</DialogTitle>
            <DialogDescription>Record a new expense entry</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALARY">Salary</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="SUPPLIES">Supplies</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} placeholder="Expense description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount (৳) *</Label>
                <Input type="number" min={0.01} step={0.01} value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input value={expenseReference} onChange={(e) => setExpenseReference(e.target.value)} placeholder="Reference number" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateExpense} disabled={savingExpense} className="bg-green-700 hover:bg-green-800 text-white">
              {savingExpense ? "Saving..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════ EDIT EXPENSE DIALOG ═══════════════════════════ */}
      <Dialog open={editExpenseDialogOpen} onOpenChange={setEditExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit2 className="size-5 text-green-700" /> Edit Expense</DialogTitle>
            <DialogDescription>Update this expense entry</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALARY">Salary</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="SUPPLIES">Supplies</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} placeholder="Expense description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount (৳) *</Label>
                <Input type="number" min={0.01} step={0.01} value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input value={expenseReference} onChange={(e) => setExpenseReference(e.target.value)} placeholder="Reference number" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditExpenseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateExpense} disabled={savingExpense} className="bg-green-700 hover:bg-green-800 text-white">
              {savingExpense ? "Saving..." : "Update Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════ DELETE EXPENSE ALERT ═══════════════════════════ */}
      <AlertDialog open={deleteExpenseDialogOpen} onOpenChange={setDeleteExpenseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense ({deletingExpense?.description})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} disabled={savingExpense} className="bg-red-600 hover:bg-red-700 text-white">
              {savingExpense ? "Deleting..." : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
