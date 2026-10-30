'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Clock,
  Pencil,
  Trash2,
  Stethoscope,
  CalendarDays,
  Coffee,
  Users,
  DollarSign,
  Copy,
  AlertCircle,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

// Types
interface DoctorScheduleData {
  id: string
  staffId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: number
  maxPatients: number
  isAvailable: boolean
  breakStart: string | null
  breakEnd: string | null
  consultationFee: number
  notes: string | null
  createdAt: string
  updatedAt: string
  doctor: {
    id: string
    name: string
    specialization: string | null
    department: string | null
  }
}

interface StaffDoctor {
  id: string
  name: string
  specialization: string | null
  department: string | null
  isActive: boolean
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
]

function getDayLabel(dayOfWeek: number) {
  return DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label || 'Unknown'
}



function formatTime12h(time24: string) {
  if (!time24) return ''
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
}

function calculateSlots(startTime: string, endTime: string, slotDuration: number, breakStart?: string | null, breakEnd?: string | null): number {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  let totalMinutes = toMinutes(endTime) - toMinutes(startTime)
  if (totalMinutes <= 0) return 0

  if (breakStart && breakEnd) {
    const breakMinutes = toMinutes(breakEnd) - toMinutes(breakStart)
    if (breakMinutes > 0) totalMinutes -= breakMinutes
  }

  return Math.max(0, Math.floor(totalMinutes / slotDuration))
}

interface DoctorSchedulePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DoctorSchedulePanel({ open, onOpenChange }: DoctorSchedulePanelProps) {
  const [schedules, setSchedules] = useState<DoctorScheduleData[]>([])
  const [doctors, setDoctors] = useState<StaffDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [filterDoctor, setFilterDoctor] = useState('ALL')

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<DoctorScheduleData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DoctorScheduleData | null>(null)

  // Form state
  const [form, setForm] = useState({
    staffId: '',
    dayOfWeek: '1',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: '30',
    maxPatients: '1',
    isAvailable: true,
    breakStart: '',
    breakEnd: '',
    consultationFee: '0',
    notes: '',
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [hasBreak, setHasBreak] = useState(false)

  // Bulk copy state
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [copySourceSchedule, setCopySourceSchedule] = useState<DoctorScheduleData | null>(null)
  const [copyTargetDays, setCopyTargetDays] = useState<number[]>([])

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/doctor-schedules')
      if (res.ok) {
        const data = await res.json()
        setSchedules(data)
      }
    } catch {
      toast.error('Failed to fetch doctor schedules')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch('/api/staff?isActive=true')
      if (res.ok) {
        const data = await res.json()
        setDoctors(data)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchSchedules()
      fetchDoctors()
    }
  }, [open, fetchSchedules, fetchDoctors])

  const resetForm = () => {
    setForm({
      staffId: '',
      dayOfWeek: '1',
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: '30',
      maxPatients: '1',
      isAvailable: true,
      breakStart: '',
      breakEnd: '',
      consultationFee: '0',
      notes: '',
    })
    setHasBreak(false)
    setEditingSchedule(null)
  }

  const openAddDialog = () => {
    resetForm()
    setShowAddDialog(true)
  }

  const openEditDialog = (schedule: DoctorScheduleData) => {
    setEditingSchedule(schedule)
    setForm({
      staffId: schedule.staffId,
      dayOfWeek: String(schedule.dayOfWeek),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDuration: String(schedule.slotDuration),
      maxPatients: String(schedule.maxPatients),
      isAvailable: schedule.isAvailable,
      breakStart: schedule.breakStart || '',
      breakEnd: schedule.breakEnd || '',
      consultationFee: String(schedule.consultationFee),
      notes: schedule.notes || '',
    })
    setHasBreak(!!schedule.breakStart && !!schedule.breakEnd)
    setShowAddDialog(true)
  }

  const openCopyDialog = (schedule: DoctorScheduleData) => {
    setCopySourceSchedule(schedule)
    // Pre-filter: only show days that don't already have a schedule for this doctor
    const existingDays = schedules
      .filter((s) => s.staffId === schedule.staffId)
      .map((s) => s.dayOfWeek)
    setCopyTargetDays([])
    setCopyTargetDays(DAYS_OF_WEEK
      .filter((d) => d.value !== schedule.dayOfWeek && !existingDays.includes(d.value))
      .map((d) => d.value))
    setShowCopyDialog(true)
  }

