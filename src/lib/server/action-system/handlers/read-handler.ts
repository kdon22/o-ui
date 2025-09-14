/**
 * Read Handler - Handles resource read operations
 */

import { getResourceByActionPrefix } from '@/lib/resource-system/resource-registry';
import type { PrismaService } from '../../prisma/prisma-service';
import type { ExecutionContext, ActionResult } from '../core/types';

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

export class ReadHandler {
  constructor(private prismaService: PrismaService) {}

  async handle(
    resourceType: string,
    data: any,
    options: any,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const schema = getResourceByActionPrefix(resourceType);
    if (!schema) {
      throw new Error(`Schema not found for resource type: ${resourceType}`);
    }

    const { id } = data;
    if (!id) {
      throw new Error('ID is required for read operation');
    }

    const prismaContext = {
      tenantId: context.tenantId,
      branchId: context.branchId,
      defaultBranchId: context.defaultBranchId,
      userId: context.userId
    };

    const result = await this.prismaService.findById(schema, id, prismaContext);

    if (!result) {
      throw new Error(`${schema.modelName} not found: ${id}`);
    }

    return {
      data: result,
      junctions: extractJunctionData(schema, [result]),
      meta: {
        branchId: context.branchId,
        cached: false
      }
    };
  }
} 