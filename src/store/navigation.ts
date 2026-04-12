import { create } from 'zustand'

export type NavModule =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'billing'
  | 'diagnostics'
  | 'inventory'
  | 'hr'
  | 'analytics'

interface NavigationStore {
  activeModule: NavModule
  setActiveModule: (module: NavModule) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeModule: 'dashboard',
  setActiveModule: (module) => set({ activeModule: module }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
