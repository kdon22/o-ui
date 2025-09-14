/**
 * Auto-Modal Utilities - Helper functions for modal operations
 * 
 * Provides utility functions for:
 * - Schema-based form generation
 * - Validation handling
 * - Modal styling and sizing (with z-[9999] for top-level display)
 * - Default value generation
 * - Backdrop blur control (blur: true by default)
 * 
 * IMPORTANT: Always pass schema.actionPrefix (not plural resource names) to CreateModal/UpdateModal
 * - ✅ resource={NODE_SCHEMA.actionPrefix} → generates "node.create"
 * - ❌ resource="nodes" → generates "nodes.create" (fails)
 */

import { cn } from '@/lib/utils/generalUtils';
import type { 
  AutoModalConfig, 
  ModalDimensions, 
  ModalStyles,
  ModalSize 
} from './types';
import type { ResourceSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// MODAL SIZING
// ============================================================================

export function getModalDimensions(size: ModalSize): ModalDimensions {
  switch (size) {
    case 'sm':
      return {
        width: 'w-full',
        height: 'h-auto',
        maxWidth: 'max-w-md',
        maxHeight: 'max-h-[90vh]'
      };
    case 'md':
      return {
        width: 'w-full',
        height: 'h-auto',
        maxWidth: 'max-w-lg',
        maxHeight: 'max-h-[90vh]'
      };
    case 'lg':
      return {
        width: 'w-full',
        height: 'h-auto',
        maxWidth: 'max-w-2xl',
        maxHeight: 'max-h-[90vh]'
      };
    case 'xl':
      return {
        width: 'w-full',
        height: 'h-auto',
        maxWidth: 'max-w-4xl',
        maxHeight: 'max-h-[90vh]'
      };
    case '2xl':
      return {
        width: 'w-full',
        height: 'h-auto',
        maxWidth: 'max-w-6xl',
        maxHeight: 'max-h-[90vh]'
      };
    default:
      return getModalDimensions('md');
  }
}

// ============================================================================
// MODAL STYLING
// ============================================================================

export function getModalStyles(config: AutoModalConfig): ModalStyles {
  const dimensions = getModalDimensions(config.width || 'md');
  const shouldBlur = config.blur !== false; // Default to true unless explicitly set to false
  
  return {
    overlay: cn(
      'fixed inset-0 bg-black/50',
      shouldBlur ? 'backdrop-blur-sm' : '',
      'flex items-center justify-center p-4',
      'z-[9999] animate-in fade-in-0 duration-200' // Higher z-index to appear above everything
    ),
    container: cn(
      'relative bg-white rounded-lg shadow-xl',
      'flex flex-col overflow-hidden',
      dimensions.width,
      dimensions.height,
      dimensions.maxWidth,
      dimensions.maxHeight,
      'animate-in zoom-in-95 duration-200'
    ),
    header: cn(
      'flex items-center justify-between',
      'px-6 py-4 border-b border-gray-200',
      'bg-gray-50'
    ),
    content: cn(
      'flex-1 overflow-y-auto',
      'px-6 py-4'
    ),
    footer: cn(
      'flex items-center justify-end gap-3',
      'px-6 py-4 border-t border-gray-200',
      'bg-gray-50'
    )
  };
}

// ============================================================================
// SCHEMA UTILITIES
// ============================================================================

export function getVisibleFields(schema: ResourceSchema, action: 'create' | 'update') {
  return schema.fields.filter(field => {
    // Skip fields that shouldn't be shown in forms
    if (field.form?.showInForm === false) return false;
    
    // Skip system fields
    if (['id', 'createdAt', 'updatedAt', 'tenantId', 'branchId', 'originalNodeId', 'originalProcessId'].includes(field.key)) {
      return false;
    }
    
    // Include all other fields
    return true;
  });
}

export function getFieldsByTab(schema: ResourceSchema, action: 'create' | 'update') {
  const visibleFields = getVisibleFields(schema, action);
  const tabGroups: Record<string, any[]> = {};
  
  visibleFields.forEach(field => {
    const tab = field.tab || 'General';
    if (!tabGroups[tab]) {
      tabGroups[tab] = [];
    }
    tabGroups[tab].push(field);
  });
  
  return tabGroups;
}

export function getFieldsByTabAndRow(schema: ResourceSchema, action: 'create' | 'update') {
  const tabGroups = getFieldsByTab(schema, action);
  const result: Record<string, Record<number, any[]>> = {};
  
  Object.entries(tabGroups).forEach(([tab, fields]) => {
    const rowGroups: Record<number, any[]> = {};
    
    fields.forEach(field => {
      const row = field.form?.row || 1;
      if (!rowGroups[row]) {
        rowGroups[row] = [];
      }
      rowGroups[row].push(field);
    });
    
    // Sort fields within each row by order
    Object.keys(rowGroups).forEach(row => {
      rowGroups[Number(row)].sort((a, b) => {
        const orderA = a.form?.order || 0;
        const orderB = b.form?.order || 0;
        return orderA - orderB;
      });
    });
    
    result[tab] = rowGroups;
  });
  
  return result;
}

export function getFieldWidthClasses(width: string): string {
  switch (width) {
    case 'xs': return 'w-16';
    case 'sm': return 'w-24';
    case 'md': return 'w-32';
    case 'lg': return 'w-48';
    case 'xl': return 'w-64';
    case 'full': return 'w-full';
    case 'half': return 'w-1/2';
    case 'third': return 'w-1/3';
    case 'quarter': return 'w-1/4';
    default: return 'w-full';
  }
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Generate complete default values for entity creation
 * Simple, synchronous function that both auto-modal and auto-form can use
 */
export function generateCompleteDefaultValues(
  schema: ResourceSchema,
  mode: 'create' | 'edit',
  initialData?: any,
  parentData?: any,
  navigationContext?: { nodeId?: string; parentId?: string; selectedId?: string },
  session?: any
): Record<string, any> {
  console.log('🏭 [generateCompleteDefaultValues] ENTRY:', {
    schemaKey: schema.databaseKey,
    mode,
    hasInitialData: !!initialData,
    hasParentData: !!parentData,
    hasSession: !!session,
    timestamp: new Date().toISOString()
  });

  const defaults: Record<string, any> = {};

  // 1. Start with initial data (edit mode)
  if (initialData) {
    Object.assign(defaults, initialData);
  }

  // 2. Add parent relationships (hierarchical creates)
  if (mode === 'create' && parentData) {
    const schemaFieldKeys = schema.fields?.map(f => f.key) || [];
    
    if (schemaFieldKeys.includes('parentId') && parentData.id) {
      defaults.parentId = parentData.id;
    }

    // Include navigation context fields that exist in schema
    if (navigationContext) {
      Object.entries(navigationContext).forEach(([key, value]) => {
        if (schemaFieldKeys.includes(key) && value && !(key in defaults)) {
          defaults[key] = value;
        }
      });
    }
  }

  // 3. Add system fields from session
  if (session?.user) {
    if (session.user.tenantId) defaults.tenantId = session.user.tenantId;
    if (session.user.branchContext?.currentBranchId) {
      defaults.branchId = session.user.branchContext.currentBranchId;
    }
  }

  // 4. Generate auto-values for fields with autoValue config
  console.log('🔍 [generateCompleteDefaultValues] Processing auto-value fields:', {
    schemaModelName: schema.modelName,
    autoValueFields: schema.fields?.filter(f => f.autoValue).map(f => ({ key: f.key, source: f.autoValue?.source })) || [],
    sessionUserId: session?.user?.id,
    sessionTenantId: session?.user?.tenantId,
    timestamp: new Date().toISOString()
  });

  schema.fields?.forEach(field => {
    if (field.autoValue && !(field.key in defaults)) {
      console.log(`🔍 [generateCompleteDefaultValues] Processing field '${field.key}' with source '${field.autoValue.source}'`);
      switch (field.autoValue.source) {
        case 'auto.uuid':
          defaults[field.key] = crypto.randomUUID();
          break;
        case 'auto.nodeShortId': {
          // Generate node short ID like N4B7X2
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let shortId = 'N';
          for (let i = 0; i < 5; i++) {
            shortId += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          defaults[field.key] = shortId;
          break;
        }
        case 'auto.ruleShortId': {
          // Generate rule short ID like R8K9L3
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let shortId = 'R';
          for (let i = 0; i < 5; i++) {
            shortId += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          defaults[field.key] = shortId;
          break;
        }
        case 'session.user.tenantId':
          if (session?.user?.tenantId) defaults[field.key] = session.user.tenantId;
          break;
        case 'session.user.id':
          if (session?.user?.id) {
            defaults[field.key] = session.user.id;
            console.log(`✅ [generateCompleteDefaultValues] Set ${field.key} = ${session.user.id}`);
          } else {
            console.warn(`⚠️ [generateCompleteDefaultValues] No session.user.id available for field ${field.key}`);
          }
          break;
        case 'session.user.branchContext.currentBranchId':
          if (session?.user?.branchContext?.currentBranchId) {
            defaults[field.key] = session.user.branchContext.currentBranchId;
          }
          break;
        case 'navigation.parentId':
          if (navigationContext?.parentId) defaults[field.key] = navigationContext.parentId;
          break;
        case 'auto.timestamp':
          defaults[field.key] = new Date().toISOString();
          break;
      }
    }
  });

  console.log('🔍 [generateCompleteDefaultValues] Final defaults object:', {
    schemaModelName: schema.modelName,
    defaultsKeys: Object.keys(defaults),
    authorId: defaults.authorId,
    tenantId: defaults.tenantId,
    id: defaults.id,
    timestamp: new Date().toISOString()
  });

  // 5. Set field type defaults for remaining fields
  schema.fields?.forEach(field => {
    if (field.key in defaults) return; // Skip if already set
    if (field.autoValue) return; // Skip auto-value fields

    // Use schema defaultValue if available
    if (field.defaultValue !== undefined) {
      defaults[field.key] = field.defaultValue;
      return;
    }

    // Set type-appropriate defaults
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
        defaults[field.key] = '';
        break;
      case 'number':
        defaults[field.key] = 0;
        break;
      case 'checkbox':
      case 'switch':
        defaults[field.key] = false;
        break;
      case 'select':
        if (field.options?.static && field.options.static.length > 0) {
          defaults[field.key] = field.options.static[0].value;
        } else {
          defaults[field.key] = '';
        }
        break;
      case 'multiselect':
        defaults[field.key] = [];
        break;
      default:
        defaults[field.key] = null;
    }
  });

  console.log('🎉 [generateCompleteDefaultValues] Complete:', {
    schemaKey: schema.databaseKey,
    totalFields: Object.keys(defaults).length,
    fieldKeys: Object.keys(defaults),
    timestamp: new Date().toISOString()
  });

  return defaults;
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateField(field: any, value: any): string | null {
  if (!field.validation) return null;
  
  for (const rule of field.validation) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return rule.message || `${field.label} is required`;
        }
        break;
      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message || `${field.label} must be at least ${rule.value} characters`;
        }
        break;
      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message || `${field.label} must be no more than ${rule.value} characters`;
        }
        break;
      case 'email':
        if (typeof value === 'string' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return rule.message || `${field.label} must be a valid email`;
        }
        break;
      case 'url':
        if (typeof value === 'string' && value && !/^https?:\/\/.+/.test(value)) {
          return rule.message || `${field.label} must be a valid URL`;
        }
        break;
      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message || `${field.label} must be at least ${rule.value}`;
        }
        break;
      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message || `${field.label} must be no more than ${rule.value}`;
        }
        break;
    }
  }
  
  return null;
}

