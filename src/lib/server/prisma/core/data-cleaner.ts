/**
 * Data cleaning and validation utilities for Prisma operations
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import { generateNodeShortId, generateRuleShortId, generateClassShortId } from '@/lib/utils/short-id-generator';
import { isJunctionTable } from '@/lib/resource-system/unified-resource-registry';

/**
 * System-managed fields that should not be included in update operations
 * These fields are set during creation and managed by the system (not user updates)
 */
const SYSTEM_MANAGED_FIELDS = new Set([
  'tenantId',      // Foreign key - set during creation, managed by system
  'branchId',      // Branch context - managed by Copy-on-Write logic
  'createdAt',     // Audit field - never updated
  'createdById',   // Audit field - never updated  
  'updatedAt',     // Audit field - managed by system
  'updatedById',   // Audit field - managed by system, use relationship instead
  'version',       // Version field - managed by system
  'id',            // Primary key - never updated directly
  'originalId',    // Generic originalId that might be passed from client
]);

/**
 * Check if a field is a system-managed original reference field
 * Matches pattern: original{ModelName}Id (e.g., originalRuleId, originalNodeId, etc.)
 */
function isOriginalReferenceField(fieldName: string): boolean {
  return /^original[A-Z][a-zA-Z]*Id$/.test(fieldName);
}

/**
 * Check if a field should be filtered out from updates
 */
function isSystemManagedField(fieldName: string): boolean {
  return SYSTEM_MANAGED_FIELDS.has(fieldName) || isOriginalReferenceField(fieldName);
}

/**
 * Client-side metadata fields that should not be sent to Prisma
 */
const CLIENT_SIDE_METADATA_FIELDS = new Set([
  '_cached',
  '_optimistic',
  '_loading',
  '_error',
  '_dirty',
  '_touched',
  '_validating',
  '_submitCount',
  '_isSubmitting',
  '_isValidating',
  '_isValid',
  '_hasError',
  '_hasWarning',
  '_hasSuccess',
  '_meta',
  '_clientOnly',
  '_uiState',
  '_tempId',
  '_localState',
  'branchTimestamp',  // Client-side timestamp field used for optimistic updates
  // Optimistic update tracking fields (added for IndexedDB duplication fix)
  '__clientTempId',
  '__useServerGeneratedId',
  '__optimistic',
  '__optimisticIdSource',
  // Junction relationship fields that should be handled separately
  'tagIds'  // Tags are handled via junction tables (ClassTag, RuleTag, etc.)
]);

/**
 * Auto-generated fields that should be filtered out if empty
 */
const AUTO_GENERATED_FIELDS = new Set([
  'id',
  'idShort',
  'createdAt',
  'updatedAt'
]);

/**
 * Optional foreign key fields that should be converted to null if empty
 * These are fields that reference other entities and should be null when no reference exists
 */
const OPTIONAL_FOREIGN_KEY_FIELDS = new Set([
  'parentId',
  'emulateOffice',
  'credentialId'
]);

/**
 * Check if a field is an optional foreign key field
 */
function isOptionalForeignKeyField(fieldName: string): boolean {
  return OPTIONAL_FOREIGN_KEY_FIELDS.has(fieldName) || isOriginalReferenceField(fieldName);
}

/**
 * Clean data for Prisma operations
 * Removes client-side metadata and converts empty strings to null
 * Handles compound IDs and foreign key references
 */
