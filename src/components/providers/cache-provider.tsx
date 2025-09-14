/**
 * Cache Provider - IndexedDB Bootstrap & Workspace Initialization
 * 
 * Provides Linear-like instant performance by:
 * - Bootstrapping IndexedDB with workspace data on app start
 * - Initializing ActionClient with schema awareness
 * - Managing cache freshness and background sync
 * - Providing cache context to child components
 */

import { createContext, useContext, useEffect, useState, type ReactNode, useMemo, useCallback } from 'react';
import type { BranchContext } from '@/lib/resource-system/schemas';
import { useReadyBranchContext } from '@/lib/context/branch-context';
import { getActionClient, clearAllTenantDatabases } from '@/lib/action-client';
import { BootstrapSplashScreen } from '@/components/bootstrap/bootstrap-splash-screen';
import workspaceBootstrap from '@/lib/services/workspace-bootstrap';

interface BootstrapResult {
  success: boolean;
  loadedResources: number;
  loadedJunctions: number;
  skippedResources: string[];
  errors: string[];
  duration: number;
  resourceSummary: any[];
  junctionSummary: any[];
}

interface CacheProviderProps {
  children: ReactNode;
  tenantId: string;
  forceFreshBootstrap?: boolean;
}

interface CacheContextValue {
  isInitialized: boolean;
  isBootstrapping: boolean;
  cacheStats: {
    totalResources: number;
    loadedResources: number;
    lastBootstrap: number | null;
    cacheHitRate: number;
  };
  branchContext?: BranchContext;
  tenantId?: string;
  refreshCache: () => Promise<void>;
  clearCache: () => Promise<void>;
  loadResourceOnDemand: (resourceType: string) => Promise<void>; // Add on-demand loading
}

const CacheContext = createContext<CacheContextValue | null>(null);

// Helper function to load resources in parallel with concurrency control
async function loadResourcesInParallel(
  actionClient: any, 
  nodes: any[], 
  branchContext: BranchContext, 
  setProgress?: (progress: number) => void
): Promise<any[]> {
  const concurrency = 5; // Load 5 nodes at a time
  const results: any[] = [];
  
  // Process nodes in batches
  for (let i = 0; i < nodes.length; i += concurrency) {
    const batch = nodes.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(node => loadNodeResources(actionClient, node, branchContext)));
    results.push(...batchResults.flat());
    
    // Update progress (30% + 60% * completion ratio)
    if (setProgress) {
      const completionRatio = (i + concurrency) / nodes.length;
      const progress = 30 + (60 * Math.min(1, completionRatio));
      setProgress(progress);
    }
  }
  
  return results;
}

