'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, EyeOff, Loader2, Lock, UserPlus, LogIn } from 'lucide-react'

type Tab = 'signin' | 'signup'

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin / Clinic Owner' },
  { value: 'CLINIC_MANAGER', label: 'Clinic Manager' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'RECEPTIONIST', label: 'Receptionist / Front Desk' },
  { value: 'LAB_TECHNICIAN', label: 'Lab Technician' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
  { value: 'NURSE', label: 'Nurse / Ward Staff' },
]

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('signin')

  // ── Sign In state ──────────────────────────────────────────────────────────
  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')
  const [siShowPw, setSiShowPw] = useState(false)
  const [siError, setSiError] = useState('')
  const [siLoading, setSiLoading] = useState(false)

  // ── Sign Up state ──────────────────────────────────────────────────────────
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPhone, setSuPhone] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suConfirm, setSuConfirm] = useState('')
  const [suShowPw, setSuShowPw] = useState(false)
  const [suRole, setSuRole] = useState('RECEPTIONIST')
  const [suError, setSuError] = useState('')
  const [suSuccess, setSuSuccess] = useState('')
  const [suLoading, setSuLoading] = useState(false)

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSiError('')
    setSiLoading(true)
    try {
      const result = await signIn('credentials', {
        email: siEmail,
        password: siPassword,
        redirect: false,
      })
      if (result?.error) {
        setSiError('Invalid email or password. Please try again.')
      } else {
        window.location.reload()
      }
    } catch {
      setSiError('An error occurred. Please try again.')
    } finally {
      setSiLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuError('')
    setSuSuccess('')

    if (suPassword !== suConfirm) {
      setSuError('Passwords do not match.')
      return
    }
    if (suPassword.length < 6) {
      setSuError('Password must be at least 6 characters.')
      return
    }

    setSuLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suName,
          email: suEmail,
          phone: suPhone,
          password: suPassword,
          role: suRole,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setSuError(json.error || 'Failed to create account.')
        return
      }

      // Auto sign-in after successful registration
      setSuSuccess('Account created! Signing you in…')
      const result = await signIn('credentials', {
        email: suEmail,
        password: suPassword,
        redirect: false,
      })
      if (result?.error) {
        setSuSuccess('')
        setSuError('Account created but sign-in failed. Please sign in manually.')
        setTab('signin')
        setSiEmail(suEmail)
      } else {
        window.location.reload()
      }
    } catch {
      setSuError('An error occurred. Please try again.')
    } finally {
      setSuLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 p-3 sm:p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-100/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-100/20 rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-md relative z-10 mx-auto">
        {/* Logo and Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-lg shadow-emerald-200/50 border border-emerald-100 mb-3 sm:mb-4 overflow-hidden">
            <Image
              src="/logo.svg"
              alt="Clinic Manager"
              width={72}
              height={72}
              className="object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">
            <span className="text-[#1e293b]">Clinic</span>{' '}
            <span className="text-emerald-600">Manager</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Healthcare &amp; Diagnostic Management System
          </p>
        </div>

        <Card className="shadow-xl shadow-green-100/30 border-green-100/50 bg-white/80 backdrop-blur-sm">
          {/* Tab Switcher */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('signin')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors rounded-tl-xl ${
                tab === 'signin'
                  ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/60'
                  : 'text-muted-foreground hover:text-gray-700'
              }`}
            >
              <LogIn className="size-4" /> Sign In
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors rounded-tr-xl ${
                tab === 'signup'
                  ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/60'
                  : 'text-muted-foreground hover:text-gray-700'
              }`}
            >
              <UserPlus className="size-4" /> Sign Up
            </button>
          </div>

          {/* ── Sign In Form ── */}
          {tab === 'signin' && (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg sm:text-xl font-semibold">Welcome Back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-4 sm:px-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {siError && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                      <AlertDescription className="text-sm">{siError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="si-email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="si-email"
                      type="email"
                      placeholder="Enter your email"
                      value={siEmail}
                      onChange={(e) => setSiEmail(e.target.value)}
                      required
                      className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                      autoComplete="email"
                      disabled={siLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="si-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="si-password"
                        type={siShowPw ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={siPassword}
                        onChange={(e) => setSiPassword(e.target.value)}
                        required
                        className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20 pr-10"
                        autoComplete="current-password"
                        disabled={siLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setSiShowPw(!siShowPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        tabIndex={-1}
                        aria-label={siShowPw ? 'Hide password' : 'Show password'}
                      >
                        {siShowPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-medium transition-colors"
                    disabled={siLoading}
                  >
                    {siLoading ? (
                      <><Loader2 className="size-4 animate-spin mr-2" />Signing in…</>
                    ) : (
                      <><Lock className="size-4 mr-2" />Sign In</>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground pt-1">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('signup')}
                      className="text-emerald-700 hover:text-emerald-900 font-medium underline underline-offset-2"
                    >
                      Sign Up
                    </button>
                  </p>
                </form>
              </CardContent>
            </>
          )}

          {/* ── Sign Up Form ── */}
          {tab === 'signup' && (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg sm:text-xl font-semibold">Create Account</CardTitle>
                <CardDescription>Register a new staff account</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-4 sm:px-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {suError && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                      <AlertDescription className="text-sm">{suError}</AlertDescription>
                    </Alert>
                  )}
                  {suSuccess && (
                    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                      <AlertDescription className="text-sm">{suSuccess}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="su-name" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="su-name"
                      type="text"
                      placeholder="Enter full name"
                      value={suName}
                      onChange={(e) => setSuName(e.target.value)}
                      required
                      className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                      disabled={suLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="su-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="su-email"
                        type="email"
                        placeholder="staff@clinic.com"
                        value={suEmail}
                        onChange={(e) => setSuEmail(e.target.value)}
                        required
                        className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                        autoComplete="email"
                        disabled={suLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-phone" className="text-sm font-medium">Phone</Label>
                      <Input
                        id="su-phone"
                        type="tel"
                        placeholder="+880 1xxx xxxxxx"
                        value={suPhone}
                        onChange={(e) => setSuPhone(e.target.value)}
                        required
                        className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                        disabled={suLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="su-role" className="text-sm font-medium">Role</Label>
                    <Select value={suRole} onValueChange={setSuRole} disabled={suLoading}>
                      <SelectTrigger id="su-role" className="h-11 bg-white border-gray-200 focus:border-green-500">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="su-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="su-password"
                        type={suShowPw ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={suPassword}
                        onChange={(e) => setSuPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20 pr-10"
                        autoComplete="new-password"
                        disabled={suLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setSuShowPw(!suShowPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        tabIndex={-1}
                        aria-label={suShowPw ? 'Hide password' : 'Show password'}
                      >
                        {suShowPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="su-confirm" className="text-sm font-medium">Confirm Password</Label>
                    <Input
                      id="su-confirm"
                      type="password"
                      placeholder="Re-enter password"
                      value={suConfirm}
                      onChange={(e) => setSuConfirm(e.target.value)}
                      required
                      className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                      autoComplete="new-password"
                      disabled={suLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-medium transition-colors"
                    disabled={suLoading}
                  >
                    {suLoading ? (
                      <><Loader2 className="size-4 animate-spin mr-2" />Creating account…</>
                    ) : (
                      <><UserPlus className="size-4 mr-2" />Create Account</>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground pt-1">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('signin')}
                      className="text-emerald-700 hover:text-emerald-900 font-medium underline underline-offset-2"
                    >
                      Sign In
                    </button>
                  </p>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Clinic Manager &copy; {new Date().getFullYear()} &mdash; All rights reserved
        </p>
      </div>
    </div>
  )
}
