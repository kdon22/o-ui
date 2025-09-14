/**
 * PackageBadges Component - Consistent Status Badge Rendering
 * 
 * Provides consistent badge rendering for package status indicators
 * across all marketplace components.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Star } from 'lucide-react';
import { PackageInstallationStatus } from '@/features/marketplace/types/enhanced';

interface PackageBadgesProps {
  isInstalled?: boolean;
  hasUpdates?: boolean;
  installationStatus?: PackageInstallationStatus;
  licenseType?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION' | 'USAGE_BASED';
  price?: number;
  subscriptionInterval?: 'monthly' | 'quarterly' | 'yearly';
  version?: string;
  showVersion?: boolean;
  showLicense?: boolean;
  size?: 'sm' | 'md';
}

export function PackageBadges({
  isInstalled,
  hasUpdates,
  installationStatus,
  licenseType,
  price,
  subscriptionInterval,
  version,
  showVersion = false,
  showLicense = true,
  size = 'sm'
}: PackageBadgesProps) {
  const badgeSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className="flex items-center space-x-2 flex-wrap gap-1">
      {/* Installation Status */}
      {isInstalled && (
        <Badge className={`bg-green-100 text-green-800 ${badgeSize}`}>
          <CheckCircle className={`${iconSize} mr-1`} />
          Installed
        </Badge>
      )}

      {/* Update Available */}
      {hasUpdates && (
        <Badge className={`bg-orange-100 text-orange-800 ${badgeSize}`}>
          <AlertCircle className={`${iconSize} mr-1`} />
          Update Available
        </Badge>
      )}

      {/* Installation Status */}
      {installationStatus === PackageInstallationStatus.INSTALLING && (
        <Badge className={`bg-blue-100 text-blue-800 ${badgeSize}`}>
          <Clock className={`${iconSize} mr-1`} />
          Installing
        </Badge>
      )}

      {installationStatus === PackageInstallationStatus.FAILED && (
        <Badge className={`bg-red-100 text-red-800 ${badgeSize}`}>
          <AlertCircle className={`${iconSize} mr-1`} />
          Failed
        </Badge>
      )}

      {/* Version */}
      {showVersion && version && (
        <Badge variant="secondary" className={badgeSize}>
          v{version}
        </Badge>
      )}

      {/* License Type */}
      {showLicense && licenseType && (
        <>
          {licenseType === 'FREE' ? (
            <Badge variant="outline" className={`${badgeSize} text-green-600 border-green-300`}>
              Free
            </Badge>
          ) : (
            <Badge variant="outline" className={`${badgeSize} text-blue-600 border-blue-300`}>
              {licenseType === 'ONE_TIME' && 'One-Time'}
              {licenseType === 'SUBSCRIPTION' && 'Subscription'}
              {licenseType === 'USAGE_BASED' && 'Usage-Based'}
            </Badge>
          )}
        </>
      )}
    </div>
  );
}
