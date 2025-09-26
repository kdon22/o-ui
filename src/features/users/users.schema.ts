/**
 * User Schema - User Profile & Preferences Management
 * 
 * Handles user profile data, preferences, and settings through the action system.
 * Provides offline-first user preference management with background sync.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas'
import { z } from 'zod'

export const USER_SCHEMA: ResourceSchema = {
  // Resource identity
  databaseKey: 'users',
  modelName: 'User', 
  actionPrefix: 'user',
  
  // Context configuration  
  notHasTenantContext: true, // Users are global, not tenant-specific
  notHasBranchContext: true, // User preferences don't need branching
  notHasAuditFields: true,   // Users don't have updatedBy/version fields
  serverOnly: true,          // ✅ Force server-only for security
  
  display: {
    title: 'User',
    description: 'User profiles and preferences',
    icon: 'User'
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'lg',           // Make form compact - options: 'sm', 'md', 'lg', 'xl', 'full'
    layout: 'compact',     // Layout style
    showDescriptions: true // Show field descriptions
  },
  
  fields: [
    // ============================================================================
    // CORE IDENTITY FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      required: true,
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'sm',
        showInTable: false
      }
    },

    // ============================================================================
    // BASIC PROFILE INFORMATION - PROFILE TAB
    // ============================================================================
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter full name...',
      description: 'Full name of the user',
      tab: 'Profile',
      clickable: true,
      form: {
        row: 1,
        width: 'half',
        order: 1
      },
      table: {
        width: 'md',
        showInTable: true
      },
      validation: [
        { type: 'maxLength', value: 255, message: 'Name cannot exceed 255 characters' }
      ]
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'user@company.com',
      description: 'Email address for the user',
      tab: 'Profile',
      form: {
        row: 1,
        width: 'half',
        order: 2
      },
      table: {
        width: 'lg',
        showInTable: true
      },
      validation: [
        { type: 'email', message: 'Please enter a valid email address' }
      ]
    },
    {
      key: 'groupId',
      label: 'Permission Group',
      type: 'select',
      required: false,
      placeholder: 'Select a group...',
      description: 'User permission group that determines access rights',
      tab: 'Profile',
      form: {
        row: 2,
        width: 'full',
        order: 1
      },
      table: {
        width: 'md',
        showInTable: true
      },
      options: {
        dynamic: {
          resource: 'groups',
          valueField: 'id',
          labelField: 'name',
          displayField: 'description',
          filter: (item: any) => item.isActive === true
        }
      }
    },

    // ============================================================================
    // CODE EDITOR PREFERENCES - EDITOR TAB
    // ============================================================================
    {
      key: 'editorTheme',
      label: 'Editor Theme',
      type: 'select',
      required: false,
      defaultValue: 'vs',
      description: 'Visual theme for the code editor',
      tab: 'Editor',
      form: {
        row: 1,
        width: 'half',
        order: 1
      },
      table: {
        width: 'sm',
        showInTable: false
      },
      options: {
        static: [
          { value: 'vs', label: 'Visual Studio Light' },
          { value: 'vs-dark', label: 'Visual Studio Dark' },
          { value: 'hc-black', label: 'High Contrast Dark' },
          { value: 'hc-light', label: 'High Contrast Light' }
        ]
      }
    },
    {
      key: 'editorFontSize',
      label: 'Font Size',
      type: 'number',
      required: false,
      defaultValue: 14,
      placeholder: '14',
      description: 'Font size in pixels for the code editor',
      tab: 'Editor',
      form: {
        row: 1,
        width: 'half',
        order: 2
      },
      table: {
        width: 'xs',
        showInTable: false
      },
      validation: [
        { type: 'min', value: 8, message: 'Font size must be at least 8px' },
        { type: 'max', value: 32, message: 'Font size cannot exceed 32px' }
      ]
    },
    {
      key: 'editorFontFamily',
      label: 'Font Family',
      type: 'select',
      required: false,
      defaultValue: 'var(--font-mono-fira), "Fira Code", "SF Mono", Monaco, Consolas, monospace',
      description: 'Font family for the code editor',
      tab: 'Editor',
      form: {
        row: 2,
        width: 'full'
      },
      table: {
        width: 'lg',
        showInTable: false
      },
      options: {
        static: [
          { value: 'var(--font-mono-fira), "Fira Code", "SF Mono", Monaco, Consolas, monospace', label: 'Fira Code (Default)' },
          { value: '"SF Mono", Monaco, Consolas, monospace', label: 'SF Mono' },
          { value: 'Monaco, Consolas, monospace', label: 'Monaco' },
          { value: 'Consolas, monospace', label: 'Consolas' },
          { value: '"Courier New", monospace', label: 'Courier New' }
        ]
      }
    },
    {
      key: 'editorWordWrap',
      label: 'Word Wrap',
      type: 'switch',
      required: false,
      defaultValue: false,
      description: 'Enable word wrapping in the editor',
      tab: 'Editor',
      form: {
        row: 3,
        width: 'half',
        order: 1
      },
      table: {
        width: 'xs',
        showInTable: false
      }
    },
    {
      key: 'editorMinimap',
      label: 'Show Minimap',
      type: 'switch',
      required: false,
      defaultValue: true,
      description: 'Show the code minimap on the right side',
      tab: 'Editor',
      form: {
        row: 3,
        width: 'half',
        order: 2
      },
      table: {
        width: 'xs',
        showInTable: false
      }
    },
    {
      key: 'editorLineNumbers',
      label: 'Line Numbers',
      type: 'select',
      required: false,
      defaultValue: 'on',
      description: 'Display line numbers in the editor',
      tab: 'Editor',
      form: {
        row: 4,
        width: 'half',
        order: 1
      },
      table: {
        width: 'sm',
        showInTable: false
      },
      options: {
        static: [
          { value: 'on', label: 'Show Line Numbers' },
          { value: 'off', label: 'Hide Line Numbers' },
          { value: 'relative', label: 'Relative Line Numbers' }
        ]
      }
    },
    {
      key: 'editorTabSize',
      label: 'Tab Size',
      type: 'number',
      required: false,
      defaultValue: 4,
      placeholder: '4',
      description: 'Number of spaces for indentation',
      tab: 'Editor',
      form: {
        row: 4,
        width: 'half',
        order: 2
      },
      table: {
        width: 'xs',
        showInTable: false
      },
      validation: [
        { type: 'min', value: 1, message: 'Tab size must be at least 1' },
        { type: 'max', value: 8, message: 'Tab size cannot exceed 8' }
      ]
    },

    // ============================================================================
    // PERSONAL PREFERENCES - PERSONAL TAB
    // ============================================================================
    {
      key: 'defaultView',
      label: 'Default View',
      type: 'select',
      required: false,
      defaultValue: 'dashboard',
      description: 'Default page to show when logging in',
      tab: 'Personal',
      form: {
        row: 1,
        width: 'half',
        order: 1
      },
      table: {
        width: 'sm',
        showInTable: false
      },
      options: {
        static: [
          { value: 'dashboard', label: 'Dashboard' },
          { value: 'nodes', label: 'Node Tree' },
          { value: 'rules', label: 'Rules' },
          { value: 'workflows', label: 'Workflows' },
          { value: 'last-visited', label: 'Last Visited Page' }
        ]
      }
    },
    {
      key: 'tablePageSize',
      label: 'Table Page Size',
      type: 'select',
      required: false,
      defaultValue: 25,
      description: 'Default number of items per page in tables',
      tab: 'Personal',
      form: {
        row: 1,
        width: 'half',
        order: 2
      },
      table: {
        width: 'xs',
        showInTable: false
      },
      options: {
        static: [
          { value: 10, label: '10 items' },
          { value: 25, label: '25 items' },
          { value: 50, label: '50 items' },
          { value: 100, label: '100 items' }
        ]
      }
    },
    {
      key: 'enableNotifications',
      label: 'Enable Notifications',
      type: 'switch',
      required: false,
      defaultValue: true,
      description: 'Receive browser notifications for important events',
      tab: 'Personal',
      form: {
        row: 2,
        width: 'half',
        order: 1
      },
      table: {
        width: 'xs',
        showInTable: false
      }
    },
    {
      key: 'enableSounds',
      label: 'Enable Sounds',
      type: 'switch',
      required: false,
      defaultValue: false,
      description: 'Play sounds for notifications and alerts',
      tab: 'Personal',
      form: {
        row: 2,
        width: 'half',
        order: 2
      },
      table: {
        width: 'xs',
        showInTable: false
      }
    },
    {
      key: 'autoSaveInterval',
      label: 'Auto-save Interval',
      type: 'select',
      required: false,
      defaultValue: 30,
      description: 'How often to auto-save work (in seconds)',
      tab: 'Personal',
      form: {
        row: 3,
        width: 'half',
        order: 1
      },
      table: {
        width: 'sm',
        showInTable: false
      },
      options: {
        static: [
          { value: 10, label: 'Every 10 seconds' },
          { value: 30, label: 'Every 30 seconds' },
          { value: 60, label: 'Every minute' },
          { value: 300, label: 'Every 5 minutes' },
          { value: 0, label: 'Disabled' }
        ]
      }
    },
    {
      key: 'compactMode',
      label: 'Compact Mode',
      type: 'switch',
      required: false,
      defaultValue: false,
      description: 'Use compact layouts to show more information',
      tab: 'Personal',
      form: {
        row: 3,
        width: 'half',
        order: 2
      },
      table: {
        width: 'xs',
        showInTable: false
      }
    }
  ],
  
  search: {
    fields: ['name', 'email'],
    placeholder: 'Search users...'
  },
  
  actions: {
    update: true,  // ✅ Allow user preference updates
    optimistic: false // ❌ Server-only resources can't be optimistic
  },
  
  mobile: {
    cardFormat: 'compact',
    primaryField: 'name',
    secondaryFields: ['email'],
    showSearch: false,
    showFilters: false,
    fabPosition: 'bottom-right'
  },
  
  desktop: {
    sortField: 'name',
    sortOrder: 'asc'
  }

  // ❌ No IndexedDB config - server-only resource
}

// ============================================================================
// JUNCTION SCHEMAS: USER RELATIONSHIPS
// ============================================================================

/**
 * UserGroup Junction Schema - Merged from user-group.schema.ts
 * Handles the many-to-many relationship between users and groups
 */
