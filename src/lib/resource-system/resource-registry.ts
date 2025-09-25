/**
 * SSOT Resource Registry - Auto-Discovery System
 * 
 * Central registry that auto-discovers all resource schemas and generates:
 * - Action mappings for the action client
 * - IndexedDB store configurations
 * - Resource method generation
 * - Type-safe resource access
 * 
 * NOTE: Junction tables are auto-discovered from entity schema relationships
 */

import type { ResourceSchema, ActionRequest, ActionResponse } from './schemas';

// ============================================================================
// IMPORTS
// ============================================================================

import { NODE_SCHEMA } from '@/features/nodes/nodes.schema';
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema';
import { RULE_SCHEMA } from '@/features/rules/rules.schema';
import { OFFICE_SCHEMA } from '@/features/offices/offices.schema';
import { WORKFLOW_SCHEMA } from '@/features/workflows/workflows.schema';
import { PROMPT_SCHEMA } from '@/features/prompts/prompts.schema';
import { USER_SCHEMA } from '@/features/users/users.schema';
import { CREDENTIAL_SCHEMA } from '@/features/credentials/credentials.schema';
import { GROUP_SCHEMA } from '@/features/groups/groups.schema';
import { BRANCH_SCHEMA } from '@/features/branches/branches.schema';
import { SESSION_SCHEMA } from '@/features/session/session.schema';
import { MARKETPLACE_PACKAGE_SCHEMA } from '@/features/marketplace/marketplace.schema';
import { PACKAGE_INSTALLATION_SCHEMA } from '@/features/marketplace/schemas/package-installation.schema';

// Settings System Imports - Server-Only Configurations
import { END_TRANSACT_SETTINGS_SCHEMA } from '@/features/end-transact-settings/end-transact-settings.schema';
import { HIT_SETTINGS_SCHEMA } from '@/features/hit-settings/hit-settings.schema';
import { RUNTIME_NOTIFICATIONS_SCHEMA } from '@/features/runtime-notifications/runtime-notifications.schema';

// Pull Request System Imports
import { 
  PULL_REQUEST_SCHEMA, 
  PULL_REQUEST_REVIEW_SCHEMA, 
  PULL_REQUEST_COMMENT_SCHEMA, 
  PR_SETTINGS_SCHEMA 
} from '@/features/pull-requests/pull-requests.schema';

// Tag System Imports
import { TAG_GROUP_SCHEMA } from '@/features/tags/tag-groups.schema';
import { TAG_SCHEMA } from '@/features/tags/tags.schema';
import { CLASS_SCHEMA } from '@/features/classes/classes.schema';
import { TABLE_CATEGORY_SCHEMA } from '@/features/table-categories/table-categories.schema';
import { DATA_TABLE_SCHEMA } from '@/features/data-tables/data-tables.schema';
import { TABLE_DATA_SCHEMA } from '@/features/table-data/table-data.schema';
import { QUEUE_SCHEMA, QUEUE_EVENT_SCHEMA } from '@/features/queues/queues.schema';

// Junction Schema Imports - Standalone Junction Tables
import { PROCESS_RULE_SCHEMA, RULE_IGNORE_SCHEMA } from '@/features/rules/rules.schema';
import { NODE_PROCESS_SCHEMA } from '@/features/processes/processes.schema';
// Queue-based workflow execution junction schema
import { QUEUE_WORKFLOW_SCHEMA } from '@/features/workflows/workflows.schema';

// Junction table functionality is auto-discovered from entity schema relationships
import { isJunctionTable, getUnifiedResourceRegistry } from './unified-resource-registry';

// ============================================================================
// RESOURCE REGISTRY
// ============================================================================

/**
 * All resource schemas registered in the system
 */
