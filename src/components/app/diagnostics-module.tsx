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
  FlaskConical, Plus, MoreVertical, Eye, Edit, FileText,
  Search, Filter, TestTubes, ClipboardList, Activity,
  AlertTriangle, ChevronDown, Trash2, Link2, CheckCircle,
  Printer, QrCode, Cpu, Send, Share2, ShieldCheck, CheckCircle2
} from "lucide-react"

// Types
interface TestType {
  id: string
  name: string
  category: string | null
  price: number
  description: string | null
  isActive: boolean
  _count?: { labReports: number }
}

interface Patient {
  id: string
  name: string
  patientId: string
}

interface StaffMember {
  id: string
  name: string
  role: string
}

interface LabReport {
  id: string
  reportNo: string
  patientId: string
  testTypeId: string
  technicianId: string | null
  sampleId: string | null
  results: string | null
  status: string
  notes: string | null
  reviewedBy: string | null
  createdAt: string
  patient: Patient
  testType: { id: string; name: string; category: string | null }
  technician: { id: string; name: string } | null
  reviewer: { id: string; name: string } | null
  sample: { id: string; sampleId: string } | null
}

interface Sample {
  id: string
  sampleId: string
  patientId: string
  reportId: string | null
  collectedBy: string | null
  status: string
  collectedAt: string
  patient: Patient
  collectedByStaff: { id: string; name: string } | null
  labReport: { id: string; reportNo: string } | null
}

interface TestResult {
  parameter: string
  value: string
  unit: string
  referenceRange: string
  isAbnormal: boolean
}

// Common test type templates
const testTypeTemplates: Record<string, { name: string; category: string; price: number; parameters: TestResult[] }> = {
  "CBC": {
    name: "Complete Blood Count",
    category: "HEMATOLOGY",
    price: 500,
    parameters: [
      { parameter: "Hemoglobin", value: "", unit: "g/dL", referenceRange: "13.5-17.5", isAbnormal: false },
      { parameter: "WBC Count", value: "", unit: "×10³/µL", referenceRange: "4.5-11.0", isAbnormal: false },
      { parameter: "RBC Count", value: "", unit: "×10⁶/µL", referenceRange: "4.5-5.5", isAbnormal: false },
      { parameter: "Platelet Count", value: "", unit: "×10³/µL", referenceRange: "150-450", isAbnormal: false },
      { parameter: "Hematocrit", value: "", unit: "%", referenceRange: "38.8-50.0", isAbnormal: false },
      { parameter: "MCV", value: "", unit: "fL", referenceRange: "80-100", isAbnormal: false },
    ],
  },
  "Blood Sugar": {
    name: "Blood Sugar (Fasting)",
    category: "BIOCHEMISTRY",
    price: 200,
    parameters: [
      { parameter: "Fasting Blood Glucose", value: "", unit: "mg/dL", referenceRange: "70-100", isAbnormal: false },
    ],
  },
  "Lipid Profile": {
    name: "Lipid Profile",
    category: "BIOCHEMISTRY",
    price: 800,
    parameters: [
      { parameter: "Total Cholesterol", value: "", unit: "mg/dL", referenceRange: "<200", isAbnormal: false },
      { parameter: "HDL Cholesterol", value: "", unit: "mg/dL", referenceRange: ">40", isAbnormal: false },
      { parameter: "LDL Cholesterol", value: "", unit: "mg/dL", referenceRange: "<100", isAbnormal: false },
      { parameter: "Triglycerides", value: "", unit: "mg/dL", referenceRange: "<150", isAbnormal: false },
    ],
  },
  "Liver Function": {
    name: "Liver Function Test",
    category: "BIOCHEMISTRY",
    price: 600,
    parameters: [
      { parameter: "ALT (SGPT)", value: "", unit: "U/L", referenceRange: "7-56", isAbnormal: false },
      { parameter: "AST (SGOT)", value: "", unit: "U/L", referenceRange: "10-40", isAbnormal: false },
      { parameter: "Total Bilirubin", value: "", unit: "mg/dL", referenceRange: "0.1-1.2", isAbnormal: false },
      { parameter: "Albumin", value: "", unit: "g/dL", referenceRange: "3.5-5.0", isAbnormal: false },
      { parameter: "ALP", value: "", unit: "U/L", referenceRange: "44-147", isAbnormal: false },
    ],
  },
  "Kidney Function": {
    name: "Kidney Function Test",
    category: "BIOCHEMISTRY",
    price: 550,
    parameters: [
      { parameter: "Creatinine", value: "", unit: "mg/dL", referenceRange: "0.7-1.3", isAbnormal: false },
      { parameter: "BUN", value: "", unit: "mg/dL", referenceRange: "7-20", isAbnormal: false },
      { parameter: "Uric Acid", value: "", unit: "mg/dL", referenceRange: "2.5-7.0", isAbnormal: false },
      { parameter: "eGFR", value: "", unit: "mL/min", referenceRange: ">60", isAbnormal: false },
    ],
  },
  "Urinalysis": {
    name: "Urinalysis",
    category: "PATHOLOGY",
    price: 300,
    parameters: [
      { parameter: "pH", value: "", unit: "", referenceRange: "4.5-8.0", isAbnormal: false },
      { parameter: "Specific Gravity", value: "", unit: "", referenceRange: "1.005-1.030", isAbnormal: false },
      { parameter: "Protein", value: "", unit: "mg/dL", referenceRange: "Negative", isAbnormal: false },
      { parameter: "Glucose", value: "", unit: "mg/dL", referenceRange: "Negative", isAbnormal: false },
      { parameter: "Ketones", value: "", unit: "", referenceRange: "Negative", isAbnormal: false },
    ],
  },
  "Chest X-Ray": {
    name: "Chest X-Ray (PA View)",
    category: "RADIOLOGY",
    price: 800,
    parameters: [
      { parameter: "Lung Fields", value: "Clear bilaterally, normal vascular markings", unit: "", referenceRange: "Clear", isAbnormal: false },
      { parameter: "Cardiac Silhouette", value: "Normal cardiac size and contour (CTR < 50%)", unit: "", referenceRange: "Normal", isAbnormal: false },
      { parameter: "Costophrenic Angles", value: "Sharp and well-defined bilaterally", unit: "", referenceRange: "Sharp", isAbnormal: false },
      { parameter: "Bony Thorax & Ribs", value: "Normal appearance without focal lesion or fracture", unit: "", referenceRange: "Normal", isAbnormal: false },
    ],
  },
  "USG Abdomen": {
    name: "Ultrasonography (Whole Abdomen)",
    category: "RADIOLOGY",
    price: 1500,
    parameters: [
      { parameter: "Liver", value: "Normal in size, homogenous parenchymal echotexture", unit: "", referenceRange: "Normal", isAbnormal: false },
      { parameter: "Gall Bladder", value: "Aneurysmal, lumen clear, no calculus seen", unit: "", referenceRange: "Normal", isAbnormal: false },
      { parameter: "Kidneys (B/L)", value: "Normal cortical thickness and corticomedullary differentiation", unit: "", referenceRange: "Normal", isAbnormal: false },
      { parameter: "Urinary Bladder", value: "Well distended, smooth wall, no intravesical lesion", unit: "", referenceRange: "Normal", isAbnormal: false },
    ],
  },
  "Urine Culture": {
    name: "Urine Routine & Culture",
    category: "MICROBIOLOGY",
    price: 600,
    parameters: [
      { parameter: "Pus Cells", value: "2-4", unit: "/HPF", referenceRange: "0-5", isAbnormal: false },
      { parameter: "Epithelial Cells", value: "1-2", unit: "/HPF", referenceRange: "0-3", isAbnormal: false },
      { parameter: "Colony Count", value: "No significant growth after 48 hrs", unit: "CFU/mL", referenceRange: "<10,000", isAbnormal: false },
      { parameter: "Organism Isolated", value: "Sterile / No Pathogen", unit: "", referenceRange: "None", isAbnormal: false },
    ],
  },
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    PROCESSING: { label: "Processing", className: "bg-blue-100 text-blue-800 border-blue-200" },
    COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800 border-green-200" },
    REVIEWED: { label: "Reviewed", className: "bg-green-100 text-green-900 border-green-200" },
    COLLECTED: { label: "Collected", className: "bg-blue-100 text-blue-800 border-blue-200" },
    TESTING: { label: "Testing", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    DISCARDED: { label: "Discarded", className: "bg-red-100 text-red-800 border-red-200" },
  }
  const s = map[status] || { label: status, className: "" }
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>
}

