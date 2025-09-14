'use client'

import React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/generalUtils'
import type { SearchMatch } from '../search'

interface SearchControlsProps {
  searchTerm: string
  debouncedSearchTerm: string
  searchMatches: SearchMatch[]
  currentMatchIndex: number
  searchInputRef: React.RefObject<HTMLInputElement>
  onSearchChange: (value: string) => void
  onClearSearch: () => void
}

export function SearchControls({
  searchTerm,
  debouncedSearchTerm,
  searchMatches,
  currentMatchIndex,
  searchInputRef,
  onSearchChange,
  onClearSearch
}: SearchControlsProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
        <Input
          ref={searchInputRef}
          placeholder="Search variables (e.g., 'lineNumber')..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          showSuccessIndicator={false}
          className={cn(
            "pl-7 h-8 text-xs bg-white border-gray-200",
            searchTerm ? "pr-8" : "pr-3"
          )}
        />
        {searchTerm && (
          <button
            onClick={onClearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
            title="Clear search"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>
      
      {searchTerm && (
        <div className="space-y-2">
          {/* Search Results Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {debouncedSearchTerm !== searchTerm ? (
                "Searching..."
              ) : searchMatches.length === 0 ? (
                "No matches found" 
              ) : (
                `${searchMatches.length} match${searchMatches.length === 1 ? '' : 'es'} for "${searchTerm}"`
              )}
            </span>
            {debouncedSearchTerm === searchTerm && searchMatches.length > 0 && (
              <span className="text-blue-600">
                {currentMatchIndex >= 0 ? (
                  `${currentMatchIndex + 1} of ${searchMatches.length}`
                ) : (
                  "Click to navigate"
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}