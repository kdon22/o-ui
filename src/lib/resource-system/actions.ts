/**
 * SSOT Action System - Standard Action Types and Interfaces
 * 
 * Defines the standard action types used throughout the system:
 * - Standard CRUD operations
 * - Tree-specific operations
 * - Custom action definitions
 * - Action context and payloads
 */

import type { 
  ActionType, 
  ActionRequest, 
  ActionResponse, 
  QueryOptions, 
  MutationContext 
} from './schemas';

// ============================================================================
// STANDARD CRUD ACTIONS
// ============================================================================

export const STANDARD_ACTIONS = {
  // Read operations
  LIST: 'list' as const,
  GET: 'get' as const,
  
  // Write operations  
  CREATE: 'create' as const,
  UPDATE: 'update' as const,
  DELETE: 'delete' as const,
  
  // Bulk operations
  BULK_CREATE: 'bulkCreate' as const,
  BULK_UPDATE: 'bulkUpdate' as const,
  BULK_DELETE: 'bulkDelete' as const,
  
  // Special operations
  DUPLICATE: 'duplicate' as const,
  RESTORE: 'restore' as const
} as const;

export type StandardAction = typeof STANDARD_ACTIONS[keyof typeof STANDARD_ACTIONS];

// ============================================================================
// TREE-SPECIFIC ACTIONS
// ============================================================================

export const TREE_ACTIONS = {
  // Tree operations
  TREE: 'tree' as const,           // Get full tree from root
  CHILDREN: 'children' as const,   // Get immediate children
  ANCESTORS: 'ancestors' as const, // Get parent hierarchy
  
  // Tree mutations
  MOVE: 'move' as const,           // Move node to new parent
  REORDER: 'reorder' as const,     // Change sort order
  
  // Expansion state
  EXPAND: 'expand' as const,       // Expand node
  COLLAPSE: 'collapse' as const,   // Collapse node
  EXPAND_ALL: 'expandAll' as const,
  COLLAPSE_ALL: 'collapseAll' as const
} as const;

export type TreeAction = typeof TREE_ACTIONS[keyof typeof TREE_ACTIONS];

// ============================================================================
// ACTION PAYLOADS
// ============================================================================

// Create operation payload
export interface CreateActionPayload {
  data: Record<string, any>;
  relationships?: Record<string, any>;
  options?: {
    validate?: boolean;
    skipHooks?: boolean;
    returnRelations?: boolean;
  };
}

// Update operation payload
export interface UpdateActionPayload {
  id: string;
  data: Record<string, any>;
  relationships?: Record<string, any>;
  options?: {
    validate?: boolean;
    skipHooks?: boolean;
    returnRelations?: boolean;
    merge?: boolean; // For partial updates
  };
}

// Delete operation payload
export interface DeleteActionPayload {
  id: string;
  options?: {
    cascade?: boolean;
    soft?: boolean;
    skipHooks?: boolean;
  };
}

// List operation payload
export interface ListActionPayload {
  filters?: Record<string, any>;
  search?: string;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    limit: number;
    offset: number;
  };
  include?: string[]; // Relations to include
}

// Tree operation payloads
export interface TreeActionPayload {
  rootId: string;
  maxDepth?: number;
  include?: string[];
  expandedIds?: string[];
}

export interface MoveActionPayload {
  id: string;
  newParentId: string;
  position?: number; // Insert position among siblings
}

export interface ReorderActionPayload {
  parentId: string;
  childIds: string[]; // New order of child IDs
}

// ============================================================================
// ACTION BUILDERS
// ============================================================================

export class ActionBuilder {
  private resourcePrefix: string;
  
  constructor(resourcePrefix: string) {
    this.resourcePrefix = resourcePrefix;
  }
  
  // Standard CRUD action builders
  list(payload?: ListActionPayload): ActionRequest {
    return {
      action: `${this.resourcePrefix}.${STANDARD_ACTIONS.LIST}`,
      data: payload,
      options: payload ? {
        filters: payload.filters,
        search: payload.search,
        sort: payload.sort ? {
          field: payload.sort.field,
          direction: payload.sort.order
        } : undefined,
        limit: payload.pagination?.limit,
        offset: payload.pagination?.offset,
        include: payload.include
      } : undefined
    };
  }
  
  get(id: string, include?: string[]): ActionRequest {
    return {
      action: `${this.resourcePrefix}.${STANDARD_ACTIONS.GET}`,
      data: { id },
      options: include ? { include } : undefined
    };
  }
  
  create(payload: CreateActionPayload): ActionRequest {
    return {
      action: `${this.resourcePrefix}.${STANDARD_ACTIONS.CREATE}`,
      data: payload
    };
  }
  
  update(payload: UpdateActionPayload): ActionRequest {
    return {
      action: `${this.resourcePrefix}.${STANDARD_ACTIONS.UPDATE}`,
      data: payload
    };
  }
  
