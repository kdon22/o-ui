/**
 * PackageMetrics Component - Consistent Metrics Display
 * 
 * Provides consistent rendering of package metrics (ratings, downloads, etc.)
 * across all marketplace components.
 */

import React from 'react';
import { Star, Download, Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';

interface PackageMetricsProps {
  averageRating?: number;
  totalReviews?: number;
  totalDownloads?: number;
  activeInstallations?: number;
  viewCount?: number;
  size?: 'sm' | 'md';
  layout?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  className?: string;
}

export function PackageMetrics({
  averageRating,
  totalReviews,
  totalDownloads,
  activeInstallations,
  viewCount,
  size = 'sm',
  layout = 'horizontal',
  showLabels = false,
  className
}: PackageMetricsProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const spacing = layout === 'horizontal' ? 'space-x-4' : 'space-y-2';
  const itemLayout = layout === 'horizontal' ? 'flex-row' : 'flex-col';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const metrics = [
    {
      icon: Star,
      value: averageRating?.toFixed(1) || '0.0',
      label: 'Rating',
      count: totalReviews,
      show: averageRating !== undefined,
      className: 'text-yellow-500'
    },
    {
      icon: Download,
      value: formatNumber(totalDownloads || 0),
      label: 'Downloads',
      show: totalDownloads !== undefined,
      className: 'text-blue-500'
    },
    {
      icon: Users,
      value: formatNumber(activeInstallations || 0),
      label: 'Active',
      show: activeInstallations !== undefined,
      className: 'text-green-500'
    },
    {
      icon: Eye,
      value: formatNumber(viewCount || 0),
      label: 'Views',
      show: viewCount !== undefined,
      className: 'text-gray-500'
    }
  ].filter(metric => metric.show);

  if (metrics.length === 0) return null;

  return (
    <div className={cn(
      'flex items-center text-gray-500',
      spacing,
      layout === 'vertical' && 'flex-col items-start',
      className
    )}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className={cn('flex items-center space-x-1', itemLayout)}>
            <Icon className={cn(iconSize, metric.className)} />
            <div className={cn('flex items-center space-x-1', textSize)}>
              <span className="font-medium">{metric.value}</span>
              {metric.count && (
                <span className="text-gray-400">
                  ({formatNumber(metric.count)})
                </span>
              )}
              {showLabels && (
                <span className="text-gray-400">{metric.label}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
