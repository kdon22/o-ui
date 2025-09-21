/**
 * Individual Marketplace Package API - Package Details and Management
 * 
 * Handles:
 * - Package detail retrieval
 * - Package updates by author
 * - Package deletion
 * - Access control validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnifiedActionClient, BranchContext } from '@/lib/action-client';

interface RouteParams {
  params: {
    packageId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    const branchId = searchParams.get('branchId') || 'main';

    const branchContext: BranchContext = {
      currentBranchId: branchId,
      defaultBranchId: 'main',
      tenantId,
      userId: session.user.id
    };

    const actionClient = new UnifiedActionClient(session.user.tenantId);

    // Get the package
    const packageResult = await actionClient.executeAction({
      action: 'marketplacePackages.read',
      data: { id: params.packageId },
      branchContext
    });

    if (!packageResult.data) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const pkg = packageResult.data;

    // Check access control
    const hasAccess = (
      pkg.isPublic ||
      pkg.tenantId === tenantId ||
      pkg.allowedTenants.includes(tenantId)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get additional package data (reviews, installations, etc.)
    const [reviews, installations] = await Promise.all([
      actionClient.executeAction({
        action: 'packageReviews.list',
        data: { 
          filters: { 
            packageId: params.packageId,
            isApproved: true,
            isPublic: true
          }
        },
        branchContext
      }),
      actionClient.executeAction({
        action: 'packageInstallations.list',
        data: { 
          filters: { 
            packageId: params.packageId,
            tenantId: tenantId,
            status: 'active'
          }
        },
        branchContext
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...pkg,
        reviews: reviews.data || [],
        userInstallation: installations.data?.[0] || null,
        isInstalled: installations.data?.length > 0
      }
    });

  } catch (error) {
    console.error('Error fetching package details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package details' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    const branchId = searchParams.get('branchId') || 'main';

    const branchContext: BranchContext = {
      currentBranchId: branchId,
      defaultBranchId: 'main',
      tenantId,
      userId: session.user.id
    };

    const actionClient = new UnifiedActionClient(session.user.tenantId);

    // Get the existing package to check permissions
    const existingPackage = await actionClient.executeAction({
      action: 'marketplacePackages.read',
      data: { id: params.packageId },
      branchContext
    });

    if (!existingPackage.data) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Check if user is the author or has admin rights
    const isAuthor = existingPackage.data.authorId === session.user.id;
    const isOwnerTenant = existingPackage.data.tenantId === tenantId;

    if (!isAuthor && !isOwnerTenant) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Update the package
    const result = await actionClient.executeAction({
      action: 'marketplacePackages.update',
      data: {
        id: params.packageId,
        updates: {
          ...body,
          updatedById: session.user.id
        }
      },
      branchContext
    });

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    const branchId = searchParams.get('branchId') || 'main';

    const branchContext: BranchContext = {
      currentBranchId: branchId,
      defaultBranchId: 'main',
      tenantId,
      userId: session.user.id
    };

    const actionClient = new UnifiedActionClient(session.user.tenantId);

    // Get the existing package to check permissions
    const existingPackage = await actionClient.executeAction({
      action: 'marketplacePackages.read',
      data: { id: params.packageId },
      branchContext
    });

    if (!existingPackage.data) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Check if user is the author or has admin rights
    const isAuthor = existingPackage.data.authorId === session.user.id;
    const isOwnerTenant = existingPackage.data.tenantId === tenantId;

    if (!isAuthor && !isOwnerTenant) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Check if package has active installations
    const activeInstallations = await actionClient.executeAction({
      action: 'packageInstallations.list',
      data: { 
        filters: { 
          packageId: params.packageId,
          status: 'active'
        }
      },
      branchContext
    });

    if (activeInstallations.data?.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete package with active installations' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const result = await actionClient.executeAction({
      action: 'marketplacePackages.update',
      data: {
        id: params.packageId,
        updates: {
          isActive: false,
          updatedById: session.user.id
        }
      },
      branchContext
    });

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}
