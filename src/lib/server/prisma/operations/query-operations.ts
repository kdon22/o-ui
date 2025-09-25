/**
 * Query Operations Service - Focused service for READ operations
 * 
 * Handles:
 * - findById operations with proper branch/tenant context
 * - findMany operations with filtering and pagination
 * - Compound ID cleaning for branch-aware queries
 * - Schema-driven context management
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import type { 
  PrismaServiceContext,
  QueryFilters,
  QueryOptions,
  QueryResult
} from '../core/types';
import { resolveBranchContext } from '../core/branch-resolver';
import { getModelName, getModelNameFromAny } from '../core/model-utils';
import { 
  buildInclude,
  buildBaseWhere,
  buildBranchWhere 
} from '../core/query-builder';

import type { PrismaClient } from '@prisma/client';

export class QueryOperationsService {
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
   * e.g., "uuid:branch:branchId" -> "uuid"
   */
  private cleanCompoundId(id: string): string {
    if (id && typeof id === 'string' && id.includes(':branch:')) {
      return id.split(':branch:')[0];
    }
    return id;
  }

  /**
   * Generic READ operation by ID (no fallback). Always uses the provided branchId.
   */
  async findById(
    schema: ResourceSchema,
    id: string,
    context: PrismaServiceContext
  ): Promise<any | null> {
    try {
      // Clean compound ID to extract base ID
      const cleanId = this.cleanCompoundId(id);
      
      const modelName = getModelName(schema);
      const model = this.getModel(modelName);
      const resolvedContext = await resolveBranchContext(this.prisma, context);

      console.log('🔍 [QueryOperations] findById operation', {
        modelName,
        originalId: id,
        cleanId,
        branchId: resolvedContext.branchId,
        tenantId: resolvedContext.tenantId
      });

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

      console.log('🔍 [QueryOperations] findById result', {
        modelName,
        found: !!result,
        resultId: result?.id,
        timestamp: new Date().toISOString()
      });

      return result; // May be null if not found; no fallback
    } catch (error) {
      console.error('🚨 [QueryOperations] findById failed:', error);
      throw error;
    }
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
      
      console.log('📋 [QueryOperations] findMany operation', {
        modelName,
        filtersCount: Object.keys(filters).length,
        hasLimit: !!options.limit,
        hasOffset: !!options.offset,
        branchId: resolvedContext.branchId,
        tenantId: resolvedContext.tenantId
      });
      
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

      console.log('📋 [QueryOperations] Executing findMany query', {
        modelName,
        whereClause: JSON.stringify(whereClause, null, 2),
        queryParams: {
          hasInclude: !!queryParams.include,
          hasOrderBy: !!queryParams.orderBy,
          limit: queryParams.take,
          offset: queryParams.skip
        }
      });

      // Get items strictly from current branch
      const items = await model.findMany(queryParams);
      const totalCount = await model.count({ where: whereClause });

      console.log('📋 [QueryOperations] findMany completed', {
        modelName,
        itemsCount: items.length,
        totalCount,
        timestamp: new Date().toISOString()
      });

      return { items, totalCount };
    } catch (error) {
      console.error('🚨 [QueryOperations] findMany failed:', error);
      throw error;
    }
  }
}
