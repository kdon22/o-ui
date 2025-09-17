'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Search } from 'lucide-react'
import { UniversalRuleSearch, type SearchResult, type SearchEntityType } from './universal-rule-search'
import { MonacoCodeInsertion } from './monaco-code-insertion'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SearchState {
  isOpen: boolean
  defaultTab?: SearchEntityType
  placeholder?: string
}

export interface UniversalSearchContextValue {
  // State
  isOpen: boolean
  defaultTab: SearchEntityType
  placeholder: string

  // Actions
  openSearch: (options?: Partial<SearchState>) => void
  closeSearch: () => void
  
  // Specialized openers with defaults
  openGlobalVarSearch: () => void
  openUtilitySearch: () => void
  openClassSearch: () => void
  
  // Event handlers
  onRuleSelect?: (rule: SearchResult) => void
  setOnRuleSelect: (handler: (rule: SearchResult) => void) => void
}

// ============================================================================
// CONTEXT
// ============================================================================

const UniversalSearchContext = createContext<UniversalSearchContextValue | null>(null)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export interface UniversalSearchProviderProps {
  children: React.ReactNode
  defaultOnRuleSelect?: (rule: SearchResult) => void
}

export function UniversalSearchProvider({ 
  children, 
  defaultOnRuleSelect 
}: UniversalSearchProviderProps) {
  
  // 🚨 DEBUG: Hook count tracking to find React hook ordering issue
  let hookCount = 0
  const hookDebug = (name: string) => {
    hookCount++
  }
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  hookDebug('useState-isOpen')
  const [isOpen, setIsOpen] = useState(false)
  
  hookDebug('useState-defaultTab')
  const [defaultTab, setDefaultTab] = useState<SearchEntityType>('all_rules')
  
  hookDebug('useState-placeholder')
  const [placeholder, setPlaceholder] = useState('Search rules...')
  
  hookDebug('useState-onRuleSelect')
  const [onRuleSelect, setOnRuleSelect] = useState<((rule: SearchResult) => void) | undefined>(
    () => defaultOnRuleSelect
  )

  // ============================================================================
  // ACTIONS (DEFINED FIRST TO AVOID INITIALIZATION ERRORS)
  // ============================================================================

  hookDebug('useCallback-openSearch')
  const openSearch = useCallback((options?: Partial<SearchState>) => {
    if (options?.defaultTab) {
      setDefaultTab(options.defaultTab)
    }
    if (options?.placeholder) {
      setPlaceholder(options.placeholder)
    }
    setIsOpen(true)
  }, [])

  hookDebug('useCallback-closeSearch')
  const closeSearch = useCallback(() => {
    setIsOpen(false)
    setDefaultTab('all_rules')
    setPlaceholder('Search rules...')
  }, [])

  // Specialized search openers with predefined defaults
  hookDebug('useCallback-openGlobalVarSearch')
  const openGlobalVarSearch = useCallback(() => {
    openSearch({
      defaultTab: 'global_var',
      placeholder: 'Search global variables...'
    })
  }, [openSearch])

  hookDebug('useCallback-openUtilitySearch')
  const openUtilitySearch = useCallback(() => {
    openSearch({
      defaultTab: 'utility',
      placeholder: 'Search utility functions...'
    })
  }, [openSearch])

  hookDebug('useCallback-openClassSearch')
  const openClassSearch = useCallback(() => {
    openSearch({
      defaultTab: 'classes',
      placeholder: 'Search business classes...'
    })
  }, [openSearch])

  // ============================================================================
  // GLOBAL KEYBOARD SHORTCUTS
  // ============================================================================
  
  hookDebug('useEffect-globalKeyboardShortcuts')
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {

      // Cmd/Ctrl + K to open general search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isOpen) {
    
        e.preventDefault()
        e.stopPropagation()
        openSearch()
        return
      }

      // Specialized shortcuts when not already in search
      if (!isOpen && e.shiftKey && e.altKey) {
    
        e.preventDefault()
        e.stopPropagation()
        switch (e.key.toLowerCase()) {
          case 'g':
            openGlobalVarSearch()
            break
          case 'u':
            openUtilitySearch()
            break
          case 'c':
            openClassSearch()
            break
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true })
  }, [isOpen, openSearch, openGlobalVarSearch, openUtilitySearch, openClassSearch])

  // Listen for custom events from Monaco editor (fallback)
  useEffect(() => {
    const handleCustomSearch = (e: CustomEvent) => {
  
      if (!isOpen) {
        openSearch()
      }
    }

    window.addEventListener('universal-search-open', handleCustomSearch as EventListener)
    return () => window.removeEventListener('universal-search-open', handleCustomSearch as EventListener)
  }, [isOpen, openSearch])

  hookDebug('useCallback-handleSetOnRuleSelect')
  const handleSetOnRuleSelect = useCallback((handler: (rule: SearchResult) => void) => {
    setOnRuleSelect(() => handler)
  }, [])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: UniversalSearchContextValue = {
    // State
    isOpen,
    defaultTab,
    placeholder,

    // Actions
    openSearch,
    closeSearch,
    
    // Specialized openers
    openGlobalVarSearch,
    openUtilitySearch,
    openClassSearch,
    
    // Event handlers
    onRuleSelect,
    setOnRuleSelect: handleSetOnRuleSelect
  }

  // ============================================================================
  // DEFAULT RULE SELECTION HANDLER
  // ============================================================================

  hookDebug('useCallback-handleRuleSelect')
  const handleRuleSelect = useCallback(async (result: SearchResult) => {
    // Determine if this is a rule or class result
    const isRule = 'type' in result
    const resultType = isRule ? (result as any).type : 'CLASS'
    

    
    // First, execute any custom handler provided by the consuming component
    if (onRuleSelect) {
      onRuleSelect(result)
    }
    
    // Then attempt Monaco code insertion
    try {
      if (isRule) {
        // For rules, convert to the expected format for Monaco insertion
        const success = await MonacoCodeInsertion.insertClassSnippet(result as any)
        if (success) {
      
        } else {
          console.warn('⚠️ [UniversalSearch] Failed to insert rule snippet - no active Monaco editor found')
        }
      } else {
        // For classes, use directly
        const success = await MonacoCodeInsertion.insertClassSnippet(result as any)  
        if (success) {
      
        } else {
          console.warn('⚠️ [UniversalSearch] Failed to insert class snippet - no active Monaco editor found')  
        }
      }
    } catch (error) {
      console.error('❌ [UniversalSearch] Error inserting code snippet:', error)
    }
    
    // Close the search modal
    closeSearch()
  }, [onRuleSelect, closeSearch])

  // ============================================================================
  // RENDER
  // ============================================================================


  return (
    <UniversalSearchContext.Provider value={contextValue}>
      {children}
      
      {/* Universal Search Modal */}
      <UniversalRuleSearch
        isOpen={isOpen}
        onClose={closeSearch}
        onSelectRule={handleRuleSelect}
        defaultTab={defaultTab}
        placeholder={placeholder}
      />
    </UniversalSearchContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useUniversalSearch(): UniversalSearchContextValue {
  const context = useContext(UniversalSearchContext)
  
  if (!context) {
    throw new Error('useUniversalSearch must be used within a UniversalSearchProvider')
  }
  
  return context
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for components that want to trigger specific rule type searches
 */
export function useRuleTypeSearch() {
  const { openGlobalVarSearch, openUtilitySearch, openClassSearch } = useUniversalSearch()
  
  return {
    searchGlobalVars: openGlobalVarSearch,
    searchUtilities: openUtilitySearch,
    searchClasses: openClassSearch
  }
}

/**
 * Hook for components that want to customize rule selection behavior
 */
export function useRuleSelection(onRuleSelect: (rule: SearchResult) => void) {
  const { setOnRuleSelect } = useUniversalSearch()
  
  useEffect(() => {
    setOnRuleSelect(onRuleSelect)
    
    // Cleanup: reset to default on unmount
    return () => {
      setOnRuleSelect(() => undefined)
    }
  }, [onRuleSelect, setOnRuleSelect])
}

// ============================================================================
// TRIGGER COMPONENT (for places that need a search button)
// ============================================================================

export interface SearchTriggerProps {
  variant?: 'button' | 'input'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  placeholder?: string
  defaultTab?: SearchEntityType
}

export function SearchTrigger({ 
  variant = 'input',
  size = 'md',
  className,
  placeholder = 'Search rules...',
  defaultTab = 'all_rules'
}: SearchTriggerProps) {
  const { openSearch } = useUniversalSearch()
  
  const handleClick = useCallback(() => {
    openSearch({ defaultTab, placeholder })
  }, [openSearch, defaultTab, placeholder])

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors ${className}`}
      >
        <Search className="w-4 h-4" />
        Search Rules
        <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
      </button>
    )
  }

  return (
    <div
      onClick={handleClick}
      className={`relative cursor-pointer ${className}`}
    >
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        readOnly
        className={`
          w-full rounded-md border border-input bg-background py-2 pl-10 pr-12 text-sm
          placeholder:text-muted-foreground cursor-pointer
          focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          transition-all duration-200
          ${size === 'sm' ? 'py-1.5 text-xs' : size === 'lg' ? 'py-3 text-base' : ''}
        `}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <kbd className="bg-muted px-1 py-0.5 rounded">⌘</kbd>
          <kbd className="bg-muted px-1 py-0.5 rounded">K</kbd>
        </div>
      </div>
    </div>
  )
}