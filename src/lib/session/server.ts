/**
 * Enterprise Session - Server-side Utilities
 * 
 * Server-side session management for API routes, server actions, and SSR.
 * Provides the same SessionData interface as client-side hooks.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import type { 
  SessionData, 
  ExtendedSession, 
  ServerSessionContext,
  NavigationContext,
  UserContext,
  SessionOptions
} from './types';
import type { BranchContext } from '@/lib/resource-system/schemas';
import type { NextRequest } from 'next/server';

/**
 * Get comprehensive session data on the server
 * 
 * @param options - Session retrieval options
 * @returns Complete session data matching client interface
 */
export async function getServerSessionData(options: SessionOptions = {}): Promise<SessionData> {
  const { required = false } = options;
  
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    
    if (!session && required) {
      throw new Error('Session required but not found');
    }
    
    if (!session) {
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
        isLoading: false,
        sessionValid: false,
        session: null,
      };
    }

    const sessionValid = !!session.user?.tenantId;

    // Extract core identity
    const userId = session.user.id;
    const tenantId = session.user.tenantId;

    // Extract branch context (for ActionClient compound keys)
    const branchContext: BranchContext | null = session.user.branchContext ? {
      currentBranchId: session.user.branchContext.currentBranchId,
      defaultBranchId: session.user.branchContext.defaultBranchId,
      tenantId: tenantId!,
      userId,
    } : null;

    // Extract navigation context (includes lastSelectedNode)
    const navigationContext: NavigationContext = {
      rootNodeId: session.user.rootNodeId,
      rootNodeIdShort: session.user.rootNodeIdShort,
      lastSelectedNodeId: session.user.preferences?.lastAccessedNodeId || null,
      lastSelectedNodeIdShort: session.user.preferences?.lastAccessedNodeIdShort || null,
      workspaceStructure: session.user.workspaceStructure || null,
    };

    // Extract user context
    const userContext: UserContext = {
      preferences: session.user.preferences || null,
      permissions: session.user.permissions || null,
      currentTenant: session.user.currentTenant || null,
      userTenants: session.user.userTenants || [],
      dataLastSync: session.user.dataLastSync || null,
      cacheVersion: session.user.cacheVersion || null,
    };

    return {
      userId,
      tenantId,
      branchContext,
      navigationContext,
      userContext,
      isAuthenticated: true,
      isLoading: false,
      sessionValid,
      session: options.includeRaw ? session : null,
    };
    
  } catch (error) {
    
    
    if (required) {
      throw error;
    }
    
    // Return safe empty state
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
      isLoading: false,
      sessionValid: false,
      session: null,
    };
  }
}

/**
 * Get server auth context for API routes
 * Simplified version for common API use cases
 * 
 * @param request - Optional NextRequest for additional context
 * @returns Server session context
 */
export async function getServerAuth(request?: NextRequest): Promise<ServerSessionContext> {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    
    if (!session) {
      return {
        session: null,
        userId: null,
        tenantId: null,
        branchContext: null,
        isAuthenticated: false,
      };
    }

    const userId = session.user.id;
    const tenantId = session.user.tenantId; // 🔒 SECURITY: Only from session, never from headers

    const branchContext: BranchContext | null = session.user.branchContext ? {
      currentBranchId: session.user.branchContext.currentBranchId,
      defaultBranchId: session.user.branchContext.defaultBranchId,
      tenantId: tenantId!,
      userId,
    } : null;

    return {
      session,
      userId,
      tenantId,
      branchContext,
      isAuthenticated: true,
    };
    
  } catch (error) {
    
    return {
      session: null,
      userId: null,
      tenantId: null,
      branchContext: null,
      isAuthenticated: false,
    };
  }
}

/**
 * Require authentication for server-side operations
 * Throws error if not authenticated
 * 
 * @returns Guaranteed authenticated session context
 */
export async function requireServerAuth(): Promise<Required<ServerSessionContext>> {
  const auth = await getServerAuth();
  
  if (!auth.isAuthenticated || !auth.userId || !auth.tenantId) {
    throw new Error('Authentication required');
  }
  
  return auth as Required<ServerSessionContext>;
}

/**
 * Get tenant ID from server context with fallbacks
 * 
 * @param request - NextRequest for header fallback
 * @returns Tenant ID or throws error
 */
export async function getServerTenantId(request?: NextRequest): Promise<string> {
  const auth = await getServerAuth(request);
  
  if (!auth.tenantId) {
    throw new Error('Tenant ID not available');
  }
  
  return auth.tenantId;
}

/**
 * Get branch context from server session
 * 
 * @returns Branch context or null
 */
export async function getServerBranchContext(): Promise<BranchContext | null> {
  const auth = await getServerAuth();
  return auth.branchContext;
}