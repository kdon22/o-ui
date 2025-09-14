/**
 * Action Metadata Utilities
 * 
 * Utilities for providing metadata about available actions and resources
 */

import { 
  getActionMappings,
  RESOURCE_REGISTRY 
} from '@/lib/resource-system/resource-registry';

/**
 * Get metadata about available actions and their configurations
 */
export function getActionMetadata(): any {
  const actionMappings = getActionMappings();
  return {
    registeredResources: RESOURCE_REGISTRY.map(schema => schema.actionPrefix),
    availableActions: Object.keys(actionMappings),
    actionMappings: actionMappings,
    resourceSchemas: RESOURCE_REGISTRY.map(schema => ({
      actionPrefix: schema.actionPrefix,
      databaseKey: schema.databaseKey,
      modelName: schema.modelName,
      actions: schema.actions
    }))
  };
}

/**
 * Get available database keys from resource registry
 */
export function getAvailableDatabaseKeys(): string[] {
  return RESOURCE_REGISTRY.map(schema => schema.databaseKey);
} 