/**
 * Branch Schema - Resource Schema for Action System
 * 
 * Defines branch operations for the centralized action system
 * Handles branch switching, creation, and management through ActionClient
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const BRANCH_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'branches',       // IndexedDB store + API endpoints
  modelName: 'Branch',           // Prisma model access
  actionPrefix: 'branches',      // Action naming

  // ============================================================================
  // CONTEXT CONFIGURATION - Branch model doesn't have branchId filtering
  // ============================================================================
  notHasBranchContext: true,     // Disable branch filtering (branches don't have branchId field)

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Branches',
    description: 'Manage workspace branches for collaborative development',
    icon: 'git-branch',
    color: 'blue'
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'md',
    layout: 'compact',
    showDescriptions: true
  },

  // ============================================================================
  // MOBILE-FIRST FIELD CONFIGURATION
  // ============================================================================
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

    // ============================================================================
    // TENANT CONTEXT - HIDDEN FROM FORMS
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

    // ============================================================================
    // USER-VISIBLE FIELDS - ONLY THESE SHOW IN FORM
    // ============================================================================
    {
      key: 'name',
      label: 'Branch Name',
      type: 'text',
      required: true,
      placeholder: 'Enter branch name...',
      description: 'Unique name for this branch (e.g., feature-auth, staging, production)',
      form: {
        row: 1,
        width: 'full',
        order: 1,
        showInForm: true
      },
      table: {
        width: 'lg'
      },
      validation: [
        { type: 'required', message: 'Branch name is required' },
        { type: 'maxLength', value: 100, message: 'Branch name cannot exceed 100 characters' },
        { type: 'pattern', value: '^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]$', message: 'Branch name must contain only letters, numbers, dots, hyphens, and underscores' }
      ]
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
      placeholder: 'Optional description of this branch...',
      description: 'Brief description of what this branch is for',
      form: {
        row: 2,
        width: 'full',
        order: 1,
        showInForm: true
      },
      table: {
        width: 'lg'
      },
      validation: [
        { type: 'maxLength', value: 500, message: 'Description cannot exceed 500 characters' }
      ]
    },

    // ============================================================================
    // BRANCH STATUS FIELDS - SYSTEM MANAGED (NEVER SHOW IN FORMS)
    // ============================================================================
    {
      key: 'isDefault',
      label: 'Default Branch',
      type: 'switch',
      required: true,
      defaultValue: false,
      description: 'Whether this is the default branch for the tenant'
    },
    {
      key: 'isLocked',
      label: 'Locked',
      type: 'switch',
      required: false,
      defaultValue: false,
      description: 'Whether this branch is locked from modifications'
    },
    {
      key: 'lockedById',
      label: 'Locked By',
      type: 'text',
      required: false
    },
    {
      key: 'lockedAt',
      label: 'Locked At',
      type: 'date',
      required: false
    },

    // ============================================================================
    // AUDIT FIELDS - SYSTEM MANAGED (NEVER SHOW IN FORMS)
    // ============================================================================
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date'
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date'
    },
    {
      key: 'createdById',
      label: 'Created By',
      type: 'text',
      autoValue: {
        source: 'session.user.id',
        required: true
      }
    },
    {
      key: 'updatedById',
      label: 'Updated By',
      type: 'text'
    }
  ],

  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: false,
    bulk: false,
    custom: [
      {
        id: 'switch',
        label: 'Switch',
        icon: 'git-branch',
        description: 'Switch to this branch',
        handler: 'switchBranch'
      },
      {
        id: 'merge',
        label: 'Merge',
        icon: 'git-merge',
        description: 'Merge this branch',
        handler: 'mergeBranch'
      },
      {
        id: 'getMergePreview',
        label: 'Get Merge Preview',
        icon: 'eye',
        description: 'Get preview of merge changes',
        handler: 'getMergePreview'
      },
      {
        id: 'compare',
        label: 'Compare',
        icon: 'git-compare',
        description: 'Compare with another branch',
        handler: 'compareBranch'
      },
      {
        id: 'setDefault',
        label: 'Set as Default',
        icon: 'star',
        description: 'Set as default branch',
        handler: 'setDefaultBranch'
      }
    ]
  },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================
  search: {
    fields: ['name', 'description'],
    placeholder: 'Search branches...',
    mobileFilters: true,
    fuzzy: true
  },

  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================
  table: {
    width: 'full',
    bulkSelect: false,
    columnFilter: true,
    sortableColumns: true,
    contextMenu: [
      {
        id: 'switch',
        label: 'Switch to Branch',
        icon: 'git-branch',
        action: 'switchBranch',
        actionType: 'handler'
      },
      {
        id: 'merge',
        label: 'Merge Branch',
        icon: 'git-merge',
        action: 'mergeBranch',
        actionType: 'handler'
      },
      { separator: true, id: 'sep1' },
      {
        id: 'edit',
        label: 'Edit Branch',
        icon: 'edit',
        action: 'edit',
        actionType: 'inline-edit'
      },
      {
        id: 'compare',
        label: 'Compare Branch',
        icon: 'git-compare',
        action: 'compareBranch',
        actionType: 'handler'
      },
      { separator: true, id: 'sep2' },
      {
        id: 'setDefault',
        label: 'Set as Default',
        icon: 'star',
        action: 'setDefaultBranch',
        actionType: 'handler',
        conditions: {
          field: 'isDefault',
          operator: 'equals',
          value: false
        }
      },
      { separator: true, id: 'sep3' },
      {
        id: 'delete',
        label: 'Delete Branch',
        icon: 'trash',
        action: 'delete',
        actionType: 'modal',
        confirmMessage: 'Are you sure you want to delete this branch? This action cannot be undone.',
        className: 'text-red-600',
        conditions: {
          field: 'isDefault',
          operator: 'equals',
          value: false
        }
      }
    ]
  },

  // ============================================================================
  // PERMISSIONS
  // ============================================================================
  permissions: {
    create: 'branch:create',
    update: 'branch:update',
    delete: 'branch:delete',
    view: 'branch:view',
    custom: {
      switch: 'branch:switch',
      merge: 'branch:merge',
      compare: 'branch:compare',
      setDefault: 'branch:setDefault'
    }
  },

  // ============================================================================
  // MOBILE-FIRST LAYOUT
  // ============================================================================
  mobile: {
    cardFormat: 'detailed',
    primaryField: 'name',
    secondaryFields: ['description', 'isDefault', 'updatedAt'],
    showSearch: true,
    showFilters: false,
    fabPosition: 'bottom-right',
    swipeActions: [
      {
        id: 'switch',
        label: 'Switch',
        icon: 'git-branch',
        description: 'Switch to this branch',
        handler: 'switchBranch'
      },
      {
        id: 'merge',
        label: 'Merge',
        icon: 'git-merge',
        description: 'Merge this branch',
        handler: 'mergeBranch'
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: 'edit',
        description: 'Edit this branch',
        handler: 'editBranch'
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'trash',
        description: 'Delete this branch',
        handler: 'deleteBranch'
      }
    ]
  },

  // ============================================================================
  // DESKTOP TABLE CONFIGURATION
  // ============================================================================
  desktop: {
    sortField: 'name',
    sortOrder: 'asc',
    editableField: 'name',
    density: 'normal',
    rowActions: true,
    bulkActions: false
  },

  // ============================================================================
  // HOOKS FOR CUSTOM LOGIC
  // ============================================================================
  hooks: {
    beforeCreate: 'validateBranchName',
    afterCreate: 'initializeBranchData',
    beforeUpdate: 'validateBranchUpdate',
    afterUpdate: 'invalidateBranchCache',
    beforeDelete: 'checkBranchDependencies',
    afterDelete: 'cleanupBranchData'
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Branch = {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  isDefault: boolean;
  isLocked?: boolean;
  lockedById?: string;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
};

export type CreateBranch = Omit<Branch, 'id' | 'createdAt' | 'updatedAt' | 'isDefault' | 'isLocked'>;
export type UpdateBranch = Partial<Omit<Branch, 'id' | 'createdAt' | 'tenantId'>>;