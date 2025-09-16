/**
 * Delete Operations Service - Focused service for DELETE operations
 * 
 * Handles:
 * - Single record deletion with branch awareness
 * - Compound ID handling for branch-aware deletes
 * - Version tracking for delete operations
 * - Safe deletion with proper error handling
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import type { PrismaServiceContext } from '../core/types';
import { resolveBranchContext } from '../core/branch-resolver';
import { getModelName } from '../core/model-utils';

// Type-only import for now - will be injected
type PrismaClient = any;

export class DeleteOperationsService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Get Prisma model by name
   */
  private getModel(modelName: string): any {
    const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const model = (this.prisma as any)[camelCaseModelName];
    if (!model) {
      throw new Error(`Unknown model: ${modelName}`);
    }
    return model;
  }

  /**
   * Extract base ID from compound IDs with branch information
   */
  private cleanCompoundId(id: string): string {
    if (id && typeof id === 'string' && id.includes(':branch:')) {
      return id.split(':branch:')[0];
    }
    return id;
  }

  /**
   * Generic DELETE operation
   */
  async delete(
    schema: ResourceSchema,
    id: string,
    context: PrismaServiceContext
  ): Promise<void> {
    try {
      // Clean compound ID to extract base ID
      const cleanId = this.cleanCompoundId(id);
      
      const modelName = getModelName(schema);
      const model = this.getModel(modelName);
      const resolvedContext = await resolveBranchContext(this.prisma, context);

      console.log('🗑️ [DeleteOperations] Starting delete operation', {
        modelName,
        originalId: id,
        cleanId,
        branchId: resolvedContext.branchId,
        tenantId: resolvedContext.tenantId
      });

      // Find the existing record using cleaned ID
      const existingRecord = await model.findFirst({
        where: {
          id: cleanId,
          tenantId: resolvedContext.tenantId,
          branchId: resolvedContext.branchId
        }
      });

      if (!existingRecord) {
        console.warn('⚠️ [DeleteOperations] Record not found for deletion', {
          modelName,
          cleanId,
          branchId: resolvedContext.branchId
        });
        // Don't throw error - deletion is idempotent
        return;
      }

      console.log('🔍 [DeleteOperations] Record found, proceeding with deletion', {
        modelName,
        recordId: existingRecord.id,
        recordData: {
          id: existingRecord.id,
          name: existingRecord.name || existingRecord.title || '[unnamed]',
          branchId: existingRecord.branchId
        }
      });

      // Track the deletion before actually deleting (for version history)
      await this.trackDeletion(existingRecord, schema, resolvedContext);

      // Delete the record from the current branch
      await model.deleteMany({
        where: {
          id: cleanId,
          tenantId: resolvedContext.tenantId,
          branchId: resolvedContext.branchId
        }
      });

      console.log('✅ [DeleteOperations] Delete operation completed', {
        modelName,
        deletedId: cleanId,
        branchId: resolvedContext.branchId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('🚨 [DeleteOperations] Delete operation failed:', error);
      throw error;
    }
  }

  /**
   * Track deletion for version history
   */
  private async trackDeletion(
    deletedRecord: any,
    schema: ResourceSchema,
    context: any
  ): Promise<void> {
    try {
      // Import here to avoid circular dependency
      const { changeLogService } = await import('../../services/changelog-service');
      
      await changeLogService.logChange({
        entityType: schema.modelName || (schema as any).actionPrefix,
        entityId: deletedRecord.id,
        changeType: 'DELETE' as any,
        beforeData: deletedRecord,
        afterData: null,
        context: {
          tenantId: context.tenantId,
          userId: context.userId,
          branchId: context.branchId,
          operationType: 'entity_delete',
          tags: ['delete', 'prisma_service']
        }
      });

      console.log('📊 [DeleteOperations] Deletion tracked in version history', {
        entityType: schema.modelName,
        entityId: deletedRecord.id,
        branchId: context.branchId
      });
    } catch (changeLogError) {
      console.warn('⚠️ [DeleteOperations] Failed to track deletion in version history:', changeLogError);
      // Don't throw - deletion succeeded, logging is secondary
    }
  }
}
