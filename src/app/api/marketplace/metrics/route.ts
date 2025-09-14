/**
 * Marketplace Metrics API - Dashboard Analytics
 * 
 * Provides marketplace analytics and metrics for the dashboard:
 * - Total packages, downloads, revenue
 * - User-specific metrics
 * - Trending data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnifiedActionClient } from '@/lib/action-client';
import { getMarketplaceBranchContext } from '@/lib/utils/session-branch-context';

interface MarketplaceMetrics {
  totalPackages: number;
  totalDownloads: number;
  totalRevenue: number;
  userPackages: number;
  userDownloads: number;
  userRevenue: number;
  recentActivity: {
    downloads: number;
    installations: number;
    revenue: number;
  };
  topCategories: Array<{
    category: string;
    count: number;
    growth: number;
    packageCount: number;
    downloadCount: number;
    averageRating: number;
  }>;
  trendingPackages: Array<{
    id: string;
    name: string;
    downloads: number;
    growth: number;
  }>;
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
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y

    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Tenant ID required'
      }, { status: 400 });
    }

    // Get proper branch context from session - NO HARDCODING
    const branchContext = await getMarketplaceBranchContext();
    const actionClient = new UnifiedActionClient(tenantId);

    // Get marketplace packages for metrics calculation
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

    const packages = packagesResult.data || [];

    // Get user's packages
    const userPackagesResult = await actionClient.executeAction({
      action: 'marketplacePackages.list',
      data: { 
        filters: { 
          authorId: session.user.id 
        } 
      },
      branchContext: {
        currentBranchId: branchContext.currentBranchId,
        defaultBranchId: branchContext.defaultBranchId,
        tenantId: undefined,
        userId: session.user.id
      }
    });

    const userPackages = userPackagesResult.data || [];

    // Get installations for metrics
    const installationsResult = await actionClient.executeAction({
      action: 'packageInstallations.list',
      data: { filters: {} },
      branchContext: {
        currentBranchId: branchContext.currentBranchId,
        defaultBranchId: branchContext.defaultBranchId,
        tenantId,
        userId: session.user.id
      }
    });

    const installations = installationsResult.data || [];

    // Calculate metrics
    const totalPackages = packages.length;
    const totalDownloads = packages.reduce((sum: number, pkg: any) => sum + (pkg.downloadCount || 0), 0);
    const totalRevenue = packages.reduce((sum: number, pkg: any) => sum + (pkg.totalRevenue || 0), 0);
    
    const userPackagesCount = userPackages.length;
    const userDownloads = userPackages.reduce((sum: number, pkg: any) => sum + (pkg.downloadCount || 0), 0);
    const userRevenue = userPackages.reduce((sum: number, pkg: any) => sum + (pkg.totalRevenue || 0), 0);

    // Calculate category metrics
    const categoryStats = packages.reduce((acc: any, pkg: any) => {
      const category = pkg.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = { count: 0, downloads: 0 };
      }
      acc[category].count++;
      acc[category].downloads += pkg.downloadCount || 0;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryStats)
      .map(([category, stats]: [string, any]) => ({
        category,
        count: stats.count,
        growth: Math.floor(Math.random() * 20) - 10, // Mock growth data
        packageCount: stats.count, // Dashboard expects packageCount
        downloadCount: stats.downloads, // Dashboard expects downloadCount
        averageRating: Math.round((Math.random() * 2 + 3) * 10) / 10 // Mock rating 3.0-5.0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get trending packages (mock trending logic)
    const trendingPackages = packages
      .sort((a: any, b: any) => (b.downloadCount || 0) - (a.downloadCount || 0))
      .slice(0, 5)
      .map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        downloads: pkg.downloadCount || 0,
        growth: Math.floor(Math.random() * 50) + 10 // Mock growth
      }));

    const metrics: MarketplaceMetrics = {
      totalPackages,
      totalDownloads,
      totalRevenue,
      userPackages: userPackagesCount,
      userDownloads,
      userRevenue,
      recentActivity: {
        downloads: Math.floor(totalDownloads * 0.1), // Mock recent activity
        installations: installations.length,
        revenue: Math.floor(totalRevenue * 0.05)
      },
      topCategories,
      trendingPackages
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        timeframe,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Marketplace metrics error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch marketplace metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
