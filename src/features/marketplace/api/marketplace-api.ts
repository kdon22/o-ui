/**
 * Marketplace API Functions - Client-side API helpers
 * 
 * Provides typed API functions for:
 * - Package browsing and search
 * - Package subscription management
 * - Package installation (live integration)
 * - Billing integration
 */

import { MarketplacePackage, PackageSubscription, PackageInstallation } from '../types';

const API_BASE = '/api/marketplace';

export interface MarketplaceApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PackageSearchParams {
  category?: string;
  search?: string;
  tags?: string[];
  licenseType?: string;
  tenantId?: string;
  showPublicOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Fetch marketplace packages with filtering and search
 */
export async function fetchMarketplacePackages(
  params: PackageSearchParams = {}
): Promise<MarketplaceApiResponse<MarketplacePackage[]>> {
  try {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const response = await fetch(`${API_BASE}/packages?${searchParams}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch packages');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching marketplace packages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get detailed information about a specific package
 */
export async function fetchPackageDetail(
  packageId: string
): Promise<MarketplaceApiResponse<MarketplacePackage>> {
  try {
    const response = await fetch(`${API_BASE}/packages/${packageId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch package details');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching package details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Subscribe to a marketplace package
 */
export async function subscribeToPackage(
  packageId: string,
  subscriptionData: {
    licenseType: string;
    subscriptionInterval?: string;
    usageLimit?: number;
  }
): Promise<MarketplaceApiResponse<PackageSubscription>> {
  try {
    const response = await fetch(`${API_BASE}/packages/${packageId}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to subscribe to package');
    }
    
    return data;
  } catch (error) {
    console.error('Error subscribing to package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Install a marketplace package (live integration)
 */
export async function installPackage(
  packageId: string,
  installationData: {
    branchId?: string;
    customizeComponents?: boolean;
    componentPrefix?: string;
  } = {}
): Promise<MarketplaceApiResponse<PackageInstallation>> {
  try {
    const response = await fetch(`${API_BASE}/packages/${packageId}/install`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(installationData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to install package');
    }
    
    return data;
  } catch (error) {
    console.error('Error installing package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Uninstall a marketplace package
 */
export async function uninstallPackage(
  packageId: string,
  options: {
    removeComponents?: boolean;
    branchId?: string;
  } = {}
): Promise<MarketplaceApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE}/packages/${packageId}/uninstall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to uninstall package');
    }
    
    return data;
  } catch (error) {
    console.error('Error uninstalling package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get user's package subscriptions
 */
export async function fetchUserSubscriptions(): Promise<MarketplaceApiResponse<PackageSubscription[]>> {
  try {
    const response = await fetch(`${API_BASE}/subscriptions`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch subscriptions');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get user's package installations
 */
export async function fetchUserInstallations(): Promise<MarketplaceApiResponse<PackageInstallation[]>> {
  try {
    const response = await fetch(`${API_BASE}/installations`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch installations');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user installations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
