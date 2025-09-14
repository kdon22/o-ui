/**
 * Create Handler - Handles resource creation operations
 */

import { getResourceByActionPrefix } from '@/lib/resource-system/resource-registry';
import type { PrismaService } from '../../prisma/prisma-service';
import type { ExecutionContext, ActionResult } from '../core/types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================



// ============================================================================
// JUNCTION EXTRACTION UTILITY
// ============================================================================

/**
 * Extract junction data from Prisma results based on schema relationships
 */
function extractJunctionData(schema: any, items: any[]): Record<string, any[]> {
  const junctions: Record<string, any[]> = {};
  
  console.log('🔍 [extractJunctionData] Starting extraction', {
    schemaName: schema.modelName || schema.name,
    hasRelationships: !!schema.relationships,
    itemsCount: items.length,
    relationships: schema.relationships ? Object.keys(schema.relationships) : [],
    timestamp: new Date().toISOString()
  });
  
  if (!schema.relationships || !Array.isArray(items) || items.length === 0) {
    console.log('🔍 [extractJunctionData] Early return', {
      hasRelationships: !!schema.relationships,
      isItemsArray: Array.isArray(items),
      itemsLength: items.length,
      timestamp: new Date().toISOString()
    });
    return junctions;
  }
  
  // Process each relationship defined in the schema
  for (const [relationName, relationConfig] of Object.entries(schema.relationships)) {
    const config = relationConfig as any;
    
    console.log('🔍 [extractJunctionData] Processing relationship', {
      relationName,
      relationType: config.type,
      junctionTable: config.junction?.tableName,
      timestamp: new Date().toISOString()
    });
    
    // Only extract many-to-many junction data
    if (config.type === 'many-to-many') {
      const junctionRecords: any[] = [];
      
      // Extract junction records from each item
      items.forEach((item: any, index: number) => {
        const relationData = item[relationName];
        console.log(`🔍 [extractJunctionData] Item ${index} relation data`, {
          relationName,
          hasRelation: !!relationData,
          isArray: Array.isArray(relationData),
          length: Array.isArray(relationData) ? relationData.length : 'not-array',
          itemKeys: Object.keys(item || {}),
          relationData: relationData ? JSON.stringify(relationData).substring(0, 200) : 'null',
          timestamp: new Date().toISOString()
        });
        
        if (item[relationName] && Array.isArray(item[relationName])) {
          junctionRecords.push(...item[relationName]);
        }
      });
      
      // Store under junction table name
      if (config.junction?.tableName && junctionRecords.length > 0) {
        junctions[config.junction.tableName] = junctionRecords;
        console.log('🔍 [extractJunctionData] Added junction records', {
          junctionTable: config.junction.tableName,
          recordCount: junctionRecords.length,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('🔍 [extractJunctionData] No junction records found', {
          junctionTable: config.junction?.tableName,
          recordCount: junctionRecords.length,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  console.log('🔍 [extractJunctionData] Final result', {
    junctionTableCount: Object.keys(junctions).length,
    junctionTables: Object.keys(junctions),
    timestamp: new Date().toISOString()
  });
  
  return junctions;
}

export class CreateHandler {
  constructor(private prismaService: PrismaService) {}

  async handle(
    resourceType: string,
    data: any,
    options: any,
    context: ExecutionContext
  ): Promise<ActionResult> {
    console.log('🚨🚨🚨 [CreateHandler] HANDLECREATE ENTRY POINT - CODE RELOADED', {
      resourceType,
      timestamp: new Date().toISOString()
    });
    
    console.log('🔥 [CreateHandler] handleCreate started', {
      resourceType,
      data,
      options,
      context,
      timestamp: new Date().toISOString()
    });
    
    try {
      const schema = getResourceByActionPrefix(resourceType);
      if (!schema) {
        console.error('🔥 [CreateHandler] Schema not found for resource type', {
          resourceType,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Schema not found for resource type: ${resourceType}`);
      }
      
      console.log('🔥 [CreateHandler] Retrieved schema for create operation', {
        resourceType,
        schema: {
          databaseKey: schema.databaseKey,
          modelName: schema.modelName,
          actionPrefix: schema.actionPrefix
        },
        timestamp: new Date().toISOString()
      });

      const prismaContext = {
        tenantId: context.tenantId,
        branchId: context.branchId,
        defaultBranchId: context.defaultBranchId,
        userId: context.userId
      };
      
      console.log('🔥 [CreateHandler] Prepared Prisma context for create', {
        prismaContext,
        originalContext: context,
        timestamp: new Date().toISOString()
      });

      console.log('🔥 [CreateHandler] Calling PrismaService.create', {
        resourceType,
        schema: {
          databaseKey: schema.databaseKey,
          modelName: schema.modelName
        },
        data,
        prismaContext,
        timestamp: new Date().toISOString()
      });

      // Extract clean entity data if it's wrapped in API response structure
      let cleanData = data;

      console.log('🚨🚨🚨 [CreateHandler] DATA CLEANING CHECKPOINT - DETECTION LOGIC', {
        dataType: typeof data,
        isObject: data && typeof data === 'object',
        hasSuccess: data && 'success' in data,
        hasDataProp: data && 'data' in data,
        successValue: data && 'success' in data ? data.success : 'N/A',
        fullDataKeys: data && typeof data === 'object' ? Object.keys(data) : null,
        timestamp: new Date().toISOString()
      });

      if (data && typeof data === 'object' && 'success' in data && 'data' in data && data.success === true) {
        console.log('🚨🚨🚨 [CreateHandler] ✅ API WRAPPER DETECTED - CLEANING DATA NOW', {
          originalDataType: typeof data,
          originalDataKeys: Object.keys(data),
          hasSuccess: 'success' in data,
          hasData: 'data' in data,
          successValue: data.success,
          extractedData: data.data,
          timestamp: new Date().toISOString()
        });
        cleanData = data.data;

        console.log('🔍 [CreateHandler] After data extraction - checking for tableName conversion', {
          resourceType,
          cleanData,
          hasName: cleanData && typeof cleanData === 'object' && cleanData.name,
          cleanDataType: typeof cleanData,
          timestamp: new Date().toISOString()
        });



      // Check if this looks like an already-created record (potential client issue)
        if (cleanData && typeof cleanData === 'object' && 
            cleanData.id && cleanData.createdAt && cleanData.updatedAt) {
          console.warn('⚠️ [CreateHandler] POTENTIAL CLIENT ISSUE: Data contains pre-existing timestamps and ID', {
            id: cleanData.id,
            createdAt: cleanData.createdAt,
            updatedAt: cleanData.updatedAt,
            hasVersion: 'version' in cleanData,
            hasAuditFields: 'createdById' in cleanData && 'updatedById' in cleanData,
            note: 'This suggests the client is re-sending an already-created record for creation',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log('🚨🚨🚨 [CreateHandler] ❌ NO WRAPPER - PASSING DATA AS-IS', {
          timestamp: new Date().toISOString()
        });
      }
      
      // ✅ FILTER: Remove navigation-only fields, but keep any field defined in the schema
      const filteredData = { ...cleanData } as any;

      // Build fast-lookups of fields declared in the schema and relationship foreign keys
      const schemaFieldKeys = new Set<string>(
        Array.isArray((schema as any)?.fields)
          ? ((schema as any).fields as any[]).map((f: any) => f?.key).filter(Boolean)
          : []
      );
      const relationshipForeignKeys = new Set<string>(
        (schema as any)?.relationships
          ? Object.values((schema as any).relationships).map((rel: any) => rel?.foreignKey).filter(Boolean)
          : []
      );

      // Preserve relation fields if schema indicates they are part of the junction mapping
      const relationFieldsToPreserve = new Set<string>();
      const fm: any = (schema as any)?.fieldMappings;
      if (fm && typeof fm === 'object') {
        Object.entries(fm).forEach(([key, mapping]: [string, any]) => {
          if (mapping && mapping.type === 'relation') {
            relationFieldsToPreserve.add(key);
          }
        });
      }

      // Fields that are typically navigation helpers
      // IMPORTANT: Do NOT include 'parentId' here. It is a legitimate FK for hierarchical models (e.g., Node)
      const removableFields = ['selectedId'];

      removableFields.forEach(field => {
        if (!(field in filteredData)) return;

        // If the field is declared as a normal field or as a relationship foreign key, DO NOT remove
        const shouldPreserve = schemaFieldKeys.has(field) || relationshipForeignKeys.has(field);
        if (shouldPreserve) {
          console.log(`✅ [CreateHandler] Preserving schema field: ${field}=${filteredData[field]}`);
          return;
        }

        console.log(`🧹 [CreateHandler] Filtering navigation context field: ${field}=${filteredData[field]}`);
        delete filteredData[field];
      });

      // Only remove nodeId/processId/etc if NOT required by schema
      const potentialRelationFields = ['nodeId', 'processId', 'workflowId', 'ruleId', 'customerId'];
      potentialRelationFields.forEach(field => {
        if (!(field in filteredData)) return;

        const shouldPreserve =
          relationFieldsToPreserve.has(field) ||
          schemaFieldKeys.has(field) ||
          relationshipForeignKeys.has(field);

        if (shouldPreserve) {
          console.log(`✅ [CreateHandler] Preserving relation field: ${field}=${filteredData[field]}`);
          return;
        }

        console.log(`🧹 [CreateHandler] Removing non-schema navigation field: ${field}=${filteredData[field]}`);
        delete filteredData[field];
      });

      // ✅ Ensure tenantId/branchId are present for junctions and any model that requires them
      // Use presence of fieldMappings (junction schemas) or missing fields as signal
      if (!('tenantId' in filteredData) && context?.tenantId) {
        filteredData.tenantId = context.tenantId;
      }
      if (!('branchId' in filteredData) && context?.branchId) {
        filteredData.branchId = context.branchId;
      }

      console.log('🚨🚨🚨 [CreateHandler] AFTER FILTERING - CHECKING tableName', {
        resourceType,
        hasTableNameInCleanData: 'tableName' in cleanData,
        hasTableNameInFilteredData: 'tableName' in filteredData,
        tableNameValue: filteredData?.tableName,
        cleanDataKeys: Object.keys(cleanData),
        filteredDataKeys: Object.keys(filteredData),
        timestamp: new Date().toISOString()
      });

      console.log('🚨🚨🚨 [CreateHandler] FINAL DATA TO PRISMA - CRITICAL CHECKPOINT', {
        resourceType,
        originalDataStructure: JSON.stringify(data, null, 2),
        cleanDataStructure: JSON.stringify(cleanData, null, 2),
        filteredDataStructure: JSON.stringify(filteredData, null, 2),
        dataWasExtracted: cleanData !== data,
        hasTableName: 'tableName' in filteredData,
        tableNameValue: filteredData?.tableName,
        // Remove misleading log about parentId being filtered here
        filteredFields: ['selectedId'].filter((field: string) => field in (cleanData as any)),
        finalDataKeys: filteredData && typeof filteredData === 'object' ? Object.keys(filteredData) : null,
        timestamp: new Date().toISOString()
      });

      try {
        const result = await this.prismaService.create(filteredData, schema, prismaContext);

        console.log('🔥 [CreateHandler] PrismaService.create completed successfully', {
          resourceType,
          result,
          hasResult: !!result,
          resultId: result?.id,
          timestamp: new Date().toISOString()
        });

        const actionResult = {
          data: result,
          junctions: extractJunctionData(schema, [result]),
          meta: {
            branchId: context.branchId,
            cached: false
          }
        };

        console.log('🔥 [CreateHandler] handleCreate completed successfully', {
          resourceType,
          actionResult,
          timestamp: new Date().toISOString()
        });

        return actionResult;
        
      } catch (prismaError) {
        console.error('🔥 [CreateHandler] PrismaService.create failed', {
          resourceType,
          data,
          prismaContext,
          error: prismaError instanceof Error ? prismaError.message : prismaError,
          stack: prismaError instanceof Error ? prismaError.stack : undefined,
          timestamp: new Date().toISOString()
        });
        
        throw prismaError;
      }
      
    } catch (error) {
      console.error('🔥 [CreateHandler] handleCreate failed', {
        resourceType,
        data,
        options,
        context,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
} 