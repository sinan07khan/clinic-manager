'use client'

import { useSession as useNextAuthSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useNextAuthSession()
  return {
    session,
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    role: session?.user?.role,
    userId: session?.user?.id,
  }
}