export const UserGroupSchema = z.object({
  userId: z.string(),
  groupId: z.string(),
  assignedAt: z.string(),
});

export type UserGroup = z.infer<typeof UserGroupSchema>;

export const USER_GROUP_SCHEMA = {
  databaseKey: 'userGroups', // ✅ Standard: user + groups → userGroups
  modelName: 'UserGroup',
  actionPrefix: 'userGroups',
  schema: UserGroupSchema,
  relations: ['user', 'group'],
  primaryKey: ['userId', 'groupId'],
  displayFields: ['userId', 'groupId'],
  searchFields: ['userId', 'groupId'],
  orderBy: [{ assignedAt: 'desc' }],
  // Metadata for schema-driven index generation (only mark exceptions)
  notHasTenantContext: true,
  notHasAuditFields: true,
  serverOnly: true, // ✅ Security: User-group assignments are server-only
  
  // ❌ No IndexedDB config - server-only resource
  
  // GOLD STANDARD: Junction field mapping configuration
  fieldMappings: {
    userId: { type: 'relation', target: 'user', targetField: 'id' },
    groupId: { type: 'relation', target: 'group', targetField: 'id' },
    // Scalar fields (kept as-is in Prisma data)
    assignedAt: { type: 'scalar' }
  },

  // ============================================================================
  // JUNCTION AUTO-CREATION CONFIGURATION
  // ============================================================================
  junctionConfig: {
    // When creating a user, check if we should auto-create UserGroup junction
    autoCreateOnParentCreate: true,
    
    // Navigation context detection - if these fields are present, auto-create junction
    navigationContext: {
      groupId: 'string', // If groupId is provided in user creation, create UserGroup
      assignedAt: 'string' // When the user was assigned to group
    },
    
    // Default values for junction creation
    defaults: {
      assignedAt: () => new Date().toISOString()
    }
  }
} as const;

