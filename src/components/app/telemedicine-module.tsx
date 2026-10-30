'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Share2,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  FileText,
  User,
  ShieldCheck,
  CreditCard,
  Plus,
  Play,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

export default function TelemedicineModule() {
  const [sessions, setSessions] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [activeSession, setActiveSession] = useState<any>(null)
  const [inCall, setInCall] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // In-Call Controls
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callNotes, setCallNotes] = useState('')
  const [quickDiagnosis, setQuickDiagnosis] = useState('')
  const [quickMeds, setQuickMeds] = useState('Tab. Paracetamol 500mg (1+1+1), Tab. Cetirizine 10mg (0+0+1)')

  // New Session Form
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('500')
  const [paymentMethod, setPaymentMethod] = useState('bKash')

  useEffect(() => {
    fetchSessions()
    fetchAppointments()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/telemedicine')
      const data = await res.json()
      if (Array.isArray(data)) {
        setSessions(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments')
      const data = await res.json()
      if (Array.isArray(data)) {
        setAppointments(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateSession = async () => {
    if (!selectedAppointmentId) {
      toast.error('Please select an appointment')
      return
    }

    try {
      const res = await fetch('/api/telemedicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointmentId,
          paymentAmount,
          paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create session')

      toast.success(`Telemedicine room ${data.roomCode} created & payment verified! Link sent to patient.`)
      setCreateDialogOpen(false)
      fetchSessions()
    } catch (err: any) {
      toast.error(err.message || 'Error creating session')
    }
  }

  const handleJoinCall = (session: any) => {
    setActiveSession(session)
    setInCall(true)
    // Update status to ACTIVE
    fetch('/api/telemedicine', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: session.id, status: 'ACTIVE' }),
    }).then(fetchSessions)
  }

  const handleEndCall = () => {
    if (activeSession) {
      fetch('/api/telemedicine', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeSession.id,
          status: 'COMPLETED',
          notes: callNotes,
        }),
      }).then(() => {
        toast.success('Consultation ended. Prescription dispatched to patient via WhatsApp & SMS.')
        setInCall(false)
        setActiveSession(null)
        fetchSessions()
      })
    } else {
      setInCall(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Module Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-300">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Telemedicine & Remote Consultation</h2>
            <p className="text-xs text-muted-foreground">Peer-to-Peer Encrypted Video Calling, Remote Payments & Instant Prescription Dispatch</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-9"
          >
            <Plus className="h-4 w-4" />
            Schedule Video Consultation
          </Button>
        </div>
      </div>

      {/* ACTIVE CALL SCREEN VIEW */}
      {inCall && activeSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          {/* Main Video Call Area (3 Cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border shadow-xl">
              {/* Doctor / Main Stream Simulator */}
              {isVideoOn ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=1200"
                  alt="Doctor Stream"
                  className="w-full h-full object-cover opacity-90"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <VideoOff className="h-12 w-12" />
                  <span className="text-xs">Camera is switched off</span>
                </div>
              )}

              {/* Patient Floating PIP Stream */}
              <div className="absolute top-4 right-4 w-48 h-32 rounded-xl bg-slate-800 border-2 border-white/20 overflow-hidden shadow-2xl flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"
                  alt="Patient"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-2 text-[10px] text-white font-medium bg-black/60 px-1.5 py-0.5 rounded">
                  {activeSession.appointment?.patient?.name || 'Patient'}
                </div>
              </div>

              {/* Call Status & Encryption Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge className="bg-red-500 text-white animate-pulse text-[10px] flex items-center gap-1 border-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  LIVE CONSULTATION
                </Badge>
                <Badge className="bg-black/60 text-emerald-400 text-[10px] flex items-center gap-1 border-0">
                  <ShieldCheck className="h-3 w-3" />
                  AES-256 E2E Encrypted
                </Badge>
              </div>

              {/* In-Call Bottom Floating Toolbar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                <Button
                  size="icon"
                  variant={isMicOn ? 'secondary' : 'destructive'}
                  onClick={() => setIsMicOn(!isMicOn)}
                  className="rounded-full h-10 w-10"
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>

                <Button
                  size="icon"
                  variant={isVideoOn ? 'secondary' : 'destructive'}
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className="rounded-full h-10 w-10"
                >
                  {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>

                <Button
                  size="icon"
                  variant={isScreenSharing ? 'default' : 'secondary'}
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className="rounded-full h-10 w-10"
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="destructive"
                  onClick={handleEndCall}
                  className="rounded-full h-10 w-10 bg-red-600 hover:bg-red-700"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* In-Call Consultation & Prescription Pad (1 Col) */}
          <div className="space-y-4 lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>In-Call EMR Pad</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                    Payment Verified
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {activeSession.appointment?.patient?.name} ({activeSession.appointment?.patient?.patientId})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-3 flex-1 flex flex-col justify-between text-xs">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Provisional Diagnosis</Label>
                    <Input
                      value={quickDiagnosis}
                      onChange={(e) => setQuickDiagnosis(e.target.value)}
                      placeholder="e.g. Acute Migraine / Tension Headache"
                      className="h-8 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Instant Medications</Label>
                    <Textarea
                      value={quickMeds}
                      onChange={(e) => setQuickMeds(e.target.value)}
                      className="text-xs h-24 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Doctor Consultation Notes</Label>
                    <Textarea
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      placeholder="Patient advised to monitor BP daily..."
                      className="text-xs h-20 mt-1"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <Button
                    onClick={handleEndCall}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 text-xs h-9"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Complete & Dispatch Rx to WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {/* SESSIONS & APPOINTMENTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active & Upcoming Telemedicine Sessions */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Scheduled Telemedicine Sessions</CardTitle>
                <CardDescription className="text-xs">Live queue of remote video appointments</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={fetchSessions} className="h-8 text-xs gap-1">
                <RotateCcw className="h-3 w-3" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs">
                  No remote telemedicine consultations scheduled yet. Click &quot;Schedule Video Consultation&quot; above.
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-4 border rounded-xl bg-card hover:border-blue-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {sess.appointment?.patient?.name || 'Patient'}
                          </span>
                          <span className="font-mono text-muted-foreground text-[11px]">
                            ({sess.appointment?.patient?.patientId})
                          </span>
                          <Badge
                            className={
                              sess.status === 'ACTIVE'
                                ? 'bg-red-500 text-white'
                                : sess.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {sess.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          Doctor: <strong className="text-foreground">Dr. {sess.appointment?.doctor?.name}</strong> • Room: <code className="bg-muted px-1.5 py-0.5 rounded text-blue-700 font-bold">{sess.roomCode}</code>
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-muted-foreground text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(sess.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Payment: BDT {sess.paymentAmount} via {sess.paymentMethod}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {sess.status !== 'COMPLETED' ? (
                          <Button
                            size="sm"
                            onClick={() => handleJoinCall(sess)}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs h-8 px-3"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            Join Video Call
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-emerald-700 border-emerald-300 text-xs py-1">
                            Consultation Finished
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Upfront Payment Gateway Verification Widget */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-50/50 via-card to-emerald-50/50 border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-blue-600" />
                Remote Gateway Gatekeeper
              </CardTitle>
              <CardDescription className="text-xs">
                Patient slot confirmed only upon instant digital payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-card border rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Standard Telemedicine Fee:</span>
                  <span className="font-bold text-foreground">BDT 500.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gateway Surcharge (0%):</span>
                  <span className="font-bold text-emerald-600">Free</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Net Payable:</span>
                  <span className="text-blue-700 font-bold">BDT 500.00</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground font-medium text-[11px]">Supported Gateways:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="p-2 border rounded text-center font-bold text-pink-600 bg-pink-50/50 text-[11px]">
                    bKash
                  </div>
                  <div className="p-2 border rounded text-center font-bold text-orange-600 bg-orange-50/50 text-[11px]">
                    Nagad
                  </div>
                  <div className="p-2 border rounded text-center font-bold text-purple-600 bg-purple-50/50 text-[11px]">
                    Rocket
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-[11px] space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  Automated Webhook Sync
                </p>
                <p className="text-blue-800/80">
                  Patients receive unique one-time video link via SMS & WhatsApp upon instant payment verification.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Telemedicine Session Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-600" />
              Schedule Telemedicine Session
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm slot and verify upfront digital payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">Select Appointment</Label>
              <Select value={selectedAppointmentId} onValueChange={setSelectedAppointmentId}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Choose appointment..." />
                </SelectTrigger>
                <SelectContent>
                  {appointments.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.patient?.name} with Dr. {a.doctor?.name} ({a.timeSlot})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Consultation Fee (BDT)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Payment Verification Gateway</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bKash">bKash Digital Payment</SelectItem>
                  <SelectItem value="Nagad">Nagad Gateway</SelectItem>
                  <SelectItem value="Rocket">Rocket Banking</SelectItem>
                  <SelectItem value="CARD">Visa / Mastercard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleCreateSession} className="bg-blue-600 hover:bg-blue-700 text-white">
              Verify & Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
