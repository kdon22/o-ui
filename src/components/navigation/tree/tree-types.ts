/**
 * Tree Navigation System Types
 * 
 * Comprehensive TypeScript types for the schema-driven tree navigation
 * system. These types support both navigation and multi-select modes.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// CORE NODE TYPES
// ============================================================================

/**
 * Base tree node interface - represents any item in the tree
 */
export interface TreeNode {
  id: string;
  name: string;
  parentId?: string | null;
  level: number;
  path: string;
  sortOrder: number;
  childCount: number;
  isActive: boolean;
  type: 'NODE' | 'CUSTOMER' | string;
  icon?: string;
  color?: string;
  description?: string;
  metadata?: Record<string, any>;
  
  // Tree-specific fields
  isExpanded?: boolean;
  isLoading?: boolean;
  isSelected?: boolean;
  isVisible?: boolean;
  
  // Relationship data
  children?: TreeNode[];
  parent?: TreeNode | null;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tree node with full relationship data loaded
 */
export interface TreeNodeWithRelations extends TreeNode {
  processes?: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
  rules?: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
  offices?: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
  workflows?: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
}

// ============================================================================
// TREE STRUCTURE TYPES
// ============================================================================

/**
 * Tree structure with nested children
 */
export interface TreeStructure {
  nodes: TreeNode[];
  rootNodes: TreeNode[];
  flatMap: Map<string, TreeNode>;
  hierarchy: Map<string, TreeNode[]>;
  maxLevel: number;
  totalCount: number;
}

/**
 * Tree state management
 */
export interface TreeState {
  expandedNodes: Set<string>;
  selectedNodes: Set<string>;
  loadingNodes: Set<string>;
  searchQuery: string;
  searchResults: TreeNode[];
  focusedNodeId: string | null;
  mode: TreeMode;
  multiSelectEnabled: boolean;
}

/**
 * Tree operation modes
 */
export enum TreeMode {
  NAVIGATION = 'navigation',
  MULTI_SELECT = 'multi-select',
  SEARCH = 'search'
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

/**
 * Search configuration
 */
export interface TreeSearchConfig {
  enabled: boolean;
  placeholder: string;
  fields: string[];
  fuzzySearch: boolean;
  minQueryLength: number;
  maxResults: number;
  highlightMatches: boolean;
  autoExpand: boolean;
}

/**
 * Search result with highlighting
 */
export interface TreeSearchResult {
  node: TreeNode;
  matches: SearchMatch[];
  score: number;
  path: TreeNode[];
}

/**
 * Search match highlighting
 */
export interface SearchMatch {
  field: string;
  value: string;
  highlights: Array<{
    start: number;
    end: number;
  }>;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Tree action definition
 */
export interface TreeAction {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  handler: string;
  shortcut?: string;
  disabled?: boolean;
  visible?: boolean;
  separator?: boolean;
  submenu?: TreeAction[];
}

/**
 * Context menu configuration
 */
export interface TreeContextMenu {
  enabled: boolean;
  actions: TreeAction[];
  position: { x: number; y: number } | null;
  targetNode: TreeNode | null;
  visible: boolean;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Tree event handlers
 */
export interface TreeEventHandlers {
  onNodeClick?: (node: TreeNode, event: MouseEvent) => void;
  onNodeDoubleClick?: (node: TreeNode, event: MouseEvent) => void;
  onNodeRightClick?: (node: TreeNode, event: MouseEvent) => void;
  onNodeExpand?: (node: TreeNode) => void;
  onNodeCollapse?: (node: TreeNode) => void;
  onNodeSelect?: (node: TreeNode, selected: boolean) => void;
  onNodeMove?: (node: TreeNode, newParent: TreeNode | null, newIndex: number) => void;
  onNodeDelete?: (node: TreeNode) => void;
  onNodeCreate?: (parent: TreeNode | null, data: Partial<TreeNode>) => void;
  onNodeUpdate?: (node: TreeNode, data: Partial<TreeNode>) => void;
  onSearch?: (query: string) => void;
  onModeChange?: (mode: TreeMode) => void;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Tree configuration derived from ResourceSchema
 */
export interface TreeConfig {
  schema: ResourceSchema;
  search: TreeSearchConfig;
  multiSelect: {
    enabled: boolean;
    max?: number;
    showCount: boolean;
    showActions: boolean;
  };
  virtualization: {
    enabled: boolean;
    itemHeight: number;
    overscan: number;
  };
  performance: {
    lazyLoad: boolean;
    chunkSize: number;
    cacheSize: number;
  };
  mobile: {
    swipeActions: boolean;
    touchFeedback: boolean;
    collapsible: boolean;
  };
}

/**
 * Tree display options
 */
export interface TreeDisplayOptions {
  showIcons: boolean;
  showBadges: boolean;
  showTooltips: boolean;
  showLines: boolean;
  showRoot: boolean;
  compactMode: boolean;
  indentSize: number;
  lineHeight: number;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Main tree navigation component props
 */
export interface TreeNavigationProps {
  className?: string;
  config?: Partial<TreeConfig>;
  displayOptions?: Partial<TreeDisplayOptions>;
  eventHandlers?: TreeEventHandlers;
  initialExpandedNodes?: string[];
  initialSelectedNodes?: string[];
  mode?: TreeMode;
  multiSelectEnabled?: boolean;
  searchEnabled?: boolean;
  footerEnabled?: boolean;
  height?: string | number;
  width?: string | number;
}

/**
 * Tree search component props
 */
export interface TreeSearchProps {
  config: TreeSearchConfig;
  query: string;
  results: TreeSearchResult[];
  loading: boolean;
  onSearch: (query: string) => void;
  onResultClick: (result: TreeSearchResult) => void;
  onClear: () => void;
  className?: string;
}

/**
 * Tree renderer component props
 */
export interface TreeRendererProps {
  nodes: TreeNode[];
  structure: TreeStructure;
  state: TreeState;
  config: TreeConfig;
  displayOptions: TreeDisplayOptions;
  eventHandlers: TreeEventHandlers;
  className?: string;
}

/**
 * Tree node component props
 */
export interface TreeNodeProps {
  node: TreeNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  isLoading: boolean;
  hasChildren: boolean;
  displayOptions: TreeDisplayOptions;
  eventHandlers: TreeEventHandlers;
  className?: string;
}

/**
 * Tree footer component props
 */
export interface TreeFooterProps {
  selectedCount: number;
  totalCount: number;
  mode: TreeMode;
  actions: TreeAction[];
  onModeChange: (mode: TreeMode) => void;
  onActionClick: (action: TreeAction) => void;
  className?: string;
}

/**
 * Tree multi-select component props
 */
export interface TreeMultiSelectProps {
  selectedNodes: TreeNode[];
  maxSelections?: number;
  showCount: boolean;
  showActions: boolean;
  actions: TreeAction[];
  onSelectionChange: (nodes: TreeNode[]) => void;
  onActionClick: (action: TreeAction, nodes: TreeNode[]) => void;
  onClear: () => void;
  className?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Tree loading state
 */
export interface TreeLoadingState {
  isLoading: boolean;
  loadingNodes: Set<string>;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Tree performance metrics
 */
export interface TreePerformanceMetrics {
  renderTime: number;
  searchTime: number;
  loadTime: number;
  nodeCount: number;
  visibleNodeCount: number;
  cacheHitRate: number;
}

/**
 * Tree keyboard navigation
 */
export interface TreeKeyboardNavigation {
  focusedNodeId: string | null;
  enableKeyboard: boolean;
  shortcuts: Record<string, () => void>;
}

/**
 * Tree drag and drop
 */
export interface TreeDragAndDrop {
  enabled: boolean;
  draggedNode: TreeNode | null;
  dropTarget: TreeNode | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
  canDrop: boolean;
}

// All types are exported via their individual export declarations above 