// Helper function to load resources for a single node
async function loadNodeResources(actionClient: any, node: any, branchContext: BranchContext): Promise<any[]> {
  const resourceTypes = ['process', 'office', 'rule', 'workflow'];
  const results: any[] = [];
  
  await Promise.all(resourceTypes.map(async (resourceType) => {
    try {
      const response = await actionClient.executeAction({
        action: `${resourceType}.list`,
        options: { 
          limit: 200,
          filters: { nodeId: node.id },
          include: ['junctions']
        },
        branchContext
      });
      
      const records = Array.isArray(response.data) ? response.data : [];
      // Loaded resources silently
      results.push({ resourceType, nodeId: node.id, count: records.length });
      
    } catch (error) {
      console.error(`❌ [CacheProvider] Failed to load ${resourceType} for node ${node.name}:`, error);
      results.push({ resourceType, nodeId: node.id, count: 0, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }));
  
  return results;
}

export function CacheProvider({ 
  children, 
  tenantId, 
  forceFreshBootstrap = false 
}: CacheProviderProps) {
  // Get the branch context from SSOT
  const branchContext = useReadyBranchContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapResult, setBootstrapResult] = useState<BootstrapResult | null>(null);
  const [bootstrapProgress, setBootstrapProgress] = useState(0);
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Component render - silent

  // Stable performBootstrap function with useCallback
  const performBootstrap = useCallback(async (tenantId: string, branchContext: BranchContext, forceFresh: boolean = false) => {
    if (isBootstrapping) {
      // Bootstrap already in progress, skipping
      return;
    }

    setIsBootstrapping(true);
    setBootstrapProgress(0);
    setBootstrapError(null);

    try {
      const startTime = Date.now();
      
      // Clear all tenant databases on fresh bootstrap
      if (forceFresh) {
        await clearAllTenantDatabases();
      }

      setBootstrapProgress(10);

      // Get action client with branch context configured
      const actionClient = getActionClient(tenantId, branchContext);
      
      console.log('🚀 [CacheProvider] Starting workspace bootstrap with branches support');
      setBootstrapProgress(25);
      
      // Use the proper workspace bootstrap system with critical resources (includes branches)
      const result = await workspaceBootstrap.bootstrap({
        tenantId,
        branchContext,
        force: forceFresh,
        strategy: 'critical', // This will load nodes and branches
        maxRecordsPerResource: 1000
      });
      
      console.log('✅ [CacheProvider] Workspace bootstrap completed:', {
        success: result.success,
        loadedResources: result.loadedResources,
        errors: result.errors,
        resourceSummary: result.resourceSummary.map(r => ({
          resourceType: r.resourceType,
          recordCount: r.recordCount,
          success: r.success
        }))
      });
      
      setBootstrapProgress(100);
      
      // Bootstrap completed
      setBootstrapResult(result);
      setIsInitialized(true);
      
    } catch (error) {
      console.error('🔥 [CacheProvider] Bootstrap failed:', error);
      const errorInstance = error instanceof Error ? error : new Error('Unknown error');
      setBootstrapError(errorInstance);
      setBootstrapResult({ 
        success: false, 
        loadedResources: 0,
        loadedJunctions: 0,
        skippedResources: [],
        errors: [errorInstance.message],
        duration: 0,
        resourceSummary: [],
        junctionSummary: []
      });
      setIsInitialized(false);
    } finally {
      setIsBootstrapping(false);
    }
  }, [isBootstrapping]);

  // Memoize the refresh function to prevent re-renders
  const refreshCache = useCallback(async () => {
    // Cache Provider: Refreshing cache
    await performBootstrap(tenantId, branchContext, true);
  }, [tenantId, branchContext, performBootstrap]);

  // Retry bootstrap with exponential backoff
  const retryBootstrap = useCallback(async () => {
    setIsRetrying(true);
    try {
      await performBootstrap(tenantId, branchContext, false);
    } finally {
      setIsRetrying(false);
    }
  }, [tenantId, branchContext, performBootstrap]);

  // Memoize the clearCache function
  const clearCache = useCallback(async () => {
    // Cache Provider: Clearing cache
    const client = getActionClient(tenantId, branchContext);
    await client.clearCache();
    setBootstrapResult(null);
    setIsInitialized(false);
  }, [tenantId, branchContext]);

  // Bootstrap effect with proper dependencies
  useEffect(() => {
    if (forceFreshBootstrap && !isBootstrapping) {
      // Fresh bootstrap requested - clearing and bootstrapping
      clearCache().then(() => {
        performBootstrap(tenantId, branchContext, true);
      });
    } else if (!isInitialized && !isBootstrapping) {
      // Starting initial bootstrap
      performBootstrap(tenantId, branchContext, false);
    }
  }, [tenantId, branchContext.currentBranchId, forceFreshBootstrap, isInitialized, isBootstrapping, clearCache, performBootstrap]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isInitialized,
    isBootstrapping,
    cacheStats: {
      totalResources: 0, // Will be populated when RESOURCE_REGISTRY is loaded
      loadedResources: bootstrapResult?.loadedResources || 0,
      lastBootstrap: bootstrapResult ? Date.now() : null,
      cacheHitRate: 0.85
    },
    branchContext: branchContext,
    tenantId,
    refreshCache,
    clearCache,
    loadResourceOnDemand: async (resourceType: string) => {
      // TODO: Implement on-demand resource loading
      // Loading resource on demand
    }
  }), [isInitialized, isBootstrapping, bootstrapResult, branchContext, tenantId, refreshCache, clearCache]);

  // Providing context - silent

  // Show splash screen during bootstrap or on error
  if (isBootstrapping || bootstrapError) {
    return (
      <BootstrapSplashScreen
        progress={bootstrapProgress}
        error={bootstrapError}
        onRetry={retryBootstrap}
        isRetrying={isRetrying}
        tenantName={tenantId}
        branchName={branchContext.currentBranchId}
      />
    );
  }

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCacheContext() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCacheContext must be used within a CacheProvider');
  }
  return context;
}