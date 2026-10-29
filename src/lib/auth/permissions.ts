export type NavModule =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'billing'
  | 'diagnostics'
  | 'inventory'
  | 'hr'
  | 'analytics'

export interface NavItem {
  id: NavModule
  label: string
  icon: string
  roles: string[]
}

export const rolePermissions: Record<string, NavModule[]> = {
  SUPER_ADMIN: ['dashboard', 'patients', 'appointments', 'billing', 'diagnostics', 'inventory', 'hr', 'analytics'],
  ADMIN: ['dashboard', 'patients', 'appointments', 'billing', 'diagnostics', 'inventory', 'hr', 'analytics'],
  DOCTOR: ['dashboard', 'patients', 'appointments', 'diagnostics'],
  RECEPTIONIST: ['dashboard', 'patients', 'appointments'],
  ACCOUNTANT: ['dashboard', 'billing', 'analytics'],
  LAB_TECHNICIAN: ['dashboard', 'diagnostics'],
  NURSE: ['dashboard', 'patients', 'appointments'],
  HR_MANAGER: ['dashboard', 'hr', 'analytics'],
  INVENTORY_MANAGER: ['dashboard', 'inventory', 'analytics'],
  STAFF: ['dashboard'],
}

export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist',
  ACCOUNTANT: 'Accountant',
  LAB_TECHNICIAN: 'Lab Technician',
  NURSE: 'Nurse',
  HR_MANAGER: 'HR Manager',
  INVENTORY_MANAGER: 'Inventory Manager',
  STAFF: 'Staff',
}
