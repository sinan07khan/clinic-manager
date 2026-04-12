'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useNavigationStore } from '@/store/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  FlaskConical,
  Package,
  UserCog,
  BarChart3,
  LogOut,
  ChevronDown,
  KeyRound,
} from 'lucide-react'
import type { NavModule } from '@/store/navigation'
import { rolePermissions, roleLabels } from '@/lib/auth/permissions'
import { Toaster } from 'sonner'
import { signOut } from 'next-auth/react'
import LoginPage from '@/components/auth/login-page'
import ChangePasswordDialog from '@/components/auth/change-password-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const Dashboard = dynamic(() => import('@/components/app/dashboard'), { ssr: false })
const PatientsModule = dynamic(() => import('@/components/app/patients-module'), { ssr: false })
const AppointmentsModule = dynamic(() => import('@/components/app/appointments-module'), { ssr: false })
const BillingModule = dynamic(() => import('@/components/app/billing-module'), { ssr: false })
const DiagnosticsModule = dynamic(() => import('@/components/app/diagnostics-module'), { ssr: false })
const InventoryModule = dynamic(() => import('@/components/app/inventory-module'), { ssr: false })
const HrModule = dynamic(() => import('@/components/app/hr-module'), { ssr: false })
const AnalyticsModule = dynamic(() => import('@/components/app/analytics'), { ssr: false })

const allNavItems: { id: NavModule; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'billing', label: 'Billing & Finance', icon: Receipt },
  { id: 'diagnostics', label: 'Diagnostics & Lab', icon: FlaskConical },
  { id: 'inventory', label: 'Inventory & Stock', icon: Package },
  { id: 'hr', label: 'HR & Payroll', icon: UserCog },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
]

function AppShell() {
  const { data: session } = useSession()
  const { activeModule, setActiveModule } = useNavigationStore()

  const userRole = session?.user?.role
  const userName = session?.user?.name || 'User'
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const allowedModules = userRole ? (rolePermissions[userRole] || ['dashboard']) : ['dashboard']
  const visibleNavItems = allNavItems.filter((item) => allowedModules.includes(item.id))

  // If active module is no longer allowed, redirect to dashboard
  if (!allowedModules.includes(activeModule)) {
    setActiveModule('dashboard')
  }

  const [showChangePassword, setShowChangePassword] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <>
      <div className="flex h-screen w-full overflow-hidden">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <Image
                    src="/logo-oxygen.png"
                    alt="Oxygen Health Care"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    <span className="text-[#212121]">Oxygen</span>{' '}
                    <span className="text-[#D32F2F]">Health Care</span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">Clinic Management</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <Separator className="mx-2 w-auto" />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleNavItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeModule === item.id}
                      onClick={() => setActiveModule(item.id)}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent cursor-pointer">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-green-100 text-green-800 text-xs font-bold">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userRole ? roleLabels[userRole] : 'Staff'}
                      </span>
                    </div>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuItem className="flex items-center gap-3 p-2">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-green-100 text-green-800 text-xs font-bold">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowChangePassword(true)}
                    className="text-green-700 focus:text-green-700 focus:bg-green-50 cursor-pointer"
                  >
                    <KeyRound className="size-4 mr-2" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="size-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 gap-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 md:hidden" />
            <h1 className="text-lg font-semibold truncate">
              {allNavItems.find((n) => n.id === activeModule)?.label ?? 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-green-700 hover:bg-green-50 h-7"
              onClick={() => setShowChangePassword(true)}
            >
              <KeyRound className="size-3.5" />
              <span className="hidden md:inline">Change Password</span>
            </Button>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              {userRole ? roleLabels[userRole] : 'Staff'}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {activeModule === 'dashboard' && <Dashboard />}
          {activeModule === 'patients' && <PatientsModule />}
          {activeModule === 'appointments' && <AppointmentsModule />}
          {activeModule === 'billing' && <BillingModule />}
          {activeModule === 'diagnostics' && <DiagnosticsModule />}
          {activeModule === 'inventory' && <InventoryModule />}
          {activeModule === 'hr' && <HrModule />}
          {activeModule === 'analytics' && <AnalyticsModule />}
        </main>
      </SidebarInset>
      </div>
      <Toaster position="top-right" richColors />
      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </>
  )
}

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-green-200/50 border border-green-100 overflow-hidden">
            <Image
              src="/logo-oxygen.png"
              alt="Oxygen Health Care"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="size-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return <AppShell />
}
