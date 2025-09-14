/**
 * Marketplace Shared Components & Hooks - Exports
 * 
 * Centralized exports for all reusable marketplace components and hooks.
 * Enables clean imports and better tree-shaking.
 */

// Reusable Components
export { PackageRow } from './package-row';
export { PackageIcon } from './package-icon';
export { PackageBadges } from './package-badges';
export { PackageMetrics } from './package-metrics';
export { EmptyState } from './empty-state';
export { LoadingState } from './loading-state';

// Reusable Hooks
export { usePackageStar } from './use-package-star';
export {
  useMarketplaceDashboard,
  useMarketplaceUserData,
  useMarketplacePackages,
  useMarketplaceFeatured,
  useMarketplaceTrending,
  useMarketplaceStarred,
  useMarketplaceInstallations,
  useMarketplaceUpdates,
  useMarketplaceCollections,
  useMarketplaceMetrics,
  useMarketplaceUpdateCount
} from './use-marketplace-data';

// Types (re-export for convenience)
export type {
  MarketplacePackageWithDetails,
  PackageInstallation,
  PackageCollection,
  MarketplaceMetrics,
  PackageInstallationStatus
} from '@/features/marketplace/types/enhanced';
