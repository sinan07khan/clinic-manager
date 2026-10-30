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
  Bed as BedIcon,
  Scissors,
  FileCheck2,
  Plus,
  RotateCcw,
  User,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Printer,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'

export default function DaycareBedsModule() {
  const [activeTab, setActiveTab] = useState('floorplan')
  const [beds, setBeds] = useState<any[]>([])
  const [procedures, setProcedures] = useState<any[]>([])
  const [dischargeSummaries, setDischargeSummaries] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])

  // Bed Admission Dialog State
  const [admitDialogOpen, setAdmitDialogOpen] = useState(false)
  const [selectedBed, setSelectedBed] = useState<any>(null)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [admissionDiagnosis, setAdmissionDiagnosis] = useState('')
  const [doctorNotes, setDoctorNotes] = useState('')

  // OT Procedure Dialog State
  const [otDialogOpen, setOtDialogOpen] = useState(false)
  const [otForm, setOtForm] = useState({
    patientId: '',
    procedureName: 'Excision of Lipoma / Minor Suturing',
    otRoom: 'MINOR_OT_1',
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    leadSurgeonId: '',
    anesthetistId: '',
    notes: 'Local anesthesia 2% lignocaine with adrenaline reserved',
  })

  // Discharge Summary Dialog State
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false)
  const [summaryForm, setSummaryForm] = useState({
    patientId: '',
    doctorId: '',
    finalDiagnosis: 'Acute Gastroenteritis with Moderate Dehydration - Resolved',
    treatmentGiven: 'IV Fluids (RL, DNS 2L), Inj. Ondansetron, Inj. Pantoprazole, Oral rehydration therapy',
    conditionOnDischarge: 'Hemodynamically stable, afebrile, tolerating oral fluids well',
    medicationsOnDischarge: 'Tab. Cefixime 200mg (1+0+1 x 5d), ORS 1 packet after each loose stool, Cap. Omeprazole 20mg (1+0+0)',
    emergencyRedFlags: 'High spike fever >102°F, persistent vomiting, severe abdominal cramping, extreme lethargy',
    followUpAdvice: 'OPD follow-up after 5 days with repeat serum electrolytes',
  })

  useEffect(() => {
    fetchBeds()
    fetchProcedures()
    fetchDischargeSummaries()
    fetchPatients()
    fetchDoctors()
  }, [])

  const fetchBeds = async () => {
    try {
      const res = await fetch('/api/beds')
      const data = await res.json()
      if (Array.isArray(data)) setBeds(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchProcedures = async () => {
    try {
      const res = await fetch('/api/ot-procedures')
      const data = await res.json()
      if (Array.isArray(data)) setProcedures(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDischargeSummaries = async () => {
    try {
      const res = await fetch('/api/discharge-summaries')
      const data = await res.json()
      if (Array.isArray(data)) setDischargeSummaries(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients?limit=50')
      const data = await res.json()
      if (data.patients) setPatients(data.patients)
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
        if (data.length > 0) {
          setOtForm((prev) => ({ ...prev, leadSurgeonId: data[0].id }))
          setSummaryForm((prev) => ({ ...prev, doctorId: data[0].id }))
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenAdmit = (bed: any) => {
    setSelectedBed(bed)
    setAdmitDialogOpen(true)
  }

  const handleConfirmAdmit = async () => {
    if (!selectedBed || !selectedPatientId) {
      toast.error('Please select a patient to admit')
      return
    }

    try {
      const res = await fetch('/api/beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADMIT',
          bedId: selectedBed.id,
          patientId: selectedPatientId,
          diagnosis: admissionDiagnosis,
          doctorNotes,
        }),
      })

      if (!res.ok) throw new Error('Failed to admit patient')
      toast.success(`Patient admitted to bed ${selectedBed.bedNumber}`)
      setAdmitDialogOpen(false)
      fetchBeds()
    } catch {
      toast.error('Failed to admit patient')
    }
  }

  const handleDischargeBed = async (bed: any) => {
    try {
      const res = await fetch('/api/beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISCHARGE',
          bedId: bed.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to discharge bed')
      toast.success(`Bed ${bed.bedNumber} discharged and marked for Cleaning`)
      fetchBeds()
    } catch {
      toast.error('Failed to discharge bed')
    }
  }

  const handleMarkCleaned = async (bedId: string) => {
    try {
      await fetch('/api/beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          bedId,
          newStatus: 'AVAILABLE',
        }),
      })
      toast.success('Bed sanitized & marked Available')
      fetchBeds()
    } catch {
      toast.error('Failed to update bed')
    }
  }

  const handleScheduleOt = async () => {
    if (!otForm.patientId || !otForm.leadSurgeonId) {
      toast.error('Please select patient and surgeon')
      return
    }

    try {
      const res = await fetch('/api/ot-procedures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(otForm),
      })

      if (!res.ok) throw new Error('Failed to schedule procedure')
      toast.success('Minor OT procedure scheduled successfully')
      setOtDialogOpen(false)
      fetchProcedures()
    } catch {
      toast.error('Failed to schedule procedure')
    }
  }

  const handleCreateDischargeSummary = async () => {
    if (!summaryForm.patientId || !summaryForm.doctorId) {
      toast.error('Please select patient and attending physician')
      return
    }

    try {
      const res = await fetch('/api/discharge-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summaryForm),
      })

      if (!res.ok) throw new Error('Failed to generate summary')
      toast.success('Standardized Discharge Summary generated successfully')
      setDischargeDialogOpen(false)
      fetchDischargeSummaries()
    } catch {
      toast.error('Failed to generate summary')
    }
  }

  const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED').length
  const availableBeds = beds.filter((b) => b.status === 'AVAILABLE').length
  const cleaningBeds = beds.filter((b) => b.status === 'CLEANING').length

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
            <BedIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Bed, Daycare & Operation Theater (OT) Management</h2>
            <p className="text-xs text-muted-foreground">Floor Plan Live Tracker, Minor OT Slot Booking & Standardized Discharge Summaries</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setOtDialogOpen(true)} className="h-9 gap-1.5 text-xs">
            <Scissors className="h-3.5 w-3.5" /> Book Minor OT
          </Button>
          <Button size="sm" onClick={() => setDischargeDialogOpen(true)} className="h-9 gap-1.5 text-xs bg-indigo-700 hover:bg-indigo-800 text-white">
            <FileCheck2 className="h-3.5 w-3.5" /> Generate Discharge Summary
          </Button>
        </div>
      </div>

      {/* Bed Occupancy KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border">
          <span className="text-xs text-muted-foreground">Total Ward & Daycare Beds</span>
          <p className="text-2xl font-bold text-foreground mt-1">{beds.length}</p>
        </Card>
        <Card className="p-4 bg-emerald-50/50 border border-emerald-200">
          <span className="text-xs text-emerald-800 font-medium">Available (Ready to Admit)</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{availableBeds}</p>
        </Card>
        <Card className="p-4 bg-red-50/50 border border-red-200">
          <span className="text-xs text-red-800 font-medium">Occupied (In Patient)</span>
          <p className="text-2xl font-bold text-red-700 mt-1">{occupiedBeds}</p>
        </Card>
        <Card className="p-4 bg-amber-50/50 border border-amber-200">
          <span className="text-xs text-amber-800 font-medium">Under Cleaning / Sterilization</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{cleaningBeds}</p>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="floorplan" className="text-xs gap-1.5">
            <BedIcon className="h-3.5 w-3.5" /> Floor Plan Tracker
          </TabsTrigger>
          <TabsTrigger value="ot" className="text-xs gap-1.5">
            <Scissors className="h-3.5 w-3.5" /> Minor OT Procedures
          </TabsTrigger>
          <TabsTrigger value="discharge" className="text-xs gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5" /> Discharge Summaries
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Visual Floor Plan */}
        <TabsContent value="floorplan" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Visual Floor Plan & Bed Status</CardTitle>
                <CardDescription className="text-xs">Real-time status of observation daycare, cabins, and wards</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={fetchBeds} className="h-8 text-xs gap-1">
                <RotateCcw className="h-3 w-3" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {beds.map((bed) => {
                  const currentAdmission = bed.admissions?.[0]
                  const patient = currentAdmission?.patient

                  return (
                    <div
                      key={bed.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                        bed.status === 'OCCUPIED'
                          ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200'
                          : bed.status === 'CLEANING'
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200'
                          : bed.status === 'MAINTENANCE'
                          ? 'bg-gray-100 border-gray-300'
                          : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-sm text-foreground">{bed.bedNumber}</span>
                          <Badge
                            className={`text-[10px] py-0 ${
                              bed.status === 'OCCUPIED'
                                ? 'bg-red-600 text-white'
                                : bed.status === 'CLEANING'
                                ? 'bg-amber-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {bed.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{bed.ward.replace('_', ' ')} • BDT {bed.dailyRate}/day</p>

                        {bed.status === 'OCCUPIED' && patient ? (
                          <div className="mt-3 p-2 rounded bg-background/80 border text-xs space-y-0.5">
                            <p className="font-semibold text-foreground truncate">{patient.name}</p>
                            <p className="text-muted-foreground text-[10px] font-mono">{patient.patientId}</p>
                            {currentAdmission?.diagnosis && (
                              <p className="text-muted-foreground text-[10px] italic truncate">{currentAdmission.diagnosis}</p>
                            )}
                          </div>
                        ) : bed.status === 'CLEANING' ? (
                          <div className="mt-3 p-2 rounded bg-background/80 border text-[11px] text-amber-800 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                            <span>Sanitizing & linen replacement</span>
                          </div>
                        ) : (
                          <div className="mt-4 text-[11px] text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Ready for admission</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t flex justify-end gap-1.5">
                        {bed.status === 'AVAILABLE' ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenAdmit(bed)}
                            className="w-full h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                          >
                            Admit Patient
                          </Button>
                        ) : bed.status === 'OCCUPIED' ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDischargeBed(bed)}
                            className="w-full h-7 text-xs"
                          >
                            Discharge
                          </Button>
                        ) : bed.status === 'CLEANING' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkCleaned(bed.id)}
                            className="w-full h-7 text-xs text-amber-900 border-amber-300 hover:bg-amber-100"
                          >
                            Mark Ready
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Minor OT Procedures */}
        <TabsContent value="ot" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Minor Operation Theater (OT) Schedule</CardTitle>
                <CardDescription className="text-xs">Scheduled day procedures, surgeon assignments & equipment booking</CardDescription>
              </div>
              <Button size="sm" onClick={() => setOtDialogOpen(true)} className="h-8 gap-1.5 text-xs bg-indigo-700 text-white">
                <Plus className="h-3.5 w-3.5" /> Schedule Procedure
              </Button>
            </CardHeader>
            <CardContent>
              {procedures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No minor OT procedures scheduled. Click &quot;Schedule Procedure&quot; to book a slot.
                </div>
              ) : (
                <div className="space-y-3">
                  {procedures.map((proc) => (
                    <div key={proc.id} className="p-4 border rounded-xl bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{proc.procedureName}</span>
                          <Badge variant="outline" className="font-mono text-[10px] text-indigo-700 border-indigo-300">
                            {proc.procedureNo}
                          </Badge>
                          <Badge className="bg-indigo-100 text-indigo-900 text-[10px] py-0">
                            {proc.otRoom.replace('_', ' ')}
                          </Badge>
                          <Badge className={proc.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}>
                            {proc.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          Patient: <strong className="text-foreground">{proc.patient?.name || 'Patient'}</strong> • Lead Surgeon: <strong className="text-foreground">Dr. {proc.leadSurgeon?.name || 'Surgeon'}</strong>
                        </p>
                        <p className="text-muted-foreground text-[11px] flex items-center gap-3">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(proc.scheduledDate).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {proc.startTime} &ndash; {proc.endTime}</span>
                        </p>
                        {proc.notes && <p className="text-muted-foreground text-[11px] italic mt-1">{proc.notes}</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        {proc.status !== 'COMPLETED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await fetch('/api/ot-procedures', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: proc.id, status: 'COMPLETED' }),
                              })
                              toast.success('Procedure marked as COMPLETED')
                              fetchProcedures()
                            }}
                            className="h-8 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          >
                            Mark Completed
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Standardized Discharge Summaries */}
        <TabsContent value="discharge" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Standardized Discharge Summaries</CardTitle>
                <CardDescription className="text-xs">Clinical discharge notes, take-home medications & emergency red-flag instructions</CardDescription>
              </div>
              <Button size="sm" onClick={() => setDischargeDialogOpen(true)} className="h-8 gap-1.5 text-xs bg-indigo-700 text-white">
                <Plus className="h-3.5 w-3.5" /> New Discharge Summary
              </Button>
            </CardHeader>
            <CardContent>
              {dischargeSummaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No discharge summaries created yet. Click &quot;New Discharge Summary&quot; to generate one.
                </div>
              ) : (
                <div className="space-y-4">
                  {dischargeSummaries.map((summary) => (
                    <div key={summary.id} className="p-4 border rounded-xl bg-card space-y-3 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                        <div>
                          <span className="font-semibold text-foreground text-sm">{summary.patient?.name}</span>
                          <span className="text-xs text-muted-foreground ml-2 font-mono">({summary.patient?.patientId})</span>
                          <Badge variant="outline" className="ml-2 text-[10px] font-mono text-indigo-700 border-indigo-200">
                            {summary.summaryNo}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Admit: {new Date(summary.admissionDate).toLocaleDateString()} &ndash; Discharge: {new Date(summary.dischargeDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground font-semibold">Final Diagnosis:</span>
                          <p className="font-medium text-foreground">{summary.finalDiagnosis}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-semibold">Condition on Discharge:</span>
                          <p className="font-medium text-emerald-700">{summary.conditionOnDischarge}</p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/30 text-xs space-y-1">
                        <span className="text-muted-foreground font-semibold">Discharge Medications & Regimen:</span>
                        <p className="text-foreground">{summary.medicationsOnDischarge}</p>
                      </div>

                      {summary.emergencyRedFlags && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs space-y-0.5">
                          <span className="font-semibold text-red-800 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-red-600" /> Emergency Red-Flag Warning Signs:
                          </span>
                          <p className="text-red-700 text-[11px]">{summary.emergencyRedFlags}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs pt-2 border-t text-muted-foreground">
                        <span>Attending: Dr. {summary.doctor?.name || 'Physician'}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            window.print()
                            toast.success('Printing discharge summary letterhead')
                          }}
                          className="h-7 text-xs gap-1"
                        >
                          <Printer className="h-3 w-3" /> Print Summary
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bed Admission Dialog */}
      <Dialog open={admitDialogOpen} onOpenChange={setAdmitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <BedIcon className="h-4 w-4 text-emerald-600" />
              Admit Patient to Bed {selectedBed?.bedNumber}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign patient to daycare or observation ward.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">Select Patient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Choose patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.name} ({p.patientId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Admission Diagnosis / Indication</Label>
              <Input
                value={admissionDiagnosis}
                onChange={(e) => setAdmissionDiagnosis(e.target.value)}
                placeholder="e.g. Daycare chemotherapy / Post-op observation"
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Doctor / Nurse Notes</Label>
              <Textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Monitor vitals Q2H, maintain IV cannula..."
                className="text-xs h-16 mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAdmitDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleConfirmAdmit} className="bg-emerald-700 text-white">Confirm Admission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule OT Dialog */}
      <Dialog open={otDialogOpen} onOpenChange={setOtDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Scissors className="h-4 w-4 text-indigo-600" />
              Schedule Minor OT Procedure
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">Patient</Label>
              <Select value={otForm.patientId} onValueChange={(v) => setOtForm({ ...otForm, patientId: v })}>
                <SelectTrigger className="h-8 text-xs mt-1">
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
            </div>

            <div>
              <Label className="text-xs">Procedure Name</Label>
              <Input
                value={otForm.procedureName}
                onChange={(e) => setOtForm({ ...otForm, procedureName: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">OT Room</Label>
                <Select value={otForm.otRoom} onValueChange={(v) => setOtForm({ ...otForm, otRoom: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINOR_OT_1">Minor OT 1</SelectItem>
                    <SelectItem value="MINOR_OT_2">Minor OT 2</SelectItem>
                    <SelectItem value="MAIN_OT">Main Operation Theater</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={otForm.scheduledDate}
                  onChange={(e) => setOtForm({ ...otForm, scheduledDate: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input
                  value={otForm.startTime}
                  onChange={(e) => setOtForm({ ...otForm, startTime: e.target.value })}
                  className="h-8 text-xs mt-1"
                  placeholder="10:00 AM"
                />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input
                  value={otForm.endTime}
                  onChange={(e) => setOtForm({ ...otForm, endTime: e.target.value })}
                  className="h-8 text-xs mt-1"
                  placeholder="11:00 AM"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Lead Surgeon</Label>
              <Select value={otForm.leadSurgeonId} onValueChange={(v) => setOtForm({ ...otForm, leadSurgeonId: v })}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Choose surgeon..." /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      Dr. {d.name} ({d.specialization || 'Surgeon'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Equipment / Anesthesia Notes</Label>
              <Textarea
                value={otForm.notes}
                onChange={(e) => setOtForm({ ...otForm, notes: e.target.value })}
                className="text-xs h-16 mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOtDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleScheduleOt} className="bg-indigo-700 text-white">Book OT Slot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discharge Summary Dialog */}
      <Dialog open={dischargeDialogOpen} onOpenChange={setDischargeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-indigo-600" />
              Generate Standardized Discharge Summary
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Patient</Label>
                <Select value={summaryForm.patientId} onValueChange={(v) => setSummaryForm({ ...summaryForm, patientId: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select patient..." /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} ({p.patientId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Attending Physician</Label>
                <Select value={summaryForm.doctorId} onValueChange={(v) => setSummaryForm({ ...summaryForm, doctorId: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select doctor..." /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">Dr. {d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Final Diagnosis</Label>
              <Input
                value={summaryForm.finalDiagnosis}
                onChange={(e) => setSummaryForm({ ...summaryForm, finalDiagnosis: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Treatment & Clinical Course in Hospital</Label>
              <Textarea
                value={summaryForm.treatmentGiven}
                onChange={(e) => setSummaryForm({ ...summaryForm, treatmentGiven: e.target.value })}
                className="text-xs h-16 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Discharge Medications & Advice</Label>
              <Textarea
                value={summaryForm.medicationsOnDischarge}
                onChange={(e) => setSummaryForm({ ...summaryForm, medicationsOnDischarge: e.target.value })}
                className="text-xs h-16 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-red-700">Emergency Red-Flag Signs (When to return immediately)</Label>
              <Textarea
                value={summaryForm.emergencyRedFlags}
                onChange={(e) => setSummaryForm({ ...summaryForm, emergencyRedFlags: e.target.value })}
                className="text-xs h-14 mt-1 border-red-200"
              />
            </div>

            <div>
              <Label className="text-xs">Follow-Up Schedule</Label>
              <Input
                value={summaryForm.followUpAdvice}
                onChange={(e) => setSummaryForm({ ...summaryForm, followUpAdvice: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDischargeDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateDischargeSummary} className="bg-indigo-700 text-white">Create Discharge Summary</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

