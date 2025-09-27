/**
 * Process Schema - Simplified Version
 * 
 * Single Source of Truth for:
 * - Simple process management
 * - Mobile-first responsive design
 * - Essential field validation
 * 
 * This schema will auto-generate a clean, simple process form.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import { z } from 'zod';

export const PROCESS_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'process',   // IndexedDB store + API endpoints
  modelName: 'Process',     // Prisma model access
  actionPrefix: 'process',  // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Processes',
    description: 'Workflow processes that orchestrate business operations',
    icon: 'workflow',
    color: 'purple'
  },

  // ============================================================================
  // FORM CONFIGURATION - SINGLE MODAL NO TABS
  // ============================================================================
  form: {
    width: 'md',
    layout: 'compact',
    showDescriptions: true
  },

  // ============================================================================
  // SIMPLIFIED FIELD CONFIGURATION - ONLY 4 FIELDS
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
      key: 'originalProcessId',
      label: 'Original Process ID',
      type: 'text',
      description: 'Reference to the original process for branching',
      // Computed/set server-side after creation
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
    // USER INPUT FIELDS - ONLY 4 ESSENTIAL FIELDS
    // ============================================================================
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter process name...',
      description: 'The display name for this process',
      tab: 'General',
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
      key: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      placeholder: 'Select process type...',
      description: 'Select the type of process...',
      tab: 'General',
      form: {
        row: 2,
        width: 'full',
        order: 2
      },
      table: {
        width: 'sm'
      },
      options: {
        static: [
          { value: 'UTR', label: 'UTR (Universal Travel Record)' },
          { value: 'SCHEDULED', label: 'Scheduled Tasks' },
          { value: 'TICKETING', label: 'Ticketing Operations' },
          { value: 'PRE_QUEUE', label: 'Pre-Queue Processing' },
          { value: 'POST_QUEUE', label: 'Post-Queue Processing' },
          { value: 'VIRTUAL_PAY', label: 'Virtual Payment' },
          { value: 'FARE_CHECK', label: 'Fare Validation' },
          { value: 'SEAT_CHECK', label: 'Seat Assignment Check' }
        ]
      },
      validation: [
        { type: 'required', message: 'Process type is required' }
      ]
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional description...',
      description: 'Additional details about this process',
      tab: 'General',
      form: {
        row: 3,
        width: 'full',
        order: 3
      },
      table: {
        width: 'xl',
        
      },
      validation: [
        { type: 'maxLength', value: 1000, message: 'Description cannot exceed 1000 characters' }
      ]
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      required: true,
      defaultValue: true,
      description: 'Enable or disable this process',
      tab: 'General',
      form: {
        row: 4,
        width: 'full',
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
    },
    {
      key: 'version',
      label: 'Version',
      type: 'number',
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      table: {
        width: 'xs',
        
      }
    }
  ],

  // ============================================================================
  // SEARCH AND FILTERING - SIMPLIFIED
  // ============================================================================
  search: {
    fields: ['name', 'description', 'type'],
    placeholder: 'Search processes...',
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
    secondaryFields: ['type', 'isActive'],
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
  // ENTERPRISE RELATIONSHIP DEFINITIONS - ENHANCED JUNCTION MANAGEMENT
  // ============================================================================
  relationships: {
    tenant: {
      type: 'one-to-one',
      relatedEntity: 'tenants',
      description: 'Tenant that owns this process',
      foreignKey: 'tenantId',
      cacheStrategy: 'memory',
      preload: false
    },
    branch: {
      type: 'one-to-one',
      relatedEntity: 'branches',
      description: 'Branch that this process belongs to',
      foreignKey: 'branchId',
      cacheStrategy: 'memory',
      preload: false
    },
    nodes: {
      type: 'many-to-many',
      relatedEntity: 'nodes',
      description: 'Nodes that use this process',
      junction: {
        tableName: 'nodeProcesses', // ✅ Standard: node + processes → nodeProcesses
        field: 'processId',
        relatedField: 'nodeId',
        attributes: {
          sequence: { type: 'number', required: false, default: 0 },
          isActive: { type: 'boolean', required: false, default: true }
        },
        constraints: [
          {
            type: 'unique',
            fields: ['nodeId', 'processId', 'branchId']
          }
        ],
        indexes: [
          { fields: ['nodeId', 'branchId'] },
          { fields: ['processId', 'branchId'] },
          { fields: ['sequence'] }
        ]
      },
      cacheStrategy: 'indexeddb'
    },
    rules: {
      type: 'many-to-many',
      relatedEntity: 'rules',
      description: 'Rules that belong to this process',
      junction: {
        tableName: 'processRules', // ✅ Standard: process + rules → processRules
        field: 'processId',
        relatedField: 'ruleId',
        attributes: {
          order: { type: 'number', required: false, default: 0 },
          isActive: { type: 'boolean', required: false, default: true },
          condition: { type: 'string', required: false }
        },
        constraints: [
          {
            type: 'unique',
            fields: ['processId', 'ruleId', 'branchId']
          }
        ],
        indexes: [
          { fields: ['processId', 'branchId'] },
          { fields: ['ruleId', 'branchId'] },
          { fields: ['order'] },
          { fields: ['isActive'] }
        ]
      },
      cacheStrategy: 'indexeddb'
    }
  },

  // ============================================================================
  // PERMISSIONS - BASIC
  // ============================================================================
  permissions: {
    create: 'process:create',
    update: 'process:update',
    delete: 'process:delete',
    view: 'process:view'
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
};

// ============================================================================
// JUNCTION SCHEMAS: PROCESS RELATIONSHIPS
// ============================================================================

/**
 * NodeProcess Junction Schema - Moved from nodes.schema.ts
 * Handles the many-to-many relationship between nodes and processes
 */

