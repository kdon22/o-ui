/**
 * Resource System - Unified System Entry Point
 * 
 * GOLD STANDARD: Complete resource management with pure action system
 * - Auto-generated enhanced methods for all resources
 * - Junction tables handled through relationship definitions
 * - <50ms performance with IndexedDB-first strategy
 * - Complete elimination of legacy patterns
 */

// ============================================================================
// UNIFIED RESOURCE SYSTEM (RECOMMENDED)
// ============================================================================

export {
  UnifiedResourceRegistry,
  unifiedResourceRegistry,
  initializeUnifiedResourceSystem,
  getUnifiedResourceRegistry,
  getAllResourceSchemas,
  getResourceSchema
} from './unified-resource-registry';

export { ALL_SCHEMAS, SCHEMA_RESOURCES, JUNCTION_SCHEMAS } from './all-schemas';

// ============================================================================
// LEGACY COMPATIBILITY (DEPRECATED)
// ============================================================================

/**
 * @deprecated Use getUnifiedResourceRegistry().getActionMappings() instead
 */
export function getActionMappings(): Record<string, any> {
  console.warn('⚠️ getActionMappings is deprecated. Use getUnifiedResourceRegistry().getActionMappings() instead.');
  const { getUnifiedResourceRegistry } = require('./unified-resource-registry');
  const registry = getUnifiedResourceRegistry();
  return registry.getActionMappings();
}

/**
 * @deprecated Use getUnifiedResourceRegistry().getIndexedDBStores() instead
 */
export function getIndexedDBStores(): any[] {
  console.warn('⚠️ getIndexedDBStores is deprecated. Use getUnifiedResourceRegistry().getIndexedDBStores() instead.');
  const { getUnifiedResourceRegistry } = require('./unified-resource-registry');
  const registry = getUnifiedResourceRegistry();
  return registry.getIndexedDBStores();
}

/**
 * @deprecated Use getUnifiedResourceRegistry().isJunctionTable() instead
 */
export function isJunctionTable(tableName: string): boolean {
  console.warn('⚠️ isJunctionTable is deprecated. Use getUnifiedResourceRegistry().isJunctionTable() instead.');
  const { getUnifiedResourceRegistry } = require('./unified-resource-registry');
  const registry = getUnifiedResourceRegistry();
  return registry.isJunctionTable(tableName);
}

/**
 * @deprecated Use getAllResourceSchemas() instead
 */
export const RESOURCE_REGISTRY = [];

// getAllResourceSchemas is now exported directly from unified-resource-registry (line 21)
// Legacy function removed to prevent duplicate export conflicts

// ============================================================================
// SCHEMA EXPORTS (MAINTAINED FOR COMPATIBILITY)
// ============================================================================

export type { 
  ResourceSchema, 
  RelationshipConfig,
  ActionRequest, 
  ActionResponse 
} from './schemas';

// ============================================================================
// AUTO-VALUE SYSTEM
// ============================================================================

export {
  AutoValueService,
  generateAutoValues,
  validateAutoValueFields,
  getSchemaAutoValueInfo
} from './auto-value-service';

export {
  autoValueGenerators,
  hasGenerator,
  getGenerator,
  registerGenerator,
  getAvailableSources
} from './auto-value-generators';

export type {
  AutoValueContext,
  AutoValueSource,
  AutoValueField,
  AutoValueResult,
  AutoValueGenerator,
  AutoValueGeneratorRegistry,
  NodeHierarchyData,
  ShortIdOptions
} from './auto-value-types';

// ============================================================================
// JUNCTION SYSTEM (DEPRECATED - NOW HANDLED THROUGH RELATIONSHIPS)
// ============================================================================

// Junction table functionality has been migrated to auto-discovery from entity schema relationships
// These deprecated functions have been removed in favor of the unified auto-discovery approach

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migrate from legacy resource registry to unified system
 */
export async function migrateToUnifiedResourceSystem(
  tenantId: string,
  branchContext: any
) {
  const { initializeUnifiedResourceSystem } = await import('./unified-resource-registry');
  const { createAndInitializeUnifiedActionClient } = await import('@/lib/action-client/unified-action-client');
  
  const actionClient = await createAndInitializeUnifiedActionClient(tenantId, branchContext);
  return await initializeUnifiedResourceSystem(actionClient, branchContext);
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Quick Start Guide
 * 
 * ## 1. Initialize Unified Resource System
 * ```typescript
 * import { initializeUnifiedResourceSystem } from '@/lib/resource-system';
 * 
 * const registry = await initializeUnifiedResourceSystem(actionClient, branchContext);
 * ```
 * 
 * ## 2. Get Enhanced Resource Methods
 * ```typescript
 * import { getResourceEnhanced } from '@/lib/resource-system';
 * 
 * const nodeEnhanced = getResourceEnhanced('node');
 * const nodes = await nodeEnhanced.list({ parentId: 'root' });
 * const processes = await nodeEnhanced.relationships.processes.list('node-123');
 * ```
 * 
 * ## 3. Use Relationship Operations
 * ```typescript
 * // Connect relationships
 * await nodeEnhanced.relationships.processes.connect('node-123', ['process-456']);
 * 
 * // Complex business operations
 * const effectiveRules = await nodeEnhanced.complex.getEffectiveRules('node-123');
 * ```
 * 
 * For complete documentation, see: ../../COMPLETE_UNIFIED_MIGRATION_GUIDE.md
 */

// ============================================================================
// DEFAULT EXPORT - UNIFIED SYSTEM
// ============================================================================

import unifiedResourceSystem from './unified-resource-registry';
export default unifiedResourceSystem;