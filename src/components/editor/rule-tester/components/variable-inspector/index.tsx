'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'
import { Badge } from '@/components/ui/badge'

import type { VariableInspectorProps } from './types'
import { SearchSidebar } from './search-sidebar'
import { SearchControls } from './components/search-controls'
import { FilterControls } from './components/filter-controls'
import { NavigationControls } from './components/navigation-controls'
import { VariableList } from './components/variable-list'
import { useFilteredVariables } from './utils/filter-utils'
import { useKeyboardHandlers } from './utils/keyboard-handlers'

// Hooks
import { useVariableHistory } from './hooks/use-variable-history'
import { useTreeExpansion } from './hooks/use-tree-expansion'
import { useSearchNavigation } from './hooks/use-search-navigation'
import { useScrollControls } from './hooks/use-scroll-controls'

// 🏗️ **MAIN COMPONENT** - Professional Variable Inspector with VS Code Debugger Style
export function VariableInspector({ 
  variables, 
  className, 
  showSearch = true,
  showFilters = true,
  maxDepth = 8,
  showOldValues = true,
  onVariableChange
}: VariableInspectorProps) {
  // UI State
  const [showOnlyChanged, setShowOnlyChanged] = useState(false)
  const [showOldValuesToggle, setShowOldValuesToggle] = useState(showOldValues)
  const [changeAnimations, setChangeAnimations] = useState(true)

  // Custom hooks for different responsibilities
  const { enhancedVariables, changedCount } = useVariableHistory({
    variables,
    maxDepth,
    onVariableChange
  })

  const treeExpansion = useTreeExpansion({
    variables: enhancedVariables,
    maxDepth
  })

  const scrollControls = useScrollControls()

  const searchNavigation = useSearchNavigation({
    enhancedVariables,
    maxDepth,
    builtChildren: treeExpansion.builtChildren,
    expandPaths: treeExpansion.expandPaths,
    scrollContainerRef: scrollControls.scrollContainerRef,
    updateNavControlsPosition: scrollControls.updateNavControlsPosition,
    resetNavControlsToTop: scrollControls.resetNavControlsToTop
  })

  // Apply filters with auto-expansion for search results
  const filteredVariables = useMemo(() => {
    return useFilteredVariables({
      enhancedVariables,
      searchTerm: searchNavigation.debouncedSearchTerm,
      showOnlyChanged,
      maxDepth,
      builtChildren: treeExpansion.builtChildren,
      onExpandPaths: treeExpansion.expandPaths
    })
  }, [
    enhancedVariables, 
    searchNavigation.debouncedSearchTerm, 
    showOnlyChanged, 
    maxDepth, 
    treeExpansion.builtChildren, 
    treeExpansion.expandPaths
  ])

  // Keyboard shortcuts handler
  useKeyboardHandlers({
    isSearchActive: !!searchNavigation.debouncedSearchTerm,
    hasMatches: searchNavigation.searchMatches.length > 0,
    onBackToTop: searchNavigation.backToTop,
    onNextMatch: searchNavigation.nextMatch,
    onPreviousMatch: searchNavigation.previousMatch
  })

  // Copy to clipboard utility
  const copyValue = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      // Could add a toast notification here
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err)
    }
  }, [])

  return (
    <div className={cn("flex bg-white border-l border-gray-200", className)}>
      {/* Search Results Panel - shows automatically when there are search results */}
      {searchNavigation.searchTerm && searchNavigation.searchMatches.length > 0 && (
        <SearchSidebar
          matches={searchNavigation.searchMatches}
          searchTerm={searchNavigation.searchTerm}
          selectedMatchId={searchNavigation.selectedMatchId}
          onMatchClick={searchNavigation.jumpToMatch}
          onClose={searchNavigation.clearSearch}
        />
      )}
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header with Search & Filters */}
        <div className="px-3 py-3 border-b border-gray-200 bg-gray-50/80 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Variables</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs bg-white">
                {filteredVariables.length}
              </Badge>
              {changedCount > 0 && (
                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Zap className="w-3 h-3 mr-1" />
                  {changedCount} changed
                </Badge>
              )}
            </div>
          </div>
          
          {showSearch && (
            <SearchControls
              searchTerm={searchNavigation.searchTerm}
              debouncedSearchTerm={searchNavigation.debouncedSearchTerm}
              searchMatches={searchNavigation.searchMatches}
              currentMatchIndex={searchNavigation.currentMatchIndex}
              searchInputRef={searchNavigation.searchInputRef}
              onSearchChange={searchNavigation.setSearchTerm}
              onClearSearch={searchNavigation.clearSearch}
            />
          )}
          
          <FilterControls
            showOnlyChanged={showOnlyChanged}
            showOldValues={showOldValuesToggle}
            changeAnimations={changeAnimations}
            changedCount={changedCount}
            showFilters={showFilters}
            onToggleChanged={() => setShowOnlyChanged(!showOnlyChanged)}
            onToggleOldValues={() => setShowOldValuesToggle(!showOldValuesToggle)}
            onToggleAnimations={() => setChangeAnimations(!changeAnimations)}
            onExpandAll={treeExpansion.expandAll}
            onCollapseAll={treeExpansion.collapseAll}
          />
        </div>

        {/* Variables List */}
        <div ref={scrollControls.scrollContainerRef} className="flex-1 overflow-auto relative">
          <NavigationControls
            searchTerm={searchNavigation.searchTerm}
            debouncedSearchTerm={searchNavigation.debouncedSearchTerm}
            searchMatches={searchNavigation.searchMatches}
            currentMatchIndex={searchNavigation.currentMatchIndex}
            showBackToTop={scrollControls.showBackToTop}
            navControlsPosition={scrollControls.navControlsPosition}
            onPreviousMatch={searchNavigation.previousMatch}
            onNextMatch={searchNavigation.nextMatch}
            onBackToTop={searchNavigation.backToTop}
          />
          
          <VariableList
            variables={filteredVariables}
            originalVariables={variables}
            searchTerm={searchNavigation.searchTerm}
            debouncedSearchTerm={searchNavigation.debouncedSearchTerm}
            expandedPaths={treeExpansion.expandedPaths}
            builtChildren={treeExpansion.builtChildren}
            showOldValues={showOldValuesToggle}
            changeAnimations={changeAnimations}
            onToggleExpanded={treeExpansion.toggleExpanded}
            onCopyValue={copyValue}
          />
        </div>
      </div>
    </div>
  )
}