export default function DiagnosticsModule() {
  const [activeTab, setActiveTab] = useState("lab-reports")

  // Lab Reports state
  const queryClient = useQueryClient()
  const [reportFilter, setReportFilter] = useState({ status: "", testTypeId: "", dateFrom: "", dateTo: "" })
  const [showCreateReport, setShowCreateReport] = useState(false)
  const [showReportDetail, setShowReportDetail] = useState<LabReport | null>(null)
  const [newReport, setNewReport] = useState({ patientId: "", testTypeId: "", technicianId: "", notes: "" })
  const [editResults, setEditResults] = useState<TestResult[]>([])
  const [editNotes, setEditNotes] = useState("")
  const [editReportStatus, setEditReportStatus] = useState("")

  // Samples state
  const [sampleFilter, setSampleFilter] = useState({ status: "", patientId: "" })
  const [showRegisterSample, setShowRegisterSample] = useState(false)
  const [newSample, setNewSample] = useState({ patientId: "", collectedBy: "", reportId: "" })
  const [showLinkSample, setShowLinkSample] = useState<Sample | null>(null)
  const [linkReportId, setLinkReportId] = useState("")

  // Test Types state
  const [showTestTypeDialog, setShowTestTypeDialog] = useState(false)
  const [editingTestType, setEditingTestType] = useState<TestType | null>(null)
  const [testTypeForm, setTestTypeForm] = useState({ name: "", category: "", price: "", description: "", isActive: true })
  const [showTemplateSelect, setShowTemplateSelect] = useState(false)

  // LIS & Barcode state
  const [barcodeSample, setBarcodeSample] = useState<Sample | null>(null)
  const [departmentFilter, setDepartmentFilter] = useState("ALL")
  const [isSimulatingLis, setIsSimulatingLis] = useState(false)
  const [isDispatchingReport, setIsDispatchingReport] = useState(false)
  const [signedByPathologist, setSignedByPathologist] = useState(true)

  const handleSimulateLisImport = () => {
    setIsSimulatingLis(true)
    setTimeout(() => {
      const testName = showReportDetail?.testType?.name || ""
      let newVals: TestResult[] = []

      if (testName.toLowerCase().includes("blood") || testName.toLowerCase().includes("cbc") || testName.toLowerCase().includes("hemoglobin")) {
        newVals = [
          { parameter: "Hemoglobin", value: "14.2", unit: "g/dL", referenceRange: "13.5-17.5", isAbnormal: false },
          { parameter: "WBC Count", value: "7.8", unit: "×10³/µL", referenceRange: "4.5-11.0", isAbnormal: false },
          { parameter: "RBC Count", value: "4.9", unit: "×10⁶/µL", referenceRange: "4.5-5.5", isAbnormal: false },
          { parameter: "Platelet Count", value: "245", unit: "×10³/µL", referenceRange: "150-450", isAbnormal: false },
          { parameter: "Hematocrit", value: "42.5", unit: "%", referenceRange: "38.8-50.0", isAbnormal: false },
          { parameter: "MCV", value: "88.2", unit: "fL", referenceRange: "80-100", isAbnormal: false },
        ]
      } else if (testName.toLowerCase().includes("lipid") || testName.toLowerCase().includes("cholesterol")) {
        newVals = [
          { parameter: "Total Cholesterol", value: "215", unit: "mg/dL", referenceRange: "<200", isAbnormal: true },
          { parameter: "HDL Cholesterol", value: "46", unit: "mg/dL", referenceRange: ">40", isAbnormal: false },
          { parameter: "LDL Cholesterol", value: "138", unit: "mg/dL", referenceRange: "<100", isAbnormal: true },
          { parameter: "Triglycerides", value: "162", unit: "mg/dL", referenceRange: "<150", isAbnormal: true },
        ]
      } else {
        newVals = [
          { parameter: "Fasting Blood Glucose", value: "98", unit: "mg/dL", referenceRange: "70-100", isAbnormal: false },
          { parameter: "Creatinine", value: "0.95", unit: "mg/dL", referenceRange: "0.7-1.3", isAbnormal: false },
          { parameter: "BUN", value: "14.2", unit: "mg/dL", referenceRange: "7-20", isAbnormal: false },
          { parameter: "ALT (SGPT)", value: "32", unit: "U/L", referenceRange: "7-56", isAbnormal: false },
        ]
      }

      setEditResults(newVals)
      setIsSimulatingLis(false)
      toast.success("Imported analyzer results via LIS interface (Sysmex XN-1000)!", { icon: <Cpu className="text-emerald-600" /> })
    }, 700)
  }

  const handleDispatchReport = async () => {
    if (!showReportDetail) return
    setIsDispatchingReport(true)
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: showReportDetail.patientId,
          type: "WHATSAPP",
          recipient: showReportDetail.patient?.name || "Patient",
          message: `Dear ${showReportDetail.patient?.name}, your diagnostic report (${showReportDetail.reportNo} - ${showReportDetail.testType.name}) is ready. Download PDF: https://clinic.local/reports/${showReportDetail.reportNo}`,
        }),
      })
      toast.success(`Diagnostic report dispatched via SMS & WhatsApp to ${showReportDetail.patient?.name}!`, {
        icon: <CheckCircle2 className="text-emerald-600" />
      })
    } catch {
      toast.error("Failed to dispatch report")
    } finally {
      setIsDispatchingReport(false)
    }
  }

  const { data: reports = [] } = useQuery({
    queryKey: ["lab-reports", reportFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (reportFilter.status) params.set("status", reportFilter.status)
      if (reportFilter.testTypeId) params.set("testTypeId", reportFilter.testTypeId)
      if (reportFilter.dateFrom) params.set("dateFrom", reportFilter.dateFrom)
      if (reportFilter.dateTo) params.set("dateTo", reportFilter.dateTo)
      const res = await fetch(`/api/lab-reports?${params.toString()}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: samples = [] } = useQuery({
    queryKey: ["samples", sampleFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (sampleFilter.status) params.set("status", sampleFilter.status)
      if (sampleFilter.patientId) params.set("patientId", sampleFilter.patientId)
      const res = await fetch(`/api/samples?${params.toString()}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: testTypes = [] } = useQuery({
    queryKey: ["test-types"],
    queryFn: async () => {
      const res = await fetch("/api/test-types")
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: patientsData } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients?limit=1000")
      if (!res.ok) return { patients: [] }
      return res.json()
    },
  })
  const patients = patientsData?.patients || []

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff?limit=1000")
      if (!res.ok) return []
      return res.json()
    },
  })

  // Create Lab Report
  const handleCreateReport = async () => {
    if (!newReport.patientId || !newReport.testTypeId) {
      toast.error("Please select patient and test type")
      return
    }
    try {
      const res = await fetch("/api/lab-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReport),
      })
      if (res.ok) {
        toast.success("Lab report created successfully")
        setShowCreateReport(false)
        setNewReport({ patientId: "", testTypeId: "", technicianId: "", notes: "" })
        queryClient.invalidateQueries({ queryKey: ["lab-reports"] })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to create report")
      }
    } catch { toast.error("Failed to create report") }
  }

  // Update Lab Report
  const handleUpdateReport = async (reportId: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/lab-reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success("Report updated successfully")
        queryClient.invalidateQueries({ queryKey: ["lab-reports"] })
        if (showReportDetail) {
          const updated = await res.json()
          setShowReportDetail({ ...showReportDetail, ...updated })
        }
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to update report")
      }
    } catch { toast.error("Failed to update report") }
  }

  // Save Results
  const handleSaveResults = () => {
    if (!showReportDetail) return
    handleUpdateReport(showReportDetail.id, {
      results: JSON.stringify(editResults),
      notes: editNotes,
      status: editReportStatus || showReportDetail.status,
    })
    setShowReportDetail(null)
  }

  // Update status from detail view
  const handleStatusUpdate = (status: string) => {
    setEditReportStatus(status)
    handleUpdateReport(showReportDetail!.id, { status })
  }

  // Open report detail
  const openReportDetail = (report: LabReport) => {
    setShowReportDetail(report)
    setEditNotes(report.notes || "")
    setEditReportStatus(report.status)
    try {
      const parsed = report.results ? JSON.parse(report.results) : []
      if (Array.isArray(parsed) && parsed.length > 0) {
        setEditResults(parsed)
      } else {
        // Try to get template parameters from test type
        const template = Object.values(testTypeTemplates).find(t => t.name === report.testType.name)
        if (template) {
          setEditResults(template.parameters)
        } else {
          setEditResults([{ parameter: "", value: "", unit: "", referenceRange: "", isAbnormal: false }])
        }
      }
    } catch {
      const template = Object.values(testTypeTemplates).find(t => t.name === report.testType.name)
      if (template) {
        setEditResults(template.parameters)
      } else {
        setEditResults([{ parameter: "", value: "", unit: "", referenceRange: "", isAbnormal: false }])
      }
    }
  }

  // Result field update
  const updateResultField = (index: number, field: keyof TestResult, value: string | boolean) => {
    const updated = [...editResults]
    updated[index] = { ...updated[index], [field]: value }
    // Auto-check abnormality
    if (field === "value" && updated[index].referenceRange) {
      const val = parseFloat(value as string)
      const ref = updated[index].referenceRange
      if (!isNaN(val)) {
        if (ref.startsWith("<") || ref.startsWith(">")) {
          const threshold = parseFloat(ref.replace(/[<>]/g, ""))
          updated[index].isAbnormal = !isNaN(threshold) && (
            (ref.startsWith("<") && val >= threshold) || (ref.startsWith(">") && val <= threshold)
          )
        } else if (ref.includes("-")) {
          const [low, high] = ref.split("-").map(Number)
          updated[index].isAbnormal = !isNaN(low) && !isNaN(high) && (val < low || val > high)
        } else if (ref.toLowerCase() === "negative") {
          updated[index].isAbnormal = value !== "" && value !== "Negative" && value !== "negative"
        }
      }
    }
    setEditResults(updated)
  }

  // Register Sample
  const handleRegisterSample = async () => {
    if (!newSample.patientId) {
      toast.error("Please select a patient")
      return
    }
    try {
      const res = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSample),
      })
      if (res.ok) {
        toast.success("Sample registered successfully")
        setShowRegisterSample(false)
        setNewSample({ patientId: "", collectedBy: "", reportId: "" })
        queryClient.invalidateQueries({ queryKey: ["samples"] })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to register sample")
      }
    } catch { toast.error("Failed to register sample") }
  }

  // Update Sample Status
  const handleUpdateSampleStatus = async (sampleId: string, status: string) => {
    try {
      const res = await fetch(`/api/samples/${sampleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Sample status updated to ${status}`)
        queryClient.invalidateQueries({ queryKey: ["samples"] })
      } else {
        toast.error("Failed to update sample status")
      }
    } catch { toast.error("Failed to update sample status") }
  }

  // Link Sample to Report
  const handleLinkSample = async () => {
    if (!showLinkSample || !linkReportId) {
      toast.error("Please select a report")
      return
    }
    try {
      const res = await fetch(`/api/samples/${showLinkSample.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: linkReportId }),
      })
      if (res.ok) {
        toast.success("Sample linked to report successfully")
        setShowLinkSample(null)
        setLinkReportId("")
        queryClient.invalidateQueries({ queryKey: ["samples"] })
      } else {
        toast.error("Failed to link sample")
      }
    } catch { toast.error("Failed to link sample") }
  }

  // Open link dialog
  const { data: allReports = [] } = useQuery({
    queryKey: ["lab-reports-all"],
    queryFn: async () => {
      const res = await fetch("/api/lab-reports")
      if (!res.ok) return []
      return res.json()
    },
  })

  const unlinkedReports = allReports.filter((r: LabReport) => !r.sampleId)

  const openLinkDialog = (sample: Sample) => {
    setShowLinkSample(sample)
    setLinkReportId("")
  }

  // Test Type CRUD
  const handleSaveTestType = async () => {
    if (!testTypeForm.name || !testTypeForm.price) {
      toast.error("Name and price are required")
      return
    }
    try {
      const url = editingTestType ? `/api/test-types/${editingTestType.id}` : "/api/test-types"
      const method = editingTestType ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testTypeForm),
      })
      if (res.ok) {
        toast.success(editingTestType ? "Test type updated" : "Test type created")
        setShowTestTypeDialog(false)
        setEditingTestType(null)
        setTestTypeForm({ name: "", category: "", price: "", description: "", isActive: true })
        queryClient.invalidateQueries({ queryKey: ["test-types"] })
      } else {
        toast.error("Failed to save test type")
      }
    } catch { toast.error("Failed to save test type") }
  }

  const handleToggleTestType = async (tt: TestType) => {
    try {
      const res = await fetch(`/api/test-types/${tt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tt.isActive }),
      })
      if (res.ok) {
        toast.success(`Test type ${tt.isActive ? "deactivated" : "activated"}`)
        queryClient.invalidateQueries({ queryKey: ["test-types"] })
      }
    } catch { toast.error("Failed to update test type") }
  }

  const handleDeleteTestType = async (id: string) => {
    try {
      const res = await fetch(`/api/test-types/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Test type deleted")
        queryClient.invalidateQueries({ queryKey: ["test-types"] })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to delete")
      }
    } catch { toast.error("Failed to delete test type") }
  }

  const openTestTypeDialog = (tt?: TestType) => {
    if (tt) {
      setEditingTestType(tt)
      setTestTypeForm({
        name: tt.name,
        category: tt.category || "",
        price: String(tt.price),
        description: tt.description || "",
        isActive: tt.isActive,
      })
    } else {
      setEditingTestType(null)
      setTestTypeForm({ name: "", category: "", price: "", description: "", isActive: true })
    }
    setShowTestTypeDialog(true)
  }

  const applyTemplate = (key: string) => {
    const template = testTypeTemplates[key]
    setTestTypeForm({
      name: template.name,
      category: template.category,
      price: String(template.price),
      description: `Template: ${template.name} with ${template.parameters.length} parameters`,
      isActive: true,
    })
    setShowTemplateSelect(false)
  }

  const technicians = staff.filter(s => s.role === "LAB_TECHNICIAN")
  const allStaff = staff

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-green-950">Diagnostics & Lab Management</h2>
        <p className="text-muted-foreground">Manage lab reports, sample tracking, and test types</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-green-50">
          <TabsTrigger value="lab-reports" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">
            <FileText className="size-4 mr-1" /> Lab Reports
          </TabsTrigger>
          <TabsTrigger value="samples" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">
            <TestTubes className="size-4 mr-1" /> Sample Tracking
          </TabsTrigger>
          <TabsTrigger value="test-types" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">
            <ClipboardList className="size-4 mr-1" /> Test Types
          </TabsTrigger>
        </TabsList>

        {/* Lab Reports Tab */}
        <TabsContent value="lab-reports" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5 text-green-700" /> Lab Reports
                  </CardTitle>
                  <CardDescription>Manage diagnostic reports and results</CardDescription>
                </div>
                <Button onClick={() => setShowCreateReport(true)} className="bg-green-700 hover:bg-green-800">
                  <Plus className="size-4 mr-2" /> New Lab Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                <Select value={reportFilter.status} onValueChange={(v) => setReportFilter(f => ({ ...f, status: v === "ALL" ? "" : v }))}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reportFilter.testTypeId} onValueChange={(v) => setReportFilter(f => ({ ...f, testTypeId: v === "ALL" ? "" : v }))}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="All Test Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Test Types</SelectItem>
                    {testTypes.filter(t => t.isActive).map(tt => (
                      <SelectItem key={tt.id} value={tt.id}>{tt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">From:</Label>
                  <Input type="date" className="h-9 w-[140px]" value={reportFilter.dateFrom} onChange={(e) => setReportFilter(f => ({ ...f, dateFrom: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">To:</Label>
                  <Input type="date" className="h-9 w-[140px]" value={reportFilter.dateTo} onChange={(e) => setReportFilter(f => ({ ...f, dateTo: e.target.value }))} />
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50/50">
                      <TableHead className="whitespace-nowrap">Report No</TableHead>
                      <TableHead className="whitespace-nowrap">Patient</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Test Type</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Technician</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No lab reports found. Create one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reports.map(report => (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono font-medium">{report.reportNo}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{report.patient.name}</div>
                              <div className="text-xs text-muted-foreground">{report.patient.patientId}</div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{report.testType.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{report.technician?.name || "—"}</TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openReportDetail(report)}>
                                  <Eye className="size-4 mr-2" /> View / Edit
                                </DropdownMenuItem>
                                {report.status === "PENDING" && (
                                  <DropdownMenuItem onClick={() => handleUpdateReport(report.id, { status: "PROCESSING" })}>
                                    <Activity className="size-4 mr-2" /> Start Processing
                                  </DropdownMenuItem>
                                )}
                                {report.status === "PROCESSING" && (
                                  <DropdownMenuItem onClick={() => handleUpdateReport(report.id, { status: "COMPLETED" })}>
                                    <CheckCircle className="size-4 mr-2" /> Mark Completed
                                  </DropdownMenuItem>
                                )}
                                {report.status === "COMPLETED" && (
                                  <DropdownMenuItem onClick={() => handleUpdateReport(report.id, { status: "REVIEWED" })}>
                                    <CheckCircle className="size-4 mr-2" /> Mark Reviewed
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

        {/* Samples Tab */}
        <TabsContent value="samples" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TestTubes className="size-5 text-green-700" /> Sample Tracking
                  </CardTitle>
                  <CardDescription>Track sample collection and testing status</CardDescription>
                </div>
                <Button onClick={() => setShowRegisterSample(true)} className="bg-green-700 hover:bg-green-800">
                  <Plus className="size-4 mr-2" /> Register Sample
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                <Select value={sampleFilter.status} onValueChange={(v) => setSampleFilter(f => ({ ...f, status: v === "ALL" ? "" : v }))}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="COLLECTED">Collected</SelectItem>
                    <SelectItem value="TESTING">Testing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DISCARDED">Discarded</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sampleFilter.patientId} onValueChange={(v) => setSampleFilter(f => ({ ...f, patientId: v === "ALL" ? "" : v }))}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="All Patients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Patients</SelectItem>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-[500px] overflow-y-auto overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50/50">
                      <TableHead className="whitespace-nowrap">Sample ID</TableHead>
                      <TableHead className="whitespace-nowrap">Patient</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Collected By</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Collected At</TableHead>
                      <TableHead className="whitespace-nowrap">Linked Report</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {samples.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No samples found. Register one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      samples.map(sample => (
                        <TableRow key={sample.id}>
                          <TableCell className="font-mono font-medium">{sample.sampleId}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sample.patient.name}</div>
                              <div className="text-xs text-muted-foreground">{sample.patient.patientId}</div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{sample.collectedByStaff?.name || "—"}</TableCell>
                          <TableCell>{getStatusBadge(sample.status)}</TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell">
                            {new Date(sample.collectedAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {sample.labReport ? (
                              <Badge variant="outline" className="font-mono">{sample.labReport.reportNo}</Badge>
                            ) : (
                              <Button variant="link" size="sm" className="h-auto p-0 text-green-700" onClick={() => openLinkDialog(sample)}>
                                <Link2 className="size-3 mr-1" /> Link
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setBarcodeSample(sample)}>
                                  <QrCode className="size-4 mr-2 text-emerald-700" /> Print Tube Barcode
                                </DropdownMenuItem>
                                {!sample.reportId && (
                                  <DropdownMenuItem onClick={() => openLinkDialog(sample)}>
                                    <Link2 className="size-4 mr-2" /> Link to Report
                                  </DropdownMenuItem>
                                )}
                                {sample.status === "COLLECTED" && (
                                  <DropdownMenuItem onClick={() => handleUpdateSampleStatus(sample.id, "TESTING")}>
                                    <Activity className="size-4 mr-2" /> Start Testing
                                  </DropdownMenuItem>
                                )}
                                {sample.status === "TESTING" && (
                                  <DropdownMenuItem onClick={() => handleUpdateSampleStatus(sample.id, "COMPLETED")}>
                                    <CheckCircle className="size-4 mr-2" /> Mark Completed
                                  </DropdownMenuItem>
                                )}
                                {(sample.status === "COLLECTED" || sample.status === "TESTING") && (
                                  <DropdownMenuItem onClick={() => handleUpdateSampleStatus(sample.id, "DISCARDED")} className="text-red-600">
                                    <Trash2 className="size-4 mr-2" /> Discard Sample
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

        {/* Test Types Tab */}
        <TabsContent value="test-types" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="size-5 text-green-700" /> Test Types Management
                  </CardTitle>
                  <CardDescription>Configure available diagnostic tests and their parameters</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[170px] h-9">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Departments</SelectItem>
                      <SelectItem value="HEMATOLOGY">Hematology</SelectItem>
                      <SelectItem value="BIOCHEMISTRY">Biochemistry</SelectItem>
                      <SelectItem value="PATHOLOGY">Pathology</SelectItem>
                      <SelectItem value="MICROBIOLOGY">Microbiology</SelectItem>
                      <SelectItem value="RADIOLOGY">Radiology</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setShowTemplateSelect(!showTemplateSelect)}>
                    <ClipboardList className="size-4 mr-2" /> From Template
                  </Button>
                  <Button onClick={() => openTestTypeDialog()} className="bg-green-700 hover:bg-green-800">
                    <Plus className="size-4 mr-2" /> Add Test Type
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showTemplateSelect && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-3">Select a Template</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(testTypeTemplates).map(([key, template]) => (
                      <Button key={key} variant="outline" className="justify-start h-auto py-2 text-xs"
                        onClick={() => { applyTemplate(key); openTestTypeDialog() }}>
                        <FlaskConical className="size-3 mr-2 text-green-700" />
                        <div className="text-left">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-muted-foreground">{template.parameters.length} parameters</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-[500px] overflow-y-auto overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-50/50">
                      <TableHead className="whitespace-nowrap">Name</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Category</TableHead>
                      <TableHead className="whitespace-nowrap">Price</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Reports</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const filtered = testTypes.filter(tt => departmentFilter === "ALL" || tt.category === departmentFilter)
                      if (filtered.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No test types found for the selected department.
                            </TableCell>
                          </TableRow>
                        )
                      }
                      return filtered.map(tt => (
                        <TableRow key={tt.id} className={!tt.isActive ? "opacity-50" : ""}>
                          <TableCell className="font-medium">{tt.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {tt.category ? (
                              <Badge variant="secondary">{tt.category}</Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="font-mono">৳{tt.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={tt.isActive ? "outline" : "secondary"} className={tt.isActive ? "bg-green-100 text-green-800 border-green-200" : ""}>
                              {tt.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{tt._count?.labReports || 0}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openTestTypeDialog(tt)}>
                                  <Edit className="size-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleTestType(tt)}>
                                  {tt.isActive ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteTestType(tt.id)} className="text-red-600">
                                  <Trash2 className="size-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Lab Report Dialog */}
      <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Lab Report</DialogTitle>
            <DialogDescription>Create a new diagnostic lab report</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={newReport.patientId} onValueChange={(v) => setNewReport(f => ({ ...f, patientId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.patientId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Test Type *</Label>
              <Select value={newReport.testTypeId} onValueChange={(v) => setNewReport(f => ({ ...f, testTypeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select test type" /></SelectTrigger>
                <SelectContent>
                  {testTypes.filter(t => t.isActive).map(tt => (
                    <SelectItem key={tt.id} value={tt.id}>{tt.name} — ৳{tt.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Technician</Label>
              <Select value={newReport.technicianId} onValueChange={(v) => setNewReport(f => ({ ...f, technicianId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {technicians.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={newReport.notes} onChange={(e) => setNewReport(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateReport(false)}>Cancel</Button>
            <Button onClick={handleCreateReport} className="bg-green-700 hover:bg-green-800">Create Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Detail/Edit Dialog */}
      <Dialog open={!!showReportDetail} onOpenChange={() => setShowReportDetail(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-green-700" />
              {showReportDetail?.reportNo} — {showReportDetail?.testType.name}
            </DialogTitle>
            <DialogDescription>
              Patient: {showReportDetail?.patient.name} ({showReportDetail?.patient.patientId})
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-6">
              {/* Status Section */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {getStatusBadge(editReportStatus)}
                <div className="flex gap-1 ml-2">
                  {showReportDetail?.status === "PENDING" && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusUpdate("PROCESSING")}>
                      Start Processing
                    </Button>
                  )}
                  {(showReportDetail?.status === "PROCESSING" || showReportDetail?.status === "PENDING") && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusUpdate("COMPLETED")}>
                      Mark Completed
                    </Button>
                  )}
                  {showReportDetail?.status === "COMPLETED" && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusUpdate("REVIEWED")}>
                      Mark Reviewed
                    </Button>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Technician:</span> {showReportDetail?.technician?.name || "Not assigned"}</div>
                <div><span className="text-muted-foreground">Sample:</span> {showReportDetail?.sample?.sampleId || "Not linked"}</div>
                <div><span className="text-muted-foreground">Created:</span> {showReportDetail?.createdAt ? new Date(showReportDetail.createdAt).toLocaleString() : ""}</div>
                <div><span className="text-muted-foreground">Reviewer:</span> {showReportDetail?.reviewer?.name || "Not reviewed"}</div>
              </div>

              <Separator />

              {/* Results Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FlaskConical className="size-4 text-green-700" />
                    Test Results & Biological Reference Ranges
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSimulatingLis}
                    onClick={handleSimulateLisImport}
                    className="text-xs h-7 gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                  >
                    <Cpu className="size-3.5" />
                    {isSimulatingLis ? "Connecting to Analyzer..." : "Auto-Import from LIS Analyzer"}
                  </Button>
                </div>

                <div className="space-y-2">
                  {/* Header row */}
                  <div className="grid grid-cols-[1fr_100px_80px_120px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                    <span>Parameter</span>
                    <span>Value</span>
                    <span>Unit</span>
                    <span>Reference Range</span>
                    <span>Flag</span>
                  </div>
                  {editResults.map((result, index) => (
                    <div key={index} className={`grid grid-cols-[1fr_100px_80px_120px_40px] gap-2 p-2 rounded-md ${result.isAbnormal ? "bg-red-50 border border-red-200" : "bg-muted/30"}`}>
                      <Input
                        className="h-8 text-sm"
                        value={result.parameter}
                        onChange={(e) => updateResultField(index, "parameter", e.target.value)}
                        placeholder="Parameter name"
                      />
                      <Input
                        className={`h-8 text-sm text-center ${result.isAbnormal ? "border-red-300 font-bold" : ""}`}
                        value={result.value}
                        onChange={(e) => updateResultField(index, "value", e.target.value)}
                        placeholder="Value"
                      />
                      <Input
                        className="h-8 text-sm"
                        value={result.unit}
                        onChange={(e) => updateResultField(index, "unit", e.target.value)}
                        placeholder="Unit"
                      />
                      <Input
                        className="h-8 text-sm"
                        value={result.referenceRange}
                        onChange={(e) => updateResultField(index, "referenceRange", e.target.value)}
                        placeholder="e.g. 4.5-11.0"
                      />
                      <div className="flex items-center justify-center">
                        {result.isAbnormal ? (
                          <AlertTriangle className="size-4 text-red-500" />
                        ) : (
                          <CheckCircle className="size-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setEditResults([...editResults, { parameter: "", value: "", unit: "", referenceRange: "", isAbnormal: false }])}>
                    <Plus className="size-4 mr-1" /> Add Parameter
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Pathologist Verified Digital Signature */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                      Verified Electronic Signature
                      <Badge className="bg-emerald-600 text-white text-[10px] h-4">Valid & Authenticated</Badge>
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Authorized Medical Officer / Laboratory Director | Certified Digital Signature
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  onClick={() => {
                    setSignedByPathologist(!signedByPathologist)
                    toast.success(signedByPathologist ? "Signature verified on report" : "Signature toggled")
                  }}
                >
                  {signedByPathologist ? "Verified" : "Sign Report"}
                </Button>
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about the results..."
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={isDispatchingReport}
              onClick={handleDispatchReport}
              className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs h-9"
            >
              <Share2 className="size-4" />
              {isDispatchingReport ? "Dispatching..." : "Send via WhatsApp/SMS"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowReportDetail(null)}>Cancel</Button>
              <Button onClick={handleSaveResults} className="bg-green-700 hover:bg-green-800">
                Save Results
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Sample Dialog */}
      <Dialog open={showRegisterSample} onOpenChange={setShowRegisterSample}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Sample</DialogTitle>
            <DialogDescription>Register a new sample for a patient</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={newSample.patientId} onValueChange={(v) => setNewSample(f => ({ ...f, patientId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.patientId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Collected By</Label>
              <Select value={newSample.collectedBy} onValueChange={(v) => setNewSample(f => ({ ...f, collectedBy: v }))}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {allStaff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link to Report (Optional)</Label>
              <Select value={newSample.reportId} onValueChange={(v) => setNewSample(f => ({ ...f, reportId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select report" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {reports.filter(r => !r.sampleId).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.reportNo} — {r.patient.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegisterSample(false)}>Cancel</Button>
            <Button onClick={handleRegisterSample} className="bg-green-700 hover:bg-green-800">Register Sample</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Sample Dialog */}
      <Dialog open={!!showLinkSample} onOpenChange={() => setShowLinkSample(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Sample to Report</DialogTitle>
            <DialogDescription>Sample: {showLinkSample?.sampleId}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Report</Label>
              <Select value={linkReportId} onValueChange={setLinkReportId}>
                <SelectTrigger><SelectValue placeholder="Select an unlinked report" /></SelectTrigger>
                <SelectContent>
                  {unlinkedReports.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.reportNo} — {r.patient.name} — {r.testType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkSample(null)}>Cancel</Button>
            <Button onClick={handleLinkSample} className="bg-green-700 hover:bg-green-800">Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Type Dialog */}
      <Dialog open={showTestTypeDialog} onOpenChange={setShowTestTypeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTestType ? "Edit Test Type" : "Add Test Type"}</DialogTitle>
            <DialogDescription>
              {editingTestType ? "Update test type details" : "Create a new diagnostic test type"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={testTypeForm.name} onChange={(e) => setTestTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="Test name" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={testTypeForm.category} onValueChange={(v) => setTestTypeForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEMATOLOGY">Hematology</SelectItem>
                  <SelectItem value="BIOCHEMISTRY">Biochemistry</SelectItem>
                  <SelectItem value="PATHOLOGY">Pathology</SelectItem>
                  <SelectItem value="MICROBIOLOGY">Microbiology</SelectItem>
                  <SelectItem value="RADIOLOGY">Radiology</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price (৳) *</Label>
              <Input type="number" value={testTypeForm.price} onChange={(e) => setTestTypeForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={testTypeForm.description} onChange={(e) => setTestTypeForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={testTypeForm.isActive} onChange={(e) => setTestTypeForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestTypeDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTestType} className="bg-green-700 hover:bg-green-800">
              {editingTestType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sample Tube Barcode Label Dialog */}
      <Dialog open={!!barcodeSample} onOpenChange={() => setBarcodeSample(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-emerald-700" /> Specimen Barcode Label
            </DialogTitle>
            <DialogDescription>
              Scan label for automated sample tube routing (LIS/Analyzer).
            </DialogDescription>
          </DialogHeader>

          {barcodeSample && (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white text-black space-y-3 font-mono text-center">
              <div className="flex items-center justify-between text-[11px] border-b pb-1">
                <span className="font-bold">CLINIC DIAGNOSTICS</span>
                <span className="text-[10px] bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded font-bold">K2-EDTA (Purple)</span>
              </div>

              {/* Barcode SVG simulation */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-[2px] h-12 w-48 bg-white px-2">
                  {[3,1,2,4,1,3,2,1,4,2,3,1,2,4,1,2,3,1,4,2,1,3].map((w, i) => (
                    <div key={i} className="bg-black h-full" style={{ width: `${w * 1.5}px` }} />
                  ))}
                </div>
                <p className="text-xs font-bold tracking-widest mt-1">{barcodeSample.sampleId}</p>
              </div>

              <div className="text-left text-[11px] space-y-0.5 border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Patient:</span>
                  <span className="font-bold truncate max-w-[140px]">{barcodeSample.patient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">UHID:</span>
                  <span>{barcodeSample.patient.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Collected:</span>
                  <span>{new Date(barcodeSample.collectedAt).toLocaleDateString()} {new Date(barcodeSample.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phlebotomist:</span>
                  <span>{barcodeSample.collectedByStaff?.name || "Staff"}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setBarcodeSample(null)}>Close</Button>
            <Button onClick={() => window.print()} className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5">
              <Printer className="size-4" /> Print Label (2" x 1")
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
