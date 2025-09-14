/**
 * Auto-Generated Components - Unified System Entry Point
 * 
 * GOLD STANDARD: Schema-driven components with unified relationship engine
 * - UnifiedAutoTree replaces 1,000+ lines of legacy TreeNavigation
 * - Enhanced performance with <50ms loading
 * - Relationship operations built-in
 * - Mobile-first responsive design
 */

// ============================================================================
// UNIFIED AUTO-GENERATED COMPONENTS
// ============================================================================

export {
  UnifiedAutoTree,
  type TreeNode,
  type UnifiedAutoTreeProps,
  type TreeState
} from './unified-auto-tree';

// ============================================================================
// COMPONENT EXPORTS (TO BE MIGRATED)
// ============================================================================

// Note: These components will be migrated to use the unified system
// For now, they maintain their existing interfaces

// Auto-Tree (legacy - use UnifiedAutoTree instead)
export { default as AutoTree } from './tree';

// Auto-DataTable (Airtable-like dynamic tables)
export { AutoDataTable } from './datatable';

// Auto-Table (to be unified)
export { default as AutoTable } from './table';

// Auto-Form (to be unified)
export { default as AutoForm } from './form';

// Auto-Modal (to be unified)
export { default as AutoModal } from './modal';

// Code Helper (specialized component)
export { default as CodeHelper } from './code-helper';

// Workspace Components (dynamic categories & tables)
export {
  WorkspaceSidebar,
  CategoryFolder,
  TableItem
} from './workspace';

// DataTable Components (Airtable-like grid)
export {
  AutoDataTable
} from './datatable';

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Migration helper for component upgrades
 */
export class ComponentMigrationHelper {
  
  /**
   * Convert legacy tree props to unified tree props
   */
  static convertLegacyTreeProps(legacyProps: any): any {
    return {
      // Map legacy props to unified props
      actionClient: legacyProps.actionClient,
      branchContext: legacyProps.branchContext,
      rootNodeId: legacyProps.rootId,
      selectedNodeId: legacyProps.selectedId,
      onNodeSelect: legacyProps.onSelect,
      onNodeExpand: legacyProps.onExpand,
      onNodeCollapse: legacyProps.onCollapse,
      showRelationships: legacyProps.showRelationships ?? true,
      showBadges: legacyProps.showBadges ?? true,
      enableContextMenu: legacyProps.enableContextMenu ?? true,
      className: legacyProps.className || ''
    };
  }
  
  /**
   * Generate migration checklist for components
   */
  static generateComponentMigrationChecklist(): string[] {
    return [
      '✅ UnifiedAutoTree - Migrated and ready',
      '🔄 AutoTable - Needs migration to unified system',
      '🔄 AutoForm - Needs migration to unified system', 
      '🔄 AutoModal - Needs migration to unified system',
      '✅ CodeHelper - Specialized component, no migration needed'
    ];
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Component Usage Guide
 * 
 * ## 1. Use Unified Auto-Tree (Recommended)
 * ```typescript
 * import { UnifiedAutoTree } from '@/components/auto-generated';
 * 
 * function NavigationPanel() {
 *   return (
 *     <UnifiedAutoTree
 *       actionClient={actionClient}
 *       branchContext={branchContext}
 *       showRelationships={true}
 *       showBadges={true}
 *       enableContextMenu={true}
 *       onNodeSelect={(node) => console.log('Selected:', node)}
 *     />
 *   );
 * }
 * ```
 * 
 * ## 2. Migrate from Legacy Tree
 * ```typescript
 * // ❌ OLD (Legacy)
 * import { AutoTree } from '@/components/auto-generated';
 * 
 * <AutoTree
 *   tenantId={tenantId}
 *   rootId="root"
 *   onSelect={handleSelect}
 * />
 * 
 * // ✅ NEW (Unified)
 * import { UnifiedAutoTree } from '@/components/auto-generated';
 * 
 * <UnifiedAutoTree
 *   actionClient={actionClient}
 *   branchContext={branchContext}
 *   rootNodeId="root"
 *   onNodeSelect={handleSelect}
 *   showRelationships={true}
 *   showBadges={true}
 * />
 * ```
 * 
 * ## 3. Performance Benefits
 * - <50ms tree loading with IndexedDB cache
 * - Relationship data displayed with badges
 * - Context menu with complex operations
 * - Mobile-first responsive design
 * 
 * For complete documentation, see: ../../COMPLETE_UNIFIED_MIGRATION_GUIDE.md
 */

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create unified tree component with default configuration
 */
export function createUnifiedTree(
  actionClient: any,
  branchContext: any,
  options: Partial<any> = {}
) {
  const defaultProps = {
    showRelationships: true,
    showBadges: true,
    enableContextMenu: true,
    ...options
  };
  
  return {
    component: UnifiedAutoTree,
    props: {
      actionClient,
      branchContext,
      ...defaultProps
    }
  };
}

/**
 * Create component configuration for schema-driven rendering
 */
export function createComponentConfig(resourceSchema: any) {
  return {
    tree: {
      component: UnifiedAutoTree,
      supports: ['hierarchical', 'relationships', 'contextMenu']
    },
    table: {
      component: 'AutoTable', // To be unified
      supports: ['sorting', 'filtering', 'pagination']
    },
    form: {
      component: 'AutoForm', // To be unified
      supports: ['validation', 'relationships', 'branching']
    },
    modal: {
      component: 'AutoModal', // To be unified
      supports: ['crud', 'relationships', 'validation']
    }
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Unified components
  UnifiedAutoTree,
  
  // Legacy components (deprecated)
  AutoTree,
  AutoTable,
  AutoForm,
  AutoModal,
  CodeHelper,
  
  // Utilities
  ComponentMigrationHelper,
  createUnifiedTree,
  createComponentConfig
};