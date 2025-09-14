/**
 * Universal Entity ID Resolver
 * 
 * Consolidates all ID resolution logic for converting idShort to real IDs.
 * Replaces scattered resolver functions with a single, unified system.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useActionQuery } from '@/hooks/use-action-api';
import { getActionClient } from '@/lib/action-client';

export interface EntityIdResolverResult {
  fullId: string | null;
  isResolving: boolean;
  error: Error | null;
  entity?: any; // The resolved entity data
  notFound?: boolean; // 🚀 NEW: Indicates entity not found (for branch switching)
}

/**
 * Entity types supported by the resolver
 */
type EntityType = 'node' | 'rule' | 'process' | 'workflow' | 'office' | 'class';

/**
 * Map entity types to their action names and ID field names
 */
const ENTITY_CONFIG: Record<EntityType, {
  listAction: string;
  idField: string;
  shortIdField: string;
}> = {
  node: {
    listAction: 'node.list',
    idField: 'id',
    shortIdField: 'idShort'
  },
  rule: {
    listAction: 'rule.list', 
    idField: 'id',
    shortIdField: 'idShort'
  },
  process: {
    listAction: 'process.list',
    idField: 'id', 
    shortIdField: 'idShort'
  },
  workflow: {
    listAction: 'workflow.list',
    idField: 'id',
    shortIdField: 'idShort'
  },
  office: {
    listAction: 'office.list',
    idField: 'id',
    shortIdField: 'idShort'
  },
  class: {
    listAction: 'class.list',
    idField: 'id',
    shortIdField: 'idShort'
  }
};

/**
 * Universal hook to resolve entity idShort to full ID
 * 
 * @param entityType - The type of entity (node, rule, process, etc.)
 * @param idShort - The short ID from URL (e.g., "RVZ6VUW")
 * @returns The full ID and resolution state
 */
