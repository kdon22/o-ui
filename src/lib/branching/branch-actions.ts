/**
 * Branch Actions
 * 
 * High-level branch operations using the centralized ActionClient system
 * All operations go through the action system for consistency and caching
 */

import type { ActionClient } from '@/lib/action-client/action-client-core';
import type { 
  Branch, 
  BranchContext,
  CreateBranchInput,
  UpdateBranchInput,
  DeleteBranchInput,
  SwitchBranchInput,
  BranchDiff,
  MergeResult,
  BranchStatus,
  BranchActivity
} from './types';

// ============================================================================
// BRANCH ACTIONS CLASS
// ============================================================================

export class BranchActions {
  constructor(private actionClient: ActionClient) {}

  // ============================================================================
  // CORE BRANCH OPERATIONS
  // ============================================================================

  /**
   * Create a new branch
   */
  async createBranch(input: CreateBranchInput): Promise<Branch> {
    console.log('[BranchActions] Creating branch:', input.name);
    
    const response = await this.actionClient.executeAction({
      action: 'branches.create',
      data: {
        name: input.name,
        description: input.description
        // Removed sourceBranchId and copyData as they're not in Prisma schema
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create branch');
    }

    console.log('[BranchActions] Successfully created branch:', response.data.name);
    return response.data as Branch;
  }

  /**
   * Update branch metadata
   */
  async updateBranch(input: UpdateBranchInput): Promise<Branch> {
    console.log('[BranchActions] Updating branch:', input.id);
    
    const response = await this.actionClient.executeAction({
      action: 'branches.update',
      data: {
        id: input.id,
        name: input.name,
        description: input.description,
        isLocked: input.isLocked
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update branch');
    }

    console.log('[BranchActions] Successfully updated branch:', response.data.name);
    return response.data as Branch;
  }

  /**
   * Delete a branch
   */
  async deleteBranch(input: DeleteBranchInput): Promise<void> {
    console.log('[BranchActions] Deleting branch:', input.id);
    
    const response = await this.actionClient.executeAction({
      action: 'branches.delete',
      data: {
        id: input.id,
        force: input.force ?? false
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete branch');
    }

    console.log('[BranchActions] Successfully deleted branch:', input.id);
  }

  /**
   * Switch to a different branch
   */
  async switchBranch(input: SwitchBranchInput): Promise<void> {
    console.log('[BranchActions] Switching to branch:', input.branchId);
    
    const response = await this.actionClient.executeAction({
      action: 'branches.switch',
      data: {
        branchId: input.branchId
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to switch branch');
    }

    console.log('[BranchActions] Successfully switched to branch:', input.branchId);
  }

  // ============================================================================
  // BRANCH QUERIES
  // ============================================================================

  /**
   * Get all branches for current tenant
   */
  async getBranches(): Promise<Branch[]> {
    const response = await this.actionClient.executeAction({
      action: 'branches.list'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch branches');
    }

    return response.data as Branch[];
  }

  /**
   * Get branch by ID
   */
  async getBranchById(branchId: string): Promise<Branch | null> {
    const response = await this.actionClient.executeAction({
      action: 'branches.read',
      data: { id: branchId }
    });

    if (!response.success) {
      if (response.error?.includes('not found')) {
        return null;
      }
      throw new Error(response.error || 'Failed to fetch branch');
    }

    return response.data as Branch;
  }

  /**
   * Get branch status (ahead/behind counts, changes, etc.)
   */
  async getBranchStatus(branchId: string): Promise<BranchStatus> {
    const response = await this.actionClient.executeAction({
      action: 'branches.getStatus',
      data: { branchId }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch branch status');
    }

    return response.data as BranchStatus;
  }

  /**
   * Get branch activity (recent changes, active users)
   */
  async getBranchActivity(branchId: string): Promise<BranchActivity> {
    const response = await this.actionClient.executeAction({
      action: 'branches.getActivity',
      data: { branchId }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch branch activity');
    }

    return response.data as BranchActivity;
  }

  // ============================================================================
  // BRANCH COMPARISON & MERGING
  // ============================================================================

  /**
   * Compare two branches and get diff
   */
  async compareBranches(sourceBranchId: string, targetBranchId: string): Promise<BranchDiff> {
    console.log('[BranchActions] Comparing branches:', { sourceBranchId, targetBranchId });
    
    const response = await this.actionClient.executeAction({
      action: 'branches.compare',
      data: {
        sourceBranchId,
        targetBranchId
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to compare branches');
    }

    return response.data as BranchDiff;
  }

  /**
   * Merge one branch into another
   */
  async mergeBranches(
    sourceBranchId: string, 
    targetBranchId: string,
    options?: {
      title?: string;
      description?: string;
      conflictResolutions?: Record<string, any>;
    }
  ): Promise<MergeResult> {
    console.log('[BranchActions] Merging branches:', { sourceBranchId, targetBranchId });
    
    const response = await this.actionClient.executeAction({
      action: 'branches.merge',
      data: {
        sourceBranchId,
        targetBranchId,
        title: options?.title,
        description: options?.description,
        conflictResolutions: options?.conflictResolutions
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to merge branches');
    }

    console.log('[BranchActions] Successfully merged branches');
    return response.data as MergeResult;
  }

  /**
   * Create a pull request for merging branches
   */
  async createPullRequest(
    sourceBranchId: string,
    targetBranchId: string,
    options: {
      title: string;
      description?: string;
    }
  ): Promise<{ id: string; url: string }> {
    console.log('[BranchActions] Creating pull request:', { sourceBranchId, targetBranchId });
    
    const response = await this.actionClient.executeAction({
      action: 'pullRequest.create',
      data: {
        sourceBranchId,
        targetBranchId,
        title: options.title,
        description: options.description
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create pull request');
    }

    return response.data as { id: string; url: string };
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Get comprehensive branch information for UI
   */
  async getBranchSummary(branchId: string): Promise<{
    branch: Branch;
    status: BranchStatus;
    activity: BranchActivity;
  }> {
    const [branch, status, activity] = await Promise.all([
      this.getBranchById(branchId),
      this.getBranchStatus(branchId),
      this.getBranchActivity(branchId)
    ]);

    if (!branch) {
      throw new Error(`Branch not found: ${branchId}`);
    }

    return { branch, status, activity };
  }

  /**
   * Get all branches with their status information
   */
  async getBranchesWithStatus(): Promise<Array<{
    branch: Branch;
    status: BranchStatus;
  }>> {
    const branches = await this.getBranches();
    
    const branchesWithStatus = await Promise.all(
      branches.map(async (branch) => {
        const status = await this.getBranchStatus(branch.id);
        return { branch, status };
      })
    );

    return branchesWithStatus;
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  /**
   * Validate branch name
   */
  validateBranchName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Branch name is required' };
    }

    if (name.length < 2) {
      return { isValid: false, error: 'Branch name must be at least 2 characters' };
    }

    if (name.length > 50) {
      return { isValid: false, error: 'Branch name must be less than 50 characters' };
    }

    // Check for invalid characters
    const invalidChars = /[^a-zA-Z0-9\-_\.]/;
    if (invalidChars.test(name)) {
      return { isValid: false, error: 'Branch name can only contain letters, numbers, hyphens, underscores, and dots' };
    }

    // Check for reserved names
    const reservedNames = ['main', 'master', 'HEAD', 'origin'];
    if (reservedNames.includes(name.toLowerCase())) {
      return { isValid: false, error: 'This branch name is reserved' };
    }

    return { isValid: true };
  }

  /**
   * Check if branch can be deleted
   */
  async canDeleteBranch(branchId: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const branch = await this.getBranchById(branchId);
      
      if (!branch) {
        return { canDelete: false, reason: 'Branch not found' };
      }

      if (branch.isDefault) {
        return { canDelete: false, reason: 'Cannot delete the default branch' };
      }

      if (branch.isLocked) {
        return { canDelete: false, reason: 'Branch is locked' };
      }

      const status = await this.getBranchStatus(branchId);
      if (status.hasLocalChanges) {
        return { canDelete: false, reason: 'Branch has uncommitted changes' };
      }

      return { canDelete: true };
    } catch (error) {
      return { canDelete: false, reason: 'Failed to check branch status' };
    }
  }

  /**
   * Check if branches can be merged
   */
  async canMergeBranches(
    sourceBranchId: string, 
    targetBranchId: string
  ): Promise<{ canMerge: boolean; conflicts?: number; reason?: string }> {
    try {
      const diff = await this.compareBranches(sourceBranchId, targetBranchId);
      
      if (diff.conflicts.length > 0) {
        return { 
          canMerge: false, 
          conflicts: diff.conflicts.length,
          reason: `${diff.conflicts.length} conflicts need to be resolved` 
        };
      }

      if (diff.summary.totalChanges === 0) {
        return { canMerge: false, reason: 'No changes to merge' };
      }

      return { canMerge: true };
    } catch (error) {
      return { canMerge: false, reason: 'Failed to analyze branches for merging' };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let branchActionsInstance: BranchActions | null = null;

export function getBranchActions(actionClient: ActionClient): BranchActions {
  if (!branchActionsInstance) {
    branchActionsInstance = new BranchActions(actionClient);
  }
  return branchActionsInstance;
}

// ============================================================================
// REACT HOOK FOR BRANCH ACTIONS
// ============================================================================

import { getActionClient } from '@/lib/action-client/global-client';
import { useSession } from 'next-auth/react';

export function useBranchActions(): BranchActions | null {
  const { data: session } = useSession();
  
  try {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) {
      return null; // Session not ready yet
    }
    
    const actionClient = getActionClient(tenantId);
    return getBranchActions(actionClient);
  } catch (error) {
    // ActionClient not ready (no tenantId available yet)
    console.warn('[useBranchActions] ActionClient not ready:', error);
    return null;
  }
}