/**
 * Model utilities for Prisma operations
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

/**
 * Get model name from schema
 */
export function getModelName(schema: ResourceSchema): string {
  return schema.modelName;
}

/**
 * Convert Prisma model name to database key
 * Examples: NodeProcess -> nodeProcesses, ProcessRule -> processRules  
 * Uses standardized camelCase naming for consistency with auto-discovery system
 */
export function modelNameToDatabaseKey(modelName: string): string {
  // Handle common junction table name patterns (standardized camelCase)
  const conversions: Record<string, string> = {
    'NodeProcess': 'nodeProcesses',
    'ProcessRule': 'processRules',
    'RuleIgnore': 'ruleIgnores',
    'UserTenant': 'userTenants',
    'UserGroup': 'userGroups',
    'GroupPermission': 'groupPermissions',
  };
  
  // Return direct mapping if available
  if (conversions[modelName]) {
    return conversions[modelName];
  }
  
  // Fall back to converting PascalCase to snake_case
  return modelName
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * Get original field name for a model (used for Copy-on-Write)
 * Always follows the pattern: original{ModelName}Id
 */
export function getOriginalFieldName(modelName: string): string {
  return `original${modelName}Id`;
}

/**
 * Get model name from schema or key
 */
export function getModelNameFromAny(schemaOrKey: ResourceSchema | string): string {
  if (typeof schemaOrKey === 'string') {
    // Junction schema functionality moved to unified-resource-registry
    // For now, generate model name from string key
    return schemaOrKey.charAt(0).toUpperCase() + schemaOrKey.slice(1);
  }
  
  // It's a ResourceSchema
  return getModelName(schemaOrKey);
} 