/**
 * Marketplace Discovery API - Curated Package Sections
 * 
 * Provides curated discovery sections for the marketplace:
 * - Featured packages
 * - New releases
 * - Trending packages
 * - Category-specific recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnifiedActionClient } from '@/lib/action-client';
import { getMarketplaceBranchContext } from '@/lib/utils/session-branch-context';

interface DiscoverySection {
  id: string;
  title: string;
  description: string;
  type: 'featured' | 'trending' | 'new' | 'recommended' | 'category';
  category?: string;
  packages: any[];
  metadata: {
    totalCount: number;
    displayCount: number;
    refreshedAt: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '6');
    const tenantId = session.user.tenantId;

    const actionClient = new UnifiedActionClient(tenantId || 'system');

    // Get all marketplace packages
    const packagesResult = await actionClient.executeAction({
      action: 'marketplacePackages.list',
      data: { filters: {} },
      branchContext: {
        currentBranchId: branchContext.currentBranchId,
        defaultBranchId: branchContext.defaultBranchId,
        tenantId: undefined, // Cross-tenant for marketplace
        userId: session.user.id
      }
    });

    const allPackages = packagesResult.data || [];

    // Filter by category if specified
    const filteredPackages = category && category !== 'all' 
      ? allPackages.filter((pkg: any) => pkg.category === category)
      : allPackages;

    const discoverySections: DiscoverySection[] = [];

    // Featured Packages Section
    const featuredPackages = filteredPackages
      .filter((pkg: any) => pkg.isActive && pkg.rating >= 4)
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);

    if (featuredPackages.length > 0) {
      discoverySections.push({
        id: 'featured',
        title: 'Featured Packages',
        description: 'Hand-picked packages recommended by our team',
        type: 'featured',
        packages: featuredPackages,
        metadata: {
          totalCount: featuredPackages.length,
          displayCount: Math.min(featuredPackages.length, limit),
          refreshedAt: new Date().toISOString()
        }
      });
    }

    // Trending Packages Section (based on recent downloads)
    const trendingPackages = filteredPackages
      .filter((pkg: any) => pkg.isActive && (pkg.downloadCount || 0) > 0)
      .sort((a: any, b: any) => (b.downloadCount || 0) - (a.downloadCount || 0))
      .slice(0, limit);

    if (trendingPackages.length > 0) {
      discoverySections.push({
        id: 'trending',
        title: 'Trending Now',
        description: 'Most popular packages this week',
        type: 'trending',
        packages: trendingPackages,
        metadata: {
          totalCount: trendingPackages.length,
          displayCount: Math.min(trendingPackages.length, limit),
          refreshedAt: new Date().toISOString()
        }
      });
    }

    // New Releases Section (recently created)
    const newPackages = filteredPackages
      .filter((pkg: any) => pkg.isActive)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    if (newPackages.length > 0) {
      discoverySections.push({
        id: 'new-releases',
        title: 'New Releases',
        description: 'Latest packages added to the marketplace',
        type: 'new',
        packages: newPackages,
        metadata: {
          totalCount: newPackages.length,
          displayCount: Math.min(newPackages.length, limit),
          refreshedAt: new Date().toISOString()
        }
      });
    }

    // Category-specific sections (if no category filter)
    if (!category || category === 'all') {
      const categories = ['validation', 'automation', 'integration', 'reporting'];
      
      for (const cat of categories) {
        const categoryPackages = allPackages
          .filter((pkg: any) => pkg.category === cat && pkg.isActive)
          .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
          .slice(0, Math.min(limit, 4));

        if (categoryPackages.length > 0) {
          discoverySections.push({
            id: `category-${cat}`,
            title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Packages`,
            description: `Best packages in the ${cat} category`,
            type: 'category',
            category: cat,
            packages: categoryPackages,
            metadata: {
              totalCount: categoryPackages.length,
              displayCount: categoryPackages.length,
              refreshedAt: new Date().toISOString()
            }
          });
        }
      }
    }

    // Recommended Packages (based on user's installed packages)
    if (tenantId) {
      try {
        const installationsResult = await actionClient.executeAction({
          action: 'packageInstallations.list',
          data: { 
            filters: { 
              userId: session.user.id,
              tenantId: tenantId,
              status: 'installed'
            } 
          },
          branchContext: {
            currentBranchId: 'main',
            defaultBranchId: 'main',
            tenantId,
            userId: session.user.id
          }
        });

        const installedPackageIds = (installationsResult.data || []).map((inst: any) => inst.packageId);
        
        // Recommend packages in similar categories
        const recommendedPackages = filteredPackages
          .filter((pkg: any) => 
            pkg.isActive && 
            !installedPackageIds.includes(pkg.id) &&
            pkg.rating >= 3
          )
          .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
          .slice(0, limit);

        if (recommendedPackages.length > 0) {
          discoverySections.push({
            id: 'recommended',
            title: 'Recommended for You',
            description: 'Packages we think you\'ll love',
            type: 'recommended',
            packages: recommendedPackages,
            metadata: {
              totalCount: recommendedPackages.length,
              displayCount: Math.min(recommendedPackages.length, limit),
              refreshedAt: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        // Continue without recommendations
      }
    }

    return NextResponse.json({
      success: true,
      data: discoverySections,
      meta: {
        totalSections: discoverySections.length,
        category: category || 'all',
        limit,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Marketplace discovery error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch discovery sections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}