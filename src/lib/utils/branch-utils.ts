/**
 * Branch Utilities
 * 
 * Provides helper functions for branch name resolution and display
 * 
 * @example
 * // Display branch name in UI
 * import { getBranchDisplayName } from '@/lib/utils/branch-utils'
 * const displayName = getBranchDisplayName('branch-uuid-123', availableBranches)
 * 
 * @example
 * // Extract branch info from session
 * import { extractBranchInfo } from '@/lib/utils/branch-utils'
 * const { currentBranch, availableBranches } = extractBranchInfo(session)
 * 
 * @example
 * // Format branch context for logging
 * import { formatBranchContext } from '@/lib/utils/branch-utils'
 * console.log('Branch context:', formatBranchContext(branchContext))
 * 
 * @example
 * // Check if using fallback branch context
 * import { isFallbackBranchContext } from '@/lib/utils/branch-utils'
 * if (isFallbackBranchContext(branchContext)) {
 *   console.log('Using fallback branch context')
 * }
 */

import type { BranchContext } from '@/lib/resource-system/schemas';

export interface BranchInfo {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  lastModified: string;
}

/**
 * Get branch name from branch context
 * Uses session data to resolve branch ID to user-friendly name
 */
export function getBranchDisplayName(
  branchId: string, 
  availableBranches?: BranchInfo[]
): string {
  if (!availableBranches || availableBranches.length === 0) {
    // Fallback to ID if no branch data available
    return `Branch (${branchId.slice(0, 8)}...)`;
  }
  
  const branch = availableBranches.find(b => b.id === branchId);
  return branch?.name || branchId;
}

/**
 * Get branch info from session context
 */
export function extractBranchInfo(session: any): { 
  currentBranch: BranchInfo | null;
  availableBranches: BranchInfo[];
} {
  if (!session?.user?.branchContext) {
    return { currentBranch: null, availableBranches: [] };
  }
  
  const branchContext = session.user.branchContext;
  const availableBranches: BranchInfo[] = branchContext.availableBranches?.map((branch: any) => ({
    id: branch.id,
    name: branch.name,
    description: branch.description,
    isDefault: branch.isDefault,
    lastModified: branch.lastModified
  })) || [];
  
  const currentBranch: BranchInfo | null = availableBranches.find(
    b => b.id === branchContext.currentBranchId
  ) || null;
  
  return { currentBranch, availableBranches };
}

/**
 * Format branch context for logging
 */
export function formatBranchContext(
  branchContext: BranchContext,
  availableBranches?: BranchInfo[]
): string {
  const currentName = getBranchDisplayName(branchContext.currentBranchId, availableBranches);
  const defaultName = getBranchDisplayName(branchContext.defaultBranchId, availableBranches);
  
  return `${currentName} (${branchContext.currentBranchId}) / default: ${defaultName}`;
}

/**
 * Check if branch context is using fallback values
 */
export function isFallbackBranchContext(branchContext: BranchContext): boolean {
  return branchContext.currentBranchId === 'main' && branchContext.defaultBranchId === 'main';
} 