/**
 * Query building utilities for Prisma operations
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import type { PrismaServiceContext, QueryFilters } from './types';

/**
 * Build base where clause for queries with junction relationship support
 */
export function buildBaseWhere(
  schema: ResourceSchema | any,
  context: PrismaServiceContext,
  filters: QueryFilters = {}
): any {
  const where: any = {};
  
  // Use schema metadata to determine tenant context support  
  const schemaConfig = schema as any;
  const hasTenantContext = !schemaConfig.notHasTenantContext;
  
  // Add tenant filter if schema supports it
  if (hasTenantContext) {
    where.tenantId = context.tenantId;
  }
  
  // Use schema-driven junction resolver for bulletproof relationship handling
  const { resolveSchemaJunctionFilters } = require('@/lib/resource-system/schema-junction-resolver');
  const { where: resolvedWhere, resolved } = resolveSchemaJunctionFilters(schema, filters);
  const modelName = schema.modelName || schema.name;
  
  // Merge resolved junction queries with base where clause
  Object.assign(where, resolvedWhere);
  
  return where;
}

/**
 * Build include clause based on model capabilities
 */
export function buildInclude(schema: ResourceSchema | any): Record<string, any> {
  const include: Record<string, any> = {};

  // Starting include build

  // Handle schemas with relations array (legacy)
  if (schema.relations && Array.isArray(schema.relations)) {
    // Processing legacy relations array
    
    schema.relations.forEach((relationName: string) => {
      // Add audit relations with select fields for user relations
      if (relationName === 'createdBy' || relationName === 'updatedBy') {
        include[relationName] = {
          select: { id: true, name: true, email: true }
        };
      } else {
        // Add other relations
        include[relationName] = true;
      }
      
      // Added legacy relation
    });
  }

  // Handle schemas with relationships object (new schema system)
  if (schema.relationships && typeof schema.relationships === 'object') {
    Object.entries(schema.relationships).forEach(([relationName, relationConfig]: [string, any]) => {
      // Skip relationships that should be excluded from Prisma includes
      if (relationConfig.excludeFromPrismaInclude) {
        return;
      }
      
      // Add audit relations with select fields for user relations
      if (relationName === 'createdBy' || relationName === 'updatedBy') {
        include[relationName] = {
          select: { id: true, name: true, email: true }
        };
      } else {
        // Add junction relationships (many-to-many)
        include[relationName] = true;
      }
      
    });
  }

  // Final include object

  return include;
}

/**
 * Build exclusion criteria for branch fallback queries
 */
export function buildExclusionCriteria(
  schema: ResourceSchema | any,
  currentBranchItems: any[]
): any {
  // Get primary key fields from schema
  const primaryKeyFields = schema.primaryKey || ['id'];
  
  let exclusionWhere: any = {};
  
  if (primaryKeyFields.length === 1) {
    // Single primary key (e.g., id)
    const pkField = primaryKeyFields[0];
    const currentBranchIds = currentBranchItems.map((item: any) => item[pkField]);
    exclusionWhere[pkField] = {
      notIn: currentBranchIds
    };
  } else {
    // Composite primary key - exclude combinations that exist in current branch
    const currentBranchCombinations = currentBranchItems.map((item: any) => {
      const combination: any = {};
      primaryKeyFields.forEach((field: string) => {
        combination[field] = item[field];
      });
      return combination;
    });
    
    if (currentBranchCombinations.length > 0) {
      // Use NOT with OR conditions for composite keys
      exclusionWhere.NOT = {
        OR: currentBranchCombinations
      };
    }
  }
  
  return exclusionWhere;
}

/**
 * Build where clause for branch-specific queries
 */
export function buildBranchWhere(
  baseWhere: any,
  branchId: string,
  hasTenantContext: boolean,
  hasBranchContext: boolean = true
): any {
  // 🚨 CRITICAL DEBUG: Track branch filtering
  const result = hasBranchContext ? {
    ...baseWhere,
    branchId
  } : baseWhere;
  
  return result;
}