export function cleanData(
  data: any,
  schema: ResourceSchema,
  operation?: 'create' | 'update'
): any {
  const cleaned = { ...data };
  
  // Track removed fields for debugging
  const removedFields: string[] = [];
  
  // Remove client-side metadata fields
  CLIENT_SIDE_METADATA_FIELDS.forEach(field => {
    if (field in cleaned) {
      removedFields.push(field);
      delete cleaned[field];
    }
  });

  // Schema-driven stripping (transient/computed/stripOn flags)
  try {
    const fieldList: any[] = Array.isArray((schema as any)?.fields) ? (schema as any).fields : [];
    const transientKeys = new Set<string>();
    const computedKeys = new Set<string>();
    const stripOnCreate = new Set<string>();
    const stripOnUpdate = new Set<string>();

    fieldList.forEach((f: any) => {
      if (!f || !f.key) return;
      if (f.transient === true) transientKeys.add(f.key);
      if (f.computed === true) computedKeys.add(f.key);
      if (f.stripOn?.create) stripOnCreate.add(f.key);
      if (f.stripOn?.update) stripOnUpdate.add(f.key);
    });

    // Transient fields: always remove
    transientKeys.forEach((k) => {
      if (k in cleaned) {
        removedFields.push(k);
        delete cleaned[k];
      }
    });

    // Computed fields: Handle Node hierarchy fields specially
    computedKeys.forEach((k) => {
      if (k in cleaned) {
        const value = cleaned[k];
        
        // 🎯 SPECIAL CASE: Always remove Node hierarchy fields so server can calculate them
        const isNodeHierarchyField = schema.modelName === 'Node' && 
          ['level', 'sortOrder', 'childCount', 'path', 'ancestorIds', 'isLeaf'].includes(k);
        
        if (isNodeHierarchyField) {
          console.log(`🔥 [DataCleaner] Removing Node hierarchy field for server calculation: ${k}=${JSON.stringify(value)}`);
          removedFields.push(k);
          delete cleaned[k];
        } else if (value === null || value === undefined || value === '') {
          // Regular computed fields: remove only if empty
          removedFields.push(k);
          delete cleaned[k];
        } else {
          console.log(`✅ [DataCleaner] Preserving client-computed field: ${k}=${value}`);
        }
      }
    });

    // stripOn per operation
    if (operation === 'create') {
      stripOnCreate.forEach((k) => {
        if (k in cleaned) {
          removedFields.push(k);
          delete cleaned[k];
        }
      });
    }
    if (operation === 'update') {
      stripOnUpdate.forEach((k) => {
        if (k in cleaned) {
          removedFields.push(k);
          delete cleaned[k];
        }
      });
    }
  } catch {}
  
  // Log removed fields if any optimistic tracking fields were present
  if (removedFields.some(field => field.startsWith('__'))) {
    console.log('🧹 [DataCleaner] Removed optimistic tracking fields:', {
      schema: schema.modelName,
      removedFields: removedFields.filter(field => field.startsWith('__')),
      allRemovedFields: removedFields,
      timestamp: new Date().toISOString()
    });
  }

  // Remove branchId for resources that don't support branching
  const schemaConfig = schema as any;
  if (schemaConfig.notHasBranchContext && 'branchId' in cleaned) {
    console.log('🔥 [DataCleaner] Removing branchId for non-branching resource:', {
      databaseKey: schema.databaseKey,
      notHasBranchContext: schemaConfig.notHasBranchContext,
      timestamp: new Date().toISOString()
    });
    delete cleaned.branchId;
  }
  
  // Handle compound IDs and convert undefined values to null
  Object.keys(cleaned).forEach(key => {
    // Convert undefined to null for all fields
    if (cleaned[key] === undefined) {
      cleaned[key] = null;
    }
    
    // Only convert empty strings to null for optional foreign key fields
    // Keep empty strings as empty strings for required string fields like 'content'
    if (cleaned[key] === '' && isOptionalForeignKeyField(key)) {
      cleaned[key] = null;
    }
    
    // Handle compound IDs - strip branch suffixes from foreign key fields
    if (cleaned[key] && typeof cleaned[key] === 'string' && cleaned[key].includes(':branch:')) {
      // Extract the base ID from compound IDs like "uuid:branch:branchId"
      const baseId = cleaned[key].split(':branch:')[0];
      
      console.log('🔥 [DataCleaner] Cleaned compound ID:', {
        field: key,
        originalValue: cleaned[key],
        cleanedValue: baseId,
        timestamp: new Date().toISOString()
      });
      
      cleaned[key] = baseId;
    }

    // Do not strip foreign keys like nodeId/processId for junction/relationship tables.
    // Previous generic removal of nodeId caused missing required relation fields on junction creates.
  });
  
  // Filter out auto-generated fields that are empty
  AUTO_GENERATED_FIELDS.forEach(field => {
    if (cleaned[field] === '' || cleaned[field] === undefined) {
      delete cleaned[field];
    }
  });
  
  // Convert empty strings to null for optional foreign key fields
  Object.keys(cleaned).forEach(field => {
    if (isOptionalForeignKeyField(field) && cleaned[field] === '') {
      cleaned[field] = null;
    }
  });
  
  // Cleaned data fields count tracked
  
  return cleaned;
}

/**
 * Add audit fields to data if the schema supports them
 */
