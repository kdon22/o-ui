'use client';

/**
 * Header Branch Switcher
 * 
 * Beautiful branch switcher component for the main header
 * Replaces the simple branch display with an elegant dropdown interface
 */

import React, { useState, useCallback } from 'react';
import { 
  GitBranch, 
  ChevronDown, 
  Plus, 
  Settings, 
  Check,
  Star,
  Lock,
  Circle,
  ArrowUpDown,
  GitMerge,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui';
import { useBranchContext, useBranchSwitcher } from '@/lib/branching/branch-provider';
import type { Branch, BranchDisplayOptions } from '@/lib/branching/types';
import { cn } from '@/lib/utils/generalUtils';

// ============================================================================
// INTERFACES
// ============================================================================

interface HeaderBranchSwitcherProps {
  className?: string;
  variant?: 'default' | 'compact';
  showDescription?: boolean;
  showActions?: boolean;
  onCreateBranch?: () => void;
  onManageBranches?: () => void;
}

interface BranchItemProps {
  branch: Branch;
  isActive: boolean;
  isDefault: boolean;
  onClick: () => void;
  showDescription?: boolean;
}

// ============================================================================
// BRANCH ITEM COMPONENT
// ============================================================================

function BranchItem({ 
  branch, 
  isActive, 
  isDefault, 
  onClick, 
  showDescription = true 
}: BranchItemProps) {
  return (
    <DropdownMenuItem
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-all",
        "hover:bg-accent/50 focus:bg-accent/50",
        isActive && "bg-accent border-l-2 border-l-primary"
      )}
      onClick={onClick}
    >
      {/* Branch Status Icon */}
      <div className="flex items-center justify-center w-5 h-5">
        {isActive ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
      
      {/* Branch Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Branch Name */}
          <span className={cn(
            "font-medium truncate",
            isActive ? "text-primary" : "text-foreground"
          )}>
            {branch.name}
          </span>
          
          {/* Branch Badges */}
          <div className="flex items-center gap-1">
            {isDefault && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                default
              </Badge>
            )}
            
            {branch.isLocked && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Lock className="h-3 w-3 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Branch is locked</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        {/* Branch Description */}
        {showDescription && branch.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {branch.description}
          </p>
        )}
      </div>
      
      {/* Branch Status Indicator */}
      <div className="flex items-center gap-1">
        {/* TODO: Add status indicators for ahead/behind commits */}
        <div className="w-2 h-2 bg-green-500 rounded-full opacity-60" />
      </div>
    </DropdownMenuItem>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HeaderBranchSwitcher({
  className,
  variant = 'default',
  showDescription = true,
  showActions = true,
  onCreateBranch,
  onManageBranches
}: HeaderBranchSwitcherProps) {
  const { 
    currentBranch, 
    defaultBranch, 
    availableBranches, 
    isLoading,
    isSwitching,
    error 
  } = useBranchContext();
  const { switchBranch } = useBranchSwitcher();
  const [isOpen, setIsOpen] = useState(false);
  
  // Debug logging
  React.useEffect(() => {
    console.log('[HeaderBranchSwitcher] Branch state debug:', {
      currentBranch: currentBranch?.name || 'null',
      currentBranchId: currentBranch?.id || 'null',
      availableBranchesCount: availableBranches.length,
      isSwitching,
      isLoading,
      error
    });
  }, [currentBranch, availableBranches.length, isSwitching, isLoading, error]);
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  const handleBranchSwitch = useCallback(async (branchId: string) => {
    console.log('🔄 [HeaderBranchSwitcher] handleBranchSwitch called:', {
      targetBranchId: branchId,
      currentBranchId: currentBranch?.id,
      currentBranchName: currentBranch?.name,
      isAlreadyCurrent: branchId === currentBranch?.id,
      availableBranchesCount: availableBranches.length,
      timestamp: new Date().toISOString()
    });
    
    if (branchId === currentBranch?.id) {
      console.log('🚫 [HeaderBranchSwitcher] Branch is already current, skipping switch');
      return;
    }
    
    // Find the target branch for better logging
    const targetBranch = availableBranches.find(b => b.id === branchId);
    console.log('🎯 [HeaderBranchSwitcher] Target branch details:', {
      found: !!targetBranch,
      branchId: branchId,
      branchName: targetBranch?.name || 'NOT FOUND',
      branchDescription: targetBranch?.description || 'N/A',
      timestamp: new Date().toISOString()
    });
    
    try {
      console.log('🚀 [HeaderBranchSwitcher] Starting branch switch to:', branchId);
      await switchBranch({ branchId });
      console.log('✅ [HeaderBranchSwitcher] Branch switch completed successfully to:', branchId);
      setIsOpen(false);
    } catch (error) {
      console.error('❌ [HeaderBranchSwitcher] Switch error:', {
        targetBranchId: branchId,
        targetBranchName: targetBranch?.name || 'UNKNOWN',
        error: error instanceof Error ? error.message : error,
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      // TODO: Show error toast
    }
  }, [currentBranch?.id, switchBranch, availableBranches]);
  
  const handleCreateBranch = useCallback(() => {
    setIsOpen(false);
    onCreateBranch?.();
  }, [onCreateBranch]);
  
  const handleManageBranches = useCallback(() => {
    console.log('🔧 [HeaderBranchSwitcher] handleManageBranches called - triggering onManageBranches');
    setIsOpen(false);
    onManageBranches?.();
  }, [onManageBranches]);
  
  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  // Get display name with clean fallback logic
  const getBranchDisplayName = () => {
    // Try currentBranch first
    if (currentBranch?.name) {
      return currentBranch.name;
    }
    
    // Try default branch
    if (defaultBranch?.name) {
      return defaultBranch.name;
    }
    
    // Last resort fallback
    return 'main';
  };

  const renderTriggerButton = () => {
    const displayName = getBranchDisplayName();
    
    if (variant === 'compact') {
      return (
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "gap-2 px-2 h-8",
            isSwitching && "opacity-50",
            className
          )}
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <GitBranch className="h-3 w-3" />
          )}
          
          <span className="max-w-24 truncate">
            {displayName}
          </span>
          
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      );
    }
    
    return (
      <Button 
        variant="ghost" 
        className={cn(
          "gap-2 px-3 h-9 justify-start",
          isSwitching && "opacity-50",
          className
        )}
        disabled={isSwitching}
      >
        {isSwitching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GitBranch className="h-4 w-4" />
        )}
        
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {displayName}
          </span>
          
          {currentBranch?.isDefault && (
            <Badge variant="outline" className="h-5 px-1.5 text-xs">
              default
            </Badge>
          )}
          
          {currentBranch?.isLocked && (
            <Lock className="h-3 w-3 text-amber-500" />
          )}
        </div>
        
        <ChevronDown className="h-4 w-4 opacity-50 ml-auto" />
      </Button>
    );
  };
  
  const renderBranchList = () => {
    if (availableBranches.length === 0) {
      return (
        <div className="px-3 py-6 text-center text-muted-foreground">
          <p className="text-sm">No branches available</p>
        </div>
      );
    }
    
    // Sort branches: current first, then default, then alphabetical
    const sortedBranches = [...availableBranches].sort((a, b) => {
      if (a.id === currentBranch?.id) return -1;
      if (b.id === currentBranch?.id) return 1;
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return (
      <div className="max-h-80 overflow-y-auto">
        {sortedBranches.map((branch) => (
          <BranchItem
            key={branch.id}
            branch={branch}
            isActive={branch.id === currentBranch?.id}
            isDefault={branch.isDefault}
            onClick={() => handleBranchSwitch(branch.id)}
            showDescription={showDescription}
          />
        ))}
      </div>
    );
  };
  
  const renderActions = () => {
    if (!showActions) return null;
    
    return (
      <>
        <DropdownMenuSeparator />
        
        <div className="p-1">
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleCreateBranch}
          >
            <Plus className="h-4 w-4" />
            <span>Create Branch</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleManageBranches}
          >
            <Settings className="h-4 w-4" />
            <span>Manage Branches</span>
          </DropdownMenuItem>
        </div>
      </>
    );
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              {renderTriggerButton()}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          
          <TooltipContent side="bottom" className="text-xs">
            <p>Switch Branch (⌘B)</p>
          </TooltipContent>
        </Tooltip>
        
        <DropdownMenuContent 
          align="start" 
          className="w-80"
          sideOffset={8}
        >
          {/* Header */}
          <DropdownMenuLabel className="flex items-center gap-2 pb-2">
            <GitBranch className="h-4 w-4" />
            <span>Switch Branch</span>
            
            {isLoading && (
              <Loader2 className="h-3 w-3 animate-spin ml-auto" />
            )}
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Branch List */}
          {renderBranchList()}
          
          {/* Actions */}
          {renderActions()}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}

// ============================================================================
// KEYBOARD SHORTCUT SUPPORT
// ============================================================================

export function useBranchSwitcherShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+B or Ctrl+B to open branch switcher
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return { isOpen, setIsOpen };
}