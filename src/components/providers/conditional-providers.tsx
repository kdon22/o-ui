'use client';

import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { UnifiedAppProviders, AppLoadingBoundary, useUnifiedApp } from './app-providers-unified';

// Auth routes that don't need heavy providers
const AUTH_ROUTES = [
  '/login',
  '/devices',
  '/auth',
];

// Check if current path is an auth route
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Conditional Provider Wrapper
 * Only loads heavy providers (session, cache, data) for app routes
 * Auth routes get minimal SessionProvider only
 */
export function ConditionalProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = isAuthRoute(pathname);

  // Auth routes: minimal providers only
  if (isAuth) {
    return (
      <SessionProvider>
        {children}
      </SessionProvider>
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
