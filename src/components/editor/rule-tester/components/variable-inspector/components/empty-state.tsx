'use client'

import React from 'react'
import { Eye } from 'lucide-react'

interface EmptyStateProps {
  variableCount: number
  searchTerm: string
}

export function EmptyState({ variableCount, searchTerm }: EmptyStateProps) {
  return (
    <div className="p-6 text-center text-gray-500">
      <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">
        {variableCount === 0 
          ? "Start debugging to see variables" 
          : searchTerm
          ? "No variables match your search"
          : "No changed variables"
        }
      </p>
    </div>
  )
}