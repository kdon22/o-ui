/**
 * Session Types - Single Source of Truth
 * 
 * All session-related types centralized here for enterprise consistency
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export interface BranchContext {
  readonly currentBranchId: string;
  readonly defaultBranchId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly isReady: true;
}

export interface NavigationContext {
  readonly rootNodeId: string | null;
  readonly rootNodeIdShort: string | null;
  readonly lastSelectedNodeId: string | null;
  readonly lastSelectedNodeIdShort: string | null;
  readonly workspaceStructure: WorkspaceStructure | null;
  readonly currentPath?: string;
}

export interface UserPreferences {
  readonly theme: 'light' | 'dark' | 'system';
  readonly editorSettings: EditorSettings;
  readonly lastAccessedNodeId: string | null;
  readonly lastAccessedNodeIdShort: string | null;
  readonly language: string;
  readonly timezone: string;
  readonly [key: string]: any;
}

export interface UserPermissions {
  readonly role: string;
  readonly permissions: string[];
  readonly tenantPermissions: TenantPermission[];
  readonly canAccessBranches: boolean;
  readonly canManageUsers: boolean;
  readonly canManageSettings: boolean;
}

export interface AuthState {
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly userId: string | null;
  readonly userEmail: string | null;
  readonly tenantId: string | null;
}

// ============================================================================
// COMPOSED TYPES
// ============================================================================

export interface ActionClientContext {
  readonly tenantId: string;
  readonly branchContext: BranchContext;
  readonly isReady: boolean;
}

export interface CRUDContext {
  readonly tenantId: string;
  readonly currentBranchId: string;
  readonly parentNodeId: string | null;
  readonly userId: string;
  readonly isReady: boolean;
}

export interface FormContext {
  readonly tenantId: string;
  readonly currentBranchId: string;
  readonly defaultBranchId: string;
  readonly userId: string;
  readonly lastSelectedNodeId: string | null;
  readonly isReady: boolean;
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface WorkspaceStructure {
  readonly nodes: WorkspaceNode[];
  readonly totalCount: number;
  readonly lastUpdated: string;
}

export interface WorkspaceNode {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly level: number;
  readonly hasChildren: boolean;
}

export interface EditorSettings {
  readonly fontSize: number;
  readonly tabSize: number;
  readonly wordWrap: boolean;
  readonly minimap: boolean;
  readonly lineNumbers: boolean;
  readonly theme: string;
}

export interface TenantPermission {
  readonly tenantId: string;
  readonly role: string;
  readonly permissions: string[];
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface AuthHookReturn extends AuthState {
  readonly login: () => void;
  readonly logout: () => void;
  readonly updateSession: (data: any) => Promise<void>;
}

export interface BranchContextHookReturn {
  readonly currentBranchId: string;
  readonly defaultBranchId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly isReady: boolean;
  readonly switchBranch: (branchId: string) => Promise<void>;
  readonly isFeatureBranch: boolean;
}

export interface NavigationContextHookReturn extends NavigationContext {
  readonly updateLastSelectedNode: (nodeId: string) => Promise<void>;
  readonly clearLastSelectedNode: () => Promise<void>;
  readonly isReady: boolean;
}

export interface UserPreferencesHookReturn {
  readonly preferences: UserPreferences | null;
  readonly updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  readonly resetPreferences: () => Promise<void>;
  readonly isReady: boolean;
}

export interface PermissionsHookReturn {
  readonly permissions: UserPermissions | null;
  readonly hasPermission: (permission: string) => boolean;
  readonly canAccessResource: (resource: string, action: string) => boolean;
  readonly userRole: string | null;
  readonly isReady: boolean;
}