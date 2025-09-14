'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronUp, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SearchMatch } from '../search'

interface NavigationControlsProps {
  searchTerm: string
  debouncedSearchTerm: string
  searchMatches: SearchMatch[]
  currentMatchIndex: number
  showBackToTop: boolean
  navControlsPosition: { top: number; right: number }
  onPreviousMatch: () => void
  onNextMatch: () => void
  onBackToTop: () => void
}

export function NavigationControls({
  searchTerm,
  debouncedSearchTerm,
  searchMatches,
  currentMatchIndex,
  showBackToTop,
  navControlsPosition,
  onPreviousMatch,
  onNextMatch,
  onBackToTop
}: NavigationControlsProps) {
  return (
    <>
      {/* Floating Navigation Controls - shown during search */}
      {debouncedSearchTerm === searchTerm && searchMatches.length > 0 && (
        <div 
          className="absolute z-50"
          style={{ 
            top: `${navControlsPosition.top}px`, 
            right: `${navControlsPosition.right}px` 
          }}
        >
          <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg border p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreviousMatch}
              disabled={searchMatches.length === 0}
              className="h-8 px-3 text-xs hover:bg-gray-100"
              title="Previous match (Shift+F3)"
            >
              <ChevronLeft className="w-3 h-3 mr-1" />
              Prev
            </Button>
            
            {/* Current match indicator */}
            <div className="px-2 py-1 text-xs font-mono text-gray-600 bg-gray-50 rounded border">
              {currentMatchIndex >= 0 ? (
                <>
                  <span className="text-blue-600 font-semibold">{currentMatchIndex + 1}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span>{searchMatches.length}</span>
                </>
              ) : (
                <span className="text-gray-400">{searchMatches.length}</span>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextMatch}
              disabled={searchMatches.length === 0}
              className="h-8 px-3 text-xs hover:bg-gray-100"
              title="Next match (F3)"
            >
              Next
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
            <div className="w-px h-6 bg-gray-200"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTop}
              className="h-8 px-3 text-xs hover:bg-gray-100"
              title="Back to top (Escape)"
            >
              <ChevronUp className="w-3 h-3 mr-1" />
              Top
            </Button>
          </div>
        </div>
      )}
      
      {/* Floating Back to Top Button - shown when no search */}
      {showBackToTop && (!searchTerm || searchMatches.length === 0) && (
        <div className="absolute bottom-4 right-4 z-50">
          <Button
            onClick={onBackToTop}
            className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 p-0 border-2 border-white"
            title="Back to top (Escape)"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        </div>
      )}
    </>
  )
}