  delete(payload: DeleteActionPayload): ActionRequest {
    return {
      action: `${this.resourcePrefix}.${STANDARD_ACTIONS.DELETE}`,
      data: payload
    };
  }
  
  // Tree-specific action builders
  tree(payload: TreeActionPayload): ActionRequest {
    return {
      action: `${this.resourcePrefix}.${TREE_ACTIONS.TREE}`,
      data: payload
    };
  }
  
  children(parentId: string, include?: string[]): ActionRequest {
    return {
      action: `${this.resourcePrefix}.${TREE_ACTIONS.CHILDREN}`,
      data: { parentId },
      options: include ? { include } : undefined
    };
  }
  
  move(payload: MoveActionPayload): ActionRequest {
    return {
      action: `${this.resourcePrefix}.${TREE_ACTIONS.MOVE}`,
      data: payload
    };
  }
  
  reorder(payload: ReorderActionPayload): ActionRequest {
    return {
      action: `${this.resourcePrefix}.${TREE_ACTIONS.REORDER}`,
      data: payload
    };
  }
  
  // Custom action builder
  custom(actionId: string, data?: any, options?: QueryOptions): ActionRequest {
    return {
      action: `${this.resourcePrefix}.${actionId}`,
      data,
      options
    };
  }
}

// ============================================================================
// ACTION CONTEXT UTILITIES
// ============================================================================

export function createMutationContext(
  userId: string,
  tenantId: string,
  currentBranchId: string,
  defaultBranchId: string,
  branchId?: string
): MutationContext {
  return {
    userId,
    tenantId,
    currentBranchId,
    defaultBranchId,
    branchId,
    timestamp: Date.now()
  };
}

export function addContextToAction(
  action: ActionRequest,
  context: MutationContext
): ActionRequest {
  return {
    ...action,
    context
  };
}

// ============================================================================
// ACTION VALIDATION
// ============================================================================

export interface ActionValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  validator?: (value: any) => boolean | string;
}

export interface ActionValidationSchema {
  [actionName: string]: ActionValidationRule[];
}

export function validateActionPayload(
  action: string,
  payload: any,
  schema: ActionValidationSchema
): { valid: boolean; errors: string[] } {
  const rules = schema[action];
  if (!rules) {
    return { valid: true, errors: [] };
  }
  
  const errors: string[] = [];
  
  for (const rule of rules) {
    const value = payload?.[rule.field];
    
    // Check required
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`Field '${rule.field}' is required`);
      continue;
    }
    
    // Skip further validation if value is empty and not required
    if (value === undefined || value === null) {
      continue;
    }
    
    // Check type
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push(`Field '${rule.field}' must be of type ${rule.type}`);
        continue;
      }
    }
    
    // Custom validation
    if (rule.validator) {
      const result = rule.validator(value);
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `Field '${rule.field}' is invalid`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// ACTION RESPONSE UTILITIES
// ============================================================================

export function createSuccessResponse<T>(
  action: string,
  data: T,
  cached = false
): ActionResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now(),
    action,
    cached
  };
}

export function createErrorResponse(
  action: string,
  error: string
): ActionResponse {
  return {
    success: false,
    error,
    timestamp: Date.now(),
    action
  };
}

// ============================================================================
// ACTION BATCH PROCESSING
// ============================================================================

export interface BatchAction {
  id: string; // Unique identifier for this action in the batch
  action: ActionRequest;
  dependsOn?: string[]; // IDs of actions this depends on
}

export interface BatchResult {
  success: boolean;
  results: Record<string, ActionResponse>;
  errors: string[];
  executionOrder: string[];
}

export function createActionBatch(actions: BatchAction[]): BatchAction[] {
  // Validate dependencies exist
  const actionIds = new Set(actions.map(a => a.id));
  
  for (const action of actions) {
    if (action.dependsOn) {
      for (const depId of action.dependsOn) {
        if (!actionIds.has(depId)) {
          throw new Error(`Action '${action.id}' depends on '${depId}' which is not in the batch`);
        }
      }
    }
  }
  
  return actions;
}

export function sortActionsByDependencies(actions: BatchAction[]): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  
  function visit(actionId: string) {
    if (visiting.has(actionId)) {
      throw new Error(`Circular dependency detected involving action '${actionId}'`);
    }
    
    if (visited.has(actionId)) {
      return;
    }
    
    visiting.add(actionId);
    
    const action = actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action '${actionId}' not found`);
    }
    
    // Visit dependencies first
    if (action.dependsOn) {
      for (const depId of action.dependsOn) {
        visit(depId);
      }
    }
    
    visiting.delete(actionId);
    visited.add(actionId);
    sorted.push(actionId);
  }
  
  // Visit all actions
  for (const action of actions) {
    visit(action.id);
  }
  
  return sorted;
}

// All exports are already declared above with export keyword 