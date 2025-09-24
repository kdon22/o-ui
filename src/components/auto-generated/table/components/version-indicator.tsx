/**
 * Version Indicator - Shows version status for table rows
 * 
 * Features:
 * - Last modified timestamp
 * - Version count badge
 * - Change status indicator
 * - Click to view history
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// TEMP DIAGNOSTIC: remove lucide-react entirely to isolate chunk issues
const Clock = ((props: any) => <span {...props} />);
const History = ((props: any) => <span {...props} />);
const GitBranch = ((props: any) => <span {...props} />);
const User = ((props: any) => <span {...props} />);
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface VersionIndicatorProps {
  entity: any;
  onViewHistory?: (entity: any) => void;
  showVersionCount?: boolean;
  showLastModified?: boolean;
  showBranchInfo?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VersionIndicator({
  entity,
  onViewHistory,
  showVersionCount = true,
  showLastModified = true,
  showBranchInfo = false,
  compact = false,
  className
}: VersionIndicatorProps) {
  
  // Extract version information from entity
  const lastModified = entity.updatedAt ? new Date(entity.updatedAt) : null;
  const createdAt = entity.createdAt ? new Date(entity.createdAt) : null;
  const version = entity.version || 1;
  const isInherited = entity.branchId !== 'main' && entity.originalRuleId; // Example for rules
  const modifiedBy = entity.updatedBy || entity.createdBy;
  
  // Determine status
  const isNew = createdAt && Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000; // Less than 24 hours
  const isRecentlyModified = lastModified && Date.now() - lastModified.getTime() < 60 * 60 * 1000; // Less than 1 hour

  if (compact) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        {showVersionCount && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={isNew ? "default" : "secondary"} 
                  className="text-xs px-1 py-0 h-5"
                >
                  v{version}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Version {version}</p>
                {lastModified && (
                  <p className="text-xs text-muted-foreground">
                    Modified {formatDistanceToNow(lastModified)} ago
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {isRecentlyModified && (
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        )}
        
        {onViewHistory && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => onViewHistory(entity)}
          >
            <History className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Version Badge */}
      {showVersionCount && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={isNew ? "default" : isInherited ? "outline" : "secondary"}
                className="text-xs"
              >
                {isInherited && <GitBranch className="h-3 w-3 mr-1" />}
                v{version}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Version {version}</p>
              {isInherited && <p className="text-xs">Inherited from main branch</p>}
              {isNew && <p className="text-xs text-green-600">New (created today)</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Status Indicators */}
      <div className="flex items-center space-x-1">
        {isRecentlyModified && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Recently modified</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {isNew && (
          <Badge variant="default" className="text-xs px-2 py-0 h-5 bg-blue-500">
            NEW
          </Badge>
        )}
      </div>

      {/* Last Modified Info */}
      {showLastModified && lastModified && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-xs text-muted-foreground space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(lastModified)} ago</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last modified: {lastModified.toLocaleString()}</p>
              {modifiedBy && (
                <p className="text-xs flex items-center mt-1">
                  <User className="h-3 w-3 mr-1" />
                  {modifiedBy}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Branch Info */}
      {showBranchInfo && entity.branchId && entity.branchId !== 'main' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs">
                <GitBranch className="h-3 w-3 mr-1" />
                {entity.branchId}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Branch: {entity.branchId}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* History Button */}
      {onViewHistory && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onViewHistory(entity)}
              >
                <History className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View change history</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Simple version badge for minimal display
 */
export function VersionBadge({ 
  version, 
  isNew = false, 
  isInherited = false 
}: { 
  version: number; 
  isNew?: boolean; 
  isInherited?: boolean; 
}) {
  return (
    <Badge 
      variant={isNew ? "default" : isInherited ? "outline" : "secondary"}
      className="text-xs"
    >
      {isInherited && <GitBranch className="h-3 w-3 mr-1" />}
      v{version}
    </Badge>
  );
}

/**
 * Change status dot for quick visual indication
 */
export function ChangeStatusDot({ 
  lastModified, 
  className 
}: { 
  lastModified?: Date | string; 
  className?: string; 
}) {
  if (!lastModified) return null;
  
  const modifiedDate = typeof lastModified === 'string' ? new Date(lastModified) : lastModified;
  const isRecent = Date.now() - modifiedDate.getTime() < 60 * 60 * 1000; // Less than 1 hour
  
  if (!isRecent) return null;
  
  return (
    <div className={`h-2 w-2 bg-green-500 rounded-full animate-pulse ${className}`} />
  );
}

export default VersionIndicator;
