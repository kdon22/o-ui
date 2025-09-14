'use client'

import React from 'react'
import { Filter, Expand, Minimize, History, Zap, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/generalUtils'

interface FilterControlsProps {
  showOnlyChanged: boolean
  showOldValues: boolean
  changeAnimations: boolean
  changedCount: number
  showFilters: boolean
  onToggleChanged: () => void
  onToggleOldValues: () => void
  onToggleAnimations: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
}

export function FilterControls({
  showOnlyChanged,
  showOldValues,
  changeAnimations,
  changedCount,
  showFilters,
  onToggleChanged,
  onToggleOldValues,
  onToggleAnimations,
  onExpandAll,
  onCollapseAll
}: FilterControlsProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      {/* Expand/Collapse Controls */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpandAll}
          className="h-7 text-xs"
          title="Expand all objects and arrays"
        >
          <Expand className="w-3 h-3 mr-1" />
          Expand All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCollapseAll}
          className="h-7 text-xs"
          title="Collapse all expanded items"
        >
          <Minimize className="w-3 h-3 mr-1" />
          Collapse All
        </Button>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center space-x-1">
        {showFilters && changedCount > 0 && (
          <Button
            variant={showOnlyChanged ? "default" : "ghost"}
            size="sm"
            onClick={onToggleChanged}
            className="h-7 text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            Changed only
          </Button>
        )}
        
        {/* Old Values Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleOldValues}
          className="h-7 text-xs"
          title={showOldValues ? "Hide old values" : "Show old values"}
        >
          {showOldValues ? (
            <ToggleRight className="w-3 h-3 mr-1 text-blue-600" />
          ) : (
            <ToggleLeft className="w-3 h-3 mr-1 text-gray-400" />
          )}
          <History className="w-3 h-3 mr-1" />
          Old Values
        </Button>
        
        {/* Animation Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleAnimations}
          className="h-7 text-xs"
          title={changeAnimations ? "Disable change animations" : "Enable change animations"}
        >
          <Zap className={cn("w-3 h-3 mr-1", changeAnimations ? "text-yellow-600" : "text-gray-400")} />
          Animate
        </Button>
      </div>
    </div>
  )
}