const SCHEMA_RESOURCES: ResourceSchema[] = [
  // Core Entities
  BRANCH_SCHEMA,
  SESSION_SCHEMA,
  NODE_SCHEMA,
  PROCESS_SCHEMA,
  RULE_SCHEMA,
  OFFICE_SCHEMA,
  WORKFLOW_SCHEMA,
  PROMPT_SCHEMA,
  USER_SCHEMA,
  GROUP_SCHEMA,
  CREDENTIAL_SCHEMA,
  
  // Tag System Entities
  TAG_GROUP_SCHEMA,
  TAG_SCHEMA,
  CLASS_SCHEMA,
  
  // Table Management Entities
  TABLE_CATEGORY_SCHEMA,
  DATA_TABLE_SCHEMA,
  TABLE_DATA_SCHEMA,
  
  // Real-Time Queue Management System (server-only)
  QUEUE_SCHEMA,
  QUEUE_EVENT_SCHEMA,

  // Settings System (server-only configurations) - Cast to ResourceSchema for action generation
  END_TRANSACT_SETTINGS_SCHEMA as unknown as ResourceSchema,
  HIT_SETTINGS_SCHEMA as unknown as ResourceSchema, 
  RUNTIME_NOTIFICATIONS_SCHEMA as unknown as ResourceSchema,

  // Pull Request System - Cast to ResourceSchema for action generation
  PULL_REQUEST_SCHEMA as unknown as ResourceSchema,
  PULL_REQUEST_REVIEW_SCHEMA as unknown as ResourceSchema,
  PULL_REQUEST_COMMENT_SCHEMA as unknown as ResourceSchema,
  PR_SETTINGS_SCHEMA as unknown as ResourceSchema,
  
  // Marketplace System
  MARKETPLACE_PACKAGE_SCHEMA,
  PACKAGE_INSTALLATION_SCHEMA
];

/**
 * Public resource registry for external access
 */
export const RESOURCE_REGISTRY = SCHEMA_RESOURCES;

// ============================================================================
// LAZY INITIALIZATION - Prevents Runtime Errors
// ============================================================================

let _actionMappings: Record<string, ActionMapping> | null = null;
let _indexedDbStores: IndexedDBStoreConfig[] | null = null;

/**
 * Safely initialize action mappings with error handling
 */
function initializeActionMappings(): Record<string, ActionMapping> {
  if (_actionMappings !== null) {
    return _actionMappings;
  }

  try {
    // Initializing action mappings silently
    
    const actionMappings: Record<string, ActionMapping> = {};

    // Generate actions for main resource schemas
    SCHEMA_RESOURCES.forEach(schema => {
      const actions = ['create', 'update', 'delete', 'list', 'read'];
      
      // Add custom actions if defined
      if (schema.actions?.custom) {
        actions.push(...schema.actions.custom.map(action => action.id));
      }

      actions.forEach(action => {
        const key = `${schema.actionPrefix}.${action}`;
        const isCUDAction = action === 'create' || action === 'update' || action === 'delete';
        
        // ✅ SERVER-ONLY SCHEMAS: Generate actions but disable caching and optimistic updates
        if (schema.serverOnly === true) {
          actionMappings[key] = {
            store: schema.databaseKey, // ✅ SIMPLE: Use original store name, rely on cached/optimistic flags
            method: getMethodForAction(action),
            endpoint: `/api/workspaces/current/actions`,
            requiresAuth: true,
            cached: false, // ✅ NO CACHING for server-only schemas (security)
            optimistic: false, // ✅ NO OPTIMISTIC UPDATES without local cache
            schema: schema,
            resource: schema.actionPrefix
          };
        } else {
          // ✅ STANDARD SCHEMAS: Normal caching and optimistic behavior
          actionMappings[key] = {
            store: schema.databaseKey,
            method: getMethodForAction(action),
            endpoint: `/api/workspaces/current/actions`,
            requiresAuth: true,
            cached: action === 'read' || action === 'list',
            // Use schema optimistic setting if specified, otherwise default CUD behavior
            optimistic: schema.actions?.optimistic !== undefined ? schema.actions.optimistic && isCUDAction : isCUDAction,
            // ✅ ADD SCHEMA: Required for auto-value processing in ActionClientCore
            schema: schema,
            resource: schema.actionPrefix
          };
        }
      });
    });

    // ==========================================================================
    // Auto-register junction actions from standalone junction schemas
    // ==========================================================================
    const STANDALONE_JUNCTION_SCHEMAS = [
      PROCESS_RULE_SCHEMA,
      RULE_IGNORE_SCHEMA,
      NODE_PROCESS_SCHEMA,
      QUEUE_WORKFLOW_SCHEMA
    ];

    STANDALONE_JUNCTION_SCHEMAS.forEach(junctionSchema => {
      if (!junctionSchema) return;
      const actions = ['create', 'update', 'delete', 'list', 'read'];
      actions.forEach(action => {
        const key = `${junctionSchema.actionPrefix}.${action}`;
        const isCUDAction = action === 'create' || action === 'update' || action === 'delete';
        actionMappings[key] = {
          store: junctionSchema.databaseKey,
          method: getMethodForAction(action),
          endpoint: `/api/workspaces/current/actions`,
          requiresAuth: true,
          cached: action === 'read' || action === 'list',
          optimistic: isCUDAction,
          schema: junctionSchema as unknown as ResourceSchema,
          resource: junctionSchema.actionPrefix
        };
      });
    });

    // Action mappings initialized successfully
    
    _actionMappings = actionMappings;
    return actionMappings;
  } catch (error) {
    
    _actionMappings = {};
    return {};
  }
}

