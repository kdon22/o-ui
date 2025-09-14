/**
 * Marketplace Installations API - User Package Installations
 * 
 * Manages user's installed marketplace packages:
 * - List user installations
 * - Get installation details
 * - Installation status and history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnifiedActionClient } from '@/lib/action-client';

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
    const status = searchParams.get('status'); // installed, installing, failed
    const packageId = searchParams.get('packageId');
    const branchId = searchParams.get('branchId');

    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Tenant ID required'
      }, { status: 400 });
    }

    const actionClient = new UnifiedActionClient(tenantId);

    // Build filters
    const filters: any = {
      userId: session.user.id,
      tenantId: tenantId
    };

    if (status) {
      filters.status = status;
    }

    if (packageId) {
      filters.packageId = packageId;
    }

    if (branchId) {
      filters.branchId = branchId;
    }

    // Get user's package installations
    const installationsResult = await actionClient.executeAction({
      action: 'packageInstallations.list',
      data: { filters },
      branchContext: {
        currentBranchId: branchId,
        defaultBranchId: branchId,
        tenantId,
        userId: session.user.id
      }
    });

    const installations = installationsResult.data || [];

    // Enrich installations with package details
    const enrichedInstallations = await Promise.all(
      installations.map(async (installation: any) => {
        try {
          // Get package details
          const packageResult = await actionClient.executeAction({
            action: 'marketplacePackages.read',
            data: { id: installation.packageId },
            branchContext: {
              currentBranchId: branchId,
              defaultBranchId: branchId,
              tenantId: undefined, // Cross-tenant for marketplace
              userId: session.user.id
            }
          });

          return {
            ...installation,
            package: packageResult.data || null,
            installationTime: installation.installationTime || 0,
            lastUsed: installation.lastUsed || installation.createdAt,
            usageCount: installation.usageCount || 0
          };
        } catch (error) {
          console.error(`Error fetching package ${installation.packageId}:`, error);
          return {
            ...installation,
            package: null,
            error: 'Package details unavailable'
          };
        }
      })
    );

    // Sort by installation date (most recent first)
    enrichedInstallations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: enrichedInstallations,
      meta: {
        total: enrichedInstallations.length,
        filters: {
          status,
          packageId,
          branchId,
          userId: session.user.id,
          tenantId
        }
      }
    });

  } catch (error) {
    console.error('Marketplace installations error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch package installations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
