/**
 * Branch resolution utilities for Prisma operations
 */

import type { PrismaServiceContext } from './types';

// Type-only import for now - will be injected
type PrismaClient = any;

/**
 * Resolve branch ID if needed
 */
export async function resolveBranchId(
  prismaClient: PrismaClient,
  branchId: string,
  tenantId: string
): Promise<string> {
  // For now, just return the branchId as-is
  // In the future, this could validate the branch exists, resolve aliases, etc.
  return branchId;
}

/**
 * Resolve full branch context
 */
export async function resolveBranchContext(
  prismaClient: PrismaClient,
  context: PrismaServiceContext
): Promise<PrismaServiceContext> {
  const resolvedBranchId = await resolveBranchId(
    prismaClient,
    context.branchId,
    context.tenantId
  );
  
  return {
    ...context,
    branchId: resolvedBranchId
  };
}

/**
 * Check if a branch exists
 */
export async function branchExists(
  prismaClient: PrismaClient,
  branchId: string,
  tenantId: string
): Promise<boolean> {
  try {
    const branch = await prismaClient.branch.findFirst({
      where: {
        id: branchId,
        tenantId
      }
    });
    return !!branch;
  } catch (error) {
    
    return false;
  }
}

/**
 * Get default branch for a tenant
 */
export async function getDefaultBranch(
  prismaClient: PrismaClient,
  tenantId: string
): Promise<string> {
  const branch = await prismaClient.branch.findFirst({
    where: {
      tenantId,
      isDefault: true
    }
  });
  return branch?.id;
}