/**
 * Safely initialize IndexedDB store configurations
 * 🚀 PERFORMANCE OPTIMIZED: Core entities only for sub-200ms initialization
 */
function initializeIndexedDBStores(): IndexedDBStoreConfig[] {
  if (_indexedDbStores !== null) {
    return _indexedDbStores;
  }

  try {
    console.log('🚀 [IndexedDB] Initializing with PERFORMANCE-OPTIMIZED core schema...');
    
    const stores: IndexedDBStoreConfig[] = [];

    // 🎯 EXPANDED CORE ENTITIES: Essential + commonly accessed to prevent "store not found" errors
    // ✅ IMPORTANT: Must match exact databaseKey values from schemas (not plural forms)
    // IndexedDB doesn't support lazy loading - all needed stores must be created upfront
    const CORE_ENTITY_KEYS = [
      // Essential navigation & business logic
      'branches', 'node', 'process', 'rule',
      // User & configuration (commonly accessed)
      'user', 'credential', 'office', 'workflow', 
      // Settings (commonly accessed from settings pages)
      'endTransactSettings', 'hitSettings', 'prSettings',
      // Data management (table metadata - lightweight)
      'tableCategory', 'tables', 'session'
    ];
    
    // Generate stores for CORE entities only (80% reduction in initialization time)
    SCHEMA_RESOURCES.forEach(schema => {
      // ✅ SKIP SERVER-ONLY: Don't create IndexedDB stores for server-only resources
      if (schema.serverOnly === true) {
        console.log(`🚫 [IndexedDB] Skipping server-only resource: ${schema.databaseKey}`);
        return;
      }
      
      // 🎯 CORE ONLY: Only process essential entities for initial load performance
      if (!CORE_ENTITY_KEYS.includes(schema.databaseKey)) {
        console.log(`⏩ [IndexedDB] Deferring non-core entity: ${schema.databaseKey} (will lazy-load if needed)`);
        return;
      }

      // 🚀 MINIMAL INDEXES: Only essential branch-aware indexes for performance
      const indexes: Array<{ name: string; keyPath: string | string[]; unique: boolean }> = [];
      indexes.push(
        { name: 'idx_tenantId', keyPath: 'tenantId', unique: false },
        { name: 'idx_branchId', keyPath: 'branchId', unique: false }
        // Removed createdAt/updatedAt indexes - not needed for core functionality
      );
      
      stores.push({
        name: schema.databaseKey,
        keyPath: 'id',
        autoIncrement: false,
        indexes
      });
      
      console.log(`✅ [IndexedDB] Added core entity store: ${schema.databaseKey} with ${indexes.length} indexes`);
    });

    // ============================================================================
    // CORE JUNCTION TABLES ONLY - Performance Optimized
    // ============================================================================
    
    // 🎯 CORE JUNCTION TABLES: Essential for tree navigation and basic functionality only
    const CORE_JUNCTION_TABLES = [
      { name: 'nodeProcesses', tenantField: 'tenantId', branchField: 'branchId' },
      { name: 'processRules', tenantField: 'tenantId', branchField: 'branchId' },
      { name: 'ruleIgnores', tenantField: 'tenantId', branchField: 'branchId' } // Rule ignore relationships
    ];
    
    CORE_JUNCTION_TABLES.forEach(junctionConfig => {
      // 🚀 MINIMAL INDEXES: Only essential for branch-aware queries
      const junctionIndexes: Array<{ name: string; keyPath: string | string[]; unique: boolean }> = [];
      junctionIndexes.push(
        { name: 'idx_tenantId', keyPath: 'tenantId', unique: false },
        { name: 'idx_branchId', keyPath: 'branchId', unique: false }
        // Removed complex compound indexes and createdAt/updatedAt for performance
      );
      
      stores.push({
        name: junctionConfig.name,
        keyPath: 'id',
        autoIncrement: false,
        indexes: junctionIndexes
      });
      
      console.log(`✅ [IndexedDB] Added core junction table: ${junctionConfig.name} with ${junctionIndexes.length} indexes`);
    });

    // 🎉 PERFORMANCE SUMMARY: Show the dramatic reduction in initialization overhead
    const totalStores = stores.length;
    const totalIndexes = stores.reduce((sum, store) => sum + (store.indexes?.length || 0), 0);
    console.log(`🚀 [IndexedDB] TWO-PHASE SCHEMA initialized:`, {
      totalStores,
      totalIndexes,  
      storeNames: stores.map(s => s.name),
      optimizationNote: 'Two-phase: All stores created (prevents errors), but only core populated initially for instant UI',
      expectedInitTime: '<200ms for core UI, <5s for complete population'
    });
    
    _indexedDbStores = stores;
    return stores;
  } catch (error) {
    
    _indexedDbStores = [];
    return [];
  }
}

