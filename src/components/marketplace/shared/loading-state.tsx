/**
 * LoadingState Component - Consistent Loading State Display
 * 
 * Provides consistent loading state rendering across marketplace components.
 * Supports different loading patterns for various content types.
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/generalUtils';

interface LoadingStateProps {
  type?: 'packages' | 'dashboard' | 'detail' | 'list' | 'grid' | 'metrics';
  count?: number;
  className?: string;
}

export function LoadingState({ 
  type = 'packages', 
  count = 6,
  className 
}: LoadingStateProps) {
  const renderPackageRowSkeleton = () => (
    <div className="flex items-center justify-between py-4 px-4 space-x-4">
      <div className="flex items-center space-x-4 flex-1">
        <Skeleton className="w-16 h-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="flex space-x-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-16 h-8 rounded" />
      </div>
    </div>
  );

  const renderPackageCardSkeleton = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-12 rounded" />
      </div>
    </div>
  );

  const renderDashboardSkeleton = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center p-4">
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>

      {/* Sections */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center space-x-4 p-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDetailSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {renderPackageRowSkeleton()}
        </div>
      ))}
    </div>
  );

  const renderGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {renderPackageCardSkeleton()}
        </div>
      ))}
    </div>
  );

  const renderMetricsSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center p-4">
          <Skeleton className="h-8 w-16 mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      ))}
    </div>
  );

  const content = {
    packages: renderListSkeleton,
    dashboard: renderDashboardSkeleton,
    detail: renderDetailSkeleton,
    list: renderListSkeleton,
    grid: renderGridSkeleton,
    metrics: renderMetricsSkeleton
  }[type];

  return (
    <div className={cn('animate-pulse', className)}>
      {content()}
    </div>
  );
}
