/**
 * Marketplace Dashboard - Under 300 Lines
 * 
 * Demonstrates the power of reusable components and consolidated APIs:
 * - Uses consolidated dashboard API (1 call vs 8+ calls)
 * - Leverages reusable PackageRow component
 * - Consistent loading and empty states
 * - Clean, maintainable code under 300 lines
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Award, TrendingUp, Star, Clock } from 'lucide-react';
import { PackageRow } from './shared/package-row';
import { LoadingState } from './shared/loading-state';
import { EmptyState } from './shared/empty-state';
import { useMarketplaceDashboard } from './shared/use-marketplace-data';
import { MarketplacePackageWithDetails, PackageInstallation } from '@/features/marketplace/types/enhanced';

interface MarketplaceDashboardProps {
  onPackageSelect?: (packageId: string) => void;
}

export function MarketplaceDashboard({ onPackageSelect }: MarketplaceDashboardProps) {
  const { data: dashboardData, isLoading, error } = useMarketplaceDashboard();

  const handleInstallPackage = (packageId: string) => {
    // TODO: Implement install logic
    console.log('Install package:', packageId);
  };

  const handleUpdatePackage = (packageId: string) => {
    // TODO: Implement update logic
    console.log('Update package:', packageId);
  };

  const handleManagePackage = (packageId: string) => {
    // TODO: Implement manage logic
    console.log('Manage package:', packageId);
  };

  if (isLoading) {
    return <LoadingState type="dashboard" />;
  }

  if (error) {
    return (
      <EmptyState
        type="error"
        title="Failed to load dashboard"
        description="Please try refreshing the page."
        actionLabel="Retry"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (!dashboardData) {
    return (
      <EmptyState
        type="packages"
        title="No dashboard data available"
        description="Unable to load marketplace information."
      />
    );
  }

  const {
    featured = [],
    trending = [],
    starred = [],
    recentInstallations = [],
    metrics = {}
  } = dashboardData;

  const renderSection = (
    title: string,
    description: string,
    packages: MarketplacePackageWithDetails[],
    installations: PackageInstallation[] = [],
    icon: React.ComponentType<{ className?: string }>,
    iconColor: string,
    showAllLabel = 'See All'
  ) => {
    const items = packages.length > 0 ? packages : installations;
    
    if (items.length === 0) return null;

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${iconColor}`}>
              {React.createElement(icon, { className: 'h-5 w-5 text-white' })}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {description}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600">
            {showAllLabel}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
          {items.slice(0, 4).map((item: any) => (
            <PackageRow
              key={item.id}
              package={packages.length > 0 ? item : undefined}
              installation={installations.length > 0 ? item : undefined}
              variant="compact"
              showDescription={false}
              showMetrics={true}
              onPackageSelect={onPackageSelect}
              onInstall={handleInstallPackage}
              onUpdate={handleUpdatePackage}
              onManage={handleManagePackage}
              additionalInvalidationKeys={[['marketplace-dashboard']]}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to the Marketplace</h1>
        <p className="text-blue-100 mb-6 max-w-2xl">
          Discover, install, and manage business logic packages to accelerate your development
        </p>
        <div className="flex items-center space-x-4">
          <Button 
            variant="secondary" 
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            Browse Packages
          </Button>
          <Button 
            variant="outline" 
            className="border-white/30 text-white hover:bg-white/10"
          >
            My Packages
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">
              {recentInstallations?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Installed</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-purple-600">
              {starred?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Starred</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-green-600">
              {featured?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Available</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-orange-600">
              {metrics.averageRating?.toFixed(1) || '4.8'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Avg Rating</div>
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      {renderSection(
        'Great New Business Logic Packages',
        'Curated packages to boost your productivity',
        featured,
        [],
        Award,
        'from-purple-500 to-pink-500'
      )}

      {/* Trending Packages */}
      {renderSection(
        'Trending This Week',
        'Popular packages gaining momentum',
        trending,
        [],
        TrendingUp,
        'from-orange-500 to-red-500'
      )}

      {/* Starred Packages */}
      {starred.length > 0 && renderSection(
        'Your Starred Packages',
        'Packages you\'ve saved for later',
        starred,
        [],
        Star,
        'from-yellow-500 to-orange-500',
        'View All'
      )}

      {/* Recent Installations */}
      {recentInstallations.length > 0 && renderSection(
        'Recently Installed',
        'Your latest package installations',
        [],
        recentInstallations,
        Clock,
        'from-green-500 to-emerald-500',
        'View All'
      )}

      {/* Empty State for New Users */}
      {featured.length === 0 && trending.length === 0 && starred.length === 0 && (
        <EmptyState
          type="packages"
          title="Welcome to the Marketplace!"
          description="Start by browsing our featured packages or search for specific functionality."
          actionLabel="Browse Packages"
          onAction={() => {/* Navigate to browse */}}
        />
      )}
    </div>
  );
}
