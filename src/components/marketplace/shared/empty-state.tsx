/**
 * EmptyState Component - Consistent Empty State Display
 * 
 * Provides consistent empty state rendering across marketplace components.
 * Supports different types of empty states with appropriate icons and actions.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Package, Search, Star, Download, Heart, 
  AlertCircle, CheckCircle, Clock, Grid
} from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';

interface EmptyStateProps {
  type?: 'packages' | 'search' | 'starred' | 'installations' | 'updates' | 'collections' | 'error' | 'success';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

const emptyStateConfig = {
  packages: {
    icon: Package,
    title: 'No packages found',
    description: 'Try adjusting your search terms or filters.',
    actionLabel: 'Browse All Packages'
  },
  search: {
    icon: Search,
    title: 'No search results',
    description: 'Try different keywords or browse by category.',
    actionLabel: 'Clear Search'
  },
  starred: {
    icon: Star,
    title: 'No starred packages yet',
    description: 'Star packages while browsing to save them for later.',
    actionLabel: 'Browse Packages'
  },
  installations: {
    icon: Package,
    title: 'No packages installed',
    description: 'Get started by browsing and installing your first package.',
    actionLabel: 'Browse Packages'
  },
  updates: {
    icon: CheckCircle,
    title: 'All packages are up to date',
    description: 'Your installed packages are running the latest versions.',
    actionLabel: null
  },
  collections: {
    icon: Heart,
    title: 'No collections yet',
    description: 'Create collections to organize your favorite packages.',
    actionLabel: 'Create Collection'
  },
  error: {
    icon: AlertCircle,
    title: 'Something went wrong',
    description: 'Please try again later.',
    actionLabel: 'Retry'
  },
  success: {
    icon: CheckCircle,
    title: 'All done!',
    description: 'Everything is up to date.',
    actionLabel: null
  }
};

export function EmptyState({
  type = 'packages',
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = icon || config.icon;
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalActionLabel = actionLabel !== undefined ? actionLabel : config.actionLabel;

  const iconColor = {
    packages: 'text-gray-400',
    search: 'text-gray-400', 
    starred: 'text-yellow-400',
    installations: 'text-gray-400',
    updates: 'text-green-500',
    collections: 'text-pink-400',
    error: 'text-red-500',
    success: 'text-green-500'
  }[type];

  return (
    <div className={cn(
      'text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
      className
    )}>
      <Icon className={cn('h-12 w-12 mx-auto mb-4', iconColor)} />
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
        {finalTitle}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">
        {finalDescription}
      </p>
      {finalActionLabel && onAction && (
        <Button onClick={onAction}>
          {type === 'search' && <Search className="h-4 w-4 mr-2" />}
          {type === 'starred' && <Search className="h-4 w-4 mr-2" />}
          {type === 'installations' && <Search className="h-4 w-4 mr-2" />}
          {type === 'collections' && <Heart className="h-4 w-4 mr-2" />}
          {finalActionLabel}
        </Button>
      )}
    </div>
  );
}
