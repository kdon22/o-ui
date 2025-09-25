/**
 * useMarketplaceData Hook - Consolidated Data Fetching via Action System
 *
 * Uses ONLY standard list/read actions and computes sections client-side.
 */

import { useMemo } from 'react';
import { useActionQuery } from '@/hooks/use-action-api';

// Dashboard data hook - compute from list actions
export function useMarketplaceDashboard(options: { enabled?: boolean } = {}) {
  const pkgs = useActionQuery(
    'marketplacePackages.list',
    { includeAnalytics: true, limit: 500 },
    { staleTime: 5 * 60 * 1000, enabled: options.enabled !== false }
  );

  const installs = useActionQuery(
    'packageInstallations.list',
    { filters: { status: 'active' }, limit: 100 },
    { staleTime: 5 * 60 * 1000, enabled: options.enabled !== false }
  );

  const data = useMemo(() => {
    const allPackages = (pkgs.data?.data as any[]) || [];
    const installations = (installs.data?.data as any[]) || [];

    const pickTop = (arr: any[], n: number) => arr.slice(0, Math.min(arr.length, n));

    const featured = pickTop(
      [...allPackages]
        .filter(p => p?.isActive && (p?.analytics?.averageRating || 0) >= 4)
        .sort((a, b) => (b?.analytics?.averageRating || 0) - (a?.analytics?.averageRating || 0)),
      6
    );

    const trending = pickTop(
      [...allPackages]
        .filter(p => p?.isActive && (p?.analytics?.weeklyDownloads || 0) > 0)
        .sort((a, b) => (b?.analytics?.weeklyDownloads || 0) - (a?.analytics?.weeklyDownloads || 0)),
      6
    );

    const starred = [...allPackages].filter((p: any) => p?.isStarred).slice(0, 6);

    const recentInstallations = installations.slice(0, 3);

    const metrics = {
      averageRating: allPackages.length
        ? (allPackages.reduce((s, p) => s + (p?.analytics?.averageRating || 0), 0) / allPackages.length)
        : 0
    };

    return { featured, trending, starred, recentInstallations, metrics };
  }, [pkgs.data, installs.data]);

  return {
    data,
    isLoading: pkgs.isActuallyLoading || installs.isActuallyLoading,
    error: pkgs.error || installs.error,
  } as any;
}

// User data hook - consolidates installations, starred, collections from list actions
export function useMarketplaceUserData(
  include: string[] = ['installations', 'starred', 'collections'],
  options: { enabled?: boolean } = {}
) {
  const needInstalls = include.includes('installations');
  const needStarred = include.includes('starred');
  // collections pending until supported via schema

  const installs = useActionQuery(
    'packageInstallations.list',
    { filters: { status: 'active' }, limit: 1000 },
    { staleTime: 3 * 60 * 1000, enabled: options.enabled !== false && needInstalls }
  );

  const starredPkgs = useActionQuery(
    'marketplacePackages.list',
    { filters: { isStarred: true }, includeAnalytics: true, limit: 500 },
    { staleTime: 3 * 60 * 1000, enabled: options.enabled !== false && needStarred }
  );

  const data = useMemo(() => {
    return {
      installations: needInstalls
        ? {
            all: (installs.data?.data as any[]) || [],
            recent: ((installs.data?.data as any[]) || []).slice(0, 5),
            recentlyUpdated: [],
            availableUpdates: (((installs.data?.data as any[]) || []).filter((i: any) => i?.package?.hasUpdates))
          }
        : undefined,
      starred: needStarred ? ((starredPkgs.data?.data as any[]) || []) : undefined,
      collections: [],
      summary: undefined
    };
  }, [needInstalls, needStarred, installs.data, starredPkgs.data]);

  return {
    data,
    isLoading: (needInstalls && installs.isActuallyLoading) || (needStarred && starredPkgs.isActuallyLoading),
    error: installs.error || starredPkgs.error,
  } as any;
}

// Enhanced packages hook - replaces multiple package fetching scenarios
export function useMarketplacePackages(params: {
  search?: string;
  category?: string;
  sections?: string[];
  includeUserData?: boolean;
  includeAnalytics?: boolean;
  limit?: number;
  offset?: number;
} = {}, options: { enabled?: boolean } = {}) {
  const {
    search,
    category,
    sections = [],
    includeUserData = false,
    includeAnalytics = true,
    limit = 50,
    offset = 0
  } = params;

  return useActionQuery(
    'marketplacePackages.list',
    {
      filters: { search, category, sections },
      include: { userData: includeUserData, analytics: includeAnalytics },
      limit,
      offset
    },
    { staleTime: 2 * 60 * 1000, enabled: options.enabled !== false }
  );
}

// Derived hooks for specific use cases
export function useMarketplaceFeatured() {
  const { data: dashboardData, ...rest } = useMarketplaceDashboard();
  return {
    data: dashboardData?.featured || [],
    ...rest
  };
}

export function useMarketplaceTrending() {
  const { data: dashboardData, ...rest } = useMarketplaceDashboard();
  return {
    data: dashboardData?.trending || [],
    ...rest
  };
}

export function useMarketplaceStarred() {
  const { data: userData, ...rest } = useMarketplaceUserData(['starred']);
  return {
    data: userData?.starred || [],
    ...rest
  };
}

export function useMarketplaceInstallations() {
  const { data: userData, ...rest } = useMarketplaceUserData(['installations']);
  return {
    data: userData?.installations || { all: [], recent: [], recentlyUpdated: [], availableUpdates: [] },
    ...rest
  };
}

export function useMarketplaceUpdates() {
  const { data: userData, ...rest } = useMarketplaceUserData(['installations']);
  return {
    data: {
      available: userData?.installations?.availableUpdates || [],
      recent: userData?.installations?.recentlyUpdated || []
    },
    ...rest
  };
}

export function useMarketplaceCollections() {
  const { data: userData, ...rest } = useMarketplaceUserData(['collections']);
  return {
    data: userData?.collections || [],
    ...rest
  };
}

export function useMarketplaceMetrics() {
  const { data: dashboardData, ...rest } = useMarketplaceDashboard();
  return {
    data: dashboardData?.metrics || {},
    ...rest
  };
}

export function useMarketplaceUpdateCount() {
  const { data: dashboardData, ...rest } = useMarketplaceDashboard();
  return {
    data: dashboardData?.updateCount || 0,
    ...rest
  };
}