export const NodeProcessSchema = z.object({
  nodeId: z.string(),
  processId: z.string(),
  tenantId: z.string(),
  branchId: z.string(),
});

export type NodeProcess = z.infer<typeof NodeProcessSchema>;

export const NODE_PROCESS_SCHEMA = {
  databaseKey: 'nodeProcesses', // ✅ Standard: node + processes → nodeProcesses
  modelName: 'NodeProcess',
  actionPrefix: 'nodeProcesses',
  schema: NodeProcessSchema,
  relations: ['node', 'process', 'branch'],
  primaryKey: ['nodeId', 'processId', 'branchId'],
  displayFields: ['nodeId', 'processId'],
  searchFields: ['nodeId', 'processId'],
  orderBy: [{ processId: 'asc' }],
  // Metadata for schema-driven index generation (only mark exceptions)
  notHasAuditFields: true,
  
  // ✅ JUNCTION: IndexedDB compound key configuration
  indexedDBKey: (record: NodeProcess) => `${record.nodeId}:${record.processId}`,
  
  // GOLD STANDARD: Junction field mapping configuration
  fieldMappings: {
    nodeId: { type: 'relation', target: 'node', targetField: 'id' },
    processId: { type: 'relation', target: 'process', targetField: 'id' },
    branchId: { type: 'relation', target: 'branch', targetField: 'id' },
    tenantId: { type: 'scalar' }
  },

  // ============================================================================
  // JUNCTION AUTO-CREATION CONFIGURATION
  // ============================================================================
  junctionConfig: {
    // ONLY auto-create NodeProcess junctions when processes are created
    // NOT when rules are created (rules should use existing node-process relationships)
    autoCreateOnParentCreate: true,
    
    // Navigation context detection - if these fields are present, auto-create junction
    navigationContext: {
      // Auto-create when creating a Process with a nodeId context (process attached to node)
      nodeId: 'string'
    },
    
    // Default values for junction creation (none – keep payload Prisma-valid)
    defaults: {}
  }
} as const; 