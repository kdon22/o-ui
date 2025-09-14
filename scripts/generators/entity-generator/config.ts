/**
 * Entity Generator Configuration
 * 
 * Types and utilities for entity generator configuration.
 */

import path from 'path';

/**
 * Property definition for entity fields
 */
export interface EntityProperty {
  name: string;
  type: string;
  required: boolean;
}

/**
 * Configuration for entity generation
 */
export interface EntityConfig {
  // Basic entity information
  entityName: string; 
  entityNameCapitalized: string;
  entityNamePlural: string;
  entityNamePluralCapitalized: string;
  
  // File paths
  featuresDir: string;
  entityDir: string;
  
  // Type information
  properties: EntityProperty[];
  
  // Adapter options
  adapters: ('rest' | 'zustand' | 'graphql' | 'offline' | 'mock')[];
  
  // Feature options
  enableOffline: boolean;
  enableCache: boolean;
  enableOptimistic: boolean;
}

/**
 * Validation function for entity config
 */
export function validateConfig(config: EntityConfig): string[] {
  const errors: string[] = [];
  
  // Basic validation
  if (!config.entityName) {
    errors.push('Entity name is required');
  }
  
  if (!config.entityDir) {
    errors.push('Entity directory is required');
  }
  
  if (!config.adapters || config.adapters.length === 0) {
    errors.push('At least one adapter must be specified');
  }
  
  return errors;
}

/**
 * Creates a default configuration based on entity name
 */
export function createDefaultConfig(entityName: string): EntityConfig {
  return {
    entityName,
    entityNameCapitalized: entityName.charAt(0).toUpperCase() + entityName.slice(1),
    entityNamePlural: `${entityName}s`,
    entityNamePluralCapitalized: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)}s`,
    
    featuresDir: path.resolve(process.cwd(), 'src/features'),
    entityDir: path.resolve(process.cwd(), `src/features/${entityName}`),
    
    properties: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string', required: false },
      { name: 'nodeId', type: 'string', required: true },
      { name: 'tenantId', type: 'string', required: true },
    ],
    
    adapters: ['rest', 'zustand'],
    
    enableOffline: true,
    enableCache: true,
    enableOptimistic: true
  };
} 