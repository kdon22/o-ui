/**
 * Tag Group Schema - Organizational Categories for Tags
 * 
 * Single Source of Truth for:
 * - Tag group management and organization
 * - Color coding and visual distinction
 * - Optional grouping (tags can exist without groups)
 * - Mobile-first responsive design
 * - Field validation and types
 * 
 * This schema will auto-generate the tag group management system.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const TAG_GROUP_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'tagGroup',    // IndexedDB store + API endpoints
  modelName: 'TagGroup',      // Prisma model access  
  actionPrefix: 'tagGroup',   // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Tag Groups',
    description: 'Organizational categories for tags (e.g., Region, Priority, Status)',
    icon: 'folder',
    color: 'purple'
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
        
      }
    },
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      autoValue: { source: 'session.user.tenantId', required: true },
      form: { row: 1, width: 'full', showInForm: false },
      table: { width: 'sm',  }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      autoValue: { source: 'session.user.branchContext.currentBranchId', required: true },
      form: { row: 1, width: 'full', showInForm: false },
      table: { width: 'sm',  }
    },
    {
      key: 'originalTagGroupId',
      label: 'Original Tag Group ID',
      type: 'text',
      description: 'Reference to the original tag group for branching',
      form: { row: 1, width: 'full', showInForm: false },
      table: { width: 'sm',  }
    },
    {
      key: 'name',
      label: 'Group Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Region, Priority, Status',
      description: 'Name of the tag group category',
      form: {
        row: 1,
        width: 'full'
      },
      table: {
        width: 'lg',
        
      }
    },
    {
      key: 'description',
      label: 'Description', 
      type: 'textarea',
      placeholder: 'Optional description of this tag group...',
      description: 'Brief description of what this group represents',
      form: {
        row: 2,
        width: 'full'
      },
      table: {
        width: 'xl',
        
      }
    },
    {
      key: 'color',
      label: 'Color',
      type: 'color',
      defaultValue: '#6366f1',
      description: 'Default color for tags in this group',
      form: {
        row: 3,
        width: 'half'
      },
      table: {
        width: 'sm',
        
      }
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      type: 'number',
      defaultValue: 0,
      description: 'Order for displaying groups (lower numbers first)',
      form: {
        row: 3,
        width: 'half'
      },
      table: {
        width: 'sm',
        
      }
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      defaultValue: true,
      description: 'Whether this group is actively used',
      form: {
        row: 4,
        width: 'half'
      },
      table: {
        width: 'sm',
        
      }
    },

    // Audit fields (hidden in forms)
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      form: {
        row: 5,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'md',
        
      }
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date',
      form: {
        row: 5,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'md',
        
      }
    }
  ],

  // ============================================================================
  // RELATIONSHIP DEFINITIONS
  // ============================================================================
  relationships: {
    tags: {
      type: 'one-to-many',
      relatedEntity: 'tags',
      description: 'Tags belonging to this group',
      foreignKey: 'groupId'
    }
  },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================
  search: {
    fields: ['name', 'description'],
    placeholder: 'Search tag groups...',
    mobileFilters: true,
    fuzzy: true
  },

  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,
    read: true,
    update: true,
    delete: true,
    export: true
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
      badges: ['isActive']
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
    showBulkActions: true
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
}; 