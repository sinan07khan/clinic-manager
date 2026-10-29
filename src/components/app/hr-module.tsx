"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  getDay,
} from "date-fns"
import {
  Users,
  Calendar,
  DollarSign,
  Clock,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Eye,
  Banknote,
  Phone,
  Mail,
  Stethoscope,
  ClipboardList,
  MoreHorizontal,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string | null
  specialization: string | null
  isActive: boolean
  createdAt: string
  _count: { attendance: number; salary: number; duties: number }
}

interface AttendanceRecord {
  id: string
  staffId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  notes: string | null
  staff: { id: string; name: string; role: string; department: string | null }
}

interface SalaryRecord {
  id: string
  staffId: string
  month: number
  year: number
  baseSalary: number
  deductions: number
  bonuses: number
  netSalary: number
  status: string
  paidDate: string | null
  createdAt: string
  staff: { id: string; name: string; role: string; department: string | null }
}

interface DutyAssignment {
  id: string
  staffId: string
  date: string
  shift: string
  isOnCall: boolean
  notes: string | null
  staff: { id: string; name: string; role: string; department: string | null }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "HR_MANAGER",
  "DOCTOR",
  "ACCOUNTANT",
  "NURSE",
  "LAB_TECHNICIAN",
  "RECEPTIONIST",
  "INVENTORY_MANAGER",
  "STAFF",
]

const DEPARTMENTS = [
  "General Medicine",
  "Surgery",
  "Pediatrics",
  "Gynecology",
  "Orthopedics",
  "Cardiology",
  "Neurology",
  "Dermatology",
  "ENT",
  "Ophthalmology",
  "Radiology",
  "Pathology",
  "Laboratory",
  "Administration",
  "Accounts",
  "Reception",
  "Inventory",
]

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 border-red-200",
  ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
  HR_MANAGER: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DOCTOR: "bg-green-100 text-green-900 border-green-200",
  NURSE: "bg-pink-100 text-pink-800 border-pink-200",
  LAB_TECHNICIAN: "bg-blue-100 text-blue-800 border-blue-200",
  RECEPTIONIST: "bg-amber-100 text-amber-800 border-amber-200",
  ACCOUNTANT: "bg-cyan-100 text-cyan-800 border-cyan-200",
  INVENTORY_MANAGER: "bg-orange-100 text-orange-800 border-orange-200",
  STAFF: "bg-gray-100 text-gray-800 border-gray-200",
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  LAB_TECHNICIAN: "Lab Tech",
  RECEPTIONIST: "Receptionist",
  ACCOUNTANT: "Accountant",
  INVENTORY_MANAGER: "Inventory Mgr",
  STAFF: "Staff",
}

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800 border-green-200",
  ABSENT: "bg-red-100 text-red-800 border-red-200",
  LATE: "bg-orange-100 text-orange-800 border-orange-200",
  LEAVE: "bg-blue-100 text-blue-800 border-blue-200",
  HALF_DAY: "bg-yellow-100 text-yellow-800 border-yellow-200",
}

