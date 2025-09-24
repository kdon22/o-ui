/**
 * useNavigationContext - Navigation Context Hook
 * 
 * Single source of truth for navigation state including lastSelectedNode
 * for CRUD form auto-population and workspace navigation.
 */

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import type { NavigationContextHookReturn } from '../types';

export function useNavigationContext(): NavigationContextHookReturn {
  const { data: session, update: updateSession } = useSession();
  
  // ============================================================================
  // NAVIGATION STATE DERIVATION
  // ============================================================================
  
  const isReady = !!session?.user;
  
  const navigationData = {
    rootNodeId: session?.user?.rootNodeId || null,
    rootNodeIdShort: session?.user?.rootNodeIdShort || null,
    lastSelectedNodeId: session?.user?.preferences?.lastAccessedNodeId || null,
    lastSelectedNodeIdShort: session?.user?.preferences?.lastAccessedNodeIdShort || null,
    workspaceStructure: session?.user?.workspaceStructure || null,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : undefined,
  };
  
  // ============================================================================
  // NAVIGATION ACTIONS
  // ============================================================================
  
  const updateLastSelectedNode = useCallback(async (nodeId: string) => {
    if (!isReady) {
      console.warn('[useNavigationContext] Cannot update node: session not ready');
      return;
    }
    
    console.log('🔄 [useNavigationContext] Updating last selected node:', nodeId);
    
    await updateSession({
      preferences: {
        ...session?.user?.preferences,
        lastAccessedNodeId: nodeId,
        lastAccessedNodeIdShort: nodeId.length > 8 ? nodeId.substring(0, 8) : nodeId,
        lastAccessedAt: new Date().toISOString(),
      }
    });
    
    console.log('✅ [useNavigationContext] Last selected node updated');
  }, [isReady, session?.user?.preferences, updateSession]);
  
  const clearLastSelectedNode = useCallback(async () => {
    if (!isReady) {
      console.warn('[useNavigationContext] Cannot clear node: session not ready');
      return;
    }
    
    console.log('🔄 [useNavigationContext] Clearing last selected node');
    
    await updateSession({
      preferences: {
        ...session?.user?.preferences,
        lastAccessedNodeId: null,
        lastAccessedNodeIdShort: null,
        lastAccessedAt: new Date().toISOString(),
      }
    });
    
    console.log('✅ [useNavigationContext] Last selected node cleared');
  }, [isReady, session?.user?.preferences, updateSession]);
  
  // ============================================================================
  // RETURN VALUES
  // ============================================================================
  
  return {
    ...navigationData,
    isReady,
    updateLastSelectedNode,
    clearLastSelectedNode,
  };
}
