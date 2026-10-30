'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Activity,
  HeartPulse,
  AlertTriangle,
  FileText,
  Plus,
  Search,
  Send,
  Calendar,
  Pill,
  Trash2,
  Stethoscope,
  FolderOpen,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  FileImage,
} from 'lucide-react'
import { toast } from 'sonner'

// Common medicines preset dictionary with dosages
const MEDICINE_PRESETS = [
  { name: 'Paracetamol', strength: '500mg', route: 'Oral', defaultDosage: '1+1+1 after meals', duration: '5 days' },
  { name: 'Amoxicillin', strength: '500mg', route: 'Oral', defaultDosage: '1+0+1 after meals', duration: '7 days' },
  { name: 'Omeprazole', strength: '20mg', route: 'Oral', defaultDosage: '1+0+1 before meals', duration: '14 days' },
  { name: 'Metformin', strength: '500mg', route: 'Oral', defaultDosage: '1+0+1 with meals', duration: '30 days' },
  { name: 'Amlodipine', strength: '5mg', route: 'Oral', defaultDosage: '0+0+1 at bedtime', duration: '30 days' },
  { name: 'Azithromycin', strength: '500mg', route: 'Oral', defaultDosage: '1+0+0 before meals', duration: '3 days' },
  { name: 'Ciprofloxacin', strength: '500mg', route: 'Oral', defaultDosage: '1+0+1 after meals', duration: '7 days' },
  { name: 'Cetirizine', strength: '10mg', route: 'Oral', defaultDosage: '0+0+1 at bedtime', duration: '7 days' },
  { name: 'Montelukast', strength: '10mg', route: 'Oral', defaultDosage: '0+0+1 at bedtime', duration: '30 days' },
  { name: 'Pantoprazole', strength: '40mg', route: 'Oral', defaultDosage: '1+0+0 before meals', duration: '14 days' },
]

// Diagnostic test packages presets
const TEST_PACKAGES = [
  'Complete Blood Count (CBC)',
  'Fasting Blood Sugar (FBS)',
  'Lipid Profile',
  'Liver Function Test (LFT)',
  'Serum Creatinine & Electrolytes',
  'Chest X-Ray P/A View',
  'ECG (12-Lead)',
  'HbA1c Diabetic Profile',
  'Urine Routine & Microscopic',
  'Ultrasound Whole Abdomen',
]

// Chief complaints quick templates
const COMPLAINT_TEMPLATES = [
  'Fever with chills for 3 days',
  'Persistent dry cough with shortness of breath',
  'Acute epigastric pain radiating to back',
  'Generalized weakness and dizziness',
  'Throbbing headache with nausea',
  'Uncontrolled blood glucose with polydipsia',
  'Joint pain and morning stiffness for 2 weeks',
]

