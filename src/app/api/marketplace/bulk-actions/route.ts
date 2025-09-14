/**
 * Marketplace Bulk Actions API
 * 
 * Handles multiple marketplace actions in a single request:
 * - Bulk star/unstar operations
 * - Batch install/uninstall operations
 * - Multiple package updates
 * 
 * Reduces network requests and provides atomic operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnifiedActionClient, BranchContext } from '@/lib/action-client';

interface BulkAction {
  type: 'star' | 'install' | 'uninstall' | 'update';
  packageId: string;
  value?: boolean | string | any;
}

interface BulkActionRequest {
  actions: BulkAction[];
}

interface BulkActionResult {
  success: boolean;
  results: Array<{
    packageId: string;
    action: string;
    success: boolean;
    error?: string;
    data?: any;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body: BulkActionRequest = await request.json();
    const { actions } = body;

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Actions array is required and must not be empty' 
      }, { status: 400 });
    }

    if (actions.length > 50) {
      return NextResponse.json({ 
        success: false,
        error: 'Maximum 50 actions allowed per request' 
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = session.user.tenantId;
    const branchId = searchParams.get('branchId') || 'main';

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
    const results: BulkActionResult['results'] = [];

    // Process actions in parallel for better performance
    const actionPromises = actions.map(async (action) => {
      try {
        let result: any = null;

        switch (action.type) {
          case 'star':
            result = await actionClient.executeAction({
              action: action.value ? 'marketplacePackages.star' : 'marketplacePackages.unstar',
              data: { 
                packageId: action.packageId,
                userId: session.user.id 
              },
              branchContext
            });
            break;

          case 'install':
            result = await actionClient.executeAction({
              action: 'packageInstallations.create',
              data: { 
                packageId: action.packageId,
                tenantId,
                userId: session.user.id,
                installationOptions: action.value || {}
              },
              branchContext
            });
            break;

          case 'uninstall':
            result = await actionClient.executeAction({
              action: 'packageInstallations.delete',
              data: { 
                packageId: action.packageId,
                tenantId,
                userId: session.user.id,
                uninstallOptions: action.value || {}
              },
              branchContext
            });
            break;

          case 'update':
            result = await actionClient.executeAction({
              action: 'packageInstallations.update',
              data: { 
                packageId: action.packageId,
                tenantId,
                userId: session.user.id,
                updateOptions: action.value || {}
              },
              branchContext
            });
            break;

          default:
            throw new Error(`Unsupported action type: ${action.type}`);
        }

        return {
          packageId: action.packageId,
          action: action.type,
          success: true,
          data: result.data
        };

      } catch (error) {
        return {
          packageId: action.packageId,
          action: action.type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Wait for all actions to complete
    const actionResults = await Promise.all(actionPromises);
    results.push(...actionResults);

    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    const bulkResult: BulkActionResult = {
      success: failed === 0, // Only successful if all actions succeeded
      results,
      summary: {
        total: actions.length,
        successful,
        failed
      }
    };

    // Return appropriate status code
    const statusCode = failed === 0 ? 200 : (successful > 0 ? 207 : 400); // 207 = Multi-Status

    return NextResponse.json({
      success: true,
      data: bulkResult,
      meta: {
        processedAt: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }, { status: statusCode });

  } catch (error) {
    console.error('Error processing bulk actions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process bulk actions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