/**
 * UserTenant Junction Schema - Merged from user-tenant.schema.ts
 * Handles the many-to-many relationship between users and tenants
 */
export const UserTenantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  rootNodeId: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserTenant = z.infer<typeof UserTenantSchema>;

export const USER_TENANT_SCHEMA = {
  databaseKey: 'userTenants', // ✅ Standard: user + tenants → userTenants
  modelName: 'UserTenant',
  actionPrefix: 'userTenants',
  schema: UserTenantSchema,
  relations: ['rootNode', 'tenant', 'user'],
  primaryKey: ['id'],
  displayFields: ['userId', 'tenantId'],
  searchFields: ['userId', 'tenantId'],
  orderBy: [{ createdAt: 'desc' }],
  // Metadata for schema-driven index generation (only mark exceptions)
  notHasTenantContext: true,
  serverOnly: true, // ✅ Security: User-tenant relationships are server-only
  
  // ❌ No IndexedDB config - server-only resource
  
  // GOLD STANDARD: Junction field mapping configuration
  fieldMappings: {
    userId: { type: 'relation', target: 'user', targetField: 'id' },
    tenantId: { type: 'relation', target: 'tenant', targetField: 'id' },
    rootNodeId: { type: 'relation', target: 'rootNode', targetField: 'id' },
    // Scalar fields (kept as-is in Prisma data)
    id: { type: 'scalar' },
    isDefault: { type: 'scalar' },
    createdAt: { type: 'scalar' },
    updatedAt: { type: 'scalar' }
  },

  // ============================================================================
  // JUNCTION AUTO-CREATION CONFIGURATION
  // ============================================================================
  junctionConfig: {
    // When creating a user, check if we should auto-create UserTenant junction
    autoCreateOnParentCreate: true,
    
    // Navigation context detection - if these fields are present, auto-create junction
    navigationContext: {
      tenantId: 'string', // If tenantId is provided in user creation, create UserTenant
      rootNodeId: 'string' // Optional: root node for the user in this tenant
    },
    
    // Default values for junction creation
    defaults: {
      isDefault: false
    }
  }
} as const;

