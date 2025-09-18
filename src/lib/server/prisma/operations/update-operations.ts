/**
 * Update Operations Service - Focused service for UPDATE operations
 * 
 * Handles:
 * - Single record updates with Copy-on-Write support
 * - Bulk updateMany operations
 * - Compound ID handling for branch-aware updates
 * - Relationship processing and data preparation
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import type { PrismaServiceContext } from '../core/types';
import { resolveBranchContext } from '../core/branch-resolver';
import { cleanData, prepareUpdateData, prepareCoWData } from '../core/data-cleaner';
import { getModelName } from '../core/model-utils';
import { buildBranchWhere, buildInclude } from '../core/query-builder';
import { processRelationships } from '../relationship-processor';

// Type-only import for now - will be injected
type PrismaClient = any;

export class UpdateOperationsService {
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
   * Generic UPDATE operation with Copy-on-Write support
   */
  async update(
    schema: ResourceSchema,
    id: string,
    data: any,
    context: PrismaServiceContext
  ): Promise<any> {
    try {
      // Clean compound ID to extract base ID
      const cleanId = this.cleanCompoundId(id);
      
      const modelName = getModelName(schema);
      const model = this.getModel(modelName);
      const resolvedContext = await resolveBranchContext(this.prisma, context);

      console.log('📝 [UpdateOperations] Starting update operation', {
        modelName,
        originalId: id,
        cleanId,
        branchId: resolvedContext.branchId,
        tenantId: resolvedContext.tenantId
      });

      // Find the current record to determine update strategy
      const existingRecord = await model.findFirst({
        where: {
          id: cleanId,
          tenantId: resolvedContext.tenantId
        }
      });

      if (!existingRecord) {
        throw new Error(`${modelName} with ID ${cleanId} not found`);
      }

      // Clean and prepare the update data
      const cleanedData = cleanData(data, schema, 'update');
      
      let updateResult;

      // Copy-on-Write logic: Check if record is on the same branch
      if (existingRecord.branchId === resolvedContext.branchId) {
        // Same branch: Update in place
        updateResult = await this.executeInPlaceUpdate(
          model, 
          cleanId, 
          cleanedData, 
          schema, 
          resolvedContext,
          existingRecord
        );
        
        console.log('✅ [UpdateOperations] In-place update completed', {
          modelName,
          recordId: cleanId,
          sameBranch: true
        });
      } else {
        // Different branch: Copy-on-Write
        updateResult = await this.executeCopyOnWriteUpdate(
          model,
          existingRecord,
          cleanedData,
          schema,
          resolvedContext
        );
        
        console.log('✅ [UpdateOperations] Copy-on-Write update completed', {
          modelName,
          originalId: cleanId,
          newId: updateResult.id,
          originalBranch: existingRecord.branchId,
          newBranch: resolvedContext.branchId
        });
      }

      return updateResult;
    } catch (error) {
      console.error('🚨 [UpdateOperations] Update operation failed:', error);
      throw error;
    }
  }

  /**
   * Execute in-place update (same branch)
   */
  private async executeInPlaceUpdate(
    model: any,
    id: string,
    cleanedData: any,
    schema: ResourceSchema,
    context: any,
    existingRecord: any
  ): Promise<any> {
    // 1) Prepare scalar + relationship payloads
    const updateData: Record<string, any> = prepareUpdateData(cleanedData, context.userId, schema);

    // 2) Partition by schema relationships to avoid dropping scalar fields
    const relationshipConfig: Record<string, any> = (schema as any)?.relationships || {};
    const relationshipUpdates: Record<string, any> = {};
    const scalarUpdates: Record<string, any> = {};

    Object.keys(updateData).forEach((key) => {
      if (relationshipConfig[key]) {
        relationshipUpdates[key] = updateData[key];
      } else {
        scalarUpdates[key] = updateData[key];
      }
    });

    // 2b) Map one-to-one foreign key scalars (e.g., ruleId) to nested relation connects
    Object.entries(relationshipConfig).forEach(([relationName, cfg]) => {
      if (cfg?.type === 'one-to-one' && cfg?.foreignKey) {
        const fk = cfg.foreignKey as string;
        const fkValue = scalarUpdates[fk];
        if (typeof fkValue === 'string' && fkValue.length > 0) {
          relationshipUpdates[relationName] = { connect: { id: fkValue } };
          delete scalarUpdates[fk];
        }
      }
    });

    // 2c) Remove null scalar fields to avoid violating non-null Prisma columns
    Object.keys(scalarUpdates).forEach((k) => {
      if (scalarUpdates[k] === null) {
        delete scalarUpdates[k];
      }
    });

    // 3) Convert only relationship updates into Prisma nested writes
    const relationshipWrites = processRelationships(relationshipUpdates, relationshipConfig);

    // 4) Merge scalars + relationship writes
    const finalData: Record<string, any> = { ...scalarUpdates, ...relationshipWrites };

    // 4b) Denormalize ruleName for Prompt when ruleId changes
    if (schema.modelName === 'Prompt') {
      const newRuleId = (scalarUpdates as any)?.ruleId;
      if (typeof newRuleId === 'string' && newRuleId.length > 0) {
        try {
          const rule = await (this.prisma as any).rule.findUnique({ where: { id: newRuleId } });
          if (rule?.name) {
            (finalData as any).ruleName = rule.name;
          }
        } catch (e) {
          console.warn('⚠️ [UpdateOperations] Failed to denormalize ruleName for Prompt:', e);
        }
      }
    }

    // 5) Execute update and include full graph per schema
    return await model.update({
      where: { id },
      data: finalData,
      include: buildInclude(schema)
    });
  }

  /**
   * Execute Copy-on-Write update (different branch)
   */
  private async executeCopyOnWriteUpdate(
    model: any,
    existingRecord: any,
    cleanedData: any,
    schema: ResourceSchema,
    context: any
  ): Promise<any> {
    // Prepare data for Copy-on-Write creation
    const cowData = prepareCoWData(
      existingRecord,
      cleanedData,
      context,
      schema
    );

    // Process any relationships for the new record
    const processedData = await processRelationships(cowData, schema);

    // 🚀 CRITICAL FIX: Create the new branch-specific record with include clause
    return await model.create({
      data: processedData,
      include: buildInclude(schema)
    });
  }

  /**
   * Generic UPDATE MANY operation
   */
  async updateMany(
    schema: ResourceSchema,
    where: any,
    data: any,
    context: PrismaServiceContext
  ): Promise<{ count: number }> {
    try {
      const modelName = getModelName(schema);
      const model = this.getModel(modelName);
      const resolvedContext = await resolveBranchContext(this.prisma, context);

      console.log('📝 [UpdateOperations] Starting updateMany operation', {
        modelName,
        whereConditions: Object.keys(where).length,
        branchId: resolvedContext.branchId,
        tenantId: resolvedContext.tenantId
      });

      // Clean and prepare update data
      const cleanedData = cleanData(data, schema, 'update');
      const updateData = prepareUpdateData(cleanedData, resolvedContext.userId, schema);

      // Build branch-aware where clause
      const branchWhere = buildBranchWhere(
        where, 
        resolvedContext.branchId, 
        !!resolvedContext.tenantId,
        true // hasBranchContext
      );

      // Execute the bulk update
      const result = await model.updateMany({
        where: branchWhere,
        data: updateData
      });

      console.log('✅ [UpdateOperations] UpdateMany completed', {
        modelName,
        updatedCount: result.count,
        timestamp: new Date().toISOString()
      });

      return { count: result.count };
    } catch (error) {
      console.error('🚨 [UpdateOperations] UpdateMany operation failed:', error);
      throw error;
    }
  }
}
