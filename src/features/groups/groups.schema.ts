/**
 * Groups Schema - Factory-Driven Group Management with Permission Templates
 * 
 * Single Source of Truth for:
 * - Group/role management with configurable permission matrices
 * - JSON permissions field using template system (no junction tables needed!)
 * - Mobile-first responsive design
 * - Inline editing capabilities
 * 
 * This schema uses the existing Group model with factory-driven permission templates.
 */

import type { ResourceSchema, FieldSchema } from '@/lib/resource-system/schemas';
import { getPermissionJsonSchema, createDefaultPermissions } from '@/lib/resource-system/permission-templates';

// ============================================================================
// GROUP SCHEMA - SIMPLIFIED WITH JSON PERMISSIONS
// ============================================================================

export const GROUP_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - ACTION SYSTEM CONFIGURATION
  // ============================================================================
  
  // ============================================================================
  // ACTION SYSTEM - REQUIRED FOR AUTO-TABLE
  // ============================================================================
  
  databaseKey: 'groups',          // IndexedDB store name
  modelName: 'Group',             // Prisma model name
  actionPrefix: 'group',          // Action prefix (group.list, group.create, etc.)
  serverOnly: true,               // Groups are server-only (no IndexedDB caching for security)
  
  // ============================================================================
  // FIELD DEFINITIONS - ORGANIZED FOR PERMISSION MANAGEMENT
  // ============================================================================
  // Note: Tabs will be implemented at the component level until schema supports them
  
  fields: [
    // ============================================================================
    // CORE IDENTITY FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'auto.uuid',
        required: true
      }
    },
    {
      key: 'originalGroupId',
      label: 'Original Group ID',
      type: 'text',
      description: 'Reference to the original group for branching'
    },

    // ============================================================================
    // BRANCHING FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'session.user.tenantId',
        required: true
      }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      required: true,
      description: 'Current branch this group belongs to',
      autoValue: {
        source: 'session.user.branchContext.currentBranchId',
        required: true
      }
    },

    // ============================================================================
    // DESCRIPTION TAB FIELDS
    // ============================================================================
    {
      key: 'name',
      label: 'Group Name',
      type: 'text',
      required: true,
      tab: 'Description',
      placeholder: '',
      form: {
        width: '3quarters',
        row: 1
      }
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      tab: 'Description',
      placeholder: '',
      form: {
        width: 'full',
        row: 2
      }
    },

    // ============================================================================
    // PERMISSIONS - SINGLE JSON FIELD WITH MATRIX TEMPLATE
    // ============================================================================
    {
      key: 'permissions',
      label: '',
      type: 'matrix',
      tab: 'Permissions',
      template: 'permission-matrix',
      description: '',
      config: {
        sections: [
          {
            id: 'general',
            label: 'General Rights',
            resources: [
              { key: 'users', label: 'Users' },
              { key: 'groups', label: 'Groups' },
              { key: 'categories', label: 'Categories' },
              { key: 'businessUnits', label: 'Business Units' },
              { key: 'customers', label: 'Customers' },
              { key: 'queueTree', label: 'Queue Tree' },
              { key: 'defaultNode', label: 'Default Node' },
              { key: 'processes', label: 'Processes' },
              { key: 'intersections', label: 'Intersections' }
            ],
            actions: [
              { key: 'view', label: 'View' },
              { key: 'create', label: 'Create' },
              { key: 'modify', label: 'Modify' },
              { key: 'delete', label: 'Delete' }
            ]
          },
          {
            id: 'settings',
            label: 'Setting Rights',
            resources: [
              { key: 'abacusEndTransactionRule', label: 'Abacus End Transaction Rule' },
              { key: 'abacusSimultaneousChangesRule', label: 'Abacus Simultaneous Changes Rule' },
              { key: 'addStartStopRemark', label: 'Add Start/Stop Remark? (Y/N)' },
              { key: 'administratorEmailAddresses', label: 'Administrator Email Address(es)' },
              { key: 'afterQueueStopRoutine', label: 'After Queue Stop Routine' },
              { key: 'agentQueue', label: 'Agent Queue' },
              { key: 'amadeusEndTransactionRule', label: 'Amadeus End Transaction Rule' },
              { key: 'amadeusSimultaneousChangesRule', label: 'Amadeus Simultaneous Changes Rule' },
              { key: 'apolloEndTransactionRule', label: 'Apollo End Transaction Rule' }
            ],
            actions: [
              { key: 'view', label: 'View' },
              { key: 'create', label: 'Create' },
              { key: 'modify', label: 'Modify' },
              { key: 'delete', label: 'Delete' }
            ]
          }
        ]
      },
      defaultValue: {},
      form: {
        width: 'full',
        row: 1
      }
    },

    // ============================================================================
    // AUDIT FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      description: 'Whether this group is currently active',
      defaultValue: true
    },
    {
      key: 'version',
      label: 'Version',
      type: 'number',
      description: 'Current version of this group'
    },
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      description: 'When this group was created'
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date',
      description: 'When this group was last updated'
    },
    {
      key: 'createdById',
      label: 'Created By',
      type: 'text',
      description: 'User who created this group'
    },
    {
      key: 'updatedById',
      label: 'Updated By',
      type: 'text',
      description: 'User who last updated this group'
    }
  ],
  
  // ============================================================================
  // REQUIRED DISPLAY CONFIGURATION
  // ============================================================================
  
  display: {
    title: 'Groups',
    description: 'Manage user groups and role-based permissions',
    icon: 'Shield'
  },
  
  // ============================================================================
  // SEARCH CONFIGURATION - REQUIRED FOR AUTO-TABLE
  // ============================================================================
  search: {
    fields: ['name', 'description', 'type'],
    placeholder: 'Search groups...',
    fuzzy: true
  },
  
  // ============================================================================
  // REQUIRED ACTIONS CONFIGURATION
  // ============================================================================
  
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: false,
    bulk: true,
    optimistic: false, // Groups use server-only operations for security
    serverOnly: true
  },
  
  // ============================================================================
  // REQUIRED MOBILE CONFIGURATION
  // ============================================================================
  
  mobile: {
    cardFormat: 'detailed',
    primaryField: 'name',
    secondaryFields: ['description', 'type'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right'
  },
  
  // ============================================================================
  // REQUIRED DESKTOP CONFIGURATION  
  // ============================================================================
  
  desktop: {
    sortField: 'name',
    sortOrder: 'asc',
    editableField: 'name',
    rowActions: true,
    bulkActions: true,
    density: 'normal'
  },
  
  // ============================================================================
  // FORM CONFIGURATION 
  // ============================================================================
  
  form: {
    width: 'lg',
    layout: 'default',
    showDescriptions: true,
    showRequiredIndicators: true,
    submitButtonText: 'Save Group',
    cancelButtonText: 'Cancel'
  }
} as const;

// Export type for TypeScript usage - Factory-driven permissions
export type GroupResource = {
  id: string;
  name: string;
  description?: string;
  
  // 🏭 FACTORY: Single JSON permissions field with matrix template
  permissions?: Record<string, string[]>; // Single field: { "users": ["view", "create"], "groups": ["view"] }
  
  tenantId: string;
  branchId: string;
  originalGroupId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;
  version: number;
};