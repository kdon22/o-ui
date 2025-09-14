/**
 * DataTable Schema - Data Table Management System
 * 
 * Single Source of Truth for:
 * - Data table creation and management
 * - Table configuration and metadata
 * - Branch-aware operations with Copy-on-Write
 * - Mobile-first responsive design
 * - Field validation and types
 * 
 * This schema will auto-generate the data table management system.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import { z } from 'zod';

export const DATA_TABLE_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'tables',       // IndexedDB store + API endpoints
  modelName: 'Table',          // Prisma model access
  actionPrefix: 'tables',      // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Data Tables',
    description: 'Manage data tables and their configurations',
    icon: 'table',
    color: 'green'
  },



  // ============================================================================
  // RESOURCE DEFINITION
  // ============================================================================
  label: 'Data Table',
  pluralLabel: 'Data Tables',
  description: 'Data tables for managing structured data',
  icon: 'table',
  category: 'json',

  // ============================================================================
  // SIMPLIFIED FIELD CONFIGURATION - ESSENTIAL FIELDS ONLY
  // ============================================================================
  fields: [
    // ============================================================================
    // CORE IDENTITY FIELDS - HIDDEN FROM FORMS (NOT USED IN SIDEBAR CREATION)
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
        showInForm: false  // ✅ Hidden - sidebar uses simple approach
      },
      table: {
        width: 'sm',
        showInTable: false
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
        showInTable: false
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
        showInTable: false
      }
    },
    {
      key: 'categoryId',
      label: 'Category ID',
      type: 'text',
      description: 'Category this table belongs to',
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
    // USER INPUT FIELDS - ESSENTIAL FIELDS
    // ============================================================================
    {
      key: 'name',
      label: 'Table Name',
      type: 'text',
      required: true,
      placeholder: 'Enter table name...',
      description: 'The display name for this table',
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
        { type: 'maxLength', value: 255, message: 'Name cannot exceed 255 characters' }
      ]
    },
    {
      key: 'tableName',
      label: 'Table Name (Internal)',
      type: 'text',
      required: true,
      description: 'The internal table name used for queries (auto-generated from display name)',
      autoValue: {
        source: 'computed.tableNameFromName',
        required: true
      },
      form: {
        row: 1,
        width: 'full',
        showInForm: false  // Hidden - auto-generated
      },
      table: {
        width: 'lg',
        showInTable: false
      }
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional description...',
      description: 'Additional details about this table',
      form: {
        row: 2,
        width: 'full',
        order: 2
      },
      table: {
        width: 'xl',
        showInTable: false
      },
      validation: [
        { type: 'maxLength', value: 2000, message: 'Description cannot exceed 2000 characters' }
      ]
    },
    {
      key: 'icon',
      label: 'Icon',
      type: 'text',
      placeholder: '📊',
      description: 'Icon for this table',
      defaultValue: '📊',
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
      description: 'Enable or disable this table',
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
        showInTable: false
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
        showInTable: false
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
        showInTable: false
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
        showInTable: false
      }
    }
  ],

  // ============================================================================
  // SEARCH AND FILTERING - SIMPLIFIED
  // ============================================================================
  search: {
    fields: ['name', 'description'],
    placeholder: 'Search tables...',
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
      description: 'Tenant that owns this table',
      foreignKey: 'tenantId',
      cacheStrategy: 'memory',
      preload: false
    },
    branch: {
      type: 'one-to-one',
      relatedEntity: 'branches',
      description: 'Branch that this table belongs to',
      foreignKey: 'branchId',
      cacheStrategy: 'memory',
      preload: false
    },
    category: {
      type: 'one-to-one',
      relatedEntity: 'tableCategory',
      description: 'Category this table belongs to',
      foreignKey: 'categoryId',
      cacheStrategy: 'indexeddb',
      preload: false
    }
  },

  // ============================================================================
  // PERMISSIONS - BASIC
  // ============================================================================
  permissions: {
    create: 'tables:create',
    update: 'tables:update',
    delete: 'tables:delete',
    view: 'tables:view'
  },

  // ✅ ENTITY: IndexedDB key configuration - CRITICAL FOR INDEXEDDB OPERATIONS
  indexedDBKey: (record: any) => record.id
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export const DataTableSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),              // Display name (can have spaces/special chars)
  tableName: z.string().min(1).max(255),         // Snake_case name (sanitized for queries)
  description: z.string().max(2000).optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  tenantId: z.string(),
  branchId: z.string(),
  categoryId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable()
});

export type DataTable = z.infer<typeof DataTableSchema>;