export const useEntityIdResolver = (
  entityType: EntityType, 
  idShort: string | null
): EntityIdResolverResult => {
  const { data: session } = useSession();
  const [overlayState, setOverlayState] = useState<{ fullId: string | null; entity: any | null; error: Error | null; resolving: boolean }>({ fullId: null, entity: null, error: null, resolving: false });
  const overlayTriedRef = useRef(false);
  
  // Only fetch if we have an idShort that looks like a short ID (no hyphens = not a UUID)
  const needsResolution = idShort && !idShort.includes('-');
  
  // Debug: Log session vs query mismatch
  if (entityType === 'node' && session?.user?.rootNodeIdShort && needsResolution) {
    console.log(`🔍 [EntityIdResolver] Session vs Query Analysis:`, {
      sessionRootNodeIdShort: session.user.rootNodeIdShort,
      searchingForIdShort: idShort,
      sessionRootNodeId: session.user.rootNodeId,
      sessionTenantId: session.user.tenantId,
      areSame: session.user.rootNodeIdShort.toLowerCase() === idShort?.toLowerCase()
    });
  }
  
  // Get entity configuration
  const config = ENTITY_CONFIG[entityType];
  
  // Query setup - silent
  
  // Fetch entity data to resolve idShort to full ID
  const { data: entityData, isLoading, error, isFetching, isError, failureCount } = useActionQuery(
    config.listAction,
    { filters: { isActive: true } }, // Use proper filters shape expected by action system
    {
      enabled: Boolean(needsResolution && session?.user?.tenantId),
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2, // 🚀 INCREASED: Give it 2 retries instead of 1
      retryDelay: 1000, // 🚀 NEW: Add 1 second delay between retries
      refetchOnWindowFocus: false
    }
  );

  // 🚀 PERFORMANCE: Try IndexedDB first, then overlay fallback
  useEffect(() => {
    const tryIndexedDBFirst = async () => {
      if (!needsResolution || !session?.user?.tenantId) return;
      if (overlayTriedRef.current) return;
      
      const bc = (session as any)?.user?.branchContext;
      
      if (!bc?.currentBranchId || !bc?.defaultBranchId) {
        throw new Error('Branch context missing from session - cannot resolve entity ID');
      }
      
      const branchContext = {
        currentBranchId: bc.currentBranchId,
        defaultBranchId: bc.defaultBranchId,
        tenantId: session.user.tenantId,
        userId: session.user.id,
      };
      
      // If current branch query has data and includes the entity, skip IndexedDB check
      const entities = Array.isArray(entityData?.data) ? (entityData?.data as any[]) : [];
      const existsInCurrent = entities.some((e: any) => (e[config.shortIdField] || e[config.idField]?.slice(0, 8))?.toLowerCase() === (idShort || '').toLowerCase());
      if (existsInCurrent) return;

      overlayTriedRef.current = true;
      setOverlayState(s => ({ ...s, resolving: true, error: null }));
      
      try {
        // Try IndexedDB first for super fast lookup
        const ac = getActionClient(session.user.tenantId, branchContext);
        const indexedDBManager = (ac as any).indexedDB;
        
        if (indexedDBManager?.findByIdShort) {
          const foundEntity = await indexedDBManager.findByIdShort(
            entityType, 
            idShort, 
            branchContext
          );
          
          if (foundEntity) {
            console.log('✅ [EntityIdResolver] Found in IndexedDB:', {
              entityType,
              idShort,
              foundId: foundEntity[config.idField]
            });
            setOverlayState({ 
              fullId: foundEntity[config.idField], 
              entity: foundEntity, 
              error: null, 
              resolving: false 
            });
            return;
          }
        }
        
        // Fallback to API overlay if not found in IndexedDB
        const result = await ac.executeAction({ 
          action: config.listAction, 
          data: { filters: { isActive: true } }, 
          branchContext 
        });
        
        const list = Array.isArray(result?.data) ? result.data as any[] : [];
        const found = list.find((entity: any) => {
          const entityShortId = entity[config.shortIdField] || entity[config.idField]?.slice(0, 8);
          return (entityShortId || '').toLowerCase() === (idShort || '').toLowerCase();
        });
        
        if (found) {
          setOverlayState({ fullId: found[config.idField], entity: found, error: null, resolving: false });
        } else {
          setOverlayState({ fullId: null, entity: null, error: null, resolving: false });
        }
      } catch (e: any) {
        setOverlayState({ fullId: null, entity: null, error: e instanceof Error ? e : new Error(String(e)), resolving: false });
      }
    };

    // Trigger IndexedDB check once current attempt is resolved or errored
    if (needsResolution && !isLoading && !isFetching && !overlayTriedRef.current) {
      tryIndexedDBFirst();
    }
  }, [needsResolution, isLoading, isFetching, entityData?.data, idShort, session?.user?.tenantId, entityType, config]);

  // Query state - silent

  const result = useMemo(() => {
    // If no idShort provided, return null
    if (!idShort) {
      return {
        fullId: null,
        isResolving: false,
        error: null
      };
    }
    
    // If idShort is already a full UUID, return it as-is
    if (idShort.includes('-')) {
      return {
        fullId: idShort,
        isResolving: false,
        error: null
      };
    }
    
    // If we're still loading or fetching, or overlay is resolving, return loading state
    if (isLoading || isFetching || overlayState.resolving) {
      return {
        fullId: null,
        isResolving: true,
        error: null
      };
    }
    
    // 🚀 IMPROVED: Only return error if we've exhausted retries AND actually have an error
    // Don't immediately fail if data is just empty - stay in loading state for a bit
    if (isError && error && failureCount >= 2) {
      console.error('❌ [EntityIdResolver] Query failed after retries:', {
        entityType,
        idShort,
        error: (error as Error).message,
        failureCount
      });
      return {
        fullId: null,
        isResolving: false,
        error: error as Error
      };
    }
    
    // If we have entity data, find the matching entity (current branch)
    if (entityData?.data) {
      const entities = Array.isArray(entityData.data) ? entityData.data : [entityData.data];
      
      // Reduced logging for performance
      if (entities.length === 0) {
        console.log(`🔍 [EntityIdResolver] No ${entityType} entities found for idShort: ${idShort}`);
      }
      
      const foundEntity = entities.find((entity: any) => {
        const entityShortId = entity[config.shortIdField] || entity[config.idField]?.slice(0, 8);
        // Case-insensitive comparison to handle both old (uppercase) and new (lowercase) shortIds
        const match = entityShortId?.toLowerCase() === idShort.toLowerCase();
        // Removed verbose comparison logging for performance
        return match;
      });
      
      if (foundEntity) {
        // Success - minimal logging
        return {
          fullId: foundEntity[config.idField],
          isResolving: false,
          error: null,
          entity: foundEntity
        };
      } else {
        // Try overlay result (default branch)
        if (overlayState.fullId) {
          console.log(`✅ [EntityIdResolver] Found in overlay (default branch):`, {
            entityType,
            idShort,
            fullId: overlayState.fullId,
            entity: overlayState.entity
          });
          return {
            fullId: overlayState.fullId,
            isResolving: false,
            error: null,
            entity: overlayState.entity || undefined
          };
        }
        
        // 🚀 BRANCH SWITCH FIX: Instead of throwing error, return graceful not-found state
        // This allows the UI to handle branch switching without crashes
        console.warn(`⚠️ [EntityIdResolver] ${entityType} not found in current or default branch:`, {
          entityType,
          idShort,
          currentBranchEntities: entities.length,
          overlayTried: overlayTriedRef.current,
          branchContext: (session as any)?.user?.branchContext
        });
        
        return {
          fullId: null,
          isResolving: false,
          error: null, // 🚀 Don't throw error - let UI handle gracefully
          notFound: true // 🚀 Add flag to indicate not found vs loading
        };
      }
    }
    
    // If no data yet but no error, or overlay resolving, stay in loading state
    if (!isError || overlayState.resolving) {
      return {
        fullId: null,
        isResolving: true,
        error: null
      };
    }
    
    // Final fallback - should rarely reach here now
    console.warn(`⚠️ [EntityIdResolver] Final fallback - no data available:`, {
      entityType,
      idShort,
      hasData: !!entityData?.data,
      isError,
      error: error ? (error as Error).message : null
    });
    
    return {
      fullId: null,
      isResolving: false,
      error: null, // 🚀 Don't throw error - let UI handle gracefully
      notFound: true
    };
  }, [entityData, idShort, isLoading, isFetching, isError, error, failureCount, config, entityType, overlayState.fullId, overlayState.resolving, session]);

  return result;
};

/**
 * Specific resolvers for convenience (backwards compatibility)
 */
export const useNodeIdResolver = (idShort: string | null) => 
  useEntityIdResolver('node', idShort);

export const useRuleIdResolver = (idShort: string | null) => 
  useEntityIdResolver('rule', idShort);

export const useProcessIdResolver = (idShort: string | null) => 
  useEntityIdResolver('process', idShort);

export const useWorkflowIdResolver = (idShort: string | null) => 
  useEntityIdResolver('workflow', idShort);

export const useOfficeIdResolver = (idShort: string | null) => 
  useEntityIdResolver('office', idShort); 

/**
 * Universal hook to resolve class idShort to full ID
 * 
 * @param idShort - The short ID from URL (e.g., "RVZ6VUW")
 * @returns The full ID and resolution state
 */
export const useClassIdResolver = (
  idShort: string | null
): EntityIdResolverResult => {
  return useEntityIdResolver('class', idShort);
}; 