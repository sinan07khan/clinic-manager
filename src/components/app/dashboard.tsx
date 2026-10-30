'use client'

import { useEffect, useState } from 'react'
import {
  CalendarCheck,
  Users,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Clock,
  UserCheck,
  Activity,
  Inbox,
  CheckCircle2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
  todayAppointments: number
  todayPatients: number
  todayRevenue: number
  todayExpenses: number
}

interface RecentAppointment {
  id: string
  patientName: string
  doctorName: string
  time: string
  status: 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  type: string
}

interface LowStockItem {
  id: string
  name: string
  category: string
  quantity: number
  minStock: number
}

interface DoctorAttendance {
  id: string
  doctorName: string
  department: string
  specialization: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'HALF_DAY'
  checkIn?: string
}

interface UpcomingAppointment {
  id: string
  patientName: string
  doctorName: string
  date: string
  time: string
  type: string
}

interface WeeklyRevenue {
  day: string
  revenue: number
}

interface DepartmentVisits {
  department: string
  visits: number
}

interface AppointmentStatus {
  status: string
  count: number
  fill: string
}

interface DashboardData {
  stats: DashboardStats
  recentAppointments: RecentAppointment[]
  lowStockItems: LowStockItem[]
  doctorAttendance: DoctorAttendance[]
  upcomingAppointments: UpcomingAppointment[]
  weeklyRevenue: WeeklyRevenue[]
  departmentVisits: DepartmentVisits[]
  appointmentStatus: AppointmentStatus[]
}

// ─── Empty State Data ────────────────────────────────────────────────────────

const emptyData: DashboardData = {
  stats: {
    todayAppointments: 0,
    todayPatients: 0,
    todayRevenue: 0,
    todayExpenses: 0,
  },
  recentAppointments: [],
  lowStockItems: [],
  doctorAttendance: [],
  upcomingAppointments: [],
  weeklyRevenue: Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), revenue: 0 }
  }),
  departmentVisits: [],
  appointmentStatus: [],
}

// ─── Chart Configs ───────────────────────────────────────────────────────────

const revenueChartConfig: ChartConfig = {
  revenue: {
    label: 'Revenue (BDT)',
    color: 'oklch(0.522 0.223 25)',
  },
}

const departmentChartConfig: ChartConfig = {
  visits: {
    label: 'Patient Visits',
    color: 'oklch(0.723 0.219 149.579)',
  },
}

