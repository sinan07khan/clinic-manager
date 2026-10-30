'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  Calendar,
  Activity,
  Inbox,
  ShieldCheck,
  Lock,
  FileCheck,
  Coins,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Receipt,
  RotateCcw,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | 'thisMonth' | 'lastMonth'

interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
}

interface RevenueByDay {
  date: string
  revenue: number
}

interface RevenueByService {
  service: string
  revenue: number
  fill: string
}

interface MonthlyRevenue {
  month: string
  thisYear: number
  lastYear: number
}

interface PatientVisitTrend {
  date: string
  newPatients: number
  returningPatients: number
}

interface PatientDemographics {
  gender: string
  count: number
  fill: string
}

interface DoctorPerformance {
  doctorName: string
  patients: number
  revenue: number
  avgRating: number
}

interface DiagnosticTest {
  testName: string
  count: number
  revenue: number
}

interface AnalyticsData {
  financialSummary: FinancialSummary
  revenueByDay: RevenueByDay[]
  revenueByService: RevenueByService[]
  monthlyRevenue: MonthlyRevenue[]
  patientVisitTrend: PatientVisitTrend[]
  patientDemographics: PatientDemographics[]
  doctorPerformance: DoctorPerformance[]
  diagnosticTests: DiagnosticTest[]
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

function generateMockAnalytics(): Record<DateRange, AnalyticsData> {
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const revenueByDay30 = days30.map((date) => ({
    date,
    revenue: Math.floor(50000 + Math.random() * 70000),
  }))

  const patientVisitTrend30 = days30.map((date) => ({
    date,
    newPatients: Math.floor(3 + Math.random() * 10),
    returningPatients: Math.floor(5 + Math.random() * 15),
  }))

  const revenueByDay7 = revenueByDay30.slice(-7)
  const patientVisitTrend7 = patientVisitTrend30.slice(-7)

  const doctorPerformance = [
    { doctorName: 'Dr. Fatima Begum', patients: 156, revenue: 780000, avgRating: 4.8 },
    { doctorName: 'Dr. Ahmed Khan', patients: 132, revenue: 924000, avgRating: 4.9 },
    { doctorName: 'Dr. Nasreen Jahan', patients: 98, revenue: 588000, avgRating: 4.7 },
    { doctorName: 'Dr. Rafiq Islam', patients: 87, revenue: 609000, avgRating: 4.6 },
    { doctorName: 'Dr. Taslima Akhter', patients: 145, revenue: 435000, avgRating: 4.8 },
    { doctorName: 'Dr. Habibur Rahman', patients: 67, revenue: 268000, avgRating: 4.5 },
  ]

  const diagnosticTests = [
    { testName: 'Complete Blood Count (CBC)', count: 245, revenue: 73500 },
    { testName: 'Blood Sugar (Fasting)', count: 198, revenue: 29700 },
    { testName: 'Lipid Profile', count: 156, revenue: 39000 },
    { testName: 'Liver Function Test', count: 134, revenue: 40200 },
    { testName: 'Thyroid Panel (TSH)', count: 112, revenue: 44800 },
    { testName: 'Urinalysis', count: 89, revenue: 8900 },
    { testName: 'X-Ray (Chest)', count: 67, revenue: 67000 },
    { testName: 'Ultrasound (Abdomen)', count: 45, revenue: 90000 },
  ]

  const monthlyRevenue = [
    { month: 'Jan', thisYear: 1850000, lastYear: 1520000 },
    { month: 'Feb', thisYear: 2100000, lastYear: 1780000 },
    { month: 'Mar', thisYear: 1950000, lastYear: 1650000 },
    { month: 'Apr', thisYear: 2300000, lastYear: 1900000 },
    { month: 'May', thisYear: 2150000, lastYear: 1820000 },
    { month: 'Jun', thisYear: 2400000, lastYear: 2050000 },
  ]

  const baseSummary = {
    totalRevenue: 2460000,
    totalExpenses: 890000,
    netProfit: 1570000,
    profitMargin: 63.8,
  }

  return {
    '7d': {
      financialSummary: { ...baseSummary, totalRevenue: 576000, totalExpenses: 178000, netProfit: 398000, profitMargin: 69.1 },
      revenueByDay: revenueByDay7,
      revenueByService: [
        { service: 'Consultation', revenue: 288000, fill: 'var(--color-consultation)' },
        { service: 'Lab Tests', revenue: 173000, fill: 'var(--color-labtests)' },
        { service: 'Medicine', revenue: 115000, fill: 'var(--color-medicine)' },
      ],
      monthlyRevenue,
      patientVisitTrend: patientVisitTrend7,
      patientDemographics: [
        { gender: 'Male', count: 45, fill: 'var(--color-male)' },
        { gender: 'Female', count: 58, fill: 'var(--color-female)' },
        { gender: 'Other', count: 2, fill: 'var(--color-other)' },
      ],
      doctorPerformance,
      diagnosticTests,
    },
    '30d': {
      financialSummary: baseSummary,
      revenueByDay: revenueByDay30,
      revenueByService: [
        { service: 'Consultation', revenue: 1230000, fill: 'var(--color-consultation)' },
        { service: 'Lab Tests', revenue: 738000, fill: 'var(--color-labtests)' },
        { service: 'Medicine', revenue: 492000, fill: 'var(--color-medicine)' },
      ],
      monthlyRevenue,
      patientVisitTrend: patientVisitTrend30,
      patientDemographics: [
        { gender: 'Male', count: 187, fill: 'var(--color-male)' },
        { gender: 'Female', count: 223, fill: 'var(--color-female)' },
        { gender: 'Other', count: 8, fill: 'var(--color-other)' },
      ],
      doctorPerformance,
      diagnosticTests,
    },
    thisMonth: {
      financialSummary: { ...baseSummary, totalRevenue: 1920000, totalExpenses: 680000, netProfit: 1240000, profitMargin: 64.6 },
      revenueByDay: revenueByDay30.slice(-15),
      revenueByService: [
        { service: 'Consultation', revenue: 960000, fill: 'var(--color-consultation)' },
        { service: 'Lab Tests', revenue: 576000, fill: 'var(--color-labtests)' },
        { service: 'Medicine', revenue: 384000, fill: 'var(--color-medicine)' },
      ],
      monthlyRevenue,
      patientVisitTrend: patientVisitTrend30.slice(-15),
      patientDemographics: [
        { gender: 'Male', count: 134, fill: 'var(--color-male)' },
        { gender: 'Female', count: 168, fill: 'var(--color-female)' },
        { gender: 'Other', count: 5, fill: 'var(--color-other)' },
      ],
      doctorPerformance,
      diagnosticTests,
    },
    lastMonth: {
      financialSummary: { ...baseSummary, totalRevenue: 2150000, totalExpenses: 750000, netProfit: 1400000, profitMargin: 65.1 },
      revenueByDay: revenueByDay30,
      revenueByService: [
        { service: 'Consultation', revenue: 1075000, fill: 'var(--color-consultation)' },
        { service: 'Lab Tests', revenue: 645000, fill: 'var(--color-labtests)' },
        { service: 'Medicine', revenue: 430000, fill: 'var(--color-medicine)' },
      ],
      monthlyRevenue,
      patientVisitTrend: patientVisitTrend30,
      patientDemographics: [
        { gender: 'Male', count: 165, fill: 'var(--color-male)' },
        { gender: 'Female', count: 201, fill: 'var(--color-female)' },
        { gender: 'Other', count: 6, fill: 'var(--color-other)' },
      ],
      doctorPerformance,
      diagnosticTests,
    },
  }
}

// ─── Chart Configs ───────────────────────────────────────────────────────────

const revenueTrendConfig: ChartConfig = {
  revenue: {
    label: 'Revenue (BDT)',
    color: 'oklch(0.522 0.223 25)',
  },
}

const serviceRevenueConfig: ChartConfig = {
  consultation: {
    label: 'Consultation',
    color: 'oklch(0.522 0.223 25)',
  },
  labtests: {
    label: 'Lab Tests',
    color: 'oklch(0.533 0.141 145)',
  },
  medicine: {
    label: 'Medicine',
    color: 'oklch(0.778 0.138 145)',
  },
}

const monthlyRevenueConfig: ChartConfig = {
  thisYear: {
    label: 'This Year',
    color: 'oklch(0.522 0.223 25)',
  },
  lastYear: {
    label: 'Last Year',
    color: 'oklch(0.778 0.138 145)',
  },
}

const patientTrendConfig: ChartConfig = {
  newPatients: {
    label: 'New Patients',
    color: 'oklch(0.723 0.219 149.579)',
  },
  returningPatients: {
    label: 'Returning Patients',
    color: 'oklch(0.533 0.141 145)',
  },
}

const demographicsConfig: ChartConfig = {
  male: {
    label: 'Male',
    color: 'oklch(0.623 0.214 259.815)',
  },
  female: {
    label: 'Female',
    color: 'oklch(0.7 0.191 342.258)',
  },
  other: {
    label: 'Other',
    color: 'oklch(0.778 0.138 145)',
  },
}

const doctorPatientsConfig: ChartConfig = {
  patients: {
    label: 'Patients',
    color: 'oklch(0.723 0.219 149.579)',
  },
}

const doctorRevenueConfig: ChartConfig = {
  revenue: {
    label: 'Revenue (BDT)',
    color: 'oklch(0.522 0.223 25)',
  },
}

const testCountConfig: ChartConfig = {
  count: {
    label: 'Tests Ordered',
    color: 'oklch(0.533 0.141 145)',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ChartEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-center">
      <Inbox className="size-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
    </div>
  )
}

function formatBDT(amount: number): string {
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(1)}L`
  return `৳${amount.toLocaleString('en-BD')}`
}

function formatBDTFull(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`
}

