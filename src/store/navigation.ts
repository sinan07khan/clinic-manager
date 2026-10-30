import { create } from 'zustand'

export type NavModule =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'emr'
  | 'telemedicine'
  | 'billing'
  | 'diagnostics'
  | 'pharmacy'
  | 'daycare_beds'
  | 'inventory'
  | 'hr'
  | 'analytics'

interface NavigationStore {
  activeModule: NavModule
  setActiveModule: (module: NavModule) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  selectedBranch: string
  setSelectedBranch: (branch: string) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeModule: 'dashboard',
  setActiveModule: (module) => set({ activeModule: module }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedBranch: 'Main Clinic - Central',
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),
}))
