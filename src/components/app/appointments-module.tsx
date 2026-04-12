'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  XCircle,
  UserX,
  Filter,
  Stethoscope,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
} from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import DoctorSchedulePanel from '@/components/app/doctor-schedule-panel'

// Types
interface AppointmentData {
  id: string
  patientId: string
  doctorId: string
  date: string
  timeSlot: string
  status: string
  type: string
  notes: string | null
  createdAt: string
  patient: {
    id: string
    patientId: string
    name: string
    phone: string
  }
  doctor: {
    id: string
    name: string
    specialization: string | null
    department: string | null
  }
  prescription: unknown | null
}

interface Doctor {
  id: string
  name: string
  specialization: string | null
  department: string | null
}

interface PatientBrief {
  id: string
  patientId: string
  name: string
  phone: string
}

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
]

const STATUS_OPTIONS = ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
const TYPE_OPTIONS = ['CONSULTATION', 'FOLLOW_UP']

function getStatusColor(status: string) {
  switch (status) {
    case 'BOOKED': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'CONFIRMED': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'COMPLETED': return 'bg-green-100 text-green-900 border-green-200'
    case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
    case 'NO_SHOW': return 'bg-gray-100 text-gray-800 border-gray-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export default function AppointmentsModule() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<PatientBrief[]>([])
  const [loading, setLoading] = useState(true)

  // Date navigation
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Filters
  const [doctorFilter, setDoctorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null)

  // Form state
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    timeSlot: '',
    type: 'CONSULTATION',
    notes: '',
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showDoctorScheduleDialog, setShowDoctorScheduleDialog] = useState(false)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('date', format(selectedDate, 'yyyy-MM-dd'))
      if (doctorFilter) params.set('doctorId', doctorFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('type', typeFilter)

      const res = await fetch(`/api/appointments?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setAppointments(data)
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch appointments', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [selectedDate, doctorFilter, statusFilter, typeFilter, toast])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Fetch all patients for dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('/api/patients?limit=1000')
        const data = await res.json()
        if (res.ok) {
          setPatients(data.patients || [])
        }
      } catch {
        // Silently fail
      }
    }
    fetchPatients()
  }, [])

  // Extract unique doctors from appointments
  useEffect(() => {
    const doctorMap = new Map<string, Doctor>()
    appointments.forEach((apt) => {
      if (!doctorMap.has(apt.doctor.id)) {
        doctorMap.set(apt.doctor.id, apt.doctor)
      }
    })
    setDoctors(Array.from(doctorMap.values()))
  }, [appointments])

  // Also fetch all doctors by looking at all appointments (no date filter)
  useEffect(() => {
    const fetchAllDoctors = async () => {
      try {
        const res = await fetch('/api/appointments?limit=1000')
        const data = await res.json()
        if (res.ok) {
          const doctorMap = new Map<string, Doctor>()
          data.forEach((apt: AppointmentData) => {
            if (!doctorMap.has(apt.doctor.id)) {
              doctorMap.set(apt.doctor.id, apt.doctor)
            }
          })
          setDoctors(Array.from(doctorMap.values()))
        }
      } catch {
        // silently fail
      }
    }
    fetchAllDoctors()
  }, [])

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'prev') {
      setSelectedDate((d) => subDays(d, 1))
    } else if (direction === 'next') {
      setSelectedDate((d) => addDays(d, 1))
    } else {
      setSelectedDate(new Date())
    }
  }

  const resetForm = () => {
    setForm({
      patientId: '',
      doctorId: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      timeSlot: '',
      type: 'CONSULTATION',
      notes: '',
    })
    setEditingAppointment(null)
    setPatientSearch('')
  }

  const openAddDialog = () => {
    resetForm()
    setFormOpen(true)
  }

  const openEditDialog = (appointment: AppointmentData) => {
    setEditingAppointment(appointment)
    setForm({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date.split('T')[0],
      timeSlot: appointment.timeSlot,
      type: appointment.type,
      notes: appointment.notes || '',
    })
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.patientId || !form.doctorId || !form.date || !form.timeSlot) {
      toast({
        title: 'Validation Error',
        description: 'Patient, doctor, date, and time slot are required',
        variant: 'destructive',
      })
      return
    }

    setFormSubmitting(true)
    try {
      const url = editingAppointment
        ? `/api/appointments/${editingAppointment.id}`
        : '/api/appointments'
      const method = editingAppointment ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (res.ok) {
        toast({
          title: editingAppointment ? 'Appointment Updated' : 'Appointment Created',
          description: editingAppointment
            ? 'Appointment has been updated successfully.'
            : 'New appointment has been scheduled.',
        })
        setFormOpen(false)
        resetForm()
        fetchAppointments()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save appointment', variant: 'destructive' })
    } finally {
      setFormSubmitting(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast({ title: 'Status Updated', description: `Appointment marked as ${status.replace('_', ' ')}` })
        fetchAppointments()
      } else {
        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  const deleteAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Deleted', description: 'Appointment deleted successfully' })
        fetchAppointments()
      } else {
        toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete appointment', variant: 'destructive' })
    }
  }

  // Group appointments by time slot
  const groupedAppointments = TIME_SLOTS.reduce((acc, slot) => {
    const slotAppointments = appointments.filter((apt) => apt.timeSlot === slot)
    if (slotAppointments.length > 0) {
      acc.push({ timeSlot: slot, appointments: slotAppointments })
    }
    return acc
  }, [] as { timeSlot: string; appointments: AppointmentData[] }[])

  // Doctor schedule: count appointments per doctor for selected date
  const doctorSchedule = doctors.map((doc) => {
    const docAppointments = appointments.filter((apt) => apt.doctorId === doc.id)
    const bookedSlots = docAppointments.length
    const availableSlots = 16 - bookedSlots
    return {
      ...doc,
      bookedSlots,
      availableSlots,
      appointments: docAppointments,
    }
  })

  // Filter patients for search
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch) ||
      p.patientId.toLowerCase().includes(patientSearch.toLowerCase())
  )

  // Status counts
  const statusCounts = {
    BOOKED: appointments.filter((a) => a.status === 'BOOKED').length,
    CONFIRMED: appointments.filter((a) => a.status === 'CONFIRMED').length,
    COMPLETED: appointments.filter((a) => a.status === 'COMPLETED').length,
    CANCELLED: appointments.filter((a) => a.status === 'CANCELLED').length,
    NO_SHOW: appointments.filter((a) => a.status === 'NO_SHOW').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-green-950">Appointment Management</h1>
          <p className="text-muted-foreground">Schedule and manage patient appointments</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDoctorScheduleDialog(true)}
            className="text-green-800 border-green-200"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Doctor Schedule
          </Button>
          <Button onClick={openAddDialog} className="bg-green-700 hover:bg-green-800 text-white">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-bold text-green-950">
                {format(selectedDate, 'EEEE')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
              {isToday(selectedDate) && (
                <Badge className="mt-1 bg-green-100 text-green-900 border-green-200">
                  Today
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="flex justify-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('today')}
              className="text-green-800 hover:text-green-950"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Go to Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_OPTIONS.map((status) => (
          <Card
            key={status}
            className={`cursor-pointer transition-colors ${
              statusFilter === status
                ? 'ring-2 ring-green-600 border-green-300'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{statusCounts[status as keyof typeof statusCounts]}</p>
              <Badge className={`mt-1 text-xs ${getStatusColor(status)}`}>
                {status.replace('_', ' ')}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Filter Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {doctors.length > 0 && (
                  <Select value={doctorFilter} onValueChange={(v) => setDoctorFilter(v === 'ALL' ? '' : v)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <Stethoscope className="mr-2 h-4 w-4" />
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
                )}
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {statusFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter('')}
                    className="text-muted-foreground"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Clear filter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Appointments Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {format(selectedDate, 'MMM d')} Appointments
              </CardTitle>
              <CardDescription>
                {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[100px]">Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead className="hidden md:table-cell">Doctor</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          Loading appointments...
                        </TableCell>
                      </TableRow>
                    ) : appointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          No appointments for this date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      appointments.map((apt) => (
                        <TableRow key={apt.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {apt.timeSlot}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{apt.patient.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {apt.patient.patientId} &middot; {apt.patient.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div>
                              <p className="text-sm font-medium">{apt.doctor.name}</p>
                              {apt.doctor.specialization && (
                                <p className="text-xs text-muted-foreground">{apt.doctor.specialization}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {apt.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${getStatusColor(apt.status)}`}>
                              {apt.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {apt.status === 'BOOKED' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateStatus(apt.id, 'CONFIRMED')}
                                  className="text-yellow-700 hover:text-yellow-900 hover:bg-yellow-50"
                                  title="Confirm"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              {(apt.status === 'BOOKED' || apt.status === 'CONFIRMED') && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateStatus(apt.id, 'COMPLETED')}
                                    className="text-green-800 hover:text-green-950 hover:bg-green-50"
                                    title="Complete"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateStatus(apt.id, 'CANCELLED')}
                                    className="text-red-700 hover:text-red-900 hover:bg-red-50"
                                    title="Cancel"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateStatus(apt.id, 'NO_SHOW')}
                                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                    title="No Show"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedAppointment(apt); setDetailOpen(true) }}
                                className="text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(apt.status === 'BOOKED' || apt.status === 'CONFIRMED') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(apt)}
                                  className="text-orange-700 hover:text-orange-900 hover:bg-orange-50"
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {apt.status === 'CANCELLED' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteAppointment(apt.id)}
                                  className="text-red-700 hover:text-red-900 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
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
        </div>

        {/* Doctor Availability Quick Panel - only when schedule dialog is not open */}
        {!showDoctorScheduleDialog && (
          <div className="w-full lg:w-72 space-y-4">
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Today&apos;s Availability</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-green-700 hover:text-green-900"
                    onClick={() => setShowDoctorScheduleDialog(true)}
                  >
                    Manage
                  </Button>
                </div>
                <CardDescription className="text-xs">Click to filter appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  {doctors.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">No doctors found</p>
                  ) : (
                    <div className="space-y-2">
                      {doctorSchedule.map((doc) => (
                        <div
                          key={doc.id}
                          className={`border rounded-lg p-2.5 transition-colors cursor-pointer ${
                            doctorFilter === doc.id
                              ? 'border-green-300 bg-green-50'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setDoctorFilter(doctorFilter === doc.id ? '' : doc.id)}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="font-medium text-xs">{doc.name}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {doc.specialization || 'General'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <div className="bg-green-50 rounded p-1.5 text-center">
                              <p className="font-bold text-green-800">{doc.bookedSlots}</p>
                              <p className="text-[10px] text-muted-foreground">Booked</p>
                            </div>
                            <div className="bg-blue-50 rounded p-1.5 text-center">
                              <p className="font-bold text-blue-700">{doc.availableSlots}</p>
                              <p className="text-[10px] text-muted-foreground">Available</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Doctor Schedule Management Dialog */}
      <DoctorSchedulePanel
        open={showDoctorScheduleDialog}
        onOpenChange={setShowDoctorScheduleDialog}
      />

      {/* Day View Grouped by Time */}
      {groupedAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Day View</CardTitle>
            <CardDescription>Appointments grouped by time slot</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-4">
                {groupedAppointments.map(({ timeSlot, appointments: slotApts }) => (
                  <div key={timeSlot} className="flex gap-4">
                    <div className="w-24 flex-shrink-0 text-right">
                      <span className="font-mono text-sm font-medium text-green-800">
                        {timeSlot}
                      </span>
                    </div>
                    <div className="flex-1 border-l-2 border-green-200 pl-4 space-y-2">
                      {slotApts.map((apt) => (
                        <div
                          key={apt.id}
                          className="bg-muted/30 rounded-lg p-3 hover:bg-muted/60 transition-colors cursor-pointer"
                          onClick={() => { setSelectedAppointment(apt); setDetailOpen(true) }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{apt.patient.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {apt.doctor.name} &middot; {apt.type.replace('_', ' ')}
                              </p>
                            </div>
                            <Badge className={`text-xs ${getStatusColor(apt.status)}`}>
                              {apt.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* New/Edit Appointment Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-950">
              {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Patient *</Label>
              {editingAppointment ? (
                <Input
                  value={`${editingAppointment.patient.name} (${editingAppointment.patient.patientId})`}
                  disabled
                />
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Search patient by name, phone, or ID..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                  {patientSearch && (
                    <ScrollArea className="max-h-[160px] border rounded-md">
                      <div className="p-1">
                        {filteredPatients.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-2">No patients found</p>
                        ) : (
                          filteredPatients.slice(0, 10).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className={`w-full text-left px-3 py-2 rounded-sm text-sm hover:bg-muted/80 transition-colors ${
                                form.patientId === p.id ? 'bg-green-50 text-green-950' : ''
                              }`}
                              onClick={() => {
                                setForm({ ...form, patientId: p.id })
                                setPatientSearch(`${p.name} (${p.patientId})`)
                              }}
                            >
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.patientId} &middot; {p.phone}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  )}
                  {form.patientId && (
                    <p className="text-xs text-green-800">
                      Selected: {patients.find((p) => p.id === form.patientId)?.name}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label>Doctor *</Label>
              <Select
                value={form.doctorId}
                onValueChange={(v) => setForm({ ...form, doctorId: v })}
              >
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
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {form.date ? format(new Date(form.date), 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI
                    mode="single"
                    selected={form.date ? new Date(form.date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setForm({ ...form, date: format(date, 'yyyy-MM-dd') })
                        setCalendarOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Slot */}
            <div className="space-y-2">
              <Label>Time Slot *</Label>
              <Select
                value={form.timeSlot}
                onValueChange={(v) => setForm({ ...form, timeSlot: v })}
              >
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <div className="grid grid-cols-2 gap-1 p-1">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          form.timeSlot === slot
                            ? 'bg-green-700 text-white'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setForm({ ...form, timeSlot: slot })}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Appointment Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={formSubmitting}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {formSubmitting ? 'Saving...' : editingAppointment ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-green-950">Appointment Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDateStr(selectedAppointment.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-medium font-mono">{selectedAppointment.timeSlot}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Patient</p>
                    <p className="font-medium">{selectedAppointment.patient.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedAppointment.patient.patientId}</p>
                    <p className="text-xs text-muted-foreground">{selectedAppointment.patient.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Doctor</p>
                    <p className="font-medium">{selectedAppointment.doctor.name}</p>
                    {selectedAppointment.doctor.specialization && (
                      <p className="text-xs text-muted-foreground">
                        {selectedAppointment.doctor.specialization}
                      </p>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge variant="outline">{selectedAppointment.type.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedAppointment.status)}>
                      {selectedAppointment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm">{selectedAppointment.notes}</p>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
                {(selectedAppointment.status === 'BOOKED' || selectedAppointment.status === 'CONFIRMED') && (
                  <>
                    <Button
                      variant="outline"
                      className="text-green-800 border-green-200 hover:bg-green-50"
                      onClick={() => {
                        updateStatus(selectedAppointment.id, 'COMPLETED')
                        setDetailOpen(false)
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" /> Complete
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-700 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        updateStatus(selectedAppointment.id, 'CANCELLED')
                        setDetailOpen(false)
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDateStr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
