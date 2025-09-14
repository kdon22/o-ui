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
  
  display: {
    title: 'User',
    description: 'User profiles and preferences',
    icon: 'User'
  },
  
  fields: [
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
    {
      key: 'codeEditorPreferences', 
      label: 'Editor Preferences',
      type: 'json',
      required: false,
      defaultValue: {
        theme: 'vs',
        fontSize: 14,
        fontFamily: 'var(--font-mono-fira), "Fira Code", "SF Mono", Monaco, Consolas, monospace',
        wordWrap: false,
        minimap: true,
        lineNumbers: 'on'
      },
      description: 'Monaco editor theme, font size, and display preferences',
      form: {
        row: 1,
        width: 'full'
      },
      table: {
        width: 'xl',
        showInTable: false
      }
    },
    {
      key: 'personalPreferences',
      label: 'Personal Preferences', 
      type: 'json',
      required: false,
      defaultValue: {},
      description: 'Navigation tracking and personal app preferences',
      form: {
        row: 2,
        width: 'full',
        showInForm: false  // Hidden - managed automatically
      },
      table: {
        width: 'xl',
        showInTable: false
      }
    }
  ],
  
  search: {
    fields: ['name', 'email'],
    placeholder: 'Search users...'
  },
  
  actions: {
    update: true,  // ✅ This is what we need!
    optimistic: true // ✅ Instant UI updates for preferences
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
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
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
  
  // ✅ JUNCTION: IndexedDB compound key configuration
  indexedDBKey: (record: UserGroup) => `${record.userId}:${record.groupId}`,
  
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
  
  // ✅ JUNCTION: IndexedDB compound key configuration
  indexedDBKey: (record: UserTenant) => `${record.userId}:${record.tenantId}`,
  
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
  
  // ✅ JUNCTION: IndexedDB compound key configuration
  indexedDBKey: (record: GroupPermission) => `${record.groupId}:${record.permissionId}`,
  
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