/**
 * TableData Schema - User Data Storage with Branching Support
 * 
 * Single Source of Truth for:
 * - User-generated table data storage
 * - Row-level branching with Copy-on-Write
 * - JSON-based flexible data structure
 * - Airtable-like data management
 * - Branch overlay and inheritance
 * 
 * This schema enables dynamic table data with full branching capabilities.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import { z } from 'zod';

export const TABLE_DATA_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'tableData',    // IndexedDB store + API endpoints
  modelName: 'TableData',      // Prisma model access
  actionPrefix: 'tableData',   // Action naming
  
  // ✅ SERVER-ONLY CONFIGURATION: Large datasets bypass IndexedDB
  serverOnly: true,            // Forces all operations through API
  cacheStrategy: 'server-only', // No local caching for data rows

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Table Data',
    description: 'User data stored in dynamic tables',
    icon: 'database',
    color: 'blue'
  },



  // ============================================================================
  // FIELD CONFIGURATION - MOBILE-FIRST DESIGN
  // ============================================================================
  fields: [
    {
      key: 'id',
      type: 'text',
      label: 'ID',
      required: true,
      validation: [
        { type: 'required', message: 'ID is required' },
        { type: 'minLength', value: 1, message: 'ID must be at least 1 character' },
        { type: 'maxLength', value: 255, message: 'ID must be less than 255 characters' }
      ]
    },
    {
      key: 'tableId',
      type: 'text',
      label: 'Table ID',
      required: true,
      validation: [
        { type: 'required', message: 'Table ID is required' },
        { type: 'minLength', value: 1, message: 'Table ID must be at least 1 character' },
        { type: 'maxLength', value: 255, message: 'Table ID must be less than 255 characters' }
      ]
    },
    {
      key: 'data',
      type: 'json',
      label: 'Data',
      required: true,
      description: 'The actual user data stored as JSON',
      validation: [
        { type: 'required', message: 'Data is required' }
      ]
    },
    {
      key: 'tenantId',
      type: 'text',
      label: 'Tenant ID',
      required: true,
      validation: [
        { type: 'required', message: 'Tenant ID is required' },
        { type: 'minLength', value: 1, message: 'Tenant ID must be at least 1 character' },
        { type: 'maxLength', value: 255, message: 'Tenant ID must be less than 255 characters' }
      ]
    },
    {
      key: 'branchId',
      type: 'text',
      label: 'Branch ID',
      required: true,
      validation: [
        { type: 'required', message: 'Branch ID is required' },
        { type: 'minLength', value: 1, message: 'Branch ID must be at least 1 character' },
        { type: 'maxLength', value: 255, message: 'Branch ID must be less than 255 characters' }
      ]
    },
    {
      key: 'originalTableDataId',
      type: 'text',
      label: 'Original Row ID',
      required: false,
      description: 'Link to original row if this is a branched copy',
      validation: [
        { type: 'maxLength', value: 255, message: 'Original Row ID must be less than 255 characters' }
      ]
    },
    {
      key: 'version',
      type: 'number',
      label: 'Version',
      required: true,
      defaultValue: 1,
      validation: [
        { type: 'required', message: 'Version is required' },
        { type: 'min', value: 1, message: 'Version must be at least 1' }
      ]
    },
    {
      key: 'createdAt',
      type: 'datetime',
      label: 'Created At',
      required: true
    },
    {
      key: 'updatedAt',
      type: 'datetime',
      label: 'Updated At',
      required: true
    },
    {
      key: 'createdById',
      type: 'text',
      label: 'Created By',
      required: false,
      validation: [
        { type: 'maxLength', value: 255, message: 'Created By must be less than 255 characters' }
      ]
    },
    {
      key: 'updatedById',
      type: 'text',
      label: 'Updated By',
      required: false,
      validation: [
        { type: 'maxLength', value: 255, message: 'Updated By must be less than 255 characters' }
      ]
    }
  ],

  // ============================================================================
  // SEARCH AND FILTER CONFIGURATION
  // ============================================================================
  search: {
    fields: ['data'],
    placeholder: 'Search table data...',
    fuzzy: true
  },

  // ============================================================================
  // FORM CONFIGURATION - MINIMAL (DATA IS DYNAMIC)
  // ============================================================================
  form: {
    layout: 'default',
    width: 'md',
    showDescriptions: true
  },

  // ============================================================================
  // ACTION CONFIGURATION - SERVER-ONLY FOR LARGE DATASETS
  // ============================================================================
  actions: {
    create: true,
    update: true,
    delete: true,
    
    // ✅ SERVER-ONLY: Disable optimistic updates for large datasets
    // Forces all operations to go through server first
    optimistic: false,
    
    // Enable bulk operations for server-side processing
    duplicate: true,
    bulk: true,
    
    // Custom server-only actions for large data operations
    custom: [
      {
        id: 'bulkImport',
        label: 'Bulk Import',
        icon: 'upload',
        variant: 'default',
        serverOnly: true,
        confirmation: {
          title: 'Bulk Import Data',
          message: 'This will import large amounts of data. Continue?'
        }
      },
      {
        id: 'export',
        label: 'Export Data',
        icon: 'download', 
        variant: 'outline',
        serverOnly: true
      },
      {
        id: 'search',
        label: 'Advanced Search',
        icon: 'search',
        variant: 'ghost',
        serverOnly: true
      }
    ]
  },

  // ============================================================================
  // MOBILE-FIRST LAYOUT - SIMPLIFIED
  // ============================================================================
  mobile: {
    cardFormat: 'compact',
    primaryField: 'data',
    secondaryFields: ['createdAt'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right'
  },

  // ============================================================================
  // DESKTOP TABLE CONFIGURATION - SIMPLIFIED
  // ============================================================================
  desktop: {
    sortField: 'createdAt',
    sortOrder: 'desc',
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
    columnFilter: true,
    sortableColumns: true
  },

  // ============================================================================
  // RELATIONSHIPS - SERVER-ONLY STRATEGY
  // ============================================================================
  relationships: {
    table: {
      type: 'one-to-one',
      relatedEntity: 'tables',
      description: 'The table this row belongs to',
      foreignKey: 'tableId',
      // ✅ Keep table metadata in IndexedDB (lightweight)
      cacheStrategy: 'indexeddb',
      preload: true
    },
    tenant: {
      type: 'one-to-one',
      relatedEntity: 'tenants',
      description: 'Tenant that owns this data',
      foreignKey: 'tenantId',
      cacheStrategy: 'memory',
      preload: false
    },
    branch: {
      type: 'one-to-one',
      relatedEntity: 'branches',
      description: 'Branch that this data belongs to',
      foreignKey: 'branchId',
      cacheStrategy: 'memory',
      preload: false
    },
    originalTableData: {
      type: 'one-to-one',
      relatedEntity: 'tableData',
      description: 'Original row if this is a branched copy',
      foreignKey: 'originalTableDataId',
      // ✅ SERVER-ONLY: Don't cache large table data relationships
      cacheStrategy: 'none',
      preload: false
    }
  },

  // ============================================================================
  // PERMISSIONS - BASIC
  // ============================================================================
  permissions: {
    create: 'tableData:create',
    update: 'tableData:update',
    delete: 'tableData:delete',
    view: 'tableData:view'
  },

  // ============================================================================
  // INDEXEDDB KEY CONFIGURATION - SERVER-ONLY (NO LOCAL STORAGE)
  // ============================================================================
  // ✅ NULL: Table data is server-only, not stored in IndexedDB
  indexedDBKey: null
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export const TableDataSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  data: z.record(z.any()), // JSON object with any structure
  tenantId: z.string(),
  branchId: z.string(),
  originalTableDataId: z.string().nullable(),
  version: z.number().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable()
});

export type TableData = z.infer<typeof TableDataSchema>;

// ============================================================================
// CREATE/UPDATE TYPES
// ============================================================================

export const CreateTableDataSchema = z.object({
  tableId: z.string(),
  data: z.record(z.any()),
  // System fields will be auto-populated
});

export const UpdateTableDataSchema = z.object({
  data: z.record(z.any()).optional(),
  // Other fields are not directly updatable
});

export type CreateTableData = z.infer<typeof CreateTableDataSchema>;
export type UpdateTableData = z.infer<typeof UpdateTableDataSchema>;
