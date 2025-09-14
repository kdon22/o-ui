/**
 * Session Client Hooks - Minimal Implementation
 */

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import type { SessionData } from './types';

export function useSessionData(): SessionData {
  const { data: session, status } = useSession();
  
  return useMemo(() => {
    const isLoading = status === 'loading';
    const isAuthenticated = !!session?.user;
    const sessionValid = isAuthenticated && !!session.user.tenantId;

    if (!sessionValid) {
      return {
        userId: null,
        tenantId: null,
        branchContext: null,
        navigationContext: {
          rootNodeId: null,
          rootNodeIdShort: null,
          lastSelectedNodeId: null,
          lastSelectedNodeIdShort: null,
          workspaceStructure: null,
        },
        userContext: {
          preferences: null,
          permissions: null,
          currentTenant: null,
          userTenants: [],
          dataLastSync: null,
          cacheVersion: null,
        },
        isAuthenticated: false,
        isLoading,
        sessionValid: false,
        session: null,
      };
    }

    return {
      userId: session.user.id,
      tenantId: session.user.tenantId,
      branchContext: session.user.branchContext,
      navigationContext: {
        rootNodeId: session.user.rootNodeId,
        rootNodeIdShort: session.user.rootNodeIdShort,
        lastSelectedNodeId: session.user.preferences?.lastAccessedNodeId || null,
        lastSelectedNodeIdShort: session.user.preferences?.lastAccessedNodeIdShort || null,
        workspaceStructure: session.user.workspaceStructure,
      },
      userContext: {
        preferences: session.user.preferences,
        permissions: session.user.permissions,
        currentTenant: session.user.currentTenant,
        userTenants: session.user.userTenants || [],
        dataLastSync: session.user.dataLastSync,
        cacheVersion: session.user.cacheVersion,
      },
      isAuthenticated: true,
      isLoading: false,
      sessionValid: true,
      session,
    };
  }, [session, status]);
}

// ============================================================================
// DELETED: useBranchContext - FORCE MIGRATION TO ENTERPRISE HOOK
// ============================================================================
// 
// This hook has been intentionally removed to force migration to the 
// enterprise useEnterpriseSession hook which properly handles SSR and
// uses branch.id (not branch.name) with no fallback defaults.
//
// Replace usage with: const { branchContext } = useEnterpriseSession()
// ============================================================================

export function useTenantId(): string | null {
  const { tenantId, sessionValid, isLoading } = useSessionData();
  
  // Return null during loading or if not authenticated
  if (isLoading || !sessionValid || !tenantId) {
    return null;
  }
  
  return tenantId;
}

export function useNavigationContext() {
  const { navigationContext } = useSessionData();
  return navigationContext;
}

export function useLastSelectedNode() {
  const { navigationContext } = useSessionData();
  return {
    nodeId: navigationContext.lastSelectedNodeId,
    nodeIdShort: navigationContext.lastSelectedNodeIdShort,
    isAvailable: !!navigationContext.lastSelectedNodeId,
  };
}

export function useIsSessionReady(): boolean {
  const { sessionValid, branchContext } = useSessionData();
  return sessionValid && !!branchContext;
}

export function useAuth() {
  const sessionData = useSessionData();
  const { data: session, update } = useSession();
  
  return {
    user: session?.user || null,
    isAuthenticated: sessionData.isAuthenticated,
    isLoading: sessionData.isLoading,
    currentTenant: sessionData.userContext.currentTenant,
    tenantId: sessionData.tenantId,
    rootNodeId: sessionData.navigationContext.rootNodeId,
    updateSession: update,
    permissions: sessionData.userContext.permissions,
    hasAccess: () => true, // Simplified
  };
}

export function useUserPreferences() {
  const { userContext } = useSessionData();
  return userContext.preferences || {};
}

export function useUserPermissions() {
  const { userContext } = useSessionData();
  return userContext.permissions || {};
}

export function useCurrentTenant() {
  const { userContext } = useSessionData();
  return userContext.currentTenant;
} 