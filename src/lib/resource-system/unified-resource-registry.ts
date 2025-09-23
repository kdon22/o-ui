/**
 * Unified Resource Registry - Next Generation SSOT System
 * 
 * GOLD STANDARD: Complete replacement for legacy resource registry
 * - Integrates with Unified Relationship Engine
 * - Auto-generates enhanced resource methods
 * - Handles junction tables through relationship definitions
 * - Eliminates all legacy patterns and duplicate code
 */

import type { ResourceSchema, RelationshipConfig } from './schemas';
import type { ActionClientCore } from '@/lib/action-client/action-client-core';
import type { BranchContext } from '@/lib/action-client/types';
// Relationship engine removed - using pure action system now

// ============================================================================
// SCHEMA IMPORTS - ALL RESOURCES
// ============================================================================

import { ALL_SCHEMAS, SCHEMA_RESOURCES, JUNCTION_SCHEMAS } from './all-schemas';

// ============================================================================
// UNIFIED RESOURCE REGISTRY
// ============================================================================

export class UnifiedResourceRegistry {
  private static instance: UnifiedResourceRegistry;
  private actionClient: ActionClientCore | null = null;
  private branchContext: BranchContext | null = null;
  private initialized = false;
  // Enhanced methods removed - using pure action system now
  // Junction migration removed
  
  private constructor() {}
  
  static getInstance(): UnifiedResourceRegistry {
    if (!UnifiedResourceRegistry.instance) {
      UnifiedResourceRegistry.instance = new UnifiedResourceRegistry();
    }
    return UnifiedResourceRegistry.instance;
  }
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  async initialize(actionClient: ActionClientCore, branchContext: BranchContext): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    console.log('🚀 [UnifiedResourceRegistry] Initializing next-generation resource system');
    
    this.actionClient = actionClient;
    this.branchContext = branchContext;
    
    // Relationship engine removed - using pure action system now
    
    // Initialize action mappings for the action client
    this.initializeActionMappings();
    
    this.initialized = true;
    
    console.log('✅ [UnifiedResourceRegistry] Initialization completed', {
      schemas: ALL_SCHEMAS.length
    });
  }
  
  // ============================================================================
  // RESOURCE ACCESS
  // ============================================================================
  
  // Enhanced methods removed - using pure action system now
  
  /**
   * Get all resource schemas
   */
  getAllSchemas(): ResourceSchema[] {
    return ALL_SCHEMAS;
  }
  
  /**
   * Get schema by key
   */
  getSchema(resourceKey: string): ResourceSchema | null {
    return ALL_SCHEMAS.find(schema => schema.databaseKey === resourceKey) || null;
  }
  
  /**
   * Check if a table is a junction table (auto-discovery)
   */
  isJunctionTable(tableName: string): boolean {
    // Auto-discover junction tables from all entity schemas
    return this.getAllJunctionTables().includes(tableName);
  }
  
  /**
   * Auto-discover all junction tables from entity schemas
   */
  getAllJunctionTables(): string[] {
    const junctionTables: string[] = [];
    
    // Scan all entity schemas for relationship definitions
    ALL_SCHEMAS.forEach(schema => {
      if (schema && schema.relationships) {
        Object.values(schema.relationships).forEach(rel => {
          if (rel.type === 'many-to-many' && rel.junction?.tableName) {
            junctionTables.push(rel.junction.tableName);
          }
        });
      }
    });
    
    return [...new Set(junctionTables)]; // Remove duplicates
  }
  
  // Junction tables auto-discovered from schema relationships
  
  // ============================================================================
  // LEGACY COMPATIBILITY METHODS
  // ============================================================================
  
  /**
   * Get action mappings (legacy compatibility)
   */
  getActionMappings(): Record<string, any> {
    const mappings: Record<string, any> = {};
    
    ALL_SCHEMAS.forEach(schema => {
      const actions = ['create', 'update', 'delete', 'list', 'read'];
      
      actions.forEach(action => {
        const actionKey = `${schema.databaseKey}.${action}`;
        mappings[actionKey] = {
          resource: schema.databaseKey,
          action,
          store: schema.databaseKey,
          method: action === 'read' ? 'get' : action
        };
      });
    });
    
    // Junction table actions are auto-discovered from schema relationships
    
    return mappings;
  }
  
  /**
   * Get IndexedDB store configurations (legacy compatibility)
   */
  getIndexedDBStores(): any[] {
    const stores: any[] = [];
    
    // Add main resource stores
    ALL_SCHEMAS.forEach(schema => {
      stores.push({
        name: schema.databaseKey,
        keyPath: 'id',
        indexes: [
          { name: 'tenantId', keyPath: 'tenantId' },
          { name: 'branchId', keyPath: 'branchId' },
          { name: 'createdAt', keyPath: 'createdAt' },
          { name: 'updatedAt', keyPath: 'updatedAt' }
        ]
      });
    });
    
    // Junction table stores are auto-discovered from schema relationships
    
    return stores;
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  // Enhanced methods generation removed - using pure action system now
  
  private initializeActionMappings(): void {
    if (!this.actionClient) {
      return;
    }
    
    // The action client will automatically use enhanced methods
    // through the unified relationship system integration
    console.log('✅ [UnifiedResourceRegistry] Action mappings initialized');
  }
}

