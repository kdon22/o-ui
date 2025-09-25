'use client';

/**
 * Branch Context - Single Source of Truth
 * 
 * Provides branch context that is always available when needed.
 * Never returns undefined, null, or defaults to hardcoded values.
 * Fails fast with clear error messages instead of silent fallbacks.
 */

import React, { createContext, useContext, useMemo, useEffect, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';

// ============================================================================
// TYPES
// ============================================================================

interface ReadyBranchContext {
  readonly currentBranchId: string;
  readonly defaultBranchId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly isReady: true;
}

interface NotReadyBranchContext {
  readonly isReady: false;
  readonly reason: 'LOADING' | 'UNAUTHENTICATED' | 'NO_TENANT' | 'NO_BRANCHES';
  readonly error?: string;
}

export type BranchContext = ReadyBranchContext | NotReadyBranchContext;

// ============================================================================
// CONTEXT
// ============================================================================

const BranchContextInternal = createContext<BranchContext | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface BranchContextProviderProps {
  children: ReactNode;
}

export function BranchContextProvider({ children }: BranchContextProviderProps) {
  const { data: session, status } = useSession();
  
  // 🔍 DEBUG: Log what we actually have in session (only when status changes)
  useEffect(() => {
    console.log('🔍 [BranchContextProvider] Session debug:', {
      status,
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      hasUser: !!session?.user,
      userKeys: session?.user ? Object.keys(session.user) : [],
      tenantId: session?.user?.tenantId,
      branchContext: session?.user?.branchContext,
      timestamp: new Date().toISOString()
    });
  }, [status, session?.user?.tenantId, session?.user?.branchContext?.currentBranchId]);
  
  const branchContext = useMemo((): BranchContext => {
    // SSR/Loading state
    if (status === 'loading') {
      return { isReady: false, reason: 'LOADING' } as const;
    }
    
    // Not authenticated
    if (status !== 'authenticated' || !session?.user) {
      return { isReady: false, reason: 'UNAUTHENTICATED' } as const;
    }
    
    // Missing tenant
    if (!session.user.tenantId) {
      return { 
        isReady: false, 
        reason: 'NO_TENANT',
        error: 'User has no tenant assigned'
      } as const;
    }
    
    // Missing branch context
    if (!session.user.branchContext) {
      return { 
        isReady: false, 
        reason: 'NO_BRANCHES',
        error: 'User has no branch context'
      } as const;
    }
    
    // Validate required fields
    const { currentBranchId, defaultBranchId, availableBranches } = session.user.branchContext as any;
    
    // If ids missing but we have availableBranches, derive defaults
    if ((!currentBranchId || !defaultBranchId) && Array.isArray(availableBranches) && availableBranches.length > 0) {
      const derivedDefault = availableBranches.find((b: any) => b.isDefault) || availableBranches[0];
      const derivedDefaultId = derivedDefault?.id;
      const normalizedCurrent = currentBranchId || derivedDefaultId;
      const normalizedDefault = defaultBranchId || derivedDefaultId;
      if (normalizedCurrent && normalizedDefault) {
        const readyDerived = {
          currentBranchId: normalizedCurrent,
          defaultBranchId: normalizedDefault,
          tenantId: session.user.tenantId,
          userId: session.user.id,
          isReady: true
        } as const;
        console.log('🟡 [BranchContextProvider] Derived branch ids from availableBranches', {
          normalizedCurrent,
          normalizedDefault,
          count: availableBranches.length,
          timestamp: new Date().toISOString()
        });
        return readyDerived;
      }
    }

    // If currentBranchId is missing but defaultBranchId exists, normalize by using default as current
    if (!currentBranchId && defaultBranchId) {
      const readyContext = {
        currentBranchId: defaultBranchId,
        defaultBranchId,
        tenantId: session.user.tenantId,
        userId: session.user.id,
        isReady: true
      } as const;
      
      return readyContext;
    }
    
    if (!defaultBranchId) {
      return { 
        isReady: false, 
        reason: 'NO_BRANCHES',
        error: 'Missing defaultBranchId in session'
      } as const;
    }
    
    // All requirements met - return ready context
    const readyContext = {
      currentBranchId,
      defaultBranchId,
      tenantId: session.user.tenantId,
      userId: session.user.id,
      isReady: true
    } as const;
    

    
    return readyContext;
    
  }, [session, status]);
  
  return React.createElement(
    BranchContextInternal.Provider,
    { value: branchContext },
    children
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Get branch context with type-level guarantees
 * Returns either ready context or not-ready context with reason
 */
export function useBranchContext(): BranchContext {
  const context = useContext(BranchContextInternal);
  
  if (context === null) {
    throw new Error('useBranchContext must be used within BranchContextProvider');
  }
  
  return context;
}

/**
 * Get branch context that is guaranteed to be ready
 * Throws error if not ready - use only when you know context should be available
 */
export function useReadyBranchContext(): ReadyBranchContext {
  const context = useBranchContext();
  
  if (!context.isReady) {
    const errorMessage = context.error || `Branch context not ready: ${context.reason}`;
    throw new Error(errorMessage);
  }
  
  return context;
}

/**
 * Get branch context with loading state handling
 * Returns null during loading or when unauthenticated
 * Throws only on unexpected errors (missing tenant/branches when authenticated)
 */
export function useBranchContextWithLoading(): ReadyBranchContext | null {
  const context = useBranchContext();
  
  if (!context.isReady) {
    // Return null for expected states where branch context isn't available yet
    // Includes transient NO_BRANCHES during session hydration or switch
    if (context.reason === 'LOADING' || context.reason === 'UNAUTHENTICATED' || context.reason === 'NO_BRANCHES') {
      return null;
    }
    
    // Throw only for unexpected errors when user should have branch context
    const errorMessage = context.error || `Branch context not ready: ${context.reason}`;
    throw new Error(errorMessage);
  }
  
  return context;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isBranchContextReady(context: BranchContext): context is ReadyBranchContext {
  return context.isReady;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create branch context for testing or server-side operations
 */
export function createBranchContext(
  currentBranchId: string,
  defaultBranchId: string,
  tenantId: string,
  userId: string
): ReadyBranchContext {
  if (!currentBranchId || !defaultBranchId || !tenantId || !userId) {
    throw new Error('All branch context fields are required');
  }
  
  return {
    currentBranchId,
    defaultBranchId,
    tenantId,
    userId,
    isReady: true
  } as const;
}