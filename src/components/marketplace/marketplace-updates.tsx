/**
 * Updates Component - Mac App Store Style
 * 
 * Features:
 * - Available updates list
 * - Update all functionality
 * - Recently updated packages
 * - Clean Mac App Store inspired design
 */

'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActionQuery } from '@/hooks/use-action-api';
import { 
  Download, Package, CheckCircle, Clock, 
  RefreshCw, Star, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/hooks/useToast';
import { 
  PackageInstallation,
  MarketplacePackageWithDetails
} from '@/features/marketplace/types/enhanced';

interface MarketplaceUpdatesProps {
  onPackageSelect?: (packageId: string) => void;
}

export function MarketplaceUpdates({ onPackageSelect }: MarketplaceUpdatesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available updates via action-system (requires marketplace.updates action)
  const { data: updatesResponse, isActuallyLoading: loadingUpdates } = useActionQuery<PackageInstallation[]>(
    'marketplace.updates',
    {},
    { skipCache: true }
  );
  const availableUpdates = updatesResponse?.data || [];

  // Fetch recently updated installations via action-system
  const { data: recentResponse, isActuallyLoading: loadingRecent } = useActionQuery<PackageInstallation[]>(
    'packageInstallations.list',
    { filters: { recentlyUpdated: true }, limit: 5 },
    { skipCache: true }
  );
  const recentlyUpdated = recentResponse?.data || [];

  // Star/unstar via shared hook (action-system under the hood)
  const { handleStar } = require('./shared/use-package-star');

  // handleStar provided by shared hook

  const renderUpdateRow = (installation: PackageInstallation) => {
    const pkg = installation.package;
    if (!pkg) return null;

    const isStarred = pkg.isStarred || false;

    return (
      <div 
        key={installation.id} 
        className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group border-b border-gray-100 dark:border-gray-800 last:border-b-0 cursor-pointer"
        onClick={() => onPackageSelect?.(installation.packageId)}
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
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          {/* Package Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                {pkg.name}
              </h3>
              <Badge className="bg-orange-100 text-orange-800 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Update Available
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {pkg.description}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Current: v{installation.version}</span>
              <span>→</span>
              <span className="font-medium text-blue-600">Latest: v{pkg.version}</span>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Released {new Date(pkg.updatedAt).toLocaleDateString()}</span>
              </div>
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
              handleStar(installation.packageId, isStarred);
            }}
            className={`p-2 ${isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
          >
            <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
          </Button>
          
          <Button 
            size="sm" 
            className="px-4"
            onClick={(e) => {
              e.stopPropagation();
              // Add update handler here
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Update
          </Button>
        </div>
      </div>
    );
  };

  const renderRecentRow = (installation: PackageInstallation) => {
    const pkg = installation.package;
    if (!pkg) return null;

    return (
      <div 
        key={installation.id} 
        className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer"
        onClick={() => onPackageSelect?.(installation.packageId)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {pkg.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Updated to v{installation.version} • {new Date(installation.updatedAt || installation.installationDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // This could open management instead of details
          }}
        >
          Open
        </Button>
      </div>
    );
  };

  if (loadingUpdates && loadingRecent) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Available Updates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {availableUpdates?.length || 0} updates available
            </p>
          </div>
          {availableUpdates && availableUpdates.length > 0 && (
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update All
            </Button>
          )}
        </div>

        {availableUpdates && availableUpdates.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {availableUpdates.map(renderUpdateRow)}
          </div>
        ) : (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All packages are up to date</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your installed packages are running the latest versions
            </p>
          </div>
        )}
      </section>

      {/* Recently Updated */}
      {recentlyUpdated && recentlyUpdated.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Updated Recently</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Packages you've updated in the past week
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {recentlyUpdated.map(renderRecentRow)}
          </div>
        </section>
      )}
    </div>
  );
}
