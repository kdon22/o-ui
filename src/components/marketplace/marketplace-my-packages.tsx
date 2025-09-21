/**
 * My Packages Component - Mac App Store Style
 * 
 * Features:
 * - Clean list of installed packages
 * - Update management
 * - Package management actions
 * - Star functionality for favorites
 */

'use client';

import React from 'react';
import { 
  Package, Download, Star, Settings, Trash2, 
  CheckCircle, AlertCircle, Clock, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/hooks/useToast';
import { 
  PackageInstallation,
  PackageInstallationStatus
} from '@/features/marketplace/types/enhanced';
import { useActionQuery } from '@/hooks/use-action-api';

interface MarketplaceMyPackagesProps {
  onPackageSelect?: (packageId: string) => void;
}

export function MarketplaceMyPackages({ onPackageSelect }: MarketplaceMyPackagesProps) {
  const { toast } = useToast();

  // Fetch installed packages via action-system (DB-only)
  const { data: installationsResponse, isActuallyLoading: isLoading } = useActionQuery<PackageInstallation[]>(
    'packageInstallations.list',
    { filters: {} },
    { skipCache: true }
  );
  const installedPackages = installationsResponse?.data || [];

  // Star/unstar via shared hook (action-system under the hood)
  const { handleStar } = require('./shared/use-package-star');

  // handleStar provided by shared hook

  const renderPackageRow = (installation: PackageInstallation) => {
    const pkg = installation.package;
    if (!pkg) return null;

    const isStarred = pkg.isStarred || false;
    const hasUpdates = pkg.hasUpdates || false;

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
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
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
              <Badge className="bg-green-100 text-green-800 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Installed
              </Badge>
              {hasUpdates && (
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Update Available
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {pkg.description}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <span>Version {installation.version}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Installed {new Date(installation.installationDate).toLocaleDateString()}</span>
              </div>
              {installation.lastUsed && (
                <div className="flex items-center space-x-1">
                  <span>Last used {new Date(installation.lastUsed).toLocaleDateString()}</span>
                </div>
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
              handleStar(installation.packageId, isStarred);
            }}
            className={`p-2 ${isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
          >
            <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
          </Button>
          
          {hasUpdates ? (
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
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // This could open a management modal instead of package details
              }}
              className="px-4"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Packages</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your installed packages and check for updates
          </p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {installedPackages?.length || 0} packages installed
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search your packages..."
          className="pl-10"
        />
      </div>

      {/* Packages List */}
      {installedPackages && installedPackages.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
          {installedPackages.map(renderPackageRow)}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No packages installed</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Get started by browsing and installing your first package
          </p>
          <Button>
            <Search className="h-4 w-4 mr-2" />
            Browse Packages
          </Button>
        </div>
      )}
    </div>
  );
}
