/**
 * Universal Tag Junction Schema Factory
 * 
 * Auto-generates tag junction schemas for any entity.
 * Supports: rule-tag, node-tag, process-tag, workflow-tag, office-tag, class-tag, etc.
 */

import { z } from 'zod';

// ============================================================================
// GENERIC TAG JUNCTION SCHEMA FACTORY
// ============================================================================

/**
 * Creates a tag junction schema for any entity
 * @param entity - The entity name (e.g., 'rule', 'node', 'process')
 * @returns Complete schema configuration for entity-tag junction
 */
export function createTagJunctionSchema(entity: string) {
  const capitalizedEntity = entity.charAt(0).toUpperCase() + entity.slice(1);
  const entityIdField = `${entity}Id`;
  const originalIdField = `original${capitalizedEntity}TagId`;
  const modelName = `${capitalizedEntity}Tag`;
  const databaseKey = `${entity}Tags`;
  const actionPrefix = `${entity}Tag`;

  // Dynamic Zod schema
  const schema = z.object({
    id: z.string().optional(), // Optional for composite key support
    [entityIdField]: z.string(),
    tagId: z.string(),
    tenantId: z.string(),
    branchId: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    [originalIdField]: z.string().optional(), // Branching support
  });

  // Schema configuration
  const schemaConfig = {
    databaseKey,           // e.g., 'ruleTags', 'nodeTags'
    modelName,             // e.g., 'RuleTag', 'NodeTag'
    actionPrefix,          // e.g., 'ruleTag', 'nodeTag'
    schema,
    relations: [entity, 'tag', 'branch'],
    primaryKey: [entityIdField, 'tagId', 'branchId'], // 🎯 Composite key
    displayFields: [entityIdField, 'tagId'],
    searchFields: [entityIdField, 'tagId'],
    orderBy: [{ [entityIdField]: 'asc' }],
    
    // Exception flags
    notHasAuditFields: false, // Has createdAt/updatedAt
    
    // ✅ JUNCTION: IndexedDB compound key configuration
    indexedDBKey: (record: any) => `${record[entityIdField]}:${record.tagId}`,
    
    // GOLD STANDARD: Junction field mapping configuration
    fieldMappings: {
      [entityIdField]: { type: 'relation', target: entity, targetField: 'id' },
      tagId: { type: 'relation', target: 'tag', targetField: 'id' },
      branchId: { type: 'relation', target: 'branch', targetField: 'id' },
      tenantId: { type: 'scalar' },
      id: { type: 'scalar' },
      createdAt: { type: 'scalar' },
      updatedAt: { type: 'scalar' },
      [originalIdField]: { type: 'scalar' }
    },

    // ============================================================================
    // JUNCTION AUTO-CREATION CONFIGURATION
    // ============================================================================
    junctionConfig: {
      // When creating an entity, check if we should auto-create EntityTag junction
      autoCreateOnParentCreate: true,
      
      // Navigation context detection - if these fields are present, auto-create junction
      navigationContext: {
        tagId: 'string' // If tagId is provided in entity creation, create EntityTag
      },
      
      // Default values for junction creation
      defaults: {}
    }
  } as const;

  return {
    schema,
    schemaConfig
  };
}

// ============================================================================
// AUTO-GENERATED SCHEMAS FOR ALL ENTITIES
// ============================================================================

// Rule-Tag Junction
export const { schema: RuleTagSchema, schemaConfig: RULE_TAG_SCHEMA } = createTagJunctionSchema('rule');
export type RuleTag = z.infer<typeof RuleTagSchema>;

// Node-Tag Junction  
export const { schema: NodeTagSchema, schemaConfig: NODE_TAG_SCHEMA } = createTagJunctionSchema('node');
export type NodeTag = z.infer<typeof NodeTagSchema>;

// Process-Tag Junction
export const { schema: ProcessTagSchema, schemaConfig: PROCESS_TAG_SCHEMA } = createTagJunctionSchema('process');
export type ProcessTag = z.infer<typeof ProcessTagSchema>;

// Workflow-Tag Junction
export const { schema: WorkflowTagSchema, schemaConfig: WORKFLOW_TAG_SCHEMA } = createTagJunctionSchema('workflow');
export type WorkflowTag = z.infer<typeof WorkflowTagSchema>;

// Office-Tag Junction
export const { schema: OfficeTagSchema, schemaConfig: OFFICE_TAG_SCHEMA } = createTagJunctionSchema('office');
export type OfficeTag = z.infer<typeof OfficeTagSchema>;

// Class-Tag Junction
export const { schema: ClassTagSchema, schemaConfig: CLASS_TAG_SCHEMA } = createTagJunctionSchema('class');
export type ClassTag = z.infer<typeof ClassTagSchema>;

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Export all schema configs for registry
export const ALL_TAG_SCHEMAS = {
  RULE_TAG_SCHEMA,
  NODE_TAG_SCHEMA,
  PROCESS_TAG_SCHEMA,
  WORKFLOW_TAG_SCHEMA,
  OFFICE_TAG_SCHEMA,
  CLASS_TAG_SCHEMA,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all tag junction schema configs as an array
 */
export function getAllTagSchemas() {
  return Object.values(ALL_TAG_SCHEMAS);
}

/**
 * Get tag schema by entity name
 */
export function getTagSchemaForEntity(entity: string) {
  const key = `${entity.toUpperCase()}_TAG_SCHEMA` as keyof typeof ALL_TAG_SCHEMAS;
  return ALL_TAG_SCHEMAS[key];
}

/**
 * Check if a database key is a tag junction table
 */
export function isTagJunction(databaseKey: string): boolean {
  return databaseKey.endsWith('Tags') && getAllTagSchemas().some(
    schema => schema.databaseKey === databaseKey
  );
} 