const appointmentChartConfig: ChartConfig = {
  completed: {
    label: 'Completed',
    color: 'oklch(0.522 0.223 25)',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'oklch(0.533 0.141 145)',
  },
  booked: {
    label: 'Booked',
    color: 'oklch(0.778 0.138 145)',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'oklch(0.577 0.245 27.325)',
  },
  noshow: {
    label: 'No Show',
    color: 'oklch(0.556 0 0)',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Completed</Badge>
    case 'CONFIRMED':
      return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200">Confirmed</Badge>
    case 'BOOKED':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Booked</Badge>
    case 'CANCELLED':
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Cancelled</Badge>
    case 'NO_SHOW':
      return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200">No Show</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getAttendanceBadge(status: string) {
  switch (status) {
    case 'PRESENT':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Present</Badge>
    case 'ABSENT':
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Absent</Badge>
    case 'LATE':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Late</Badge>
    case 'LEAVE':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">On Leave</Badge>
    case 'HALF_DAY':
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">Half Day</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString('en-BD')}`
}

// ─── Empty State Component ───────────────────────────────────────────────────

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Inbox className="size-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(emptyData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const json = await res.json()
          if (json.data) {
            setData({
              stats: { ...emptyData.stats, ...(json.data?.stats ?? {}) },
              weeklyRevenue: json.data?.weeklyRevenue ?? emptyData.weeklyRevenue,
              recentAppointments: json.data?.recentAppointments ?? [],
              lowStockItems: json.data?.lowStockItems ?? [],
              doctorAttendance: json.data?.doctorAttendance ?? [],
              upcomingAppointments: json.data?.upcomingAppointments ?? [],
              departmentVisits: json.data?.departmentVisits ?? [],
              appointmentStatus: json.data?.appointmentStatus ?? [],
            })
          }
        }
      } catch {
        // Keep empty data
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-[120px] bg-muted/30" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-[350px] bg-muted/30" />
          ))}
        </div>
      </div>
    )
  }

  const isEmpty = data.stats.todayAppointments === 0 &&
    data.stats.todayPatients === 0 &&
    data.stats.todayRevenue === 0 &&
    data.recentAppointments.length === 0 &&
    data.lowStockItems.length === 0 &&
    data.doctorAttendance.length === 0 &&
    data.upcomingAppointments.length === 0 &&
    data.departmentVisits.length === 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Overview of your clinic operations today</p>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Today&apos;s Appointments</p>
                <p className="text-3xl font-bold">{data.stats.todayAppointments}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CalendarCheck className="h-6 w-6 text-green-700" />
              </div>
            </div>
            {data.stats.todayAppointments > 0 && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-600" />
                <span className="text-green-700 font-medium">Active today</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Today&apos;s Patients</p>
                <p className="text-3xl font-bold">{data.stats.todayPatients}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-700" />
              </div>
            </div>
            {data.stats.todayPatients > 0 && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-600" />
                <span className="text-green-700 font-medium">Active today</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Today&apos;s Revenue</p>
                <p className="text-3xl font-bold">{formatBDT(data.stats.todayRevenue)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            {data.stats.todayRevenue > 0 && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Activity className="h-3 w-3 text-green-600" />
                <span className="text-green-700 font-medium">Collected today</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Today&apos;s Expenses</p>
                <p className="text-3xl font-bold">{formatBDT(data.stats.todayExpenses)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-rose-600" />
              </div>
            </div>
            {data.stats.todayExpenses > 0 && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-rose-500" />
                <span className="text-rose-600 font-medium">Spent today</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Welcome Banner for empty state ───────────────────────────────── */}
      {isEmpty && (
        <Card className="bg-gradient-to-r from-green-50 to-green-100/50 border-green-200/50 rounded-xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-green-900">Welcome to Clinic Manager!</h3>
                <p className="text-sm text-green-700/80">
                  Your system is set up and ready. Start by adding patients, staff members, and inventory items
                  using the navigation menu. All modules are accessible from your dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Charts Section ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Trend */}
        <Card className="bg-card rounded-xl border shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Weekly Revenue Trend</CardTitle>
            <CardDescription>Revenue for the last 7 days (BDT)</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {data.weeklyRevenue.some((d) => d.revenue > 0) ? (
              <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                <LineChart data={data.weeklyRevenue} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: 'var(--color-revenue)' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <EmptyState title="No Revenue Data" description="Revenue data will appear here once payments are recorded" />
            )}
          </CardContent>
        </Card>

        {/* Appointment Status Distribution */}
        <Card className="bg-card rounded-xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Appointment Status</CardTitle>
            <CardDescription>Today&apos;s distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {data.appointmentStatus.length > 0 ? (
              <ChartContainer config={appointmentChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                  <Pie
                    data={data.appointmentStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    strokeWidth={2}
                    stroke="white"
                  >
                    {data.appointmentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyState title="No Appointments" description="Appointment data will appear here once appointments are scheduled" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Visits Chart */}
      <Card className="bg-card rounded-xl border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Patient Visits by Department</CardTitle>
          <CardDescription>This week&apos;s department-wise visits</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {data.departmentVisits.length > 0 ? (
            <ChartContainer config={departmentChartConfig} className="h-[250px] sm:h-[300px] w-full">
              <BarChart data={data.departmentVisits} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="department" className="text-xs" tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={60} interval={0} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="visits" fill="var(--color-visits)" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState title="No Department Data" description="Department visit data will appear as patients are seen" />
          )}
        </CardContent>
      </Card>

      {/* ── Bottom Grid: Recent Activity + Low Stock + Upcoming ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <Card className="bg-card rounded-xl border shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <CardDescription>Last 5 appointments</CardDescription>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {data.recentAppointments.length > 0 ? (
              <div className="overflow-x-auto -mx-6"><Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Patient</TableHead>
                    <TableHead className="text-xs font-semibold">Doctor</TableHead>
                    <TableHead className="text-xs font-semibold">Time</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentAppointments.map((apt) => (
                    <TableRow key={apt.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium text-sm">{apt.patientName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{apt.doctorName}</TableCell>
                      <TableCell className="text-sm">{apt.time}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {apt.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(apt.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            ) : (
              <EmptyState title="No Recent Appointments" description="Recent appointment activity will be displayed here" />
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="bg-card rounded-xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Low Stock Alerts</CardTitle>
                <CardDescription>Items below minimum stock</CardDescription>
              </div>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent>
            {data.lowStockItems.length > 0 ? (
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {data.lowStockItems.map((item) => (
                    <div key={item.id} className="flex flex-col gap-1.5 p-3 rounded-lg bg-rose-50/50 border border-rose-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 text-[10px]">
                          {item.quantity} / {item.minStock}
                        </Badge>
                      </div>
                      <Progress value={(item.quantity / item.minStock) * 100} className="h-1.5 [&>[data-slot=progress-indicator]]:bg-rose-500" />
                      <p className="text-[10px] text-muted-foreground capitalize">{item.category.toLowerCase()}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState title="All Stock Levels OK" description="No items are below minimum stock level" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Doctor Attendance + Upcoming Appointments ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Attendance Today */}
        <Card className="bg-card rounded-xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Doctor Attendance Today</CardTitle>
                <CardDescription>Current attendance status</CardDescription>
              </div>
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {data.doctorAttendance.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.doctorAttendance.map((doc) => (
                  <div key={doc.id} className="flex flex-col gap-1.5 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{doc.doctorName}</span>
                      {getAttendanceBadge(doc.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{doc.department}</p>
                    {doc.checkIn && (
                      <p className="text-xs text-muted-foreground">Checked in: {doc.checkIn}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No Attendance Records" description="Doctor attendance will appear here once checked in" />
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="bg-card rounded-xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Upcoming Appointments</CardTitle>
                <CardDescription>Next 5 scheduled appointments</CardDescription>
              </div>
              <CalendarCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {data.upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-800 font-bold text-xs">
                      {apt.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground truncate">{apt.doctorName}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {apt.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No Upcoming Appointments" description="Scheduled appointments will appear here" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