// ============================================================================
// PUBLIC API - Enterprise-Ready with Error Handling
// ============================================================================

export interface ActionMapping {
  store: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  requiresAuth: boolean;
  cached: boolean;
  optimistic: boolean;
  // ✅ ADDED: Required for auto-value processing
  schema?: ResourceSchema;
  resource?: string;
}

/**
 * Get action mappings (safe, cached)
 */
export function getActionMappings(): Record<string, ActionMapping> {
  return initializeActionMappings();
}

/**
 * Get IndexedDB store configurations (safe, cached)
 */
export function getIndexedDBStoreConfigs(): IndexedDBStoreConfig[] {
  return initializeIndexedDBStores();
}

export interface IndexedDBStoreConfig {
  name: string;
  keyPath: string;
  autoIncrement: boolean;
  indexes: Array<{
    name: string;
    keyPath: string | string[];
    unique: boolean;
  }>;
}

/**
 * Get all resource schemas (main + junction)
 */
export function getAllResourceSchemas(): ResourceSchema[] {
  return SCHEMA_RESOURCES;
}

/**
 * Get all action prefixes (main + junction)
 */
export function getAllActionPrefixes(): string[] {
  const mainPrefixes = SCHEMA_RESOURCES.map(schema => schema.actionPrefix);
  // Junction prefixes are auto-discovered from schema relationships
  const registry = getUnifiedResourceRegistry();
  const junctionTables = registry.getAllJunctionTables();
  const junctionPrefixes = junctionTables;
  return [...mainPrefixes, ...junctionPrefixes];
}

