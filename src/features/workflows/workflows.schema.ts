/**
 * Workflow Schema - Process Orchestration and Customer Management
 * 
 * Single Source of Truth for:
 * - Workflow configuration and orchestration
 * - Process sequencing and dependencies
 * - Customer workflow associations
 * - Node workflow assignments
 * - Mobile-first responsive design
 * - Field validation and types
 * - Relationship management
 * - Deployment tracking
 * 
 * This schema will auto-generate the entire workflow management system.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import { z } from 'zod';

export const WORKFLOW_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'workflow',   // IndexedDB store + API endpoints
  modelName: 'Workflow',      // Prisma model access
  actionPrefix: 'workflow',   // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Workflows',
    description: 'Workflow orchestration that manages process execution and business operations',
    icon: 'flowchart',
    color: 'green'
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'lg',
    layout: 'compact',
    showDescriptions: true
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
      autoValue: { source: 'auto.uuid', required: true },
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      }
    },
    {
      key: 'originalWorkflowId',
      label: 'Original Workflow ID',
      type: 'text',
      description: 'Reference to the original workflow for branching',
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      }
    },

    // ============================================================================
    // BRANCHING FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      required: true,
      autoValue: { source: 'session.user.tenantId', required: true },
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      required: true,
      description: 'Current branch this workflow belongs to',
      autoValue: { source: 'session.user.branchContext.currentBranchId', required: true },
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      }
    },

    // ============================================================================
    // PRIMARY BUSINESS FIELDS - GENERAL TAB
    // ============================================================================
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter workflow name...',
      description: 'The display name for this workflow',
      tab: 'General',
      form: {
        row: 1,
        width: 'half',
        order: 1
      },
      table: {
        width: 'md'
      },
      validation: [
        { type: 'required', message: 'Name is required' },
        { type: 'maxLength', value: 255, message: 'Name cannot exceed 255 characters' }
      ]
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional description...',
      description: 'Additional details about this workflow',
      tab: 'General',
      form: {
        row: 2,
        width: 'full'
      },
      table: {
        width: 'lg',
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
      tab: 'General',
      form: {
        row: 3,
        width: 'half',
        order: 1
      }
    },

    // ============================================================================
    // AUDIT FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'version',
      label: 'Version',
      type: 'number',
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      },
      
    },
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
        width: 'sm'
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
      }
    },
    {
      key: 'createdBy',
      label: 'Created By',
      type: 'text',
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      }
    },
    {
      key: 'updatedBy',
      label: 'Updated By',
      type: 'text',
      form: {
        row: 1,
        width: 'full',
        showInForm: false
      }
    }
  ],

  // ============================================================================
  // RELATIONSHIP DEFINITIONS - STANDARDIZED ENTERPRISE JUNCTION NAMES
  // ============================================================================
  relationships: {
    tenant: {
      type: 'one-to-one',
      relatedEntity: 'tenants',
      description: 'Tenant that owns this workflow',
      foreignKey: 'tenantId',
      cacheStrategy: 'memory',
      preload: false
    },
    branch: {
      type: 'one-to-one',
      relatedEntity: 'branches',
      description: 'Branch that this workflow belongs to',
      foreignKey: 'branchId',
      cacheStrategy: 'memory',
      preload: false
    },
    originalWorkflow: {
      type: 'one-to-one',
      relatedEntity: 'workflows',
      description: 'Original workflow this is a branched copy of',
      foreignKey: 'originalWorkflowId',
      cacheStrategy: 'memory',
      preload: false
    },
    workflowTags: {
      type: 'many-to-many',
      relatedEntity: 'tags',
      description: 'Tags associated with this workflow',
      junction: {
        tableName: 'workflowTags', // ✅ Standard: workflow + tags → workflowTags
        field: 'workflowId',
        relatedField: 'tagId'
      }
    },
    queueWorkflows: {
      type: 'many-to-many',
      relatedEntity: 'queues',
      description: 'Queue assignments for this workflow (queue-based execution system)',
      junction: {
        tableName: 'queueWorkflows', // ✅ Standard: queue + workflows → queueWorkflows
        field: 'workflowId',
        relatedField: 'queueId'
      }
    }
  },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================
  search: {
    fields: ['name', 'description'],
    placeholder: 'Search workflows...',
    mobileFilters: true,
    fuzzy: true
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
        id: 'execute',
        label: 'Execute',
        icon: 'play',
        description: 'Execute this workflow',
        handler: 'executeWorkflow'
      },
      {
        id: 'deploy',
        label: 'Deploy',
        icon: 'upload',
        description: 'Deploy this workflow',
        handler: 'deployWorkflow'
      },
      {
        id: 'rollback',
        label: 'Rollback',
        icon: 'undo',
        description: 'Rollback this deployment',
        handler: 'rollbackWorkflow'
      },
      {
        id: 'viewLogs',
        label: 'View Logs',
        icon: 'file-text',
        description: 'View execution logs',
        handler: 'viewWorkflowLogs'
      },
      {
        id: 'schedule',
        label: 'Schedule',
        icon: 'clock',
        description: 'Schedule this workflow',
        handler: 'scheduleWorkflow'
      },
      {
        id: 'viewMetrics',
        label: 'View Metrics',
        icon: 'bar-chart',
        description: 'View workflow metrics',
        handler: 'viewWorkflowMetrics'
      },
      {
        id: 'exportDefinition',
        label: 'Export Definition',
        icon: 'download',
        description: 'Export workflow definition',
        handler: 'exportWorkflowDefinition'
      }
    ]
  },

  // ============================================================================
  // MOBILE-FIRST LAYOUT
  // ============================================================================
  mobile: {
    cardFormat: 'detailed',
    primaryField: 'name',
    secondaryFields: ['isActive'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right',
    swipeActions: [
      {
        id: 'execute',
        label: 'Execute',
        icon: 'play',
        description: 'Execute this workflow',
        handler: 'executeWorkflow'
      },
      {
        id: 'deploy',
        label: 'Deploy',
        icon: 'upload',
        description: 'Deploy this workflow',
        handler: 'deployWorkflow'
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: 'edit',
        description: 'Edit this workflow',
        handler: 'editWorkflow'
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'trash',
        description: 'Delete this workflow',
        handler: 'deleteWorkflow'
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
    density: 'normal',
    rowActions: true,
    bulkActions: true
  },

  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================
  table: {
    width: 'full',
    bulkSelect: true,
    columnFilter: true,
    sortableColumns: true,
    bulkSelectOptions: [
      {
        id: 'delete',
        label: 'Delete Selected',
        icon: 'trash',
        description: 'Delete selected workflows',
        handler: 'bulkDeleteWorkflows',
        className: 'text-red-600',
        confirmMessage: 'Are you sure you want to delete the selected workflows?'
      },
      {
        id: 'execute',
        label: 'Execute Selected',
        icon: 'play',
        description: 'Execute selected workflows',
        handler: 'bulkExecuteWorkflows'
      },
      {
        id: 'deploy',
        label: 'Deploy Selected',
        icon: 'upload',
        description: 'Deploy selected workflows',
        handler: 'bulkDeployWorkflows'
      },
      {
        id: 'activate',
        label: 'Activate Selected',
        icon: 'check',
        description: 'Activate selected workflows',
        handler: 'bulkActivateWorkflows'
      },
      {
        id: 'deactivate',
        label: 'Deactivate Selected',
        icon: 'x',
        description: 'Deactivate selected workflows',
        handler: 'bulkDeactivateWorkflows'
      },
      {
        id: 'export',
        label: 'Export Selected',
        icon: 'download',
        description: 'Export selected workflows',
        handler: 'bulkExportWorkflows'
      }
    ]
  },

  // ============================================================================
  // PERMISSIONS
  // ============================================================================
  permissions: {
    create: 'workflow:create',
    update: 'workflow:update',
    delete: 'workflow:delete',
    view: 'workflow:view',
    custom: {
      execute: 'workflow:execute',
      deploy: 'workflow:deploy',
      rollback: 'workflow:rollback',
      viewLogs: 'workflow:logs',
      schedule: 'workflow:schedule',
      viewMetrics: 'workflow:metrics',
      exportDefinition: 'workflow:export'
    }
  },

  // ============================================================================
  // HOOKS FOR CUSTOM LOGIC
  // ============================================================================
  hooks: {
    beforeCreate: 'validateWorkflowDefinition',
    afterCreate: 'indexWorkflowMetadata',
    beforeUpdate: 'validateWorkflowDefinition',
    afterUpdate: 'reindexWorkflowMetadata',
    beforeDelete: 'checkWorkflowDependencies',
    afterDelete: 'cleanupWorkflowArtifacts'
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
};

// ============================================================================
// QUEUE-WORKFLOW JUNCTION SCHEMA - QUEUE-BASED EXECUTION SYSTEM
// ============================================================================

export const QueueWorkflowSchema = z.object({
  id: z.string(),
  queueId: z.string(),
  workflowId: z.string(),
  tenantId: z.string(),
  branchId: z.string(),
  isActive: z.boolean(),
  priority: z.number(),
  assignedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  originalQueueWorkflowId: z.string().nullable(),
});

export type QueueWorkflow = z.infer<typeof QueueWorkflowSchema>;

export const QUEUE_WORKFLOW_SCHEMA = {
  databaseKey: 'queueWorkflows',
  modelName: 'QueueWorkflow',
  actionPrefix: 'queueWorkflows',
  schema: QueueWorkflowSchema,
  relations: ['queue', 'workflow', 'branch'],
  primaryKey: ['id'],
  
  // ✅ JUNCTION: IndexedDB compound key configuration
  indexedDBKey: (record: QueueWorkflow) => `${record.queueId}:${record.workflowId}`,
  
  // Junction auto-creation configuration
  junctionConfig: {
    autoCreateOnParentCreate: true,
    navigationContext: {
      queueId: 'string',    // If queueId provided in workflow creation, create QueueWorkflow
      workflowId: 'string'  // If workflowId provided in queue creation, create QueueWorkflow
    },
    defaults: {
      isActive: true,
      priority: 0
    }
  }
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Workflow = {
  id: string;
  name: string;
  description?: string;
  executionMode?: 'SYNC' | 'ASYNC' | 'MIXED';
  enableRetry?: boolean;
  enableRollback?: boolean;
  enableNotifications?: boolean;
  enableAuditLog?: boolean;
  definition?: Record<string, any>;
  triggers?: Record<string, any>;
  conditions?: Record<string, any>;
  variables?: Record<string, any>;
  tenantId: string;
  branchId: string;
  originalWorkflowId?: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
};

export type CreateWorkflow = Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>;
export type UpdateWorkflow = Partial<Omit<Workflow, 'id' | 'createdAt' | 'tenantId'>>;

// ============================================================================
// NOTE: WorkflowProcess relationship removed - workflows now use queue-based execution
// ============================================================================


// ============================================================================
// NOTE: NodeWorkflow and CustomerWorkflow relationships removed
// Workflows are now queue-based only and no longer directly assigned to nodes/customers
// ============================================================================ 