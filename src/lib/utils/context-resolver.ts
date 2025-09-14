/**
 * Context Resolver - Auto-population utility for form fields
 * 
 * Resolves field values from various context sources:
 * - Session data (tenantId, branchId, userId)
 * - Navigation context (nodeId, parentId, selectedId)
 * - Component props (parentData, contextId)
 * - Auto-generated values (timestamp, uuid)
 */

import { v4 as uuidv4 } from 'uuid';
import { generateNodeShortId, generateRuleShortId } from '@/lib/utils/short-id-generator';
import type { ContextSource, AutoValueConfig } from '@/lib/resource-system/schemas';

// Context data structure
export interface FormContext {
  session?: {
    user?: {
      id?: string;
      tenantId?: string;
      branchContext?: {
        currentBranchId?: string;
        defaultBranchId?: string;
      };
    };
  };
  navigation?: {
    nodeId?: string;
    parentId?: string;
    selectedId?: string;
  };
  component?: {
    parentData?: any;
    contextId?: string;
  };
}

/**
 * Resolves a single value from a context source
 */
export function resolveContextValue(
  source: ContextSource,
  context: FormContext,
  fallback?: any,
  transform?: (value: any) => any
): any {
  let value: any;

  switch (source) {
    // Session sources
    case 'session.user.tenantId':
      value = context.session?.user?.tenantId;
      break;
    case 'session.user.branchContext.currentBranchId':
      value = context.session?.user?.branchContext?.currentBranchId;
      break;
    case 'session.user.branchContext.defaultBranchId':
      value = context.session?.user?.branchContext?.defaultBranchId;
      break;
    case 'session.user.id':
      value = context.session?.user?.id;
      break;
    
    // Navigation sources
    case 'navigation.nodeId':
      value = context.navigation?.nodeId;
      break;
    case 'navigation.parentId':
      value = context.navigation?.parentId;
      break;
    case 'navigation.selectedId':
      value = context.navigation?.selectedId;
      break;
    
    // Component sources
    case 'component.parentData':
      value = context.component?.parentData;
      break;
    case 'component.contextId':
      value = context.component?.contextId;
      break;
    
    // Auto-generated sources
    case 'auto.timestamp':
      value = new Date().toISOString();
      break;
    case 'auto.uuid':
      value = uuidv4();
      break;
    case 'auto.nodeShortId':
      value = generateNodeShortId();
      break;
    case 'auto.ruleShortId':
      value = generateRuleShortId();
      break;
    case 'auto.hierarchyPath':
      // Placeholder: computed in backend/services; for client-side default, return []
      value = [];
      break;
    case 'auto.hierarchyAncestors':
      // Placeholder: computed in backend/services; for client-side default, return []
      value = [];
      break;
    
    // Session context sources (for branching)
    case 'session.context.originalId':
      value = context.session?.context?.originalId;
      break;
    
    // Special self-reference sources (handled by form system)
    case 'self.id':
      // This will be resolved by the form system after ID generation
      value = undefined; // Fallback will be used
      break;
    
    default:
      
      value = undefined;
  }

  // Apply fallback if value is undefined/null
  if (value === undefined || value === null) {
    value = fallback;
  }

  // Apply transform if provided
  if (value !== undefined && value !== null && transform) {
    value = transform(value);
  }

  // Context value resolved - silent

  return value;
}

/**
 * Resolves multiple auto-values from a field schema
 */
export function resolveAutoValues(
  fields: Array<{ key: string; autoValue?: AutoValueConfig }>,
  context: FormContext
): Record<string, any> {
  const resolvedValues: Record<string, any> = {};

  // First pass: resolve all non-self-referencing fields
  for (const field of fields) {
    if (field.autoValue) {
      const { source, fallback, transform, onlyIfAvailable, condition } = field.autoValue;
      
      // Skip self-referencing fields in first pass
      if (fallback === 'self.id') {
        continue;
      }
      
      const value = resolveContextValue(source, context, fallback, transform);
      
      // 🔥 NEW: Conditional auto-population logic
      let shouldApplyValue = true;

      // Check if onlyIfAvailable is true and value is empty
      if (onlyIfAvailable && (value === undefined || value === null || value === '')) {
        shouldApplyValue = false;
      }

      // Check custom condition
      if (shouldApplyValue && condition && !condition(value)) {
        shouldApplyValue = false;
      }

      // Apply value only if conditions are met
      if (shouldApplyValue && value !== undefined && value !== null) {
        resolvedValues[field.key] = value;
      }
    }
  }

  // Second pass: resolve self-referencing fields
  for (const field of fields) {
    if (field.autoValue && field.autoValue.fallback === 'self.id') {
      const { source, fallback, transform, onlyIfAvailable, condition } = field.autoValue;
      
      // Try to resolve the source first
      let value = resolveContextValue(source, context, undefined, transform);
      
      // If source failed, use the generated ID from resolvedValues
      if (value === undefined || value === null) {
        value = resolvedValues.id; // Use the ID that was generated in first pass
      }
      
      // Apply conditional logic
      let shouldApplyValue = true;
      if (onlyIfAvailable && (value === undefined || value === null || value === '')) {
        shouldApplyValue = false;
      }
      if (shouldApplyValue && condition && !condition(value)) {
        shouldApplyValue = false;
      }

      // Apply value only if conditions are met
      if (shouldApplyValue && value !== undefined && value !== null) {
        resolvedValues[field.key] = value;
      }
    }
  }

  // Auto-values resolved - silent

  return resolvedValues;
}

/**
 * Creates a FormContext from various sources
 */
export function createFormContext(
  session?: any,
  navigation?: { nodeId?: string; parentId?: string; selectedId?: string },
  component?: { parentData?: any; contextId?: string }
): FormContext {
  const context: FormContext = {
    session,
    navigation,
    component
  };

  console.log('🔧 [Context Resolver] Created form context:', {
    hasSession: !!session,
    hasNavigation: !!navigation,
    hasComponent: !!component,
    context,
    timestamp: new Date().toISOString()
  });

  return context;
}

/**
 * Validates that all required auto-values are resolved
 */
export function validateAutoValues(
  fields: Array<{ key: string; autoValue?: AutoValueConfig }>,
  resolvedValues: Record<string, any>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of fields) {
    if (field.autoValue?.required && !resolvedValues[field.key]) {
      missing.push(field.key);
    }
  }

  const valid = missing.length === 0;

  console.log('🔧 [Context Resolver] Auto-values validation:', {
    valid,
    missing,
    resolvedCount: Object.keys(resolvedValues).length,
    timestamp: new Date().toISOString()
  });

  return { valid, missing };
}