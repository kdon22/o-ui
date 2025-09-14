/**
 * Tree Attachment Selector
 * 
 * Specialized wrapper for selecting multiple nodes as attachments.
 * Pre-configured for optimal multi-selection experience:
 * - Multi-select mode enabled
 * - Compact display for dialogs/modals
 * - Selection controls and bulk actions
 * - Optimized for attachment workflows
 */

'use client';

import React, { useState, useCallback } from 'react';
import { TreeNavigation } from './tree-navigation';
import { TreeMode } from './tree-types';
import type { 
  TreeNavigationProps, 
  TreeEventHandlers, 
  TreeNode,
  TreeAction 
} from './tree-types';

// ============================================================================
// ATTACHMENT SELECTOR CONFIGURATION
// ============================================================================

const ATTACHMENT_CONFIG: Partial<TreeNavigationProps['config']> = {
  search: {
    enabled: true,
    placeholder: 'Search to attach nodes...',
    fields: ['name', 'description', 'path'],
    fuzzySearch: true,
    minQueryLength: 1,
    maxResults: 50,
    highlightMatches: true,
    autoExpand: true
  },
  multiSelect: {
    enabled: true,
    max: 100,
    showCount: true,
    showActions: true
  },
  performance: {
    lazyLoad: true,
    chunkSize: 100,
    cacheSize: 1000
  }
};

const ATTACHMENT_DISPLAY_OPTIONS: Partial<TreeNavigationProps['displayOptions']> = {
  showIcons: true,
  showBadges: false, // Cleaner for selection
  showTooltips: true,
  showLines: false, // Cleaner for dialogs
  showRoot: true,
  compactMode: true, // Optimized for modal space
  indentSize: 12,
  lineHeight: 28
};

// ============================================================================
// ATTACHMENT SELECTOR COMPONENT
// ============================================================================

export interface TreeAttachmentSelectorProps {
  className?: string;
  onSelectionChange?: (selectedNodes: TreeNode[]) => void;
  onSelectionConfirm?: (selectedNodes: TreeNode[]) => void;
  onCancel?: () => void;
  initialSelectedNodes?: string[];
  maxSelections?: number;
  height?: string | number;
  width?: string | number;
  showConfirmButtons?: boolean;
  excludeNodeIds?: string[]; // Nodes to exclude from selection
  filterFunction?: (node: TreeNode) => boolean; // Custom filter
}

export function TreeAttachmentSelector({
  className,
  onSelectionChange,
  onSelectionConfirm,
  onCancel,
  initialSelectedNodes = [],
  maxSelections = 100,
  height = '400px',
  width = '100%',
  showConfirmButtons = true,
  excludeNodeIds = [],
  filterFunction
}: TreeAttachmentSelectorProps) {
  
  const [selectedNodes, setSelectedNodes] = useState<TreeNode[]>([]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const config = {
    ...ATTACHMENT_CONFIG,
    multiSelect: {
      ...ATTACHMENT_CONFIG.multiSelect!,
      max: maxSelections
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSelectionChange = useCallback((nodes: TreeNode[]) => {
    // Apply exclusions and filters
    const filteredNodes = nodes.filter(node => {
      if (excludeNodeIds.includes(node.id)) return false;
      if (filterFunction && !filterFunction(node)) return false;
      return true;
    });

    setSelectedNodes(filteredNodes);
    onSelectionChange?.(filteredNodes);
  }, [excludeNodeIds, filterFunction, onSelectionChange]);

  const handleConfirm = useCallback(() => {
    onSelectionConfirm?.(selectedNodes);
  }, [selectedNodes, onSelectionConfirm]);

  const eventHandlers: TreeEventHandlers = {
    onNodeSelect: (node, selected) => {
      // This will be handled by the multi-select logic in TreeNavigation
    }
  };

  // Custom actions for attachment selector
  const attachmentActions: TreeAction[] = [
    {
      id: 'select-all-visible',
      label: 'Select All Visible',
      icon: 'check-all',
      handler: 'selectAllVisible'
    },
    {
      id: 'clear-selection',
      label: 'Clear Selection',
      icon: 'x',
      handler: 'clearSelection'
    }
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-full">
      {/* Tree Selection Area */}
      <div className="flex-1 min-h-0">
        <TreeNavigation
          className={className}
          config={config}
          displayOptions={ATTACHMENT_DISPLAY_OPTIONS}
          eventHandlers={eventHandlers}
          initialSelectedNodes={initialSelectedNodes}
          mode={TreeMode.MULTI_SELECT}
          multiSelectEnabled={true}
          searchEnabled={true}
          footerEnabled={false} // We'll use custom footer
          height={height}
          width={width}
        />
      </div>

      {/* Selection Summary & Actions */}
      <div className="flex-shrink-0 border-t bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedNodes.length} of {maxSelections} selected
          </div>
          
          {showConfirmButtons && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedNodes.length === 0}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Attach {selectedNodes.length > 0 ? `(${selectedNodes.length})` : ''}
              </button>
            </div>
          )}
        </div>
        
        {/* Selected Items Preview */}
        {selectedNodes.length > 0 && (
          <div className="mt-2 max-h-20 overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {selectedNodes.slice(0, 10).map(node => (
                <span
                  key={node.id}
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {node.name}
                  <button
                    type="button"
                    onClick={() => {
                      const newSelection = selectedNodes.filter(n => n.id !== node.id);
                      handleSelectionChange(newSelection);
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {selectedNodes.length > 10 && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  +{selectedNodes.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 