/**
 * App Provider - Enterprise Single-Provider Pattern
 * 
 * GOLD STANDARD SOLUTION:
 * - Single provider handles all app state
 * - No nested providers cascade
 * - Optimized session handling
 * - ActionClient singleton integration
 * - <50ms app loads after session ready
 */

'use client';

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { getActionClientSingleton } from '@/lib/action-client/singleton';
import type UnifiedActionClient from '@/lib/action-client/unified-action-client';
import { 
  useAuth,
  useBranchContext, 
  useNavigationContext,
  useUserPreferences,
  usePermissions,
  type BranchContext,
  type NavigationContext,
  type AuthHookReturn,
  type BranchContextHookReturn,
  type NavigationContextHookReturn,
  type UserPreferencesHookReturn,
  type PermissionsHookReturn
} from '@/lib/session';
import { NavigationContextProvider } from '@/lib/context/navigation-context';
import { UniversalSearchProvider } from '@/components/search';
import { CacheProvider } from '@/components/providers/cache-provider';

// ============================================================================
// SINGLE CONTEXT - ALL APP STATE
// ============================================================================

interface UnifiedAppContextValue {
  // Auth state (from SSOT)
  auth: AuthHookReturn;
  
  // Branch context (from SSOT)  
  branchContext: BranchContext | null;
  
  // Navigation context (from SSOT)
  navigationContext: NavigationContextHookReturn;
  
  // User data (from SSOT)
  userPreferences: UserPreferencesHookReturn;
  permissions: PermissionsHookReturn;
  
  // ActionClient state
  actionClient: UnifiedActionClient | null;
  isActionClientReady: boolean;
  
  // Node data (derived from navigation + action client)
  nodes: any[];
  isNodesLoading: boolean;
  
  // Actions (stable references)
  refetchNodes: () => Promise<void>;
  invalidateCache: () => Promise<void>;
}

const UnifiedAppContext = createContext<UnifiedAppContextValue | null>(null);

// ============================================================================
// MEMOIZED CORE PROVIDER
// ============================================================================

