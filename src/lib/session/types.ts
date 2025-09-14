/**
 * Session Types - Basic definitions
 */

export interface SessionData {
  userId: string | null;
  tenantId: string | null;
  branchContext: any | null;
  navigationContext: any;
  userContext: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionValid: boolean;
  session: any;
}

export interface NavigationContext {
  rootNodeId: string | null;
  rootNodeIdShort: string | null;
  lastSelectedNodeId: string | null;
  lastSelectedNodeIdShort: string | null;
  workspaceStructure: any;
}

export interface UserContext {
  preferences: any;
  permissions: any;
  currentTenant: any;
  userTenants: any[];
  dataLastSync: string | null;
  cacheVersion: string | null;
}

export interface ExtendedSession {
  user: any;
} 