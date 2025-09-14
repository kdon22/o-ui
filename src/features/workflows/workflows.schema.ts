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
      },
      table: {
        width: 'sm',
        showInTable: false
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
      },
      table: {
        width: 'sm',
        showInTable: false
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
      table: {
        width: 'sm',
        showInTable: false
      }
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
      },
      table: {
        width: 'xs'
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
        width: 'lg'
      },
      validation: [
        { type: 'required', message: 'Name is required' },
        { type: 'maxLength', value: 255, message: 'Name cannot exceed 255 characters' }
      ]
    },
    {
      key: 'workflowType',
      label: 'Type',
      type: 'select',
      required: true,
      tab: 'General',
      form: {
        row: 1,
        width: 'half',
        order: 2
      },
      table: {
        width: 'sm'
      },
      options: {
        static: [
          { value: 'SEQUENTIAL', label: 'Sequential' },
          { value: 'PARALLEL', label: 'Parallel' },
          { value: 'CONDITIONAL', label: 'Conditional' },
          { value: 'LOOP', label: 'Loop' }
        ]
      }
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
        width: 'xl',
        showInTable: false
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
      },
      table: {
        width: 'xs'
      }
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      tab: 'General',
      form: {
        row: 3,
        width: 'half',
        order: 2
      },
      table: {
        width: 'sm'
      },
      options: {
        static: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
          { value: 'URGENT', label: 'Urgent' }
        ]
      }
    },

    // ============================================================================
    // EXECUTION CONFIGURATION - EXECUTION TAB
    // ============================================================================
    {
      key: 'timeout',
      label: 'Timeout (seconds)',
      type: 'number',
      placeholder: '300',
      description: 'Maximum execution time in seconds',
      tab: 'Execution',
      form: {
        row: 1,
        width: 'half',
        order: 1
      },
      table: {
        width: 'sm',
        showInTable: false
      },
      validation: [
        { type: 'min', value: 1, message: 'Timeout must be at least 1 second' },
        { type: 'max', value: 7200, message: 'Timeout cannot exceed 2 hours' }
      ]
    },
    {
      key: 'retryCount',
      label: 'Retry Count',
      type: 'number',
      placeholder: '3',
      description: 'Number of retry attempts on failure',
      tab: 'Execution',
      form: {
        row: 1,
        width: 'half',
        order: 2
      },
      table: {
        width: 'sm',
        showInTable: false
      },
      validation: [
        { type: 'min', value: 0, message: 'Retry count cannot be negative' },
        { type: 'max', value: 10, message: 'Retry count cannot exceed 10' }
      ]
    },
    {
      key: 'environment',
      label: 'Environment',
      type: 'select',
      tab: 'Execution',
      form: {
        row: 2,
        width: 'half',
        order: 1
      },
      table: {
        width: 'sm',
        showInTable: false
      },
      options: {
        static: [
          { value: 'DEVELOPMENT', label: 'Development' },
          { value: 'STAGING', label: 'Staging' },
          { value: 'PRODUCTION', label: 'Production' }
        ]
      }
    },
    {
      key: 'logLevel',
      label: 'Log Level',
      type: 'select',
      tab: 'Execution',
      form: {
        row: 2,
        width: 'half',
        order: 2
      },
      table: {
        width: 'sm',
        showInTable: false
      },
      options: {
        static: [
          { value: 'DEBUG', label: 'Debug' },
          { value: 'INFO', label: 'Info' },
          { value: 'WARN', label: 'Warning' },
          { value: 'ERROR', label: 'Error' }
        ]
      }
    },

    // ============================================================================
    // DEPLOYMENT CONFIGURATION - DEPLOYMENT TAB
    // ============================================================================
    {
      key: 'deploymentStrategy',
      label: 'Deployment Strategy',
      type: 'select',
      tab: 'Deployment',
      form: {
        row: 1,
        width: 'half',
        order: 1
      },
      table: {
        width: 'sm',
        showInTable: false
      },
      options: {
        static: [
          { value: 'ROLLING', label: 'Rolling' },
          { value: 'BLUE_GREEN', label: 'Blue/Green' },
          { value: 'CANARY', label: 'Canary' }
        ]
      }
    },
    {
      key: 'deploymentStatus',
      label: 'Deployment Status',
      type: 'select',
      tab: 'Deployment',
      form: {
        row: 1,
        width: 'half',
        order: 2
      },
      table: {
        width: 'sm'
      },
      options: {
        static: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'DEPLOYING', label: 'Deploying' },
          { value: 'DEPLOYED', label: 'Deployed' },
          { value: 'FAILED', label: 'Failed' },
          { value: 'ROLLED_BACK', label: 'Rolled Back' }
        ]
      }
    },
    {
      key: 'lastDeployedAt',
      label: 'Last Deployed',
      type: 'date',
      description: 'When this workflow was last deployed',
      tab: 'Deployment',
      form: {
        row: 2,
        width: 'half',
        order: 1
      },
      table: {
        width: 'sm'
      }
    },
    {
      key: 'deployedBy',
      label: 'Deployed By',
      type: 'text',
      description: 'User who deployed this workflow',
      tab: 'Deployment',
      form: {
        row: 2,
        width: 'half',
        order: 2
      },
      table: {
        width: 'md',
        showInTable: false
      }
    },

    // ============================================================================
    // MONITORING FIELDS - MONITORING TAB
    // ============================================================================
    {
      key: 'executionCount',
      label: 'Execution Count',
      type: 'number',
      description: 'Total number of executions',
      tab: 'Monitoring',
      form: {
        row: 1,
        width: 'half',
        order: 1
      },
      table: {
        width: 'sm'
      }
    },
    {
      key: 'successRate',
      label: 'Success Rate (%)',
      type: 'number',
      description: 'Percentage of successful executions',
      tab: 'Monitoring',
      form: {
        row: 1,
        width: 'half',
        order: 2
      },
      table: {
        width: 'sm'
      }
    },
    {
      key: 'averageExecutionTime',
      label: 'Average Execution Time (ms)',
      type: 'number',
      description: 'Average execution time in milliseconds',
      tab: 'Monitoring',
      form: {
        row: 2,
        width: 'full'
      },
      table: {
        width: 'sm',
        showInTable: false
      }
    },
    {
      key: 'lastExecuted',
      label: 'Last Executed',
      type: 'date',
      description: 'When this workflow was last executed',
      tab: 'Monitoring',
      form: {
        row: 3,
        width: 'full'
      },
      table: {
        width: 'sm'
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
      table: {
        width: 'xs',
        showInTable: false
      }
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
      },
      table: {
        width: 'sm'
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
      },
      table: {
        width: 'md',
        showInTable: false
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
      },
      table: {
        width: 'md',
        showInTable: false
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
    nodeWorkflows: {
      type: 'many-to-many',
      relatedEntity: 'nodes',
      description: 'Nodes that use this workflow',
      junction: {
        tableName: 'nodeWorkflows', // ✅ Standard: node + workflows → nodeWorkflows
        field: 'workflowId',
        relatedField: 'nodeId'
      }
    },
    processes: {
      type: 'many-to-many',
      relatedEntity: 'processes',
      description: 'Processes included in this workflow',
      junction: {
        tableName: 'workflowProcesses', // ✅ Standard: workflow + processes → workflowProcesses
        field: 'workflowId',
        relatedField: 'processId'
      }
    },
    customerWorkflows: {
      type: 'many-to-many',
      relatedEntity: 'customers',
      description: 'Customers using this workflow',
      junction: {
        tableName: 'customerWorkflows', // ✅ Standard: customer + workflows → customerWorkflows
        field: 'workflowId',
        relatedField: 'customerId'
      }
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
    }
  },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================
  search: {
    fields: ['name', 'description', 'workflowType', 'deploymentStatus'],
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
    secondaryFields: ['workflowType', 'deploymentStatus', 'isActive', 'lastExecuted'],
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
// TYPE EXPORTS
// ============================================================================
export type Workflow = {
  id: string;
  name: string;
  description?: string;
  workflowType?: 'SEQUENTIAL' | 'PARALLEL' | 'CONDITIONAL' | 'EVENT_DRIVEN' | 'SCHEDULED' | 'HYBRID';
  executionMode?: 'SYNC' | 'ASYNC' | 'MIXED';
  priority?: number;
  timeout?: number;
  enableRetry?: boolean;
  enableRollback?: boolean;
  enableNotifications?: boolean;
  enableAuditLog?: boolean;
  definition?: Record<string, any>;
  triggers?: Record<string, any>;
  conditions?: Record<string, any>;
  variables?: Record<string, any>;
  deploymentStatus?: 'DRAFT' | 'DEPLOYED' | 'DEPRECATED' | 'ARCHIVED';
  deployedAt?: Date;
  deployedBy?: string;
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
// QUERY TYPES
// ============================================================================
export interface WorkflowQuery {
  tenantId: string;
  branchId?: string;
  type?: 'SEQUENTIAL' | 'PARALLEL' | 'CONDITIONAL' | 'EVENT_DRIVEN' | 'SCHEDULED' | 'HYBRID';
  deploymentStatus?: 'DRAFT' | 'DEPLOYED' | 'DEPRECATED' | 'ARCHIVED';
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'type' | 'deploymentStatus' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface WorkflowListQuery extends WorkflowQuery {
  includeInactive?: boolean;
  includeProcesses?: boolean;
  includeDeployments?: boolean;
  includeCustomers?: boolean;
}

// ============================================================================
// JUNCTION SCHEMAS: WORKFLOW RELATIONSHIPS
// ============================================================================

/**
 * WorkflowProcess Junction Schema - Merged from workflow-process.schema.ts
 * Handles the many-to-many relationship between workflows and processes
 */
export const WorkflowProcessSchema = z.object({
  workflowId: z.string(),
  processId: z.string(),
  tenantId: z.string(),
  branchId: z.string(),
});

export type WorkflowProcess = z.infer<typeof WorkflowProcessSchema>;

export const WORKFLOW_PROCESS_SCHEMA = {
  databaseKey: 'workflowProcesses', // ✅ Standard: workflow + processes → workflowProcesses
  modelName: 'WorkflowProcess',
  actionPrefix: 'workflowProcesses',
  schema: WorkflowProcessSchema,
  relations: ['process', 'workflow', 'branch'],
  primaryKey: ['workflowId', 'processId'],
  displayFields: ['workflowId', 'processId'],
  searchFields: ['workflowId', 'processId'],
  orderBy: [{ processId: 'asc' }],
  // Metadata for schema-driven index generation (only mark exceptions)
  notHasAuditFields: true,
  
  // ✅ JUNCTION: IndexedDB compound key configuration
  indexedDBKey: (record: WorkflowProcess) => `${record.workflowId}:${record.processId}`,
  
  // GOLD STANDARD: Junction field mapping configuration
  fieldMappings: {
    workflowId: { type: 'relation', target: 'workflow', targetField: 'id' },
    processId: { type: 'relation', target: 'process', targetField: 'id' },
    branchId: { type: 'relation', target: 'branch', targetField: 'id' },
    tenantId: { type: 'scalar' }
  },

  // ============================================================================
  // JUNCTION AUTO-CREATION CONFIGURATION
  // ============================================================================
  junctionConfig: {
    // When creating a workflow, check if we should auto-create WorkflowProcess junction
    autoCreateOnParentCreate: true,
    
    // Navigation context detection - if these fields are present, auto-create junction
    navigationContext: {
      processId: 'string' // If processId is provided in workflow creation, create WorkflowProcess
    },
    
    // Default values for junction creation
    defaults: {}
  }
} as const;

/**
 * CustomerWorkflow Junction Schema - Merged from customer-workflow.schema.ts
 * Handles the many-to-many relationship between customers and workflows
 */
export const CustomerWorkflowSchema = z.object({
  customerId: z.string(),
  workflowId: z.string(),
  tenantId: z.string(),
  branchId: z.string(),
});

export type CustomerWorkflow = z.infer<typeof CustomerWorkflowSchema>;

export const CUSTOMER_WORKFLOW_SCHEMA = {
  databaseKey: 'customerWorkflows', // ✅ Standard: customer + workflows → customerWorkflows
  modelName: 'CustomerWorkflow',
  actionPrefix: 'customerWorkflows',
  schema: CustomerWorkflowSchema,
  relations: ['customer', 'workflow', 'branch'],
  primaryKey: ['customerId', 'workflowId'],
  displayFields: ['customerId', 'workflowId'],
  searchFields: ['customerId', 'workflowId'],
  orderBy: [{ workflowId: 'asc' }],
  // Metadata for schema-driven index generation (only mark exceptions)
  notHasAuditFields: true,
  
  // ✅ JUNCTION: IndexedDB compound key configuration
  indexedDBKey: (record: CustomerWorkflow) => `${record.customerId}:${record.workflowId}`,
  
  // GOLD STANDARD: Junction field mapping configuration
  fieldMappings: {
    customerId: { type: 'relation', target: 'customer', targetField: 'id' },
    workflowId: { type: 'relation', target: 'workflow', targetField: 'id' },
    branchId: { type: 'relation', target: 'branch', targetField: 'id' },
    tenantId: { type: 'scalar' }
  },

  // ============================================================================
  // JUNCTION AUTO-CREATION CONFIGURATION
  // ============================================================================
  junctionConfig: {
    // When creating a workflow, check if we should auto-create CustomerWorkflow junction
    autoCreateOnParentCreate: true,
    
    // Navigation context detection - if these fields are present, auto-create junction
    navigationContext: {
      customerId: 'string' // If customerId is provided in workflow creation, create CustomerWorkflow
    },
    
    // Default values for junction creation
    defaults: {}
  }
} as const;

// ============================================================================
// JUNCTION SCHEMAS: WORKFLOW RELATIONSHIPS
// ============================================================================

/**
 * NodeWorkflow Junction Schema - Moved from nodes.schema.ts
 * Handles the many-to-many relationship between nodes and workflows
 */
export const NodeWorkflowSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  workflowId: z.string(),
  tenantId: z.string(),
  branchId: z.string(),
  sequence: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type NodeWorkflow = z.infer<typeof NodeWorkflowSchema>;

export const NODE_WORKFLOW_SCHEMA = {
  databaseKey: 'nodeWorkflows',
  modelName: 'NodeWorkflow',
  actionPrefix: 'nodeWorkflows',
  schema: NodeWorkflowSchema,
  relations: ['node', 'workflow', 'branch'],
  primaryKey: ['id'],
  displayFields: ['nodeId', 'workflowId', 'sequence'],
  searchFields: ['nodeId', 'workflowId'],
  orderBy: [{ sequence: 'asc' }],
  // No exception flags needed - has both tenant context and audit fields
  
  // ✅ JUNCTION: IndexedDB compound key configuration
  indexedDBKey: (record: NodeWorkflow) => `${record.nodeId}:${record.workflowId}`,
  
  // GOLD STANDARD: Junction field mapping configuration
  fieldMappings: {
    nodeId: { type: 'relation', target: 'node', targetField: 'id' },
    workflowId: { type: 'relation', target: 'workflow', targetField: 'id' },
    branchId: { type: 'relation', target: 'branch', targetField: 'id' },
    // Scalar fields (kept as-is in Prisma data)
    id: { type: 'scalar' },
    tenantId: { type: 'scalar' },
    sequence: { type: 'scalar' },
    createdAt: { type: 'scalar' },
    updatedAt: { type: 'scalar' }
  },

  // ============================================================================
  // JUNCTION AUTO-CREATION CONFIGURATION
  // ============================================================================
  junctionConfig: {
    // When creating a workflow, check if we should auto-create NodeWorkflow junction
    autoCreateOnParentCreate: true,
    
    // Navigation context detection - if these fields are present, auto-create junction
    navigationContext: {
      // Require both nodeId and workflowId to avoid accidental triggers from unrelated actions
      nodeId: 'string',
      workflowId: 'string',
      sequence: 'number'    // Optional: execution sequence within the workflow
    },
    
    // Default values for junction creation
    defaults: {
      sequence: 0
    }
  }
} as const; 