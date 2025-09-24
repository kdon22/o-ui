/**
 * Conditional Providers - Clean Enterprise Architecture
 * 
 * GOLD STANDARD: Smart routing with minimal providers
 * - Auth routes: Only SessionProvider + QueryClient
 * - App routes: Full UnifiedAppProviders with loading boundary
 * - Public routes: Minimal QueryClient only
 * - No nested provider complexity
 */

'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { UnifiedAppProviders, AppLoadingBoundary, useUnifiedApp } from './app-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ============================================================================
// ROUTE CLASSIFICATION
// ============================================================================

const AUTH_ROUTES = [
  '/login',
  '/devices', 
  '/auth',
];

const PUBLIC_ROUTES = [
  '/prompt/execute',
];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

// ============================================================================
// SINGLETON QUERY CLIENT FOR PUBLIC/AUTH ROUTES
// ============================================================================

const lightQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds for minimal routes
      gcTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
      retry: 0, // No retries for public routes
    },
  },
});

// ============================================================================
// CONDITIONAL PROVIDER WRAPPER
// ============================================================================

export function ConditionalProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Public routes: Minimal providers
  if (isPublicRoute(pathname)) {
    return (
      <QueryClientProvider client={lightQueryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  // Auth routes: SessionProvider + QueryClient only
  if (isAuthRoute(pathname)) {
    return (
      <QueryClientProvider client={lightQueryClient}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </QueryClientProvider>
    );
  }

  // App routes: Full provider stack with loading boundary
  return (
    <UnifiedAppProviders>
      <AppLoadingBoundary>
        {children}
      </AppLoadingBoundary>
    </UnifiedAppProviders>
  );
}

// ============================================================================
// RE-EXPORT HOOK FOR COMPONENTS
// ============================================================================

export { useUnifiedApp };
