import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { resolveAutoValues, createFormContext } from '@/lib/utils/context-resolver';
import type { ResourceSchema, FieldSchema } from '@/lib/resource-system/schemas';
import type { FormTab } from './types';
import { generateDefaultValues } from '../modal/utils';

// ============================================================================
// TYPES
// ============================================================================
export interface FormRow {
  rowNumber: number;
  fields: FieldSchema[];
}

// ============================================================================
// FIELD ORGANIZATION UTILITIES
// ============================================================================

/**
 * System fields that should never appear in forms
 */
const SYSTEM_FIELDS = [
  'id',
  'tenantId',
  'branchId', 
  'originalOfficeId',
  'originalNodeId',
  'originalRuleId',
  'originalProcessId',
  'originalWorkflowId',
  'createdAt',
  'updatedAt',
  'createdById',
  'updatedById',
  'version'
];

/**
 * Filters out hidden and system fields from a schema
 * Note: This only affects UI rendering - required hidden fields are still validated
 */
export const getVisibleFormFields = (schema: ResourceSchema): FieldSchema[] => {
  const visibleFields = schema.fields.filter(field => {
    // Skip system fields
    if (SYSTEM_FIELDS.includes(field.key)) return false;
    // Only show fields that declare a form config
    if (!field.form) return false;
    
    return true;
  });
  
  return visibleFields;
};

/**
 * Gets all fields that should be validated (including hidden required fields)
 */
export const getValidatableFields = (schema: ResourceSchema, isCreate: boolean = true): FieldSchema[] => {
  return schema.fields.filter(field => {
    // Skip system fields 
    if (SYSTEM_FIELDS.includes(field.key)) return false;
    
    // Skip runtime fields during create/update operations
    if (isCreate && field.excludeFromCreate) return false;
    if (!isCreate && field.excludeFromUpdate) return false;

    // Include if field is required (validate even without explicit form config)
    if (field.required) return true;

    // Or if the field has form configuration (even if hidden)
    if (field.form) return true;

    return false;
  });
};

/**
 * Groups fields by their tab configuration
 */
export const groupFieldsByTabs = (fields: FieldSchema[]): Record<string, FieldSchema[]> => {
  const tabGroups: Record<string, FieldSchema[]> = {};
  
  fields.forEach(field => {
    const tabKey = field.tab || 'general';
    if (!tabGroups[tabKey]) {
      tabGroups[tabKey] = [];
    }
    tabGroups[tabKey].push(field);
  });
  
  return tabGroups;
};

/**
 * Creates form tabs from schema fields
 */
export const getFormTabs = (visibleFields: FieldSchema[]): FormTab[] => {
  const fieldsWithTabs = visibleFields.filter(field => field.tab);
  const fieldsWithoutTabs = visibleFields.filter(field => !field.tab);
  
  const tabGroups = groupFieldsByTabs(fieldsWithTabs);
  const tabs: FormTab[] = [];
  
  // Add explicit tabs
  Object.entries(tabGroups).forEach(([tabKey, fields]) => {
    tabs.push({
      key: tabKey,
      label: tabKey.charAt(0).toUpperCase() + tabKey.slice(1),
      fields: fields
    });
  });
  
  // Add default tab if there are fields without tabs
  if (fieldsWithoutTabs.length > 0) {
    tabs.unshift({
      key: 'general',
      label: 'General',
      fields: fieldsWithoutTabs
    });
  }
  
  return tabs;
};

/**
 * Creates a Zod validation schema from field definitions
 */
/**
 * Factory function to determine if a field schema represents an array type
 */
const isArrayFieldSchema = (fieldSchema: z.ZodType<any>): boolean => {
  // Check if the schema is a ZodArray or has array characteristics
  return fieldSchema instanceof z.ZodArray || 
         (fieldSchema as any)._def?.typeName === 'ZodArray' ||
         // Handle default() wrapped arrays
         ((fieldSchema as any)._def?.innerType instanceof z.ZodArray) ||
         ((fieldSchema as any)._def?.innerType?._def?.typeName === 'ZodArray');
};

