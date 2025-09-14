'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Command } from 'cmdk'
import { 
  Search, 
  Wand2, 
  Code, 
  FileText, 
  Variable, 
  Zap,
  Hash,
  Settings,
  BookOpen,
  Plus
} from 'lucide-react'
import { getAllHelpers, type HelperConfig } from './helper-registry'

interface HelperCommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSelectHelper: (helperId: string, context?: any) => void
  cursorPosition?: { line: number; column: number }
  contextText?: string
}

// Simple cn utility for className merging
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Helper category mapping for organization
const HELPER_CATEGORIES = {
  'utility': { 
    name: 'Utilities', 
    icon: Wand2, 
    color: 'text-blue-500',
    description: 'Call utility functions and reusable code'
  },
  'vendor': { 
    name: 'Vendor Operations', 
    icon: Hash, 
    color: 'text-green-500',
    description: 'GDS and vendor-specific operations'
  },
  'data': { 
    name: 'Data & Variables', 
    icon: Variable, 
    color: 'text-purple-500',
    description: 'Data manipulation and variable helpers'
  },
  'flow': { 
    name: 'Control Flow', 
    icon: Zap, 
    color: 'text-orange-500',
    description: 'Conditions, loops, and logic flow'
  },
  'snippet': { 
    name: 'Code Snippets', 
    icon: Code, 
    color: 'text-indigo-500',
    description: 'Pre-built code templates'
  },
  'documentation': { 
    name: 'Documentation', 
    icon: BookOpen, 
    color: 'text-teal-500',
    description: 'Comments and documentation helpers'
  }
} as const

// Map helpers to categories (you can extend this)
function getHelperCategory(helper: HelperConfig): keyof typeof HELPER_CATEGORIES {
  // Smart categorization based on helper ID and metadata
  if (helper.id.includes('utility') || helper.id.includes('call')) return 'utility'
  if (helper.id.includes('vendor') || helper.id.includes('remark') || helper.id.includes('gds')) return 'vendor'
  if (helper.id.includes('variable') || helper.id.includes('data')) return 'data'
  if (helper.id.includes('condition') || helper.id.includes('loop') || helper.id.includes('flow')) return 'flow'
  if (helper.id.includes('snippet') || helper.id.includes('template')) return 'snippet'
  if (helper.id.includes('comment') || helper.id.includes('doc')) return 'documentation'
  
  // Default fallback
  return 'snippet'
}

export function HelperCommandPalette({
  isOpen,
  onClose,
  onSelectHelper,
  cursorPosition,
  contextText
}: HelperCommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Get all helpers and organize by category
  const helpers = useMemo(() => {
    const allHelpers = getAllHelpers()
    const categorized: Record<string, HelperConfig[]> = {}
    
    for (const helper of allHelpers) {
      const category = getHelperCategory(helper)
      if (!categorized[category]) {
        categorized[category] = []
      }
      categorized[category].push(helper)
    }
    
    return categorized
  }, [])

  // Filter helpers based on search and context
  const filteredHelpers = useMemo(() => {
    let filtered = helpers
    
    // Filter by category if selected
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = { [selectedCategory]: helpers[selectedCategory] || [] }
    }
    
    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      const searchFiltered: Record<string, HelperConfig[]> = {}
      
      for (const [category, categoryHelpers] of Object.entries(filtered)) {
        const matchingHelpers = categoryHelpers.filter(helper => 
          helper.name.toLowerCase().includes(searchLower) ||
          helper.description.toLowerCase().includes(searchLower) ||
          helper.id.toLowerCase().includes(searchLower) ||
          helper.triggers.some(trigger => 
            typeof trigger.value === 'string' && trigger.value.toLowerCase().includes(searchLower)
          )
        )
        
        if (matchingHelpers.length > 0) {
          searchFiltered[category] = matchingHelpers
        }
      }
      
      filtered = searchFiltered
    }
    
    return filtered
  }, [helpers, search, selectedCategory])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const totalHelpers = Object.values(filteredHelpers).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh]">
      <Command className="bg-background border rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground mr-3" />
          <Command.Input
            ref={inputRef}
            placeholder="Search helpers... (try 'remark', 'utility', 'condition')"
            value={search}
            onValueChange={setSearch}
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
          />
          <div className="text-xs text-muted-foreground ml-3">
            {totalHelpers} helpers
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 p-3 border-b bg-muted/20">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              !selectedCategory 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            All Categories
          </button>
          
          {Object.entries(HELPER_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon
            const count = helpers[key]?.length || 0
            
            if (count === 0) return null
            
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  selectedCategory === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-3 h-3" />
                {category.name}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Results */}
        <Command.List className="overflow-y-auto max-h-[400px]">
          {totalHelpers === 0 ? (
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No helpers found. Try a different search term.
            </Command.Empty>
          ) : (
            Object.entries(filteredHelpers).map(([categoryKey, categoryHelpers]) => {
              const category = HELPER_CATEGORIES[categoryKey as keyof typeof HELPER_CATEGORIES]
              const Icon = category.icon
              
              return (
                <Command.Group key={categoryKey} heading={
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground px-2 py-1.5">
                    <Icon className={cn("w-3 h-3", category.color)} />
                    {category.name}
                    <span className="opacity-70">({categoryHelpers.length})</span>
                  </div>
                }>
                  {categoryHelpers.map((helper) => {
                    // Get keyboard shortcut if available
                    const keybinding = helper.triggers.find(t => t.type === 'keybinding')
                    const intellisense = helper.triggers.find(t => t.type === 'intellisense')
                    
                    // Also check if there's a schema with keyboard shortcut info
                    const schemaShortcut = helper.id // We'll need to get this from schema
                    
                    return (
                      <Command.Item
                        key={helper.id}
                        value={`${helper.name} ${helper.description} ${helper.id}`}
                        onSelect={() => {
                          onSelectHelper(helper.id, { cursorPosition, contextText })
                          onClose()
                        }}
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 aria-selected:bg-muted"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{helper.name}</span>
                            {intellisense && (
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {intellisense.value}
                              </code>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {helper.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {keybinding?.description && (
                            <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {typeof keybinding.description === 'string' ? keybinding.description : 'Shortcut'}
                            </kbd>
                          )}
                          <Plus className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </Command.Item>
                    )
                  })}
                </Command.Group>
              )
            })
          )}
        </Command.List>

        {/* Footer */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/20">
          <div className="flex items-center justify-between">
            <span>
              💡 Tip: Use <kbd className="bg-background px-1 rounded">Cmd+.</kbd> or <kbd className="bg-background px-1 rounded">Cmd+Shift+P</kbd> to open this palette
            </span>
            <span>
              Press <kbd className="bg-background px-1 rounded">↵</kbd> to select, <kbd className="bg-background px-1 rounded">Esc</kbd> to close
            </span>
          </div>
        </div>
      </Command>
    </div>
  )
} 