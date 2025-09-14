'use client'

import { useEffect, useState } from 'react'

interface ClientSideEditorProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Client-side wrapper for Monaco Editor components
 * Prevents SSR issues by only rendering Monaco on the client
 */
export function ClientSideEditor({ children, fallback }: ClientSideEditorProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      fallback || (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50 border border-gray-200 rounded">
          <div className="text-gray-500">Loading editor...</div>
        </div>
      )
    )
  }

  return <>{children}</>
} 