'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Droplets,
  Calendar,
  FileText,
  Heart,
  Activity,
  X,
  QrCode,
  Printer,
  Zap,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

// Types
interface Patient {
  id: string
  patientId: string
  name: string
  email: string | null
  phone: string
  dateOfBirth: string | null
  gender: string | null
  bloodGroup: string | null
  address: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  createdAt: string
  updatedAt: string
}

interface PatientDetail extends Patient {
  appointments: Appointment[]
  prescriptions: Prescription[]
  labReports: LabReport[]
  invoices: Invoice[]
}

interface Appointment {
  id: string
  date: string
  timeSlot: string
  status: string
  type: string
  notes: string | null
  doctor: { name: string; specialization: string | null; department: string | null }
}

interface Prescription {
  id: string
  symptoms: string | null
  diagnosis: string | null
  medicines: string | null
  notes: string | null
  createdAt: string
  doctor: { name: string; specialization: string | null }
}

interface LabReport {
  id: string
  reportNo: string
  status: string
  createdAt: string
  testType: { name: string; category: string | null }
  technician: { name: string } | null
}

interface Invoice {
  id: string
  invoiceNo: string
  totalAmount: number
  discount: number
  netAmount: number
  status: string
  createdAt: string
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = ['MALE', 'FEMALE', 'OTHER']
const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
]

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

