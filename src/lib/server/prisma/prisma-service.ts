/**
 * Main Prisma Service - Orchestrates all Prisma operations
 * 
 * This service coordinates between the various specialized modules:
 * - Junction handling for junction table operations
 * - Branch resolution for branch context
 * - Query building for complex queries
 * - Relationship processing for nested operations
 * - Data cleaning and validation
 */

import type { 
  ResourceSchema, 
  BranchContext 
} from '@/lib/resource-system/schemas';
import type { 
  PrismaServiceContext, 
  QueryFilters, 
  QueryOptions, 
  QueryResult 
} from './types';

// Import all the specialized modules
import { resolveBranchContext } from './branch-resolver';
import { cleanData, addAuditFields, prepareCoWData, prepareUpdateData } from './data-cleaner';
import { isJunctionTable } from '@/lib/resource-system/unified-resource-registry';
import { getModelName, getModelNameFromAny, getOriginalFieldName } from './model-utils';
import { 
  buildBaseWhere, 
  buildInclude, 
  buildExclusionCriteria, 
  buildBranchWhere 
} from './query-builder';
import { PrismaDataFactory } from './prisma-data-factory';
import { processRelationships } from './relationship-processor';

// Import version tracking services
import { changeLogService } from '../services/changelog-service';
import type { ChangeType } from '@prisma/client';

/**
 * ARCHITECTURE NOTE: Data Preparation Strategy
 * 
 * This service now uses PrismaDataFactory for clean, predictable data preparation.
 * The factory approach eliminates complex runtime conversions and guarantees
 * Prisma compatibility through schema-driven configuration.
 * 
 * Key benefits:
 * - Zero runtime conversion errors
 * - Predictable foreign key → relationship mapping
 * - Proper handling of nullable fields with defaults
 * - Easy extension via PRISMA_FIELD_CONFIG
 */

// Type-only import for now - will be injected
type PrismaClient = any;

