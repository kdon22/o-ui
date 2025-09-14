'use client';

/**
 * Branch Badge Components
 * 
 * Beautiful, consistent branch status indicators for use throughout the UI
 * Shows branch names, status, and visual indicators
 */

import React from 'react';
import { GitBranch, Lock, Star, Circle, CheckCircle2 } from 'lucide-react';
import { Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import type { Branch } from '@/lib/branching/types';
import { cn } from '@/lib/utils/generalUtils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface BranchBadgeProps {
  branch: Branch;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showStatus?: boolean;
  className?: string;
  isActive?: boolean;
}

export interface BranchStatusDotProps {
  branch: Branch;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isActive?: boolean;
}

export interface BranchIndicatorProps {
  branchName: string;
  isDefault?: boolean;
  isLocked?: boolean;
  isActive?: boolean;
  hasChanges?: boolean;
  className?: string;
}

// ============================================================================
// BRANCH BADGE COMPONENT
// ============================================================================

export function BranchBadge({
  branch,
  variant = 'default',
  size = 'md',
  showIcon = true,
  showStatus = true,
  className,
  isActive = false
}: BranchBadgeProps) {
  const sizeClasses = {
    sm: 'h-5 px-2 text-xs',
    md: 'h-6 px-2.5 text-sm',
    lg: 'h-7 px-3 text-sm'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };
  
  const badgeVariant = isActive 
    ? 'default' 
    : branch.isDefault 
      ? 'secondary' 
      : variant;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={badgeVariant}
            className={cn(
              sizeClasses[size],
              "flex items-center gap-1.5 font-medium",
              isActive && "bg-primary text-primary-foreground",
              className
            )}
          >
            {showIcon && (
              <GitBranch className={iconSizes[size]} />
            )}
            
            <span className="truncate max-w-32">
              {branch.name}
            </span>
            
            {showStatus && (
              <div className="flex items-center gap-1">
                {branch.isDefault && (
                  <Star className={cn(iconSizes[size], "text-amber-500")} />
                )}
                
                {branch.isLocked && (
                  <Lock className={cn(iconSizes[size], "text-amber-600")} />
                )}
                
                {isActive && (
                  <CheckCircle2 className={cn(iconSizes[size], "text-green-500")} />
                )}
              </div>
            )}
          </Badge>
        </TooltipTrigger>
        
        <TooltipContent>
          <div className="text-xs">
            <div className="font-medium">{branch.name}</div>
            {branch.description && (
              <div className="text-muted-foreground mt-1">{branch.description}</div>
            )}
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              {branch.isDefault && <span>Default</span>}
              {branch.isLocked && <span>Locked</span>}
              {isActive && <span>Active</span>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// BRANCH STATUS DOT
// ============================================================================

export function BranchStatusDot({
  branch,
  size = 'md',
  className,
  isActive = false
}: BranchStatusDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };
  
  const getStatusColor = () => {
    if (isActive) return 'bg-primary';
    if (branch.isLocked) return 'bg-amber-500';
    if (branch.isDefault) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              sizeClasses[size],
              "rounded-full flex-shrink-0",
              getStatusColor(),
              className
            )}
          />
        </TooltipTrigger>
        
        <TooltipContent>
          <div className="text-xs">
            <div className="font-medium">{branch.name}</div>
            <div className="text-muted-foreground">
              {isActive && 'Currently active'}
              {!isActive && branch.isDefault && 'Default branch'}
              {!isActive && !branch.isDefault && branch.isLocked && 'Locked'}
              {!isActive && !branch.isDefault && !branch.isLocked && 'Available'}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// BRANCH INDICATOR (Lightweight)
// ============================================================================

export function BranchIndicator({
  branchName,
  isDefault = false,
  isLocked = false,
  isActive = false,
  hasChanges = false,
  className
}: BranchIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
      
      <span className={cn(
        "font-medium truncate max-w-24",
        isActive ? "text-primary" : "text-foreground"
      )}>
        {branchName}
      </span>
      
      <div className="flex items-center gap-1">
        {isDefault && (
          <Badge variant="outline" className="h-4 px-1 text-xs">
            default
          </Badge>
        )}
        
        {isActive && (
          <div className="w-2 h-2 bg-primary rounded-full" />
        )}
        
        {isLocked && (
          <Lock className="h-3 w-3 text-amber-500" />
        )}
        
        {hasChanges && (
          <Circle className="h-2 w-2 text-blue-500 fill-current" />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BRANCH LIST ITEM (For dropdowns and lists)
// ============================================================================

export interface BranchListItemProps {
  branch: Branch;
  isActive?: boolean;
  onClick?: () => void;
  showDescription?: boolean;
  className?: string;
}

export function BranchListItem({
  branch,
  isActive = false,
  onClick,
  showDescription = true,
  className
}: BranchListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer",
        "hover:bg-accent/50",
        isActive && "bg-accent border border-primary/20",
        className
      )}
      onClick={onClick}
    >
      {/* Status Indicator */}
      <BranchStatusDot 
        branch={branch} 
        isActive={isActive}
        size="sm"
      />
      
      {/* Branch Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium truncate",
            isActive ? "text-primary" : "text-foreground"
          )}>
            {branch.name}
          </span>
          
          {branch.isDefault && (
            <Badge variant="secondary" className="h-4 px-1.5 text-xs">
              default
            </Badge>
          )}
          
          {branch.isLocked && (
            <Lock className="h-3 w-3 text-amber-500" />
          )}
        </div>
        
        {showDescription && branch.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {branch.description}
          </p>
        )}
      </div>
      
      {/* Active Indicator */}
      {isActive && (
        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
      )}
    </div>
  );
}