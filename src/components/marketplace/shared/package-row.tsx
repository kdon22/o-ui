/**
 * PackageRow Component - Reusable Package Row Display
 * 
 * Eliminates 200+ lines of duplication across marketplace components.
 * Provides consistent package row rendering with customizable variants.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, Download, Settings, Trash2, Eye, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import { PackageIcon } from './package-icon';
import { PackageBadges } from './package-badges';
import { PackageMetrics } from './package-metrics';
import { usePackageStar } from './use-package-star';
import { 
  MarketplacePackageWithDetails, 
  PackageInstallation,
  PackageInstallationStatus 
} from '@/features/marketplace/types/enhanced';

interface PackageRowProps {
  // Data
  package?: MarketplacePackageWithDetails;
  installation?: PackageInstallation;
  
  // Display options
  variant?: 'default' | 'compact' | 'detailed';
  showDescription?: boolean;
  showMetrics?: boolean;
  showComponentTypes?: boolean;
  showInstallationInfo?: boolean;
  
  // Actions
  onPackageSelect?: (packageId: string) => void;
  onInstall?: (packageId: string) => void;
  onUpdate?: (packageId: string) => void;
  onUninstall?: (packageId: string) => void;
  onManage?: (packageId: string) => void;
  
  // Styling
  className?: string;
  
  // Star hook options
  additionalInvalidationKeys?: string[][];
}

export function PackageRow({
  package: pkg,
  installation,
  variant = 'default',
  showDescription = true,
  showMetrics = true,
  showComponentTypes = false,
  showInstallationInfo = false,
  onPackageSelect,
  onInstall,
  onUpdate,
  onUninstall,
  onManage,
  className,
  additionalInvalidationKeys = []
}: PackageRowProps) {
  const { handleStar, isStarring } = usePackageStar({ additionalInvalidationKeys });
  
  // Handle both direct package and installation.package
  const packageData = pkg || installation?.package;
  if (!packageData) return null;

  const packageId = packageData.id;
  const isInstalled = packageData.installationStatus === PackageInstallationStatus.INSTALLED;
  const isInstalling = packageData.installationStatus === PackageInstallationStatus.INSTALLING;
  const hasUpdates = packageData.hasUpdates;
  const isStarred = packageData.isStarred || false;

  // Variant-specific styling
  const sizeClasses = {
    compact: 'py-3 px-4',
    default: 'py-4 px-4', 
    detailed: 'py-6 px-6'
  };

  const iconSizes = {
    compact: 'sm' as const,
    default: 'lg' as const,
    detailed: 'xl' as const
  };

  const handleRowClick = () => {
    if (onPackageSelect) {
      onPackageSelect(packageId);
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div 
      className={cn(
        'flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group border-b border-gray-100 dark:border-gray-800 last:border-b-0 cursor-pointer',
        sizeClasses[variant],
        className
      )}
      onClick={handleRowClick}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* Package Icon */}
        <PackageIcon
          iconUrl={packageData.iconUrl}
          name={packageData.name}
          size={iconSizes[variant]}
          variant="rounded"
        />

        {/* Package Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={cn(
              'font-semibold text-gray-900 dark:text-white truncate',
              variant === 'compact' ? 'text-base' : 'text-lg'
            )}>
              {packageData.name}
            </h3>
            
            <PackageBadges
              isInstalled={isInstalled}
              hasUpdates={hasUpdates}
              installationStatus={packageData.installationStatus}
              licenseType={packageData.licenseType}
              price={packageData.price}
              subscriptionInterval={packageData.subscriptionInterval}
              version={installation?.version || packageData.version}
              showVersion={variant === 'detailed' || showInstallationInfo}
              showLicense={variant !== 'compact'}
              size={variant === 'compact' ? 'sm' : 'md'}
            />
          </div>
          
          {showDescription && (
            <p className={cn(
              'text-gray-600 dark:text-gray-300 mb-2',
              variant === 'compact' ? 'text-sm line-clamp-1' : 'text-sm line-clamp-2'
            )}>
              {packageData.description}
            </p>
          )}
          
          {/* Metrics */}
          {showMetrics && (
            <PackageMetrics
              averageRating={packageData.analytics?.averageRating}
              totalReviews={packageData.analytics?.totalReviews}
              totalDownloads={packageData.analytics?.totalDownloads}
              activeInstallations={packageData.analytics?.activeInstallations}
              size={variant === 'compact' ? 'sm' : 'md'}
              layout="horizontal"
            />
          )}

          {/* Installation Info */}
          {showInstallationInfo && installation && (
            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Installed {new Date(installation.installationDate).toLocaleDateString()}</span>
              </div>
              {installation.lastUsed && (
                <span>Last used {new Date(installation.lastUsed).toLocaleDateString()}</span>
              )}
            </div>
          )}

          {/* Component Types */}
          {showComponentTypes && (
            <div className="flex flex-wrap gap-1 mt-2">
              {packageData.selectedRules.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {packageData.selectedRules.length} Rules
                </span>
              )}
              {packageData.selectedWorkflows.length > 0 && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {packageData.selectedWorkflows.length} Workflows
                </span>
              )}
              {packageData.selectedTables.length > 0 && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {packageData.selectedTables.length} Tables
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 ml-4">
        {/* Star Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => handleActionClick(e, () => handleStar(packageId, isStarred))}
          disabled={isStarring}
          className={cn(
            'p-2',
            isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
          )}
        >
          <Star className={cn('h-4 w-4', isStarred && 'fill-current')} />
        </Button>
        
        {/* Primary Action Button */}
        {!isInstalled ? (
          <Button
            size="sm"
            onClick={(e) => handleActionClick(e, () => onInstall?.(packageId))}
            disabled={isInstalling}
            className="px-4"
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
        ) : hasUpdates ? (
          <Button 
            size="sm" 
            className="px-4"
            onClick={(e) => handleActionClick(e, () => onUpdate?.(packageId))}
          >
            <Download className="h-4 w-4 mr-2" />
            Update
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => handleActionClick(e, () => onManage?.(packageId))}
            className="px-4"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        )}
      </div>
    </div>
  );
}