const dateRangeLabels: Record<DateRange, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [apiData, setApiData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const mockData = useMemo(() => generateMockAnalytics(), [])

  const data = apiData || mockData[dateRange]

  // Commissions state
  const [commissionsData, setCommissionsData] = useState<{
    summary: { totalCommissions: number; pendingCommissions: number; paidCommissions: number }
    commissions: Array<{
      id: string
      doctorId: string
      doctor?: { name: string; specialization?: string } | null
      serviceName: string
      serviceAmount: number
      commissionRate: number
      commissionAmount: number
      status: string
      paidAt?: string
      createdAt: string
    }>
  }>({
    summary: { totalCommissions: 0, pendingCommissions: 0, paidCommissions: 0 },
    commissions: [],
  })

  // Daily Closing state
  const [dailyClosingData, setDailyClosingData] = useState<{
    history: Array<{
      id: string
      closingDate: string
      totalCollection: number
      cashInDrawer: number
      digitalCollection: number
      expensesDeducted: number
      expectedCash: number
      actualCash: number
      discrepancy: number
      closedBy: string
      notes?: string
    }>
    liveToday: {
      cashCollected: number
      cardCollected: number
      digitalCollected: number
      totalExpenses: number
      expectedCashInHand: number
    }
  }>({
    history: [],
    liveToday: { cashCollected: 0, cardCollected: 0, digitalCollected: 0, totalExpenses: 0, expectedCashInHand: 0 },
  })

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string
    action: string
    module: string
    recordId?: string
    details: string
    userId?: string
    ipAddress?: string
    createdAt: string
  }>>([])
  const [auditModuleFilter, setAuditModuleFilter] = useState("ALL")

  // Actual cash input for day-end reconciliation
  const [countedCash, setCountedCash] = useState("")
  const [closingNotes, setClosingNotes] = useState("")
  const [closingStaff, setClosingStaff] = useState("Sinan (Admin)")
  const [isSubmittingClosing, setIsSubmittingClosing] = useState(false)

  const fetchCommissions = async () => {
    try {
      const res = await fetch('/api/finance/commissions')
      if (res.ok) {
        const json = await res.json()
        setCommissionsData(json)
      }
    } catch {}
  }

  const fetchDailyClosing = async () => {
    try {
      const res = await fetch('/api/finance/daily-closing')
      if (res.ok) {
        const json = await res.json()
        setDailyClosingData(json)
        if (json.liveToday && countedCash === "") {
          setCountedCash(String(json.liveToday.expectedCashInHand))
        }
      }
    } catch {}
  }

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`/api/audit-logs?module=${auditModuleFilter}&limit=100`)
      if (res.ok) {
        const json = await res.json()
        setAuditLogs(Array.isArray(json) ? json : [])
      }
    } catch {}
  }

  useEffect(() => {
    fetchCommissions()
    fetchDailyClosing()
  }, [])

  useEffect(() => {
    fetchAuditLogs()
  }, [auditModuleFilter])

  const handleMarkCommissionPaid = async (id: string) => {
    try {
      const res = await fetch('/api/finance/commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'PAID' }),
      })
      if (res.ok) {
        toast.success("Doctor commission marked as PAID!", { icon: <CheckCircle2 className="text-emerald-600" /> })
        fetchCommissions()
      }
    } catch {
      toast.error("Failed to update commission")
    }
  }

  const handleSaveDailyClosing = async () => {
    const actual = parseFloat(countedCash)
    if (isNaN(actual) || actual < 0) {
      toast.error("Please enter a valid actual cash count")
      return
    }
    setIsSubmittingClosing(true)
    try {
      const res = await fetch('/api/finance/daily-closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualCash: actual,
          notes: closingNotes,
          closedBy: closingStaff,
        }),
      })
      if (res.ok) {
        toast.success("Daily cash drawer closing & reconciliation saved successfully!", { icon: <CheckCircle2 className="text-emerald-600" /> })
        fetchDailyClosing()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to record closing")
      }
    } catch {
      toast.error("Failed to record closing")
    } finally {
      setIsSubmittingClosing(false)
    }
  }

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const res = await fetch(`/api/analytics?range=${dateRange}`)
        if (res.ok) {
          const json = await res.json()
          if (json.data) {
            setApiData({
              financialSummary: json.data.financialSummary ?? { totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0 },
              revenueByDay: json.data.revenueByDay ?? [],
              revenueByService: json.data.revenueByService ?? [],
              monthlyRevenue: json.data.monthlyRevenue ?? [],
              patientVisitTrend: json.data.patientVisitTrend ?? [],
              patientDemographics: json.data.patientDemographics ?? [],
              doctorPerformance: json.data.doctorPerformance ?? [],
              diagnosticTests: json.data.diagnosticTests ?? [],
            })
          }
        }
      } catch {
        // Fallback to mock data
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [dateRange])

  const summary = data.financialSummary

  return (
    <div className="space-y-6">
      {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Comprehensive insights into clinic performance</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {(['7d', '30d', 'thisMonth', 'lastMonth'] as DateRange[]).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setDateRange(range)
                setApiData(null)
              }}
              className={cn(
                'text-xs h-7 px-3',
                dateRange === range && 'bg-card shadow-sm text-foreground hover:bg-card hover:text-foreground'
              )}
            >
              {dateRangeLabels[range]}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-[120px] bg-muted/30" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Financial Summary Cards ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card rounded-xl border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatBDT(summary.totalRevenue)}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-700" />
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% from previous period
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-xl border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold">{formatBDT(summary.totalExpenses)}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-rose-100 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
                <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  +3.2% from previous period
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-xl border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Net Profit</p>
                    <p className="text-2xl font-bold">{formatBDT(summary.netProfit)}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-green-700" />
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +15.8% from previous period
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-xl border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">Profit Margin</p>
                    <p className="text-2xl font-bold">{summary.profitMargin.toFixed(1)}%</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +2.1% from previous period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Tabs for Analytics Sections ──────────────────────────────── */}
          <Tabs defaultValue="revenue" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto p-1 bg-muted">
              <TabsTrigger value="revenue">Revenue & Services</TabsTrigger>
              <TabsTrigger value="patients">Patients & Demographics</TabsTrigger>
              <TabsTrigger value="doctors">Doctor Performance</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              <TabsTrigger value="commissions" className="gap-1.5"><Coins className="size-3.5" /> Doctor Commissions</TabsTrigger>
              <TabsTrigger value="cash_closing" className="gap-1.5"><Receipt className="size-3.5" /> Daily Cash Closing</TabsTrigger>
              <TabsTrigger value="audit_trail" className="gap-1.5"><ShieldCheck className="size-3.5" /> Audit Trail</TabsTrigger>
            </TabsList>

            {/* ─── Revenue Tab ────────────────────────────────────────────── */}
            <TabsContent value="revenue" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <Card className="bg-card rounded-xl border shadow-sm lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                    <CardDescription>Daily revenue for the selected period</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {data.revenueByDay.length > 0 && data.revenueByDay.some(d => d.revenue > 0) ? (
                      <ChartContainer config={revenueTrendConfig} className="h-[300px] w-full">
                        <LineChart data={data.revenueByDay} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                          <YAxis className="text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-revenue)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <ChartEmptyState title="No Revenue Data" description="Revenue trend will appear once payments are recorded" />
                    )}
                  </CardContent>
                </Card>

                {/* Revenue by Service */}
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Revenue by Service</CardTitle>
                    <CardDescription>Distribution across service types</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {data.revenueByService.length > 0 ? (
                      <ChartContainer config={serviceRevenueConfig} className="h-[300px] w-full">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent nameKey="service" hideLabel />} />
                          <Pie
                            data={data.revenueByService}
                            dataKey="revenue"
                            nameKey="service"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            strokeWidth={2}
                            stroke="white"
                          >
                            {data.revenueByService.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartLegend content={<ChartLegendContent nameKey="service" />} />
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <ChartEmptyState title="No Service Data" description="Service revenue breakdown will appear here" />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Revenue Comparison */}
              <Card className="bg-card rounded-xl border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Monthly Revenue Comparison</CardTitle>
                  <CardDescription>This year vs. last year</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {data.monthlyRevenue.length > 0 ? (
                    <ChartContainer config={monthlyRevenueConfig} className="h-[300px] w-full">
                      <BarChart data={data.monthlyRevenue} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" tickLine={false} axisLine={false} />
                        <YAxis className="text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="thisYear" fill="var(--color-thisYear)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="lastYear" fill="var(--color-lastYear)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <ChartEmptyState title="No Monthly Data" description="Monthly revenue comparison will appear here" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Patients Tab ───────────────────────────────────────────── */}
            <TabsContent value="patients" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient Visit Trend */}
                <Card className="bg-card rounded-xl border shadow-sm lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Patient Visits Trend</CardTitle>
                    <CardDescription>New vs returning patients</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {data.patientVisitTrend.length > 0 ? (
                      <ChartContainer config={patientTrendConfig} className="h-[300px] w-full">
                        <LineChart data={data.patientVisitTrend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                          <YAxis className="text-xs" tickLine={false} axisLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Line type="monotone" dataKey="newPatients" stroke="var(--color-newPatients)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                          <Line type="monotone" dataKey="returningPatients" stroke="var(--color-returningPatients)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <ChartEmptyState title="No Visit Data" description="Patient visit trends will appear here" />
                    )}
                  </CardContent>
                </Card>

                {/* Patient Demographics */}
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Patient Demographics</CardTitle>
                    <CardDescription>Gender distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {data.patientDemographics.length > 0 ? (
                      <ChartContainer config={demographicsConfig} className="h-[300px] w-full">
                        <PieChart>
                          <ChartTooltip content={<ChartTooltipContent nameKey="gender" hideLabel />} />
                          <Pie
                            data={data.patientDemographics}
                            dataKey="count"
                            nameKey="gender"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            strokeWidth={2}
                            stroke="white"
                          >
                            {data.patientDemographics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartLegend content={<ChartLegendContent nameKey="gender" />} />
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <ChartEmptyState title="No Demographics Data" description="Patient demographics will appear here" />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Patient Stats Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardContent className="p-6 text-center">
                    <div className="h-10 w-10 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-3">
                      <Activity className="h-5 w-5 text-green-700" />
                    </div>
                    <p className="text-2xl font-bold">
                      {data.patientVisitTrend.reduce((a, b) => a + b.newPatients + b.returningPatients, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Total Patient Visits</p>
                  </CardContent>
                </Card>
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardContent className="p-6 text-center">
                    <div className="h-10 w-10 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-3">
                      <Calendar className="h-5 w-5 text-green-700" />
                    </div>
                    <p className="text-2xl font-bold">
                      {data.patientVisitTrend.reduce((a, b) => a + b.newPatients, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">New Patients</p>
                  </CardContent>
                </Card>
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardContent className="p-6 text-center">
                    <div className="h-10 w-10 mx-auto rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                      <Activity className="h-5 w-5 text-violet-600" />
                    </div>
                    <p className="text-2xl font-bold">
                      {data.patientVisitTrend.reduce((a, b) => a + b.returningPatients, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Returning Patients</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── Doctors Tab ────────────────────────────────────────────── */}
            <TabsContent value="doctors" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patients per Doctor */}
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Patients per Doctor</CardTitle>
                    <CardDescription>Number of patients handled</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {data.doctorPerformance.length > 0 ? (
                      <ChartContainer config={doctorPatientsConfig} className="h-[250px] sm:h-[300px] w-full">
                        <BarChart data={data.doctorPerformance} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                          <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} />
                          <YAxis dataKey="doctorName" type="category" className="text-xs" tickLine={false} axisLine={false} width={120} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="patients" fill="var(--color-patients)" radius={[0, 6, 6, 0]} maxBarSize={24} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <ChartEmptyState title="No Doctor Data" description="Doctor performance will appear here" />
                    )}
                  </CardContent>
                </Card>

                {/* Revenue per Doctor */}
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Revenue per Doctor</CardTitle>
                    <CardDescription>Revenue generated by each doctor</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {data.doctorPerformance.length > 0 ? (
                      <ChartContainer config={doctorRevenueConfig} className="h-[250px] sm:h-[300px] w-full">
                        <BarChart data={data.doctorPerformance} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                          <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <YAxis dataKey="doctorName" type="category" className="text-xs" tickLine={false} axisLine={false} width={120} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 6, 6, 0]} maxBarSize={24} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <ChartEmptyState title="No Doctor Data" description="Doctor revenue will appear here" />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Doctor Performance Table */}
              <Card className="bg-card rounded-xl border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Doctor Performance Summary</CardTitle>
                  <CardDescription>Detailed breakdown of doctor metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-6"><Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold">Doctor</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Patients</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Revenue</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Avg Rating</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Revenue/Patient</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.doctorPerformance.map((doc, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium text-sm">{doc.doctorName}</TableCell>
                          <TableCell className="text-sm text-right">{doc.patients}</TableCell>
                          <TableCell className="text-sm text-right font-mono">{formatBDTFull(doc.revenue)}</TableCell>
                          <TableCell className="text-sm text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-amber-500">★</span>
                              <span>{doc.avgRating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono text-muted-foreground">
                            {formatBDTFull(Math.round(doc.patients > 0 ? doc.revenue / doc.patients : 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Diagnostics Tab ────────────────────────────────────────── */}
            <TabsContent value="diagnostics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Ordered Tests */}
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Most Ordered Tests</CardTitle>
                    <CardDescription>Test ordering frequency</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {data.diagnosticTests.length > 0 ? (
                      <ChartContainer config={testCountConfig} className="h-[280px] sm:h-[350px] w-full">
                        <BarChart data={data.diagnosticTests} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                          <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} />
                          <YAxis dataKey="testName" type="category" className="text-xs" tickLine={false} axisLine={false} width={120} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} maxBarSize={22} />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <ChartEmptyState title="No Test Data" description="Diagnostic test data will appear here" />
                    )}
                  </CardContent>
                </Card>

                {/* Test Revenue Distribution */}
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Test-wise Income</CardTitle>
                    <CardDescription>Revenue from diagnostic tests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[350px]">
                      <div className="overflow-x-auto"><Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs font-semibold">Test Name</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Ordered</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Revenue</TableHead>
                            <TableHead className="text-xs font-semibold text-right">Avg/Test</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.diagnosticTests.map((test, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="text-sm font-medium">{test.testName}</TableCell>
                              <TableCell className="text-sm text-right">
                                <Badge variant="secondary" className="font-mono text-xs">{test.count}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-right font-mono">{formatBDTFull(test.revenue)}</TableCell>
                              <TableCell className="text-sm text-right font-mono text-muted-foreground">
                                {formatBDTFull(Math.round(test.count > 0 ? test.revenue / test.count : 0))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table></div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Diagnostic Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold">{data.diagnosticTests.reduce((a, b) => a + b.count, 0)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Total Tests Ordered</p>
                  </CardContent>
                </Card>
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold">{formatBDT(data.diagnosticTests.reduce((a, b) => a + b.revenue, 0))}</p>
                    <p className="text-sm text-muted-foreground mt-1">Total Diagnostic Revenue</p>
                  </CardContent>
                </Card>
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold">{formatBDTFull(Math.round(data.diagnosticTests.reduce((a, b) => a + b.revenue, 0) / (data.diagnosticTests.reduce((a, b) => a + b.count, 0) || 1)))}</p>
                    <p className="text-sm text-muted-foreground mt-1">Average Revenue per Test</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── Doctor Commissions & Payouts Tab ────────────────────────── */}
            <TabsContent value="commissions" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground font-medium">Total Accrued Commissions</p>
                    <p className="text-2xl font-bold mt-1 text-foreground">{formatBDTFull(commissionsData.summary.totalCommissions)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Calculated consultation & procedure splits</p>
                  </CardContent>
                </Card>
                <Card className="bg-card rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm text-amber-800 font-medium">Pending Doctor Payouts</p>
                    <p className="text-2xl font-bold mt-1 text-amber-900">{formatBDTFull(commissionsData.summary.pendingCommissions)}</p>
                    <p className="text-xs text-amber-700 mt-1">Ready for disbursement</p>
                  </CardContent>
                </Card>
                <Card className="bg-card rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm text-emerald-800 font-medium">Settled / Paid Payouts</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-900">{formatBDTFull(commissionsData.summary.paidCommissions)}</p>
                    <p className="text-xs text-emerald-700 mt-1">Cleared with doctors</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card rounded-xl border shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Doctor Revenue Share Ledger</CardTitle>
                    <CardDescription>Automated calculation of doctor payout splits per service</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchCommissions} className="text-xs h-8 gap-1">
                    <RotateCcw className="size-3.5" /> Refresh
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Doctor</TableHead>
                        <TableHead>Service / Procedure</TableHead>
                        <TableHead className="text-right">Service Bill (৳)</TableHead>
                        <TableHead className="text-right">Share %</TableHead>
                        <TableHead className="text-right font-bold text-emerald-900">Commission Amount (৳)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionsData.commissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No doctor commission records generated yet. Commissions generate automatically from completed consultations.
                          </TableCell>
                        </TableRow>
                      ) : (
                        commissionsData.commissions.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="font-semibold text-sm">{c.doctor?.name || "Doctor"}</div>
                              <div className="text-xs text-muted-foreground">{c.doctor?.specialization || "Consultant"}</div>
                            </TableCell>
                            <TableCell className="text-sm">{c.serviceName}</TableCell>
                            <TableCell className="text-sm text-right font-mono">{formatBDTFull(c.serviceAmount)}</TableCell>
                            <TableCell className="text-sm text-right font-mono font-medium">{c.commissionRate}%</TableCell>
                            <TableCell className="text-sm text-right font-mono font-bold text-emerald-800">
                              {formatBDTFull(c.commissionAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={c.status === "PAID" ? "outline" : "secondary"}
                                className={c.status === "PAID" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800"}
                              >
                                {c.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right text-muted-foreground">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {c.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkCommissionPaid(c.id)}
                                  className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Daily Cash Closing & Reconciliation Tab ──────────────────── */}
            <TabsContent value="cash_closing" className="space-y-6">
              {/* Day-End Live Cash Drawer Reconciliation Card */}
              <Card className="bg-card rounded-xl border border-emerald-200/80 shadow-sm bg-gradient-to-br from-white via-emerald-50/20 to-white">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-semibold text-emerald-950 flex items-center gap-2">
                        <Receipt className="size-5 text-emerald-700" />
                        Today's Cash Drawer Reconciliation & Day Closing
                      </CardTitle>
                      <CardDescription>Verify cash drawer, count physical cash, and record day closing</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 w-fit">
                      Shift Live Tracker
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-white p-3 rounded-lg border shadow-xs">
                      <p className="text-[11px] text-muted-foreground uppercase font-medium">Cash Collected</p>
                      <p className="text-lg font-bold text-foreground mt-1 font-mono">
                        {formatBDTFull(dailyClosingData.liveToday.cashCollected)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border shadow-xs">
                      <p className="text-[11px] text-muted-foreground uppercase font-medium">Card POS</p>
                      <p className="text-lg font-bold text-blue-700 mt-1 font-mono">
                        {formatBDTFull(dailyClosingData.liveToday.cardCollected)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border shadow-xs">
                      <p className="text-[11px] text-muted-foreground uppercase font-medium">bKash/Nagad/Rocket</p>
                      <p className="text-lg font-bold text-pink-700 mt-1 font-mono">
                        {formatBDTFull(dailyClosingData.liveToday.digitalCollected)}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border shadow-xs">
                      <p className="text-[11px] text-muted-foreground uppercase font-medium">Day Expenses Deducted</p>
                      <p className="text-lg font-bold text-red-600 mt-1 font-mono">
                        -{formatBDTFull(dailyClosingData.liveToday.totalExpenses)}
                      </p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 shadow-xs col-span-2 sm:col-span-1">
                      <p className="text-[11px] text-emerald-900 uppercase font-semibold">Expected Cash In Drawer</p>
                      <p className="text-xl font-black text-emerald-800 mt-1 font-mono">
                        {formatBDTFull(dailyClosingData.liveToday.expectedCashInHand)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/40 rounded-xl border grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-xs font-semibold">Actual Physical Cash Counted (৳) *</Label>
                      <Input
                        type="number"
                        step={0.01}
                        placeholder="Counted cash in hand"
                        className="font-mono font-bold"
                        value={countedCash}
                        onChange={(e) => setCountedCash(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-xs">Closing Officer / Staff</Label>
                      <Input
                        value={closingStaff}
                        onChange={(e) => setClosingStaff(e.target.value)}
                        placeholder="Staff Name"
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <Label className="text-xs">Closing Notes (Optional)</Label>
                      <Input
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        placeholder="Drawer notes / discrepancies"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      {(() => {
                        const actual = parseFloat(countedCash) || 0
                        const expected = dailyClosingData.liveToday.expectedCashInHand
                        const diff = actual - expected
                        return (
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-muted-foreground">Drawer Status:</span>
                            <div className="text-xs font-bold">
                              {Math.abs(diff) < 0.01 ? (
                                <Badge className="bg-emerald-600 text-white gap-1"><CheckCircle2 className="size-3" /> Exact Match</Badge>
                              ) : diff > 0 ? (
                                <Badge className="bg-blue-600 text-white gap-1">+৳{diff.toFixed(2)} Surplus</Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">-৳{Math.abs(diff).toFixed(2)} Shortage</Badge>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={handleSaveDailyClosing}
                      disabled={isSubmittingClosing}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
                    >
                      <Receipt className="size-4" />
                      {isSubmittingClosing ? "Closing Shift..." : "Submit Day-End Cash Closing & Shift Reconciliation"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Historical Daily Closings */}
              <Card className="bg-card rounded-xl border shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Daily Closing Audit History</CardTitle>
                    <CardDescription>Official records of day-end cash settlements and variance logs</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchDailyClosing} className="text-xs h-8 gap-1">
                    <RotateCcw className="size-3.5" /> Refresh
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Closing Date</TableHead>
                        <TableHead className="text-right">Total Inflow (৳)</TableHead>
                        <TableHead className="text-right">Cash In Drawer</TableHead>
                        <TableHead className="text-right">Digital Inflow</TableHead>
                        <TableHead className="text-right">Expenses Paid</TableHead>
                        <TableHead className="text-right font-semibold">Expected Cash</TableHead>
                        <TableHead className="text-right font-bold">Actual Counted</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead>Closed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyClosingData.history.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No past daily closings recorded. Complete today's shift reconciliation above to generate your first audit record.
                          </TableCell>
                        </TableRow>
                      ) : (
                        dailyClosingData.history.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="font-medium text-sm">
                              {new Date(h.closingDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatBDTFull(h.totalCollection)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatBDTFull(h.cashInDrawer)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-pink-700">{formatBDTFull(h.digitalCollection)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-red-600">-{formatBDTFull(h.expensesDeducted)}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">{formatBDTFull(h.expectedCash)}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-bold text-emerald-800">{formatBDTFull(h.actualCash)}</TableCell>
                            <TableCell className="text-right">
                              {Math.abs(h.discrepancy) < 0.01 ? (
                                <Badge variant="outline" className="text-emerald-700 border-emerald-300">0.00</Badge>
                              ) : h.discrepancy > 0 ? (
                                <Badge className="bg-blue-100 text-blue-800">+৳{h.discrepancy.toFixed(0)}</Badge>
                              ) : (
                                <Badge variant="destructive">-৳{Math.abs(h.discrepancy).toFixed(0)}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{h.closedBy}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Immutable Audit Trail Tab ───────────────────────────────── */}
            <TabsContent value="audit_trail" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <ShieldCheck className="size-5 text-emerald-700" />
                    Immutable Compliance & Audit Trail
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Cryptographic ledger recording all staff accesses, updates, deletions, and patient file views with IP addresses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={auditModuleFilter} onValueChange={setAuditModuleFilter}>
                    <SelectTrigger className="w-[170px] h-8 text-xs">
                      <SelectValue placeholder="All Modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Modules</SelectItem>
                      <SelectItem value="AUTH">Authentication</SelectItem>
                      <SelectItem value="PATIENTS">Patients</SelectItem>
                      <SelectItem value="APPOINTMENTS">Appointments</SelectItem>
                      <SelectItem value="EMR">EMR & Vitals</SelectItem>
                      <SelectItem value="PRESCRIPTIONS">Prescriptions</SelectItem>
                      <SelectItem value="BILLING">Billing & Refunds</SelectItem>
                      <SelectItem value="DIAGNOSTICS">Diagnostics</SelectItem>
                      <SelectItem value="PHARMACY">Pharmacy</SelectItem>
                      <SelectItem value="BEDS">Daycare & Beds</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={fetchAuditLogs} className="h-8 text-xs gap-1">
                    <RotateCcw className="size-3.5" /> Refresh
                  </Button>
                </div>
              </div>

              <Card className="bg-card rounded-xl border shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                        <TableHead className="whitespace-nowrap">Action</TableHead>
                        <TableHead className="whitespace-nowrap">Module</TableHead>
                        <TableHead>Event Details</TableHead>
                        <TableHead className="whitespace-nowrap">User ID</TableHead>
                        <TableHead className="whitespace-nowrap">IP / Client</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No audit logs matching criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  log.action === "CREATE"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : log.action === "DELETE"
                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                    : log.action === "UPDATE"
                                    ? "bg-blue-100 text-blue-800 border-blue-300"
                                    : "bg-purple-100 text-purple-800 border-purple-300"
                                }`}
                              >
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                                {log.module}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs max-w-md font-medium">
                              {log.details}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {log.userId || "System"}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {log.ipAddress || "127.0.0.1"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
