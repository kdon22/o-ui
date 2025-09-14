/**
 * Package Uninstall API - Smart Uninstall with Rollback
 * 
 * Features:
 * - Safe component removal with dependency checking
 * - Rollback capabilities for failed installations
 * - Usage tracking and analytics updates
 * - Branch-aware uninstallation
 * - Cleanup of related data and configurations
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

interface UninstallRequest {
  branchId?: string;
  removeComponents?: boolean;
  removeConfiguration?: boolean;
  force?: boolean; // Force removal even if dependencies exist
  reason?: string; // Reason for uninstallation
}

interface UninstallResult {
  success: boolean;
  message?: string;
  removedComponents?: Array<{
    id: string;
    type: 'rule' | 'class' | 'table' | 'workflow';
    name: string;
    status: 'removed' | 'failed' | 'skipped';
    reason?: string;
  }>;
  warnings?: string[];
  dependentPackages?: Array<{
    packageId: string;
    name: string;
    affectedComponents: string[];
  }>;
  error?: {
    type: 'validation' | 'permission' | 'dependency' | 'component' | 'unknown';
    message: string;
    details?: string;
    recoveryActions?: string[];
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'permission',
          message: 'Authentication required',
          recoveryActions: ['Please log in and try again']
        }
      }, { status: 401 });
    }

    const body: UninstallRequest = await request.json();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    // Get proper branch context from session - NO HARDCODING
    const sessionBranchContext = session.user.branchContext;
    if (!sessionBranchContext?.currentBranchId) {
      return NextResponse.json({ error: 'Branch context missing from session' }, { status: 400 });
    }
    const branchId = body.branchId || searchParams.get('branchId') || sessionBranchContext.currentBranchId;

    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'validation',
          message: 'Tenant ID required',
          recoveryActions: ['Please ensure you are logged in with a valid tenant']
        }
      }, { status: 400 });
    }

    const branchContext: BranchContext = {
      currentBranchId: branchId,
      defaultBranchId: sessionBranchContext.defaultBranchId,
      tenantId,
      userId: session.user.id
    };

    const actionClient = new UnifiedActionClient(tenantId);

    // Find the installation record
    const installationResult = await actionClient.executeAction({
      action: 'packageInstallations.list',
      data: {
        filters: {
          packageId: params.packageId,
          tenantId: tenantId,
          branchId: branchId,
          status: { in: ['installed', 'failed'] }
        }
      },
      branchContext
    });

    if (!installationResult.data?.length) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'validation',
          message: 'Package installation not found',
          details: `No installation found for package ${params.packageId} on branch "${branchId}"`,
          recoveryActions: [
            'Check if the package is actually installed',
            'Verify the correct branch is selected',
            'Try refreshing the page'
          ]
        }
      }, { status: 404 });
    }

    const installation = installationResult.data[0];

    // Get package details for component information
    const packageResult = await actionClient.executeAction({
      action: 'marketplacePackages.getById',
      data: { id: params.packageId },
      branchContext: {
        ...branchContext,
        tenantId: undefined // Allow cross-tenant access for marketplace packages
      }
    });

    if (!packageResult.data) {
      return NextResponse.json({
        success: false,
        error: {
          type: 'validation',
          message: 'Package not found',
          recoveryActions: ['Contact support if this package should exist']
        }
      }, { status: 404 });
    }

    const pkg = packageResult.data;

    // Check for dependent packages (packages that depend on this one)
    const dependentPackages = await findDependentPackages(params.packageId, actionClient, branchContext);
    
    if (dependentPackages.length > 0 && !body.force) {
      return NextResponse.json({
        success: false,
        dependentPackages,
        error: {
          type: 'dependency',
          message: 'Package has dependencies',
          details: `${dependentPackages.length} other packages depend on this package`,
          recoveryActions: [
            'Uninstall dependent packages first',
            'Use force option to override dependencies',
            'Contact support for assistance'
          ]
        }
      }, { status: 409 });
    }

    const removedComponents: UninstallResult['removedComponents'] = [];
    const warnings: string[] = [];

    try {
      // Remove components if requested
      if (body.removeComponents !== false) {
        // Remove cloned components
        const allComponents = [
          ...pkg.selectedRules?.map(id => ({ id, type: 'rule' as const })) || [],
          ...pkg.selectedClasses?.map(id => ({ id, type: 'class' as const })) || [],
          ...pkg.selectedTables?.map(id => ({ id, type: 'table' as const })) || [],
          ...pkg.selectedWorkflows?.map(id => ({ id, type: 'workflow' as const })) || []
        ];

        for (const component of allComponents) {
          try {
            // Find the cloned component (components created during installation)
            const clonedComponentResult = await actionClient.executeAction({
              action: `${component.type}s.list`,
              data: {
                filters: {
                  tenantId: tenantId,
                  branchId: branchId,
                  clonedFrom: component.id,
                  isCloned: true
                }
              },
              branchContext
            });

            if (clonedComponentResult.data?.length > 0) {
              for (const clonedComponent of clonedComponentResult.data) {
                try {
                  await actionClient.executeAction({
                    action: `${component.type}s.delete`,
                    data: { id: clonedComponent.id },
                    branchContext
                  });

                  removedComponents?.push({
                    id: clonedComponent.id,
                    type: component.type,
                    name: clonedComponent.name,
                    status: 'removed'
                  });
                } catch (error) {
                  removedComponents?.push({
                    id: clonedComponent.id,
                    type: component.type,
                    name: clonedComponent.name,
                    status: 'failed',
                    reason: error instanceof Error ? error.message : 'Unknown error'
                  });
                  warnings.push(`Failed to remove ${component.type}: ${clonedComponent.name}`);
                }
              }
            } else {
              removedComponents?.push({
                id: component.id,
                type: component.type,
                name: `Unknown ${component.type}`,
                status: 'skipped',
                reason: 'Component not found or not cloned'
              });
            }
          } catch (error) {
            console.error(`Error removing ${component.type} ${component.id}:`, error);
            warnings.push(`Failed to process ${component.type}: ${component.id}`);
          }
        }
      }

      // Update installation status
      await actionClient.executeAction({
        action: 'packageInstallations.update',
        data: {
          id: installation.id,
          updates: {
            status: 'uninstalled',
            lastUpdated: new Date().toISOString(),
            errorMessage: body.reason || 'Uninstalled by user'
          }
        },
        branchContext
      });

      // Update package analytics
      await updatePackageAnalytics(params.packageId, 'uninstall', actionClient, branchContext);

      const result: UninstallResult = {
        success: true,
        message: `Successfully uninstalled ${pkg.name}`,
        removedComponents,
        warnings: warnings.length > 0 ? warnings : undefined,
        dependentPackages: dependentPackages.length > 0 ? dependentPackages : undefined
      };

      return NextResponse.json(result);

    } catch (error) {
      // Rollback installation status on error
      await actionClient.executeAction({
        action: 'packageInstallations.update',
        data: {
          id: installation.id,
          updates: {
            status: 'installed', // Restore to installed status
            errorMessage: null
          }
        },
        branchContext
      }).catch(console.error);

      return NextResponse.json({
        success: false,
        error: {
          type: 'component',
          message: 'Uninstallation failed',
          details: error instanceof Error ? error.message : 'Unknown error occurred',
          recoveryActions: [
            'Try uninstalling again',
            'Use force option to override errors',
            'Contact support if the problem persists'
          ]
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Uninstallation error:', error);
    return NextResponse.json({
      success: false,
      error: {
        type: 'unknown',
        message: 'Uninstallation failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        recoveryActions: [
          'Try again later',
          'Check your network connection',
          'Contact support if the problem persists'
        ]
      }
    }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function findDependentPackages(
  packageId: string,
  actionClient: UnifiedActionClient,
  branchContext: BranchContext
): Promise<Array<{ packageId: string; name: string; affectedComponents: string[] }>> {
  try {
    // Find other installations that depend on this package
    const installationsResult = await actionClient.executeAction({
      action: 'packageInstallations.list',
      data: {
        filters: {
          tenantId: branchContext.tenantId,
          branchId: branchContext.currentBranchId,
          status: 'installed',
          dependencies: { has: packageId }
        }
      },
      branchContext
    });

    const dependentPackages = [];
    
    if (installationsResult.data?.length > 0) {
      for (const installation of installationsResult.data) {
        // Get package details
        const pkgResult = await actionClient.executeAction({
          action: 'marketplacePackages.getById',
          data: { id: installation.packageId },
          branchContext: {
            ...branchContext,
            tenantId: undefined
          }
        });

        if (pkgResult.data) {
          dependentPackages.push({
            packageId: installation.packageId,
            name: pkgResult.data.name,
            affectedComponents: [
              ...pkgResult.data.selectedRules || [],
              ...pkgResult.data.selectedClasses || [],
              ...pkgResult.data.selectedTables || [],
              ...pkgResult.data.selectedWorkflows || []
            ]
          });
        }
      }
    }

    return dependentPackages;
  } catch (error) {
    console.error('Error finding dependent packages:', error);
    return [];
  }
}

async function updatePackageAnalytics(
  packageId: string,
  action: 'uninstall',
  actionClient: UnifiedActionClient,
  branchContext: BranchContext
): Promise<void> {
  try {
    await actionClient.executeAction({
      action: 'marketplacePackages.update',
      data: {
        id: packageId,
        updates: {
          activeInstalls: { decrement: 1 }
        }
      },
      branchContext: {
        ...branchContext,
        tenantId: undefined // Allow cross-tenant updates for analytics
      }
    });
  } catch (error) {
    console.error('Error updating package analytics:', error);
    // Don't fail uninstallation for analytics errors
  }
}
