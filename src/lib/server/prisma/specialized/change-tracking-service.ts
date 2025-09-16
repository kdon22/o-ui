/**
 * Change Tracking Service - Focused service for version history and audit trails
 * 
 * Handles:
 * - Entity change logging for CREATE/UPDATE/DELETE operations
 * - Field-level change calculation and comparison
 * - Version history integration with changelog service
 * - Audit trail maintenance for compliance
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import type { ChangeType } from '@prisma/client';

export class ChangeTrackingService {
  /**
   * Track entity change for version history and audit trail
   */
  async trackEntityChange(
    afterData: any,
    beforeData: any,
    changeType: ChangeType,
    schema: ResourceSchema,
    context: any,
    operationType: string
  ): Promise<void> {
    try {
      const entityType = schema.modelName;
      const entityId = afterData?.id || beforeData?.id;
      
      if (!entityId || !entityType) {
        console.warn('⚠️ [ChangeTracking] Cannot track change - missing entity info:', {
          entityId,
          entityType,
          changeType
        });
        return;
      }

      console.log('📊 [ChangeTracking] Tracking entity change', {
        entityType,
        entityId,
        changeType,
        operationType,
        hasBefore: !!beforeData,
        hasAfter: !!afterData
      });

      // Calculate field-level changes
      const fieldChanges = beforeData && afterData 
        ? this.calculateFieldChanges(beforeData, afterData)
        : null;

      // Import change log service dynamically to avoid circular deps
      const { changeLogService } = await import('../../services/changelog-service');
      
      // Log the change using the changelog service
      await changeLogService.logChange({
        entityType,
        entityId,
        changeType,
        beforeData: beforeData || null,
        afterData: afterData || null,
        fieldChanges,
        context: {
          tenantId: context.tenantId,
          userId: context.userId,
          branchId: context.branchId,
          sessionId: context.sessionId,
          requestId: context.requestId,
          operationType,
          reason: `${operationType} via PrismaService`,
          description: `${changeType} operation on ${entityType}`,
          tags: [operationType, changeType.toLowerCase()]
        }
      });

      console.log('✅ [ChangeTracking] Version tracked successfully:', {
        entityType,
        entityId,
        changeType,
        operationType,
        hasFieldChanges: !!fieldChanges
      });

    } catch (error) {
      console.error('❌ [ChangeTracking] Failed to track entity change:', {
        error: error instanceof Error ? error.message : error,
        changeType,
        entityType: schema.modelName
      });
      // Don't rethrow - version tracking failures shouldn't break operations
    }
  }

  /**
   * Calculate field-level changes between before and after data
   */
  calculateFieldChanges(beforeData: any, afterData: any): any {
    const changes: any = {};
    
    // Get all unique field names from both objects
    const allFields = new Set([
      ...Object.keys(beforeData || {}),
      ...Object.keys(afterData || {})
    ]);

    console.log('🔍 [ChangeTracking] Calculating field changes', {
      totalFields: allFields.size,
      beforeFields: Object.keys(beforeData || {}).length,
      afterFields: Object.keys(afterData || {}).length
    });

    let changedFieldsCount = 0;

    for (const field of allFields) {
      const beforeValue = beforeData?.[field];
      const afterValue = afterData?.[field];

      // Skip system fields that change automatically
      if (['updatedAt', 'version', 'updatedById'].includes(field)) {
        continue;
      }

      // Compare values (handle null/undefined equivalence)
      const beforeNormalized = beforeValue === null ? undefined : beforeValue;
      const afterNormalized = afterValue === null ? undefined : afterValue;

      // Use JSON.stringify for deep comparison of complex objects/arrays
      const beforeStr = JSON.stringify(beforeNormalized);
      const afterStr = JSON.stringify(afterNormalized);

      if (beforeStr !== afterStr) {
        changes[field] = {
          from: beforeValue,
          to: afterValue,
          type: beforeValue === undefined ? 'added' : 
                afterValue === undefined ? 'deleted' : 'modified'
        };
        changedFieldsCount++;
      }
    }

    console.log('📊 [ChangeTracking] Field change calculation completed', {
      changedFields: changedFieldsCount,
      totalFields: allFields.size,
      hasChanges: changedFieldsCount > 0
    });

    return changedFieldsCount > 0 ? changes : undefined;
  }

  /**
   * Track multiple related changes in a batch (for complex operations)
   */
  async trackBatchChanges(
    changes: Array<{
      afterData: any;
      beforeData?: any;
      changeType: ChangeType;
      schema: ResourceSchema;
      context: any;
      operationType: string;
    }>
  ): Promise<void> {
    console.log('📦 [ChangeTracking] Tracking batch changes', {
      changeCount: changes.length,
      types: changes.map(c => c.changeType)
    });

    const trackingPromises = changes.map(change => 
      this.trackEntityChange(
        change.afterData,
        change.beforeData || null,
        change.changeType,
        change.schema,
        change.context,
        change.operationType
      )
    );

    try {
      await Promise.all(trackingPromises);
      console.log('✅ [ChangeTracking] Batch change tracking completed');
    } catch (error) {
      console.error('❌ [ChangeTracking] Batch change tracking failed:', error);
      // Don't rethrow - main operations shouldn't fail due to tracking issues
    }
  }

  /**
   * Get change summary for reporting/auditing
   */
  generateChangeSummary(beforeData: any, afterData: any): string {
    const fieldChanges = this.calculateFieldChanges(beforeData, afterData);
    
    if (!fieldChanges) {
      return 'No changes detected';
    }

    const changeDescriptions = Object.entries(fieldChanges).map(([field, change]: [string, any]) => {
      switch (change.type) {
        case 'added':
          return `Added ${field}: ${JSON.stringify(change.to)}`;
        case 'deleted':
          return `Removed ${field}: ${JSON.stringify(change.from)}`;
        case 'modified':
          return `Changed ${field}: ${JSON.stringify(change.from)} → ${JSON.stringify(change.to)}`;
        default:
          return `Modified ${field}`;
      }
    });

    return changeDescriptions.join(', ');
  }
}