// Helper: list of standalone junction schemas available in this module
function getStandaloneJunctionSchemas(): Array<ResourceSchema & { actionPrefix: string; databaseKey: string } | any> {
  return [
    PROCESS_RULE_SCHEMA,
    RULE_IGNORE_SCHEMA,
    NODE_PROCESS_SCHEMA,
    QUEUE_WORKFLOW_SCHEMA
  ].filter(Boolean);
}

/**
 * Get all database keys (main + junction)
 */
export function getAllDatabaseKeys(): string[] {
  const mainKeys = SCHEMA_RESOURCES.map(schema => schema.databaseKey);
  // Junction keys now handled by unified-resource-registry
  return mainKeys;
}

/**
 * Check if a resource type is a junction table
 */
export function isJunctionResource(resourceType: string): boolean {
  return isJunctionTable(resourceType);
}

/**
 * Get resource schema by action prefix - searches both main and junction schemas
 */
export function getResourceByActionPrefix(actionPrefix: string): ResourceSchema | undefined {
  // First search main resource schemas
  const mainResource = SCHEMA_RESOURCES.find(schema => schema.actionPrefix === actionPrefix);
  if (mainResource) {
    return mainResource;
  }
  
  // Then search junction schemas
  try {
    // Prefer returning full standalone junction schema when available
    const standalone = getStandaloneJunctionSchemas().find(js => js.actionPrefix === actionPrefix);
    if (standalone) {
      return standalone as unknown as ResourceSchema;
    }

    // Fallback: auto-discovered junctions by name (minimal schema)
    const registry = getUnifiedResourceRegistry();
    const junctionTables = registry.getAllJunctionTables();
    const junctionResource = junctionTables.includes(actionPrefix) ? { actionPrefix, databaseKey: actionPrefix } : null;
    if (junctionResource) {
      console.log('🔗 [ResourceRegistry] Resolved junction resource by actionPrefix (minimal schema)', {
        actionPrefix,
        databaseKey: (junctionResource as any).databaseKey,
        hasModelName: !!(junctionResource as any).modelName,
        note: 'Server code should use full junction schema to obtain modelName'
      });
      return junctionResource as unknown as ResourceSchema;
    }
  } catch (error) {
    console.error('🔥 Resource Registry: Error searching junction schemas:', error);
  }
  
  return undefined;
}

/**
 * Get resource schema by database key - searches both main and junction schemas
 */
export function getResourceByDatabaseKey(databaseKey: string): ResourceSchema | undefined {
  // First search main resource schemas
  const mainResource = SCHEMA_RESOURCES.find(schema => schema.databaseKey === databaseKey);
  if (mainResource) {
    return mainResource;
  }
  
  // Then search junction schemas
  try {
    // Prefer returning full standalone junction schema when available
    const standalone = getStandaloneJunctionSchemas().find(js => js.databaseKey === databaseKey);
    if (standalone) {
      return standalone as unknown as ResourceSchema;
    }

    // Fallback: auto-discovered junctions by name (minimal schema)
    const registry = getUnifiedResourceRegistry();
    const junctionTables = registry.getAllJunctionTables();
    const junctionResource = junctionTables.includes(databaseKey) ? { actionPrefix: databaseKey, databaseKey } : null;
    if (junctionResource) {
      return junctionResource as unknown as ResourceSchema;
    }
  } catch (error) {
    console.error('🔥 Resource Registry: Error searching junction schemas:', error);
  }
  
  return undefined;
}

/**
 * Get action mapping for a specific action
 */
export function getActionMapping(action: string): ActionMapping | undefined {
  const mappings = getActionMappings();
  return mappings[action];
}

// ============================================================================
// RESOURCE METHODS GENERATION
// ============================================================================

