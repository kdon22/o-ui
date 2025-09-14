/**
 * Marketplace Types - TypeScript interfaces for marketplace system
 * 
 * Defines all types for:
 * - Package creation and management
 * - Licensing and pricing models
 * - Component selection and packaging
 * - Installation and distribution
 */

// ============================================================================
// CORE MARKETPLACE TYPES
// ============================================================================

export type LicenseType = 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION' | 'USAGE_BASED';

export type SubscriptionInterval = 'monthly' | 'quarterly' | 'yearly';

export type UsageUnit = 'execution' | 'api_call' | 'record' | 'user';

export type PackageCategory = 
  | 'validation' 
  | 'utilities' 
  | 'workflows' 
  | 'integrations' 
  | 'travel' 
  | 'finance' 
  | 'compliance' 
  | 'analytics' 
  | 'other';

export type ComponentType = 'rules' | 'classes' | 'tables' | 'workflows';

// ============================================================================
// MARKETPLACE PACKAGE
// ============================================================================

export interface MarketplacePackage {
  id: string;
  name: string;
  description: string;
  version: string;
  category: PackageCategory;
  tags: string[];
  
  // Author and ownership
  authorId: string;
  tenantId: string;
  
  // Package contents
  selectedRules: string[];
  selectedClasses: string[];
  selectedTables: string[];
  selectedWorkflows: string[];
  
  // Licensing
  licenseType: LicenseType;
  price?: number;
  subscriptionInterval?: SubscriptionInterval;
  usageUnit?: UsageUnit;
  
  // Protection settings
  allowExport: boolean;
  requiresLicense: boolean;
  
  // Publishing
  isPublic: boolean;
  allowedTenants: string[];
  publishingNotes?: string;
  
  // Metrics
  downloadCount: number;
  rating?: number;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMarketplacePackage {
  name: string;
  description: string;
  version: string;
  category: PackageCategory;
  tags: string[];
  selectedRules: string[];
  selectedClasses: string[];
  selectedTables: string[];
  selectedWorkflows: string[];
  licenseType: LicenseType;
  price?: number;
  subscriptionInterval?: SubscriptionInterval;
  usageUnit?: UsageUnit;
  allowExport: boolean;
  requiresLicense: boolean;
  isPublic: boolean;
  allowedTenants: string[];
  publishingNotes?: string;
}

export interface UpdateMarketplacePackage extends Partial<CreateMarketplacePackage> {
  id: string;
}

// ============================================================================
// COMPONENT SELECTION
// ============================================================================

export interface ComponentSelectionItem {
  id: string;
  name: string;
  description?: string;
  type: ComponentType;
  isSelected: boolean;
  dependencies?: string[]; // Other components this depends on
}

export interface ComponentSelectionGroup {
  type: ComponentType;
  label: string;
  items: ComponentSelectionItem[];
  allowMultiple: boolean;
}

// ============================================================================
// PACKAGE INSTALLATION
// ============================================================================

export interface PackageInstallation {
  id: string;
  packageId: string;
  tenantId: string;
  userId: string;
  
  // Installation details
  installedVersion: string;
  installationDate: Date;
  lastUsed?: Date;
  
  // License information
  licenseId?: string;
  licenseStatus: 'active' | 'expired' | 'suspended';
  licenseExpiresAt?: Date;
  
  // Usage tracking
  usageCount: number;
  lastUsageDate?: Date;
  
  // Installation settings
  isActive: boolean;
  installationNotes?: string;
}

export interface CreatePackageInstallation {
  packageId: string;
  licenseType: LicenseType;
  paymentDetails?: PaymentDetails;
}

// ============================================================================
// LICENSING AND PAYMENTS
// ============================================================================

export interface PackageLicense {
  id: string;
  packageId: string;
  tenantId: string;
  userId: string;
  
  // License details
  licenseType: LicenseType;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  
  // Subscription details (if applicable)
  subscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  
  // Usage tracking (for usage-based licenses)
  usageLimit?: number;
  usageCount: number;
  usageResetDate?: Date;
  
  // Payment
  totalPaid: number;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDetails {
  amount: number;
  currency: string;
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer';
  transactionId?: string;
}

// ============================================================================
// MARKETPLACE BROWSING
// ============================================================================

export interface PackageSearchQuery {
  query?: string;
  category?: PackageCategory;
  licenseType?: LicenseType;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  authorId?: string;
  sortBy?: 'name' | 'downloads' | 'rating' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PackageSearchResult {
  packages: MarketplacePackage[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// PACKAGE VALIDATION
// ============================================================================

export interface PackageValidationResult {
  isValid: boolean;
  errors: PackageValidationError[];
  warnings: PackageValidationWarning[];
}

export interface PackageValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PackageValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// MARKETPLACE ANALYTICS
// ============================================================================

export interface PackageAnalytics {
  packageId: string;
  
  // Download metrics
  totalDownloads: number;
  downloadsThisMonth: number;
  downloadsThisWeek: number;
  
  // Revenue metrics (if paid)
  totalRevenue: number;
  revenueThisMonth: number;
  
  // Usage metrics
  activeInstallations: number;
  totalUsageCount: number;
  
  // Rating metrics
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { [key: number]: number }; // 1-5 star distribution
  
  // Geographic distribution
  downloadsByCountry: { [country: string]: number };
  
  // Time series data
  downloadsOverTime: { date: string; count: number }[];
  revenueOverTime: { date: string; amount: number }[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface MarketplaceApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PackagePublishResponse {
  packageId: string;
  publishedAt: Date;
  marketplaceUrl: string;
}

export interface PackageInstallResponse {
  installationId: string;
  installedComponents: {
    rules: string[];
    classes: string[];
    tables: string[];
    workflows: string[];
  };
  licenseId?: string;
}