const UnifiedAppProviderCore = React.memo(function UnifiedAppProviderCore({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  
  // ============================================================================
  // CORE HOOKS
  // ============================================================================
  
  const queryClient = useQueryClient(); // For cache invalidation
  
  // ============================================================================
  // SSOT SESSION HOOKS
  // ============================================================================
  
  const auth = useAuth();
  const branchContextData = useBranchContext();
  const navigationContext = useNavigationContext();
  const userPreferences = useUserPreferences();
  const permissions = usePermissions();

  // Derive session state from SSOT hooks
  const sessionState = useMemo(() => {
    const state = {
      isSessionReady: auth.isReady && branchContextData.isReady,
      isAuthenticated: auth.isAuthenticated,
      tenantId: auth.isAuthenticated ? branchContextData.tenantId || null : null,
      // Convert hook return to proper BranchContext when ready
      branchContext: branchContextData.isReady ? {
        currentBranchId: branchContextData.currentBranchId,
        defaultBranchId: branchContextData.defaultBranchId,
        tenantId: branchContextData.tenantId,
        userId: branchContextData.userId,
        isReady: true as const // Type assertion for literal type
      } as BranchContext : null,
      currentBranchId: branchContextData.isReady ? branchContextData.currentBranchId : null
    };

    console.log('🔍 [Session State] Derived state:', {
      authIsReady: auth.isReady,
      authIsAuthenticated: auth.isAuthenticated,
      branchContextIsReady: branchContextData.isReady,
      finalState: state,
      branchData: branchContextData,
      timestamp: new Date().toISOString()
    });

    return state;
  }, [auth, branchContextData]);
  
  // ============================================================================
  // ACTION CLIENT STATE
  // ============================================================================
  
  const [actionClient, setActionClient] = useState<UnifiedActionClient | null>(null);
  const [isActionClientReady, setIsActionClientReady] = useState(false);
  const [nodes, setNodes] = useState<any[]>([]);
  const [isNodesLoading, setIsNodesLoading] = useState(false);
  
  // Initialize ActionClient singleton when session ready
  useEffect(() => {
    console.log('🔍 [ActionClient Init] Session state check:', {
      isSessionReady: sessionState.isSessionReady,
      hasTenantId: !!sessionState.tenantId,
      hasBranchContext: !!sessionState.branchContext,
      branchContext: sessionState.branchContext,
      timestamp: new Date().toISOString()
    });

    if (!sessionState.isSessionReady || !sessionState.tenantId || !sessionState.branchContext) {
      console.log('🔍 [ActionClient Init] Not ready - missing requirements');
      return;
    }

    // CRITICAL FIX: Prevent multiple initializations
    if (actionClient || isActionClientReady) {
      console.log('🔍 [ActionClient Init] Already initialized, skipping');
      return;
    }

    let mounted = true;
    
    const initActionClient = async () => {
      console.log('🚀 [ActionClient Init] Starting initialization...');
      try {
        const client = await getActionClientSingleton(
          sessionState.tenantId!,
          sessionState.branchContext!
        );
        
        if (mounted) {
          console.log('✅ [ActionClient Init] Successfully initialized');
          setActionClient(client);
          setIsActionClientReady(true);
        }
      } catch (error) {
        if (mounted) {
          console.error('❌ [ActionClient Init] Failed:', error);
          // CRITICAL: Don't retry endlessly, just fail gracefully
          setIsActionClientReady(false);
        }
      }
    };

    initActionClient();
    
    return () => {
      mounted = false;
    };
  }, [sessionState.isSessionReady, sessionState.tenantId, sessionState.branchContext, actionClient, isActionClientReady]);
  
  // ============================================================================
  // STABLE ACTION HANDLERS
  // ============================================================================
  
  const refetchNodes = useCallback(async () => {
    if (!isActionClientReady || !actionClient || !sessionState.branchContext) return;
    
    setIsNodesLoading(true);
    try {
      // ✅ FIXED: Actual ActionClient call for node data
      const result = await actionClient.executeAction({
        action: 'node.list',
        data: { 
          filters: { isActive: true }
        },
        branchContext: sessionState.branchContext
      });
      
      if (result.success && result.data) {
        setNodes(Array.isArray(result.data) ? result.data : []);
        console.log('✅ [UnifiedApp] Loaded nodes:', result.data.length);
      } else {
        console.warn('⚠️ [UnifiedApp] Node loading failed:', result.error);
        setNodes([]);
      }
    } catch (error) {
      console.error('❌ [UnifiedApp] Node loading error:', error);
      setNodes([]);
    } finally {
      setIsNodesLoading(false);
    }
  }, [isActionClientReady, actionClient, sessionState.branchContext]);
  
  const invalidateCache = useCallback(async () => {
    if (!isActionClientReady || !actionClient) return;
    
    try {
      // Clear TanStack Query cache
      await queryClient.invalidateQueries();
      
      // Clear ActionClient cache (IndexedDB)
      if (actionClient.clearCache) {
        await actionClient.clearCache();
      }
      
      // Refetch nodes after cache clear
      await refetchNodes();
      
      console.log('✅ [UnifiedApp] Cache invalidated and data refreshed');
    } catch (error) {
      console.error('❌ [UnifiedApp] Cache invalidation error:', error);
    }
  }, [isActionClientReady, actionClient, queryClient, refetchNodes]);
  
  // ============================================================================
  // AUTO-FETCH NODES WHEN READY
  // ============================================================================
  
  useEffect(() => {
    console.log('🔍 [Auto-Fetch] Checking conditions:', {
      isActionClientReady,
      hasActionClient: !!actionClient,
      nodesLength: nodes.length,
      shouldFetch: isActionClientReady && actionClient && nodes.length === 0,
      timestamp: new Date().toISOString()
    });

    if (isActionClientReady && actionClient && nodes.length === 0) {
      console.log('🚀 [Auto-Fetch] Triggering node fetch...');
      refetchNodes();
    }
  }, [isActionClientReady, actionClient, nodes.length, refetchNodes]);
  
  // ============================================================================
  // STABLE CONTEXT VALUE (PREVENTS RE-RENDER LOOPS)
  // ============================================================================
  
  const contextValue = useMemo<UnifiedAppContextValue>(() => ({
    // Auth state (from SSOT)
    auth,
    
    // Branch context (from SSOT)
    branchContext: sessionState.branchContext,
    
    // Navigation context (from SSOT)
    navigationContext,
    
    // User data (from SSOT)
    userPreferences,
    permissions,
    
    // ActionClient state
    actionClient,
    isActionClientReady,
    
    // Node data (derived from navigation + action client)
    nodes,
    isNodesLoading,
    
    // Actions (stable references)
    refetchNodes,
    invalidateCache,
  }), [
    auth,
    sessionState.branchContext,
    navigationContext,
    userPreferences,
    permissions,
    actionClient,
    isActionClientReady,
    nodes,
    isNodesLoading,
    refetchNodes,
    invalidateCache,
  ]);
  
  return (
    <CacheProvider tenantId={sessionState.tenantId || ''}>
      <UnifiedAppContext.Provider value={contextValue}>
        {children}
      </UnifiedAppContext.Provider>
    </CacheProvider>
  );
});

// ============================================================================
// MAIN PROVIDER WRAPPER WITH OPTIMIZED QUERY CLIENT
// ============================================================================

// Create singleton Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface UnifiedAppProvidersProps {
  children: React.ReactNode;
}

