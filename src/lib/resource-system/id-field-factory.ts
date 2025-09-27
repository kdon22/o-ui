/**
 * ID Field Factory - Bulletproof ID Generation
 * 
 * Ensures every resource schema has consistent, bulletproof ID handling
 * that prevents optimistic ID conflicts and database constraint violations.
 */

import type { FieldDefinition } from './schemas';

/**
 * Creates a bulletproof ID field that generates consistent UUIDs
 * across form submission, IndexedDB storage, and server persistence.
 */
export function createBulletproofIdField(): FieldDefinition {
  return {
    key: 'id',
    label: 'ID',
    type: 'text',
    required: true,
    description: 'Unique identifier - auto-generated',
    autoValue: {
      source: 'auto.uuid',
      required: true
    },
    form: {
      row: 1,
      width: 'full',
      showInForm: false // Never show in forms - always auto-generated
    },
    table: {
      width: 'sm',
       // Usually hidden in tables too
    },
    validation: [
      { 
        type: 'required', 
        message: 'ID is required (auto-generated)' 
      }
    ]
  };
}

/**
 * Creates a bulletproof original ID field for branching support
 */
export function createBulletproofOriginalIdField(entityName: string): FieldDefinition {
  return {
    key: `original${entityName}Id`,
    label: `Original ${entityName} ID`,
    type: 'text',
    description: `Reference to the original ${entityName.toLowerCase()} for branching`,
    autoValue: {
      source: 'session.context.originalId',
      fallback: 'self.id' // Falls back to own ID if not a branch
    },
    form: {
      row: 1,
      width: 'full',
      showInForm: false
    },
    table: {
      width: 'sm',
      
    }
  };
}

/**
 * Creates bulletproof tenant/branch fields that are auto-populated
 */
export function createBulletproofContextFields(): FieldDefinition[] {
  return [
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      required: true,
      description: 'Tenant context - auto-populated from session',
      autoValue: {
        source: 'session.user.tenantId',
        required: true
      },
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'sm',
        
      }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      required: true,
      description: 'Branch context - auto-populated from session',
      autoValue: {
        source: 'session.user.branchContext.currentBranchId',
        required: true
      },
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'xs',
        
      }
    }
  ];
}

/**
 * Validates that a schema has bulletproof ID handling
 */
export function validateBulletproofIdHandling(schema: any): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check for ID field
  const idField = schema.fields?.find((f: any) => f.key === 'id');
  if (!idField) {
    issues.push('Missing ID field');
    recommendations.push('Add createBulletproofIdField() to schema.fields');
  } else {
    // Check ID field configuration
    if (!idField.autoValue?.source) {
      issues.push('ID field missing autoValue.source');
      recommendations.push('Set autoValue.source to "auto.uuid"');
    }
    
    if (idField.form?.showInForm !== false) {
      issues.push('ID field should not be shown in forms');
      recommendations.push('Set form.showInForm to false');
    }
  }
  
  // Check for tenant/branch fields
  const tenantField = schema.fields?.find((f: any) => f.key === 'tenantId');
  const branchField = schema.fields?.find((f: any) => f.key === 'branchId');
  
  if (!tenantField) {
    issues.push('Missing tenantId field');
    recommendations.push('Add createBulletproofContextFields() to schema.fields');
  }
  
  if (!branchField) {
    issues.push('Missing branchId field');
    recommendations.push('Add createBulletproofContextFields() to schema.fields');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Helper to add bulletproof ID handling to any existing schema
 */
export function makeSchemaBulletproof(schema: any, entityName: string): any {
  const bulletproofFields = [
    createBulletproofIdField(),
    createBulletproofOriginalIdField(entityName),
    ...createBulletproofContextFields()
  ];
  
  // Remove any existing conflicting fields
  const existingFields = schema.fields?.filter((f: any) => 
    !['id', `original${entityName}Id`, 'tenantId', 'branchId'].includes(f.key)
  ) || [];
  
  return {
    ...schema,
    fields: [
      ...bulletproofFields,
      ...existingFields
    ]
  };
}

/**
 * Development helper - logs schema ID validation results
 */
export function debugSchemaIdHandling(schema: any, schemaName: string): void {
  if (process.env.NODE_ENV === 'development') {
    const validation = validateBulletproofIdHandling(schema);
    
    if (!validation.isValid) {
      console.warn(`🚨 [${schemaName}] Schema ID handling issues:`, {
        schema: schemaName,
        issues: validation.issues,
        recommendations: validation.recommendations,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`✅ [${schemaName}] Schema has bulletproof ID handling`, {
        schema: schemaName,
        timestamp: new Date().toISOString()
      });
    }
  }
}