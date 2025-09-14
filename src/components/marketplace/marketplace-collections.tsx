/**
 * Collections Component - Mac App Store Style
 * 
 * Features:
 * - Starred packages collection
 * - Custom collections management
 * - Clean Mac App Store inspired design
 */

'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Star, Heart, Package, Plus, Eye, 
  Users, Award, Search, Grid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/hooks/useToast';
import { 
  MarketplacePackageWithDetails,
  PackageCollection
} from '@/features/marketplace/types/enhanced';

interface MarketplaceCollectionsProps {
  onPackageSelect?: (packageId: string) => void;
}

export function MarketplaceCollections({ onPackageSelect }: MarketplaceCollectionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch starred packages
  const { data: starredPackages, isLoading: loadingStarred } = useQuery({
    queryKey: ['marketplace-starred'],
    queryFn: async (): Promise<MarketplacePackageWithDetails[]> => {
      const response = await fetch('/api/marketplace/starred');
      if (!response.ok) throw new Error('Failed to fetch starred packages');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Fetch user collections
  const { data: collections, isLoading: loadingCollections } = useQuery({
    queryKey: ['package-collections'],
    queryFn: async (): Promise<PackageCollection[]> => {
      const response = await fetch('/api/marketplace/collections');
      if (!response.ok) throw new Error('Failed to fetch collections');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Star/unstar mutation
  const starMutation = useMutation({
    mutationFn: async ({ packageId, starred }: { packageId: string; starred: boolean }) => {
      const response = await fetch(`/api/marketplace/packages/${packageId}/star`, {
        method: starred ? 'POST' : 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to update star status');
      return response.json();
    },
    onSuccess: (_, { starred }) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-starred'] });
      toast({
        title: starred ? 'Package starred' : 'Package unstarred',
        description: starred ? 'Added to your starred packages' : 'Removed from starred packages',
      });
    },
  });

  const handleStar = (packageId: string, currentlyStarred: boolean) => {
    starMutation.mutate({ packageId, starred: !currentlyStarred });
  };

  const renderStarredPackage = (pkg: MarketplacePackageWithDetails) => {
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
                className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {/* Package Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {pkg.name}
              </h4>
              <Badge variant="secondary" className="text-xs">
                v{pkg.version}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {pkg.description}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{pkg.analytics?.averageRating?.toFixed(1) || '0.0'}</span>
              </div>
              {pkg.licenseType === 'FREE' && (
                <Badge variant="outline" className="text-xs">Free</Badge>
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
              handleStar(pkg.id, true);
            }}
            className="p-2 text-yellow-500"
          >
            <Star className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </div>
    );
  };

  const renderCollection = (collection: PackageCollection) => {
    return (
      <div 
        key={collection.id} 
        className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center space-x-3 mb-3">
          {collection.iconUrl ? (
            <img src={collection.iconUrl} alt="" className="w-8 h-8 rounded" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {collection.name}
            </h3>
            {collection.isOfficial && (
              <Badge variant="secondary" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                Official
              </Badge>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {collection.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{collection.packages?.length || 0} packages</span>
          <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
        </div>

        <Button variant="outline" size="sm" className="w-full">
          <Eye className="h-4 w-4 mr-2" />
          View Collection
        </Button>
      </div>
    );
  };

  if (loadingStarred && loadingCollections) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Starred Packages */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Starred Packages
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Packages you've saved for later
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {starredPackages?.length || 0} starred
          </div>
        </div>

        {starredPackages && starredPackages.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {starredPackages.map(renderStarredPackage)}
          </div>
        ) : (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No starred packages yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Star packages while browsing to save them for later
            </p>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Browse Packages
            </Button>
          </div>
        )}
      </section>

      {/* Collections */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Package Collections
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Curated collections and your custom lists
              </p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Collection
          </Button>
        </div>

        {collections && collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map(renderCollection)}
          </div>
        ) : (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Create collections to organize your favorite packages
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Collection
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
