/**
 * Marketplace Browse Component - Mac App Store Style
 * 
 * Features:
 * - Clean Mac App Store inspired design
 * - Star/favorite functionality for saving packages
 * - Content-first layout without heavy cards
 * - Advanced filtering and search
 * - Installation management
 * - Mobile-responsive design
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { 
  Search, Filter, Grid, List, Star, Download, Users, Tag, 
  Play, Eye, Heart, Zap, TrendingUp, Award, Shield, 
  ChevronRight, ExternalLink, Clock, CheckCircle, AlertCircle,
  Package, Code, Database, Workflow, Settings, ArrowRight,
  Sparkles, Target, Layers, Globe, Lock, Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, MultiSelect } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/hooks/useToast';
import { PackagePreviewModal } from './package-preview-modal';
import { InstallationPreviewModal } from './installation-preview-modal';
import { InstallationProgressModal } from './installation-progress-modal';
import { 
  MarketplacePackageWithDetails, 
  PackageInstallation, 
  DiscoverySection,
  SearchFilters,
  PackageInstallationStatus,
  InstallationRequest 
} from '@/features/marketplace/types/enhanced';

interface MarketplaceBrowseProps {
  onPackageSelect?: (packageId: string) => void;
  showPublicOnly?: boolean;
  category?: string;
}

const DISCOVERY_SECTIONS = [
  { id: 'featured', title: 'Featured Packages', icon: Award, color: 'from-purple-500 to-pink-500' },
  { id: 'trending', title: 'Trending This Week', icon: TrendingUp, color: 'from-orange-500 to-red-500' },
  { id: 'recommended', title: 'Recommended for You', icon: Target, color: 'from-blue-500 to-cyan-500' },
  { id: 'new', title: 'New Releases', icon: Sparkles, color: 'from-green-500 to-emerald-500' },
  { id: 'popular', title: 'Most Downloaded', icon: Download, color: 'from-indigo-500 to-purple-500' }
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Globe },
  { value: 'validation', label: 'Validation & Rules', icon: Shield },
  { value: 'utilities', label: 'Utilities & Helpers', icon: Settings },
  { value: 'workflows', label: 'Workflows & Processes', icon: Workflow },
  { value: 'integrations', label: 'Integrations & APIs', icon: Layers },
  { value: 'travel', label: 'Travel & Booking', icon: Globe },
  { value: 'finance', label: 'Finance & Payments', icon: Target },
  { value: 'compliance', label: 'Compliance & Legal', icon: Lock },
  { value: 'analytics', label: 'Analytics & Reporting', icon: TrendingUp }
];

const LICENSE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'FREE', label: 'Free', color: 'green' },
  { value: 'ONE_TIME', label: 'One-Time Purchase', color: 'blue' },
  { value: 'SUBSCRIPTION', label: 'Subscription', color: 'purple' },
  { value: 'USAGE_BASED', label: 'Usage-Based', color: 'orange' }
];

export function MarketplaceBrowse({ 
  onPackageSelect, 
  showPublicOnly = false,
  category 
}: MarketplaceBrowseProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(category ? [category] : []);
  const [selectedLicenseTypes, setSelectedLicenseTypes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [previewPackageId, setPreviewPackageId] = useState<string | null>(null);
  
  // Installation Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showInstallPreviewModal, setShowInstallPreviewModal] = useState(false);
  const [showInstallProgressModal, setShowInstallProgressModal] = useState(false);
  const [installPackageId, setInstallPackageId] = useState<string | null>(null);
  const [installationOptions, setInstallationOptions] = useState<any>(null);

  // Star/unstar via standard update action
  const starMutation = useActionMutation('marketplacePackages.update', {
    ...( {} as any ),
    onSuccess: (_res: any, variables: any) => {
      const starred = Boolean(variables?.isStarred);
      queryClient.invalidateQueries({ queryKey: ['marketplace-packages'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-starred'] });
      toast({
        title: starred ? 'Package starred' : 'Package unstarred',
        description: starred ? 'Added to your starred packages' : 'Removed from starred packages',
      });
    },
  });

  // Derive discovery sections from packages list (no custom action required)
  let discoverySections: DiscoverySection[] = [];
  let loadingDiscovery = false;

  // Fetch marketplace packages via action-system
  const { data: packagesResponse, isActuallyLoading: isLoading, error } = useActionQuery<MarketplacePackageWithDetails[]>(
    'marketplacePackages.list',
    {
      filters: {
        search: searchTerm || undefined,
        categories: selectedCategories,
        licenseTypes: selectedLicenseTypes,
        showPublicOnly: showPublicOnly ? true : undefined
      },
      include: { analytics: true, reviews: true, installations: true },
      limit: 500
    },
    { staleTime: 2 * 60 * 1000 }
  );
  const packages = (packagesResponse?.data as any[]) || [];

  // Build simple discovery sections locally
  if (!searchTerm && Array.isArray(packages) && packages.length > 0) {
    const topN = (arr: any[], n: number) => arr.slice(0, Math.min(arr.length, n));

    const featured = topN(
      [...packages].filter((p: any) => p.isActive && (p.analytics?.averageRating || 0) >= 4)
        .sort((a: any, b: any) => (b.analytics?.averageRating || 0) - (a.analytics?.averageRating || 0)),
      6
    );

    const trending = topN(
      [...packages].filter((p: any) => p.isActive && (p.analytics?.weeklyDownloads || 0) > 0)
        .sort((a: any, b: any) => (b.analytics?.weeklyDownloads || 0) - (a.analytics?.weeklyDownloads || 0)),
      6
    );

    const newly = topN(
      [...packages].filter((p: any) => p.isActive)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      6
    );

    const recommended: any[] = [];

    discoverySections = [
      { id: 'featured', title: 'Featured Packages', description: 'Hand-picked packages recommended by our team', type: 'featured', packages: featured, metadata: { totalCount: featured.length, displayCount: featured.length, refreshedAt: new Date().toISOString() } },
      { id: 'trending', title: 'Trending This Week', description: 'Popular packages gaining momentum', type: 'trending', packages: trending, metadata: { totalCount: trending.length, displayCount: trending.length, refreshedAt: new Date().toISOString() } },
      { id: 'recommended', title: 'Recommended for You', description: 'Based on your installed packages', type: 'recommended', packages: recommended, metadata: { totalCount: recommended.length, displayCount: recommended.length, refreshedAt: new Date().toISOString() } },
      { id: 'new', title: 'New Releases', description: 'Recently published packages', type: 'new', packages: newly, metadata: { totalCount: newly.length, displayCount: newly.length, refreshedAt: new Date().toISOString() } }
    ];
  }


  // Filter and sort packages
  const filteredPackages = useMemo(() => {
    if (!packages || !Array.isArray(packages)) return [];
    
    let filtered = packages;
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.analytics?.averageRating || 0) - (a.analytics?.averageRating || 0);
        case 'downloads':
          return (b.analytics?.totalDownloads || 0) - (a.analytics?.totalDownloads || 0);
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [packages, sortBy]);

  const handleInstallPackage = useCallback((packageId: string) => {
    setInstallPackageId(packageId);
    setShowInstallPreviewModal(true);
  }, []);

  const handlePackagePreview = useCallback((packageId: string) => {
    setPreviewPackageId(packageId);
    setShowPreviewModal(true);
  }, []);

  const handleInstallWithOptions = useCallback((packageId: string, options: any) => {
    setInstallationOptions(options);
    setShowInstallPreviewModal(false);
    setShowInstallProgressModal(true);
  }, []);

  const handleInstallationComplete = useCallback((result: any) => {
    setShowInstallProgressModal(false);
    setInstallPackageId(null);
    setInstallationOptions(null);
    
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['marketplace-packages'] });
    }
  }, [queryClient]);

  const handleStar = useCallback((packageId: string, currentlyStarred: boolean) => {
    starMutation.mutate({ id: packageId, isStarred: !currentlyStarred } as any);
  }, [starMutation]);

  const renderPackageCard = (pkg: MarketplacePackageWithDetails) => {
    const isInstalled = pkg.installationStatus === PackageInstallationStatus.INSTALLED;
    const isInstalling = pkg.installationStatus === PackageInstallationStatus.INSTALLING;
    const hasUpdates = pkg.hasUpdates;
    const isStarred = pkg.isStarred || false;
    const categoryInfo = CATEGORIES.find(c => c.value === pkg.category);
    const licenseInfo = LICENSE_TYPES.find(l => l.value === pkg.licenseType);

    return (
      <div 
        key={pkg.id} 
        className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group border-b border-gray-100 dark:border-gray-800 last:border-b-0 cursor-pointer"
        onClick={() => onPackageSelect?.(pkg.id)}
      >
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Package Icon */}
          <div className="flex-shrink-0">
            {pkg.iconUrl ? (
              <img 
                src={pkg.iconUrl} 
                alt={pkg.name}
                className="w-16 h-16 rounded-xl border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                {categoryInfo?.icon ? (
                  <categoryInfo.icon className="h-8 w-8 text-white" />
                ) : (
                  <Package className="h-8 w-8 text-white" />
                )}
              </div>
            )}
          </div>

          {/* Package Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                {pkg.name}
              </h3>
              {isInstalled && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Installed
                </Badge>
              )}
              {hasUpdates && (
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Update
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
              {pkg.description}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{pkg.analytics?.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-400">
                  ({pkg.analytics?.totalReviews || 0})
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Download className="h-3 w-3" />
                <span>{pkg.analytics?.totalDownloads?.toLocaleString() || '0'}</span>
              </div>
              {pkg.licenseType === 'FREE' ? (
                <Badge variant="outline" className="text-xs">Free</Badge>
              ) : (
                <span className="font-medium text-green-600">
                  ${pkg.price}
                  {pkg.subscriptionInterval && `/${pkg.subscriptionInterval}`}
                </span>
              )}
            </div>

            {/* Component Types */}
            <div className="flex flex-wrap gap-1 mt-2">
              {pkg.selectedRules.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Code className="h-3 w-3 mr-1" />
                  {pkg.selectedRules.length} Rules
                </Badge>
              )}
              {pkg.selectedWorkflows.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Workflow className="h-3 w-3 mr-1" />
                  {pkg.selectedWorkflows.length} Workflows
                </Badge>
              )}
              {pkg.selectedTables.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  {pkg.selectedTables.length} Tables
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleStar(pkg.id, isStarred);
            }}
            className={`p-2 ${isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
          >
            <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
          </Button>
          
          {!isInstalled ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleInstallPackage(pkg.id);
              }}
              disabled={isInstalling}
              className="px-6"
            >
              {isInstalling ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Installing...
                </>
              ) : (
                'Get'
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // For installed packages, clicking the button should open management, not details
                // You can add a separate management handler here if needed
              }}
              className="px-4"
            >
              Open
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderDiscoverySection = (section: DiscoverySection) => {
    const SectionIcon = DISCOVERY_SECTIONS.find(s => s.id === section.type)?.icon || Package;
    const sectionColor = DISCOVERY_SECTIONS.find(s => s.id === section.type)?.color || 'from-gray-400 to-gray-500';

    return (
      <section key={section.id} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${sectionColor}`}>
              <SectionIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
              {section.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{section.description}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600">
            See All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
          {section.packages.slice(0, 6).map(renderPackageCard)}
        </div>
      </section>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load packages</h3>
          <p className="text-gray-600 dark:text-gray-300">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Discover and install business logic packages to accelerate your development
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search packages, categories, or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <MultiSelect 
            value={selectedCategories} 
            onValueChange={setSelectedCategories}
            placeholder="All Categories"
            className="w-48"
          >
            {CATEGORIES.filter(cat => cat.value !== 'all').map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center space-x-2">
                  <category.icon className="h-4 w-4" />
                  <span>{category.label}</span>
                </div>
              </SelectItem>
            ))}
          </MultiSelect>

          <MultiSelect 
            value={selectedLicenseTypes} 
            onValueChange={setSelectedLicenseTypes}
            placeholder="All License Types"
            className="w-48"
          >
            {LICENSE_TYPES.filter(license => license.value !== 'all').map((license) => (
              <SelectItem key={license.value} value={license.value}>
                {license.label}
              </SelectItem>
            ))}
          </MultiSelect>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="downloads">Downloads</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="created">Newest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Discovery Sections */}
      {!searchTerm && discoverySections && discoverySections.length > 0 && (
        <div className="space-y-8">
          {loadingDiscovery ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-80" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            discoverySections.map(renderDiscoverySection)
          )}
        </div>
      )}

      {/* All Packages Grid */}
      {(searchTerm || !discoverySections?.length) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'All Packages'}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {filteredPackages.length} packages found
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : filteredPackages.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {filteredPackages.map(renderPackageCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No packages found</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Package Preview Modal */}
    <PackagePreviewModal
      packageId={previewPackageId}
      isOpen={showPreviewModal}
      onClose={() => {
        setShowPreviewModal(false);
        setPreviewPackageId(null);
      }}
      onInstall={handleInstallPackage}
    />

    {/* Installation Preview Modal */}
    <InstallationPreviewModal
      packageId={installPackageId}
      isOpen={showInstallPreviewModal}
      onClose={() => {
        setShowInstallPreviewModal(false);
        setInstallPackageId(null);
      }}
      onInstall={handleInstallWithOptions}
    />

    {/* Installation Progress Modal */}
    <InstallationProgressModal
      packageId={installPackageId}
      packageName={packages?.find(p => p.id === installPackageId)?.name}
      isOpen={showInstallProgressModal}
      onClose={() => setShowInstallProgressModal(false)}
      onComplete={handleInstallationComplete}
      installationOptions={installationOptions}
    />
    </>
  );
}