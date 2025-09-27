/**
 * Class Schema - Global Library Classes System
 * 
 * Single Source of Truth for:
 * - Class creation and management (global library available tenant-wide)
 * - Python class code generation and natural language definitions
 * - Method and property management
 * - Import dependency tracking
 * - Category organization
 * - Branch-aware operations with Copy-on-Write
 * - Mobile-first responsive design
 * - Field validation and types
 * 
 * This schema will auto-generate the class management system.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const CLASS_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'class',       // IndexedDB store + API endpoints
  modelName: 'Class',         // Prisma model access
  actionPrefix: 'class',      // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Classes',
    description: 'Global library classes available throughout the tenant',
    icon: 'Code',
    color: 'blue'
  },

  // ============================================================================
  // RESOURCE DEFINITION
  // ============================================================================
  label: 'Class',
  pluralLabel: 'Classes',
  description: 'Global library classes available throughout the tenant',
  icon: 'Code',
  category: 'Code',

  // ============================================================================
  // UI CONFIGURATION
  // ============================================================================
  ui: {
    defaultSort: { field: 'name', direction: 'asc' },
    searchField: 'name',
    displayField: 'name',
    descriptionField: 'description',
    colorField: 'category', // Color code by category
    defaultView: 'table',
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    allowBulkActions: true,
    showInSidebar: true,
    sidebarOrder: 4,
    pageTitle: 'Global Classes Library',
    emptyStateTitle: 'No classes found',
    emptyStateDescription: 'Create your first class to build reusable components'
  },

  // ============================================================================
  // FIELD DEFINITIONS - MOBILE-FIRST RESPONSIVE DESIGN
  // ============================================================================
  fields: [
    // CORE IDENTIFICATION
    {
      key: 'idShort',
      label: 'Class ID',
      type: 'text',
      placeholder: 'Auto-generated (e.g., C8K9L3)',
      description: 'Short, human-readable identifier for navigation',
      tab: 'General',
      readonly: true,
      form: {
        row: 1,
        width: 'half',
        order: 1,
        showInForm: false // Auto-generated
      },
      table: {
        width: 100,
        order: 1,
        sortable: true,
        filterable: true,
        searchable: true,
        
      },
      validation: [
        { type: 'maxLength', value: 10, message: 'Class ID cannot exceed 10 characters' }
      ]
    },
    {
      key: 'name',
      label: 'Class Name',
      type: 'text',
      placeholder: 'CustomerValidator, BookingProcessor, etc.',
      description: 'Descriptive name for the class',
      tab: 'General',
      required: true,
      clickable: true,
      clickAction: {
        type: 'navigate',
        url: '/classes/{idShort}',
        target: '_self'
      },
      form: {
        row: 1,
        width: 'half',
        order: 2,
        showInForm: true,
        autoFocus: true
      },
      table: {
        width: 200,
        order: 2,
        sortable: true,
        filterable: true,
        searchable: true,
        
      },
      validation: [
        { type: 'required', message: 'Class name is required' },
        { type: 'minLength', value: 3, message: 'Class name must be at least 3 characters' },
        { type: 'maxLength', value: 100, message: 'Class name cannot exceed 100 characters' }
      ]
    },
    {
      key: 'pythonName',
      label: 'Python Class Name',
      type: 'text',
      placeholder: 'CustomerValidator (PascalCase)',
      description: 'Python class name (will be auto-generated if empty)',
      tab: 'General',
      form: {
        row: 2,
        width: 'half',
        order: 1,
        showInForm: false
      },
      table: {
        width: 150,
        order: 3,
        sortable: true,
        filterable: true,
        searchable: true,
         // Hidden by default
      },
      validation: [
        { type: 'maxLength', value: 100, message: 'Python class name cannot exceed 100 characters' }
      ]
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Describe what this class does and how to use it...',
      description: 'Detailed description of the class functionality',
      tab: 'General',
      form: {
        row: 3,
        width: 'full',
        order: 1,
        showInForm: true
      },
      table: {
        width: 250,
        order: 5,
        sortable: false,
        filterable: false,
        searchable: true,
         // Too long for table
      },
      validation: [
        { type: 'maxLength', value: 1000, message: 'Description cannot exceed 1000 characters' }
      ]
    },
    {
      key: 'tagIds',
      label: 'Tags',
      type: 'tags',
      placeholder: 'Click to add tags...',
      description: 'Tags for categorizing and organizing this rule',
      tab: 'General',
      form: {
        row: 3,
        width: 'full',
        order: 1
      },
      table: {
        width: 'lg',
        
      }
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      description: 'Whether this class is active and available for use',
      tab: 'General',
      defaultValue: true,
      form: {
        row: 5,
        width: 'third',
        order: 2,
        showInForm: false
      },
      table: {
        width: 80,
        order: 8,
        sortable: true,
        filterable: true,
        searchable: false,
        displayType: 'status'
      }
    },
    {
      key: 'pythonCode',
      label: 'Generated Python Code',
      type: 'monaco',
      language: 'python',
      placeholder: '# Python code will be auto-generated from natural language definition',
      description: 'Generated Python class code (read-only, auto-generated)',
      tab: 'Code Definition',
      readonly: true,
      form: {
        row: 2,
        width: 'full',
        order: 1,
        showInForm: false,
        height: 400
      },
      table: {
        width: 80,
        order: 8,
        sortable: true,
        filterable: true,
        searchable: false,
        displayType: 'status'
      }
    }
  ],

  // ============================================================================
  // RELATIONSHIPS
  // ============================================================================
  relationships: {
    classTags: {
      type: 'many-to-many',
      relatedEntity: 'tags',
      description: 'Tags associated with this class',
      junction: {
        tableName: 'classTags', // ✅ Standard: class + tags → classTags
        field: 'classId',
        relatedField: 'tagId'
      }
    }
  },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================
  search: {
    fields: ['name', 'pythonName', 'description', 'category'],
    placeholder: 'Search classes...',
    mobileFilters: true,
    fuzzy: true
  },

  // ============================================================================
  // MOBILE-FIRST TABLE CONFIGURATION
  // ============================================================================
  table: {
    defaultColumns: ['name', 'category', 'isActive', 'tagIds'],
    mobileColumns: ['name', 'category'],
    searchableColumns: ['name', 'pythonName', 'description'],
    filterableColumns: ['category', 'isActive', 'isAbstract'],
    sortableColumns: ['name', 'pythonName', 'category', 'createdAt', 'updatedAt'],
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    allowExport: true,
    allowImport: true,
    bulkActions: ['delete', 'activate', 'deactivate', 'addTags', 'removeTags'],
    columnFilter: true
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    layout: 'tabs',
    tabs: [
      {
        key: 'General',
        label: 'General',
        icon: 'Info',
        description: 'Basic class information and settings'
      },
      {
        key: 'Code Definition',
        label: 'Code Definition',
        icon: 'Code',
        description: 'Natural language and generated Python code'
      },
      {
        key: 'Structure',
        label: 'Structure',
        icon: 'Layers',
        description: 'Methods, properties, and dependencies'
      }
    ],
    submitLabel: 'Save Class',
    cancelLabel: 'Cancel',
    showResetButton: true,
    autoSave: false,
    confirmBeforeSubmit: false,
    validationMode: 'onChange'
  },

  // ============================================================================
  // BRANCH CONFIGURATION
  // ============================================================================
  branch: {
    enabled: true,
    copyOnWrite: true,
    mergeStrategy: 'manual',
    conflictResolution: 'manual',
    versionField: 'version',
    originalField: 'originalClassId',
    trackChanges: true
  },

  // ============================================================================
  // MOBILE CONFIGURATION  
  // ============================================================================
  mobile: {
    cardFields: ['name', 'category', 'description'],
    quickActions: ['edit', 'duplicate', 'delete'],
    swipeActions: {
      left: ['edit'],
      right: ['delete']
    },
    searchEnabled: true,
    filterEnabled: true,
    sortEnabled: true,
    infiniteScroll: true,
    pullToRefresh: true
  },

  // ============================================================================
  // PERFORMANCE CONFIGURATION
  // ============================================================================
  performance: {
    cacheTTL: 300000, // 5 minutes
    preloadRelations: ['tags'],
    indexedFields: ['name', 'category', 'isActive'],
    searchIndex: ['name', 'pythonName', 'description'],
    lazyLoadFields: ['sourceCode', 'pythonCode', 'methods', 'properties']
  },

  // ============================================================================
  // VALIDATION CONFIGURATION
  // ============================================================================
  validation: {
    enforceRequired: true,
    enforceUnique: [['name', 'tenantId', 'branchId']],
    customValidations: [
      {
        field: 'pythonName',
        rule: 'pythonClassName',
        message: 'Python class name must be valid PascalCase identifier'
      }
    ]
  },

  // ============================================================================
  // PERMISSIONS CONFIGURATION
  // ============================================================================
  permissions: {
    create: ['admin', 'developer', 'power_user'],
    read: ['admin', 'developer', 'power_user', 'business_user'],
    update: ['admin', 'developer', 'power_user'],
    delete: ['admin', 'developer'],
    bulkActions: ['admin', 'developer']
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
}; 