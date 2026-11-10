'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Edit2, Trash2, Star, MapPin, Phone, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface BranchItem {
  id: string
  name: string
  code: string
  address: string | null
  phone: string | null
  isMain: boolean
  isActive: boolean
}

interface BranchManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branches: BranchItem[]
  onBranchesUpdated: () => void
  onSelectBranch?: (name: string, id: string) => void
}

export default function BranchManagementDialog({
  open,
  onOpenChange,
  branches,
  onBranchesUpdated,
  onSelectBranch,
}: BranchManagementDialogProps) {
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    isMain: false,
  })

  const resetForm = () => {
    setForm({ name: '', code: '', address: '', phone: '', isMain: false })
    setEditingBranch(null)
    setShowForm(false)
  }

  const handleStartAdd = () => {
    setEditingBranch(null)
    setForm({
      name: '',
      code: '',
      address: '',
      phone: '',
      isMain: branches.length === 0,
    })
    setShowForm(true)
  }

  const handleStartEdit = (b: BranchItem) => {
    setEditingBranch(b)
    setForm({
      name: b.name,
      code: b.code,
      address: b.address || '',
      phone: b.phone || '',
      isMain: b.isMain,
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Branch name and code are required')
      return
    }

    setSaving(true)
    try {
      const url = '/api/branches'
      const method = editingBranch ? 'PUT' : 'POST'
      const payload = editingBranch
        ? { id: editingBranch.id, ...form }
        : form

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save branch')
      }

      toast.success(editingBranch ? 'Branch updated successfully' : 'Branch created successfully')
      resetForm()
      onBranchesUpdated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (b: BranchItem) => {
    if (b.isMain) {
      toast.error('Cannot delete the main branch. Please set another branch as main first.')
      return
    }

    if (!confirm(`Are you sure you want to delete branch "${b.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/branches?id=${b.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete branch')
      }
      toast.success('Branch deleted')
      onBranchesUpdated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete branch'
      toast.error(msg)
    }
  }

  const handleSetMain = async (b: BranchItem) => {
    if (b.isMain) return
    try {
      const res = await fetch('/api/branches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id, isMain: true }),
      })
      if (res.ok) {
        toast.success(`"${b.name}" set as main branch`)
        onBranchesUpdated()
      }
    } catch {
      toast.error('Failed to set main branch')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
      <DialogContent className="max-w-lg w-full max-h-[85vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Building2 className="size-5 text-emerald-600" />
            Clinic Branch Management
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Configure your clinic branches, edit details, and set your primary facility.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {showForm ? (
            <form onSubmit={handleSave} className="space-y-3.5 bg-muted/40 p-3 sm:p-4 rounded-xl border">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-semibold text-sm">
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="branch-name" className="text-xs">Branch Name *</Label>
                  <Input
                    id="branch-name"
                    placeholder="e.g. City Care Center"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="branch-code" className="text-xs">Branch Code *</Label>
                  <Input
                    id="branch-code"
                    placeholder="e.g. CCC-01"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="branch-addr" className="text-xs">Address</Label>
                <Input
                  id="branch-addr"
                  placeholder="Street / Area / City"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="branch-phone" className="text-xs">Phone Number</Label>
                <Input
                  id="branch-phone"
                  placeholder="Contact phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is-main-switch"
                    checked={form.isMain}
                    onCheckedChange={(val) => setForm({ ...form, isMain: val })}
                  />
                  <Label htmlFor="is-main-switch" className="text-xs cursor-pointer">
                    Set as Main Branch
                  </Label>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-medium"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : editingBranch ? (
                    'Update Branch'
                  ) : (
                    'Save Branch'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1.5"
                onClick={handleStartAdd}
              >
                <Plus className="size-3.5" /> Add New Branch
              </Button>
            </div>
          )}

          {/* List of branches */}
          <div className="space-y-2.5">
            {branches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-xl border-dashed">
                <Building2 className="size-8 mx-auto mb-2 opacity-30 text-emerald-600" />
                <p className="text-sm font-medium">No branches configured yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Click &quot;Add New Branch&quot; to set up your primary clinic.</p>
              </div>
            ) : (
              branches.map((b) => (
                <Card
                  key={b.id}
                  className={`border transition-all ${
                    b.isMain
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'hover:border-emerald-200'
                  }`}
                >
                  <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{b.name}</span>
                        <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                          {b.code}
                        </code>
                        {b.isMain && (
                          <Badge className="bg-emerald-600 text-white text-[10px] h-4 gap-1">
                            <Star className="size-2.5 fill-white" /> Main
                          </Badge>
                        )}
                        {!b.isActive && (
                          <Badge variant="outline" className="text-amber-700 border-amber-300 text-[10px] h-4">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {b.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[220px]">{b.address}</span>
                          </span>
                        )}
                        {b.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3 text-muted-foreground shrink-0" />
                            <span>{b.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onSelectBranch && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-emerald-800 hover:bg-emerald-100/60"
                          onClick={() => {
                            onSelectBranch(b.name, b.id)
                            onOpenChange(false)
                          }}
                        >
                          Select
                        </Button>
                      )}
                      {!b.isMain && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-amber-700 hover:bg-amber-50"
                          onClick={() => handleSetMain(b)}
                          title="Set as Main Branch"
                        >
                          <Star className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs hover:bg-muted"
                        onClick={() => handleStartEdit(b)}
                        title="Edit Branch"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      {!b.isMain && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(b)}
                          title="Delete Branch"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

