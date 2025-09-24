/**
 * useAuth - Authentication State Hook
 * 
 * Single source of truth for authentication state.
 * Never throws during SSR, handles loading gracefully.
 */

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback } from 'react';
import type { AuthHookReturn } from '../types';

export function useAuth(): AuthHookReturn {
  const { data: session, status, update } = useSession();
  
  // DEBUG: Log NextAuth session state
  console.log('🔍 [useAuth] NextAuth state:', {
    status,
    hasSession: !!session,
    hasUser: !!session?.user,
    userTenantId: session?.user?.tenantId,
    timestamp: new Date().toISOString()
  });
  
  const login = useCallback(() => {
    signIn();
  }, []);
  
  const logout = useCallback(() => {
    signOut({ redirect: true });
  }, []);
  
  const updateSession = useCallback(async (data: any) => {
    await update(data);
  }, [update]);
  
  return {
    // Auth state
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    isReady: status !== 'loading' && !!session?.user, // More lenient condition
    userId: session?.user?.id || null,
    userEmail: session?.user?.email || null,
    tenantId: session?.user?.tenantId || null,
    
    // Actions
    login,
    logout,
    updateSession,
  };
}
