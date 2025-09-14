/**
 * Enhanced Marketplace Types - Incredible UI Support
 * 
 * Comprehensive type definitions for the advanced marketplace system
 * including installations, reviews, analytics, and discovery features.
 */

export interface PackageInstallation {
  id: string;
  packageId: string;
  tenantId: string;
  userId: string;
  version: string;
  status: PackageInstallationStatus;
  installationDate: string;
  lastUpdated: string;
  
  // Installation metadata
  installationSize?: number;
  installationTime?: number;
  errorMessage?: string;
  rollbackAvailable: boolean;
  
  // Dependencies and conflicts
  dependencies: string[];
  conflicts: string[];
  
  // Usage tracking
  lastUsed?: string;
  usageCount: number;
  
  // Relations
  package?: MarketplacePackageWithDetails;
}

export interface PackageReview {
  id: string;
  packageId: string;
  userId: string;
  tenantId: string;
  rating: number; // 1-5 stars
  title?: string;
  content?: string;
  isVerified: boolean;
  isHelpful: number;
  
  // Review metadata
  version: string;
  createdAt: string;
  updatedAt: string;
  
  // Moderation
  isModerated: boolean;
  isFlagged: boolean;
  moderatedBy?: string;
  moderatedAt?: string;
  
  // Relations
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface PackageAnalytics {
  id: string;
  packageId: string;
  
  // Download and installation metrics
  totalDownloads: number;
  weeklyDownloads: number;
  monthlyDownloads: number;
  activeInstallations: number;
  
  // Success metrics
  installationSuccess: number; // 0-1
  averageRating: number;
  totalReviews: number;
  
  // Revenue metrics
  totalRevenue: number;
  monthlyRevenue: number;
  conversionRate: number;
  
  // Usage metrics
  averageUsagePerWeek: number;
  retentionRate: number;
  
  // Quality metrics
  securityScore: number; // 0-100
  codeQualityScore: number; // 0-100
  documentationScore: number; // 0-100
  
  // Timestamps
  lastUpdated: string;
  createdAt: string;
}

export interface PackageDependency {
  id: string;
  packageId: string;
  dependsOnId: string;
  versionConstraint?: string;
  isOptional: boolean;
  reason?: string;
  createdAt: string;
  
  // Relations
  dependsOn?: MarketplacePackageWithDetails;
}

export interface PackageCollection {
  id: string;
  name: string;
  description?: string;
  isOfficial: boolean;
  isFeatured: boolean;
  
  // Metadata
  iconUrl?: string;
  bannerUrl?: string;
  color?: string;
  sortOrder: number;
  
  // Ownership
  createdBy: string;
  tenantId?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Relations
  packages?: PackageCollectionItem[];
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface PackageCollectionItem {
  id: string;
  collectionId: string;
  packageId: string;
  sortOrder: number;
  addedAt: string;
  
  // Relations
  package?: MarketplacePackageWithDetails;
}

export interface PackagePreview {
  id: string;
  packageId: string;
  
  // Preview content
  demoData?: any;
  screenshots: string[];
  videoUrl?: string;
  
  // Component previews
  ruleExamples: RuleExample[];
  workflowExamples: WorkflowExample[];
  tableExamples: TableExample[];
  
  // Interactive demo
  playgroundUrl?: string;
  sandboxConfig?: any;
  
  // Documentation
  quickStart?: string;
  useCases: UseCase[];
  
  createdAt: string;
  updatedAt: string;
}

export interface RuleExample {
  id: string;
  title: string;
  description: string;
  code: string;
  language: 'business-rules' | 'python';
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
}

export interface WorkflowExample {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  category: string;
  estimatedTime: number; // minutes
  tags: string[];
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  type: 'action' | 'condition' | 'loop' | 'parallel';
  config: any;
}

export interface TableExample {
  id: string;
  title: string;
  description: string;
  schema: TableSchema;
  sampleData: any[];
  category: string;
  tags: string[];
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
  indexes: TableIndex[];
  relationships: TableRelationship[];
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  description?: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface TableRelationship {
  name: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  targetTable: string;
  foreignKey: string;
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  industry?: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedSetupTime: number; // minutes
  benefits: string[];
  requirements: string[];
  tags: string[];
}

// Enhanced marketplace package with all relations
export interface MarketplacePackageWithDetails {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  
  // Visual assets
  iconUrl?: string;
  bannerUrl?: string;
  
