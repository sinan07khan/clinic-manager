import type { NavModule } from '@/store/navigation'

export interface NavItem {
  id: NavModule
  label: string
  icon: string
  roles: string[]
}

export const rolePermissions: Record<string, NavModule[]> = {
  SUPER_ADMIN: [
    'dashboard',
    'patients',
    'appointments',
    'emr',
    'telemedicine',
    'billing',
    'diagnostics',
    'pharmacy',
    'daycare_beds',
    'inventory',
    'hr',
    'analytics',
  ],
  ADMIN: [
    'dashboard',
    'patients',
    'appointments',
    'emr',
    'telemedicine',
    'billing',
    'diagnostics',
    'pharmacy',
    'daycare_beds',
    'inventory',
    'hr',
    'analytics',
  ],
  CLINIC_MANAGER: [
    'dashboard',
    'patients',
    'appointments',
    'emr',
    'telemedicine',
    'billing',
    'diagnostics',
    'pharmacy',
    'daycare_beds',
    'inventory',
    'hr',
    'analytics',
  ],
  DOCTOR: [
    'dashboard',
    'patients',
    'appointments',
    'emr',
    'telemedicine',
    'diagnostics',
    'daycare_beds',
  ],
  RECEPTIONIST: [
    'dashboard',
    'patients',
    'appointments',
    'billing',
    'daycare_beds',
  ],
  PHARMACIST: [
    'dashboard',
    'pharmacy',
    'billing',
    'inventory',
  ],
  NURSE: [
    'dashboard',
    'patients',
    'appointments',
    'emr',
    'daycare_beds',
  ],
  LAB_TECHNICIAN: [
    'dashboard',
    'diagnostics',
  ],
  ACCOUNTANT: [
    'dashboard',
    'billing',
    'analytics',
  ],
  HR_MANAGER: [
    'dashboard',
    'hr',
    'analytics',
  ],
  INVENTORY_MANAGER: [
    'dashboard',
    'inventory',
    'pharmacy',
    'analytics',
  ],
  STAFF: [
    'dashboard',
  ],
  PATIENT: [
    'dashboard',
    'appointments',
    'telemedicine',
    'emr',
  ],
}

export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Clinic Admin',
  CLINIC_MANAGER: 'Clinic Manager',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist / Front Desk',
  PHARMACIST: 'Pharmacist',
  NURSE: 'Nurse / Ward Staff',
  LAB_TECHNICIAN: 'Lab Technician',
  ACCOUNTANT: 'Accountant',
  HR_MANAGER: 'HR Manager',
  INVENTORY_MANAGER: 'Inventory Manager',
  STAFF: 'General Staff',
  PATIENT: 'Patient Portal',
}