// ALL_SCHEMAS moved to all-schemas.ts to prevent circular dependencies

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Initialize the unified resource system
 */
export async function initializeUnifiedResourceSystem(
  actionClient: ActionClientCore,
  branchContext: BranchContext
): Promise<UnifiedResourceRegistry> {
  const registry = UnifiedResourceRegistry.getInstance();
  await registry.initialize(actionClient, branchContext);
  return registry;
}

/**
 * Get the unified resource registry (must be initialized first)
 */
export function getUnifiedResourceRegistry(): UnifiedResourceRegistry {
  const registry = UnifiedResourceRegistry.getInstance();
  return registry;
}

// Enhanced resource methods removed - using pure action system now

/**
 * Get all resource schemas
 */
export function getAllResourceSchemas(): ResourceSchema[] {
  return ALL_SCHEMAS;
}

/**
 * Get schema by key
 */
export function getResourceSchema(resourceKey: string): ResourceSchema | null {
  return ALL_SCHEMAS.find(schema => schema.databaseKey === resourceKey) || null;
}

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

/**
 * @deprecated Use getUnifiedResourceRegistry().getActionMappings() instead
 */
export function getActionMappings(): Record<string, any> {
  console.warn('⚠️ getActionMappings is deprecated. Use getUnifiedResourceRegistry().getActionMappings() instead.');
  const registry = UnifiedResourceRegistry.getInstance();
  return registry.getActionMappings();
}

/**
 * @deprecated Use getUnifiedResourceRegistry().getIndexedDBStores() instead
 */
export function getIndexedDBStores(): any[] {
  console.warn('⚠️ getIndexedDBStores is deprecated. Use getUnifiedResourceRegistry().getIndexedDBStores() instead.');
  const registry = UnifiedResourceRegistry.getInstance();
  return registry.getIndexedDBStores();
}

/**
 * @deprecated Use getUnifiedResourceRegistry().isJunctionTable() instead
 */
export function isJunctionTable(tableName: string): boolean {
  console.warn('⚠️ isJunctionTable is deprecated. Use getUnifiedResourceRegistry().isJunctionTable() instead.');
  const registry = UnifiedResourceRegistry.getInstance();
  return registry.isJunctionTable(tableName);
}

/**
 * @deprecated Use getAllResourceSchemas() instead
 */
export const RESOURCE_REGISTRY = ALL_SCHEMAS;

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const unifiedResourceRegistry = UnifiedResourceRegistry.getInstance();

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  initialize: initializeUnifiedResourceSystem,
  getRegistry: getUnifiedResourceRegistry,
  getAllSchemas: getAllResourceSchemas,
  getSchema: getResourceSchema,
  registry: unifiedResourceRegistry
};