function getLabStatusColor(status: string) {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'PROCESSING': return 'bg-blue-100 text-blue-800'
    case 'COMPLETED': return 'bg-green-100 text-green-900'
    case 'REVIEWED': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getInvoiceStatusColor(status: string) {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-900'
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function calculateAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return 'N/A'
  const dob = new Date(dateOfBirth)
  const today = new Date()
  const age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    return `${age - 1} years`
  }
  return `${age} years`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// QR-like visual component for patient ID
function PatientQRCode({ patientId }: { patientId: string }) {
  // Generate a simple visual representation
  const hash = patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const cells: boolean[][] = []
  for (let i = 0; i < 11; i++) {
    const row: boolean[] = []
    for (let j = 0; j < 11; j++) {
      row.push(((i * 11 + j + hash) * 7) % 3 !== 0)
    }
    cells.push(row)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="border-4 border-green-700 p-2 bg-white rounded-lg">
        <div className="grid grid-cols-11 gap-px">
          {cells.flat().map((filled, i) => (
            <div
              key={i}
              className={`w-3 h-3 ${filled ? 'bg-green-950' : 'bg-white'}`}
            />
          ))}
        </div>
      </div>
      <p className="text-sm font-mono font-bold text-green-900">{patientId}</p>
      <p className="text-xs text-muted-foreground">Patient ID</p>
      {/* UHID Barcode / QR Code Smart ID Card Modal */}
      <Dialog open={uhidCardOpen} onOpenChange={setUhidCardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <QrCode className="h-5 w-5 text-purple-600" />
              Patient UHID Health ID Card
            </DialogTitle>
            <DialogDescription className="text-xs">
              Instant history retrieval card with barcode and digital QR code.
            </DialogDescription>
          </DialogHeader>

          {uhidPatient && (
            <div className="p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-white/20 space-y-4">
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center font-bold text-emerald-400">
                    CM
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">CLINIC MANAGER</h3>
                    <p className="text-[10px] text-white/60">Digital Healthcare Health Card</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500 text-white text-[10px] font-mono border-0">
                  UHID: {uhidPatient.patientId}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold text-white shrink-0">
                  {uhidPatient.name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold text-base text-white">{uhidPatient.name}</h4>
                  <p className="text-white/70">Phone: {uhidPatient.phone}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-[10px] text-red-300 border-red-400/40 bg-red-950/40">
                      Blood: {uhidPatient.bloodGroup || 'O+'}
                    </Badge>
                    <span className="text-[10px] text-white/60">Gender: {uhidPatient.gender || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Barcode & QR Code Section */}
              <div className="bg-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 text-slate-950">
                {/* SVG Barcode Representation */}
                <div className="h-10 w-full flex items-center justify-center px-4">
                  <svg className="w-full h-8" viewBox="0 0 200 40">
                    <rect x="0" y="0" width="4" height="40" fill="black" />
                    <rect x="8" y="0" width="2" height="40" fill="black" />
                    <rect x="14" y="0" width="6" height="40" fill="black" />
                    <rect x="24" y="0" width="2" height="40" fill="black" />
                    <rect x="30" y="0" width="4" height="40" fill="black" />
                    <rect x="38" y="0" width="2" height="40" fill="black" />
                    <rect x="44" y="0" width="6" height="40" fill="black" />
                    <rect x="54" y="0" width="4" height="40" fill="black" />
                    <rect x="62" y="0" width="2" height="40" fill="black" />
                    <rect x="68" y="0" width="8" height="40" fill="black" />
                    <rect x="80" y="0" width="2" height="40" fill="black" />
                    <rect x="86" y="0" width="4" height="40" fill="black" />
                    <rect x="94" y="0" width="6" height="40" fill="black" />
                    <rect x="104" y="0" width="2" height="40" fill="black" />
                    <rect x="110" y="0" width="4" height="40" fill="black" />
                    <rect x="118" y="0" width="8" height="40" fill="black" />
                    <rect x="130" y="0" width="2" height="40" fill="black" />
                    <rect x="136" y="0" width="4" height="40" fill="black" />
                    <rect x="144" y="0" width="2" height="40" fill="black" />
                    <rect x="150" y="0" width="6" height="40" fill="black" />
                    <rect x="160" y="0" width="4" height="40" fill="black" />
                    <rect x="168" y="0" width="2" height="40" fill="black" />
                    <rect x="174" y="0" width="4" height="40" fill="black" />
                    <rect x="182" y="0" width="6" height="40" fill="black" />
                    <rect x="192" y="0" width="4" height="40" fill="black" />
                  </svg>
                </div>
                <span className="font-mono text-xs font-bold tracking-widest text-slate-800">
                  *{uhidPatient.patientId}*
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setUhidCardOpen(false)}>Close</Button>
            <Button
              size="sm"
              onClick={() => {
                window.print()
                toast({ title: 'Printing ID Card', description: 'Sent to thermal card printer' })
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white gap-1.5"
            >
              <Printer className="h-4 w-4" /> Print UHID Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fast-Track Emergency Registration Modal */}
      <Dialog open={fastTrackOpen} onOpenChange={setFastTrackOpen}>
        <DialogContent className="sm:max-w-md border-red-300">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-red-700">
              <Zap className="h-5 w-5 text-red-600" />
              Fast-Track Emergency Patient Registration
            </DialogTitle>
            <DialogDescription className="text-xs">
              Minimal mandatory fields for immediate triage and instant token assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-red-800">Patient Full Name *</Label>
              <Input
                value={fastTrackForm.name}
                onChange={(e) => setFastTrackForm({ ...fastTrackForm, name: e.target.value })}
                placeholder="e.g. Emergency Patient"
                className="h-9 text-xs mt-1 border-red-200"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-red-800">Phone Number *</Label>
              <Input
                value={fastTrackForm.phone}
                onChange={(e) => setFastTrackForm({ ...fastTrackForm, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="h-9 text-xs mt-1 border-red-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Attendant / Contact</Label>
                <Input
                  value={fastTrackForm.emergencyContact}
                  onChange={(e) => setFastTrackForm({ ...fastTrackForm, emergencyContact: e.target.value })}
                  placeholder="Relative name"
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Triage Priority</Label>
                <Select
                  value={fastTrackForm.triagePriority}
                  onValueChange={(v) => setFastTrackForm({ ...fastTrackForm, triagePriority: v })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1 text-red-700 font-semibold border-red-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMERGENCY" className="text-red-700 font-bold">EMERGENCY (Red)</SelectItem>
                    <SelectItem value="FAST_TRACK" className="text-amber-700 font-bold">FAST-TRACK (Yellow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Chief Presenting Emergency Complaints</Label>
              <Textarea
                value={fastTrackForm.emergencyNotes}
                onChange={(e) => setFastTrackForm({ ...fastTrackForm, emergencyNotes: e.target.value })}
                placeholder="Severe chest pain, bleeding trauma, unconsciousness..."
                className="h-16 text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setFastTrackOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleFastTrackRegister}
              disabled={fastTrackSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              <Zap className="h-4 w-4" />
              Register & Dispatch to ER Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PatientsModule() {
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [bloodGroupFilter, setBloodGroupFilter] = useState('')

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [uhidCardOpen, setUhidCardOpen] = useState(false)
  const [uhidPatient, setUhidPatient] = useState<Patient | null>(null)
  const [fastTrackOpen, setFastTrackOpen] = useState(false)
  const [fastTrackSubmitting, setFastTrackSubmitting] = useState(false)
  const [fastTrackForm, setFastTrackForm] = useState({
    name: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
    triagePriority: 'EMERGENCY',
    emergencyNotes: '',
  })

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  })
  const [formSubmitting, setFormSubmitting] = useState(false)

  const limit = 10
  const totalPages = Math.ceil(total / limit)

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.set('search', search)
      if (genderFilter) params.set('gender', genderFilter)
      if (bloodGroupFilter) params.set('bloodGroup', bloodGroupFilter)

      const res = await fetch(`/api/patients?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setPatients(data.patients)
        setTotal(data.total)
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch patients', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, genderFilter, bloodGroupFilter, toast])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
    })
    setEditingPatient(null)
  }

  const openAddDialog = () => {
    resetForm()
    setFormOpen(true)
  }

  const openUhidCard = (patient: Patient) => {
    setUhidPatient(patient)
    setUhidCardOpen(true)
  }

  const handleFastTrackRegister = async () => {
    if (!fastTrackForm.name || !fastTrackForm.phone) {
      toast({ title: 'Validation Error', description: 'Patient name and phone are required for emergency entry', variant: 'destructive' })
      return
    }

    setFastTrackSubmitting(true)
    try {
      // 1. Create Patient
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fastTrackForm.name,
          phone: fastTrackForm.phone,
          emergencyContact: fastTrackForm.emergencyContact || 'Emergency Relative',
          emergencyPhone: fastTrackForm.emergencyPhone || fastTrackForm.phone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to register patient')

      // 2. Auto-log emergency vitals & triage
      await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: data.id,
          triagePriority: fastTrackForm.triagePriority,
          notes: fastTrackForm.emergencyNotes || 'Emergency fast-track walk-in admission',
        }),
      })

      toast({ title: 'Fast-Track Registered', description: `UHID ${data.patientId} assigned. Triage priority: ${fastTrackForm.triagePriority}` })
      setFastTrackOpen(false)
      setFastTrackForm({
        name: '',
        phone: '',
        emergencyContact: '',
        emergencyPhone: '',
        triagePriority: 'EMERGENCY',
        emergencyNotes: '',
      })
      fetchPatients()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setFastTrackSubmitting(false)
    }
  }

  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient)
    setForm({
      name: patient.name,
      email: patient.email || '',
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
      gender: patient.gender || '',
      bloodGroup: patient.bloodGroup || '',
      address: patient.address || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || '',
    })
    setFormOpen(true)
  }

  const openDetailDialog = async (patient: Patient) => {
    setSelectedPatient(null)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/patients/${patient.id}`)
      const data = await res.json()
      if (res.ok) {
        setSelectedPatient({
          ...data,
          appointments: data.appointments ?? [],
          prescriptions: data.prescriptions ?? [],
          labReports: data.labReports ?? [],
          invoices: data.invoices ?? [],
        })
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch patient details', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: 'Validation Error', description: 'Name and phone are required', variant: 'destructive' })
      return
    }

    setFormSubmitting(true)
    try {
      const url = editingPatient ? `/api/patients/${editingPatient.id}` : '/api/patients'
      const method = editingPatient ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (res.ok) {
        toast({
          title: editingPatient ? 'Patient Updated' : 'Patient Created',
          description: `${form.name} has been ${editingPatient ? 'updated' : 'registered'} successfully.`,
        })
        setFormOpen(false)
        resetForm()
        fetchPatients()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save patient', variant: 'destructive' })
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-green-950">Patient Management</h1>
          <p className="text-muted-foreground">Manage patient records and information</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setFastTrackOpen(true)}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
          >
            <Zap className="h-4 w-4" />
            Fast-Track Emergency
          </Button>
          <Button onClick={openAddDialog} className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <Users className="h-6 w-6 text-green-800" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-2xl font-bold text-green-950">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100">
              <Activity className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Page</p>
              <p className="text-2xl font-bold">{page} / {totalPages || 1}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100">
              <Heart className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Showing</p>
              <p className="text-2xl font-bold">{Math.min(limit, patients.length)} records</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or patient ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={genderFilter} onValueChange={(v) => { setGenderFilter(v === 'ALL' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Gender</SelectItem>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={bloodGroupFilter} onValueChange={(v) => { setBloodGroupFilter(v === 'ALL' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[140px]">
                  <Droplets className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Blood Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Groups</SelectItem>
                  {BLOOD_GROUPS.map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Patient Records</CardTitle>
          <CardDescription>
            {total} patient{total !== 1 ? 's' : ''} registered
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[110px]">Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden sm:table-cell">Gender</TableHead>
                  <TableHead className="hidden lg:table-cell">Blood Group</TableHead>
                  <TableHead className="hidden lg:table-cell">Age</TableHead>
                  <TableHead className="hidden xl:table-cell">Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Loading patients...
                    </TableCell>
                  </TableRow>
                ) : patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      No patients found. Add a new patient to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-sm font-medium text-green-800">
                        {patient.patientId}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-sm">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            {patient.email && (
                              <p className="text-xs text-muted-foreground hidden lg:block">{patient.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{patient.phone}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {patient.gender ? (
                          <Badge variant="outline" className="text-xs">
                            {patient.gender}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {patient.bloodGroup ? (
                          <Badge className={`${patient.bloodGroup.includes('+') ? 'bg-red-100 text-red-800 border-red-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                            {patient.bloodGroup}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {calculateAge(patient.dateOfBirth)}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {formatDate(patient.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUhidCard(patient)}
                            title="Print UHID Smart Card"
                            className="text-purple-700 hover:text-purple-950 hover:bg-purple-50"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(patient)}
                            className="text-green-800 hover:text-green-950 hover:bg-green-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(patient)}
                            className="text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-9 h-9"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Patient Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-950">
              {editingPatient ? 'Edit Patient' : 'Register New Patient'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter patient name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select
                  value={form.bloodGroup}
                  onValueChange={(v) => setForm({ ...form, bloodGroup: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter full address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
              />
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Emergency Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="Emergency contact name"
                    value={form.emergencyContact}
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    placeholder="Emergency contact phone"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                  />
                </div>
              </div>
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
              {formSubmitting ? 'Saving...' : editingPatient ? 'Update Patient' : 'Register Patient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading patient details...</p>
            </div>
          ) : selectedPatient ? (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-green-950">
                    Patient Details - {selectedPatient.patientId}
                  </DialogTitle>
                  <Badge className="bg-green-100 text-green-900 border-green-200">
                    {selectedPatient.gender || 'N/A'}
                  </Badge>
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-2">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="visits">Visits</TabsTrigger>
                  <TabsTrigger value="medical">Medical</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>

                {/* Patient Info Tab */}
                <TabsContent value="info" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Patient Info Card */}
                    <div className="md:col-span-2 space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Full Name</p>
                              <p className="font-medium">{selectedPatient.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Patient ID</p>
                              <p className="font-mono font-medium text-green-800">{selectedPatient.patientId}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" /> Phone
                              </p>
                              <p className="font-medium">{selectedPatient.phone}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" /> Email
                              </p>
                              <p className="font-medium">{selectedPatient.email || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Date of Birth</p>
                              <p className="font-medium">
                                {selectedPatient.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Age</p>
                              <p className="font-medium">{calculateAge(selectedPatient.dateOfBirth)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Blood Group</p>
                              <p className="font-medium">{selectedPatient.bloodGroup || 'N/A'}</p>
                            </div>
                          </div>
                          {selectedPatient.address && (
                            <div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Address
                              </p>
                              <p className="font-medium">{selectedPatient.address}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Emergency Contact Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Emergency Contact</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedPatient.emergencyContact ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Contact Name</p>
                                <p className="font-medium">{selectedPatient.emergencyContact}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Contact Phone</p>
                                <p className="font-medium">{selectedPatient.emergencyPhone || 'N/A'}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">No emergency contact provided</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* QR Code Card */}
                    <Card className="self-start">
                      <CardContent className="p-6 flex flex-col items-center">
                        <PatientQRCode patientId={selectedPatient.patientId} />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Visits Tab */}
                <TabsContent value="visits" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Appointment History</CardTitle>
                      <CardDescription>
                        {selectedPatient.appointments.length} appointment{selectedPatient.appointments.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[400px]">
                        {selectedPatient.appointments.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No appointments found</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedPatient.appointments.map((apt) => (
                                <TableRow key={apt.id} className="hover:bg-muted/50">
                                  <TableCell className="text-sm">
                                    {formatDate(apt.date)}
                                  </TableCell>
                                  <TableCell className="text-sm font-mono">{apt.timeSlot}</TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="text-sm font-medium">{apt.doctor.name}</p>
                                      {apt.doctor.specialization && (
                                        <p className="text-xs text-muted-foreground">{apt.doctor.specialization}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {apt.type.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`text-xs ${getStatusColor(apt.status)}`}>
                                      {apt.status.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Medical Tab */}
                <TabsContent value="medical" className="mt-4 space-y-6">
                  {/* Prescriptions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-800" />
                        Prescriptions
                      </CardTitle>
                      <CardDescription>
                        {selectedPatient.prescriptions.length} prescription{selectedPatient.prescriptions.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[300px]">
                        {selectedPatient.prescriptions.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No prescriptions found</p>
                        ) : (
                          <div className="space-y-3">
                            {selectedPatient.prescriptions.map((rx) => (
                              <div key={rx.id} className="border rounded-lg p-4 space-y-2 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">{rx.doctor.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatDateShort(rx.createdAt)}</p>
                                </div>
                                {rx.symptoms && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Symptoms</p>
                                    <p className="text-sm">{rx.symptoms}</p>
                                  </div>
                                )}
                                {rx.diagnosis && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Diagnosis</p>
                                    <p className="text-sm font-medium text-green-800">{rx.diagnosis}</p>
                                  </div>
                                )}
                                {rx.medicines && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Medicines</p>
                                    <p className="text-sm">{rx.medicines}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Lab Reports */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-700" />
                        Lab Reports
                      </CardTitle>
                      <CardDescription>
                        {selectedPatient.labReports.length} report{selectedPatient.labReports.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[300px]">
                        {selectedPatient.labReports.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No lab reports found</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Report No</TableHead>
                                <TableHead>Test</TableHead>
                                <TableHead>Technician</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedPatient.labReports.map((report) => (
                                <TableRow key={report.id} className="hover:bg-muted/50">
                                  <TableCell className="font-mono text-sm">{report.reportNo}</TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="text-sm font-medium">{report.testType.name}</p>
                                      {report.testType.category && (
                                        <p className="text-xs text-muted-foreground">{report.testType.category}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {report.technician?.name || 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-sm">{formatDate(report.createdAt)}</TableCell>
                                  <TableCell>
                                    <Badge className={`text-xs ${getLabStatusColor(report.status)}`}>
                                      {report.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Invoices</CardTitle>
                      <CardDescription>
                        {selectedPatient.invoices.length} invoice{selectedPatient.invoices.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[400px]">
                        {selectedPatient.invoices.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No invoices found</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Invoice No</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Net Amount</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedPatient.invoices.map((inv) => (
                                <TableRow key={inv.id} className="hover:bg-muted/50">
                                  <TableCell className="font-mono text-sm">{inv.invoiceNo}</TableCell>
                                  <TableCell className="text-sm">{formatDate(inv.createdAt)}</TableCell>
                                  <TableCell className="text-sm">${inv.totalAmount.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm text-red-600">
                                    {inv.discount > 0 ? `-$${inv.discount.toFixed(2)}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-sm font-medium">${inv.netAmount.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Badge className={`text-xs ${getInvoiceStatusColor(inv.status)}`}>
                                      {inv.status.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      {/* UHID Barcode / QR Code Smart ID Card Modal */}
      <Dialog open={uhidCardOpen} onOpenChange={setUhidCardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <QrCode className="h-5 w-5 text-purple-600" />
              Patient UHID Health ID Card
            </DialogTitle>
            <DialogDescription className="text-xs">
              Instant history retrieval card with barcode and digital QR code.
            </DialogDescription>
          </DialogHeader>

          {uhidPatient && (
            <div className="p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-white/20 space-y-4">
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center font-bold text-emerald-400">
                    CM
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">CLINIC MANAGER</h3>
                    <p className="text-[10px] text-white/60">Digital Healthcare Health Card</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500 text-white text-[10px] font-mono border-0">
                  UHID: {uhidPatient.patientId}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold text-white shrink-0">
                  {uhidPatient.name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold text-base text-white">{uhidPatient.name}</h4>
                  <p className="text-white/70">Phone: {uhidPatient.phone}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-[10px] text-red-300 border-red-400/40 bg-red-950/40">
                      Blood: {uhidPatient.bloodGroup || 'O+'}
                    </Badge>
                    <span className="text-[10px] text-white/60">Gender: {uhidPatient.gender || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Barcode & QR Code Section */}
              <div className="bg-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 text-slate-950">
                {/* SVG Barcode Representation */}
                <div className="h-10 w-full flex items-center justify-center px-4">
                  <svg className="w-full h-8" viewBox="0 0 200 40">
                    <rect x="0" y="0" width="4" height="40" fill="black" />
                    <rect x="8" y="0" width="2" height="40" fill="black" />
                    <rect x="14" y="0" width="6" height="40" fill="black" />
                    <rect x="24" y="0" width="2" height="40" fill="black" />
                    <rect x="30" y="0" width="4" height="40" fill="black" />
                    <rect x="38" y="0" width="2" height="40" fill="black" />
                    <rect x="44" y="0" width="6" height="40" fill="black" />
                    <rect x="54" y="0" width="4" height="40" fill="black" />
                    <rect x="62" y="0" width="2" height="40" fill="black" />
                    <rect x="68" y="0" width="8" height="40" fill="black" />
                    <rect x="80" y="0" width="2" height="40" fill="black" />
                    <rect x="86" y="0" width="4" height="40" fill="black" />
                    <rect x="94" y="0" width="6" height="40" fill="black" />
                    <rect x="104" y="0" width="2" height="40" fill="black" />
                    <rect x="110" y="0" width="4" height="40" fill="black" />
                    <rect x="118" y="0" width="8" height="40" fill="black" />
                    <rect x="130" y="0" width="2" height="40" fill="black" />
                    <rect x="136" y="0" width="4" height="40" fill="black" />
                    <rect x="144" y="0" width="2" height="40" fill="black" />
                    <rect x="150" y="0" width="6" height="40" fill="black" />
                    <rect x="160" y="0" width="4" height="40" fill="black" />
                    <rect x="168" y="0" width="2" height="40" fill="black" />
                    <rect x="174" y="0" width="4" height="40" fill="black" />
                    <rect x="182" y="0" width="6" height="40" fill="black" />
                    <rect x="192" y="0" width="4" height="40" fill="black" />
                  </svg>
                </div>
                <span className="font-mono text-xs font-bold tracking-widest text-slate-800">
                  *{uhidPatient.patientId}*
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setUhidCardOpen(false)}>Close</Button>
            <Button
              size="sm"
              onClick={() => {
                window.print()
                toast({ title: 'Printing ID Card', description: 'Sent to thermal card printer' })
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white gap-1.5"
            >
              <Printer className="h-4 w-4" /> Print UHID Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fast-Track Emergency Registration Modal */}
      <Dialog open={fastTrackOpen} onOpenChange={setFastTrackOpen}>
        <DialogContent className="sm:max-w-md border-red-300">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-red-700">
              <Zap className="h-5 w-5 text-red-600" />
              Fast-Track Emergency Patient Registration
            </DialogTitle>
            <DialogDescription className="text-xs">
              Minimal mandatory fields for immediate triage and instant token assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-red-800">Patient Full Name *</Label>
              <Input
                value={fastTrackForm.name}
                onChange={(e) => setFastTrackForm({ ...fastTrackForm, name: e.target.value })}
                placeholder="e.g. Emergency Patient"
                className="h-9 text-xs mt-1 border-red-200"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-red-800">Phone Number *</Label>
              <Input
                value={fastTrackForm.phone}
                onChange={(e) => setFastTrackForm({ ...fastTrackForm, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="h-9 text-xs mt-1 border-red-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Attendant / Contact</Label>
                <Input
                  value={fastTrackForm.emergencyContact}
                  onChange={(e) => setFastTrackForm({ ...fastTrackForm, emergencyContact: e.target.value })}
                  placeholder="Relative name"
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Triage Priority</Label>
                <Select
                  value={fastTrackForm.triagePriority}
                  onValueChange={(v) => setFastTrackForm({ ...fastTrackForm, triagePriority: v })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1 text-red-700 font-semibold border-red-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMERGENCY" className="text-red-700 font-bold">EMERGENCY (Red)</SelectItem>
                    <SelectItem value="FAST_TRACK" className="text-amber-700 font-bold">FAST-TRACK (Yellow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Chief Presenting Emergency Complaints</Label>
              <Textarea
                value={fastTrackForm.emergencyNotes}
                onChange={(e) => setFastTrackForm({ ...fastTrackForm, emergencyNotes: e.target.value })}
                placeholder="Severe chest pain, bleeding trauma, unconsciousness..."
                className="h-16 text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setFastTrackOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleFastTrackRegister}
              disabled={fastTrackSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              <Zap className="h-4 w-4" />
              Register & Dispatch to ER Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