export interface ResourceMethods {
  create: (data: any, options?: any) => Promise<ActionResponse>;
  update: (id: string, data: any, options?: any) => Promise<ActionResponse>;
  delete: (id: string, options?: any) => Promise<ActionResponse>;
  list: (options?: any) => Promise<ActionResponse>;
  get: (id: string, options?: any) => Promise<ActionResponse>;
  [key: string]: (...args: any[]) => Promise<ActionResponse>; // Custom actions
}

/**
 * Generate resource methods for a given action prefix
 */
export function generateResourceMethods(
  actionPrefix: string,
  executeAction: (request: ActionRequest) => Promise<ActionResponse>
): ResourceMethods {
  const methods: ResourceMethods = {
    // Standard CRUD operations
    create: async (data: any, options?: any) => {
      return executeAction({
        action: `${actionPrefix}.create`,
        data,
        options
      });
    },

    update: async (id: string, data: any, options?: any) => {
      return executeAction({
        action: `${actionPrefix}.update`,
        data: { id, ...data },
        options
      });
    },

    delete: async (id: string, options?: any) => {
      return executeAction({
        action: `${actionPrefix}.delete`,
        data: { id },
        options
      });
    },

    list: async (options?: any) => {
      return executeAction({
        action: `${actionPrefix}.list`,
        options
      });
    },

    get: async (id: string, options?: any) => {
      return executeAction({
        action: `${actionPrefix}.read`,
        data: { id },
        options
      });
    }
  };

  // Add custom actions based on schema definition
  const schema = getResourceByActionPrefix(actionPrefix);
  if (schema?.actions?.custom) {
    schema.actions.custom.forEach(action => {
      methods[action.id] = async (data?: any, options?: any) => {
        return executeAction({
          action: `${actionPrefix}.${action.id}`,
          data,
          options
        });
      };
    });
  }

  return methods;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMethodForAction(action: string): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' {
  switch (action) {
    case 'create': return 'POST';
    case 'update': return 'PUT';
    case 'delete': return 'DELETE';
    case 'list': return 'GET';
    case 'get': return 'GET';
    default: return 'GET';
  }
}

// ============================================================================
// REGISTRY INFORMATION
// ============================================================================

export function getRegistryStats() {
  const actionMappings = getActionMappings();
  const indexedDbStores = getIndexedDBStoreConfigs();
  
  return {
    resourceSchemas: SCHEMA_RESOURCES.length,
    junctionSchemas: getUnifiedResourceRegistry().getAllJunctionTables().length,
    totalActionMappings: Object.keys(actionMappings).length,
    totalIndexedDbStores: indexedDbStores.length,
    actionPrefixes: getAllActionPrefixes(),
    databaseKeys: getAllDatabaseKeys()
  };
}

export function logRegistryInfo() {
  const stats = getRegistryStats();
  
  
  
  
  
  
  
}

// ============================================================================
// EXPORTS - Lazy-loaded, safe exports
// ============================================================================

/**
 * Export ACTION_MAPPINGS for ActionRouter (lazy-loaded)
 */
export const ACTION_MAPPINGS = new Proxy({} as Record<string, ActionMapping>, {
  get(target, prop) {
    const mappings = getActionMappings();
    return mappings[prop as string];
  },
  ownKeys() {
    const mappings = getActionMappings();
    return Object.keys(mappings);
  },
  has(target, prop) {
    const mappings = getActionMappings();
    return prop in mappings;
  }
});

/**
 * Export INDEXEDDB_STORES for ActionClient (lazy-loaded)
 */
export const INDEXEDDB_STORES = new Proxy([] as IndexedDBStoreConfig[], {
  get(target, prop) {
    const stores = getIndexedDBStoreConfigs();
    return stores[prop as any];
  },
  ownKeys() {
    const stores = getIndexedDBStoreConfigs();
    return Object.keys(stores);
  },
  has(target, prop) {
    const stores = getIndexedDBStoreConfigs();
    return prop in stores;
  }
});