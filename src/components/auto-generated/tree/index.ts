/**
 * Auto-Generated Tree Components - Enhanced Performance & UX
 * 
 * This module exports all tree-related components with gold standard features:
 * - Professional Lucide React icons
 * - Smooth Framer Motion animations
 * - Virtual scrolling for large datasets
 * - Drag & drop functionality
 * - Error boundaries for robustness
 * - Skeleton loading states
 * - Performance monitoring
 * - Full keyboard navigation
 */

// ============================================================================
// MAIN TREE COMPONENTS
// ============================================================================

export { AutoTree } from './auto-tree';
export { TreeNode } from './tree-node';
export { TreeContextMenu } from './tree-context-menu';
export { TreeSearch } from './tree-search';
export { TreeSearchEnhanced } from './tree-search-enhanced';
export { TreeFooter } from './tree-footer';
export { FilterTabBar } from '../table/filter-tab-bar';

// ============================================================================
// ENHANCED PERFORMANCE COMPONENTS
// ============================================================================

export { 
  VirtualTreeContainer, 
  useVirtualTreePerformance 
} from './tree-virtual-container';

export { 
  DragDropTree, 
  useDragDropTree 
} from './tree-drag-drop';

// ============================================================================
// ROBUSTNESS COMPONENTS
// ============================================================================

export { 
  TreeErrorBoundary, 
  SimpleTreeErrorBoundary,
  useTreeErrorHandler 
} from './tree-error-boundary';

// ============================================================================
// LOADING & SKELETON COMPONENTS
// ============================================================================

export { 
  TreeSkeleton,
  CompactTreeSkeleton,
  DetailedTreeSkeleton,
  StaticTreeSkeleton,
  ProgressiveTreeSkeleton,
  useTreeSkeletonState 
} from './tree-skeleton';

// ============================================================================
// KEYBOARD NAVIGATION & ACCESSIBILITY
// ============================================================================

export { 
  default as TreeKeyboardNavigation
} from './tree-keyboard-navigation';

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

export { 
  default as TreeConflictResolution
} from './tree-conflict-resolution';

// ============================================================================
// ACTIONS & UTILITIES
// ============================================================================

export { 
  useTreeActions, 
  getActionHandler 
} from './tree-actions';

// ============================================================================
// TYPES
// ============================================================================

export type { TreeNodeData } from './auto-tree';
export type { VirtualTreeContainerProps, FlatTreeNode } from './tree-virtual-container';
export type { DragDropTreeProps, DragData, DropZoneData } from './tree-drag-drop';
export type { TreeSkeletonProps, SkeletonNodeProps } from './tree-skeleton';
export type { KeyboardNavigationProps, KeyboardShortcut } from './tree-keyboard-navigation';
export type { ConflictData, ConflictResolution, ConflictResolutionProps } from './tree-conflict-resolution';

// ============================================================================
// COMPOSED COMPONENTS
// ============================================================================

/**
 * Enhanced Auto Tree with all features enabled
 */
export { AutoTree as EnhancedAutoTree } from './auto-tree';

/**
 * Performance-optimized tree for large datasets
 */
export { VirtualTreeContainer as PerformanceTree } from './tree-virtual-container';

/**
 * Interactive tree with drag & drop
 */
export { DragDropTree as InteractiveTree } from './tree-drag-drop';

// CSS imports
import './auto-tree.css'; 