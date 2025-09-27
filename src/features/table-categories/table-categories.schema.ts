/**
 * TableCategory Schema - Table Organization System
 * 
 * Single Source of Truth for:
 * - Table category creation and management
 * - Hierarchical organization of data tables
 * - Branch-aware operations with Copy-on-Write
 * - Mobile-first responsive design
 * - Category-based access control
 * 
 * This schema will auto-generate the table category management system.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import { z } from 'zod';

export const TABLE_CATEGORY_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'tableCategory',    // IndexedDB store + API endpoints
  modelName: 'TableCategory',      // Prisma model access
  actionPrefix: 'tableCategory',   // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Table Categories',
    description: 'Organize tables into categories for better management',
    icon: 'folder',
    color: 'blue'
  },

  // ============================================================================
  // SIMPLIFIED FIELD CONFIGURATION - ESSENTIAL FIELDS ONLY
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
      description: 'Unique identifier - auto-generated UUID',
      autoValue: {
        source: 'auto.uuid',
        required: true
      },
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'sm',
        
      }
    },
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'session.user.tenantId',
        required: true
      },
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'sm',
        
      }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'session.user.branchContext.currentBranchId',
        required: true
      },
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'xs',
        
      }
    },
    {
      key: 'originalTableCategoryId',
      label: 'Original Category ID',
      type: 'text',
      description: 'Reference to the original category for branching',
      computed: true,
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'sm',
        
      }
    },

    // ============================================================================
    // USER INPUT FIELDS - ESSENTIAL FIELDS
    // ============================================================================
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter category name...',
      description: 'The display name for this category',
      form: {
        row: 1,
        width: 'full',
        order: 1
      },
      table: {
        width: 'lg'
      },
      validation: [
        { type: 'required', message: 'Name is required' },
        { type: 'maxLength', value: 100, message: 'Name cannot exceed 100 characters' }
      ]
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional description...',
      description: 'Additional details about this category',
      form: {
        row: 2,
        width: 'full',
        order: 2
      },
      table: {
        width: 'xl',
        
      },
      validation: [
        { type: 'maxLength', value: 500, message: 'Description cannot exceed 500 characters' }
      ]
    },
    {
      key: 'icon',
      label: 'Icon',
      type: 'text',
      placeholder: '📁',
      description: 'Icon for this category',
      defaultValue: '📁',
      form: {
        row: 3,
        width: 'half',
        order: 3
      },
      table: {
        width: 'xs'
      }
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      required: true,
      defaultValue: true,
      description: 'Enable or disable this category',
      form: {
        row: 3,
        width: 'half',
        order: 4
      },
      table: {
        width: 'xs'
      }
    },

    // ============================================================================
    // AUDIT FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'sm',
        
      }
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date',
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'sm',
        
      }
    },
    {
      key: 'createdById',
      label: 'Created By',
      type: 'text',
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'md',
        
      }
    },
    {
      key: 'updatedById',
      label: 'Updated By',
      type: 'text',
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'md',
        
      }
    }
  ],

  // ============================================================================
  // SEARCH AND FILTERING - SIMPLIFIED
  // ============================================================================
  search: {
    fields: ['name', 'description'],
    placeholder: 'Search categories...',
    mobileFilters: true,
    fuzzy: true
  },

  // ============================================================================
  // BASIC ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: false,
    bulk: false
  },

  // ============================================================================
  // MOBILE-FIRST LAYOUT - SIMPLIFIED
  // ============================================================================
  mobile: {
    cardFormat: 'compact',
    primaryField: 'name',
    secondaryFields: ['icon', 'isActive'],
    showSearch: true,
    showFilters: false,
    fabPosition: 'bottom-right'
  },

  // ============================================================================
  // DESKTOP TABLE CONFIGURATION - SIMPLIFIED
  // ============================================================================
  desktop: {
    sortField: 'name',
    sortOrder: 'asc',
    density: 'normal',
    rowActions: true,
    bulkActions: false
  },

  // ============================================================================
  // TABLE CONFIGURATION - SIMPLIFIED
  // ============================================================================
  table: {
    width: 'full',
    bulkSelect: false,
    columnFilter: false,
    sortableColumns: true
  },

  // ============================================================================
  // RELATIONSHIPS
  // ============================================================================
  relationships: {
    tenant: {
      type: 'one-to-one',
      relatedEntity: 'tenants',
      description: 'Tenant that owns this category',
      foreignKey: 'tenantId',
      cacheStrategy: 'memory',
      preload: false
    },
    branch: {
      type: 'one-to-one',
      relatedEntity: 'branches',
      description: 'Branch that this category belongs to',
      foreignKey: 'branchId',
      cacheStrategy: 'memory',
      preload: false
    }
  },

  // ============================================================================
  // PERMISSIONS - BASIC
  // ============================================================================
  permissions: {
    create: 'tableCategory:create',
    update: 'tableCategory:update',
    delete: 'tableCategory:delete',
    view: 'tableCategory:view'
  },

  // ✅ ENTITY: IndexedDB key configuration - CRITICAL FOR INDEXEDDB OPERATIONS
  indexedDBKey: (record: any) => record.id
} as const;

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================
export const TableCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  tenantId: z.string(),
  branchId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  originalTableCategoryId: z.string().nullable().optional(),
});

export type TableCategory = z.infer<typeof TableCategorySchema>;