/**
 * GroupPermission Junction Schema - Merged from group-permission.schema.ts
 * Handles the many-to-many relationship between groups and permissions
 */
export const GroupPermissionSchema = z.object({
  groupId: z.string(),
  permissionId: z.string(),
  assignedAt: z.string(),
});

export type GroupPermission = z.infer<typeof GroupPermissionSchema>;

export const GROUP_PERMISSION_SCHEMA = {
  databaseKey: 'groupPermissions', // ✅ Standard: group + permissions → groupPermissions
  modelName: 'GroupPermission',
  actionPrefix: 'groupPermissions',
  schema: GroupPermissionSchema,
  relations: ['group', 'permission'],
  primaryKey: ['groupId', 'permissionId'],
  displayFields: ['groupId', 'permissionId'],
  searchFields: ['groupId', 'permissionId'],
  orderBy: [{ assignedAt: 'desc' }],
  // Metadata for schema-driven index generation (only mark exceptions)
  notHasTenantContext: true,
  notHasAuditFields: true,
  serverOnly: true, // ✅ Security: Group permissions are server-only
  
  // ❌ No IndexedDB config - server-only resource
  
  // GOLD STANDARD: Junction field mapping configuration
  fieldMappings: {
    groupId: { type: 'relation', target: 'group', targetField: 'id' },
    permissionId: { type: 'relation', target: 'permission', targetField: 'id' },
    // Scalar fields (kept as-is in Prisma data)
    assignedAt: { type: 'scalar' }
  },

  // ============================================================================
  // JUNCTION AUTO-CREATION CONFIGURATION
  // ============================================================================
  junctionConfig: {
    // When creating a group, check if we should auto-create GroupPermission junction
    autoCreateOnParentCreate: true,
    
    // Navigation context detection - if these fields are present, auto-create junction
    navigationContext: {
      permissionId: 'string', // If permissionId is provided in group creation, create GroupPermission
      assignedAt: 'string' // When the permission was assigned to group
    },
    
    // Default values for junction creation
    defaults: {
      assignedAt: () => new Date().toISOString()
    }
  }
} as const; 