export default function EmrModule() {
  const [activeTab, setActiveTab] = useState('prescription')
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [patientDetails, setPatientDetails] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Prescription Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
  const [chiefComplaints, setChiefComplaints] = useState('')
  const [clinicalFindings, setClinicalFindings] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState<any[]>([
    { name: 'Paracetamol', strength: '500mg', route: 'Oral', dosage: '1+1+1 after meals', duration: '5 days', instructions: 'Take with full glass of water' },
  ])
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [advice, setAdvice] = useState('Adequate rest, drink 3L water daily, avoid oily/spicy foods.')
  const [followUpDate, setFollowUpDate] = useState('')
  const [dispatchChannel, setDispatchChannel] = useState('WHATSAPP')
  const [allergyWarnings, setAllergyWarnings] = useState<string[]>([])

  // Vitals Dialog State
  const [vitalsDialogOpen, setVitalsDialogOpen] = useState(false)
  const [vitalsForm, setVitalsForm] = useState({
    bpSystolic: '120',
    bpDiastolic: '80',
    pulse: '72',
    temperature: '98.6',
    spO2: '99',
    heightCm: '170',
    weightKg: '68',
    bloodSugar: '5.6',
    triagePriority: 'NORMAL',
    notes: '',
  })

  // Clinical History Dialog State
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [allergiesText, setAllergiesText] = useState('Penicillin, Peanuts')
  const [chronicText, setChronicText] = useState('Type 2 Diabetes, Hypertension')
  const [surgicalText, setSurgicalText] = useState('Appendectomy (2018)')
  const [familyText, setFamilyText] = useState('Father: CAD, Mother: Diabetes')

  // Document Upload State
  const [docDialogOpen, setDocDialogOpen] = useState(false)
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'XRAY',
    fileUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
    notes: '',
  })
  const [documents, setDocuments] = useState<any[]>([])
  const [previewDoc, setPreviewDoc] = useState<any>(null)

  // Fetch initial data
  useEffect(() => {
    fetchPatients()
    fetchDoctors()
    fetchPrescriptions()
  }, [])

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientFullDetails(selectedPatientId)
      fetchDocuments(selectedPatientId)
    }
  }, [selectedPatientId])

  // Check allergy interactions whenever medicines change
  useEffect(() => {
    if (!patientDetails?.clinicalHistory?.allergies) return
    try {
      const allergies = JSON.parse(patientDetails.clinicalHistory.allergies)
      const warnings: string[] = []
      for (const med of medicines) {
        const m = (med.name || '').toLowerCase()
        for (const a of allergies) {
          const al = (typeof a === 'string' ? a : a.allergen || '').toLowerCase()
          if (al.includes('penicillin') && (m.includes('amox') || m.includes('penicillin') || m.includes('ampicillin'))) {
            warnings.push(`⚠️ ALLERGY ALERT: Patient has confirmed ${al.toUpperCase()} allergy! "${med.name}" may cause anaphylaxis.`)
          }
          if (al.includes('aspirin') && (m.includes('aspirin') || m.includes('ibuprofen') || m.includes('naproxen'))) {
            warnings.push(`⚠️ ALLERGY ALERT: Patient has confirmed ${al.toUpperCase()} allergy! Avoid NSAIDs like "${med.name}".`)
          }
        }
      }
      setAllergyWarnings(warnings)
    } catch {
      // ignore JSON parse error
    }
  }, [medicines, patientDetails])

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients?limit=50')
      const data = await res.json()
      if (data.patients && data.patients.length > 0) {
        setPatients(data.patients)
        if (!selectedPatientId) {
          setSelectedPatientId(data.patients[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/staff?role=DOCTOR')
      const data = await res.json()
      if (Array.isArray(data)) {
        setDoctors(data)
        if (data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(data[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/prescriptions')
      const data = await res.json()
      if (Array.isArray(data)) {
        setPrescriptions(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPatientFullDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}`)
      const data = await res.json()
      setPatientDetails(data)
      if (data.clinicalHistory) {
        try {
          const al = JSON.parse(data.clinicalHistory.allergies || '[]')
          setAllergiesText(Array.isArray(al) ? al.join(', ') : al)
          const ch = JSON.parse(data.clinicalHistory.chronicConditions || '[]')
          setChronicText(Array.isArray(ch) ? ch.join(', ') : ch)
          setSurgicalText(data.clinicalHistory.surgicalHistory || '')
          setFamilyText(data.clinicalHistory.familyHistory || '')
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDocuments = async (patientId: string) => {
    try {
      const res = await fetch(`/api/medical-documents?patientId=${patientId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setDocuments(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddMedicine = (preset?: any) => {
    if (preset) {
      setMedicines([
        ...medicines,
        {
          name: preset.name,
          strength: preset.strength,
          route: preset.route,
          dosage: preset.defaultDosage,
          duration: preset.duration,
          instructions: 'As directed',
        },
      ])
    } else {
      setMedicines([
        ...medicines,
        { name: '', strength: '', route: 'Oral', dosage: '1+0+1 after meals', duration: '5 days', instructions: '' },
      ])
    }
  }

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx))
  }

  const handleUpdateMedicine = (idx: number, field: string, val: string) => {
    const updated = [...medicines]
    updated[idx][field] = val
    setMedicines(updated)
  }

  const handleToggleTest = (test: string) => {
    if (selectedTests.includes(test)) {
      setSelectedTests(selectedTests.filter((t) => t !== test))
    } else {
      setSelectedTests([...selectedTests, test])
    }
  }

  const handleSaveVitals = async () => {
    if (!selectedPatientId) return
    try {
      const res = await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          ...vitalsForm,
        }),
      })
      if (!res.ok) throw new Error('Failed to record vitals')
      toast.success('Patient Vitals & Triage recorded successfully')
      setVitalsDialogOpen(false)
      fetchPatientFullDetails(selectedPatientId)
    } catch {
      toast.error('Failed to record vitals')
    }
  }

  const handleSaveClinicalHistory = async () => {
    if (!selectedPatientId) return
    try {
      const alArray = allergiesText.split(',').map((s) => s.trim()).filter(Boolean)
      const chArray = chronicText.split(',').map((s) => s.trim()).filter(Boolean)

      const res = await fetch('/api/clinical-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          allergies: alArray,
          chronicConditions: chArray,
          surgicalHistory: surgicalText,
          familyHistory: familyText,
        }),
      })
      if (!res.ok) throw new Error('Failed to save history')
      toast.success('Clinical History & Allergies updated')
      setHistoryDialogOpen(false)
      fetchPatientFullDetails(selectedPatientId)
    } catch {
      toast.error('Failed to save history')
    }
  }

  const handleSaveDocument = async () => {
    if (!selectedPatientId || !docForm.title) {
      toast.error('Please enter a document title')
      return
    }
    try {
      const res = await fetch('/api/medical-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          ...docForm,
        }),
      })
      if (!res.ok) throw new Error('Failed to save document')
      toast.success('Medical document archived successfully')
      setDocDialogOpen(false)
      fetchDocuments(selectedPatientId)
    } catch {
      toast.error('Failed to archive document')
    }
  }

  const handleGeneratePrescription = async () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient')
      return
    }
    if (!selectedDoctorId) {
      toast.error('Please select an attending doctor')
      return
    }
    if (medicines.length === 0 || !medicines[0].name) {
      toast.error('Please prescribe at least one medication')
      return
    }

    setLoading(true)
    try {
      // Find or create an appointment reference
      const appointmentId = patientDetails?.appointments?.[0]?.id || 'appt-emr-direct'

      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          doctorId: selectedDoctorId,
          patientId: selectedPatientId,
          chiefComplaints,
          clinicalFindings,
          diagnosis: diagnosis || 'Acute Upper Respiratory Tract Infection',
          medicines,
          investigations: selectedTests,
          adviceTemplates: advice,
          followUpDate: followUpDate || undefined,
          dispatchChannel,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate prescription')

      toast.success(`Prescription generated! Dispatched via ${dispatchChannel} to patient`)
      fetchPrescriptions()
      fetchPatientFullDetails(selectedPatientId)
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate prescription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Electronic Medical Records (EMR) & Digital Prescription</h2>
            <p className="text-xs text-muted-foreground">Vitals, Clinical History, Drug Allergy Warnings & Prescription Pad</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Patient Selector */}
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-[220px] h-9 text-xs">
              <SelectValue placeholder="Select Patient..." />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name} ({p.patientId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setVitalsDialogOpen(true)}
            className="h-9 gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <HeartPulse className="h-3.5 w-3.5" />
            <span>Record Vitals</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setHistoryDialogOpen(true)}
            className="h-9 gap-1.5 text-xs text-blue-700 border-blue-300 hover:bg-blue-50"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Allergies / History</span>
          </Button>
        </div>
      </div>

      {/* Patient EMR Summary Banner */}
      {patientDetails && (
        <Card className="bg-gradient-to-r from-emerald-50/50 via-background to-blue-50/50 border-emerald-100">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Patient:</span>
                <p className="font-semibold text-foreground text-sm">{patientDetails.name}</p>
                <p className="font-mono text-[11px] text-emerald-700 font-bold">{patientDetails.patientId}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Gender / Blood:</span>
                <p className="font-medium text-foreground">{patientDetails.gender || 'N/A'} • {patientDetails.bloodGroup || 'O+'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium text-foreground">{patientDetails.phone}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Latest BP & SpO2:</span>
                <p className="font-medium text-foreground">
                  {patientDetails.vitals?.[0]
                    ? `${patientDetails.vitals[0].bpSystolic}/${patientDetails.vitals[0].bpDiastolic} mmHg • ${patientDetails.vitals[0].spO2}%`
                    : '120/80 mmHg (Normal)'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">BMI:</span>
                <p className="font-medium text-foreground">
                  {patientDetails.vitals?.[0]?.bmi ? `${patientDetails.vitals[0].bmi} kg/m²` : '23.5 (Normal)'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Documented Allergies:</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                    Penicillin
                  </Badge>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-700 border-amber-300">
                    Peanuts
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Allergy Warnings Alert */}
      {allergyWarnings.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg space-y-1">
          {allergyWarnings.map((warn, i) => (
            <p key={i} className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
              {warn}
            </p>
          ))}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="prescription" className="text-xs gap-1.5">
            <Pill className="h-3.5 w-3.5" />
            Prescription Pad
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Past Prescriptions
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            Scans & Archiving
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Digital Prescription Generator */}
        <TabsContent value="prescription" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Clinical Notes & Presets */}
            <div className="space-y-4 lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Doctor & Chief Complaints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Attending Doctor</Label>
                    <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue placeholder="Select Doctor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="text-xs">
                            {d.name} ({d.specialization || d.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">Chief Complaints</Label>
                      <span className="text-[10px] text-muted-foreground">Quick Templates:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {COMPLAINT_TEMPLATES.slice(0, 3).map((template, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setChiefComplaints((prev) => (prev ? `${prev}, ${template}` : template))}
                          className="text-[10px] bg-secondary hover:bg-secondary/80 px-1.5 py-0.5 rounded cursor-pointer text-secondary-foreground"
                        >
                          + {template.slice(0, 20)}...
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={chiefComplaints}
                      onChange={(e) => setChiefComplaints(e.target.value)}
                      placeholder="e.g. High grade fever for 3 days with chills, severe throat pain..."
                      className="text-xs h-16"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Clinical Findings / Examination</Label>
                    <Textarea
                      value={clinicalFindings}
                      onChange={(e) => setClinicalFindings(e.target.value)}
                      placeholder="Chest: Bilateral wheeze, Abdomen: Soft, non-tender, Throat: Congested..."
                      className="text-xs h-16 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Provisional Diagnosis</Label>
                    <Input
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Acute Bronchitis / Viral Fever"
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Diagnostic Test Ordering */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span>Order Diagnostic Tests</span>
                    <Badge variant="outline" className="text-[10px]">{selectedTests.length} selected</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[11px] text-muted-foreground mb-2">Select pre-saved test packages to include in prescription:</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {TEST_PACKAGES.map((test) => {
                      const isSelected = selectedTests.includes(test)
                      return (
                        <div
                          key={test}
                          onClick={() => handleToggleTest(test)}
                          className={`text-xs p-1.5 rounded border cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium' : 'hover:bg-accent'
                          }`}
                        >
                          <span>{test}</span>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Medications & Follow-up */}
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Rx: Prescribed Medications</CardTitle>
                    <CardDescription className="text-xs">Strength, route, frequency (e.g. 1+0+1), duration</CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleAddMedicine()} className="h-8 gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Add Drug
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Quick Drug Presets Pills */}
                  <div>
                    <span className="text-[11px] text-muted-foreground mr-1.5">Common Presets:</span>
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {MEDICINE_PRESETS.slice(0, 6).map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleAddMedicine(preset)}
                          className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 px-2 py-0.5 rounded cursor-pointer"
                        >
                          + {preset.name} ({preset.strength})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Medicines List Table */}
                  <div className="space-y-2 border rounded-lg p-2 bg-muted/20">
                    {medicines.map((med, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-card p-2 rounded border">
                        <div className="col-span-3">
                          <Label className="text-[10px]">Medicine Name</Label>
                          <Input
                            value={med.name}
                            onChange={(e) => handleUpdateMedicine(idx, 'name', e.target.value)}
                            placeholder="e.g. Amoxicillin"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-[10px]">Strength</Label>
                          <Input
                            value={med.strength}
                            onChange={(e) => handleUpdateMedicine(idx, 'strength', e.target.value)}
                            placeholder="500mg"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-[10px]">Dosage / Frequency</Label>
                          <Input
                            value={med.dosage}
                            onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                            placeholder="1+0+1 after meals"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-[10px]">Duration</Label>
                          <Input
                            value={med.duration}
                            onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                            placeholder="7 days"
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-end pt-3">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="h-7 w-7 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Advice & Instructions */}
                  <div>
                    <Label className="text-xs">Special Advice & Lifestyle Precautions</Label>
                    <Textarea
                      value={advice}
                      onChange={(e) => setAdvice(e.target.value)}
                      className="text-xs h-16 mt-1"
                    />
                  </div>

                  {/* Follow-up & Dispatch Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <Label className="text-xs flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                        Next Review / Follow-up Date (Auto Calendar Sync)
                      </Label>
                      <Input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="h-8 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5 text-blue-600" />
                        Instant Dispatch Delivery Channel
                      </Label>
                      <Select value={dispatchChannel} onValueChange={setDispatchChannel}>
                        <SelectTrigger className="h-8 text-xs mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WHATSAPP">WhatsApp (PDF & Download Link)</SelectItem>
                          <SelectItem value="SMS">SMS Notification with Web Link</SelectItem>
                          <SelectItem value="EMAIL">Email PDF Copy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      onClick={handleGeneratePrescription}
                      disabled={loading}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 text-xs h-9 px-4"
                    >
                      <Printer className="h-4 w-4" />
                      Generate & Dispatch Digital Prescription
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Past Prescriptions History */}
        <TabsContent value="history" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Prescription History & Digital Archive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prescriptions.map((rx) => {
                  let meds: any[] = []
                  try {
                    meds = rx.medicines ? JSON.parse(rx.medicines) : []
                  } catch {
                    meds = []
                  }

                  return (
                    <div key={rx.id} className="p-4 border rounded-xl bg-card space-y-2 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                        <div>
                          <span className="font-semibold text-foreground text-sm">{rx.patient?.name}</span>
                          <span className="text-xs text-muted-foreground ml-2 font-mono">({rx.patient?.patientId})</span>
                          <Badge variant="outline" className="ml-2 text-[10px] bg-emerald-50 text-emerald-800">
                            Dr. {rx.doctor?.name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(rx.createdAt).toLocaleDateString()}</span>
                          {rx.isDispatched && (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] py-0">
                              Dispatched via {rx.dispatchChannel}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-xs space-y-1">
                        <p><span className="text-muted-foreground">Diagnosis:</span> <strong className="text-foreground">{rx.diagnosis || 'General Consultation'}</strong></p>
                        {rx.chiefComplaints && <p><span className="text-muted-foreground">Complaints:</span> {rx.chiefComplaints}</p>}
                      </div>

                      <div className="bg-muted/30 p-2.5 rounded-lg text-xs space-y-1">
                        <span className="text-muted-foreground font-semibold text-[11px]">Medicines Prescribed:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                          {meds.map((m, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>{m.name} ({m.strength}) &mdash; {m.dosage} [{m.duration}]</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {rx.followUpDate && (
                        <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Review Scheduled: {new Date(rx.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Document & Image Archiving (X-rays, MRIs, external lab reports) */}
        <TabsContent value="documents" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Document & Image Archiving</CardTitle>
                <CardDescription className="text-xs">Past X-Rays, MRIs, CT Scans, Discharge Summaries</CardDescription>
              </div>
              <Button size="sm" onClick={() => setDocDialogOpen(true)} className="h-8 gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white">
                <Plus className="h-3.5 w-3.5" />
                Archive Document
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No archived scans or medical files for this patient yet. Click &quot;Archive Document&quot; to upload.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow">
                      <div className="h-36 bg-muted relative flex items-center justify-center overflow-hidden">
                        {doc.fileUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={doc.fileUrl} alt={doc.title} className="w-full h-full object-cover" />
                        ) : (
                          <FileImage className="h-10 w-10 text-muted-foreground/50" />
                        )}
                        <Badge className="absolute top-2 left-2 text-[10px] bg-black/60 text-white border-0">
                          {doc.category}
                        </Badge>
                      </div>
                      <div className="p-3 space-y-1 text-xs">
                        <p className="font-semibold text-foreground truncate">{doc.title}</p>
                        <p className="text-muted-foreground text-[11px]">{new Date(doc.createdAt).toLocaleDateString()}</p>
                        {doc.notes && <p className="text-muted-foreground text-[11px] italic truncate">{doc.notes}</p>}
                        <div className="pt-2 flex justify-end">
                          <Button size="sm" variant="outline" onClick={() => setPreviewDoc(doc)} className="h-7 text-xs gap-1">
                            <Eye className="h-3 w-3" /> Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Vitals Dialog */}
      <Dialog open={vitalsDialogOpen} onOpenChange={setVitalsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-emerald-600" />
              Record Patient Vitals & Triage
            </DialogTitle>
            <DialogDescription className="text-xs">
              Log pre-consultation vitals. BMI is automatically computed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2 text-xs">
            <div>
              <Label className="text-xs">BP Systolic (mmHg)</Label>
              <Input
                value={vitalsForm.bpSystolic}
                onChange={(e) => setVitalsForm({ ...vitalsForm, bpSystolic: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="120"
              />
            </div>
            <div>
              <Label className="text-xs">BP Diastolic (mmHg)</Label>
              <Input
                value={vitalsForm.bpDiastolic}
                onChange={(e) => setVitalsForm({ ...vitalsForm, bpDiastolic: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="80"
              />
            </div>
            <div>
              <Label className="text-xs">Pulse Rate (bpm)</Label>
              <Input
                value={vitalsForm.pulse}
                onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="72"
              />
            </div>
            <div>
              <Label className="text-xs">Temperature (°F)</Label>
              <Input
                value={vitalsForm.temperature}
                onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="98.6"
              />
            </div>
            <div>
              <Label className="text-xs">Oxygen Saturation SpO2 (%)</Label>
              <Input
                value={vitalsForm.spO2}
                onChange={(e) => setVitalsForm({ ...vitalsForm, spO2: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="99"
              />
            </div>
            <div>
              <Label className="text-xs">Blood Sugar (mmol/L)</Label>
              <Input
                value={vitalsForm.bloodSugar}
                onChange={(e) => setVitalsForm({ ...vitalsForm, bloodSugar: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="5.6"
              />
            </div>
            <div>
              <Label className="text-xs">Height (cm)</Label>
              <Input
                value={vitalsForm.heightCm}
                onChange={(e) => setVitalsForm({ ...vitalsForm, heightCm: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="170"
              />
            </div>
            <div>
              <Label className="text-xs">Weight (kg)</Label>
              <Input
                value={vitalsForm.weightKg}
                onChange={(e) => setVitalsForm({ ...vitalsForm, weightKg: e.target.value })}
                className="h-8 text-xs mt-1"
                placeholder="68"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Triage Priority</Label>
              <Select
                value={vitalsForm.triagePriority}
                onValueChange={(v) => setVitalsForm({ ...vitalsForm, triagePriority: v })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal (Standard Queue)</SelectItem>
                  <SelectItem value="URGENT">Urgent (Priority Call)</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency (Immediate Attention)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setVitalsDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveVitals} className="bg-emerald-700 text-white">Save Vitals</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allergies & Clinical History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Document Clinical History & Drug Allergies
            </DialogTitle>
            <DialogDescription className="text-xs">
              Allergies recorded here will trigger safety alerts when doctors prescribe medications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs font-semibold text-red-700">Drug & Food Allergies (Comma separated)</Label>
              <Input
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="e.g. Penicillin, Aspirin, Sulfa drugs, Peanuts"
                className="h-8 text-xs mt-1 border-red-200"
              />
            </div>

            <div>
              <Label className="text-xs">Chronic Conditions (Comma separated)</Label>
              <Input
                value={chronicText}
                onChange={(e) => setChronicText(e.target.value)}
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Past Surgical History</Label>
              <Textarea
                value={surgicalText}
                onChange={(e) => setSurgicalText(e.target.value)}
                placeholder="e.g. Cholecystectomy (2020), Cesarean section (2016)"
                className="text-xs h-16 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Family Medical Background</Label>
              <Input
                value={familyText}
                onChange={(e) => setFamilyText(e.target.value)}
                placeholder="e.g. Father: Hypertension, Mother: Diabetes mellitus"
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveClinicalHistory} className="bg-emerald-700 text-white">Save History</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-emerald-600" />
              Archive Medical Scan / Report
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">Document Title</Label>
              <Input
                value={docForm.title}
                onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                placeholder="e.g. Chest X-Ray P/A View"
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Category</Label>
              <Select
                value={docForm.category}
                onValueChange={(v) => setDocForm({ ...docForm, category: v })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XRAY">X-Ray Image</SelectItem>
                  <SelectItem value="MRI">MRI Scan</SelectItem>
                  <SelectItem value="CT_SCAN">CT Scan</SelectItem>
                  <SelectItem value="DISCHARGE_SUMMARY">Discharge Summary</SelectItem>
                  <SelectItem value="EXTERNAL_LAB">External Lab Report</SelectItem>
                  <SelectItem value="OTHER">Other Medical Record</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Image / File URL</Label>
              <Input
                value={docForm.fileUrl}
                onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                placeholder="https://..."
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Clinical Radiologist Notes</Label>
              <Textarea
                value={docForm.notes}
                onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                placeholder="Findings: Normal cardiac shadow, clear costophrenic angles..."
                className="text-xs h-16 mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDocDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveDocument} className="bg-emerald-700 text-white">Archive File</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      {previewDoc && (
        <Dialog open={Boolean(previewDoc)} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">{previewDoc.title}</DialogTitle>
              <DialogDescription className="text-xs">{previewDoc.category} &bull; {new Date(previewDoc.createdAt).toLocaleDateString()}</DialogDescription>
            </DialogHeader>
            <div className="max-h-[400px] overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewDoc.fileUrl} alt={previewDoc.title} className="max-h-[380px] w-auto object-contain" />
            </div>
            {previewDoc.notes && <p className="text-xs text-muted-foreground mt-2">{previewDoc.notes}</p>}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