export class PrismaService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Get Prisma model by name
   */
  private getModel(modelName: string): any {
    // Convert PascalCase to camelCase for Prisma client access
    const camelCaseModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const model = (this.prisma as any)[camelCaseModelName];
    if (!model) {
      throw new Error(`Prisma model not found: ${modelName} (tried: ${camelCaseModelName})`);
    }

    
    return model;
  }

  /**
   * Generic CREATE operation using ResourceSchema
   */
  async create(data: any, schema: ResourceSchema, context: PrismaServiceContext): Promise<any> {

    
    try {
      const modelName = getModelName(schema);
      console.log('🧩 [PrismaService] create() model resolution', {
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
      let junctionRecords: any[] = [];
      
      // IMPORTANT: Detect junctions by databaseKey (table name), not modelName
      if (isJunctionTable(schema.databaseKey)) {
        // For junction tables, add basic context and audit fields manually
        // (Junction tables don't need complex relationship conversion)
        const schemaConfig = schema as any;
        
        if (!schemaConfig.notHasTenantContext) {
          createData.tenantId = resolvedContext.tenantId;
        }
        
        if (!schemaConfig.notHasBranchContext) {
          createData.branchId = resolvedContext.branchId;
        }
        
        createData = addAuditFields(createData, schema, resolvedContext.userId, true);
        
        // 🎯 ENTERPRISE FIX: Idempotent junction creation
        // Check if junction record already exists with compound key to avoid unique constraint errors
        const compoundWhere: any = {};
        const junctionKeyFields = ['nodeId', 'processId', 'ruleId', 'workflowId', 'tenantId', 'branchId'];
        
        for (const field of junctionKeyFields) {
          if (createData[field] !== undefined && createData[field] !== null) {
            compoundWhere[field] = createData[field];
          }
        }
        
        if (Object.keys(compoundWhere).length > 0) {
          console.log('🔍 [PrismaService] Checking for existing junction record', {
            modelName,
            compoundWhere,
            timestamp: new Date().toISOString()
          });
          
          const existingJunction = await model.findFirst({
            where: compoundWhere
          });
          
          if (existingJunction) {
            console.log('📋 [PrismaService] Junction already exists, returning existing record (idempotent success)', {
              modelName,
              existingId: existingJunction.id,
              timestamp: new Date().toISOString()
            });
            
            return existingJunction;
          }
        }
        
      } else {
        // For regular resources, use the clean factory approach
        // The factory handles all context, audit fields, and relationship conversion
        createData = PrismaDataFactory.prepareForPrisma(cleanedData, schema, resolvedContext, 'create');
      }
      
      // Check for existing record with same ID to support idempotent creation
      let result;
      if (createData.id) {
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
        // Calculate hierarchy fields for Node entities
        if (schema.modelName === 'Node') {
          // Support both raw foreign key and relation connect mapping
          const parentIdForHierarchy = createData.parentId || createData?.parent?.connect?.id || null;
          if (parentIdForHierarchy) {
          try {
            // Fetch parent node to calculate hierarchy
            const parentNode = await model.findUnique({
              where: { id: parentIdForHierarchy },
              select: {
                id: true,
                level: true,
                path: true,
                ancestorIds: true,
                parentId: true
              }
            });
            
            if (parentNode) {
              // Calculate hierarchy fields based on parent
              createData.level = (parentNode.level || 0) + 1;
              createData.path = Array.isArray(parentNode.path) 
                ? [...parentNode.path, parentNode.id]
                : [parentNode.id];
              createData.ancestorIds = Array.isArray(parentNode.ancestorIds)
                ? [...parentNode.ancestorIds, parentNode.id]
                : [parentNode.id];
              
              // Calculate sortOrder (get max sortOrder of siblings + 1)
              const maxSortOrderResult = await model.aggregate({
                where: {
                  parentId: parentIdForHierarchy,
                  tenantId: createData.tenantId,
                  branchId: createData.branchId
                },
                _max: {
                  sortOrder: true
                }
              });
              
              createData.sortOrder = (maxSortOrderResult._max.sortOrder || 0) + 1;
            } else {
              // Set defaults for orphaned nodes
              createData.level = 1;
              createData.path = [];
              createData.ancestorIds = [];
              createData.sortOrder = 1;
            }
          } catch (hierarchyError) {
            // Set safe defaults
            createData.level = 1;
            createData.path = [];
            createData.ancestorIds = [];
            createData.sortOrder = 1;
          }
          } else {
          // Root node - set hierarchy defaults
          createData.level = 0;
          createData.path = [];
          createData.ancestorIds = [];
          
          // Calculate sortOrder for root nodes
          try {
            const maxSortOrderResult = await model.aggregate({
              where: {
                parentId: null,
                tenantId: createData.tenantId,
                branchId: createData.branchId
              },
              _max: {
                sortOrder: true
              }
            });
            
            createData.sortOrder = (maxSortOrderResult._max.sortOrder || 0) + 1;
          } catch {
            createData.sortOrder = 1;
          }
          }
        }
        
        // Ensure no raw foreign key sneaks into Prisma create when relation mapping exists
        if (schema.modelName === 'Node' && 'parentId' in createData) {
          delete (createData as any).parentId;
        }

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
      
      // 📊 GOLD STANDARD: Track version history for entity creation
      if (result?.id && !isJunctionTable(schema.databaseKey)) {
        try {
          await this.trackEntityChange(
            result,
            null, // No before data for create
            'CREATE',
            schema,
            resolvedContext,
            'entity_create'
          );
        } catch (versionError) {
          // Log but don't fail the operation
          console.warn('⚠️ [PrismaService] Failed to track version for create:', {
            entityId: result.id,
            error: versionError instanceof Error ? versionError.message : versionError
          });
        }
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Extract base ID from compound IDs with branch information
   * e.g., "uuid:branch:branchId" -> "uuid"
   */
  private cleanCompoundId(id: string): string {
    if (id && typeof id === 'string' && id.includes(':branch:')) {
      return id.split(':branch:')[0];
    }
    return id;
  }

  /**
   * Generic READ operation (no fallback). Always uses the provided branchId.
   */
  async findById(
    schema: ResourceSchema,
    id: string,
    context: PrismaServiceContext
  ): Promise<any | null> {
    // Clean compound ID to extract base ID
    const cleanId = this.cleanCompoundId(id);
    
    const modelName = getModelName(schema);
    const model = this.getModel(modelName);
    const resolvedContext = await resolveBranchContext(this.prisma, context);

    // Build where clause respecting schema context support
    const schemaConfig = schema as any;
    const whereClause: any = { id: cleanId };
    
    if (!schemaConfig.notHasTenantContext) {
      whereClause.tenantId = resolvedContext.tenantId;
    }
    
    if (!schemaConfig.notHasBranchContext) {
      whereClause.branchId = resolvedContext.branchId;
    }

    // Find strictly within the requested branch (or without branch filter if not branched)
    const result = await model.findFirst({
      where: whereClause,
      include: buildInclude(schema)
    });

    return result; // May be null if not found; no fallback
  }

  /**
   * Generic LIST operation (no fallback). Always filters by the requested branchId.
   */
  async findMany(
    schema: ResourceSchema | any,
    filters: QueryFilters = {},
    options: QueryOptions = {},
    context: PrismaServiceContext
  ): Promise<QueryResult<any>> {
    try {
      const modelName = getModelNameFromAny(schema);
      const model = this.getModel(modelName);
      const resolvedContext = await resolveBranchContext(this.prisma, context);
      

      
      // Build base where clause with filters
      const baseWhere = buildBaseWhere(schema, resolvedContext, filters);
      
      // Use schema metadata to determine tenant and branch context support  
      const schemaConfig = schema as any;
      const hasTenantContext = !schemaConfig.notHasTenantContext;
      const hasBranchContext = !schemaConfig.notHasBranchContext;
      
      // Build where clause for current branch
      const whereClause = buildBranchWhere(baseWhere, resolvedContext.branchId, hasTenantContext, hasBranchContext);

      const queryParams = {
        where: whereClause,
        include: buildInclude(schema),
        orderBy: options.orderBy,
        take: options.limit,
        skip: options.offset
      };

      // Get items strictly from current branch
      const items = await model.findMany(queryParams);
      const totalCount = await model.count({ where: whereClause });

      return { items, totalCount };
    } catch (error) {
      
      throw error;
    }
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
    // Clean compound ID to extract base ID
    const cleanId = this.cleanCompoundId(id);
    
    const modelName = getModelName(schema);
    const model = this.getModel(modelName);
    const resolvedContext = await resolveBranchContext(this.prisma, context);

    // Separate relationships from main data
    const { relationships, ...mainData } = data;

    // Find the existing record using cleaned ID
    const existing = await this.findById(schema, cleanId, resolvedContext);
    if (!existing) {
      throw new Error(`${modelName} not found: ${id}`);
    }

    // Check if Copy-on-Write is needed (only for branched models)
    const schemaConfig = schema as any;
    const needsCoW = !schemaConfig.notHasBranchContext && 
                     existing.branchId !== resolvedContext.branchId;

    if (needsCoW) {
      // Create new version on current branch
      const newId = crypto.randomUUID();
      const originalFieldName = getOriginalFieldName(schema.modelName);
      const cowData = prepareCoWData(
        existing, 
        mainData, 
        newId, 
        resolvedContext.branchId, 
        resolvedContext.userId,
        originalFieldName
      );

      // Process relationships if provided
      if (relationships && schema.relationships) {
        const relationshipData = processRelationships(relationships, schema.relationships);
        Object.assign(cowData, relationshipData);
      }

      const cowResult = await model.create({
        data: cowData,
        include: buildInclude(schema)
      });
      
      // 📊 GOLD STANDARD: Track version history for Copy-on-Write update
      try {
        await this.trackEntityChange(
          cowResult,
          existing, // Before data from original entity
          'UPDATE',
          schema,
          resolvedContext,
          'entity_update'
        );
      } catch (versionError) {
        console.warn('⚠️ [PrismaService] Failed to track version for CoW update:', {
          entityId: cowResult.id,
          error: versionError instanceof Error ? versionError.message : versionError
        });
      }
      
      return cowResult;
    } else {
      // In-place update for entity

      // Prepare update data
      const updateData = prepareUpdateData(mainData, resolvedContext.userId, schema);

      // Process relationships if provided
      if (relationships && schema.relationships) {
        const relationshipData = processRelationships(relationships, schema.relationships);
        Object.assign(updateData, relationshipData);
      }

      // Update in place using cleaned ID
      const updateResult = await model.update({
        where: { id: cleanId },
        data: updateData,
        include: buildInclude(schema)
      });
      
      // 📊 GOLD STANDARD: Track version history for in-place update
      try {
        await this.trackEntityChange(
          updateResult,
          existing, // Before data
          'UPDATE',
          schema,
          resolvedContext,
          'entity_update'
        );
      } catch (versionError) {
        console.warn('⚠️ [PrismaService] Failed to track version for in-place update:', {
          entityId: updateResult.id,
          error: versionError instanceof Error ? versionError.message : versionError
        });
      }
      
      return updateResult;
    }
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
    const modelName = getModelName(schema);
    const model = this.getModel(modelName);
    const resolvedContext = await resolveBranchContext(this.prisma, context);

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

    // Add tenant context if available
    if (resolvedContext.tenantId) {
      branchWhere.tenantId = resolvedContext.tenantId;
    }

    // Execute update many operation
    const result = await model.updateMany({
      where: branchWhere,
      data: updateData
    });

    return { count: result.count };
  }

  /**
   * Generic DELETE operation
   */
  async delete(
    schema: ResourceSchema,
    id: string,
    context: PrismaServiceContext
  ): Promise<void> {
    // Clean compound ID to extract base ID
    const cleanId = this.cleanCompoundId(id);
    
    const modelName = getModelName(schema);
    const model = this.getModel(modelName);
    const resolvedContext = await resolveBranchContext(this.prisma, context);

    // Find the existing record using cleaned ID
    const existing = await this.findById(schema, cleanId, resolvedContext);
    if (!existing) {
      throw new Error(`${modelName} not found: ${id}`);
    }

    // Delete the record using cleaned ID
    await model.delete({
      where: { id: cleanId }
    });

    // 📊 GOLD STANDARD: Track version history for entity deletion
    if (!isJunctionTable(schema.databaseKey)) {
      try {
        await this.trackEntityChange(
          null, // No after data for delete
          existing, // Before data
          'DELETE',
          schema,
          resolvedContext,
          'entity_delete'
        );
      } catch (versionError) {
        console.warn('⚠️ [PrismaService] Failed to track version for delete:', {
          entityId: cleanId,
          error: versionError instanceof Error ? versionError.message : versionError
        });
      }
    }

    // Entity deleted successfully
  }

  /**
   * Track entity change for version history and audit trail
   */
  private async trackEntityChange(
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
        console.warn('⚠️ [PrismaService] Cannot track change - missing entity info:', {
          entityId,
          entityType,
          changeType
        });
        return;
      }

      // Calculate field changes for updates
      let fieldChanges: any = undefined;
      if (changeType === 'UPDATE' && beforeData && afterData) {
        fieldChanges = this.calculateFieldChanges(beforeData, afterData);
      }

      // Track the change using ChangeLogService
      await changeLogService.logChange({
        entityType,
        entityId,
        originalEntityId: afterData?.originalEntityId || beforeData?.originalEntityId,
        changeType,
        beforeData,
        afterData,
        fieldChanges,
        context: {
          operationType,
          tenantId: context.tenantId,
          branchId: context.branchId,
          userId: context.userId,
          sessionId: context.sessionId,
          requestId: context.requestId,
          reason: `${operationType} via PrismaService`,
          description: `${changeType} operation on ${entityType}`,
          tags: [operationType, changeType.toLowerCase()]
        }
      });

      console.log('✅ [PrismaService] Version tracked successfully:', {
        entityType,
        entityId,
        changeType,
        operationType
      });

    } catch (error) {
      console.error('❌ [PrismaService] Failed to track entity change:', {
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

      // Skip system fields that change automatically
      if (['updatedAt', 'version', 'updatedById'].includes(field)) {
        continue;
      }

      // Compare values (handle null/undefined equivalence)
      const beforeNormalized = beforeValue === null ? undefined : beforeValue;
      const afterNormalized = afterValue === null ? undefined : afterValue;

      if (beforeNormalized !== afterNormalized) {
        changes[field] = {
          from: beforeValue,
          to: afterValue,
          type: beforeValue === undefined ? 'added' : 
                afterValue === undefined ? 'deleted' : 'modified'
        };
      }
    }

    return Object.keys(changes).length > 0 ? changes : undefined;
  }
}