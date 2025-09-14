/**
 * Action Handlers - Complete Handler System
 * 
 * Modular handlers for different action types extracted from the main ActionRouter
 */

import { getResourceByActionPrefix } from '@/lib/resource-system/resource-registry';
import type { PrismaService } from '../../prisma/prisma-service';
import type { ExecutionContext, ActionResult } from '../core/types';
import { CreateHandler } from './create-handler';
import { ReadHandler } from './read-handler';
import { BranchHandler } from './branch-handler';
import { PullRequestHandler } from './pull-request-handler';

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

// ============================================================================
// HANDLER CLASSES (Additional handlers)
// ============================================================================

export class UpdateHandler {
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

    // Extract clean entity data if it's wrapped in API response structure
    let cleanData = data;
    if (data && typeof data === 'object' && 'success' in data && 'data' in data && data.success === true) {
      console.log('🔥 [UpdateHandler] Detected API response wrapper, extracting clean data', {
        originalData: data,
        extractedData: data.data,
        timestamp: new Date().toISOString()
      });
      cleanData = data.data;
    }

    const { id, ...updates } = cleanData;
    if (!id) {
      throw new Error('ID is required for update operation');
    }

    const prismaContext = {
      tenantId: context.tenantId,
      branchId: context.branchId,
      defaultBranchId: context.defaultBranchId,
      userId: context.userId
    };

    const result = await this.prismaService.update(schema, id, updates, prismaContext);

    return {
      data: result,
      junctions: extractJunctionData(schema, [result]),
      meta: {
        branchId: context.branchId,
        cached: false,
        copyOnWrite: result.id !== id
      }
    };
  }
}

export class DeleteHandler {
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
      throw new Error('ID is required for delete operation');
    }

    const prismaContext = {
      tenantId: context.tenantId,
      branchId: context.branchId,
      defaultBranchId: context.defaultBranchId,
      userId: context.userId
    };

    await this.prismaService.delete(schema, id, prismaContext);

    return {
      data: { id, deleted: true },
      junctions: {},
      meta: {
        branchId: context.branchId,
        cached: false
      }
    };
  }
}

export class ListHandler {
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

    const prismaContext = {
      tenantId: context.tenantId,
      branchId: context.branchId,
      defaultBranchId: context.defaultBranchId,
      userId: context.userId
    };

    const queryOptions = {
      limit: options?.pagination?.limit || options?.limit || 100,
      offset: options?.pagination?.page ? (options.pagination.page - 1) * (options.pagination.limit || 100) : options?.offset || 0,
      orderBy: options?.sort ? { [options.sort.field]: options.sort.direction } : undefined,
      filters: options?.filters || {}
    };

    const result = await this.prismaService.findMany(
      schema,
      queryOptions.filters,
      queryOptions,
      prismaContext
    );

    return {
      data: result.items,
      junctions: extractJunctionData(schema, result.items),
      meta: {
        totalCount: result.totalCount,
        branchId: context.branchId,
        cached: false
      }
    };
  }
}

// ============================================================================
// HANDLER FACTORY
// ============================================================================

interface ActionHandler {
  handle(resourceType: string, data: any, options: any, context: ExecutionContext): Promise<ActionResult>;
}

export class ActionHandlerFactory {
  private handlers: Map<string, ActionHandler>;
  private branchHandler: BranchHandler;
  private pullRequestHandler: PullRequestHandler;

  constructor(prismaService: PrismaService) {
    this.branchHandler = new BranchHandler(prismaService);
    this.pullRequestHandler = new PullRequestHandler(prismaService);
    
    this.handlers = new Map<string, ActionHandler>([
      ['create', new CreateHandler(prismaService)],
      ['read', new ReadHandler(prismaService)],
      ['update', new UpdateHandler(prismaService)],
      ['delete', new DeleteHandler(prismaService)],
      ['list', new ListHandler(prismaService)]
    ]);
  }

  getHandler(operation: string, resourceType?: string) {
    // Handle branch-specific operations
    if (resourceType === 'branches' && this.isBranchSpecificOperation(operation)) {
      return {
        handle: (resourceType: string, data: any, options: any, context: ExecutionContext) =>
          this.branchHandler.handle(resourceType, operation, data, options, context)
      };
    }
    
    // Handle pull request operations
    if (this.isPullRequestOperation(resourceType, operation)) {
      return {
        handle: (resourceType: string, data: any, options: any, context: ExecutionContext) =>
          this.pullRequestHandler.handle({
            action: `${resourceType}.${operation}`,
            data,
            branchContext: {
              tenantId: context.tenantId,
              currentBranchId: context.branchId,
              defaultBranchId: context.defaultBranchId,
              currentUserId: context.userId,
              currentUserName: context.userName || 'Unknown',
              currentUserEmail: context.userEmail
            }
          })
      };
    }
    
    return this.handlers.get(operation);
  }

  hasHandler(operation: string, resourceType?: string): boolean {
    if (resourceType === 'branches' && this.isBranchSpecificOperation(operation)) {
      return true;
    }
    if (this.isPullRequestOperation(resourceType, operation)) {
      return true;
    }
    return this.handlers.has(operation);
  }

  getSupportedOperations(): string[] {
    const baseOperations = Array.from(this.handlers.keys());
    const branchOperations = ['switch', 'compare', 'merge', 'getMergePreview', 'getStatus', 'getActivity', 'setDefault', 'rollback', 'getRollbackable'];
    const prOperations = ['merge', 'close', 'reopen', 'getSmartReviewers', 'getImpactAnalysis', 'getChangePreview'];
    return [...baseOperations, ...branchOperations, ...prOperations];
  }

  private isBranchSpecificOperation(operation: string): boolean {
    return ['switch', 'compare', 'merge', 'getMergePreview', 'getStatus', 'getActivity', 'setDefault', 'rollback', 'getRollbackable'].includes(operation);
  }

  private isPullRequestOperation(resourceType?: string, operation?: string): boolean {
    const prResourceTypes = ['pullRequests', 'pullRequestReviews', 'pullRequestComments', 'prSettings'];
    const prOperations = ['merge', 'close', 'reopen', 'getSmartReviewers', 'getImpactAnalysis', 'getChangePreview', 'submit', 'resolve'];
    
    return (resourceType && prResourceTypes.includes(resourceType)) || 
           (operation && prOperations.includes(operation));
  }

}

// ============================================================================
// EXPORTS
// ============================================================================

export { CreateHandler } from './create-handler';
export { ReadHandler } from './read-handler';
export type { ExecutionContext, ActionResult } from '../core/types'; 