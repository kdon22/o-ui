'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Command } from 'cmdk'
import { 
  Search, 
  Code2, 
  Wrench, 
  Database,
  Tag,
  X,
  Filter,
  Clock,
  User,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils/generalUtils'
import { useActionQuery } from '@/hooks/use-action-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TagDisplay } from '@/features/tags/components/tag-display'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SearchEntityType = 'all_rules' | 'global_var' | 'utility' | 'classes'

export interface RuleSearchResult {
  id: string
  name: string
  description?: string
  type: 'GLOBAL_VAR' | 'UTILITY'  // ← Removed BUSINESS
  pythonName?: string
  sourceCode?: string
  pythonCode?: string
  isActive: boolean
  runOrder?: number
  tags?: Array<{
    id: string
    name: string
    color: string
  }>
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface ClassSearchResult {
  id: string
  name: string
  description?: string
  pythonName?: string
  sourceCode?: string  // ← This is what we need for code insertion!
  pythonCode?: string
  isActive: boolean
  category?: string
  tags?: Array<{
    id: string
    name: string
    color: string
  }>
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export type SearchResult = RuleSearchResult | ClassSearchResult

export interface UniversalRuleSearchProps {
  isOpen: boolean
  onClose: () => void
  onSelectRule: (result: SearchResult) => void  // ← Now accepts both rules and classes
  defaultTab?: SearchEntityType
  placeholder?: string
  className?: string
}

// ============================================================================
// SEARCH CONFIGURATION  
// ============================================================================

const SEARCH_CONFIG = {
  all_rules: {
    label: 'All Rules',
    icon: Code2,
    shortcut: null,
    description: 'Global variables and utility functions',
    entityType: 'rules' as const,
    apiAction: 'rule.list' as const,
    filters: { type: ['GLOBAL_VAR', 'UTILITY'] }  // ← Only these two types
  },
  global_var: {
    label: 'Global Variables',
    icon: Database,
    shortcut: 'G',
    description: 'Global configuration variables',
    entityType: 'rules' as const,
    apiAction: 'rule.list' as const,
    filters: { type: 'GLOBAL_VAR' }
  },
  utility: {
    label: 'Utility Functions',
    icon: Wrench,
    shortcut: 'U',
    description: 'Reusable utility functions',
    entityType: 'rules' as const,
    apiAction: 'rule.list' as const,
    filters: { type: 'UTILITY' }
  },
  classes: {
    label: 'Business Classes',
    icon: Code2,
    shortcut: 'C',
    description: 'Business logic and class definitions',
    entityType: 'classes' as const,
    apiAction: 'class.list' as const,  // ← Separate API call for classes!
    filters: {}
  }
} as const

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UniversalRuleSearch({
  isOpen,
  onClose,
  onSelectRule,
  defaultTab = 'all_rules',
  placeholder = 'Search rules...',
  className
}: UniversalRuleSearchProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [search, setSearch] = useState('')
  const [selectedTab, setSelectedTab] = useState<SearchEntityType>(defaultTab)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Fetch rules based on current filters
  const ruleQuery = useActionQuery(
    SEARCH_CONFIG[selectedTab].apiAction,
    {
      filters: {
        ...SEARCH_CONFIG[selectedTab].filters,
        ...(search.trim() && { search: search.trim() }),
        ...(selectedTags.length > 0 && { tagIds: selectedTags }),
        isActive: true
      },
      options: {
        limit: 50,
        sort: { field: 'name', direction: 'asc' as const },
        include: ['tags']
      }
    },
    {
      enabled: isOpen,
      staleTime: 30 * 1000, // 30 seconds
      fallbackToCache: true
    }
  )

  // Fetch available tags for filtering
  const tagsQuery = useActionQuery(
    'tag.list',
    {
      filters: { isActive: true },
      options: {
        limit: 100,
        sort: { field: 'name', direction: 'asc' as const }
      }
    },
    {
      enabled: isOpen && showFilters,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  )

  const results = useMemo(() => {
    const data = ruleQuery.data?.data || []
    return Array.isArray(data) ? data : []
  }, [ruleQuery.data])

  const availableTags = useMemo(() => {
    const data = tagsQuery.data?.data || []
    return Array.isArray(data) ? data : []
  }, [tagsQuery.data])

  // ============================================================================
  // KEYBOARD SHORTCUTS & EFFECTS
  // ============================================================================

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      // Reset search when opening
      setSearch('')
    }
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Tab switching shortcuts: Shift + Alt + [G|U|C]
      if (e.shiftKey && e.altKey) {
        e.preventDefault()
        switch (e.key.toLowerCase()) {
          case 'g':
            setSelectedTab('global_var')
            break
          case 'u':
            setSelectedTab('utility')
            break
          case 'c':
            setSelectedTab('classes')
            break
        }
        return
      }

      // Number keys for tab switching (1-4)
      if (e.key >= '1' && e.key <= '4' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const tabs: SearchEntityType[] = ['all_rules', 'global_var', 'utility', 'classes']
        const tabIndex = parseInt(e.key) - 1
        if (tabs[tabIndex]) {
          setSelectedTab(tabs[tabIndex])
        }
      }

      // Toggle filters with 'f'
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowFilters(!showFilters)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, showFilters])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleResultSelect = useCallback((result: SearchResult) => {
    onSelectRule(result)
    onClose()
  }, [onSelectRule, onClose])

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }, [])

  const clearFilters = useCallback(() => {
    setSelectedTags([])
    setSearch('')
  }, [])

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderResultItem = (result: SearchResult) => {
    // Determine if this is a rule or class result
    const isRule = 'type' in result
    const isClass = 'category' in result
    
    let config, Icon
    if (isRule) {
      const ruleResult = result as RuleSearchResult
      config = SEARCH_CONFIG[
        ruleResult.type === 'GLOBAL_VAR' ? 'global_var' : 'utility'
      ]
    } else {
      config = SEARCH_CONFIG['classes']
    }
    Icon = config.icon

    return (
      <Command.Item
        key={result.id}
        value={`${result.name} ${result.description} ${result.pythonName || ''}`}
        onSelect={() => handleResultSelect(result)}
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent rounded-md"
      >
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{result.name}</span>
            {result.pythonName && (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {result.pythonName}
              </code>
            )}
            {!result.isActive && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
          
          {result.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
              {result.description}
            </p>
          )}
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {config.label}
            </Badge>
            
            {result.tags && result.tags.length > 0 && (
              <div className="flex gap-1">
                {result.tags.slice(0, 3).map(tag => (
                  <Badge 
                    key={tag.id}
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {result.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{result.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
            
            {isRule && (result as RuleSearchResult).runOrder !== undefined && (
              <span className="text-xs text-muted-foreground">
                Order: {(result as RuleSearchResult).runOrder}
              </span>
            )}
            
            {isClass && (result as ClassSearchResult).category && (
              <span className="text-xs text-muted-foreground">
                Category: {(result as ClassSearchResult).category}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 inline mr-1" />
          {new Date(result.updatedAt).toLocaleDateString()}
        </div>
      </Command.Item>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh]">
      <Command 
        className={cn(
          "bg-background border rounded-lg shadow-2xl w-full max-w-4xl max-h-[70vh] overflow-hidden",
          className
        )}
        shouldFilter={false} // We handle filtering via API
      >
        {/* Header */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground mr-3" />
          <Command.Input
            ref={inputRef}
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
          />
          
          <div className="flex items-center gap-2 ml-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs"
            >
              <Filter className="w-3 h-3 mr-1" />
              Filters
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground">
              {results.length} results
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b px-4 py-2 bg-muted/30">
          {Object.entries(SEARCH_CONFIG).map(([key, config]) => {
            const Icon = config.icon
            const isSelected = selectedTab === key
            
            return (
              <button
                key={key}
                onClick={() => setSelectedTab(key as SearchEntityType)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isSelected 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-3 h-3" />
                {config.label}
                {config.shortcut && (
                  <kbd className="ml-1 text-xs bg-muted px-1 py-0.5 rounded">
                    ⇧⌥{config.shortcut}
                  </kbd>
                )}
              </button>
            )
          })}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-b px-4 py-3 bg-muted/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Filter by Tags</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {availableTags.map((tag) => (
                <Button
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTagToggle(tag.id)}
                  className="text-xs h-6"
                  style={{
                    backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined
                  }}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          {ruleQuery.isLoading && (
            <div className="p-4 text-center text-muted-foreground">
              <Zap className="w-4 h-4 animate-spin mx-auto mb-2" />
              Searching {SEARCH_CONFIG[selectedTab].label}...
            </div>
          )}

          {ruleQuery.error && (
            <div className="p-4 text-center text-red-500">
              Error loading {SEARCH_CONFIG[selectedTab].label}: {ruleQuery.error.message}
            </div>
          )}

          {!ruleQuery.isLoading && !ruleQuery.error && results.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No {SEARCH_CONFIG[selectedTab].label} found</p>
              <p className="text-xs mt-1">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}

          {!ruleQuery.isLoading && !ruleQuery.error && results.length > 0 && (
            <Command.Group>
              {results.map(renderResultItem)}
            </Command.Group>
          )}
        </Command.List>

        {/* Footer */}
        <div className="border-t px-4 py-2 bg-muted/20">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>↵ Select</span>
              <span>↑↓ Navigate</span>
              <span>ESC Close</span>
              <span>F Toggle Filters</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⇧⌥G Global</span>
              <span>⇧⌥U Utility</span>
              <span>⇧⌥C Classes</span>
            </div>
          </div>
        </div>
      </Command>
    </div>
  )
} 