export const getFormValidationSchema = (schema: ResourceSchema, isCreate: boolean = true): z.ZodObject<any> => {
  const validatableFields = getValidatableFields(schema, isCreate);
  const zodSchema: Record<string, z.ZodType<any>> = {};
  
  validatableFields.forEach(field => {
    let fieldSchema: z.ZodType<any>;
    
    // Base schema based on field type
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
      case 'richText':
        fieldSchema = z.string();
        break;
      case 'number':
      case 'currency':
        fieldSchema = z.coerce.number().nullable();
        break;
      case 'switch':
        fieldSchema = z.boolean();
        break;
      case 'select':
        fieldSchema = z.string();
        break;
      case 'multiSelect':
        fieldSchema = z.array(z.string()).default([]);
        break;
      case 'tags':
      case 'component-selector':
        fieldSchema = z.array(z.string()).default([]);
        break;
      case 'date':
        fieldSchema = z.string().datetime();
        break;
      case 'json':
        fieldSchema = z.any();
        break;
      default:
        fieldSchema = z.string();
    }
    
    // 🏭 FACTORY APPROACH: Auto-detect array fields
    const isArrayField = isArrayFieldSchema(fieldSchema);
    
    // Handle nullable fields - for arrays, convert null to empty array
    if (field.nullable) {
      if (isArrayField) {
        fieldSchema = fieldSchema.nullable().transform((val) => val ?? []);
      } else {
        fieldSchema = fieldSchema.nullable();
      }
    }
    
    // Apply required validation
    if (!field.required) {
      // For optional array fields, also handle null values
      if (isArrayField) {
        fieldSchema = fieldSchema.optional().nullable().transform((val) => val ?? []);
      } else {
        fieldSchema = fieldSchema.optional();
      }
    }
    
    zodSchema[field.key] = fieldSchema;
  });
  
  // 🏭 FACTORY APPROACH: Add dynamic field logic based on business rules
  const baseSchema = z.object(zodSchema);
  
  // 🎯 BUSINESS RULE: executionMode depends on runOrder
  if (zodSchema.executionMode && zodSchema.runOrder) {
    return baseSchema.transform((data) => {
      // Apply business logic: runOrder = 0 → SYNC, runOrder ≠ 0 → ASYNC
      if (typeof data.runOrder === 'number') {
        data.executionMode = data.runOrder === 0 ? 'SYNC' : 'ASYNC';
      }
      return data;
    });
  }
  
  return baseSchema;
};

/**
 * Organizes fields into rows based on form configuration
 */
export const organizeFieldsIntoRows = (fields: FieldSchema[]): FormRow[] => {
  const rowsMap = new Map<number, FieldSchema[]>();
  
  fields.forEach(field => {
    const rowNumber = field.form?.row || 1;
    if (!rowsMap.has(rowNumber)) {
      rowsMap.set(rowNumber, []);
    }
    rowsMap.get(rowNumber)!.push(field);
  });

  // Sort fields within each row by order
  Array.from(rowsMap.values()).forEach(fields => {
    fields.sort((a, b) => (a.form?.order || 0) - (b.form?.order || 0));
  });

  // Convert to array and sort by row number
  return Array.from(rowsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([rowNumber, fields]) => ({ rowNumber, fields }));
};

/**
 * Hook to organize form fields into tabs and rows
 */
export const useFormRows = (schema: ResourceSchema) => {
  const formFields = useMemo(() => getVisibleFormFields(schema), [schema.fields]);
  
  const tabGroups = useMemo(() => groupFieldsByTabs(formFields), [formFields]);
  
  const formRows = useMemo(() => organizeFieldsIntoRows(formFields), [formFields]);
  
  return { formFields, formRows, tabGroups };
};

// ============================================================================
// FIELD WIDTH UTILITIES
// ============================================================================

/**
 * Gets the CSS class for field width based on form configuration
 */
export const getFieldWidthClass = (field: FieldSchema, fieldsInRow: number): string => {
  // Explicit width mappings (desktop uses a 12-column grid; mobile defaults to full width)
  if (field.form?.width === 'full') return 'col-span-12';
  if (field.form?.width === 'xl') return 'col-span-12 md:col-span-8';
  if (field.form?.width === 'lg') return 'col-span-12 md:col-span-6';
  if (field.form?.width === 'md') return 'col-span-12 md:col-span-4';
  if (field.form?.width === 'sm') return 'col-span-12 md:col-span-3';
  if (field.form?.width === 'xs') return 'col-span-12 md:col-span-2';
  // Semantic aliases
  if (field.form?.width === 'half') return 'col-span-12 md:col-span-6';
  if (field.form?.width === 'third') return 'col-span-12 md:col-span-4';
  if (field.form?.width === 'quarter') return 'col-span-12 md:col-span-3';
  
  // Auto-calculate based on number of fields in row
  if (fieldsInRow === 1) return 'col-span-12';
  if (fieldsInRow === 2) return 'col-span-12 md:col-span-6';
  if (fieldsInRow === 3) return 'col-span-12 md:col-span-4';
  if (fieldsInRow === 4) return 'col-span-12 md:col-span-3';
  
  return 'col-span-12';
};

/**
 * Gets the CSS class for form width based on schema configuration
 */
export const getFormWidthClass = (schema: ResourceSchema): string => {
  const width = schema.form?.width || 'lg'; // Default to 'lg' if not specified
  switch (width) {
    case 'sm':
      return 'max-w-lg'; // ~512px - good for simple forms
    case 'md':
      return 'max-w-2xl'; // ~672px - good for medium forms
    case 'lg':
      return 'max-w-4xl'; // ~896px - good for complex forms with tabs
    case 'xl':
      return 'max-w-6xl'; // ~1152px - good for very complex forms
    case 'full':
      return 'max-w-full'; // Full width
    default:
      return 'max-w-4xl'; // Default for 'lg'
  }
};

// ============================================================================
// FORM DATA UTILITIES
// ============================================================================

/**
 * Prepares initial form data with proper defaults for create mode
 */
