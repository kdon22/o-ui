'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Check, ChevronDown, Package, Code, Database, Workflow, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useActionQuery } from '@/hooks/use-action-api'
import { ComponentType } from '@/features/marketplace/types'
import { cn } from '@/lib/utils/generalUtils'

interface ComponentSelectorProps {
  value?: string[]
  onChange?: (value: string[]) => void
  componentType: ComponentType
  multiSelect?: boolean
  className?: string
  disabled?: boolean
}

const COMPONENT_CONFIG = {
  rules: {
    icon: Code,
    label: 'Business Rules',
    actionPrefix: 'rule'
  },
  classes: {
    icon: Package,
    label: 'Classes',
    actionPrefix: 'class'
  },
  tables: {
    icon: Database,
    label: 'Data Tables',
    actionPrefix: 'tables'
  },
  workflows: {
    icon: Workflow,
    label: 'Workflows',
    actionPrefix: 'workflow'
  }
} as const

// Isolated component item to prevent re-render loops
const ComponentItem = React.memo(({ 
  component, 
  isSelected, 
  onToggle, 
  disabled 
}: {
  component: any
  isSelected: boolean
  onToggle: (id: string) => void
  disabled: boolean
}) => {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onToggle(component.id)
    }
  }, [onToggle, component.id, disabled])

  const handleCheckboxChange = useCallback((checked: boolean) => {
    if (!disabled) {
      onToggle(component.id)
    }
  }, [onToggle, component.id, disabled])

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-colors hover:bg-muted/50',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              disabled={disabled}
              className="mt-0.5"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                {component.name}
              </span>
              {component.type && (
                <Badge variant="outline" className="text-xs">
                  {component.type}
                </Badge>
              )}
            </div>
            
            {component.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {component.description}
              </p>
            )}
          </div>
          
          {isSelected && (
            <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  )
})

ComponentItem.displayName = 'ComponentItem'

export function ComponentSelector({
  value = [],
  onChange,
  componentType,
  multiSelect = true,
  className,
  disabled = false
}: ComponentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Component configuration
  const config = COMPONENT_CONFIG[componentType]
  
  // Fetch components
  const { data: componentsResponse, isLoading } = useActionQuery(
    `${config.actionPrefix}.list` as any,
    { 
      limit: 5000,
      includeInactive: false 
    },
    { enabled: true }
  )

  const allComponents = componentsResponse?.data || []

  // Get unique types for filter
  const availableTypes = useMemo(() => {
    if (!allComponents.length) return []
    const types = new Set(allComponents.map((c: any) => c.type).filter(Boolean) as string[])
    return Array.from(types).sort()
  }, [allComponents])

  // Filter and sort components
  const filteredComponents = useMemo(() => {
    let filtered = allComponents

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((component: any) => 
        component.name?.toLowerCase().includes(query) ||
        component.description?.toLowerCase().includes(query) ||
        component.type?.toLowerCase().includes(query)
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((component: any) => 
        component.type?.toLowerCase() === typeFilter.toLowerCase()
      )
    }

    // Sort by name
    return filtered.sort((a: any, b: any) => {
      const aName = a.name?.toLowerCase() || ''
      const bName = b.name?.toLowerCase() || ''
      return aName.localeCompare(bName)
    })
  }, [allComponents, searchQuery, typeFilter])

  // Pagination
  const pageSize = 20
  const totalPages = Math.ceil(filteredComponents.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedComponents = filteredComponents.slice(startIndex, startIndex + pageSize)

  // Reset pagination when filters change
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }, [])

  const handleTypeFilterChange = useCallback((type: string) => {
    setTypeFilter(type)
    setCurrentPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setTypeFilter('all')
    setCurrentPage(1)
  }, [])

  // Selection handlers - stable references
  const handleToggleItem = useCallback((itemId: string) => {
    if (disabled || !onChange) return

    const currentValue = value || []
    const newSelection = multiSelect
      ? currentValue.includes(itemId)
        ? currentValue.filter(id => id !== itemId)
        : [...currentValue, itemId]
      : currentValue.includes(itemId) ? [] : [itemId]
    
    onChange(newSelection)
  }, [value, onChange, multiSelect, disabled])

  const handleSelectAll = useCallback(() => {
    if (disabled || !onChange) return
    const allIds = filteredComponents.map((item: any) => item.id)
    onChange(allIds)
  }, [filteredComponents, onChange, disabled])

  const handleClearAll = useCallback(() => {
    if (disabled || !onChange) return
    onChange([])
  }, [onChange, disabled])

  // Computed values
  const selectedCount = (value || []).length
  const totalCount = allComponents.length
  const filteredCount = filteredComponents.length
  const hasFilters = searchQuery.trim() || typeFilter !== 'all'

  // Loading state
  if (isLoading && !allComponents.length) {
    return (
      <div className={cn('space-y-2', className)}>
        <Button
          variant="outline"
          className="w-full justify-between h-auto p-4 opacity-50 cursor-not-allowed"
          disabled
        >
          <div className="flex items-center gap-3">
            <config.icon className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium">{config.label}</div>
              <div className="text-sm text-muted-foreground">
                Loading {config.label.toLowerCase()}...
              </div>
            </div>
          </div>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-between h-auto p-4',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-3">
              <config.icon className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">{config.label}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedCount > 0 
                    ? `${selectedCount} of ${totalCount} selected${hasFilters ? ` (${filteredCount} shown)` : ''}`
                    : `Select ${config.label.toLowerCase()} (${totalCount} available)`
                  }
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {selectedCount}
                </Badge>
              )}
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform',
                isOpen && 'rotate-180'
              )} />
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-3">
          {allComponents.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-muted-foreground">
                  No {config.label.toLowerCase()} available
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search and Filters */}
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${config.label.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={disabled}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => handleSearchChange('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Type Filter - Simple Select */}
                  {availableTypes.length > 0 && (
                    <select
                      value={typeFilter}
                      onChange={(e) => handleTypeFilterChange(e.target.value)}
                      disabled={disabled}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white disabled:opacity-50"
                    >
                      <option value="all">All Types</option>
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Clear Filters */}
                  {hasFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters} disabled={disabled}>
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}

                  {/* Results Count */}
                  <div className="text-sm text-muted-foreground ml-auto">
                    {hasFilters ? `${filteredCount} of ${totalCount}` : `${totalCount} total`}
                  </div>
                </div>
              </div>

              {/* No Results */}
              {filteredComponents.length === 0 ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center text-muted-foreground">
                      {hasFilters ? 'No components match your filters' : `No ${config.label.toLowerCase()} available`}
                    </div>
                    {hasFilters && (
                      <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                        Clear filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Bulk Actions */}
                  {multiSelect && filteredCount > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={disabled}
                      >
                        Select All ({filteredCount})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                        disabled={disabled || selectedCount === 0}
                      >
                        Clear All
                      </Button>
                    </div>
                  )}

                  {/* Component List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {paginatedComponents.map((component: any) => {
                      const isSelected = (value || []).includes(component.id)
                      
                      return (
                        <ComponentItem
                          key={component.id}
                          component={component}
                          isSelected={isSelected}
                          onToggle={handleToggleItem}
                          disabled={disabled}
                        />
                      )
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} ({filteredCount} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={disabled || currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={disabled || currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}