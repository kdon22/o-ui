/**
 * Change Tracking Helper - Client-Side Integration
 * 
 * Integrates with write operations to track changes for:
 * - Version snapshots
 * - Change logs
 * - Branch statistics
 * - Activity tracking
 */

import type { BranchContext } from '../types';
import type { ActionResponse } from '@/lib/resource-system/schemas';

// ============================================================================
// TYPES
// ============================================================================

export interface ChangeTrackingContext {
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: any;
  afterData?: any;
  branchContext: BranchContext | null;
  sessionId?: string;
  requestId?: string;
  batchId?: string;
  reason?: string;
  description?: string;
  tags?: string[];
}

export interface ChangeTrackingResult {
  versionId?: string;
  changeLogId?: string;
  tracked: boolean;
  error?: string;
}

// ============================================================================
// CHANGE TRACKING HELPER
// ============================================================================

export class ChangeTrackingHelper {
  
  /**
   * Track a change operation (called after successful API response)
   */
  async trackChange(
    context: ChangeTrackingContext,
    apiResult: ActionResponse
  ): Promise<ChangeTrackingResult> {
    
    try {
      console.log('📊 [ChangeTrackingHelper] Tracking change:', {
        action: context.action,
        entityType: context.entityType,
        entityId: context.entityId,
        branchId: context.branchContext?.currentBranchId,
        timestamp: new Date().toISOString()
      });

      // Only track write operations
      if (!this.shouldTrackChange(context.action)) {
        return { tracked: false };
      }

      // Determine change type from action
      const changeType = this.getChangeTypeFromAction(context.action);
      
      // Determine operation type
      const operationType = this.getOperationTypeFromAction(context.action);

      // Calculate field changes for updates
      const fieldChanges = (changeType === 'UPDATE' && context.beforeData && context.afterData) 
        ? this.calculateFieldChanges(context.beforeData, context.afterData)
        : undefined;

      // Prepare tracking request
      const trackingRequest = {
        action: 'changeLog.create',
        data: {
          operationType,
          entityType: context.entityType,
          entityId: context.entityId,
          originalEntityId: this.extractOriginalEntityId(context.afterData || context.beforeData),
          changeType,
          beforeData: context.beforeData,
          afterData: context.afterData || apiResult.data,
          fieldChanges,
          branchId: context.branchContext?.currentBranchId,
          tenantId: context.branchContext?.tenantId,
          userId: context.branchContext?.userId || 'system',
          sessionId: context.sessionId,
          requestId: context.requestId,
          batchId: context.batchId,
          reason: context.reason,
          description: context.description || this.generateDescription(context.action, context.entityType),
          tags: context.tags || this.generateTags(context.action, context.entityType)
        }
      };

      console.log('📝 [ChangeTrackingHelper] Sending tracking request:', {
        action: trackingRequest.action,
        operationType,
        changeType,
        entityType: context.entityType,
        entityId: context.entityId,
        hasFieldChanges: !!fieldChanges,
        timestamp: new Date().toISOString()
      });

      // 🏆 GOLD STANDARD: Call actual version tracking API
      const response = await fetch('/api/workspaces/current/actions/version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changeLog.create',
          data: trackingRequest.data
        })
      });

      if (!response.ok) {
        throw new Error(`Version tracking API failed: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(`Version tracking failed: ${result.error}`);
      }

      console.log('✅ [ChangeTrackingHelper] Version tracked successfully:', {
        versionId: result.data?.versionId,
        changeLogId: result.data?.changeLogId,
        timestamp: new Date().toISOString()
      });
      
      return {
        tracked: true,
        versionId: result.data?.versionId,
        changeLogId: result.data?.changeLogId
      };
      
    } catch (error) {
      console.error('❌ [ChangeTrackingHelper] Failed to track change:', {
        action: context.action,
        entityType: context.entityType,
        entityId: context.entityId,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
      
      return {
        tracked: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate a batch ID for grouping related changes
   */
  generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate a request ID for tracking atomic operations
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Determine if we should track this action
   */
  private shouldTrackChange(action: string): boolean {
    const trackableActions = ['.create', '.update', '.delete'];
    return trackableActions.some(suffix => action.endsWith(suffix));
  }

  /**
   * Get change type from action
   */
  private getChangeTypeFromAction(action: string): 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE' | 'ROLLBACK' | 'BRANCH_COPY' {
    if (action.endsWith('.create')) return 'CREATE';
    if (action.endsWith('.update')) return 'UPDATE';
    if (action.endsWith('.delete')) return 'DELETE';
    if (action.includes('.merge')) return 'MERGE';
    if (action.includes('.rollback')) return 'ROLLBACK';
    if (action.includes('.copy')) return 'BRANCH_COPY';
    return 'UPDATE'; // Default fallback
  }

  /**
   * Get operation type from action
   */
  private getOperationTypeFromAction(action: string): string {
    if (action.endsWith('.create')) return 'entity_create';
    if (action.endsWith('.update')) return 'entity_update';
    if (action.endsWith('.delete')) return 'entity_delete';
    if (action.includes('.merge')) return 'merge';
    if (action.includes('.rollback')) return 'rollback';
    return 'entity_operation';
  }

  /**
   * Extract original entity ID for lineage tracking
   */
  private extractOriginalEntityId(data: any): string | undefined {
    if (!data) return undefined;
    
    // Look for common original ID patterns
    const originalIdFields = [
      'originalId',
      'originalNodeId',
      'originalRuleId',
      'originalProcessId',
      'originalWorkflowId',
      'originalOfficeId'
    ];
    
    for (const field of originalIdFields) {
      if (data[field]) return data[field];
    }
    
    return undefined;
  }

  /**
   * Calculate field-level changes between before and after data
   */
  private calculateFieldChanges(beforeData: any, afterData: any): Record<string, any> {
    const changes: Record<string, any> = {};
    
    // Get all unique field names
    const allFields = new Set([
      ...Object.keys(beforeData || {}),
      ...Object.keys(afterData || {})
    ]);

    for (const field of allFields) {
      const beforeValue = beforeData?.[field];
      const afterValue = afterData?.[field];

      if (beforeValue === undefined && afterValue !== undefined) {
        // Field added
        changes[field] = { from: undefined, to: afterValue, type: 'added' };
      } else if (beforeValue !== undefined && afterValue === undefined) {
        // Field deleted
        changes[field] = { from: beforeValue, to: undefined, type: 'deleted' };
      } else if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        // Field modified
        changes[field] = { from: beforeValue, to: afterValue, type: 'modified' };
      }
    }

    return changes;
  }

  /**
   * Generate human-readable description for change
   */
  private generateDescription(action: string, entityType: string): string {
    const [resource, operation] = action.split('.');
    
    const operationMap: Record<string, string> = {
      create: 'Created',
      update: 'Updated', 
      delete: 'Deleted'
    };
    
    const verb = operationMap[operation] || 'Modified';
    return `${verb} ${entityType.toLowerCase()}`;
  }

  /**
   * Generate tags for categorizing changes
   */
  private generateTags(action: string, entityType: string): string[] {
    const [resource, operation] = action.split('.');
    
    const tags = [
      entityType.toLowerCase(),
      operation,
      'user_action'
    ];
    
    // Add entity-specific tags
    if (entityType === 'Rule') {
      tags.push('business_logic');
    } else if (entityType === 'Node') {
      tags.push('hierarchy');
    } else if (entityType === 'Process') {
      tags.push('workflow');
    }
    
    return tags;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const changeTrackingHelper = new ChangeTrackingHelper();
