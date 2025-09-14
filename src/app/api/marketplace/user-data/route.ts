/**
 * Unified Marketplace User Data API
 * 
 * Consolidates all user-specific marketplace data into one endpoint:
 * - All installations, recent installations, recently updated
 * - Available updates, starred packages, collections
 * - User summary statistics
 * 
 * Replaces 5+ separate API calls with one comprehensive response
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnifiedActionClient, BranchContext } from '@/lib/action-client';

interface UserData {
  installations: {
    all: any[];
    recent: any[];
    recentlyUpdated: any[];
    availableUpdates: any[];
  };
  starred: any[];
  collections: any[];
  summary: {
    totalInstalled: number;
    availableUpdates: number;
    totalStarred: number;
    totalCollections: number;
    lastActivity: string;
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
    const tenantId = session.user.tenantId;
    const branchId = searchParams.get('branchId') || 'main';
    const include = searchParams.get('include')?.split(',') || ['installations', 'starred', 'collections'];

    if (!tenantId) {
      return NextResponse.json({ 
        success: false,
        error: 'Tenant ID required' 
      }, { status: 400 });
    }

    const branchContext: BranchContext = {
      currentBranchId: branchId,
      defaultBranchId: session.user.branchContext?.defaultBranchId || branchId,
      tenantId,
      userId: session.user.id
    };

    const actionClient = new UnifiedActionClient(tenantId);

    // Build parallel requests based on what's requested
    const requests: Promise<any>[] = [];
    const requestMap: string[] = [];

    if (include.includes('installations')) {
      requests.push(
        actionClient.executeAction({
          action: 'packageInstallations.list',
          data: { 
            filters: { tenantId, status: 'active' },
            orderBy: { installationDate: 'desc' },
            includePackageDetails: true,
            includeUpdateInfo: true
          },
          branchContext
        })
      );
      requestMap.push('installations');
    }

    if (include.includes('starred')) {
      requests.push(
        actionClient.executeAction({
          action: 'marketplacePackages.list',
          data: { 
            filters: { 
              isStarred: true,
              starredBy: session.user.id 
            },
            includeAnalytics: true
          },
          branchContext
        })
      );
      requestMap.push('starred');
    }

    if (include.includes('collections')) {
      // TODO: Implement when packageCollections.list action is available
      // requests.push(
      //   actionClient.executeAction({
      //     action: 'packageCollections.list',
      //     data: { 
      //       filters: { 
      //         OR: [
      //           { createdBy: session.user.id },
      //           { isOfficial: true, isPublic: true }
      //         ]
      //       },
      //       includePackageCount: true
      //     },
      //     branchContext
      //   })
      // );
      // requestMap.push('collections');
    }

    // Execute all requests in parallel
    const results = await Promise.all(requests);
    
    // Map results back to their types
    const resultMap: Record<string, any> = {};
    results.forEach((result, index) => {
      resultMap[requestMap[index]] = result.data || [];
    });

    const installations = resultMap.installations || [];
    const starred = resultMap.starred || [];
    const collections = resultMap.collections || []; // Empty until packageCollections.list is implemented

    // Process installations data
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentInstallations = installations
      .filter((inst: any) => new Date(inst.installationDate) >= oneWeekAgo)
      .slice(0, 5);

    const recentlyUpdated = installations
      .filter((inst: any) => 
        inst.updatedAt && 
        new Date(inst.updatedAt) >= oneWeekAgo &&
        new Date(inst.updatedAt) > new Date(inst.installationDate)
      )
      .slice(0, 5);

    const availableUpdates = installations
      .filter((inst: any) => inst.package?.hasUpdates);

    // Calculate summary statistics
    const lastActivity = installations.length > 0 
      ? Math.max(
          ...installations.map((inst: any) => 
            Math.max(
              new Date(inst.installationDate).getTime(),
              new Date(inst.updatedAt || inst.installationDate).getTime(),
              new Date(inst.lastUsed || inst.installationDate).getTime()
            )
          )
        )
      : Date.now();

    const userData: UserData = {
      installations: {
        all: installations,
        recent: recentInstallations,
        recentlyUpdated,
        availableUpdates
      },
      starred,
      collections,
      summary: {
        totalInstalled: installations.length,
        availableUpdates: availableUpdates.length,
        totalStarred: starred.length,
        totalCollections: collections.filter((c: any) => c.createdBy === session.user.id).length,
        lastActivity: new Date(lastActivity).toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      data: userData,
      meta: {
        generatedAt: new Date().toISOString(),
        includedSections: include,
        cacheHint: 'stale-while-revalidate=180', // 3 minutes
        requestId: crypto.randomUUID()
      }
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