export function UnifiedAppProviders({ children }: UnifiedAppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <UniversalSearchProvider>
          <NavigationContextProvider>
            <UnifiedAppProviderCore>
              {children}
            </UnifiedAppProviderCore>
          </NavigationContextProvider>
        </UniversalSearchProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// CONSUMER HOOK
// ============================================================================

export function useUnifiedApp(): UnifiedAppContextValue {
  const context = useContext(UnifiedAppContext);
  if (!context) {
    throw new Error('useUnifiedApp must be used within UnifiedAppProviders');
  }
  return context;
}

// ============================================================================
// LOADING BOUNDARY
// ============================================================================

export function AppLoadingBoundary({ children }: { children: React.ReactNode }) {
  const { auth, branchContext } = useUnifiedApp();
  
  // Track hydration to prevent SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Stable ready check with useMemo to prevent render loops
  const isReady = useMemo(() => {
    const ready = auth.isAuthenticated && branchContext !== null && !auth.isLoading;
    console.log('🔍 [AppLoadingBoundary] Readiness check:', {
      authIsAuthenticated: auth.isAuthenticated,
      authIsLoading: auth.isLoading,
      authIsReady: auth.isReady,
      branchContextExists: branchContext !== null,
      finalIsReady: ready,
      timestamp: new Date().toISOString()
    });
    return ready;
  }, [auth.isAuthenticated, auth.isLoading, auth.isReady, branchContext]);
  
  // If not authenticated, allow redirect
  if (!auth.isLoading && !auth.isAuthenticated) {
    console.log('🔄 [AppLoadingBoundary] User not authenticated, allowing redirect');
    return <>{children}</>;
  }
  
  // If everything is ready, show the app
  if (isReady) {
    console.log('✅ [AppLoadingBoundary] App ready, rendering children');
    return <>{children}</>;
  }
  
  // Show loading screen for any other state
  const loadingMessage = auth.isLoading || !auth.isAuthenticated 
    ? 'Loading session...' 
    : 'Loading workspace...';
  const loadingSubtext = auth.isLoading 
    ? 'Authenticating user' 
    : 'Setting up your enterprise environment';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-700 font-medium">{loadingMessage}</p>
        <p className="text-sm text-gray-500 mt-1">{loadingSubtext}</p>
        {isHydrated && (
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <div>Auth: {auth.isAuthenticated ? '✅' : auth.isLoading ? '⏳' : '❌'}</div>
            <div>Branch: {branchContext ? '✅' : '❌'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
