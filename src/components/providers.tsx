'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/toaster'
import { useState, useEffect } from 'react'

// Handle chunk load errors (common with Turbopack HMR in dev)
function useChunkErrorHandler() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      const msg = event.message || ''
      if (msg.includes('ChunkLoadError') || msg.includes('Loading chunk') || msg.includes('loading CSS chunk')) {
        console.warn('Chunk load error detected, reloading page...')
        window.location.reload()
      }
    }
    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])
}

export function Providers({ children }: { children: React.ReactNode }) {
  useChunkErrorHandler()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          {children}
        </SidebarProvider>
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  )
}
