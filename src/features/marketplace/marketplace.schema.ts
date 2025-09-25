/**
 * Marketplace Package Schema - Package Creation and Publishing System
 * 
 * Single Source of Truth for:
 * - Package creation and configuration
 * - Component selection (rules, classes, tables, workflows)
 * - Licensing and pricing models
 * - Publishing and distribution settings
 * - Live integration and installation
 * - Tenant-based access control
 * - Mobile-first responsive design
 * - Field validation and types
 * 
 * This schema will auto-generate the entire marketplace package system.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const MARKETPLACE_PACKAGE_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'marketplacePackages',
  modelName: 'MarketplacePackage',
  actionPrefix: 'marketplacePackages',

  // ============================================================================
  // CACHING / STORAGE STRATEGY
  // ============================================================================
  // Server-only: packages are global and not branch-scoped; bypass IndexedDB writes
  serverOnly: true,
  // Explicitly disable IndexedDB key generation so storage helpers skip writes
  indexedDBKey: null,

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Marketplace Package',
    description: 'Create and publish packages to share your business logic',
    icon: 'package',
    color: 'purple'
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'lg',
    layout: 'default',
    showDescriptions: true
  },

  // ============================================================================
  // PACKAGE CONFIGURATION FIELDS
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
      },
      mobile: {
        displayFormat: 'hidden'
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
      mobile: {
        displayFormat: 'hidden'
      }
    },
    {
      key: 'authorId',
      label: 'Author ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'session.user.id',
        required: true
      },
      mobile: {
        displayFormat: 'hidden'
      }
    },

    // ============================================================================
    // BASIC PACKAGE INFORMATION - BASIC TAB
    // ============================================================================
    {
      key: 'name',
      label: 'Package Name',
      type: 'text',
      required: true,
      placeholder: 'Enter package name...',
      description: 'A clear, descriptive name for your package',
      tab: 'Basic',
      form: {
        row: 1,
        width: 'full',
        order: 1
      },
      validation: [
        { type: 'minLength', value: 3, message: 'Package name must be at least 3 characters' },
        { type: 'maxLength', value: 100, message: 'Package name cannot exceed 100 characters' },
        { type: 'pattern', value: '^[a-zA-Z0-9\\s\\-_]+$', message: 'Package name can only contain letters, numbers, spaces, hyphens, and underscores' }
      ]
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      placeholder: 'Describe what your package does and who should use it...',
      description: 'Help users understand the value and use cases for your package',
      tab: 'Basic',
      form: {
        row: 2,
        width: 'full'
      },
      validation: [
        { type: 'minLength', value: 20, message: 'Description must be at least 20 characters' },
        { type: 'maxLength', value: 1000, message: 'Description cannot exceed 1000 characters' }
      ]
    },
    {
      key: 'version',
      label: 'Version',
      type: 'text',
      required: true,
      defaultValue: '1.0.0',
      placeholder: '1.0.0',
      description: 'Semantic version number (e.g., 1.0.0, 2.1.3)',
      tab: 'Basic',
      form: {
        row: 3,
        width: 'third',
        order: 1
      },
      validation: [
        { type: 'pattern', value: '^\\d+\\.\\d+\\.\\d+$', message: 'Version must follow semantic versioning (e.g., 1.0.0)' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      tab: 'Basic',
      form: {
        row: 3,
        width: 'third',
        order: 2
      },
      options: {
        static: [
          { value: 'validation', label: 'Validation & Rules' },
          { value: 'utilities', label: 'Utilities & Helpers' },
          { value: 'workflows', label: 'Workflows & Processes' },
          { value: 'integrations', label: 'Integrations & APIs' },
          { value: 'travel', label: 'Travel & Booking' },
          { value: 'finance', label: 'Finance & Payments' },
          { value: 'compliance', label: 'Compliance & Legal' },
          { value: 'analytics', label: 'Analytics & Reporting' },
          { value: 'other', label: 'Other' }
        ]
      }
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'tags',
      defaultValue: [],
      placeholder: 'Add tags to help users find your package...',
      description: 'Keywords that help users discover your package',
      tab: 'Basic',
      form: {
        row: 3,
        width: 'third',
        order: 3
      }
    },

    // ============================================================================
    // COMPONENT SELECTION - COMPONENTS TAB
    // ============================================================================
    {
      key: 'selectedRules',
      label: 'Rules',
      type: 'component-selector',
      defaultValue: [],
      description: 'Select business rules to include in this package',
      tab: 'Components',
      form: {
        row: 1,
        width: 'full'
      },
      options: {
        componentType: 'rules',
        multiSelect: true,
        showPreview: true
      }
    },
    {
      key: 'selectedClasses',
      label: 'Classes',
      type: 'component-selector',
      defaultValue: [],
      description: 'Select classes to include in this package',
      tab: 'Components',
      form: {
        row: 2,
        width: 'full'
      },
      options: {
        componentType: 'classes',
        multiSelect: true,
        showPreview: true
      }
    },
    {
      key: 'selectedTables',
      label: 'Tables',
      type: 'component-selector',
      defaultValue: [],
      description: 'Select data tables to include in this package',
      tab: 'Components',
      form: {
        row: 3,
        width: 'full'
      },
      options: {
        componentType: 'tables',
        multiSelect: true,
        showPreview: true
      }
    },
    {
      key: 'selectedWorkflows',
      label: 'Workflows',
      type: 'component-selector',
      defaultValue: [],
      description: 'Select workflows to include in this package',
      tab: 'Components',
      form: {
        row: 4,
        width: 'full'
      },
      options: {
        componentType: 'workflows',
        multiSelect: true,
        showPreview: true
      }
    },

    // ============================================================================
    // LICENSING AND PRICING - LICENSING TAB
    // ============================================================================
    {
      key: 'licenseType',
      label: 'License Type',
      type: 'select',
      required: true,
      defaultValue: 'FREE',
      tab: 'Licensing',
      form: {
        row: 1,
        width: 'half',
        order: 1
      },
      options: {
        static: [
          { value: 'FREE', label: 'Free - Open Source' },
          { value: 'ONE_TIME', label: 'One-Time Purchase' },
          { value: 'SUBSCRIPTION', label: 'Subscription' },
          { value: 'USAGE_BASED', label: 'Usage-Based Pricing' }
        ]
      }
    },
    {
      key: 'price',
      label: 'Price',
      type: 'currency',
      placeholder: '0.00',
      description: 'Price in USD (only applies to paid license types)',
      tab: 'Licensing',
      form: {
        row: 1,
        width: 'half',
        order: 2
      },
      validation: [
        { type: 'min', value: 0.01, message: 'Price must be greater than $0.00' },
        { type: 'max', value: 10000, message: 'Price cannot exceed $10,000.00' }
      ]
    },
    {
      key: 'subscriptionInterval',
      label: 'Billing Interval',
      type: 'select',
      description: 'Only applies to subscription license type',
      tab: 'Licensing',
      form: {
        row: 2,
        width: 'half',
        order: 1
      },
      options: {
        static: [
          { value: 'monthly', label: 'Monthly' },
          { value: 'quarterly', label: 'Quarterly' },
          { value: 'yearly', label: 'Yearly' }
        ]
      }
    },
    {
      key: 'usageUnit',
      label: 'Usage Unit',
      type: 'select',
      description: 'Only applies to usage-based license type',
      tab: 'Licensing',
      form: {
        row: 2,
        width: 'half',
        order: 2
      },
      options: {
        static: [
          { value: 'execution', label: 'Per Execution' },
          { value: 'api_call', label: 'Per API Call' },
          { value: 'record', label: 'Per Record Processed' },
          { value: 'user', label: 'Per User' }
        ]
      }
    },

    // ============================================================================
    // COPY PROTECTION SETTINGS - LICENSING TAB
    // ============================================================================
    {
      key: 'allowExport',
      label: 'Allow Export',
      type: 'switch',
      defaultValue: false,
      description: 'Allow users to export package contents (reduces protection)',
      tab: 'Licensing',
      form: {
        row: 3,
        width: 'half',
        order: 1
      }
    },
    {
      key: 'requiresLicense',
      label: 'Requires License Validation',
      type: 'switch',
      defaultValue: true,
      description: 'Enforce license validation for package usage',
      tab: 'Licensing',
      form: {
        row: 3,
        width: 'half',
        order: 2
      }
    },

    // ============================================================================
    // PUBLISHING SETTINGS - PUBLISHING TAB
    // ============================================================================
    {
      key: 'isPublic',
      label: 'Public Package',
      type: 'switch',
      defaultValue: false,
      description: 'Make this package visible in the public marketplace',
      tab: 'Publishing',
      form: {
        row: 1,
        width: 'half',
        order: 1
      }
    },
    {
      key: 'allowedTenants',
      label: 'Allowed Tenants',
      type: 'tags',
      defaultValue: [],
      placeholder: 'Enter tenant IDs...',
      description: 'Specific tenants that can access this package (only applies to private packages)',
      tab: 'Publishing',
      form: {
        row: 1,
        width: 'half',
        order: 2
      }
    },
    {
      key: 'publishingNotes',
      label: 'Publishing Notes',
      type: 'textarea',
      placeholder: 'Internal notes about this package...',
      description: 'Private notes for package management (not visible to users)',
      tab: 'Publishing',
      form: {
        row: 2,
        width: 'full'
      }
    },

    // ============================================================================
    // AUDIT FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'downloadCount',
      label: 'Downloads',
      type: 'number',
      defaultValue: 0,
      description: 'Number of times this package has been downloaded',
      mobile: {
        displayFormat: 'hidden'
      }
    },
    {
      key: 'rating',
      label: 'Rating',
      type: 'number',
      description: 'Average user rating (1-5 stars)',
      mobile: {
        displayFormat: 'hidden'
      }
    },
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      description: 'When this package was created',
      mobile: {
        displayFormat: 'hidden'
      }
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date',
      description: 'When this package was last updated',
      mobile: {
        displayFormat: 'hidden'
      }
    }
  ],

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================
  search: {
    fields: ['name', 'description', 'tags', 'category'],
    placeholder: 'Search packages...',
    mobileFilters: true,
    fuzzy: true
  },

  // ============================================================================
  // ACTIONS CONFIGURATION - SERVER ONLY (NO INDEXEDDB)
  // ============================================================================
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: true,
    // ✅ SERVER-ONLY: No optimistic updates for server-only resources
    optimistic: false,
    custom: [
      {
        id: 'publish',
        label: 'Publish Package',
        icon: 'upload',
        description: 'Publish this package to the marketplace',
        handler: 'publishPackage'
      },
      {
        id: 'unpublish',
        label: 'Unpublish Package',
        icon: 'download',
        description: 'Remove this package from the marketplace',
        handler: 'unpublishPackage'
      },
      {
        id: 'preview',
        label: 'Preview Package',
        icon: 'eye',
        description: 'Preview how this package will appear to users',
        handler: 'previewPackage'
      }
    ]
  },

  // ============================================================================
  // MOBILE AND DESKTOP CONFIGURATION
  // ============================================================================
  mobile: {
    cardFormat: 'detailed',
    primaryField: 'name',
    secondaryFields: ['category', 'licenseType', 'downloadCount'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right'
  },

  desktop: {
    sortField: 'createdAt',
    sortOrder: 'desc',
    editableField: 'name',
    rowActions: true,
    bulkActions: true
  },

  // ============================================================================
  // PERMISSIONS
  // ============================================================================
  permissions: {
    create: 'marketplace:create-package',
    update: 'marketplace:update-package',
    delete: 'marketplace:delete-package',
    view: 'marketplace:view-package',
    custom: {
      publish: 'marketplace:publish-package',
      unpublish: 'marketplace:unpublish-package'
    }
  },

  // ✅ SERVER-ONLY: No IndexedDB storage - marketplace packages are server-only
  // indexedDBKey: Not needed for server-only resources
  
  // ✅ GLOBAL RESOURCE: Marketplace packages are global, not branch-specific
  notHasBranchContext: true
};
