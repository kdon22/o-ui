/**
 * Marketplace Feature - Main Exports
 * 
 * Centralized exports for the marketplace system including:
 * - Schema definitions
 * - TypeScript types
 * - Component exports
 */

// Schema and types
export { MARKETPLACE_PACKAGE_SCHEMA } from './marketplace.schema'
export type {
  MarketplacePackage,
  CreateMarketplacePackage,
  UpdateMarketplacePackage,
  ComponentSelectionItem,
  ComponentSelectionGroup,
  PackageInstallation,
  CreatePackageInstallation,
  PackageLicense,
  PaymentDetails,
  PackageSearchQuery,
  PackageSearchResult,
  PackageValidationResult,
  PackageValidationError,
  PackageValidationWarning,
  PackageAnalytics,
  MarketplaceApiResponse,
  PackagePublishResponse,
  PackageInstallResponse,
  LicenseType,
  SubscriptionInterval,
  UsageUnit,
  PackageCategory,
  ComponentType
} from './types'

// API functions
export {
  fetchMarketplacePackages,
  fetchPackageDetail,
  subscribeToPackage,
  installPackage,
  uninstallPackage,
  fetchUserSubscriptions,
  fetchUserInstallations
} from './api/marketplace-api'

// Components (when created)
// export { MarketplaceBrowse } from '@/components/marketplace/marketplace-browse'
// export { PackageDetail } from '@/components/marketplace/package-detail'
