/**
 * Package Installation Schema - Live Integration Management
 * 
 * Single Source of Truth for:
 * - Package installation tracking
 * - Live integration component mapping
 * - Installation status and error handling
 * - Branch-aware installations
 * - Sync and update management
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const PACKAGE_INSTALLATION_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY
  // ============================================================================
  databaseKey: 'packageInstallations',
  modelName: 'PackageInstallation',
  actionPrefix: 'packageInstallations',

  // ============================================================================
  // CONTEXT CONFIGURATION - TENANT-WIDE OPERATIONS
  // ============================================================================
  notHasBranchContext: true, // Package installations are tenant-wide, not branch-specific

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Package Installation',
    description: 'Manage installed marketplace packages',
    icon: 'download',
    color: 'green'
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'lg',
    layout: 'tabbed',
    showDescriptions: true
  },

  // ============================================================================
  // FIELD DEFINITIONS
  // ============================================================================
  fields: [
    // ============================================================================
    // INSTALLATION IDENTITY - BASIC TAB
    // ============================================================================
    {
      key: 'packageId',
      label: 'Package',
      type: 'select',
      required: true,
      tab: 'Basic',
      form: {
        row: 1,
        width: 'full',
        order: 1
      },
      options: {
        endpoint: '/api/marketplace/packages',
        labelField: 'name',
        valueField: 'id',
        searchable: true
      }
    },

    {
      key: 'status',
      label: 'Installation Status',
      type: 'select',
      required: true,
      defaultValue: 'installing',
      tab: 'Basic',
      form: {
        row: 2,
        width: 'half',
        order: 1
      },
      options: {
        static: [
          { value: 'installing', label: 'Installing', color: 'blue' },
          { value: 'active', label: 'Active', color: 'green' },
          { value: 'inactive', label: 'Inactive', color: 'gray' },
          { value: 'failed', label: 'Failed', color: 'red' },
          { value: 'uninstalled', label: 'Uninstalled', color: 'orange' }
        ]
      }
    },

    {
      key: 'version',
      label: 'Package Version',
      type: 'text',
      required: true,
      placeholder: '1.0.0',
      tab: 'Basic',
      form: {
        row: 2,
        width: 'half',
        order: 2
      }
    },

    // ============================================================================
    // INSTALLED COMPONENTS - COMPONENTS TAB
    // ============================================================================
    {
      key: 'installedRules',
      label: 'Installed Rules',
      type: 'tags',
      description: 'Rule IDs that were created during installation',
      tab: 'Components',
      form: {
        row: 1,
        width: 'full',
        order: 1
      },
      options: {
        allowCustom: false,
        endpoint: '/api/rules',
        labelField: 'name',
        valueField: 'id'
      }
    },

    {
      key: 'installedClasses',
      label: 'Installed Classes',
      type: 'tags',
      description: 'Class IDs that were created during installation',
      tab: 'Components',
      form: {
        row: 2,
        width: 'full',
        order: 1
      },
      options: {
        allowCustom: false,
        endpoint: '/api/classes',
        labelField: 'name',
        valueField: 'id'
      }
    },

    {
      key: 'installedTables',
      label: 'Installed Tables',
      type: 'tags',
      description: 'Table IDs that were created during installation',
      tab: 'Components',
      form: {
        row: 3,
        width: 'full',
        order: 1
      },
      options: {
        allowCustom: false,
        endpoint: '/api/tables',
        labelField: 'name',
        valueField: 'id'
      }
    },

    {
      key: 'installedWorkflows',
      label: 'Installed Workflows',
      type: 'tags',
      description: 'Workflow IDs that were created during installation',
      tab: 'Components',
      form: {
        row: 4,
        width: 'full',
        order: 1
      },
      options: {
        allowCustom: false,
        endpoint: '/api/workflows',
        labelField: 'name',
        valueField: 'id'
      }
    },

    // ============================================================================
    // CONFIGURATION - SETTINGS TAB
    // ============================================================================
    {
      key: 'configurationData',
      label: 'Installation Configuration',
      type: 'json',
      description: 'Custom configuration applied during installation',
      tab: 'Settings',
      form: {
        row: 1,
        width: 'full',
        order: 1
      },
      options: {
        height: 200,
        language: 'json'
      }
    },

    {
      key: 'installationNotes',
      label: 'Installation Notes',
      type: 'textarea',
      placeholder: 'Any notes about this installation...',
      tab: 'Settings',
      form: {
        row: 2,
        width: 'full',
        order: 1
      },
      options: {
        rows: 4
      }
    },

    // ============================================================================
    // SYNC AND ERROR TRACKING - STATUS TAB
    // ============================================================================
    {
      key: 'installedAt',
      label: 'Installed At',
      type: 'datetime',
      readonly: true,
      tab: 'Status',
      form: {
        row: 1,
        width: 'half',
        order: 1
      }
    },

    {
      key: 'lastSyncAt',
      label: 'Last Sync',
      type: 'datetime',
      readonly: true,
      description: 'Last time package was synced/updated',
      tab: 'Status',
      form: {
        row: 1,
        width: 'half',
        order: 2
      }
    },

    {
      key: 'uninstalledAt',
      label: 'Uninstalled At',
      type: 'datetime',
      readonly: true,
      tab: 'Status',
      form: {
        row: 2,
        width: 'half',
        order: 1
      }
    },

    {
      key: 'errorCount',
      label: 'Error Count',
      type: 'number',
      readonly: true,
      defaultValue: 0,
      tab: 'Status',
      form: {
        row: 2,
        width: 'half',
        order: 2
      }
    },

    {
      key: 'lastError',
      label: 'Last Error',
      type: 'textarea',
      readonly: true,
      placeholder: 'No errors',
      tab: 'Status',
      form: {
        row: 3,
        width: 'full',
        order: 1
      },
      options: {
        rows: 3
      }
    }
  ],

  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================
  table: {
    defaultSort: { field: 'installedAt', direction: 'desc' },
    searchFields: ['package.name', 'status', 'version'],
    columns: [
      {
        key: 'package.name',
        label: 'Package',
        sortable: true,
        searchable: true
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        type: 'badge'
      },
      {
        key: 'version',
        label: 'Version',
        sortable: true
      },
      // Removed branch column - installations are tenant-wide
      {
        key: 'installedAt',
        label: 'Installed',
        sortable: true,
        type: 'date'
      },
      {
        key: 'lastSyncAt',
        label: 'Last Sync',
        sortable: true,
        type: 'date'
      }
    ]
  },

  // ============================================================================
  // RELATIONSHIPS
  // ============================================================================
  relationships: {
    package: {
      type: 'many-to-one',
      relatedEntity: 'marketplacePackages',
      description: 'The marketplace package that was installed'
    },
    subscription: {
      type: 'many-to-one',
      relatedEntity: 'packageSubscriptions',
      description: 'The subscription that enabled this installation (optional for free packages)'
    },
    user: {
      type: 'many-to-one',
      relatedEntity: 'users',
      description: 'The user who installed the package'
    },
    tenant: {
      type: 'many-to-one',
      relatedEntity: 'tenants',
      description: 'The tenant where the package is installed'
    },
    // Removed branch relationship - installations are tenant-wide, not branch-specific
  }
};
