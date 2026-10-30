import { db } from '@/lib/db'

export interface AuditParams {
  userId?: string | null
  userName?: string | null
  userRole?: string | null
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'EXPORT' | 'CALL_TOKEN' | 'DISPATCH' | 'ADMIT' | 'DISCHARGE'
  module: 'PATIENTS' | 'EMR' | 'BILLING' | 'PHARMACY' | 'TELEMEDICINE' | 'BEDS' | 'DIAGNOSTICS' | 'HR' | 'INVENTORY' | 'AUDIT'
  recordId?: string | null
  details?: string
  ipAddress?: string
}

export async function logAudit(params: AuditParams) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId || undefined,
        userName: params.userName || 'System User',
        userRole: params.userRole || 'STAFF',
        action: params.action,
        module: params.module,
        recordId: params.recordId || undefined,
        details: params.details || '',
        ipAddress: params.ipAddress || '127.0.0.1',
      },
    })
  } catch (err) {
    console.error('Failed to write audit log:', err)
  }
}

