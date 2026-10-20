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
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="doctors">Doctors</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
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
                  </CardContent>
                </Card>

                {/* Revenue by Service */}
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Revenue by Service</CardTitle>
                    <CardDescription>Distribution across service types</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
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
                  </CardContent>
                </Card>

                {/* Patient Demographics */}
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Patient Demographics</CardTitle>
                    <CardDescription>Gender distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
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
                    <ChartContainer config={doctorPatientsConfig} className="h-[250px] sm:h-[300px] w-full">
                      <BarChart data={data.doctorPerformance} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} />
                        <YAxis dataKey="doctorName" type="category" className="text-xs" tickLine={false} axisLine={false} width={120} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="patients" fill="var(--color-patients)" radius={[0, 6, 6, 0]} maxBarSize={24} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Revenue per Doctor */}
                <Card className="bg-card rounded-xl border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Revenue per Doctor</CardTitle>
                    <CardDescription>Revenue generated by each doctor</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ChartContainer config={doctorRevenueConfig} className="h-[250px] sm:h-[300px] w-full">
                      <BarChart data={data.doctorPerformance} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="doctorName" type="category" className="text-xs" tickLine={false} axisLine={false} width={120} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 6, 6, 0]} maxBarSize={24} />
                      </BarChart>
                    </ChartContainer>
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
                            {formatBDTFull(Math.round(doc.revenue / doc.patients))}
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
                    <ChartContainer config={testCountConfig} className="h-[280px] sm:h-[350px] w-full">
                      <BarChart data={data.diagnosticTests} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} />
                        <YAxis dataKey="testName" type="category" className="text-xs" tickLine={false} axisLine={false} width={120} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} maxBarSize={22} />
                      </BarChart>
                    </ChartContainer>
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
                                {formatBDTFull(Math.round(test.revenue / test.count))}
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
          </Tabs>
        </>
      )}
    </div>
  )
}
