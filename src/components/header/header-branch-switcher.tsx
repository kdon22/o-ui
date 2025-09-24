/**
 * HeaderBranchSwitcher - Clean Development Implementation
 * 
 * Simplified branch display for development phase.
 * Uses new session system without complex legacy compatibility layers.
 */

'use client'

import React from 'react'
import { GitBranch } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useBranchContext } from '@/lib/session'
import { cn } from '@/lib/utils/generalUtils'

// ============================================================================
// TYPES
// ============================================================================

export interface HeaderBranchSwitcherProps {
  variant?: 'default' | 'compact'
  className?: string
  showDescription?: boolean
  showActions?: boolean
  onCreateBranch?: () => void
  onManageBranches?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HeaderBranchSwitcher({
  variant = 'default',
  className,
  showDescription = true,
  showActions = true,
  onCreateBranch,
  onManageBranches
}: HeaderBranchSwitcherProps) {
  // 🚀 CLEAN: Use new session system directly
  const branchContext = useBranchContext()
  
  // Early return if not ready
  if (!branchContext.isReady) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50 opacity-50">
              <GitBranch className="h-4 w-4 text-muted-foreground animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Loading...</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Loading branch context...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const { currentBranchId, defaultBranchId, isFeatureBranch } = branchContext

  // Get display name from current branch ID
  const getBranchDisplayName = () => {
    return currentBranchId || 'main'
  }

  const displayName = getBranchDisplayName()

  // 🚀 CLEAN: Simplified branch display for development
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30", className)}>
              <GitBranch className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium max-w-20 truncate">{displayName}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">Current Branch</p>
              <p className="text-sm text-muted-foreground">{displayName}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50", className)}>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{displayName}</span>
            
            {/* Branch indicators */}
            {currentBranchId === defaultBranchId && (
              <Badge variant="outline" className="h-5 px-1.5 text-xs">
                default
              </Badge>
            )}
            {isFeatureBranch && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                feature
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">Current Branch</p>
            <p className="text-sm text-muted-foreground">{displayName}</p>
            {showDescription && (
              <p className="text-xs text-muted-foreground mt-1">
                Active workspace branch
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================================================
// KEYBOARD SHORTCUTS (Simplified for development)
// ============================================================================

export function useBranchSwitcherShortcuts() {
  // Placeholder for future keyboard shortcut functionality
  // Currently no complex branch switching in development phase
  return { 
    isOpen: false, 
    setIsOpen: () => {}, 
    shortcuts: [] 
  }
}