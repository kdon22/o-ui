/**
 * Tree Navigation Sidebar
 * 
 * Specialized wrapper for the main navigation sidebar.
 * Pre-configured for optimal navigation experience:
 * - Single selection mode
 * - Search enabled
 * - Footer with branch controls
 * - Full height sidebar layout
 */

'use client';

import React from 'react';
import { TreeNavigation } from './tree-navigation';
import { TreeMode } from './tree-types';
import type { TreeNavigationProps, TreeEventHandlers } from './tree-types';

// ============================================================================
// SIDEBAR-SPECIFIC CONFIGURATION
// ============================================================================

const SIDEBAR_CONFIG: Partial<TreeNavigationProps['config']> = {
  search: {
    enabled: true,
    placeholder: 'Search nodes...',
    fields: ['name', 'description'],
    fuzzySearch: true,
    minQueryLength: 1,
    maxResults: 20,
    highlightMatches: true,
    autoExpand: true
  },
  multiSelect: {
    enabled: false, // Sidebar focuses on navigation, not selection
    max: 1,
    showCount: false,
    showActions: false
  },
  performance: {
    lazyLoad: true,
    chunkSize: 50,
    cacheSize: 500
  }
};

const SIDEBAR_DISPLAY_OPTIONS: Partial<TreeNavigationProps['displayOptions']> = {
  showIcons: true,
  showBadges: true,
  showTooltips: true,
  showLines: true,
  showRoot: true,
  compactMode: false,
  indentSize: 16,
  lineHeight: 32
};

// ============================================================================
// SIDEBAR WRAPPER COMPONENT
// ============================================================================

export interface TreeNavigationSidebarProps {
  className?: string;
  onNodeNavigate?: (nodeId: string) => void;
  onNodeCreate?: (parentId: string | null) => void;
  onNodeUpdate?: (nodeId: string) => void;
  onNodeDelete?: (nodeId: string) => void;
  initialExpandedNodes?: string[];
  width?: string | number;
}

export function TreeNavigationSidebar({
  className,
  onNodeNavigate,
  onNodeCreate,
  onNodeUpdate,
  onNodeDelete,
  initialExpandedNodes,
  width = '300px'
}: TreeNavigationSidebarProps) {

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const eventHandlers: TreeEventHandlers = {
    onNodeClick: (node) => {
      onNodeNavigate?.(node.id);
    },
    onNodeCreate: (parent, data) => {
      if (data.name) {
        onNodeCreate?.(parent?.id || null);
      }
    },
    onNodeUpdate: (node, data) => {
      onNodeUpdate?.(node.id);
    },
    onNodeDelete: (node) => {
      onNodeDelete?.(node.id);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <TreeNavigation
      className={className}
      config={SIDEBAR_CONFIG}
      displayOptions={SIDEBAR_DISPLAY_OPTIONS}
      eventHandlers={eventHandlers}
      initialExpandedNodes={initialExpandedNodes}
      mode={TreeMode.NAVIGATION}
      multiSelectEnabled={false}
      searchEnabled={true}
      footerEnabled={true}
      height="100vh"
      width={width}
    />
  );
} 