  // Licensing
  licenseType: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION' | 'USAGE_BASED';
  price?: number;
  subscriptionInterval?: 'monthly' | 'quarterly' | 'yearly';
  usageUnit?: 'execution' | 'api_call' | 'record' | 'user';
  
  // Publishing
  isPublic: boolean;
  allowedTenants: string[];
  publishingNotes?: string;
  
  // Copy protection
  allowExport: boolean;
  requiresLicense: boolean;
  
  // Component selection
  selectedRules: string[];
  selectedClasses: string[];
  selectedTables: string[];
  selectedWorkflows: string[];
  
  // Metadata
  authorId: string;
  tenantId: string;
  downloadCount: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  
  // Enhanced relations
  installations?: PackageInstallation[];
  reviews?: PackageReview[];
  analytics?: PackageAnalytics;
  dependencies?: PackageDependency[];
  dependents?: PackageDependency[];
  preview?: PackagePreview;
  
  // Computed fields
  isInstalled?: boolean;
  canInstall?: boolean;
  hasUpdates?: boolean;
  isStarred?: boolean;
  installationStatus?: PackageInstallationStatus;
  compatibilityScore?: number; // 0-100
  recommendationScore?: number; // 0-100
}

// Installation and management types
export enum PackageInstallationStatus {
  PENDING = 'PENDING',
  INSTALLING = 'INSTALLING',
  INSTALLED = 'INSTALLED',
  FAILED = 'FAILED',
  UPDATING = 'UPDATING',
  UNINSTALLING = 'UNINSTALLING',
  UNINSTALLED = 'UNINSTALLED'
}

export interface InstallationRequest {
  packageId: string;
  version?: string;
  acceptDependencies?: boolean;
  installOptionalDependencies?: boolean;
  overrideConflicts?: boolean;
}

export interface InstallationResult {
  success: boolean;
  packageId: string;
  version: string;
  installationId: string;
  message?: string;
  dependencies?: string[];
  conflicts?: string[];
  warnings?: string[];
  installationTime?: number;
  installationSize?: number;
}

// Discovery and recommendation types
export interface DiscoverySection {
  id: string;
  title: string;
  description?: string;
  type: 'featured' | 'trending' | 'recommended' | 'new' | 'popular' | 'collection';
  packages: MarketplacePackageWithDetails[];
  metadata?: {
    algorithm?: string;
    refreshInterval?: number;
    maxItems?: number;
  };
}

export interface RecommendationContext {
  userId: string;
  tenantId: string;
  currentPackages: string[];
  recentActivity: string[];
  industry?: string;
  teamSize?: number;
  useCases?: string[];
}

export interface SearchFilters {
  query?: string;
  category?: string;
  licenseType?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  compatibility?: string[];
  tags?: string[];
  author?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface SearchResult {
  packages: MarketplacePackageWithDetails[];
  totalCount: number;
  facets: SearchFacets;
  suggestions?: string[];
  relatedQueries?: string[];
}

export interface SearchFacets {
  categories: FacetCount[];
  licenseTypes: FacetCount[];
  priceRanges: FacetCount[];
  ratings: FacetCount[];
  tags: FacetCount[];
  authors: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
  selected: boolean;
}

// UI state types
export interface MarketplaceUIState {
  viewMode: 'grid' | 'list' | 'detailed';
  sortBy: 'name' | 'rating' | 'downloads' | 'updated' | 'created' | 'price';
  sortDirection: 'asc' | 'desc';
  filters: SearchFilters;
  selectedPackages: string[];
  showPreview: boolean;
  previewPackageId?: string;
  showInstallationModal: boolean;
  installationPackageId?: string;
}

// Analytics and metrics types
export interface MarketplaceMetrics {
  totalPackages: number;
  totalDownloads: number;
  totalRevenue: number;
  averageRating: number;
  topCategories: CategoryMetric[];
  topAuthors: AuthorMetric[];
  recentActivity: ActivityMetric[];
  growthMetrics: GrowthMetric[];
}

export interface CategoryMetric {
  category: string;
  packageCount: number;
  downloadCount: number;
  revenue: number;
  averageRating: number;
}

export interface AuthorMetric {
  authorId: string;
  authorName: string;
  packageCount: number;
  totalDownloads: number;
  averageRating: number;
  revenue: number;
}

export interface ActivityMetric {
  date: string;
  downloads: number;
  installations: number;
  revenue: number;
  newPackages: number;
}

export interface GrowthMetric {
  period: 'daily' | 'weekly' | 'monthly';
  downloads: number;
  installations: number;
  revenue: number;
  newUsers: number;
  changePercent: number;
}
