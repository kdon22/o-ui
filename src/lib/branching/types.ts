/**
 * Unified Branching Types
 * 
 * Single source of truth for all branching-related types
 * Consolidates old fragmented type system into coherent interfaces
 */

// ============================================================================
// CORE BRANCH TYPES
// ============================================================================

export interface Branch {
  id: string;                    // Database ID
  name: string;                  // User-friendly name (what users see)
  description?: string;
  tenantId: string;
  isDefault: boolean;
  isLocked?: boolean;
  lockedById?: string;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;

  // Branch Statistics (for panel display)
  lastActivityAt?: Date;         // Last change in this branch
  lastActivityById?: string;     // Who made last change
  changeCount?: number;          // Number of changes ahead of default
  collaboratorIds?: string[];    // Active users in this branch
}

export interface BranchContext {
  currentBranchId: string;       // Active branch ID
  defaultBranchId: string;       // Fallback branch (usually 'main')
  availableBranches: Branch[];   // User's accessible branches
  tenantId: string;
  userId: string;
}

export interface BranchState {
  currentBranch: Branch | null;
  defaultBranch: Branch | null;
  availableBranches: Branch[];
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
}

// ============================================================================
// BRANCH OPERATIONS
// ============================================================================

export interface CreateBranchInput {
  name: string;
  description?: string;
  // Removed sourceBranchId and copyData - not supported by current Prisma schema
}

export interface UpdateBranchInput {
  id: string;
  name?: string;
  description?: string;
  isLocked?: boolean;
}

export interface DeleteBranchInput {
  id: string;
  force?: boolean;               // Force delete even if has changes
}

export interface SwitchBranchInput {
  branchId: string;
  invalidateCache?: boolean;     // Whether to clear cache on switch
}

// ============================================================================
// BRANCH COMPARISON & MERGING
// ============================================================================

export interface BranchDiff {
  sourceBranch: Branch;
  targetBranch: Branch;
  summary: DiffSummary;
  entities: EntityDiff[];
  conflicts: DiffConflict[];
}

export interface DiffSummary {
  totalChanges: number;
  added: number;
  modified: number;
  deleted: number;
  conflicts: number;
}

export interface EntityDiff {
  entityType: string;            // 'node', 'rule', 'process', etc.
  entityId: string;
  entityName?: string;
  changeType: 'ADDED' | 'MODIFIED' | 'DELETED';
  hasConflicts: boolean;
  changes: FieldDiff[];
}

export interface FieldDiff {
  field: string;
  oldValue: any;
  newValue: any;
  conflictType?: 'VALUE' | 'TYPE' | 'RELATIONSHIP';
}

export interface DiffConflict {
  entityType: string;
  entityId: string;
  field: string;
  sourceValue: any;
  targetValue: any;
  conflictType: 'VALUE' | 'TYPE' | 'RELATIONSHIP';
  resolution?: 'SOURCE' | 'TARGET' | 'MANUAL';
}

export interface MergeRequest {
  id: string;
  sourceBranchId: string;
  targetBranchId: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'APPROVED' | 'REJECTED' | 'MERGED' | 'CLOSED';
  conflicts: DiffConflict[];
  createdAt: Date;
  createdById: string;
}

export interface MergeResult {
  success: boolean;
  mergeId?: string;
  conflicts?: DiffConflict[];
  mergedEntities?: string[];
  error?: string;
}

// ============================================================================
// BRANCH INDICATORS & STATUS
// ============================================================================

export interface BranchStatus {
  branchId: string;
  isAhead: boolean;              // Has changes not in default branch
  isBehind: boolean;             // Missing changes from default branch
  aheadCount: number;            // Number of commits ahead
  behindCount: number;           // Number of commits behind
  hasLocalChanges: boolean;      // Has uncommitted changes
  lastSync?: Date;
}

export interface BranchActivity {
  branchId: string;
  recentChanges: EntityChange[];
  activeUsers: string[];         // Users currently working on this branch
  lastActivity: Date;
}

export interface EntityChange {
  entityType: string;
  entityId: string;
  entityName?: string;
  changeType: 'CREATED' | 'UPDATED' | 'DELETED';
  changedAt: Date;
  changedBy: string;
  summary?: string;
}

// ============================================================================
// BRANCH UI TYPES
// ============================================================================

export interface BranchDisplayOptions {
  showDescription?: boolean;
  showStatus?: boolean;
  showActivity?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export interface BranchActionHandlers {
  onSwitch?: (branchId: string) => void;
  onCreate?: (input: CreateBranchInput) => void;
  onUpdate?: (input: UpdateBranchInput) => void;
  onDelete?: (input: DeleteBranchInput) => void;
  onMerge?: (sourceBranchId: string, targetBranchId: string) => void;
  onCompare?: (sourceBranchId: string, targetBranchId: string) => void;
}

export interface BranchUIState {
  selectedBranches: string[];    // For multi-select operations
  showCreateForm: boolean;
  showMergeDialog: boolean;
  showCompareView: boolean;
  showManagementPanel: boolean;
}

// ============================================================================
// BRANCH EVENTS
// ============================================================================

export type BranchEvent = 
  | { type: 'BRANCH_SWITCHED'; branchId: string }
  | { type: 'BRANCH_CREATED'; branch: Branch }
  | { type: 'BRANCH_UPDATED'; branch: Branch }
  | { type: 'BRANCH_DELETED'; branchId: string }
  | { type: 'BRANCH_MERGED'; sourceBranchId: string; targetBranchId: string }
  | { type: 'BRANCHES_COMPARED'; sourceBranchId: string; targetBranchId: string; diff: BranchDiff };

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isBranch = (obj: any): obj is Branch => {
  return obj && 
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.tenantId === 'string' &&
    typeof obj.isDefault === 'boolean';
};

export const isBranchContext = (obj: any): obj is BranchContext => {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.currentBranchId === 'string' &&
    typeof obj.defaultBranchId === 'string' &&
    Array.isArray(obj.availableBranches) &&
    typeof obj.tenantId === 'string' &&
    typeof obj.userId === 'string';
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type BranchSortField = 'name' | 'createdAt' | 'updatedAt' | 'isDefault';
export type BranchSortDirection = 'asc' | 'desc';

export interface BranchListOptions {
  sortBy?: BranchSortField;
  sortDirection?: BranchSortDirection;
  filterBy?: {
    isDefault?: boolean;
    isLocked?: boolean;
    hasChanges?: boolean;
    createdBy?: string;
  };
  limit?: number;
  offset?: number;
}

export interface BranchSearchOptions {
  query: string;
  searchFields?: ('name' | 'description')[];
  includeDeleted?: boolean;
}