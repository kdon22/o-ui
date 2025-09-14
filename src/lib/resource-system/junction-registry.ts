/**
 * Junction Registry - Schema-Driven Junction Discovery
 * 
 * Discovers junction definitions embedded in consolidated entity schemas
 * and generates action mappings, store configs, and utilities.
 */

import { RULE_SCHEMA } from '@/features/rules/rules.schema';
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema';
import { NODE_SCHEMA } from '@/features/nodes/nodes.schema';
import { WORKFLOW_SCHEMA } from '@/features/workflows/workflows.schema';
import type { ResourceSchema } from './schemas';

// ============================================================================
// SCHEMA REGISTRY - All schemas with junction definitions
// ============================================================================

const SCHEMAS_WITH_JUNCTIONS: ResourceSchema[] = [
  RULE_SCHEMA,
  PROCESS_SCHEMA,
  NODE_SCHEMA,
  WORKFLOW_SCHEMA
];

// ============================================================================
// JUNCTION DISCOVERY TYPES
// ============================================================================

export interface JunctionSchemaType {
  readonly databaseKey: string;
  readonly modelName: string;
  readonly actionPrefix: string;
  readonly validationSchema: any;
  readonly indexedDBKey: (record: any) => string;
  readonly fieldMappings: Record<string, any>;
  readonly additionalFields: Record<string, any>;
  readonly displayFields: readonly string[];
  readonly searchFields: readonly string[];
  readonly orderBy: readonly Record<string, string>[];
}

// ============================================================================
// AUTO-DISCOVERY FROM EMBEDDED JUNCTION DEFINITIONS
// ============================================================================

/**
 * Extract all junction schemas from embedded definitions
 */
function extractJunctionSchemas(): Record<string, JunctionSchemaType> {
  const junctionSchemas: Record<string, JunctionSchemaType> = {};
  
  SCHEMAS_WITH_JUNCTIONS.forEach(schema => {
    if (schema.junctions) {
      Object.entries(schema.junctions).forEach(([junctionName, junctionConfig]: [string, any]) => {
        junctionSchemas[junctionConfig.databaseKey] = {
          databaseKey: junctionConfig.databaseKey,
          modelName: junctionConfig.modelName,
          actionPrefix: junctionConfig.actionPrefix,
          validationSchema: junctionConfig.validationSchema,
          indexedDBKey: junctionConfig.indexedDBKey,
          fieldMappings: junctionConfig.fieldMappings,
          additionalFields: junctionConfig.additionalFields,
          displayFields: junctionConfig.displayFields,
          searchFields: junctionConfig.searchFields,
          orderBy: junctionConfig.orderBy
        };
      });
    }
  });
  
  console.log(`🔧 [JunctionRegistry] Discovered ${Object.keys(junctionSchemas).length} junction schemas:`, 
    Object.keys(junctionSchemas));
  
  return junctionSchemas;
}

// ============================================================================
// JUNCTION UTILITIES
// ============================================================================

// Cache the discovered junction schemas
let cachedJunctionSchemas: Record<string, JunctionSchemaType> | null = null;

function getJunctionSchemas(): Record<string, JunctionSchemaType> {
  if (!cachedJunctionSchemas) {
    cachedJunctionSchemas = extractJunctionSchemas();
  }
  return cachedJunctionSchemas;
}

/**
 * Check if a table name is a junction table
 */
export function isJunctionTable(tableName: string): boolean {
  const junctionSchemas = getJunctionSchemas();
  return tableName in junctionSchemas;
}

/**
 * Get junction schema by database key
 */
export function getJunctionSchemaByDatabaseKey(databaseKey: string): JunctionSchemaType | null {
  const junctionSchemas = getJunctionSchemas();
  return junctionSchemas[databaseKey] || null;
}

/**
 * Get all junction table names
 */
export function getJunctionTableNames(): string[] {
  const junctionSchemas = getJunctionSchemas();
  return Object.keys(junctionSchemas);
}

/**
 * Generate action mappings for all junction tables
 */
export function getJunctionActionMappings(): Record<string, any> {
  const junctionSchemas = getJunctionSchemas();
  const actionMappings: Record<string, any> = {};
  
  Object.entries(junctionSchemas).forEach(([databaseKey, schema]) => {
    const actions = ['create', 'read', 'update', 'delete', 'list'];
    
    actions.forEach(action => {
      const actionKey = `${schema.actionPrefix}.${action}`;
      actionMappings[actionKey] = {
        type: action,
        resourceType: schema.actionPrefix,
        tableName: databaseKey,
        isJunction: true
      };
    });
  });
  
  console.log(`🔧 [JunctionRegistry] Generated ${Object.keys(actionMappings).length} junction action mappings`);
  
  return actionMappings;
}

/**
 * Generate IndexedDB store configurations for junction tables
 */
export function getJunctionStoreConfigs(): Record<string, any> {
  const junctionSchemas = getJunctionSchemas();
  const storeConfigs: Record<string, any> = {};
  
  Object.entries(junctionSchemas).forEach(([databaseKey, schema]) => {
    storeConfigs[databaseKey] = {
      keyPath: 'id',
      autoIncrement: false, // We use compound keys
      indexes: [
        // Create indexes based on field mappings
        ...Object.entries(schema.fieldMappings)
          .filter(([field, config]) => config.type === 'relation')
          .map(([field]) => ({ name: field, keyPath: field, unique: false })),
        // Standard indexes
        { name: 'tenantId', keyPath: 'tenantId', unique: false },
        { name: 'branchId', keyPath: 'branchId', unique: false }
      ]
    };
  });
  
  console.log(`🔧 [JunctionRegistry] Generated ${Object.keys(storeConfigs).length} junction store configs`);
  
  return storeConfigs;
}

/**
 * Get all discovered junction schemas
 */
export function getAllJunctionSchemas(): Record<string, JunctionSchemaType> {
  return getJunctionSchemas();
}

/**
 * Get junction schema by action prefix (for server-side action parser)
 */
export function getJunctionSchemaByActionPrefix(actionPrefix: string): JunctionSchemaType | null {
  const junctionSchemas = getJunctionSchemas();
  
  for (const [databaseKey, schema] of Object.entries(junctionSchemas)) {
    if (schema.actionPrefix === actionPrefix) {
      return schema;
    }
  }
  
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { getJunctionSchemas };