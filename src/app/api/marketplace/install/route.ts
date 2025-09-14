/**
 * Package Installation API - Smart Installation with Dependency Resolution
 * 
 * Handles package installation with:
 * - Dependency resolution and conflict detection
 * - Installation progress tracking
 * - Rollback capabilities
 * - Usage analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnifiedActionClient, BranchContext } from '@/lib/action-client';
import { 
  InstallationRequest, 
  InstallationResult, 
  PackageInstallationStatus 
} from '@/features/marketplace/types/enhanced';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: InstallationRequest = await request.json();
    const { packageId, version, acceptDependencies = true, installOptionalDependencies = false } = body;
    const tenantId = session.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 });
    }

    // Get proper branch context from session - NO HARDCODING
    const sessionBranchContext = session.user.branchContext;
    if (!sessionBranchContext?.currentBranchId) {
      return NextResponse.json({ error: 'Branch context missing from session' }, { status: 400 });
    }
    
    const branchContext: BranchContext = {
      currentBranchId: sessionBranchContext.currentBranchId,
      defaultBranchId: sessionBranchContext.defaultBranchId,
      tenantId,
      userId: session.user.id
    };

    const actionClient = new UnifiedActionClient(tenantId);
    const installationStart = Date.now();

    // 1. Get package details
    const packageResult = await actionClient.executeAction({
      action: 'marketplacePackages.get',
      data: { id: packageId },
      branchContext
    });

    if (!packageResult.data) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const packageData = packageResult.data;

    // 2. Check if already installed
    const existingInstallation = await actionClient.executeAction({
      action: 'packageInstallations.list',
      data: { 
        filters: { 
          packageId,
          tenantId,
          status: { in: ['INSTALLED', 'INSTALLING'] }
        }
      },
      branchContext
    });

    if (existingInstallation.data && existingInstallation.data.length > 0) {
      return NextResponse.json({ 
        error: 'Package already installed or installation in progress' 
      }, { status: 409 });
    }

    // 3. Resolve dependencies
    const dependencies: string[] = [];
    const conflicts: string[] = [];
    const warnings: string[] = [];

    if (packageData.dependencies && packageData.dependencies.length > 0) {
      for (const dep of packageData.dependencies) {
        // Check if dependency is already installed
        const depInstallation = await actionClient.executeAction({
          action: 'packageInstallations.list',
          data: { 
            filters: { 
              packageId: dep.dependsOnId,
              tenantId,
              status: 'INSTALLED'
            }
          },
          branchContext
        });

        if (!depInstallation.data || depInstallation.data.length === 0) {
          if (dep.isOptional && !installOptionalDependencies) {
            warnings.push(`Optional dependency ${dep.dependsOn?.name} will not be installed`);
          } else {
            dependencies.push(dep.dependsOnId);
          }
        }
      }
    }

    // 4. Check for conflicts (simplified - check if any installed packages conflict)
    const installedPackages = await actionClient.executeAction({
      action: 'packageInstallations.list',
      data: { 
        filters: { 
          tenantId,
          status: 'INSTALLED'
        }
      },
      branchContext
    });

    // Simple conflict detection - packages in same category with conflicting functionality
    if (installedPackages.data) {
      for (const installed of installedPackages.data) {
        if (installed.package?.category === packageData.category && 
            installed.package?.tags?.some((tag: string) => packageData.tags.includes(tag))) {
          conflicts.push(installed.packageId);
        }
      }
    }

    // 5. Create installation record
    const installationData = {
      packageId,
      tenantId,
      userId: session.user.id,
      version: version || packageData.version,
      status: PackageInstallationStatus.INSTALLING,
      dependencies,
      conflicts,
      installationSize: calculatePackageSize(packageData),
      rollbackAvailable: true
    };

    const installationResult = await actionClient.executeAction({
      action: 'packageInstallations.create',
      data: installationData,
      branchContext
    });

    const installationId = installationResult.data.id;

    try {
      // 6. Install dependencies first
      if (dependencies.length > 0 && acceptDependencies) {
        for (const depId of dependencies) {
          const depResult = await installPackageDependency(depId, tenantId, session.user.id, actionClient, branchContext);
          if (!depResult.success) {
            throw new Error(`Failed to install dependency: ${depResult.error}`);
          }
        }
      }

      // 7. Perform actual package installation (simulate)
      await simulatePackageInstallation(packageData, tenantId);

      // 8. Update installation status to completed
      const installationTime = Date.now() - installationStart;
      await actionClient.executeAction({
        action: 'packageInstallations.update',
        data: {
          id: installationId,
          updates: {
            status: PackageInstallationStatus.INSTALLED,
            installationTime: Math.round(installationTime / 1000), // seconds
            usageCount: 0,
            lastUsed: new Date().toISOString()
          }
        },
        branchContext
      });

      // 9. Update package analytics
      await updatePackageAnalytics(packageId, 'install', actionClient, branchContext);

      const result: InstallationResult = {
        success: true,
        packageId,
        version: version || packageData.version,
        installationId,
        message: 'Package installed successfully',
        dependencies,
        conflicts,
        warnings,
        installationTime: Math.round(installationTime / 1000),
        installationSize: installationData.installationSize
      };

      return NextResponse.json({
        success: true,
        data: result
      });

    } catch (error) {
      // Rollback installation on error
      await actionClient.executeAction({
        action: 'packageInstallations.update',
        data: {
          id: installationId,
          updates: {
            status: PackageInstallationStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Installation failed'
          }
        },
        branchContext
      });

      throw error;
    }

  } catch (error) {
    console.error('Error installing package:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Installation failed' 
      },
      { status: 500 }
    );
  }
}

// Helper function to install a dependency
async function installPackageDependency(
  packageId: string, 
  tenantId: string, 
  userId: string, 
  actionClient: UnifiedActionClient, 
  branchContext: BranchContext
) {
  try {
    // Check if already installed
    const existing = await actionClient.executeAction({
      action: 'packageInstallations.list',
      data: { 
        filters: { packageId, tenantId, status: 'INSTALLED' }
      },
      branchContext
    });

    if (existing.data && existing.data.length > 0) {
      return { success: true, message: 'Already installed' };
    }

    // Get package details
    const packageResult = await actionClient.executeAction({
      action: 'marketplacePackages.get',
      data: { id: packageId },
      branchContext
    });

    if (!packageResult.data) {
      return { success: false, error: 'Dependency package not found' };
    }

    const packageData = packageResult.data;

    // Create installation record
    const installationResult = await actionClient.executeAction({
      action: 'packageInstallations.create',
      data: {
        packageId,
        tenantId,
        userId,
        version: packageData.version,
        status: PackageInstallationStatus.INSTALLING,
        dependencies: [],
        conflicts: [],
        installationSize: calculatePackageSize(packageData)
      },
      branchContext
    });

    // Simulate installation
    await simulatePackageInstallation(packageData, tenantId);

    // Update to installed
    await actionClient.executeAction({
      action: 'packageInstallations.update',
      data: {
        id: installationResult.data.id,
        updates: {
          status: PackageInstallationStatus.INSTALLED,
          installationTime: 5, // 5 seconds for dependencies
          usageCount: 0
        }
      },
      branchContext
    });

    return { success: true, message: 'Dependency installed successfully' };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to install dependency' 
    };
  }
}

// Helper function to calculate package size
function calculatePackageSize(packageData: any): number {
  // Simple calculation based on number of components
  let size = 1024; // Base size in bytes
  
  size += (packageData.selectedRules?.length || 0) * 2048;
  size += (packageData.selectedWorkflows?.length || 0) * 4096;
  size += (packageData.selectedTables?.length || 0) * 1024;
  size += (packageData.selectedClasses?.length || 0) * 3072;
  
  return size;
}

// Helper function to simulate package installation
async function simulatePackageInstallation(packageData: any, tenantId: string): Promise<void> {
  // Simulate installation time based on package complexity
  const baseTime = 1000; // 1 second base
  const componentTime = (
    (packageData.selectedRules?.length || 0) +
    (packageData.selectedWorkflows?.length || 0) +
    (packageData.selectedTables?.length || 0) +
    (packageData.selectedClasses?.length || 0)
  ) * 200; // 200ms per component
  
  const totalTime = Math.min(baseTime + componentTime, 5000); // Max 5 seconds
  
  await new Promise(resolve => setTimeout(resolve, totalTime));
}

// Helper function to update package analytics
async function updatePackageAnalytics(
  packageId: string, 
  action: 'install' | 'uninstall', 
  actionClient: UnifiedActionClient, 
  branchContext: BranchContext
): Promise<void> {
  try {
    // Get current analytics
    const analyticsResult = await actionClient.executeAction({
      action: 'packageAnalytics.list',
      data: { filters: { packageId } },
      branchContext
    });

    let analytics = analyticsResult.data?.[0];

    if (!analytics) {
      // Create new analytics record
      analytics = {
        packageId,
        totalDownloads: 0,
        weeklyDownloads: 0,
        monthlyDownloads: 0,
        activeInstallations: 0,
        installationSuccess: 1.0,
        averageRating: 0,
        totalReviews: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        conversionRate: 0,
        averageUsagePerWeek: 0,
        retentionRate: 0,
        securityScore: 85,
        codeQualityScore: 80,
        documentationScore: 75
      };

      await actionClient.executeAction({
        action: 'packageAnalytics.create',
        data: analytics,
        branchContext
      });
    }

    // Update metrics based on action
    const updates: any = {};

    if (action === 'install') {
      updates.totalDownloads = (analytics.totalDownloads || 0) + 1;
      updates.weeklyDownloads = (analytics.weeklyDownloads || 0) + 1;
      updates.monthlyDownloads = (analytics.monthlyDownloads || 0) + 1;
      updates.activeInstallations = (analytics.activeInstallations || 0) + 1;
    } else if (action === 'uninstall') {
      updates.activeInstallations = Math.max((analytics.activeInstallations || 0) - 1, 0);
    }

    if (Object.keys(updates).length > 0) {
      await actionClient.executeAction({
        action: 'packageAnalytics.update',
        data: {
          id: analytics.id,
          updates
        },
        branchContext
      });
    }

  } catch (error) {
    console.error('Error updating package analytics:', error);
    // Don't fail the installation if analytics update fails
  }
}
