'use client'

import { useState } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
  bgColor: string
  checks: { label: string; passed: boolean }[]
} {
  const checks = [
    { label: 'At least 6 characters', passed: password.length >= 6 },
    { label: 'Contains uppercase letter', passed: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', passed: /[a-z]/.test(password) },
    { label: 'Contains a number', passed: /\d/.test(password) },
    { label: 'Contains special character', passed: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    { label: 'At least 8 characters', passed: password.length >= 8 },
  ]

  const score = checks.filter((c) => c.passed).length

  if (score <= 2) {
    return { score, label: 'Weak', color: 'text-red-600', bgColor: 'bg-red-500', checks }
  } else if (score <= 4) {
    return { score, label: 'Medium', color: 'text-amber-600', bgColor: 'bg-amber-500', checks }
  } else {
    return { score, label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500', checks }
  }
}

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')

  const strength = getPasswordStrength(newPassword)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
  const hasMinLength = newPassword.length >= 6

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrent(false)
    setShowNew(false)
    setShowConfirm(false)
    setStep('form')
    setSubmitting(false)
  }

  const handleClose = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (!hasMinLength) {
      toast.error('New password must be at least 6 characters long')
      return
    }

    if (!passwordsMatch) {
      toast.error('New password and confirmation do not match')
      return
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setStep('success')
        toast.success('Password changed successfully')
      } else {
        toast.error(data.error || 'Failed to change password')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-green-100">
                  <KeyRound className="size-5 text-green-700" />
                </div>
                <div>
                  <DialogTitle className="text-green-950">Change Password</DialogTitle>
                  <DialogDescription>
                    Update your account security credentials
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-sm font-medium">
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="current-password"
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-9 pr-10"
                    disabled={submitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-10"
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.bgColor}`}
                          style={{ width: `${(strength.score / 6) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${strength.color}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {strength.checks.map((check) => (
                        <div key={check.label} className="flex items-center gap-1.5">
                          <CheckCircle2
                            className={`size-3 flex-shrink-0 ${
                              check.passed ? 'text-green-500' : 'text-muted-foreground/30'
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              check.passed ? 'text-green-700' : 'text-muted-foreground'
                            }`}
                          >
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-9 pr-10 ${
                      confirmPassword.length > 0 && !passwordsMatch
                        ? 'border-red-300 focus-visible:ring-red-200'
                        : confirmPassword.length > 0 && passwordsMatch
                        ? 'border-green-300 focus-visible:ring-green-200'
                        : ''
                    }`}
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <div className="flex items-center gap-1.5 text-red-500">
                    <AlertCircle className="size-3.5" />
                    <span className="text-xs">Passwords do not match</span>
                  </div>
                )}
                {confirmPassword.length > 0 && passwordsMatch && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="size-3.5" />
                    <span className="text-xs">Passwords match</span>
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800 space-y-0.5">
                    <p className="font-medium">Security Reminder</p>
                    <p>
                      After changing your password, you will need to use the new password
                      the next time you sign in.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !currentPassword || !newPassword || !confirmPassword || !passwordsMatch || !hasMinLength}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="size-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-green-950">Password Updated</DialogTitle>
              <DialogDescription>
                Your password has been changed successfully
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-green-900">
                  Your password has been changed!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your account is now secured with the new password.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => handleClose(false)}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
