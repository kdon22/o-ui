import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { EnhancedVariable } from '../types'
import { collectSearchMatches, searchInValue, type SearchMatch } from '../search'
import { buildChildrenForVariable } from '../tree-builder'
import { SEARCH_DEBOUNCE_MS, AUTO_NAVIGATION_DELAY, SCROLL_DELAY, SMOOTH_SCROLL_DURATION } from '../constants'

interface UseSearchNavigationProps {
  enhancedVariables: EnhancedVariable[]
  maxDepth: number
  builtChildren: Map<string, EnhancedVariable[]>
  expandPaths: (paths: Set<string>, children: Map<string, EnhancedVariable[]>) => void
  scrollContainerRef: React.RefObject<HTMLDivElement>
  updateNavControlsPosition: (position: { top: number; right: number }) => void
  resetNavControlsToTop: () => void
}

export function useSearchNavigation({ 
  enhancedVariables, 
  maxDepth, 
  builtChildren, 
  expandPaths,
  scrollContainerRef,
  updateNavControlsPosition,
  resetNavControlsToTop
}: UseSearchNavigationProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedMatchId, setSelectedMatchId] = useState<string>()
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)
  const [preventAutoNavigation, setPreventAutoNavigation] = useState(true)
  
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search term to improve performance with large variable trees
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, SEARCH_DEBOUNCE_MS)
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Collect search matches for sidebar
  const searchMatches = useMemo(() => {
    if (!debouncedSearchTerm) return []
    return collectSearchMatches(enhancedVariables, debouncedSearchTerm)
  }, [enhancedVariables, debouncedSearchTerm])

  // Reset state when search is cleared
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setSelectedMatchId(undefined)
      setCurrentMatchIndex(-1)
    }
  }, [debouncedSearchTerm])

  // Reset match navigation when search changes
  useEffect(() => {
    setCurrentMatchIndex(-1)
    setSelectedMatchId(undefined)
    // Keep auto-navigation prevention enabled for new searches
    setPreventAutoNavigation(true)
  }, [searchMatches])

  // Jump to a specific search match
  const jumpToMatch = useCallback((match: SearchMatch) => {
    setSelectedMatchId(match.id)
    
    // Reset auto-navigation prevention when user manually jumps to a match
    setPreventAutoNavigation(false)
    
    // Update current match index if clicking from sidebar
    const matchIndex = searchMatches.findIndex(m => m.id === match.id)
    if (matchIndex >= 0) {
      setCurrentMatchIndex(matchIndex)
    }
    
    // Build the path that needs to be expanded to show this match
    const pathsToExpand = new Set<string>()
    const childrenToPreBuild = new Map<string, EnhancedVariable[]>()
    
    // Find the variable path and all parent paths that need to be expanded
    const findAndExpandPath = (variables: EnhancedVariable[], targetPath: string[]): boolean => {
      for (const variable of variables) {
        const variablePath = variable.path.join('.')
        const targetPathStr = targetPath.join('.')
        
        // If this variable's path is a prefix of our target, expand it
        if (targetPathStr.startsWith(variablePath)) {
          if (variable.isExpandable) {
            pathsToExpand.add(variablePath)
            
            // Build children if not already built
            if (!builtChildren.has(variablePath)) {
              const children = buildChildrenForVariable(variable, maxDepth)
              childrenToPreBuild.set(variablePath, children)
              
              // Continue searching in children
              if (findAndExpandPath(children, targetPath)) {
                return true
              }
            } else {
              // Search in existing children
              const existingChildren = builtChildren.get(variablePath) || []
              if (findAndExpandPath(existingChildren, targetPath)) {
                return true
              }
            }
          }
          
          // If we found the exact match
          if (variablePath === targetPathStr) {
            return true
          }
        }
      }
      return false
    }
    
    // Start the search from enhanced variables
    findAndExpandPath(enhancedVariables, match.matchPath)
    
    // Update state to expand paths and build children
    expandPaths(pathsToExpand, childrenToPreBuild)
    
    // Scroll to the match after a brief delay to allow DOM updates
    setTimeout(() => {
      const targetElement = document.querySelector(`[data-variable-path="${match.matchPath.join('.')}"]`)
      if (targetElement) {
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        
        // Position navigation controls near the target after scroll completes
        setTimeout(() => {
          const container = scrollContainerRef.current
          if (container && targetElement) {
            const rect = targetElement.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()
            const relativeTop = rect.top - containerRect.top + container.scrollTop
            
            // Position controls near the match, but keep them in the viewport
            const navTop = Math.max(16, Math.min(relativeTop - 80, container.scrollTop + container.clientHeight - 120))
            updateNavControlsPosition({
              top: navTop,
              right: 16
            })
          }
        }, SMOOTH_SCROLL_DURATION) // Wait for smooth scroll to complete
      }
    }, SCROLL_DELAY)
  }, [enhancedVariables, builtChildren, maxDepth, searchMatches, expandPaths, scrollContainerRef, updateNavControlsPosition])

  const jumpToMatchByIndex = useCallback((index: number) => {
    if (index < 0 || index >= searchMatches.length) return

    const match = searchMatches[index]
    setCurrentMatchIndex(index)
    // Reset auto-navigation prevention when user manually navigates
    setPreventAutoNavigation(false)
    jumpToMatch(match)
  }, [searchMatches, jumpToMatch])

  const nextMatch = useCallback(() => {
    if (searchMatches.length === 0) return
    
    const nextIndex = currentMatchIndex < searchMatches.length - 1 
      ? currentMatchIndex + 1 
      : 0 // Loop back to first
    
    jumpToMatchByIndex(nextIndex)
  }, [currentMatchIndex, searchMatches.length, jumpToMatchByIndex])

  const previousMatch = useCallback(() => {
    if (searchMatches.length === 0) return
    
    const prevIndex = currentMatchIndex > 0 
      ? currentMatchIndex - 1 
      : searchMatches.length - 1 // Loop to last
    
    jumpToMatchByIndex(prevIndex)
  }, [currentMatchIndex, searchMatches.length, jumpToMatchByIndex])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setSelectedMatchId(undefined)
    setCurrentMatchIndex(-1)
    setPreventAutoNavigation(true)
    resetNavControlsToTop()
  }, [resetNavControlsToTop])

  const backToTop = useCallback(() => {
    // Reset navigation controls to top position immediately
    resetNavControlsToTop()
    
    // Prevent auto-navigation to first match
    setPreventAutoNavigation(true)
    
    // Clear search state
    setCurrentMatchIndex(-1)
    setSelectedMatchId(undefined)
    
    // Focus and scroll to search input
    const searchInput = searchInputRef.current
    if (searchInput) {
      searchInput.focus()
      searchInput.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }
  }, [resetNavControlsToTop])

  // Auto-navigate to first match when search results are available (disabled by default - user must manually select)
  useEffect(() => {
    if (searchMatches.length > 0 && debouncedSearchTerm && currentMatchIndex === -1 && !preventAutoNavigation) {
      // Small delay to allow UI to update
      setTimeout(() => {
        jumpToMatchByIndex(0)
      }, AUTO_NAVIGATION_DELAY)
    }
  }, [searchMatches.length, debouncedSearchTerm, currentMatchIndex, preventAutoNavigation, jumpToMatchByIndex])

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    searchMatches,
    selectedMatchId,
    currentMatchIndex,
    searchInputRef,
    jumpToMatch,
    nextMatch,
    previousMatch,
    clearSearch,
    backToTop
  }
}