export function addAuditFields(
  data: any, 
  schema: ResourceSchema, 
  userId: string, 
  isCreate: boolean = false
): any {
  const result = { ...data };
  
  // Add audit fields if the schema supports them
  if (!(schema as any).notHasAuditFields) {
    const now = new Date();
    
    if (isCreate) {
      result.createdAt = now;
      // Junction tables do not have createdById/updatedById columns
      const isJunction = isJunctionTable(schema.databaseKey) || isJunctionTable(schema.modelName) || schema.modelName.includes('Tag');
      if (!isJunction) {
        result.createdById = userId;
      }
      
      // 🎯 FIXED: Only add version and isActive for regular entities, NOT junction tables
      if (!isJunction) {
        result.version = 1;
        result.isActive = true;
        

        
        // Generate idShort for Node, Rule, and Class entities
        if (schema.modelName === 'Node') {
          result.idShort = generateNodeShortId();
        } else if (schema.modelName === 'Rule') {
          result.idShort = generateRuleShortId();
        } else if (schema.modelName === 'Class') {
          result.idShort = generateClassShortId();
        }
      } else {

      }
    }
    
    // Set originalId to null for new entities (Prisma will generate the ID)
    // The originalId will be set to the actual generated ID after creation if needed
    // NOTE: For entities with both foreign key and relation defined, don't set to null - let Prisma handle it
    if (isCreate) {
      if (schema.modelName === 'Node' && !result.originalNodeId) {
        result.originalNodeId = null;

      } else if (schema.modelName === 'Rule' && !result.originalRuleId) {
        result.originalRuleId = null;

      } else if (schema.modelName === 'Office' && !result.originalOfficeId) {
        result.originalOfficeId = null;

      } else if (schema.modelName === 'Process' && !result.originalProcessId) {
        result.originalProcessId = null;

      } else if (schema.modelName === 'Workflow' && !result.originalWorkflowId) {
        result.originalWorkflowId = null;

      }
      // Note: Removed originalPromptId setting - let Prisma handle optional relation fields
    }
    
    result.updatedAt = now;
    const isJunctionFinal = isJunctionTable(schema.databaseKey) || isJunctionTable(schema.modelName) || schema.modelName.includes('Tag');
    if (!isJunctionFinal) {
      result.updatedById = userId;
    }
  }
  
  return result;
}

/**
 * Prepare data for Copy-on-Write operation
 */
export function prepareCoWData(
  existing: any,
  updates: any,
  newId: string,
  branchId: string,
  userId: string,
  originalFieldName: string | null
): any {
  const cowData = {
    ...existing,
    ...updates,
    id: newId,
    branchId,
    updatedById: userId,
    updatedAt: new Date(),
    version: (existing.version || 1) + 1
  };

  // Add original field reference if the model supports it
  if (originalFieldName) {
    const existingOriginalValue = (existing as any)[originalFieldName];
    (cowData as any)[originalFieldName] = existingOriginalValue || existing.id;
  }

  // Remove relation objects for create
  delete cowData.createdBy;
  delete cowData.updatedBy;
  // Remove other computed/relation fields as needed

  return cowData;
}

/**
 * Prepare data for in-place update operation
 */
export function prepareUpdateData(
  updates: any,
  userId: string,
  schema?: ResourceSchema
): any {
  // Filter out system-managed fields that shouldn't be updated directly
  const filteredUpdates = { ...updates };
  // Internal flags to control server-side behaviors (stripped before persistence)
  const noVersionIncrement = filteredUpdates.__noVersionIncrement === true || filteredUpdates.__checkpoint === true;
  delete (filteredUpdates as any).__noVersionIncrement;
  delete (filteredUpdates as any).__checkpoint;
  const removedFields: string[] = [];
  
  Object.keys(filteredUpdates).forEach(field => {
    if (isSystemManagedField(field)) {

      delete filteredUpdates[field];
      removedFields.push(field);
    }
  });

  console.log('🔧 [DataCleaner] Prepared update data:', {
    originalFields: Object.keys(updates),
    filteredFields: Object.keys(filteredUpdates),
    removedFields
  });

  const result = {
    ...filteredUpdates
  };

  // Only add audit fields if schema supports them
  if (!schema || !(schema as any).notHasAuditFields) {
    result.updatedBy = {
      connect: { id: userId }
    };
    result.updatedAt = new Date();
    // Only increment version when explicitly desired (manual saves, not auto-saves)
    if (!noVersionIncrement) {
      result.version = { increment: 1 };
    }
  }

  return result;
}