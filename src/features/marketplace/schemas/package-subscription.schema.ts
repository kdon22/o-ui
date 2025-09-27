/**
 * Package Subscription Schema - Marketplace Subscription Management
 * 
 * Handles:
 * - User subscriptions to paid packages
 * - License validation and tracking
 * - Subscription status management
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const PACKAGE_SUBSCRIPTION_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY
  // ============================================================================
  databaseKey: 'packageSubscriptions',
  modelName: 'PackageSubscription',
  actionPrefix: 'packageSubscriptions',

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    name: 'Package Subscription',
    pluralName: 'Package Subscriptions',
    icon: 'CreditCard',
    description: 'Manage package subscriptions and licenses'
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'md',
    layout: 'default',
    showDescriptions: true
  },

  // ============================================================================
  // FIELDS CONFIGURATION
  // ============================================================================
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'auto.uuid',
        trigger: 'create'
      },
      ui: {
        showInForm: false
      }
    },
    {
      key: 'packageId',
      label: 'Package ID',
      type: 'text',
      required: true,
      ui: {
        showInForm: true
      }
    },
    {
      key: 'userId',
      label: 'User ID',
      type: 'text',
      required: true,
      ui: {
        showInForm: true
      }
    },
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'context.tenantId',
        trigger: 'create'
      },
      ui: {
        showInForm: false
      }
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'expired', label: 'Expired' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'suspended', label: 'Suspended' }
      ],
      defaultValue: 'active',
      ui: {
        showInForm: true
      }
    },
    {
      key: 'subscriptionType',
      label: 'Subscription Type',
      type: 'select',
      required: true,
      options: [
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
        { value: 'lifetime', label: 'Lifetime' },
        { value: 'trial', label: 'Trial' }
      ],
      ui: {
        showInForm: true
      }
    },
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'datetime',
      required: true,
      autoValue: {
        source: 'auto.now',
        trigger: 'create'
      },
      ui: {
        showInForm: true
      }
    },
    {
      key: 'endDate',
      label: 'End Date',
      type: 'datetime',
      ui: {
        showInForm: true
      }
    },
    {
      key: 'createdAt',
      label: 'Created At',
      type: 'datetime',
      required: true,
      autoValue: {
        source: 'auto.now',
        trigger: 'create'
      },
      ui: {
        showInForm: false
      }
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      type: 'datetime',
      required: true,
      autoValue: {
        source: 'auto.now',
        trigger: 'update'
      },
      ui: {
        showInForm: false
      }
    }
  ],

  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================
  table: {
    defaultSort: { field: 'createdAt', direction: 'desc' },
    searchFields: ['packageId', 'userId', 'status'],
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'expired', label: 'Expired' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'suspended', label: 'Suspended' }
        ]
      }
    ]
  },

  // ============================================================================
  // MOBILE AND DESKTOP CONFIGURATION
  // ============================================================================
  mobile: {
    cardFormat: 'detailed',
    primaryField: 'packageId',
    secondaryFields: ['status', 'subscriptionType', 'endDate'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right'
  },

  desktop: {
    sortField: 'createdAt',
    sortOrder: 'desc',
    editableField: 'status',
    rowActions: true,
    bulkActions: false
  },

  // ============================================================================
  // PERMISSIONS
  // ============================================================================
  permissions: {
    create: 'marketplace:manage-subscriptions',
    update: 'marketplace:manage-subscriptions',
    delete: 'marketplace:manage-subscriptions',
    view: 'marketplace:view-subscriptions'
  }
};