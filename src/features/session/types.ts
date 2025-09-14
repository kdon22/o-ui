/**
 * Session Types - ActionClient Integration
 * 
 * Type definitions for session management through ActionClient
 */

// ============================================================================
// CORE SESSION ENTITY
// ============================================================================

export interface SessionEntity {
  // Primary identifiers
  id: string;
  userId: string;
  tenantId: string;
  branchId: string;

  // Branch context (core data for switching)
  currentBranchId: string;
  defaultBranchId: string;

  // Navigation context
  rootNodeId?: string | null;
  lastSelectedNodeId?: string | null;
  rootNodeIdShort?: string | null;
  lastSelectedNodeIdShort?: string | null;
  workspaceStructure?: any;

  // User context
  preferences?: any;
  permissions?: any;
  currentTenant?: any;
  userTenants?: any[];

  // Data sync tracking  
  dataLastSync?: string | null;
  cacheVersion?: string | null;

  // Session metadata
  expiresAt?: string | null;
  lastActivity?: string | null;

  // Standard entity fields
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
}

// ============================================================================
// ACTION PAYLOADS
// ============================================================================

export interface UpdateBranchPayload {
  branchId: string;
  branchName?: string; // Optional for logging/debugging
}

export interface RefreshContextPayload {
  forceRefresh?: boolean;
}

export interface CreateSessionPayload {
  userId: string;
  currentBranchId: string;
  defaultBranchId: string;
  rootNodeId?: string;
  preferences?: any;
  permissions?: any;
}

export interface UpdateSessionPayload {
  currentBranchId?: string;
  lastSelectedNodeId?: string;
  preferences?: any;
  dataLastSync?: string;
  cacheVersion?: string;
}

// ============================================================================
// BRANCH CONTEXT TYPES
// ============================================================================

export interface BranchContext {
  currentBranchId: string;
  defaultBranchId: string;
  tenantId: string;
  userId: string;
}

export interface SessionBranchData {
  currentBranch: {
    id: string;
    name: string;
    description?: string;
  } | null;
  defaultBranch: {
    id: string;
    name: string;
    description?: string;
  } | null;
  availableBranches: Array<{
    id: string;
    name: string;
    description?: string;
    isDefault?: boolean;
  }>;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface SessionUIState {
  isLoading: boolean;
  isSwitching: boolean;
  error: string | null;
  lastSwitchTime: number | null;
}

// ============================================================================
// ACTION CLIENT INTEGRATION TYPES
// ============================================================================

export interface SessionActionContext {
  userId: string;
  tenantId: string;
  sessionId?: string;
}

export interface SessionOptimisticUpdate {
  type: 'branch_switch' | 'preference_update' | 'navigation_update';
  payload: any;
  timestamp: number;
}

// ============================================================================
// COMPATIBILITY TYPES (for gradual migration)
// ============================================================================

export interface LegacySessionData {
  userId: string | null;
  tenantId: string | null;
  branchContext: BranchContext | null;
  navigationContext: any;
  userContext: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionValid: boolean;
  session: any;
}