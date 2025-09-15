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
// ✅ GOLD STANDARD: Unified Data Provider (lazy)
const UnifiedDataProviderDynamic = dynamic(() => import('./unified-data-provider').then(m => m.UnifiedDataProvider), { ssr: false });
const NodeDataProviderDynamic = dynamic(() => import('./node-data-provider').then(m => m.NodeDataProvider), { ssr: false });
const NavigationContextProviderDynamic = dynamic(() => import('@/lib/context/navigation-context').then(m => m.NavigationContextProvider), { ssr: false });
const TagProviderDynamic = dynamic(() => import('./tag-provider').then(m => m.TagProvider), { ssr: false });
const UniversalSearchProviderDynamic = dynamic(() => import('@/components/search').then(m => m.UniversalSearchProvider), { ssr: false });
const GlobalTagModalRendererDynamic = dynamic(() => import('@/components/ui/global-tag-modal-renderer').then(m => m.GlobalTagModalRenderer), { ssr: false });

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
          <UnifiedDataProviderDynamic>
            <NodeDataProviderDynamic>
              <NavigationContextProviderDynamic>
                <TagProviderDynamic>
                  <UniversalSearchProviderDynamic>
                    {children}
                    <GlobalTagModalRendererDynamic />
                  </UniversalSearchProviderDynamic>
                </TagProviderDynamic>
              </NavigationContextProviderDynamic>
            </NodeDataProviderDynamic>
          </UnifiedDataProviderDynamic>
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
          <UnifiedDataProviderDynamic>
            <NodeDataProviderDynamic>
              <NavigationContextProviderDynamic>
                <TagProviderDynamic>
                  <UniversalSearchProviderDynamic>
                    {children}
                    <GlobalTagModalRendererDynamic />
                  </UniversalSearchProviderDynamic>
                </TagProviderDynamic>
              </NavigationContextProviderDynamic>
            </NodeDataProviderDynamic>
          </UnifiedDataProviderDynamic>
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