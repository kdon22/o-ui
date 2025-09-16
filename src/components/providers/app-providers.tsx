/**
 * App Providers - Complete Provider Composition
 * 
 * Composes all application providers in the correct order:
 * - Session Provider (NextAuth)
 * - TanStack Query Provider (React Query)
 * - Cache Provider (IndexedDB bootstrap)
 * - Branch Context Provider
 * - Theme Provider (if needed)
 * 
 * This ensures proper dependency injection and initialization order
 * for the IndexedDB-first architecture.
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { BranchProvider } from '@/lib/branching/branch-provider';
import { BranchContextProvider } from '@/lib/context/branch-context';
import type { BranchContext } from '@/lib/resource-system/schemas';
// ✅ FIXED: Use static imports to prevent re-render loops
import { UnifiedDataProvider } from './unified-data-provider';
import { NodeDataProvider } from './node-data-provider';
import { NavigationContextProvider } from '@/lib/context/navigation-context';
import { TagProvider } from './tag-provider';
import { UniversalSearchProvider } from '@/components/search';
import { GlobalTagModalRenderer } from '@/components/ui/global-tag-modal-renderer';

// Create optimized Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes
      gcTime: 60 * 60 * 1000,    // 60 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      retry: 3,
      networkMode: 'online'
    },
    mutations: {
      retry: 2,
      networkMode: 'online'
    }
  }
});

interface AppProvidersProps {
  children: React.ReactNode;
}

function SessionWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status, update: updateSession } = useSession();
  const pathname = usePathname();
  const [isFreshLogin, setIsFreshLogin] = useState(false);
  const bootstrapPerformedRef = useRef(false);
  const normalizedBranchRef = useRef(false);
  
  // Check if we're on an auth page - must be precise to avoid false positives
  const isAuthPage = pathname === '/login' || 
                     pathname === '/devices' || 
                     pathname?.startsWith('/(auth)') ||
                     pathname?.includes('/(auth)/');

  // SessionWrapper render - silent

  // Detect fresh login - either new user or coming from auth page
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const lastUserId = localStorage.getItem('lastUserId');
      const freshLogin = !lastUserId || lastUserId !== session.user.id;
      
      // Fresh login check - silent
      
      // Force fresh bootstrap if coming from auth page OR new user AND not already done
      if ((freshLogin || isAuthPage) && !bootstrapPerformedRef.current) {
        localStorage.setItem('lastUserId', session.user.id);
        setIsFreshLogin(true);
        bootstrapPerformedRef.current = true;
        
        // Reset flag after bootstrap has had time to start
        setTimeout(() => {
          setIsFreshLogin(false);
        }, 500);
      }
    }
  }, [status, session?.user?.id, isAuthPage, pathname]);

  // Reset bootstrap flag when session changes (new login)
  useEffect(() => {
    if (status === 'loading' || !session?.user?.id) {
      bootstrapPerformedRef.current = false;
    }
  }, [status, session?.user?.id]);

  // Ensure branchContext is normalized client-side if missing ids
  useEffect(() => {
    if (normalizedBranchRef.current) return;
    if (status !== 'authenticated' || !session?.user) return;
    const bc: any = session.user.branchContext;
    if (!bc) return;
    const hasIds = !!(bc.currentBranchId && bc.defaultBranchId);
    const derivedDefault = bc.availableBranches?.find((b: any) => b.isDefault) || bc.availableBranches?.[0];
    const derivedId = derivedDefault?.id;
    if (!hasIds && derivedId) {
      normalizedBranchRef.current = true;
      // Set both ids to derived to unblock app; server can refine later
      updateSession?.({ currentBranchId: derivedId, branchContext: { defaultBranchId: bc.defaultBranchId || derivedId } }).catch(() => {
        normalizedBranchRef.current = false;
      });
    }
  }, [status, session?.user?.branchContext, updateSession]);

  // Skip data providers on auth pages - they require authentication
  if (isAuthPage) {
    return (
      <>
        {children}
      </>
    );
  }

  // Determine if we should render CacheProvider
  const shouldRenderCacheProvider = status === 'authenticated' && 
                                    session?.user?.tenantId && 
                                    session?.user?.branchContext?.currentBranchId &&
                                    session?.user?.branchContext?.defaultBranchId;

  // Always render the same component tree structure to prevent hook count changes
  if (!shouldRenderCacheProvider) {
    // Waiting for session - silent
    return (
      <BranchContextProvider>
        <BranchProvider>
          <UnifiedDataProvider>
            <NodeDataProvider>
              <NavigationContextProvider>
                <TagProvider>
                  <UniversalSearchProvider>
                    {children}
                    <GlobalTagModalRenderer />
                  </UniversalSearchProvider>
                </TagProvider>
              </NavigationContextProvider>
            </NodeDataProvider>
          </UnifiedDataProvider>
        </BranchProvider>
      </BranchContextProvider>
    );
  }

  // Lazy-load heavy cache provider to prevent module side-effects on auth routes
  const CacheProviderDynamic = dynamic(() => import('./cache-provider').then(m => m.CacheProvider), { ssr: false });

  return (
    <BranchContextProvider>
      <BranchProvider>
        <CacheProviderDynamic
          tenantId={session.user.tenantId || ''}
          forceFreshBootstrap={isFreshLogin}
        >
          <UnifiedDataProvider>
            <NodeDataProvider>
              <NavigationContextProvider>
                <TagProvider>
                  <UniversalSearchProvider>
                    {children}
                    <GlobalTagModalRenderer />
                  </UniversalSearchProvider>
                </TagProvider>
              </NavigationContextProvider>
            </NodeDataProvider>
          </UnifiedDataProvider>
        </CacheProviderDynamic>
      </BranchProvider>
    </BranchContextProvider>
  );
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SessionWrapper>
          {children}
        </SessionWrapper>
      </SessionProvider>
    </QueryClientProvider>
  );
}