const SHIFT_COLORS: Record<string, string> = {
  MORNING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  AFTERNOON: "bg-orange-100 text-orange-800 border-orange-300",
  NIGHT: "bg-purple-100 text-purple-800 border-purple-300",
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ─── Helper ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 0 })}`
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—"
  return format(new Date(dateStr), "hh:mm a")
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant="outline"
      className={ROLE_COLORS[role] || "bg-gray-100 text-gray-800"}
    >
      {ROLE_LABELS[role] || role}
    </Badge>
  )
}

function StatusBadge({ status, type }: { status: string; type: "attendance" | "salary" }) {
  if (type === "attendance") {
    return (
      <Badge variant="outline" className={ATTENDANCE_COLORS[status] || ""}>
        {status}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className={
        status === "PAID"
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-yellow-100 text-yellow-800 border-yellow-200"
      }
    >
      {status}
    </Badge>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF DIRECTORY TAB
// ═══════════════════════════════════════════════════════════════════════════════

function StaffDirectory() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterDept, setFilterDept] = useState("")
  const [filterActive, setFilterActive] = useState("")

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formRole, setFormRole] = useState("STAFF")
  const [formDept, setFormDept] = useState("")
  const [formSpec, setFormSpec] = useState("")
  const [formActive, setFormActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (filterRole) params.set("role", filterRole)
      if (filterDept) params.set("department", filterDept)
      if (filterActive) params.set("isActive", filterActive)

      const res = await fetch(`/api/staff?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStaff(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, filterRole, filterDept, filterActive])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormPhone("")
    setFormRole("STAFF")
    setFormDept("")
    setFormSpec("")
    setFormActive(true)
    setEditingStaff(null)
  }

  const openAdd = () => {
    resetForm()
    setShowAddDialog(true)
  }

  const openEdit = (s: StaffMember) => {
    setEditingStaff(s)
    setFormName(s.name)
    setFormEmail(s.email)
    setFormPhone(s.phone)
    setFormRole(s.role)
    setFormDept(s.department || "")
    setFormSpec(s.specialization || "")
    setFormActive(s.isActive)
    setShowAddDialog(true)
  }

  const handleSubmit = async () => {
    if (!formName || !formEmail || !formPhone) {
      toast.error("Name, email, and phone are required")
      return
    }
    setSubmitting(true)
    try {
      const url = editingStaff ? `/api/staff/${editingStaff.id}` : "/api/staff"
      const method = editingStaff ? "PUT" : "POST"
      const body = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        department: formDept || null,
        specialization: formSpec || null,
        isActive: formActive,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingStaff ? "Staff updated successfully" : "Staff added successfully")
        setShowAddDialog(false)
        resetForm()
        fetchStaff()
      } else {
        const data = await res.json()
        toast.error(data.error || "Operation failed")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (s: StaffMember) => {
    try {
      const res = await fetch(`/api/staff/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      })
      if (res.ok) {
        toast.success(`Staff ${s.isActive ? "deactivated" : "activated"}`)
        fetchStaff()
      }
    } catch (err) {
      toast.error("Failed to update staff status")
    }
  }

  const handleDelete = async (s: StaffMember) => {
    if (!confirm(`Are you sure you want to deactivate ${s.name}?`)) return
    try {
      const res = await fetch(`/api/staff/${s.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Staff deactivated")
        fetchStaff()
      }
    } catch (err) {
      toast.error("Failed to deactivate staff")
    }
  }

  // Role count summary
  const roleCounts = staff.reduce<Record<string, number>>((acc, s) => {
    acc[s.role] = (acc[s.role] || 0) + 1
    return acc
  }, {})

  const activeCount = staff.filter((s) => s.isActive).length
  const inactiveCount = staff.length - activeCount

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-700" />
              <span className="text-sm text-green-800">Total Staff</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-green-950">{staff.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Active</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-green-900">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Inactive</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-red-900">{inactiveCount}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-green-700" />
              <span className="text-sm text-green-800">Doctors</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-green-950">{roleCounts.DOCTOR || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-pink-200 bg-pink-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-pink-600" />
              <span className="text-sm text-pink-700">Nurses</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-pink-900">{roleCounts.NURSE || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={(v) => setFilterRole(v === "ALL" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterDept}
            onValueChange={(v) => setFilterDept(v === "ALL" ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterActive}
            onValueChange={(v) => setFilterActive(v === "ALL" ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openAdd} className="bg-green-700 hover:bg-green-800">
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="whitespace-nowrap font-semibold">Name</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold hidden sm:table-cell">Email</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold hidden md:table-cell">Phone</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Role</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold hidden lg:table-cell">Department</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold hidden sm:table-cell">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      No staff found
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground hidden sm:table-cell">
                        {s.email}
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{s.phone}</TableCell>
                      <TableCell>
                        <RoleBadge role={s.role} />
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">{s.department || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={
                            s.isActive
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(s)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(s)}>
                              {s.isActive ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(s)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deactivate
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

      {/* Add/Edit Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
            <DialogDescription>
              {editingStaff
                ? "Update staff member information"
                : "Fill in the details to add a new staff member"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  placeholder="01XXXXXXXXX"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Department</Label>
                <Select value={formDept} onValueChange={setFormDept}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="spec">Specialization</Label>
              <Input
                id="spec"
                placeholder="e.g., Cardiology, Orthopedics..."
                value={formSpec}
                onChange={(e) => setFormSpec(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm() }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-700 hover:bg-green-800"
            >
              {submitting ? "Saving..." : editingStaff ? "Update" : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE TAB
// ═══════════════════════════════════════════════════════════════════════════════

function AttendanceTab() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [allStaff, setAllStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDept, setFilterDept] = useState("")
  const [filterRole, setFilterRole] = useState("")

  // Dialog
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null)
  const [formStaffId, setFormStaffId] = useState("")
  const [formCheckIn, setFormCheckIn] = useState("")
  const [formCheckOut, setFormCheckOut] = useState("")
  const [formStatus, setFormStatus] = useState("PRESENT")
  const [formNotes, setFormNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchAttendance = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("date", format(selectedDate, "yyyy-MM-dd"))
      if (filterDept) params.set("department", filterDept)
      if (filterRole) params.set("role", filterRole)

      const res = await fetch(`/api/attendance?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setAttendance(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, filterDept, filterRole])

  const fetchStaff = useCallback(async () => {
    const res = await fetch("/api/staff?isActive=true")
    if (res.ok) {
      const data = await res.json()
      setAllStaff(data)
    }
  }, [])

  useEffect(() => {
    fetchAttendance()
    fetchStaff()
  }, [fetchAttendance, fetchStaff])

  const openRecordDialog = (editRec?: AttendanceRecord) => {
    if (editRec) {
      setEditingAttendance(editRec)
      setFormStaffId(editRec.staffId)
      setFormCheckIn(
        editRec.checkIn ? format(new Date(editRec.checkIn), "HH:mm") : ""
      )
      setFormCheckOut(
        editRec.checkOut ? format(new Date(editRec.checkOut), "HH:mm") : ""
      )
      setFormStatus(editRec.status)
      setFormNotes(editRec.notes || "")
    } else {
      setEditingAttendance(null)
      setFormStaffId("")
      setFormCheckIn(
        format(new Date(), "HH:mm")
      )
      setFormCheckOut("")
      setFormStatus("PRESENT")
      setFormNotes("")
    }
    setShowRecordDialog(true)
  }

  const handleSubmitAttendance = async () => {
    if (!formStaffId) {
      toast.error("Please select a staff member")
      return
    }
    setSubmitting(true)
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const checkInStr = formCheckIn
        ? `${dateStr}T${formCheckIn}:00`
        : null
      const checkOutStr = formCheckOut
        ? `${dateStr}T${formCheckOut}:00`
        : null

      if (editingAttendance) {
        const res = await fetch(`/api/attendance/${editingAttendance.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkIn: checkInStr,
            checkOut: checkOutStr,
            status: formStatus,
            notes: formNotes || null,
          }),
        })
        if (res.ok) {
          toast.success("Attendance updated")
          setShowRecordDialog(false)
          fetchAttendance()
        } else {
          const data = await res.json()
          toast.error(data.error || "Failed to update")
        }
      } else {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: formStaffId,
            date: dateStr,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            status: formStatus,
            notes: formNotes || null,
          }),
        })
        if (res.ok) {
          toast.success("Attendance recorded")
          setShowRecordDialog(false)
          fetchAttendance()
        } else {
          const data = await res.json()
          toast.error(data.error || "Failed to record")
        }
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const markAllPresent = async () => {
    const activeStaff = allStaff.filter(
      (s) => !attendance.find((a) => a.staffId === s.id)
    )
    if (activeStaff.length === 0) {
      toast.info("All staff already have attendance records for this date")
      return
    }

    setSubmitting(true)
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    let successCount = 0
    let failCount = 0

    for (const s of activeStaff) {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: s.id,
            date: dateStr,
            status: "PRESENT",
          }),
        })
        if (res.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }
    }

    setSubmitting(false)
    toast.success(
      `Marked ${successCount} staff as Present${failCount > 0 ? ` (${failCount} failed)` : ""}`
    )
    fetchAttendance()
  }

  const markAllAbsent = async () => {
    const activeStaff = allStaff.filter(
      (s) => !attendance.find((a) => a.staffId === s.id)
    )
    if (activeStaff.length === 0) {
      toast.info("All staff already have attendance records for this date")
      return
    }

    setSubmitting(true)
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    let successCount = 0
    let failCount = 0

    for (const s of activeStaff) {
      try {
        const res = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: s.id,
            date: dateStr,
            status: "ABSENT",
          }),
        })
        if (res.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }
    }

    setSubmitting(false)
    toast.success(
      `Marked ${successCount} staff as Absent${failCount > 0 ? ` (${failCount} failed)` : ""}`
    )
    fetchAttendance()
  }

  // Weekly summary
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 })

  const presentCount = attendance.filter((a) => a.status === "PRESENT").length
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length
  const lateCount = attendance.filter((a) => a.status === "LATE").length
  const leaveCount = attendance.filter((a) => a.status === "LEAVE").length

  // Staff not yet recorded
  const recordedStaffIds = attendance.map((a) => a.staffId)
  const unrecordedStaff = allStaff.filter((s) => !recordedStaffIds.includes(s.id))

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-lg font-semibold">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                Week: {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-green-800">Recorded</p>
            <p className="text-2xl font-bold text-green-950">{attendance.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-green-700">Present</p>
            <p className="text-2xl font-bold text-green-900">{presentCount}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-red-700">Absent</p>
            <p className="text-2xl font-bold text-red-900">{absentCount}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-orange-700">Late</p>
            <p className="text-2xl font-bold text-orange-900">{lateCount}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">On Leave</p>
            <p className="text-2xl font-bold text-blue-900">{leaveCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={filterDept}
            onValueChange={(v) => setFilterDept(v === "ALL" ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterRole}
            onValueChange={(v) => setFilterRole(v === "ALL" ? "" : v)}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllPresent}
            disabled={submitting || unrecordedStaff.length === 0}
          >
            <UserCheck className="mr-1 h-4 w-4 text-green-600" />
            All Present
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAbsent}
            disabled={submitting || unrecordedStaff.length === 0}
          >
            <UserX className="mr-1 h-4 w-4 text-red-600" />
            All Absent
          </Button>
          <Button
            onClick={() => openRecordDialog()}
            className="bg-green-700 hover:bg-green-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record
          </Button>
        </div>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold whitespace-nowrap">Staff Name</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap hidden sm:table-cell">Role</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Check In</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap hidden sm:table-cell">Check Out</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-semibold whitespace-nowrap hidden md:table-cell">Notes</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : attendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      No attendance records for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.staff.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <RoleBadge role={a.staff.role} />
                      </TableCell>
                      <TableCell className="text-sm">{formatTime(a.checkIn)}</TableCell>
                      <TableCell className="text-sm hidden sm:table-cell">{formatTime(a.checkOut)}</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} type="attendance" />
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground hidden md:table-cell">
                        {a.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRecordDialog(a)}
                        >
                          <Edit2 className="h-4 w-4" />
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

      {/* Unrecorded Staff */}
      {unrecordedStaff.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              Not Yet Recorded ({unrecordedStaff.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {unrecordedStaff.slice(0, 10).map((s) => (
              <Badge
                key={s.id}
                variant="outline"
                className="cursor-pointer border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
                onClick={() => {
                  setFormStaffId(s.id)
                  openRecordDialog()
                }}
              >
                {s.name}
              </Badge>
            ))}
            {unrecordedStaff.length > 10 && (
              <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                +{unrecordedStaff.length - 10} more
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Record Attendance Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAttendance ? "Edit Attendance" : "Record Attendance"}
            </DialogTitle>
            <DialogDescription>
              Date: {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {!editingAttendance && (
              <div className="grid gap-2">
                <Label>Staff Member *</Label>
                <Select value={formStaffId} onValueChange={setFormStaffId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {allStaff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({ROLE_LABELS[s.role]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="checkin">Check In</Label>
                <Input
                  id="checkin"
                  type="time"
                  value={formCheckIn}
                  onChange={(e) => setFormCheckIn(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkout">Check Out</Label>
                <Input
                  id="checkout"
                  type="time"
                  value={formCheckOut}
                  onChange={(e) => setFormCheckOut(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="LEAVE">Leave</SelectItem>
                  <SelectItem value="HALF_DAY">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAttendance}
              disabled={submitting}
              className="bg-green-700 hover:bg-green-800"
            >
              {submitting
                ? "Saving..."
                : editingAttendance
                ? "Update"
                : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL TAB
// ═══════════════════════════════════════════════════════════════════════════════

function PayrollTab() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [salaries, setSalaries] = useState<SalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Detail Dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [detailSalary, setDetailSalary] = useState<SalaryRecord | null>(null)

  // Edit Dialog
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editSalary, setEditSalary] = useState<SalaryRecord | null>(null)
  const [formDeductions, setFormDeductions] = useState(0)
  const [formBonuses, setFormBonuses] = useState(0)
  const [formBaseSalary, setFormBaseSalary] = useState(0)

  const fetchSalaries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("month", selectedMonth.toString())
      params.set("year", selectedYear.toString())

      const res = await fetch(`/api/salary?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSalaries(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchSalaries()
  }, [fetchSalaries])

  const handleGeneratePayroll = async () => {
    if (
      !confirm(
        `Generate payroll for all active staff for ${MONTHS[selectedMonth - 1]} ${selectedYear}?`
      )
    )
      return

    setSubmitting(true)
    try {
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(
          `Payroll generated for ${data.count} staff member(s)`
        )
        if (data.errors && data.errors.length > 0) {
          toast.info(
            `${data.errors.length} staff already had payroll records`
          )
        }
        fetchSalaries()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to generate payroll")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaySalary = async (s: SalaryRecord) => {
    if (!confirm(`Mark salary for ${s.staff.name} as PAID?`)) return
    try {
      const res = await fetch(`/api/salary/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      })
      if (res.ok) {
        toast.success("Salary marked as paid")
        fetchSalaries()
      }
    } catch (err) {
      toast.error("Failed to update salary")
    }
  }

  const openDetail = (s: SalaryRecord) => {
    setDetailSalary(s)
    setShowDetailDialog(true)
  }

  const openEdit = (s: SalaryRecord) => {
    setEditSalary(s)
    setFormBaseSalary(s.baseSalary)
    setFormDeductions(s.deductions)
    setFormBonuses(s.bonuses)
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editSalary) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/salary/${editSalary.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseSalary: formBaseSalary,
          deductions: formDeductions,
          bonuses: formBonuses,
        }),
      })
      if (res.ok) {
        toast.success("Salary updated")
        setShowEditDialog(false)
        fetchSalaries()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  // Stats
  const totalPaid = salaries
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + s.netSalary, 0)
  const totalPending = salaries
    .filter((s) => s.status === "PENDING")
    .reduce((sum, s) => sum + s.netSalary, 0)
  const paidCount = salaries.filter((s) => s.status === "PAID").length
  const pendingCount = salaries.filter((s) => s.status === "PENDING").length

  const calculatedNet = formBaseSalary - formDeductions + formBonuses

  return (
    <div className="space-y-6">
      {/* Month/Year Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGeneratePayroll}
              disabled={submitting}
              className="bg-green-700 hover:bg-green-800"
            >
              <Banknote className="mr-2 h-4 w-4" />
              {submitting ? "Generating..." : "Generate Payroll"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-green-800">Total Records</p>
            <p className="text-2xl font-bold text-green-950">{salaries.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-green-700">Paid ({paidCount})</p>
            <p className="text-lg font-bold text-green-900">
              {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-700">Pending ({pendingCount})</p>
            <p className="text-lg font-bold text-yellow-900">
              {formatCurrency(totalPending)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">Total Amount</p>
            <p className="text-lg font-bold text-blue-900">
              {formatCurrency(totalPaid + totalPending)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[480px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Staff Name</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold text-right">Base Salary</TableHead>
                  <TableHead className="font-semibold text-right">Deductions</TableHead>
                  <TableHead className="font-semibold text-right">Bonuses</TableHead>
                  <TableHead className="font-semibold text-right">Net Salary</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : salaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      No payroll records for {MONTHS[selectedMonth - 1]} {selectedYear}.
                      Click &quot;Generate Payroll&quot; to create records.
                    </TableCell>
                  </TableRow>
                ) : (
                  salaries.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.staff.name}</TableCell>
                      <TableCell>
                        <RoleBadge role={s.staff.role} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(s.baseSalary)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(s.deductions)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{formatCurrency(s.bonuses)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(s.netSalary)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} type="salary" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(s)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(s)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {s.status === "PENDING" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePaySalary(s)}
                              className="text-green-600 hover:text-green-700"
                              title="Mark as paid"
                            >
                              <CheckCircle2 className="h-4 w-4" />
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
          </DialogHeader>
          {detailSalary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Staff Name</p>
                  <p className="font-medium">{detailSalary.staff.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <RoleBadge role={detailSalary.staff.role} />
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{detailSalary.staff.department || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Period</p>
                  <p className="font-medium">
                    {MONTHS[detailSalary.month - 1]} {detailSalary.year}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Salary</span>
                  <span className="font-medium">{formatCurrency(detailSalary.baseSalary)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deductions</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(detailSalary.deductions)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bonuses</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(detailSalary.bonuses)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Net Salary</span>
                    <span className="text-lg font-bold text-green-800">
                      {formatCurrency(detailSalary.netSalary)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <StatusBadge status={detailSalary.status} type="salary" />
                </div>
                {detailSalary.paidDate && (
                  <div>
                    <p className="text-muted-foreground">Paid Date</p>
                    <p className="font-medium">
                      {format(new Date(detailSalary.paidDate), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Salary Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Salary</DialogTitle>
            <DialogDescription>
              Adjust salary details for {editSalary?.staff.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Base Salary</Label>
              <Input
                type="number"
                value={formBaseSalary}
                onChange={(e) => setFormBaseSalary(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Deductions</Label>
              <Input
                type="number"
                value={formDeductions}
                onChange={(e) => setFormDeductions(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Bonuses</Label>
              <Input
                type="number"
                value={formBonuses}
                onChange={(e) => setFormBonuses(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="rounded-lg border bg-green-50 p-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-green-900">Net Salary</span>
                <span className="text-lg font-bold text-green-950">
                  {formatCurrency(calculatedNet)}
                </span>
              </div>
              <p className="text-xs text-green-700">
                Base - Deductions + Bonuses
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={submitting}
              className="bg-green-700 hover:bg-green-800"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DUTY ROSTER TAB
// ═══════════════════════════════════════════════════════════════════════════════

function DutyRosterTab() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [duties, setDuties] = useState<DutyAssignment[]>([])
  const [allStaff, setAllStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState("")

  // Dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [editingDuty, setEditingDuty] = useState<DutyAssignment | null>(null)
  const [formStaffId, setFormStaffId] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formShift, setFormShift] = useState("MORNING")
  const [formOnCall, setFormOnCall] = useState(false)
  const [formNotes, setFormNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Computed week dates
  const baseDate = new Date()
  const currentWeekStart = startOfWeek(
    addDays(baseDate, weekOffset * 7),
    { weekStartsOn: 0 }
  )
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  )

  const fetchDuties = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("weekStart", format(weekDays[0], "yyyy-MM-dd"))
      params.set("weekEnd", format(weekDays[6], "yyyy-MM-dd"))
      if (filterRole) params.set("role", filterRole)

      const res = await fetch(`/api/duty-roster?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDuties(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [weekDays, filterRole])

  const fetchStaff = useCallback(async () => {
    const res = await fetch("/api/staff?isActive=true")
    if (res.ok) {
      const data = await res.json()
      setAllStaff(data)
    }
  }, [])

  useEffect(() => {
    fetchDuties()
    fetchStaff()
  }, [fetchDuties, fetchStaff])

  const openAssignDialog = (duty?: DutyAssignment, dateStr?: string) => {
    if (duty) {
      setEditingDuty(duty)
      setFormStaffId(duty.staffId)
      setFormDate(format(new Date(duty.date), "yyyy-MM-dd"))
      setFormShift(duty.shift)
      setFormOnCall(duty.isOnCall)
      setFormNotes(duty.notes || "")
    } else {
      setEditingDuty(null)
      setFormStaffId("")
      setFormDate(dateStr || format(new Date(), "yyyy-MM-dd"))
      setFormShift("MORNING")
      setFormOnCall(false)
      setFormNotes("")
    }
    setShowAssignDialog(true)
  }

  const handleSubmitDuty = async () => {
    if (!formStaffId || !formDate || !formShift) {
      toast.error("Staff, date, and shift are required")
      return
    }
    setSubmitting(true)
    try {
      if (editingDuty) {
        const res = await fetch(`/api/duty-roster/${editingDuty.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: formStaffId,
            date: formDate,
            shift: formShift,
            isOnCall: formOnCall,
            notes: formNotes || null,
          }),
        })
        if (res.ok) {
          toast.success("Duty updated")
          setShowAssignDialog(false)
          fetchDuties()
        } else {
          const data = await res.json()
          toast.error(data.error || "Failed to update")
        }
      } else {
        const res = await fetch("/api/duty-roster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: formStaffId,
            date: formDate,
            shift: formShift,
            isOnCall: formOnCall,
            notes: formNotes || null,
          }),
        })
        if (res.ok) {
          toast.success("Duty assigned")
          setShowAssignDialog(false)
          fetchDuties()
        } else {
          const data = await res.json()
          toast.error(data.error || "Failed to assign")
        }
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDuty = async (id: string) => {
    if (!confirm("Remove this duty assignment?")) return
    try {
      const res = await fetch(`/api/duty-roster/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Duty removed")
        fetchDuties()
      }
    } catch (err) {
      toast.error("Failed to remove duty")
    }
  }

  // Build grid: filter staff by role if needed
  const filteredStaff = filterRole
    ? allStaff.filter((s) => s.role === filterRole)
    : allStaff

  const getDutyForCell = (staffId: string, date: Date): DutyAssignment | undefined => {
    const dateStr = format(date, "yyyy-MM-dd")
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)

    return duties.find(
      (d) =>
        d.staffId === staffId &&
        new Date(d.date) >= startOfDay &&
        new Date(d.date) <= endOfDay
    )
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset((w) => w - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous Week
            </Button>
            <div className="text-center">
              <p className="text-lg font-semibold">
                {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                {weekOffset === 0
                  ? "Current Week"
                  : weekOffset === 1
                  ? "Next Week"
                  : weekOffset === -1
                  ? "Last Week"
                  : `${Math.abs(weekOffset)} weeks ${weekOffset > 0 ? "ahead" : "ago"}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(0)}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset((w) => w + 1)}
              >
                Next Week
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={filterRole}
          onValueChange={(v) => setFilterRole(v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => openAssignDialog()}
          className="bg-green-700 hover:bg-green-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Assign Duty
        </Button>
      </div>

      {/* Weekly Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="sticky left-0 z-10 bg-muted/50 p-3 text-left font-semibold">
                      Staff
                    </th>
                    {weekDays.map((day, i) => (
                      <th
                        key={i}
                        className={`p-3 text-center font-semibold min-w-[130px] ${
                          isToday(day)
                            ? "bg-green-100 text-green-950"
                            : ""
                        }`}
                      >
                        <div className="text-xs">{WEEKDAYS[getDay(day)]}</div>
                        <div>{format(day, "MMM d")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No staff found
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => (
                      <tr key={staff.id} className="border-b">
                        <td className="sticky left-0 z-10 bg-white p-3">
                          <div className="font-medium">{staff.name}</div>
                          <RoleBadge role={staff.role} />
                        </td>
                        {weekDays.map((day, dayIdx) => {
                          const duty = getDutyForCell(staff.id, day)
                          return (
                            <td
                              key={dayIdx}
                              className={`p-2 text-center align-top ${
                                isToday(day) ? "bg-green-50/50" : ""
                              }`}
                            >
                              {duty ? (
                                <div
                                  className={`cursor-pointer rounded-md border p-2 transition-colors hover:opacity-80 ${
                                    SHIFT_COLORS[duty.shift]
                                  }`}
                                  onClick={() => openAssignDialog(duty)}
                                >
                                  <div className="text-xs font-semibold">
                                    {duty.shift}
                                  </div>
                                  {duty.isOnCall && (
                                    <div className="mt-0.5 text-[10px] font-medium">
                                      On-Call
                                    </div>
                                  )}
                                  {duty.notes && (
                                    <div className="mt-0.5 max-w-[100px] truncate text-[10px] opacity-70">
                                      {duty.notes}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-gray-300 p-2 text-gray-400 transition-colors hover:border-green-400 hover:bg-green-50/50 hover:text-green-700"
                                  onClick={() =>
                                    openAssignDialog(
                                      undefined,
                                      format(day, "yyyy-MM-dd")
                                    )
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assign Duty Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDuty ? "Edit Duty Assignment" : "Assign Duty"}
            </DialogTitle>
            <DialogDescription>
              {editingDuty
                ? "Update duty assignment details"
                : "Assign a staff member to a shift"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Staff Member *</Label>
              <Select value={formStaffId} onValueChange={setFormStaffId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {allStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({ROLE_LABELS[s.role]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Shift *</Label>
                <Select value={formShift} onValueChange={setFormShift}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">Morning</SelectItem>
                    <SelectItem value="AFTERNOON">Afternoon</SelectItem>
                    <SelectItem value="NIGHT">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formOnCall} onCheckedChange={setFormOnCall} />
              <Label>On-Call</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dutynotes">Notes</Label>
              <Textarea
                id="dutynotes"
                placeholder="Optional notes..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            {editingDuty && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteDuty(editingDuty.id)
                  setShowAssignDialog(false)
                }}
                className="mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDuty}
              disabled={submitting}
              className="bg-green-700 hover:bg-green-800"
            >
              {submitting
                ? "Saving..."
                : editingDuty
                ? "Update"
                : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HR MODULE
// ═══════════════════════════════════════════════════════════════════════════════

export default function HrModule() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-green-950">
          HR & Payroll Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage staff directory, attendance, payroll, and duty roster
        </p>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="bg-green-50 p-1">
          <TabsTrigger
            value="staff"
            className="data-[state=active]:bg-green-700 data-[state=active]:text-white"
          >
            <Users className="mr-2 h-4 w-4" />
            Staff Directory
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="data-[state=active]:bg-green-700 data-[state=active]:text-white"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger
            value="payroll"
            className="data-[state=active]:bg-green-700 data-[state=active]:text-white"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Payroll
          </TabsTrigger>
          <TabsTrigger
            value="roster"
            className="data-[state=active]:bg-green-700 data-[state=active]:text-white"
          >
            <Clock className="mr-2 h-4 w-4" />
            Duty Roster
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <StaffDirectory />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab />
        </TabsContent>

        <TabsContent value="payroll">
          <PayrollTab />
        </TabsContent>

        <TabsContent value="roster">
          <DutyRosterTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