export const prepareInitialFormData = (
  mode: 'create' | 'edit',
  initialData: Record<string, any>,
  formFields: FieldSchema[],
  tenantId: string,
  branchId: string
): Record<string, any> => {
  if (mode === 'create') {
    // For create mode, ensure we have proper default values
    const defaultValues: Record<string, any> = {
      ...initialData,
      tenantId: tenantId,
      branchId: branchId,
    };
    
    // Set appropriate default values for different field types
    // Only process fields that don't already have values set
    formFields.forEach(field => {
      if (defaultValues[field.key] === undefined) {
        // Use schema defaultValue if available
        if (field.defaultValue !== undefined) {
          defaultValues[field.key] = field.defaultValue;
        }
        // Otherwise set type-appropriate defaults
        else if (field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'url') {
          defaultValues[field.key] = '';
        }
        // For select fields, set to empty string so validation can catch them
        else if (field.type === 'select') {
          defaultValues[field.key] = '';
        }
        // Set false for boolean fields
        else if (field.type === 'switch') {
          defaultValues[field.key] = false;
        }
        // Set 0 for number fields
        else if (field.type === 'number') {
          defaultValues[field.key] = 0;
        }
        // Set empty arrays for array fields
        else if (field.type === 'tags' || field.type === 'multiSelect' || field.type === 'component-selector') {
          defaultValues[field.key] = [];
        }
      }
    });
    
    return defaultValues;
  }
  
  return initialData;
};

/**
 * Prepares submission data with system fields and cleans up empty values
 */
export const prepareSubmissionData = (
  data: Record<string, any>,
  mode: 'create' | 'edit',
  tenantId: string,
  branchId: string,
  parentData?: Record<string, any>,
  schema?: ResourceSchema,
  navigationContext?: { nodeId?: string; parentId?: string; selectedId?: string }
): Record<string, any> => {
  // Clean up empty string values for optional fields
  const cleanedData = { ...data };
  
  // Convert empty strings to null for optional fields
  // BUT preserve required fields that have actual values
  Object.keys(cleanedData).forEach(key => {
    if (cleanedData[key] === '' || cleanedData[key] === undefined) {
      // Convert empty/undefined to null (server will handle validation)
      cleanedData[key] = null;
    }
  });

  // 🚀 CRITICAL FIX: Add fields with autoValue configuration that may be hidden from form
  if (schema && schema.fields) {
    schema.fields.forEach(field => {
      // If field has autoValue config but is missing from form data, add it as null
      // This allows the AutoValue system to process it
      if (field.autoValue && !(field.key in cleanedData)) {
        console.log(`🔧 [prepareSubmissionData] Adding missing autoValue field: ${field.key}`);
        cleanedData[field.key] = null; // AutoValue system will generate the value
      }
    });
  }

  // 🛡️ SCHEMA-DRIVEN: All system fields come from autoValue system

  // 🛡️ SCHEMA-DRIVEN: Form data already includes all autoValue fields (ID, tenantId, branchId, etc.)
  const result: Record<string, any> = {
    ...cleanedData,
    // Include parent context data (like nodeId from navigation context)
    ...(parentData || {}),
    // 🛡️ SCHEMA-DRIVEN: Don't include navigationContext fields that don't exist in schema
    // Junction relationships are handled separately by the backend action system
  };

  // Clean up undefined values that were explicitly set
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key];
    }
  });

  console.log('🎯 [prepareSubmissionData] Final submission data:', {
    mode,
    inputDataKeys: Object.keys(data),
    resultDataKeys: Object.keys(result),
    resultHasId: 'id' in result,
    resultIdValue: result.id,
    schemaName: schema?.modelName,
    timestamp: new Date().toISOString()
  });

  return result;
};

// ============================================================================
// FORM CONTEXT UTILITIES
// ============================================================================

/**
 * Gets tenant and branch context from session and initial data
 */
export const useFormContext = (initialData: Record<string, any> | null) => {
  const { data: session } = useSession();
  
  return useMemo(() => {
    const tenantId = session?.user?.tenantId || 'default';
    
    // Get branch ID from session's branchContext (actual branch ID, not name)
    const sessionBranchId = session?.user?.branchContext?.currentBranchId;
    const defaultBranchId = session?.user?.branchContext?.defaultBranchId;
    const branchId = (initialData && initialData.branchId) || sessionBranchId || defaultBranchId || '';
    
    console.log('🔥 [useFormContext] Getting form context:', {
      sessionTenantId: session?.user?.tenantId,
      sessionBranchId: sessionBranchId,
      defaultBranchId: defaultBranchId,
      initialData,
      resolvedTenantId: tenantId,
      resolvedBranchId: branchId,
      sessionExists: !!session,
      userExists: !!session?.user,
      hasBranchContext: !!session?.user?.branchContext
    });
    
    return {
      tenantId,
      branchId
    };
  }, [session?.user?.tenantId, session?.user?.branchContext?.currentBranchId, session?.user?.branchContext?.defaultBranchId, initialData]);
};

// ============================================================================
// DEAD FUNCTIONS REMOVED
// ============================================================================

// useEnhancedFormContext was removed - use DefaultValueService.generateCompleteDefaultValues instead
// createFormContext was removed - functionality moved to DefaultValueService  
// resolveAutoValues was removed - use AutoValueService.generateAutoValues instead 