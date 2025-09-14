/**
 * useMarketplaceData Hook - Consolidated Data Fetching
 * 
 * Provides unified access to all marketplace data through consolidated APIs.
 * Replaces multiple individual hooks with smart, efficient data fetching.
 */

import { useQuery } from '@tanstack/react-query';

// Dashboard data hook - replaces 8+ separate API calls
export function useMarketplaceDashboard(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['marketplace-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options.enabled !== false,
  });
}

// User data hook - consolidates installations, starred, collections
export function useMarketplaceUserData(
  include: string[] = ['installations', 'starred', 'collections'],
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['marketplace-user-data', include.sort().join(',')],
    queryFn: async () => {
      const params = new URLSearchParams({ include: include.join(',') });
      const response = await fetch(`/api/marketplace/user-data?${params}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      const result = await response.json();
      return result.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    enabled: options.enabled !== false,
  });
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

  return useQuery({
    queryKey: [
      'marketplace-packages',
      search,
      category,
      sections.sort().join(','),
      includeUserData,
      includeAnalytics,
      limit,
      offset
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (search) searchParams.set('search', search);
      if (category) searchParams.set('category', category);
      if (sections.length > 0) searchParams.set('sections', sections.join(','));
      if (includeUserData) searchParams.set('includeUserData', 'true');
      if (includeAnalytics) searchParams.set('includeAnalytics', 'true');
      searchParams.set('limit', limit.toString());
      searchParams.set('offset', offset.toString());

      const response = await fetch(`/api/marketplace/packages?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      const result = await response.json();
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: options.enabled !== false,
  });
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
