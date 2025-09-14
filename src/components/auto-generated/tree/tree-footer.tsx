/**
 * Tree Footer Component - Status and actions for AutoTree
 * 
 * Features:
 * - Tree statistics (node count, branch info)
 * - Branch switching dropdown
 * - Quick action buttons (Add Node, Refresh)
 * - Mobile-first responsive design
 * - Integration with branch context from session
 */

"use client";

import React, { useState, useCallback } from 'react';
import { GitBranch, Plus, RefreshCw, Folder, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// TYPES
// ============================================================================

export interface BranchInfo {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  lastModified: string;
}

export interface TreeStats {
  totalNodes: number;
  visibleNodes: number;
  expandedNodes: number;
  selectedNodeId?: string | null;
}

export interface TreeFooterProps {
  stats?: TreeStats;
  currentBranch?: BranchInfo;
  availableBranches?: BranchInfo[];
  onBranchSwitch?: (branchId: string) => void;
  onAddNode?: () => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TreeFooter: React.FC<TreeFooterProps> = ({
  stats = { totalNodes: 0, visibleNodes: 0, expandedNodes: 0 },
  currentBranch,
  availableBranches = [],
  onBranchSwitch,
  onAddNode,
  onRefresh,
  onSettings,
  className,
  compact = false
}) => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleBranchSelect = useCallback((branchId: string) => {
    onBranchSwitch?.(branchId);
    setShowBranchDropdown(false);
  }, [onBranchSwitch]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const formatNodeCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}m`;
  };

  // ============================================================================
  // RENDER BRANCH SELECTOR
  // ============================================================================
  const renderBranchSelector = () => {
    if (!currentBranch) return null;

    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBranchDropdown(!showBranchDropdown)}
          className={cn(
            "h-7 px-2 text-xs font-medium",
            compact ? "gap-1" : "gap-2"
          )}
        >
          <GitBranch className="w-3 h-3 text-muted-foreground" />
          <span className="truncate max-w-20">
            {currentBranch.name}
          </span>
          {currentBranch.isDefault && (
            <Badge variant="secondary" className="text-xs py-0 px-1 h-4">
              main
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>

        {/* Branch Dropdown */}
        {showBranchDropdown && (
          <div className="absolute bottom-full left-0 mb-1 bg-background border border-border rounded-md shadow-lg min-w-48 z-50">
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Switch Branch
              </div>
              {availableBranches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchSelect(branch.id)}
                  className={cn(
                    "w-full text-left p-2 hover:bg-muted/50 rounded-sm flex items-center gap-2",
                    currentBranch.id === branch.id && "bg-muted"
                  )}
                >
                  <GitBranch className="w-3 h-3 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{branch.name}</span>
                      {branch.isDefault && (
                        <Badge variant="secondary" className="text-xs py-0 px-1 h-4">
                          main
                        </Badge>
                      )}
                    </div>
                    {branch.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {branch.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER STATS
  // ============================================================================
  const renderStats = () => {
    if (compact) {
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Folder className="w-3 h-3" />
          <span>{formatNodeCount(stats.visibleNodes)}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Folder className="w-3 h-3" />
          <span>{formatNodeCount(stats.visibleNodes)} nodes</span>
        </div>
        
        {stats.expandedNodes > 0 && (
          <div className="flex items-center gap-1">
            <span>{stats.expandedNodes} expanded</span>
          </div>
        )}

        {stats.selectedNodeId && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>selected</span>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER ACTION BUTTONS
  // ============================================================================
  const renderActions = () => {
    return (
      <div className="flex items-center gap-1">
        {onAddNode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddNode}
            className="h-7 w-7 p-0"
            title="Add Node"
          >
            <Plus className="w-3 h-3" />
          </Button>
        )}
        
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-7 w-7 p-0"
            title="Refresh Tree"
          >
            <RefreshCw className={cn(
              "w-3 h-3",
              isRefreshing && "animate-spin"
            )} />
          </Button>
        )}

        {onSettings && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettings}
            className="h-7 w-7 p-0"
            title="Tree Settings"
          >
            <Settings className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div 
      className={cn(
        "border-t border-border bg-muted/30",
        compact ? "px-2 py-1" : "px-3 py-2",
        className
      )}
      onMouseLeave={() => setShowBranchDropdown(false)}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: Branch Selector */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {renderBranchSelector()}
          {!compact && currentBranch && (
            <div className="w-px h-4 bg-border"></div>
          )}
          {renderStats()}
        </div>

        {/* Right: Action Buttons */}
        {renderActions()}
      </div>

      {/* Status Messages */}
      {!compact && isRefreshing && (
        <div className="mt-1 text-xs text-muted-foreground">
          Refreshing tree data...
        </div>
      )}
    </div>
  );
}; 