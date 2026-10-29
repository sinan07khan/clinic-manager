'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  // Auto-reload for chunk load errors
  const msg = error.message || ''
  if (msg.includes('ChunkLoadError') || msg.includes('Loading chunk')) {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-600">
          {msg.includes('ChunkLoadError')
            ? 'The app was updated. Please wait while we reload...'
            : 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
