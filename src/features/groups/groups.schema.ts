/**
 * Groups Schema - Simple Group Management with JSON Permissions
 * 
 * Single Source of Truth for:
 * - Group/role management with three-tab interface
 * - JSON permissions field (no junction tables needed!)
 * - Mobile-first responsive design
 * - Inline editing capabilities
 * 
 * This schema uses the existing Group model with added permissions JSON field.
 */

import type { ResourceSchema, FieldSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// GROUP SCHEMA - SIMPLIFIED WITH JSON PERMISSIONS
// ============================================================================

export const GROUP_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - ACTION SYSTEM CONFIGURATION
  // ============================================================================
  
  resourceKey: 'group',
  resourceLabel: 'Group',
  resourceLabelPlural: 'Groups',
  
  // ============================================================================
  // ACTION SYSTEM - REQUIRED FOR AUTO-TABLE
  // ============================================================================
  
  databaseKey: 'groups',          // IndexedDB store name
  modelName: 'Group',             // Prisma model name
  actionPrefix: 'group',          // Action prefix (group.list, group.create, etc.)
  primaryKey: 'id',               // Primary key field
  serverOnly: true,               // Groups are server-only (no IndexedDB caching for security)
  
  // ============================================================================
  // THREE-TAB INTERFACE CONFIGURATION
  // ============================================================================
  
  tabs: [
    {
      id: 'description',
      label: 'Description',
      icon: 'FileText',
      isDefault: true
    },
    {
      id: 'general-rights', 
      label: 'General Rights',
      icon: 'Shield'
    },
    {
      id: 'setting-rights',
      label: 'Setting Rights', 
      icon: 'Settings'
    }
  ],
  
  // ============================================================================
  // FIELD DEFINITIONS FOR ALL TABS
  // ============================================================================
  
  fields: [
    // TAB 1: DESCRIPTION
    {
      key: 'name',
      label: 'Group Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Administrators, Editors, Viewers',
      tab: 'description',
      validation: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Describe what this group can do...',
      tab: 'description',
      validation: {
        maxLength: 500
      }
    },
    {
      key: 'type',
      label: 'Group Type',
      type: 'select',
      tab: 'description',
      options: [
        { value: 'admin', label: 'Administrator', description: 'Full system access' },
        { value: 'editor', label: 'Editor', description: 'Can create and modify content' },
        { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
        { value: 'custom', label: 'Custom', description: 'Custom permission set' }
      ]
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'boolean',
      defaultValue: true,
      tab: 'description'
    },
    
    // TAB 2: GENERAL RIGHTS - PERMISSION MATRIX
    {
      key: 'permissions.generalPermissions',
      label: 'General System Permissions',
      type: 'permission-matrix',
      tab: 'general-rights',
      permissions: [
        { resource: 'Users', actions: ['View', 'Create', 'Modify', 'Delete'] },
        { resource: 'Groups', actions: ['View', 'Create', 'Modify', 'Delete'] },
        { resource: 'Categories', actions: ['View', 'Create', 'Modify', 'Delete'] },
        { resource: 'Tags', actions: ['View', 'Create', 'Modify', 'Delete'] },
        { resource: 'Reports', actions: ['View', 'Create', 'Export'] },
        { resource: 'Analytics', actions: ['View', 'Export'] }
      ]
    },
    
    // TAB 3: SETTING RIGHTS - SYSTEM SETTINGS PERMISSIONS  
    {
      key: 'permissions.settingPermissions',
      label: 'System Settings Permissions',
      type: 'permission-matrix',
      tab: 'setting-rights', 
      permissions: [
        { resource: 'System Configuration', actions: ['View', 'Modify'] },
        { resource: 'Security Settings', actions: ['View', 'Modify'] },
        { resource: 'API Access', actions: ['View', 'Create', 'Modify', 'Delete'] },
        { resource: 'Database Settings', actions: ['View', 'Modify'] },
        { resource: 'Backup & Restore', actions: ['View', 'Create', 'Restore'] },
        { resource: 'Audit Logs', actions: ['View', 'Export'] }
      ]
    }
  ],
  
  // ============================================================================
  // AUTO-TABLE CONFIGURATION
  // ============================================================================
  
  displayField: 'name',
  
  // ============================================================================
  // SEARCH CONFIGURATION - REQUIRED FOR AUTO-TABLE
  // ============================================================================
  search: {
    fields: ['name', 'description', 'type'],
    placeholder: 'Search groups...',
    fuzzy: true
  },
  
  tableConfig: {
    defaultSort: [{ field: 'name', direction: 'asc' }],
    rowsPerPage: 10,
    
    // Column definitions for table view
    columns: [
      {
        key: 'name',
        label: 'Group Name',
        sortable: true,
        searchable: true,
        sticky: 'left'
      },
      {
        key: 'type', 
        label: 'Type',
        sortable: true,
        width: 120,
        render: 'badge'
      },
      {
        key: 'description',
        label: 'Description', 
        sortable: false,
        truncate: 60
      },
      {
        key: 'userCount',
        label: 'Users',
        width: 80,
        computed: true // Will be calculated from UserGroup relationships
      },
      {
        key: 'isActive',
        label: 'Status',
        width: 100,
        render: 'status-badge'
      },
      {
        key: 'updatedAt',
        label: 'Last Modified',
        width: 140,
        render: 'relative-date',
        sortable: true
      }
    ]
  },
  
  // ============================================================================
  // FORM CONFIGURATION 
  // ============================================================================
  
  formConfig: {
    layout: 'tabs', // Use tab-based layout
    submitLabel: 'Save Group',
    
    // Validation rules
    validation: {
      'name': {
        required: 'Group name is required',
        minLength: { value: 2, message: 'Name must be at least 2 characters' }
      },
      'type': {
        required: 'Group type is required'
      }
    },
    
    // Default values for new groups
    defaults: {
      isActive: true,
      permissions: {
        generalPermissions: {},
        settingPermissions: {}
      }
    }
  },

  // ============================================================================
  // MOBILE-FIRST RESPONSIVE CONFIG
  // ============================================================================

  mobileConfig: {
    searchPlaceholder: 'Search groups...',
    emptyStateMessage: 'No groups found',
    
    cardView: {
      title: 'name',
      subtitle: 'description',
      badge: 'type',
      status: 'isActive'
    }
  },

  // ============================================================================
  // SYSTEM CONFIGURATION
  // ============================================================================
  
  systemFields: ['id', 'tenantId', 'createdAt', 'updatedAt', 'createdById', 'updatedById', 'version'],
  requiredFields: ['name', 'tenantId'],
  
  // Quick filtering options
  quickFilters: [
    { key: 'active', label: 'Active Groups', filter: { isActive: true } },
    { key: 'admin', label: 'Administrators', filter: { type: 'admin' } },
    { key: 'custom', label: 'Custom Groups', filter: { type: 'custom' } }
  ],
  
  // Auto-generation settings
  enableAutoId: true,
  enableAuditFields: true,
  enableSoftDelete: false, // Using isActive instead
  
  // Performance optimizations
  indexFields: ['name', 'type', 'isActive', 'tenantId'],
  cacheConfig: {
    ttl: 300, // 5 minutes
    tags: ['groups', 'permissions']
  }
} as const;

// Export type for TypeScript usage
export type GroupResource = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  permissions?: {
    generalPermissions?: Record<string, string[]>;
    settingPermissions?: Record<string, string[]>;
  };
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  updatedById?: string;
  version: number;
};