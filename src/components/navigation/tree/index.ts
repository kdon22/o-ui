/**
 * Tree Navigation System Exports
 * 
 * Provides a comprehensive tree navigation system with:
 * - Core TreeNavigation component
 * - Specialized wrappers for different use cases
 * - Supporting components and utilities
 * - TypeScript types
 */

// ============================================================================
// CORE COMPONENTS
// ============================================================================

export { TreeNavigation } from './tree-navigation';
export { TreeSearch } from './tree-search';
export { TreeRenderer } from './tree-renderer';
export { TreeFooter } from './tree-footer';
export { TreeMultiSelect } from './tree-multi-select';

// ============================================================================
// SPECIALIZED WRAPPERS
// ============================================================================

export { TreeNavigationSidebar } from './tree-navigation-sidebar';
export { TreeAttachmentSelector } from './tree-attachment-selector';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Core types
  TreeNode,
  TreeNodeWithRelations,
  TreeStructure,
  TreeState,
  
  // Configuration types
  TreeConfig,
  TreeDisplayOptions,
  TreeSearchConfig,
  TreeSearchResult,
  SearchMatch,
  
  // Event types
  TreeEventHandlers,
  TreeAction,
  TreeContextMenu,
  
  // Component prop types
  TreeNavigationProps,
  TreeSearchProps,
  TreeRendererProps,
  TreeFooterProps,
  TreeMultiSelectProps,
  
  // Utility types
  TreeLoadingState,
  TreePerformanceMetrics,
  TreeKeyboardNavigation,
  TreeDragAndDrop
} from './tree-types';

export { TreeMode } from './tree-types'; 