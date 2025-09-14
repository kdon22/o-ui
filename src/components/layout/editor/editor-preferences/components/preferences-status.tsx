'use client'

import { Badge } from '@/components/ui/badge'

interface PreferencesStatusProps {
  isLoading: boolean
  isPending: boolean
  isError: boolean
  errorMessage?: string
}

export function PreferencesStatus({ isLoading, isPending, isError, errorMessage }: PreferencesStatusProps) {
  return (
    <div className="space-y-2">
      {/* Save Status */}
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className={`w-2 h-2 rounded-full ${
          isLoading ? 'bg-yellow-500 animate-pulse' :
          isPending ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
        }`}></div>
        <span className="text-sm text-green-700">
          {isLoading ? 'Loading preferences...' :
           isPending ? 'Saving...' : 'Saved automatically'}
        </span>
      </div>

      {/* Show error message if mutation failed */}
      {isError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-sm text-red-700">
            Error: {errorMessage || 'Failed to save preferences'}
          </span>
        </div>
      )}
    </div>
  )
}