/**
 * Tree Footer Component
 * 
 * Provides footer controls for tree navigation including:
 * - Branch information and switching
 * - Tree-wide actions (expand all, collapse all, etc.)
 * - Selection summary and bulk actions
 */

'use client';

import React from 'react';
import { TreeMode, type TreeFooterProps, type TreeAction } from './tree-types';
import { getBranchDisplayName } from '@/lib/utils/branch-utils'

// Simple utility function for className merging
function cn(...classes: (string | undefined | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// TREE FOOTER COMPONENT
// ============================================================================

export function TreeFooter({
  selectedCount,
  totalCount,
  mode,
  actions,
  onModeChange,
  onActionClick,
  className
}: TreeFooterProps) {

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderAction = (action: TreeAction) => (
    <button
      key={action.id}
      onClick={() => onActionClick(action)}
      disabled={action.disabled}
      className={cn(
        'px-2 py-1 text-xs rounded border transition-colors',
        'hover:bg-gray-50 active:bg-gray-100',
        action.disabled && 'opacity-50 cursor-not-allowed',
        action.color === 'primary' && 'bg-blue-50 text-blue-700 border-blue-200'
      )}
      title={action.label}
    >
      {action.icon && <span className="mr-1">{getActionIcon(action.icon)}</span>}
      {action.label}
    </button>
  );

  const getActionIcon = (icon: string) => {
    switch (icon) {
      case 'plus': return '+';
      case 'expand': return '⤢';
      case 'collapse': return '⤡';
      case 'refresh': return '↻';
      case 'settings': return '⚙';
      default: return '';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn(
      'flex items-center justify-between p-2 bg-gray-50 border-t text-xs text-gray-600',
      className
    )}>
      {/* Left: Status Info */}
      <div className="flex items-center gap-4">
        {/* Item Count */}
        <span>
          {mode === TreeMode.MULTI_SELECT && selectedCount > 0 
            ? `${selectedCount} of ${totalCount} selected`
            : `${totalCount} items`
          }
        </span>

        {/* Mode Indicator */}
        {mode === TreeMode.MULTI_SELECT && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
            Multi-select
          </span>
        )}

        {/* Branch Info - TODO: Add branch context */}
        <span className="text-gray-500">
          Branch: {getBranchDisplayName('main')}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {actions.map(action => renderAction(action))}
        
        {/* Mode Toggle */}
        {mode !== TreeMode.SEARCH && (
          <button
            onClick={() => onModeChange(
              mode === TreeMode.MULTI_SELECT 
                ? TreeMode.NAVIGATION 
                : TreeMode.MULTI_SELECT
            )}
            className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-50"
          >
            {mode === TreeMode.MULTI_SELECT ? 'Exit Select' : 'Multi-select'}
          </button>
        )}
      </div>
    </div>
  );
} 