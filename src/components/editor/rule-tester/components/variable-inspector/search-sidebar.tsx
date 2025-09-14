'use client'

import React from 'react'
import { Search, ChevronRight, Hash, Type, Quote } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SearchMatch } from './search'
import { highlightText } from './search'

interface SearchSidebarProps {
  matches: SearchMatch[]
  searchTerm: string
  selectedMatchId?: string
  onMatchClick: (match: SearchMatch) => void
  onClose: () => void
  className?: string
}

// 🔍 **SEARCH SIDEBAR** - VS Code style search results panel
export function SearchSidebar({ 
  matches, 
  searchTerm, 
  selectedMatchId,
  onMatchClick, 
  onClose, 
  className 
}: SearchSidebarProps) {
  // Group matches by their base variable name for better organization
  const groupedMatches = React.useMemo(() => {
    const groups = new Map<string, SearchMatch[]>()
    
    matches.forEach(match => {
      const baseVariableName = match.variable.name
      const existing = groups.get(baseVariableName) || []
      groups.set(baseVariableName, [...existing, match])
    })
    
    return Array.from(groups.entries()).map(([variableName, matches]) => ({
      variableName,
      matches: matches.sort((a, b) => a.contextPath.localeCompare(b.contextPath))
    }))
  }, [matches])

  const getMatchIcon = (matchType: SearchMatch['matchType']) => {
    switch (matchType) {
      case 'name':
        return <Hash className="w-3 h-3 text-blue-500" />
      case 'type':
        return <Type className="w-3 h-3 text-purple-500" />
      case 'value':
        return <Quote className="w-3 h-3 text-green-500" />
      default:
        return <Search className="w-3 h-3 text-gray-400" />
    }
  }

  const getMatchTypeLabel = (matchType: SearchMatch['matchType']) => {
    switch (matchType) {
      case 'name':
        return 'name'
      case 'type':
        return 'type'
      case 'value':
        return 'value'
      default:
        return 'match'
    }
  }

  return (
    <div className={cn(
      "flex flex-col bg-white border-r border-gray-200 min-w-80 max-w-96",
      className
    )}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Search Results</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
            title="Close search results"
          >
            ×
          </Button>
        </div>
        
        <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
          <span>
            {matches.length} match{matches.length === 1 ? '' : 'es'} for "{searchTerm}"
          </span>
          <Badge variant="outline" className="text-xs">
            {groupedMatches.length} variable{groupedMatches.length === 1 ? '' : 's'}
          </Badge>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-auto">
        {matches.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No matches found</p>
          </div>
        ) : (
          <div className="text-sm">
            {groupedMatches.map(({ variableName, matches }) => (
              <div key={variableName} className="border-b border-gray-100">
                {/* Variable Group Header */}
                <div className="px-3 py-2 bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span className="font-medium text-gray-700">{variableName}</span>
                    <Badge variant="outline" className="text-xs">
                      {matches.length}
                    </Badge>
                  </div>
                </div>

                {/* Matches in this variable */}
                <div>
                  {matches.map((match) => (
                    <Button
                      key={match.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start p-3 h-auto text-left hover:bg-blue-50 rounded-none border-b border-gray-50",
                        selectedMatchId === match.id && "bg-blue-100 border-blue-200"
                      )}
                      onClick={() => onMatchClick(match)}
                    >
                      <div className="flex-1 min-w-0">
                        {/* Match type and path */}
                        <div className="flex items-center space-x-2 mb-1">
                          {getMatchIcon(match.matchType)}
                          <span className="text-xs text-gray-500 font-mono">
                            {match.contextPath}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getMatchTypeLabel(match.matchType)}
                          </Badge>
                        </div>

                        {/* Match text with highlighting */}
                        <div className="text-sm text-gray-900 mb-1">
                          <span className="font-mono">
                            {highlightText(match.matchText, searchTerm)}
                          </span>
                        </div>

                        {/* Value preview */}
                        {match.matchType !== 'value' && match.valuePreview && (
                          <div className="text-xs text-gray-500 font-mono truncate">
                            = {match.valuePreview}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}