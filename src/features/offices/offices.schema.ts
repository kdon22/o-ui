/**
 * Office Schema - Office and Vendor Configuration Management
 * 
 * Single Source of Truth for:
 * - Office configuration and management
 * - Vendor integration settings
 * - Credential associations
 * - Node office assignments
 * - Mobile-first responsive design
 * - Field validation and types
 * - Relationship management
 * - Connection management
 * 
 * This schema will auto-generate the entire office management system.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const OFFICE_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'office',     // IndexedDB store + API endpoints
  modelName: 'Office',        // Prisma model access
  actionPrefix: 'office',     // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Offices',
    description: 'Office configurations and vendor integration settings for business operations',
    icon: 'building',
    color: 'blue'
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'lg',           // Make form compact - options: 'sm', 'md', 'lg', 'xl', 'full'
    layout: 'compact',     // Layout style
    showDescriptions: true // Show field descriptions
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
    {
      key: 'originalOfficeId',
      label: 'Original Office ID',
      type: 'text',
      description: 'Reference to the original office for branching'
    },

    // ============================================================================
    // BRANCHING FIELDS - HIDDEN FROM FORMS
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
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      required: true,
      description: 'Current branch this office belongs to',
      autoValue: {
        source: 'session.user.branchContext.currentBranchId',
        required: true
      }
    },

    // ============================================================================
    // BASIC OFFICE CONFIGURATION - GENERAL TAB
    // ============================================================================
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter office name...',
      description: 'The display name for this office',
      tab: 'General',
      clickable: true, // Make this column clickable to enter edit mode
      form: {
        row: 1,
        width: 'half',
        order: 1
      },
      table: {
        width: 'lg'
      },
      validation: [
        { type: 'maxLength', value: 255, message: 'Name cannot exceed 255 characters' }
      ]
    },
    {
      key: 'officeId',
      label: 'Office ID',
      type: 'text',
      required: true,
      placeholder: 'Enter office ID...',
      description: 'Unique identifier for this office',
      tab: 'General',
      form: {
        row: 1,
        width: 'half',
        order: 2
      },
      table: {
        width: 'sm'
      },
      validation: [
        { type: 'pattern', value: '^[A-Z0-9]{2,10}$', message: 'Office ID must be 2-10 uppercase letters/numbers' }
      ]
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional description...',
      description: 'Additional details about this office',
      tab: 'General',
      form: {
        row: 2,
        width: 'full'
      },
      table: {
        width: 'xl',
        showInTable: false
      },
      validation: [
        { type: 'maxLength', value: 1000, message: 'Description cannot exceed 1000 characters' }
      ]
    },

    // ============================================================================
    // VENDOR CONFIGURATION - GENERAL TAB
    // ============================================================================
    {
      key: 'vendor',
      label: 'Vendor',
      type: 'select',
      required: true,
      tab: 'General',
      form: {
        row: 3,
        width: 'half',
        order: 1
      },
      table: {
        width: 'sm'
      },
      options: {
        static: [
          { value: 'SABRE', label: 'Sabre' },
          { value: 'AMADEUS', label: 'Amadeus' },
          { value: 'TRAVELPORT', label: 'Travelport' }
        ]
      }
    },
    {
      key: 'timeZone',
      label: 'Time Zone',
      type: 'select',
      tab: 'General',
      form: {
        row: 3,
        width: 'half',
        order: 2
      },
      options: {
        static: [
          { value: 'UTC', label: 'UTC' },
          { value: 'EST', label: 'Eastern Standard Time' },
          { value: 'CST', label: 'Central Standard Time' },
          { value: 'MST', label: 'Mountain Standard Time' },
          { value: 'PST', label: 'Pacific Standard Time' },
          { value: 'GMT', label: 'Greenwich Mean Time' },
          { value: 'CET', label: 'Central European Time' },
          { value: 'JST', label: 'Japan Standard Time' },
          { value: 'AEST', label: 'Australian Eastern Standard Time' }
        ]
      }
    },
    {
      key: 'airportCode',
      label: 'Airport Code',
      type: 'text',
      placeholder: 'LAX, JFK, LHR...',
      description: 'Nearest airport code for travel bookings',
      tab: 'General',
      form: {
        row: 4,
        width: 'sm',
        order: 1
      },
      table: {
        width: 'xs'
      },
      validation: [
        { type: 'pattern', value: '^[A-Z]{3}$', message: 'Airport code must be 3 uppercase letters' }
      ]
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      description: 'Whether this office is currently active',
      defaultValue: true
    },

    // ============================================================================
    // CONNECTION CONFIGURATION - CONNECTION TAB
    // ============================================================================
    {
      key: 'connectionType',
      label: 'Connection Type',
      type: 'select',
      required: false,
      tab: 'Connection',
      form: {
        row: 1,
        width: 'half',
        order: 1
      },
      options: {
        static: [
          { value: 'DIRECT', label: 'Direct Connection' },
          { value: 'EMULATED', label: 'Emulated Connection' }
        ]
      }
    },
    {
      key: 'emulateOffice',
      label: 'Emulate Office',
      type: 'text',
      placeholder: 'Office ID to emulate...',
      description: 'Office ID to emulate for connection (if applicable)',
      tab: 'Connection',
      form: {
        row: 1,
        width: 'half',
        order: 2
      }
    },
    {
      key: 'credentialId',
      label: 'Credential',
      type: 'select',
      tab: 'Connection',
      form: {
        row: 2,
        width: 'full'
      },
      options: {
        dynamic: {
          resource: 'credentials',
          valueField: 'id',
          labelField: 'name',
          displayField: 'name',
          filter: (item: any) => item.isActive && item.vendor === 'SABRE' // This would be dynamic based on vendor
        }
      }
    },

    // ============================================================================
    // LOCATION INFORMATION - DETAILS TAB
    // ============================================================================
    {
      key: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: 'Street address...',
      description: 'Physical address of the office',
      tab: 'Details',
      form: {
        row: 1,
        width: 'full'
      }
    },
    {
      key: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'City name...',
      description: 'City where the office is located',
      tab: 'Details',
      form: {
        row: 2,
        width: 'third',
        order: 1
      }
    },
    {
      key: 'state',
      label: 'State/Province',
      type: 'text',
      placeholder: 'State or province...',
      description: 'State or province where the office is located',
      tab: 'Details',
      form: {
        row: 2,
        width: 'third',
        order: 2
      }
    },
    {
      key: 'country',
      label: 'Country',
      type: 'text',
      placeholder: 'Country name...',
      description: 'Country where the office is located',
      tab: 'Details',
      form: {
        row: 2,
        width: 'third',
        order: 3
      }
    },
    {
      key: 'zipCode',
      label: 'ZIP/Postal Code',
      type: 'text',
      placeholder: 'ZIP or postal code...',
      description: 'ZIP or postal code for the office',
      tab: 'Details',
      form: {
        row: 3,
        width: 'half',
        order: 1
      }
    },
    {
      key: 'phoneNumber',
      label: 'Phone Number',
      type: 'text',
      placeholder: '+1 (555) 123-4567',
      description: 'Primary phone number for the office',
      tab: 'Details',
      form: {
        row: 3,
        width: 'half',
        order: 2
      }
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'office@company.com',
      description: 'Primary email address for the office',
      tab: 'Details',
      form: {
        row: 4,
        width: 'half',
        order: 1
      }
    },
    {
      key: 'website',
      label: 'Website',
      type: 'url',
      placeholder: 'https://company.com',
      description: 'Website URL for the office',
      tab: 'Details',
      form: {
        row: 4,
        width: 'half',
        order: 2
      }
    },

    // ============================================================================
    // RELATIONSHIPS - AUTO-DETERMINED BY CONTEXT
    // ============================================================================
    {
      key: 'nodeId',
      label: 'Associated Node',
      type: 'select',
      required: true,
      description: 'Node associated with this office (auto-determined by navigation context)',
      autoValue: {
        source: 'navigation.selectedId',  // Fixed: Use actual navigation context key
        required: true
      },
      form: {
        row: 5,
        width: 'full',
        showInForm: false // Hidden from form - auto-populated from context
      },
      options: {
        dynamic: {
          resource: 'nodes',
          valueField: 'id',
          labelField: 'name',
          displayField: 'name',
          filter: (item: any) => item.isActive
        }
      }
    },

    // ============================================================================
    // AUDIT FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'version',
      label: 'Version',
      type: 'number',
      description: 'Current version of this office',
    },
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      description: 'When this office was created',
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date',
      description: 'When this office was last updated',
    },
    {
      key: 'createdById',
      label: 'Created By',
      type: 'text',
      description: 'User who created this office',
    },
    {
      key: 'updatedById',
      label: 'Updated By',
      type: 'text',
      description: 'User who last updated this office'
    }
  ],

  // ============================================================================
  // RELATIONSHIP DEFINITIONS
  // ============================================================================
  relationships: {
    tenant: {
      type: 'one-to-one',
      relatedEntity: 'tenants',
      description: 'Tenant that owns this office',
      foreignKey: 'tenantId',
      cacheStrategy: 'memory',
      preload: false
    },
    branch: {
      type: 'one-to-one',
      relatedEntity: 'branches',
      description: 'Branch that this office belongs to',
      foreignKey: 'branchId',
      cacheStrategy: 'memory',
      preload: false
    },
    originalOffice: {
      type: 'one-to-one',
      relatedEntity: 'offices',
      description: 'Original office this is a branched copy of',
      foreignKey: 'originalOfficeId',
      cacheStrategy: 'memory',
      preload: false
    },
    credential: {
      type: 'one-to-one',
      relatedEntity: 'credentials',
      description: 'Credential used by this office',
      foreignKey: 'credentialId'
    },
    node: {
      type: 'one-to-one',
      relatedEntity: 'nodes',
      description: 'Node associated with this office',
      foreignKey: 'nodeId'
    },
    customers: {
      type: 'one-to-many',
      relatedEntity: 'customers',
      description: 'Customers using this office',
      foreignKey: 'officeId'
    },
    officeTags: {
      type: 'many-to-many',
      relatedEntity: 'tags',
      description: 'Tags associated with this office',
      junction: {
        tableName: 'officeTags', // ✅ Standard: office + tags → officeTags
        field: 'officeId',
        relatedField: 'tagId'
      }
    }
  },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================
  search: {
    fields: ['name', 'officeId', 'description', 'city', 'state', 'country'],
    placeholder: 'Search offices...',
    mobileFilters: true,
    fuzzy: true
  },

  // ============================================================================
  // TWO-LEVEL FILTERING CONFIGURATION
  // ============================================================================
  filtering: {
    level2: {
      title: 'Vendor',
      filterField: 'vendor', // Use direct field on office entity
      groupBy: 'vendor', // Use direct field on office entity
      showAll: true,
      emptyStateMessage: 'No offices found for this vendor'
    }
  },

  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: true,
    bulk: true,
    custom: [
      {
        id: 'testConnection',
        label: 'Test Connection',
        icon: 'wifi',
        description: 'Test the connection to the vendor system',
        handler: 'testOfficeConnection'
      },
      {
        id: 'validateConfiguration',
        label: 'Validate Configuration',
        icon: 'check',
        description: 'Validate office configuration settings',
        handler: 'validateOfficeConfiguration'
      },
      {
        id: 'viewCustomers',
        label: 'View Customers',
        icon: 'users',
        description: 'View customers using this office',
        handler: 'viewOfficeCustomers'
      },
      {
        id: 'manageCredentials',
        label: 'Manage Credentials',
        icon: 'key',
        description: 'Manage credential associations',
        handler: 'manageOfficeCredentials'
      },
      {
        id: 'viewActivity',
        label: 'View Activity',
        icon: 'activity',
        description: 'View office activity and usage',
        handler: 'viewOfficeActivity'
      },
      {
        id: 'branchFrom',
        label: 'Branch From',
        icon: 'branch',
        description: 'Create a new branch from this office',
        handler: 'branchFromOffice'
      },
      {
        id: 'mergeTo',
        label: 'Merge To',
        icon: 'merge',
        description: 'Merge this office to another branch',
        handler: 'mergeOfficeTo'
      },
      {
        id: 'viewHistory',
        label: 'View History',
        icon: 'history',
        description: 'View office change history',
        handler: 'viewOfficeHistory'
      },
      {
        id: 'compareBranches',
        label: 'Compare Branches',
        icon: 'compare',
        description: 'Compare office across branches',
        handler: 'compareOfficeBranches'
      },
      {
        id: 'switchBranch',
        label: 'Switch Branch',
        icon: 'switch',
        description: 'Switch to another branch',
        handler: 'switchOfficeBranch'
      }
    ]
  },

  // ============================================================================
  // MOBILE-FIRST LAYOUT
  // ============================================================================
  mobile: {
    cardFormat: 'detailed',
    primaryField: 'name',
    secondaryFields: ['officeId', 'vendor', 'city', 'isActive'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right',
    swipeActions: [
      {
        id: 'edit',
        label: 'Edit',
        icon: 'edit',
        description: 'Edit this office',
        handler: 'editOffice'
      },
      {
        id: 'testConnection',
        label: 'Test Connection',
        icon: 'wifi',
        description: 'Test connection',
        handler: 'testOfficeConnection'
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'trash',
        description: 'Delete this office',
        handler: 'deleteOffice'
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
    rowActions: true,
    bulkActions: true,
    density: 'normal'
  },

  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================
  table: {
    width: 'full', // Options: 'sm', 'md', 'lg', 'xl', 'full'
    bulkSelect: true,
    columnFilter: true,
    sortableColumns: true,
    bulkSelectOptions: [
      {
        id: 'delete',
        label: 'Delete Selected',
        icon: 'trash',
        description: 'Delete selected offices',
        handler: 'bulkDeleteOffices',
        className: 'text-red-600',
        confirmMessage: 'Are you sure you want to delete the selected offices?'
      },
      {
        id: 'activate',
        label: 'Activate Selected',
        icon: 'check',
        description: 'Activate selected offices',
        handler: 'bulkActivateOffices'
      },
      {
        id: 'deactivate',
        label: 'Deactivate Selected',
        icon: 'x',
        description: 'Deactivate selected offices',
        handler: 'bulkDeactivateOffices'
      },
      {
        id: 'export',
        label: 'Export Selected',
        icon: 'download',
        description: 'Export selected offices to CSV',
        handler: 'bulkExportOffices'
      }
    ],
    contextMenu: [
      {
        id: 'edit',
        label: 'Edit Office',
        icon: 'edit',
        action: 'edit'
      },
      {
        id: 'duplicate',
        label: 'Duplicate Office',
        icon: 'copy',
        action: 'duplicate'
      },
      {
        id: 'separator1',
        label: '',
        action: '',
        separator: true
      },
      {
        id: 'testConnection',
        label: 'Test Connection',
        icon: 'wifi',
        action: 'testConnection'
      },
      {
        id: 'viewCustomers',
        label: 'View Customers',
        icon: 'users',
        action: 'viewCustomers'
      },
      {
        id: 'separator2',
        label: '',
        action: '',
        separator: true
      },
      {
        id: 'delete',
        label: 'Delete Office',
        icon: 'trash',
        action: 'delete',
        className: 'text-red-600',
        confirmMessage: 'Are you sure you want to delete this office?'
      }
    ]
  },

  // ============================================================================
  // PERMISSIONS
  // ============================================================================
  permissions: {
    create: 'office:create',
    update: 'office:update',
    delete: 'office:delete',
    view: 'office:view',
    custom: {
      testConnection: 'office:test-connection',
      validateConfiguration: 'office:validate-configuration',
      viewCustomers: 'office:view-customers',
      manageCredentials: 'office:manage-credentials',
      viewActivity: 'office:view-activity',
      branch: 'office:branch',
      merge: 'office:merge'
    }
  },

  // ============================================================================
  // HOOKS FOR CUSTOM LOGIC
  // ============================================================================
  hooks: {
    beforeCreate: 'validateOfficeBeforeCreate',
    afterCreate: 'indexOfficeAfterCreate',
    beforeUpdate: 'validateOfficeBeforeUpdate',
    afterUpdate: 'reindexOfficeAfterUpdate',
    beforeDelete: 'checkOfficeDependenciesBeforeDelete',
    afterDelete: 'cleanupOfficeAfterDelete'
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Office = {
  id: string;
  name: string;
  officeId: string;
  description?: string;
  vendor: 'SABRE' | 'AMADEUS' | 'TRAVELPORT';
  connectionType?: 'DIRECT' | 'EMULATED';
  emulateOffice?: string;
  credentialId?: string;
  timeZone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  airportCode?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  nodeId?: string;
  tenantId: string;
  branchId: string;
  originalOfficeId?: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
};

export type CreateOffice = Omit<Office, 'id' | 'createdAt' | 'updatedAt' | 'version'>;
export type UpdateOffice = Partial<Omit<Office, 'id' | 'createdAt' | 'tenantId'>>;

// ============================================================================
// QUERY TYPES
// ============================================================================
export interface OfficeQuery {
  tenantId: string;
  branchId?: string;
  vendor?: 'SABRE' | 'AMADEUS' | 'TRAVELPORT';
  connectionType?: 'DIRECT' | 'EMULATED';
  isActive?: boolean;
  city?: string;
  state?: string;
  country?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'officeId' | 'vendor' | 'city' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface OfficeListQuery extends OfficeQuery {
  includeInactive?: boolean;
  includeCredentials?: boolean;
  includeCustomers?: boolean;
  includeNodes?: boolean;
}

// Schema loaded and exported - silent 