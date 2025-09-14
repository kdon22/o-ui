/**
 * Node Types - Generated from SSOT Schema
 * 
 * TypeScript interfaces that mirror the Node SSOT schema
 * providing type safety for the entire node system.
 */

import type { BranchContext } from '@/lib/resource-system/schemas';

// ============================================================================
// CORE NODE ENTITY
// ============================================================================

export interface NodeEntity {
  // Core Identity
  id: string;
  idShort: string;
  originalNodeId?: string;

  // Branching Fields
  tenantId: string;
  branchId: string;
  defaultBranchId: string;

  // Primary Business Fields
  name: string;
  description?: string;
  type: 'NODE' | 'CUSTOMER';
  overrideKey?: string;
  isActive: boolean;

  // Tree Hierarchy
  parentId?: string;
  level: number;
  sortOrder: number;
  childCount: number;

  // Rule Management
  ruleIgnores?: string[];

  // Audit Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  version: number;

  // Computed Tree Fields (Performance Optimization)
  path?: string;
  ancestorIds?: string[];
  isLeaf?: boolean;
  isRoot?: boolean;

  // Cache Optimization Fields
  _cached?: boolean;
  _optimistic?: boolean;

  // Related Data (populated via relationships)
  children?: NodeEntity[];
  parent?: NodeEntity;
  processes?: ProcessReference[];
  workflows?: WorkflowReference[];
  offices?: OfficeReference[];
  ignoredRules?: RuleReference[];
}

// ============================================================================
// REFERENCE TYPES (for relationships)
// ============================================================================

export interface ProcessReference {
  id: string;
  name: string;
  isActive: boolean;
}

export interface WorkflowReference {
  id: string;
  name: string;
  sequence?: number;
}

export interface OfficeReference {
  id: string;
  name: string;
  location?: string;
}

export interface RuleReference {
  id: string;
  name: string;
  type: string;
}

// ============================================================================
// CRUD OPERATION TYPES
// ============================================================================

export interface CreateNodeInput {
  name: string;
  description?: string;
  type: 'NODE' | 'CUSTOMER';
  overrideKey?: string;
  isActive?: boolean;
  parentId?: string;
  sortOrder?: number;
  ruleIgnores?: string[];
  
  // Relationship data
  relationships?: {
    processes?: {
      connect?: Array<{ id: string; [key: string]: any }>;
    };
    workflows?: {
      connect?: Array<{ id: string; sequence?: number }>;
    };
    offices?: {
      connect?: Array<{ id: string; [key: string]: any }>;
    };
    ignoredRules?: {
      connect?: Array<{ id: string; [key: string]: any }>;
    };
  };
}

export interface UpdateNodeInput {
  name?: string;
  description?: string;
  type?: 'NODE' | 'CUSTOMER';
  overrideKey?: string;
  isActive?: boolean;
  parentId?: string;
  sortOrder?: number;
  ruleIgnores?: string[];
  
  // Relationship updates
  relationships?: {
    processes?: {
      connect?: Array<{ id: string; [key: string]: any }>;
      disconnect?: Array<{ id: string }>;
      update?: Array<{ id: string; [key: string]: any }>;
    };
    workflows?: {
      connect?: Array<{ id: string; sequence?: number }>;
      disconnect?: Array<{ id: string }>;
      update?: Array<{ id: string; sequence?: number }>;
    };
    offices?: {
      connect?: Array<{ id: string; [key: string]: any }>;
      disconnect?: Array<{ id: string }>;
    };
    ignoredRules?: {
      connect?: Array<{ id: string; [key: string]: any }>;
      disconnect?: Array<{ id: string }>;
    };
  };
}

export interface DeleteNodeInput {
  id: string;
  force?: boolean; // Force delete even if has children
}

// ============================================================================
// TREE OPERATION TYPES
// ============================================================================

export interface MoveNodeInput {
  id: string;
  newParentId?: string;
  newSortOrder?: number;
}

export interface CopyNodeInput {
  id: string;
  newParentId?: string;
  newName?: string;
  includeChildren?: boolean;
}

// ============================================================================
// BRANCHING OPERATION TYPES
// ============================================================================

export interface NodeBranchContext extends BranchContext {
  nodeId?: string; // Specific node context for operations
}

export interface CreateBranchFromNodeInput {
  nodeId: string;
  branchName: string;
  description?: string;
}

export interface MergeNodeChangesInput {
  sourceBranchId: string;
  targetBranchId: string;
  nodeIds?: string[]; // Specific nodes to merge, or all if undefined
  conflictResolution?: 'source' | 'target' | 'manual';
}

export interface CompareNodeBranchesInput {
  nodeId: string;
  sourceBranchId: string;
  targetBranchId: string;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface NodeQueryOptions {
  parentId?: string;
  type?: 'NODE' | 'CUSTOMER';
  isActive?: boolean;
  search?: string;
  level?: number;
  includeChildren?: boolean;
  maxDepth?: number;
  
  // Pagination
  limit?: number;
  offset?: number;
  
  // Sorting
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
  
  // Filtering
  filters?: {
    hasProcesses?: boolean;
    hasWorkflows?: boolean;
    hasOffices?: boolean;
    createdAfter?: Date;
    updatedAfter?: Date;
  };
}

export interface TreeQueryOptions extends NodeQueryOptions {
  rootId?: string;
  expandedNodeIds?: string[];
  collapsedNodeIds?: string[];
}

// ============================================================================
// TREE STATE TYPES
// ============================================================================

export interface TreeState {
  nodes: Record<string, NodeEntity>;
  expandedNodeIds: Set<string>;
  selectedNodeId?: string;
  hoveredNodeId?: string;
  loadingNodeIds: Set<string>;
  errorNodeIds: Set<string>;
}

export interface TreeAction {
  type: 'LOAD_NODES' | 'EXPAND_NODE' | 'COLLAPSE_NODE' | 'SELECT_NODE' | 'HOVER_NODE' | 'SET_LOADING' | 'SET_ERROR';
  payload: any;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface NodeListResponse {
  nodes: NodeEntity[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

export interface TreeResponse {
  root: NodeEntity;
  nodes: NodeEntity[];
  expandedPaths: string[];
  totalCount: number;
}

export interface NodeHistoryResponse {
  versions: Array<{
    id: string;
    version: number;
    changes: Record<string, any>;
    createdAt: Date;
    createdBy: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE';
  }>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type NodeField = keyof NodeEntity;
export type NodeOperationType = 'create' | 'update' | 'delete' | 'move' | 'copy';
export type NodePermission = 'read' | 'create' | 'update' | 'delete' | 'move' | 'copy' | 'history' | 'branch';

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Main exports already typed above
}; 