  const handleSubmit = async () => {
    if (!form.staffId || !form.dayOfWeek || !form.startTime || !form.endTime) {
      toast.error('Doctor, day, start time, and end time are required')
      return
    }

    if (form.startTime >= form.endTime) {
      toast.error('End time must be after start time')
      return
    }

    if (hasBreak && form.breakStart && form.breakEnd) {
      if (form.breakStart >= form.breakEnd) {
        toast.error('Break end time must be after break start time')
        return
      }
    }

    setFormSubmitting(true)
    try {
      const payload = {
        staffId: form.staffId,
        dayOfWeek: parseInt(form.dayOfWeek, 10),
        startTime: form.startTime,
        endTime: form.endTime,
        slotDuration: parseInt(form.slotDuration, 10),
        maxPatients: parseInt(form.maxPatients, 10),
        isAvailable: form.isAvailable,
        breakStart: hasBreak ? form.breakStart || null : null,
        breakEnd: hasBreak ? form.breakEnd || null : null,
        consultationFee: parseFloat(form.consultationFee),
        notes: form.notes || null,
      }

      const url = editingSchedule
        ? `/api/doctor-schedules/${editingSchedule.id}`
        : '/api/doctor-schedules'
      const method = editingSchedule ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success(editingSchedule ? 'Schedule updated successfully' : 'Schedule created successfully')
        setShowAddDialog(false)
        resetForm()
        fetchSchedules()
      } else {
        toast.error(data.error || 'Failed to save schedule')
      }
    } catch {
      toast.error('Failed to save schedule')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/doctor-schedules/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Schedule deleted successfully')
        setDeleteTarget(null)
        fetchSchedules()
      } else {
        toast.error('Failed to delete schedule')
      }
    } catch {
      toast.error('Failed to delete schedule')
    }
  }

  const handleToggleAvailability = async (schedule: DoctorScheduleData) => {
    try {
      const res = await fetch(`/api/doctor-schedules/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !schedule.isAvailable }),
      })
      if (res.ok) {
        toast.success(`Schedule ${schedule.isAvailable ? 'disabled' : 'enabled'}`)
        fetchSchedules()
      }
    } catch {
      toast.error('Failed to update schedule')
    }
  }

  const handleCopySchedule = async () => {
    if (!copySourceSchedule || copyTargetDays.length === 0) {
      toast.error('Select at least one day to copy to')
      return
    }

    const results: Array<{ day: number; success: boolean; error?: unknown }> = []
    for (const day of copyTargetDays) {
      try {
        const res = await fetch('/api/doctor-schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId: copySourceSchedule.staffId,
            dayOfWeek: day,
            startTime: copySourceSchedule.startTime,
            endTime: copySourceSchedule.endTime,
            slotDuration: copySourceSchedule.slotDuration,
            maxPatients: copySourceSchedule.maxPatients,
            isAvailable: copySourceSchedule.isAvailable,
            breakStart: copySourceSchedule.breakStart,
            breakEnd: copySourceSchedule.breakEnd,
            consultationFee: copySourceSchedule.consultationFee,
            notes: copySourceSchedule.notes,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          results.push({ day, success: true })
        } else {
          results.push({ day, success: false, error: data.error })
        }
      } catch {
        results.push({ day, success: false, error: 'Failed' })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.length - successCount
    if (failCount === 0) {
      toast.success(`Copied schedule to ${successCount} day(s)`)
    } else if (successCount > 0) {
      toast.warning(`Copied to ${successCount} day(s), ${failCount} skipped (already exist)`)
    } else {
      toast.error('Could not copy schedule — all target days already have schedules')
    }
    setShowCopyDialog(false)
    fetchSchedules()
  }

  // Filtered schedules
  const filteredSchedules = filterDoctor === 'ALL'
    ? schedules
    : schedules.filter((s) => s.staffId === filterDoctor)

  // Group schedules by doctor for calendar view
  const schedulesByDoctor = doctors
    .filter((doc) => schedules.some((s) => s.staffId === doc.id))
    .map((doc) => {
      const docSchedules = schedules.filter((s) => s.staffId === doc.id)
      return { doctor: doc, schedules: docSchedules }
    })

  // Sort for list view
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    if (a.doctor.name !== b.doctor.name) return a.doctor.name.localeCompare(b.doctor.name)
    return a.dayOfWeek - b.dayOfWeek
  })

  const activeSchedules = filteredSchedules.filter((s) => s.isAvailable)
  const daysWithSchedule = new Set(activeSchedules.map((s) => s.staffId + '-' + s.dayOfWeek)).size
  const totalSlotsPerDay = daysWithSchedule > 0
    ? Math.round(
        activeSchedules.reduce((total, s) => {
          return total + calculateSlots(s.startTime, s.endTime, s.slotDuration, s.breakStart, s.breakEnd) * s.maxPatients
        }, 0) / daysWithSchedule
      )
    : 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl text-green-950 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-green-700" />
                  Doctor Schedule Management
                </DialogTitle>
                <DialogDescription>
                  Configure doctor availability, time slots, and consultation hours
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted rounded-lg p-0.5">
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setViewMode('calendar')}
                  >
                    Calendar
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </Button>
                </div>
                <Button onClick={openAddDialog} size="sm" className="bg-green-700 hover:bg-green-800">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Schedule
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pb-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-green-800">
                    {schedulesByDoctor.length}
                  </p>
                  <p className="text-xs text-green-700">Active Doctors</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-blue-800">
                    {schedules.filter((s) => s.isAvailable).length}
                  </p>
                  <p className="text-xs text-blue-700">Active Schedules</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-amber-800">
                    {totalSlotsPerDay}
                  </p>
                  <p className="text-xs text-amber-700">Daily Capacity</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-purple-800">
                    {schedules.filter((s) => !s.isAvailable).length}
                  </p>
                  <p className="text-xs text-purple-700">Disabled</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter */}
            {doctors.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                <Select value={filterDoctor} onValueChange={(v) => setFilterDoctor(v)}>
                  <SelectTrigger className="w-[200px] h-8 text-sm">
                    <SelectValue placeholder="All Doctors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Doctors</SelectItem>
                    {doctors.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="size-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  Loading schedules...
                </div>
              </div>
            ) : schedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <CalendarDays className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No Schedules Yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Start by adding doctor schedules to manage their availability and time slots.
                </p>
                <Button onClick={openAddDialog} className="bg-green-700 hover:bg-green-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Schedule
                </Button>
              </div>
            ) : viewMode === 'calendar' ? (
              /* Calendar View - Weekly Grid */
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {schedulesByDoctor
                    .filter((d) => filterDoctor === 'ALL' || d.doctor.id === filterDoctor)
                    .map(({ doctor, schedules: docSchedules }) => (
                    <Card key={doctor.id} className="overflow-hidden">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-green-100 flex items-center justify-center">
                              <Stethoscope className="h-4 w-4 text-green-700" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-semibold">{doctor.name}</CardTitle>
                              {doctor.specialization && (
                                <CardDescription className="text-xs">{doctor.specialization}</CardDescription>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {docSchedules.filter((s) => s.isAvailable).length} active day(s)
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="overflow-x-auto">
                          <div className="grid grid-cols-7 gap-1 min-w-[500px]">
                            {DAYS_OF_WEEK.map((day) => {
                              const daySchedule = docSchedules.find((s) => s.dayOfWeek === day.value)
                              const isToday = new Date().getDay() === day.value
                              return (
                                <div
                                  key={day.value}
                                  className={`rounded-lg border p-2 text-center transition-colors ${
                                    isToday ? 'ring-2 ring-green-400 bg-green-50/50 border-green-300' : 'hover:bg-muted/50'
                                  } ${daySchedule?.isAvailable ? 'bg-white border-green-200' : 'bg-muted/30 border-muted'}`}
                                >
                                  <p className={`text-xs font-medium mb-1 ${isToday ? 'text-green-800' : 'text-muted-foreground'}`}>
                                    {day.short}
                                  </p>
                                  {daySchedule ? (
                                    <div className="space-y-1">
                                      <div className="text-[10px] font-mono font-medium text-green-800">
                                        {formatTime12h(daySchedule.startTime)}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground">
                                        ↓
                                      </div>
                                      <div className="text-[10px] font-mono font-medium text-green-800">
                                        {formatTime12h(daySchedule.endTime)}
                                      </div>
                                      <Separator className="my-1" />
                                      <div className="text-[10px] text-muted-foreground">
                                        {calculateSlots(
                                          daySchedule.startTime,
                                          daySchedule.endTime,
                                          daySchedule.slotDuration,
                                          daySchedule.breakStart,
                                          daySchedule.breakEnd
                                        )} slots
                                      </div>
                                      {daySchedule.consultationFee > 0 && (
                                        <div className="text-[10px] font-medium text-amber-700">
                                          ৳{daySchedule.consultationFee}
                                        </div>
                                      )}
                                      {!daySchedule.isAvailable && (
                                        <Badge variant="outline" className="text-[8px] px-1 py-0 text-red-500 border-red-200 bg-red-50">
                                          OFF
                                        </Badge>
                                      )}
                                      <div className="flex justify-center gap-0.5 mt-1">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); openEditDialog(daySchedule) }}
                                          className="size-5 rounded flex items-center justify-center hover:bg-green-100 text-muted-foreground hover:text-green-700"
                                          title="Edit"
                                        >
                                          <Pencil className="size-3" />
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); openCopyDialog(daySchedule) }}
                                          className="size-5 rounded flex items-center justify-center hover:bg-blue-100 text-muted-foreground hover:text-blue-700"
                                          title="Copy to other days"
                                        >
                                          <Copy className="size-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-muted-foreground/50 py-3">
                                      —
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              /* List View - Table */
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-green-50/50">
                          <TableHead className="whitespace-nowrap">Doctor</TableHead>
                          <TableHead className="whitespace-nowrap">Day</TableHead>
                          <TableHead className="whitespace-nowrap">Hours</TableHead>
                          <TableHead className="whitespace-nowrap hidden sm:table-cell">Break</TableHead>
                          <TableHead className="whitespace-nowrap hidden md:table-cell">Slot</TableHead>
                          <TableHead className="whitespace-nowrap hidden md:table-cell">Capacity</TableHead>
                          <TableHead className="whitespace-nowrap hidden sm:table-cell">Fee</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedSchedules.map((schedule) => {
                          const slots = calculateSlots(
                            schedule.startTime,
                            schedule.endTime,
                            schedule.slotDuration,
                            schedule.breakStart,
                            schedule.breakEnd
                          )
                          const totalCapacity = slots * schedule.maxPatients
                          return (
                            <TableRow
                              key={schedule.id}
                              className={!schedule.isAvailable ? 'opacity-50' : 'hover:bg-muted/50'}
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{schedule.doctor.name}</p>
                                  {schedule.doctor.specialization && (
                                    <p className="text-xs text-muted-foreground">{schedule.doctor.specialization}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {getDayLabel(schedule.dayOfWeek)}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {formatTime12h(schedule.startTime)} - {formatTime12h(schedule.endTime)}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                {schedule.breakStart && schedule.breakEnd ? (
                                  <div className="flex items-center gap-1">
                                    <Coffee className="size-3" />
                                    {formatTime12h(schedule.breakStart)} - {formatTime12h(schedule.breakEnd)}
                                  </div>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm">
                                <div className="flex items-center gap-1">
                                  <Timer className="size-3 text-muted-foreground" />
                                  {schedule.slotDuration} min
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm">
                                <div className="flex items-center gap-1">
                                  <Users className="size-3 text-muted-foreground" />
                                  {slots} × {schedule.maxPatients} = {totalCapacity}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {schedule.consultationFee > 0 ? (
                                  <div className="flex items-center gap-1 text-sm font-medium text-green-800">
                                    <DollarSign className="size-3" />
                                    ৳{schedule.consultationFee}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Free</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={schedule.isAvailable}
                                  onCheckedChange={() => handleToggleAvailability(schedule)}
                                  className="scale-75"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-orange-700 hover:text-orange-900 hover:bg-orange-50"
                                    onClick={() => openEditDialog(schedule)}
                                    title="Edit"
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                                    onClick={() => openCopyDialog(schedule)}
                                    title="Copy to other days"
                                  >
                                    <Copy className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-700 hover:text-red-900 hover:bg-red-50"
                                    onClick={() => setDeleteTarget(schedule)}
                                    title="Delete"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Schedule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { setShowAddDialog(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-950">
              {editingSchedule ? 'Edit Schedule' : 'Add Doctor Schedule'}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule
                ? 'Update the doctor\'s weekly schedule'
                : 'Set up a new schedule for a doctor\'s working day'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label>Doctor *</Label>
              {editingSchedule ? (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Stethoscope className="h-4 w-4 text-green-700" />
                  <span className="text-sm font-medium">{editingSchedule.doctor.name}</span>
                  {editingSchedule.doctor.specialization && (
                    <Badge variant="outline" className="text-xs">{editingSchedule.doctor.specialization}</Badge>
                  )}
                </div>
              ) : (
                <Select value={form.staffId} onValueChange={(v) => setForm({ ...form, staffId: v })}>
                  <SelectTrigger>
                    <Stethoscope className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Day of Week */}
            <div className="space-y-2">
              <Label>Day of Week *</Label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                      form.dayOfWeek === String(day.value)
                        ? 'bg-green-700 text-white font-medium'
                        : 'hover:bg-muted border'
                    }`}
                    onClick={() => setForm({ ...form, dayOfWeek: String(day.value) })}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Slot Duration & Max Patients */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Slot Duration (min)</Label>
                <Select value={form.slotDuration} onValueChange={(v) => setForm({ ...form, slotDuration: v })}>
                  <SelectTrigger>
                    <Timer className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Patients / Slot</Label>
                <Select value={form.maxPatients} onValueChange={(v) => setForm({ ...form, maxPatients: v })}>
                  <SelectTrigger>
                    <Users className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 patient</SelectItem>
                    <SelectItem value="2">2 patients</SelectItem>
                    <SelectItem value="3">3 patients</SelectItem>
                    <SelectItem value="4">4 patients</SelectItem>
                    <SelectItem value="5">5 patients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Slot Preview */}
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <AlertCircle className="size-3.5" />
                  <span>Schedule Preview</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-50 rounded p-2">
                    <p className="font-bold text-green-800">
                      {calculateSlots(
                        form.startTime,
                        form.endTime,
                        parseInt(form.slotDuration) || 30,
                        hasBreak ? form.breakStart || null : null,
                        hasBreak ? form.breakEnd || null : null
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Time Slots</p>
                  </div>
                  <div className="bg-blue-50 rounded p-2">
                    <p className="font-bold text-blue-800">
                      {(calculateSlots(
                        form.startTime,
                        form.endTime,
                        parseInt(form.slotDuration) || 30,
                        hasBreak ? form.breakStart || null : null,
                        hasBreak ? form.breakEnd || null : null
                      ) * parseInt(form.maxPatients) || 1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Daily Capacity</p>
                  </div>
                  <div className="bg-amber-50 rounded p-2">
                    <p className="font-bold text-amber-800">
                      {formatTime12h(form.startTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">First Slot</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Break Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Coffee className="h-4 w-4 text-amber-600" />
                  Break Time
                </Label>
                <Switch checked={hasBreak} onCheckedChange={setHasBreak} />
              </div>
              {hasBreak && (
                <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-amber-200">
                  <div className="space-y-1">
                    <Label className="text-xs">Break Start</Label>
                    <Input
                      type="time"
                      value={form.breakStart}
                      onChange={(e) => setForm({ ...form, breakStart: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Break End</Label>
                    <Input
                      type="time"
                      value={form.breakEnd}
                      onChange={(e) => setForm({ ...form, breakEnd: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Consultation Fee */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-green-700" />
                Consultation Fee
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={form.consultationFee}
                  onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                  className="pl-7"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes about this schedule..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm() }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={formSubmitting}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {formSubmitting ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Add Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Schedule Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-green-950">Copy Schedule to Other Days</DialogTitle>
            <DialogDescription>
              Copy {copySourceSchedule && `${formatTime12h(copySourceSchedule.startTime)} - ${formatTime12h(copySourceSchedule.endTime)} on ${getDayLabel(copySourceSchedule?.dayOfWeek || 0)}`} to other days for{' '}
              <strong>{copySourceSchedule?.doctor.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {(() => {
              const existingDays = schedules
                .filter((s) => s.staffId === copySourceSchedule?.staffId)
                .map((s) => s.dayOfWeek)
              const availableDays = DAYS_OF_WEEK.filter(
                (d) => d.value !== copySourceSchedule?.dayOfWeek && !existingDays.includes(d.value)
              )
              if (availableDays.length === 0) {
                return (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">This doctor already has schedules on all other days.</p>
                    <p className="text-xs mt-1">Edit existing schedules individually.</p>
                  </div>
                )
              }
              return (
                <>
                  <Label className="text-sm mb-3 block">Select target days:</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableDays.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        className={`px-3 py-2 text-sm rounded-md transition-colors border ${
                          copyTargetDays.includes(day.value)
                            ? 'bg-green-700 text-white border-green-700 font-medium'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => {
                          if (copyTargetDays.includes(day.value)) {
                            setCopyTargetDays(copyTargetDays.filter((d) => d !== day.value))
                          } else {
                            setCopyTargetDays([...copyTargetDays, day.value])
                          }
                        }}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </>
              )
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCopySchedule}
              className="bg-green-700 hover:bg-green-800"
              disabled={copyTargetDays.length === 0}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy to {copyTargetDays.length} Day(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the schedule for{' '}
              <strong>{deleteTarget?.doctor.name}</strong> on{' '}
              <strong>{deleteTarget ? getDayLabel(deleteTarget.dayOfWeek) : ''}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
