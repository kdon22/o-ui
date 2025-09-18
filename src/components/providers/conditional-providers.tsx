'use client';

import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { UnifiedAppProviders, AppLoadingBoundary, useUnifiedApp } from './app-providers-unified';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Auth routes that don't need heavy providers
const AUTH_ROUTES = [
  '/login',
  '/devices',
  '/auth',
  // Public prompt execution pages should bypass heavy providers
  '/prompt/execute',
];

// Check if current path is an auth route
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

// Prompt execution is fully public and should avoid session/cache init
function isPromptPublicRoute(pathname: string): boolean {
  return pathname === '/prompt/execute' || pathname.startsWith('/prompt/execute/');
}

/**
 * Conditional Provider Wrapper
 * Only loads heavy providers (session, cache, data) for app routes
 * Auth routes get minimal SessionProvider only
 */
export function ConditionalProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = isAuthRoute(pathname);
  const isPrompt = isPromptPublicRoute(pathname);
  // Lightweight query client for public/auth routes
  const queryClient = new QueryClient();

  // Prompt execute: only QueryClientProvider, no session/workspace
  if (isPrompt) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  // Auth routes: minimal providers only
  if (isAuth) {
    return (
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </QueryClientProvider>
    );
  }

  // App routes: full provider stack with loading boundary
  return (
    <UnifiedAppProviders>
      <AppLoadingBoundary>
        {children}
      </AppLoadingBoundary>
    </UnifiedAppProviders>
  );
}

// Re-export the useUnifiedApp hook for components to use
export { useUnifiedApp };