export function validateForm(schema: ResourceSchema, data: any): Record<string, string> {
  const errors: Record<string, string> = {};
  const visibleFields = getVisibleFields(schema, 'create');
  
  visibleFields.forEach(field => {
    const error = validateField(field, data[field.key]);
    if (error) {
      errors[field.key] = error;
    }
  });
  
  return errors;
}

// ============================================================================
// MODAL CONFIGURATION
// ============================================================================

export function getDefaultModalConfig(actionPrefix: string, action: 'create' | 'update'): AutoModalConfig {
  return {
    resource: actionPrefix, // Use actionPrefix for consistency
    action,
    width: 'lg',
    height: 'auto',
    showHeader: true,
    showFooter: true,
    showCancel: true,
    showSubmit: true,
    submitLabel: action === 'create' ? 'Create' : 'Update',
    cancelLabel: 'Cancel',
    preventClose: false,
    blur: true // Default to blur enabled
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getModalTitle(schema: ResourceSchema, action: 'create' | 'update', parentData?: any): string {
  const resourceName = schema.display.title.slice(0, -1); // Remove 's' from plural
  
  if (action === 'create') {
    if (parentData) {
      return `Add ${resourceName} to ${parentData.name}`;
    }
    return `Add ${resourceName}`;
  }
  
  return `Edit ${resourceName}`;
}

export function getSubmitButtonText(action: 'create' | 'update'): string {
  return action === 'create' ? 'Create' : 'Update';
} 