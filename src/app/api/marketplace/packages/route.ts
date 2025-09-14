/**
 * Marketplace Packages API - CRUD Operations
 * 
 * Handles:
 * - Package creation and publishing
 * - Package browsing with tenant-based access control
 * - Package updates and management
 * - Live integration with component selection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnifiedActionClient, BranchContext } from '@/lib/action-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    const branchId = searchParams.get('branchId') || 'main';
    const category = searchParams.get('category');
    const isPublic = searchParams.get('public');
    const search = searchParams.get('search');
    
    // Enhanced options
    const sections = searchParams.get('sections')?.split(',') || [];
    const includeUserData = searchParams.get('includeUserData') === 'true';
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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
    
    // Build filters for marketplace packages
    const filters: any = {
      isActive: true
    };

    // Apply tenant-based access control
    if (isPublic === 'true') {
      filters.isPublic = true;
    } else {
      filters.OR = [
        { isPublic: true },
        { allowedTenants: { has: tenantId } },
        { tenantId: tenantId }
      ];
    }

    if (category && category !== 'all') {
      filters.category = category;
    }

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    // Fetch packages with enhanced options
    const packagesResult = await actionClient.executeAction({
      action: 'marketplacePackages.list',
      data: { 
        filters,
        limit,
        offset,
        includeAnalytics,
        includeUserContext: includeUserData
      },
      branchContext
    });

    const packages = packagesResult.data || [];

    // Build response object
    const response: any = {
      packages,
      meta: {
        totalCount: packagesResult.meta?.totalCount || packages.length,
        hasMore: packages.length === limit,
        limit,
        offset,
        filters: {
          category,
          search,
          isPublic: isPublic === 'true'
        }
      }
    };

    // Add sections if requested
    if (sections.length > 0) {
      response.sections = {};
      
      if (sections.includes('featured')) {
        response.sections.featured = packages
          .filter((pkg: any) => (pkg.analytics?.averageRating || 0) >= 4)
          .sort((a: any, b: any) => (b.analytics?.averageRating || 0) - (a.analytics?.averageRating || 0))
          .slice(0, 6);
      }
      
      if (sections.includes('trending')) {
        response.sections.trending = packages
          .filter((pkg: any) => (pkg.analytics?.weeklyDownloads || 0) > 0)
          .sort((a: any, b: any) => (b.analytics?.weeklyDownloads || 0) - (a.analytics?.weeklyDownloads || 0))
          .slice(0, 6);
      }
      
      if (sections.includes('new')) {
        response.sections.new = packages
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6);
      }
    }

    // Add user context if requested
    if (includeUserData) {
      const [starredResult, installationsResult] = await Promise.all([
        actionClient.executeAction({
          action: 'marketplacePackages.list',
          data: { 
            filters: { isStarred: true, starredBy: session.user.id },
            limit: 1000
          },
          branchContext
        }),
        actionClient.executeAction({
          action: 'packageInstallations.list',
          data: { 
            filters: { tenantId, status: 'active' },
            limit: 1000
          },
          branchContext
        })
      ]);

      response.userContext = {
        starredPackageIds: (starredResult.data || []).map((pkg: any) => pkg.id),
        installedPackageIds: (installationsResult.data || []).map((inst: any) => inst.packageId),
        availableUpdateIds: (installationsResult.data || [])
          .filter((inst: any) => inst.package?.hasUpdates)
          .map((inst: any) => inst.packageId)
      };
    }

    return NextResponse.json({
      success: true,
      data: response,
      meta: {
        generatedAt: new Date().toISOString(),
        cacheHint: 'stale-while-revalidate=300',
        requestId: crypto.randomUUID()
      }
    });

  } catch (error) {
    console.error('Error fetching marketplace packages:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch packages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    const branchId = searchParams.get('branchId') || 'main';

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const branchContext: BranchContext = {
      currentBranchId: branchId,
      defaultBranchId: session.user.branchContext?.defaultBranchId || branchId,
      tenantId,
      userId: session.user.id
    };

    // Validate required fields
    if (!body.name || !body.description || !body.licenseType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, licenseType' },
        { status: 400 }
      );
    }

    // Validate component selections
    const hasComponents = (
      body.selectedRules?.length > 0 ||
      body.selectedClasses?.length > 0 ||
      body.selectedTables?.length > 0 ||
      body.selectedWorkflows?.length > 0
    );

    if (!hasComponents) {
      return NextResponse.json(
        { error: 'Package must include at least one component' },
        { status: 400 }
      );
    }

    const actionClient = new UnifiedActionClient(tenantId);

    // Create the marketplace package
    const packageData = {
      ...body,
      authorId: session.user.id,
      tenantId,
      branchId,
      // Set defaults
      downloadCount: 0,
      installCount: 0,
      activeInstalls: 0,
      reviewCount: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      isActive: true,
      // Ensure arrays are properly set
      selectedRules: body.selectedRules || [],
      selectedClasses: body.selectedClasses || [],
      selectedTables: body.selectedTables || [],
      selectedWorkflows: body.selectedWorkflows || [],
      tags: body.tags || [],
      allowedTenants: body.allowedTenants || []
    };

    const result = await actionClient.executeAction({
      action: 'marketplacePackages.create',
      data: packageData,
      branchContext
    });

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error creating marketplace package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}
