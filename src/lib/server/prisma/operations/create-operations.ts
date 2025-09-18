/**
 * Create Operations Service - Focused service for CREATE operations
 * 
 * Handles:
 * - Regular resource creation with factory data preparation
 * - Junction table creation with idempotent checks
 * - Node hierarchy calculation integration
 * - Version history tracking
 * - Context and audit field management
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import type { PrismaServiceContext } from '../core/types';
import { resolveBranchContext } from '../core/branch-resolver';
import { cleanData, addAuditFields } from '../core/data-cleaner';
import { isJunctionTable } from '@/lib/resource-system/unified-resource-registry';
import { getModelName } from '../core/model-utils';
import { PrismaDataFactory } from '../prisma-data-factory';
import { NodeHierarchyService } from '../specialized/node-hierarchy-service';

// Type-only import for now - will be injected
type PrismaClient = any;

export class CreateOperationsService {
  private prisma: PrismaClient;
  private nodeHierarchyService: NodeHierarchyService;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
    this.nodeHierarchyService = new NodeHierarchyService(prismaClient);
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
   * Generic CREATE operation using ResourceSchema
   */
  async create(data: any, schema: ResourceSchema, context: PrismaServiceContext): Promise<any> {
    try {
      const modelName = getModelName(schema);
      console.log('🏗️ [CreateOperations] Starting create operation', {
        modelName,
        schemaKeys: Object.keys(schema || {}),
        hasModelName: !!(schema as any)?.modelName,
        databaseKey: (schema as any)?.databaseKey,
        actionPrefix: (schema as any)?.actionPrefix
      });
      const model = this.getModel(modelName);
      
      // Resolve branch context
      const resolvedContext = await resolveBranchContext(this.prisma, context);
      
      // Clean and prepare data using the factory approach
      const cleanedData = cleanData(data, schema, 'create');
      
      // Handle junction vs regular table creation
      let createData = cleanedData;
      
      // IMPORTANT: Detect junctions by databaseKey (table name), not modelName
      if (isJunctionTable(schema.databaseKey)) {
        createData = await this.handleJunctionCreation(
          createData, 
          schema, 
          resolvedContext, 
          model, 
          modelName
        );
        // If handleJunctionCreation returns a record, it was idempotent
        if (createData.id) {
          return createData;
        }
      } else {
        // For regular resources, use the clean factory approach
        createData = PrismaDataFactory.prepareForPrisma(cleanedData, schema, resolvedContext, 'create');
      }
      
      // Denormalize ruleName for Prompt entities when ruleId is provided
      if (schema.modelName === 'Prompt') {
        const ruleIdForName = (cleanedData as any)?.ruleId as string | undefined;
        if (ruleIdForName && typeof ruleIdForName === 'string') {
          try {
            const rule = await (this.prisma as any).rule.findUnique({ where: { id: ruleIdForName } });
            if (rule?.name) {
              (createData as any).ruleName = rule.name;
            }
          } catch (e) {
            // Non-blocking: failure to denormalize should not break create
            console.warn('⚠️ [CreateOperations] Failed to denormalize ruleName for Prompt:', e);
          }
        }
      }
      
      // Calculate hierarchy fields for Node entities using focused service
      if (schema.modelName === 'Node') {
        createData = await this.handleNodeHierarchy(createData, resolvedContext);
      }
      
      // Create the record (with idempotent check)
      const result = await this.executeCreate(createData, model, schema);
      
      // Track version history for entity creation
      if (result?.id && !isJunctionTable(schema.databaseKey)) {
        await this.trackEntityChange(result, schema, resolvedContext);
      }
      
      console.log('✅ [CreateOperations] Create operation completed', {
        modelName,
        resultId: result?.id,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('🚨 [CreateOperations] Create operation failed:', error);
      throw error;
    }
  }

  /**
   * Handle junction table creation with idempotent checks
   */
  private async handleJunctionCreation(
    createData: any,
    schema: ResourceSchema,
    resolvedContext: any,
    model: any,
    modelName: string
  ): Promise<any> {
    const schemaConfig = schema as any;
    
    if (!schemaConfig.notHasTenantContext) {
      createData.tenantId = resolvedContext.tenantId;
    }
    
    if (!schemaConfig.notHasBranchContext) {
      createData.branchId = resolvedContext.branchId;
    }
    
    createData = addAuditFields(createData, schema, resolvedContext.userId, true);
    
    // 🎯 ENTERPRISE FIX: Idempotent junction creation
    const compoundWhere: any = {};
    const junctionKeyFields = ['nodeId', 'processId', 'ruleId', 'workflowId', 'tenantId', 'branchId'];
    
    for (const field of junctionKeyFields) {
      if (createData[field] !== undefined && createData[field] !== null) {
        compoundWhere[field] = createData[field];
      }
    }
    
    if (Object.keys(compoundWhere).length > 0) {
      console.log('🔍 [CreateOperations] Checking for existing junction record', {
        modelName,
        compoundWhere,
        timestamp: new Date().toISOString()
      });
      
      const existingJunction = await model.findFirst({
        where: compoundWhere
      });
      
      if (existingJunction) {
        console.log('📋 [CreateOperations] Junction already exists, returning existing record', {
          modelName,
          existingId: existingJunction.id,
          timestamp: new Date().toISOString()
        });
        
        return existingJunction; // Return existing record for idempotent behavior
      }
    }
    
    return createData; // Return modified data for creation
  }

  /**
   * Handle Node hierarchy calculation
   */
  private async handleNodeHierarchy(createData: any, resolvedContext: any): Promise<any> {
    console.log('🌳 [CreateOperations] Delegating to NodeHierarchyService for hierarchy calculation');
    
    // Convert PrismaServiceContext to BranchContext for the hierarchy service
    const branchContext = {
      currentBranchId: resolvedContext.branchId,
      defaultBranchId: resolvedContext.defaultBranchId,
      tenantId: resolvedContext.tenantId,
      userId: resolvedContext.userId
    };
    
    const hierarchy = await this.nodeHierarchyService.calculateHierarchyForCreate(
      createData, 
      branchContext
    );
    
    this.nodeHierarchyService.applyHierarchyToCreateData(createData, hierarchy);
    
    // Ensure no raw foreign key sneaks into Prisma create when relation mapping exists
    if ('parentId' in createData) {
      delete (createData as any).parentId;
    }
    
    return createData;
  }

  /**
   * Execute the actual Prisma create operation with idempotent check
   */
  private async executeCreate(createData: any, model: any, schema: ResourceSchema): Promise<any> {
    let result;
    
    if (createData.id) {
      // Check for existing record with same ID to support idempotent creation
      const existingRecord = await model.findUnique({
        where: { id: createData.id }
      });
      
      if (existingRecord) {
        result = existingRecord;
      } else {
        result = await model.create({
          data: createData
        });
      }
    } else {
      // No ID provided, create normally (Prisma will generate ID)
      result = await model.create({
        data: createData
      });
      
      // Set originalId to the generated ID for new entities
      if (schema.modelName === 'Node' && result.id && !result.originalNodeId) {
        result = await model.update({
          where: { id: result.id },
          data: { originalNodeId: result.id }
        });
      }
    }
    
    return result;
  }

  /**
   * Track version history for entity creation
   */
  private async trackEntityChange(result: any, schema: ResourceSchema, resolvedContext: any): Promise<void> {
    try {
      await this.trackEntityChangeInternal(
        result,
        null, // No before data for create
        'CREATE',
        schema,
        resolvedContext,
        'entity_create'
      );
    } catch (changeLogError) {
      console.warn('⚠️ [CreateOperations] Failed to log entity change:', changeLogError);
      // Don't throw - entity creation succeeded, logging is secondary
    }
  }

  /**
   * Internal change tracking method (moved from main service)
   */
  private async trackEntityChangeInternal(
    afterData: any,
    beforeData: any | null,
    changeType: string,
    schema: ResourceSchema,
    context: any,
    source: string
  ): Promise<void> {
    try {
      // Import here to avoid circular dependency
      const { changeLogService } = await import('../../services/changelog-service');
      
      await changeLogService.logChange({
        entityType: schema.modelName || (schema as any).actionPrefix,
        entityId: afterData.id,
        changeType: changeType as any,
        beforeData: beforeData || null,
        afterData: afterData,
        fieldChanges: beforeData ? this.calculateFieldChanges(beforeData, afterData) : null,
        context: {
          tenantId: context.tenantId,
          userId: context.userId,
          branchId: context.branchId,
          operationType: source,
          tags: [source, changeType.toLowerCase()]
        }
      });
    } catch (error) {
      console.warn('⚠️ [CreateOperations] Change tracking failed:', error);
      // Don't throw - main operation succeeded
    }
  }

  /**
   * Calculate field changes between before and after data
   */
  private calculateFieldChanges(beforeData: any, afterData: any): any {
    const changes: any = {};
    
    // Get all unique field names from both objects
    const allFields = new Set([
      ...Object.keys(beforeData || {}),
      ...Object.keys(afterData || {})
    ]);
    
    for (const field of allFields) {
      const beforeValue = beforeData?.[field];
      const afterValue = afterData?.[field];
      
      // Only include fields that actually changed
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changes[field] = {
          before: beforeValue,
          after: afterValue
        };
      }
    }
    
    return changes;
  }
}
