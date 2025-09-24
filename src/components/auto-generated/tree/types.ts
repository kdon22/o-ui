/**
 * Auto-Tree Types - Shared type definitions
 * 
 * Breaking circular dependencies by centralizing shared types
 * used between auto-tree.tsx and tree-node.tsx
 */

import type { ReactNode } from 'react';

/**
 * Core tree node data structure
 */
export interface TreeNodeData {
  id: string;
  idShort: string;
  name: string;
  parentId?: string | null;
  level: number;
  path: string;
  sortOrder: number;
  childCount: number;
  isActive: boolean;
  type: 'NODE' | 'CUSTOMER' | string;
  // Tree-specific states
  isExpanded?: boolean;
  isLoading?: boolean;
  children?: TreeNodeData[];
  description?: string;
  icon?: ReactNode;
  hasChildren?: boolean;
  isRootNode?: boolean;
  isLeafNode?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Tree component props interface
 */
export interface TreeProps {
  onNodeSelect?: (node: TreeNodeData) => void;
  onNodeExpand?: (node: TreeNodeData) => void;
  onNodeCollapse?: (node: TreeNodeData) => void;
  onContextMenu?: (node: TreeNodeData, action: string) => void;
  onTreeStatsChange?: (stats: { totalNodes: number, visibleNodes: number }) => void;
  onNodesDataChange?: (data: any[]) => void;
  className?: string;
  maxHeight?: number;
  showSearch?: boolean;
  enableDragDrop?: boolean;
}

/**
 * AutoTree specific props interface
 */
export interface AutoTreeProps extends TreeProps {
  rootNodeId: string;
  userRootNodeId?: string;
}

/**
 * Tree node component props
 */
export interface TreeNodeProps {
  node: TreeNodeData;
  level?: number;
  isSelected?: boolean;
  onExpand?: (node: TreeNodeData) => void;
  onCollapse?: (node: TreeNodeData) => void;
  onSelect?: (node: TreeNodeData) => void;
  onContextMenu?: (node: TreeNodeData, event: React.MouseEvent) => void;
  className?: string;
}
