/**
 * Action Parser Utilities
 * 
 * Utilities for parsing action strings and extracting resource information
 */

import { 
  getActionMappings,
  RESOURCE_REGISTRY, 
  getResourceByActionPrefix,
  isJunctionResource 
} from '@/lib/resource-system/resource-registry';
// Junction schema functionality moved to unified-resource-registry
import type { ParsedAction } from '../core/types';

/**
 * Parse action string to extract resource type and operation
 * Examples:
 * - "node.create" -> { resourceType: "node", operation: "create" }
 * - "process.list" -> { resourceType: "process", operation: "list" }
 * - "rule.customValidate" -> { resourceType: "rule", operation: "customValidate" }
 */
export function parseAction(action: string): ParsedAction | null {
  const parts = action.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [resourceType, operation] = parts;
  return { resourceType, operation };
}

/**
 * Get resource schema for a given resource type
 */
export function getResourceSchema(resourceType: string) {
  // Junction resources are now handled by unified-resource-registry
  // For now, only handle regular resources
  const resourceSchema = getResourceByActionPrefix(resourceType);
  if (!resourceSchema) {
    console.error(`🔥 [ActionParser] Resource schema not found for ${resourceType}`, {
      availableResources: RESOURCE_REGISTRY.map(r => r.actionPrefix),
      timestamp: new Date().toISOString()
    });
    return null;
  }

  return resourceSchema;
}

/**
 * Check if an action is supported
 */
export function isActionSupported(action: string): boolean {
  const parsedAction = parseAction(action);
  if (!parsedAction) return false;

  const actionMappings = getActionMappings();
  return Boolean(actionMappings[action]);
}

/**
 * Get all actions supported by a resource type
 */
export function getResourceActions(resourceType: string): string[] {
  const actions: string[] = [];
  const actionMappings = getActionMappings();
  
  for (const [actionName, mapping] of Object.entries(actionMappings)) {
    const parsedAction = parseAction(actionName);
    if (parsedAction && parsedAction.resourceType === resourceType) {
      actions.push(actionName);
    }
  }
  
  return actions;
}

// Re-export functions that are used by other modules
export { getResourceByActionPrefix } from '@/lib/resource-system/resource-registry';