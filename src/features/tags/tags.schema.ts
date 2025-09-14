/**
 * Tags Schema - Individual Tag Management System
 * 
 * Single Source of Truth for:
 * - Individual tag creation and management
 * - Optional group association (tags can exist without groups)
 * - Color customization and visual styling
 * - Rule association via many-to-many relationship
 * - Mobile-first responsive design
 * - Field validation and types
 * 
 * This schema will auto-generate the tag management system.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const TAG_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'tag',         // IndexedDB store + API endpoints
  modelName: 'Tag',           // Prisma model access
  actionPrefix: 'tag',        // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Tags',
    description: 'Individual tags for categorizing and organizing rules',
    icon: 'tag',
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
  // MOBILE-FIRST FIELD DEFINITIONS
  // ============================================================================
  fields: [
    // Core Identity
    {
      key: 'id',
      label: 'ID',
      type: 'text',
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
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      autoValue: { source: 'session.user.tenantId', required: true },
      form: { row: 1, width: 'full', showInForm: false },
      table: { width: 'sm', showInTable: false }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      autoValue: { source: 'session.user.branchContext.currentBranchId', required: true },
      form: { row: 1, width: 'full', showInForm: false },
      table: { width: 'sm', showInTable: false }
    },
    {
      key: 'originalTagId',
      label: 'Original Tag ID',
      type: 'text',
      description: 'Reference to the original tag for branching',
      form: { row: 1, width: 'full', showInForm: false },
      table: { width: 'sm', showInTable: false }
    },
    {
      key: 'name',
      label: 'Tag Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., West, High Priority, Draft',
      description: 'Name of the tag',
      form: {
        row: 1,
        width: 'full'
      },
      table: {
        width: 'lg',
        showInTable: true
      }
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional description of this tag...',
      description: 'Brief description of what this tag represents',
      form: {
        row: 2,
        width: 'full'
      },
      table: {
        width: 'xl',
        showInTable: true
      }
    },
    {
      key: 'groupId',
      label: 'Tag Group',
      type: 'select',
      required: false, // Tags can exist without groups
      placeholder: 'Select a group (optional)',
      description: 'Optional group to organize this tag under',
      options: {
        dynamic: {
          resource: 'tagGroup',
          valueField: 'id',
          labelField: 'name',
          displayField: 'name'
        }
      },
      form: {
        row: 3,
        width: 'full'
      },
      table: {
        width: 'md',
        showInTable: true
      }
    },
    {
      key: 'color',
      label: 'Color',
      type: 'color',
      defaultValue: '#6b7280',
      description: 'Custom color for this tag (overrides group color)',
      form: {
        row: 4,
        width: 'half'
      },
      table: {
        width: 'sm',
        showInTable: true
      }
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      type: 'number',
      defaultValue: 0,
      description: 'Order for displaying within group (lower numbers first)',
      form: {
        row: 4,
        width: 'half'
      },
      table: {
        width: 'sm',
        showInTable: true
      }
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      defaultValue: true,
      description: 'Whether this tag is actively used',
      form: {
        row: 5,
        width: 'half'
      },
      table: {
        width: 'sm',
        showInTable: true
      }
    },

    // Usage statistics (computed fields)
    {
      key: 'usageCount',
      label: 'Usage Count',
      type: 'number',
      defaultValue: 0,
      description: 'Number of rules using this tag',
      computed: true,
      form: {
        row: 5,
        width: 'half',
        showInForm: false
      },
      table: {
        width: 'sm',
        showInTable: true
      }
    },

    // Audit fields (hidden in forms)
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      form: {
        row: 6,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'md',
        showInTable: false
      }
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date',
      form: {
        row: 6,
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
  // RELATIONSHIP DEFINITIONS
  // ============================================================================
  relationships: {
    group: {
      type: 'one-to-many',
      relatedEntity: 'tagGroups',
      description: 'Optional group this tag belongs to',
      foreignKey: 'groupId'
    },
    ruleTags: {
      type: 'many-to-many',
      relatedEntity: 'rules',
      description: 'Rules associated with this tag',
      junction: {
        tableName: 'ruleTags',
        field: 'tagId',
        relatedField: 'ruleId'
      }
    }
  },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================
  search: {
    fields: ['name', 'description'],
    placeholder: 'Search tags...',
    mobileFilters: true,
    fuzzy: true
  },

  // ============================================================================
  // TWO-LEVEL FILTERING
  // ============================================================================
  filtering: {
    groups: [
      {
        key: 'status',
        label: 'Status',
        icon: 'check-circle',
        filters: [
          { key: 'active', label: 'Active', field: 'isActive', value: true },
          { key: 'inactive', label: 'Inactive', field: 'isActive', value: false }
        ]
      },
      {
        key: 'group',
        label: 'Tag Group',
        icon: 'folder',
        filters: [
          { key: 'ungrouped', label: 'Ungrouped', field: 'groupId', value: null },
          { key: 'grouped', label: 'Has Group', field: 'groupId', operator: 'notNull' }
        ]
      }
    ]
  },

  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true,
    bulk: {
      delete: true,
      update: true,
      export: true
    }
  },

  // ============================================================================
  // MOBILE-FIRST LAYOUT
  // ============================================================================
  mobile: {
    cardView: {
      title: 'name',
      subtitle: 'description',
      avatar: 'color',
      showBadges: true,
      badges: ['group.name', 'isActive']
    },
    listDensity: 'comfortable',
    enableSwipeActions: true,
    showSearch: true,
    showFilters: true
  },

  // ============================================================================
  // DESKTOP TABLE CONFIGURATION
  // ============================================================================
  desktop: {
    defaultView: 'table',
    density: 'comfortable',
    showFilters: true,
    showExport: true,
    showBulkActions: true,
    groupBy: 'group.name'
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
}; 