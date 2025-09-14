/**
 * Rule Schema - Business Logic and Execution Rules
 * 
 * Single Source of Truth for:
 * - Business rules and logic configuration
 * - Code editing and validation
 * - Rule execution and monitoring
 * - Mobile-first responsive design
 * - Field validation and types
 * - Relationship management
 * - Python integration
 * - Documentation system
 * - Junction table management (ProcessRule)
 * 
 * This schema will auto-generate the entire rule management system.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import { z } from 'zod';

export const RULE_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'rule',       // IndexedDB store + API endpoints
  modelName: 'Rule',          // Prisma model access
  actionPrefix: 'rule',       // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Rules',
    description: 'Business rules and logic configuration for automated processing',
    icon: 'code',
    color: 'orange'
  },

  // ============================================================================
  // FORM CONFIGURATION
  // ============================================================================
  form: {
    width: 'xl',
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
      autoValue: {
        source: 'auto.uuid',
        required: true
      },
    },
    {
      key: 'idShort',
      label: 'Short ID',
      type: 'text',
      required: true,
      description: 'Short, human-readable ID for navigation (e.g., R8K9L3)',
      autoValue: {
        source: 'auto.ruleShortId',
        required: true
      },
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
      },
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      required: true,
      description: 'Current branch this rule belongs to',
      autoValue: {
        source: 'session.user.branchContext.currentBranchId',
        required: true
      },
    },

    // ============================================================================
    // PRIMARY BUSINESS FIELDS - GENERAL TAB
    // ============================================================================
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter rule name...',
      description: 'The display name for this rule',
      clickable: true,
      clickAction: {
        type: 'navigate',
        url: '/rules/{idShort}',
        target: '_self'
      },
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
      key: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Optional description...',
      description: 'Additional details about this rule',
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
      key: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      defaultValue: 'BUSINESS',
      form: {
        row: 1,
        width: 'sm',
        order: 2
      },
      options: {
        static: [
          { value: 'BUSINESS', label: 'Business' },
          { value: 'UTILITY', label: 'Utility' },
          { value: 'GLOBAL_VAR', label: 'Global Variable' },
        ]
      },
      table: {
        width: 'sm'
      }
    },
    {
      key: 'runOrder',
      label: 'Run Order',
      type: 'number',
      required: false,
      defaultValue: null,
      placeholder: '1.0',
      description: 'Execution order (float to allow inserting between integers)',
      form: {
        row: 3,
        width: 'xs',
        order: 1,
      },
      table: {
        width: 'sm'
      },
      validation: [
        { type: 'min', value: 0, message: 'Run order cannot be negative' },
        { type: 'max', value: 999999, message: 'Run order too large' }
      ]
    },
    {
      key: 'requesterName',
      label: 'Requester Name',
      type: 'text',
      required: false,
      placeholder: 'system-name or user-identifier',
      description: 'Identifier for the system/user requesting rule execution',
      form: {
        row: 3,
        width: 'lg',
        order: 2
      },
    },
    {
      key: 'tagIds',
      label: 'Tags',
      type: 'multiSelect',
      required: false,
      defaultValue: [],
      placeholder: 'Click to add tags...',
      description: 'Tags for categorizing and organizing this rule',
      form: {
        row: 5,
        width: 'full',
        order: 1
      },
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      required: false,
      defaultValue: true
    },
    

    // ============================================================================
    // CODE CONFIGURATION - CODE TAB
    // ============================================================================
    {
      key: 'pythonName',
      label: 'Python Function Name',
      type: 'text',
      required: false,
      placeholder: 'execute_customer_validation',
      description: 'Python function name (auto-generated from rule name)',
      autoValue: {
        source: 'auto.uuid',
        required: false
      },
      validation: [
        { type: 'required', message: 'Python function name is required' },
        { type: 'pattern', value: '^[a-zA-Z_][a-zA-Z0-9_]*$', message: 'Must be a valid Python function name' }
      ]
    },
    {
      key: 'sourceCode',
      label: 'Business Rules',
      type: 'richText',
      validation: [
        { type: 'maxLength', value: 10000, message: 'Source code cannot exceed 10,000 characters' }
      ]
    },
    {
      key: 'pythonCode',
      label: 'Generated Python Code',
      type: 'richText',
      description: 'Auto-generated Python code (read-only)',
    },
    {
      key: 'sourceMap',
      label: 'Source Map',
      type: 'json',
      required: false,
      description: 'Mapping between business rules and generated Python (for debugging)'
    },
    {
      key: 'pythonCodeHash',
      label: 'Python Code Hash',
      type: 'text',
      required: false
    },

    // ============================================================================
    // EXECUTION CONFIGURATION - EXECUTION TAB
    // ============================================================================
    {
      key: 'requirements',
      label: 'Requirements',
      type: 'textarea',
      required: false,
      placeholder: 'Prerequisites or dependencies for this rule...',
      description: 'Any prerequisites or dependencies needed for rule execution',
    },
    {
      key: 'frontEndRule',
      label: 'Frontend Rule',
      type: 'switch',
      required: false,
      defaultValue: true,
      description: 'Is this rule for frontend processing?',
      form: {
        row: 4,
        width: 'half',
        order: 1
      },
    },
    {
      key: 'queueRule',
      label: 'Queue Rule',
      type: 'switch',
      required: false,
      defaultValue: true,
      description: 'Is this rule related to queue processing?',
      form: {
        row: 4,
        width: 'half',
        order: 2
      },
    },
    {
      key: 'schema',
      label: 'Utility Schema',
      type: 'json',
      required: false,
      placeholder: '{"parameters": [...], "returnType": "string"}',
      description: 'Complete UnifiedSchema object for UTILITY rules (function definition)',
    },
    {
      key: 'executionMode',
      label: 'Execution Mode',
      type: 'select',
      required: false,
      defaultValue: 'SYNC',
      description: 'Automatically set based on run order (0 = SYNC, others = ASYNC)',
      options: {
        static: [
          { value: 'SYNC', label: 'Synchronous' },
          { value: 'ASYNC', label: 'Asynchronous' }
        ]
      }
    },

    // ============================================================================
    // AUDIT FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'version',
      label: 'Version',
      type: 'number'
    },
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date'
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date'
    },
    {
      key: 'createdById',  // 🚀 FIXED: Changed from 'createdBy' to 'createdById'
      label: 'Created By',
      type: 'text'
    },
    {
      key: 'updatedById',  // 🚀 FIXED: Changed from 'updatedBy' to 'updatedById'
      label: 'Updated By',
      type: 'text'
    }
  ],

  // ============================================================================
  // RELATIONSHIP DEFINITIONS - STANDARDIZED ENTERPRISE JUNCTION NAMES
  // ============================================================================
  relationships: {
    tenant: {
      type: 'one-to-one',
      relatedEntity: 'tenants',
      description: 'Tenant that owns this rule',
      foreignKey: 'tenantId',
      cacheStrategy: 'memory',
      preload: false
    },
    branch: {
      type: 'one-to-one',
      relatedEntity: 'branches',
      description: 'Branch that this rule belongs to',
      foreignKey: 'branchId',
      cacheStrategy: 'memory',
      preload: false
    },
    originalRule: {
      type: 'one-to-one',
      relatedEntity: 'rules',
      description: 'Original rule this is a branched copy of',
      foreignKey: 'originalRuleId',
      cacheStrategy: 'memory',
      preload: false
    },
    processes: {
      type: 'many-to-many',
      relatedEntity: 'processes',
      description: 'Processes that use this rule',
      junction: {
        tableName: 'processRules', // ✅ Standard: process + rules → processRules
        field: 'ruleId',
        relatedField: 'processId'
      }
    },
    ruleIgnores: {
      type: 'many-to-many',
      relatedEntity: 'nodes',
      description: 'Nodes that ignore this rule',
      junction: {
        tableName: 'ruleIgnores', // ✅ Standard: rule + ignores → ruleIgnores
        field: 'ruleId',
        relatedField: 'nodeId'
      }
    },
    ruleTags: {
      type: 'many-to-many',
      relatedEntity: 'tags',
      description: 'Tags associated with this rule',
      junction: {
        tableName: 'ruleTags', // ✅ Standard: rule + tags → ruleTags
        field: 'ruleId',
        relatedField: 'tagId'
      }
    }
  },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================
  search: {
    fields: ['name', 'description', 'category', 'tags'],
    placeholder: 'Search rules...',
    mobileFilters: true,
    fuzzy: true
  },

  // ============================================================================
  // FILTERING CONFIGURATION
  // ============================================================================
  filtering: {
    level1: {
      title: 'Process Types',
      filterField: 'processType',
      tabs: [
        { id: 'UTR', label: 'UTR', value: 'UTR', description: 'Universal Transactional Records' },
        { id: 'SCHEDULED', label: 'Scheduled', value: 'SCHEDULED', description: 'Scheduled processes' },
        { id: 'TICKETING', label: 'Ticketing', value: 'TICKETING', description: 'Ticketing processes' },
        { id: 'PRE_QUEUE', label: 'Pre-Queue', value: 'PRE_QUEUE', description: 'Pre-queue processes' },
        { id: 'POST_QUEUE', label: 'Post-Queue', value: 'POST_QUEUE', description: 'Post-queue processes' },
        { id: 'VIRTUAL_PAY', label: 'Virtual Pay', value: 'VIRTUAL_PAY', description: 'Virtual payment processes' },
        { id: 'FARE_CHECK', label: 'Fare Check', value: 'FARE_CHECK', description: 'Fare checking processes' },
        { id: 'SEAT_CHECK', label: 'Seat Check', value: 'SEAT_CHECK', description: 'Seat checking processes' }
      ],
      showAll: true,
      defaultTab: 'all',
      addButton: {
        label: 'Add Rule',
        action: 'create',
        icon: 'plus'
      }
    },
    level2: {
      title: 'Process Names',
      filterField: 'processName',
      groupBy: 'processId',
      showAll: true,
      emptyStateMessage: 'No rules found for this process'
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
        id: 'execute',
        label: 'Execute',
        icon: 'play',
        description: 'Execute this rule',
        handler: 'executeRule'
      },
      {
        id: 'test',
        label: 'Test',
        icon: 'flask',
        description: 'Test this rule',
        handler: 'testRule'
      },
      {
        id: 'validate',
        label: 'Validate',
        icon: 'check',
        description: 'Validate rule code',
        handler: 'validateRule'
      },
      {
        id: 'viewLogs',
        label: 'View Logs',
        icon: 'file-text',
        description: 'View execution logs',
        handler: 'viewRuleLogs'
      },
      {
        id: 'exportCode',
        label: 'Export Code',
        icon: 'download',
        description: 'Export rule code',
        handler: 'exportRuleCode'
      },
      {
        id: 'viewHistory',
        label: 'View History',
        icon: 'history',
        description: 'View rule history',
        handler: 'viewRuleHistory'
      }
    ]
  },

  // ============================================================================
  // MOBILE-FIRST LAYOUT
  // ============================================================================
  mobile: {
    cardFormat: 'detailed',
    primaryField: 'name',
    secondaryFields: ['category', 'priority', 'isActive', 'lastExecuted'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right',
    swipeActions: [
      {
        id: 'execute',
        label: 'Execute',
        icon: 'play',
        description: 'Execute this rule',
        handler: 'executeRule'
      },
      {
        id: 'test',
        label: 'Test',
        icon: 'flask',
        description: 'Test this rule',
        handler: 'testRule'
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: 'edit',
        description: 'Edit this rule',
        handler: 'editRule'
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'trash',
        description: 'Delete this rule',
        handler: 'deleteRule'
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
    contextMenu: [
      {
        id: 'edit',
        label: 'Edit Rule',
        icon: 'edit',
        action: 'edit',
        actionType: 'inline-edit'
      },
      {
        id: 'duplicate',
        label: 'Duplicate Rule',
        icon: 'copy',
        action: 'duplicate',
        actionType: 'handler'
      },
      { separator: true, id: 'sep1' },
      {
        id: 'execute',
        label: 'Execute Rule',
        icon: 'play',
        action: 'executeRule',
        actionType: 'handler',
        conditions: {
          field: 'isActive',
          operator: 'equals',
          value: true
        }
      },
      {
        id: 'test',
        label: 'Test Rule',
        icon: 'flask',
        action: 'testRule',
        actionType: 'handler'
      },
      {
        id: 'validate',
        label: 'Validate Code',
        icon: 'check',
        action: 'validateRule',
        actionType: 'handler'
      },
      { separator: true, id: 'sep2' },
      {
        id: 'ignore',
        label: 'Ignore Rule',
        icon: 'x',
        action: 'ignoreRule',
        actionType: 'handler',
        contextRequirements: {
          nodeId: true
        },
        conditions: {
          field: 'isActive',
          operator: 'equals',
          value: true
        }
      },
      {
        id: 'unignore',
        label: 'Unignore Rule',
        icon: 'check',
        action: 'unignoreRule',
        actionType: 'handler',
        contextRequirements: {
          nodeId: true
        },
        className: 'text-green-600'
      },
      { separator: true, id: 'sep3' },
      {
        id: 'viewLogs',
        label: 'View Execution Logs',
        icon: 'file-text',
        action: 'viewRuleLogs',
        actionType: 'handler'
      },
      {
        id: 'viewHistory',
        label: 'View Rule History',
        icon: 'history',
        action: 'viewHistory',
        actionType: 'handler'
      },
      {
        id: 'exportCode',
        label: 'Export Code',
        icon: 'download',
        action: 'exportRuleCode',
        actionType: 'handler'
      },

      { separator: true, id: 'sep4' },
      {
        id: 'delete',
        label: 'Delete Rule',
        icon: 'trash',
        action: 'delete',
        actionType: 'modal',
        confirmMessage: 'Are you sure you want to delete this rule? This action cannot be undone.',
        className: 'text-red-600'
      }
    ],
    bulkSelectOptions: [
      {
        id: 'delete',
        label: 'Delete Selected',
        icon: 'trash',
        description: 'Delete selected rules',
        handler: 'bulkDeleteRules',
        className: 'text-red-600',
        confirmMessage: 'Are you sure you want to delete the selected rules?'
      },
      {
        id: 'execute',
        label: 'Execute Selected',
        icon: 'play',
        description: 'Execute selected rules',
        handler: 'bulkExecuteRules'
      },
      {
        id: 'test',
        label: 'Test Selected',
        icon: 'flask',
        description: 'Test selected rules',
        handler: 'bulkTestRules'
      },
      {
        id: 'activate',
        label: 'Activate Selected',
        icon: 'check',
        description: 'Activate selected rules',
        handler: 'bulkActivateRules'
      },
      {
        id: 'deactivate',
        label: 'Deactivate Selected',
        icon: 'x',
        description: 'Deactivate selected rules',
        handler: 'bulkDeactivateRules'
      },
      {
        id: 'export',
        label: 'Export Selected',
        icon: 'download',
        description: 'Export selected rules',
        handler: 'bulkExportRules'
      }
    ]
  },



  // ============================================================================
  // PERMISSIONS
  // ============================================================================
  permissions: {
    create: 'rule:create',
    update: 'rule:update',
    delete: 'rule:delete',
    view: 'rule:view',
    custom: {
      execute: 'rule:execute',
      test: 'rule:test',
      validate: 'rule:validate',
      viewLogs: 'rule:logs',
      exportCode: 'rule:export'
    }
  },

  // ============================================================================
  // HOOKS FOR CUSTOM LOGIC
  // ============================================================================
  hooks: {
    beforeCreate: 'validateRuleCode',
    afterCreate: 'indexRuleCode',
    beforeUpdate: 'validateRuleCode',
    afterUpdate: 'reindexRuleCode',
    beforeDelete: 'checkRuleDependencies',
    afterDelete: 'cleanupRuleLogs'
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Rule = {
  id: string;
  idShort?: string;
  name: string;
  description?: string;
  type: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR';
  pythonName?: string;
  sourceCode?: string;     // Business rules in natural language
  pythonCode?: string;     // Generated Python code
  sourceMap?: any;         // JSON source map for debugging (contains meta.generatedAt)
  pythonCodeHash?: string;
  runOrder?: number;
  executionMode: 'SYNC' | 'ASYNC';
  requirements?: string;
  frontEndRule?: boolean;
  queueRule?: boolean;
  requesterName?: string;
  
  // Utility function specific fields
  parameters?: any;        // Array of UtilityParameter objects for UTILITY type rules
  returnType?: string;     // Return type for UTILITY functions
  
  tenantId: string;
  branchId: string;
  originalRuleId?: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;    // 🚀 FIXED: Changed from createdBy to createdById
  updatedById?: string;    // 🚀 FIXED: Changed from updatedBy to updatedById
};

export type CreateRule = Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'version'> & {
  pythonName?: string; // Make pythonName optional on create (auto-generated)
};
export type UpdateRule = Partial<Omit<Rule, 'id' | 'createdAt' | 'tenantId'>>;

// ============================================================================
// QUERY TYPES
// ============================================================================
export interface RuleQuery {
  tenantId: string;
  branchId?: string;
  type?: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR';
  isActive?: boolean;
  executionMode?: 'SYNC' | 'ASYNC';
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'type' | 'runOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RuleListQuery extends RuleQuery {
  includeInactive?: boolean;
  includeGlobalVars?: boolean;
  includeCode?: boolean;
}

// ============================================================================
// JUNCTION SCHEMA: PROCESS-RULE
// ============================================================================

/**
 * ProcessRule Junction Schema - Merged from process-rule.schema.ts
 * Handles the many-to-many relationship between processes and rules
 */
export const ProcessRuleSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  processId: z.string(),
  tenantId: z.string(),
  order: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  branchId: z.string(),
  originalProcessRuleId: z.string().nullable(),
});

export type ProcessRule = z.infer<typeof ProcessRuleSchema>;

export const PROCESS_RULE_SCHEMA = {
  databaseKey: 'processRules', // ✅ Standard: process + rules → processRules
  modelName: 'ProcessRule',
  actionPrefix: 'processRules',
  schema: ProcessRuleSchema,
  relations: ['process', 'rule', 'branch', 'originalProcessRule', 'branchedProcessRules'],
  primaryKey: ['id'],
  displayFields: ['ruleId', 'processId', 'order'],
  searchFields: ['ruleId', 'processId'],
  orderBy: [{ order: 'asc' }],
  // No exception flags needed - has both tenant context and audit fields
  
  // ✅ JUNCTION: IndexedDB compound key configuration
  indexedDBKey: (record: ProcessRule) => `${record.processId}:${record.ruleId}`,
  
  // GOLD STANDARD: Junction field mapping configuration
  fieldMappings: {
    ruleId: { type: 'relation', target: 'rule', targetField: 'id' },
    processId: { type: 'relation', target: 'process', targetField: 'id' },
    branchId: { type: 'relation', target: 'branch', targetField: 'id' },
    originalProcessRuleId: { type: 'relation', target: 'originalProcessRule', targetField: 'id' },
    // Scalar fields (kept as-is in Prisma data)
    id: { type: 'scalar' },
    tenantId: { type: 'scalar' },
    order: { type: 'scalar' },
    isActive: { type: 'scalar' },
    createdAt: { type: 'scalar' },
    updatedAt: { type: 'scalar' },
    createdById: { type: 'scalar' },
    updatedById: { type: 'scalar' }
  },

  // ============================================================================
  // JUNCTION AUTO-CREATION CONFIGURATION
  // ============================================================================
  junctionConfig: {
    // When creating a rule, check if we should auto-create ProcessRule junction
    autoCreateOnParentCreate: true,
    
    // Navigation context detection - if these fields are present, auto-create junction
    navigationContext: {
      processId: 'string' // If processId is provided in rule creation, create ProcessRule
    },
    
    // Default values for junction creation
    defaults: {
      order: 0,
      isActive: true
    }
  }
} as const;

/**
 * RuleIgnore Junction Schema - Merged from rule-ignore.schema.ts
 * Handles nodes that ignore specific rules
 */
export const RuleIgnoreSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  nodeId: z.string(),
  ruleId: z.string(),
  branchId: z.string(),
  ignoredAt: z.string(),
  ignoredBy: z.string().nullable(),
  unignoredAt: z.string().nullable(),
  unignoredBy: z.string().nullable(),
  originalRuleIgnoreId: z.string().nullable(),
});

export type RuleIgnore = z.infer<typeof RuleIgnoreSchema>;

export const RULE_IGNORE_SCHEMA = {
  databaseKey: 'ruleIgnores', // ✅ Standard: rule + ignores → ruleIgnores
  modelName: 'RuleIgnore',
  actionPrefix: 'ruleIgnores',
  schema: RuleIgnoreSchema,
  relations: ['tenant', 'rule', 'branch', 'originalRuleIgnore', 'branchedRuleIgnores'],
  primaryKey: ['id'],
  displayFields: ['nodeId', 'ruleId', 'ignoredAt'],
  searchFields: ['nodeId', 'ruleId'],
  orderBy: [{ ignoredAt: 'desc' }],
  // Metadata for schema-driven index generation (only mark exceptions)
  notHasAuditFields: true,
  
  // ✅ JUNCTION: IndexedDB compound key configuration
  indexedDBKey: (record: RuleIgnore) => `${record.nodeId}:${record.ruleId}`,
  
  // GOLD STANDARD: Junction field mapping configuration
  fieldMappings: {
    ruleId: { type: 'relation', target: 'rule', targetField: 'id' },
    branchId: { type: 'relation', target: 'branch', targetField: 'id' },
    originalRuleIgnoreId: { type: 'relation', target: 'originalRuleIgnore', targetField: 'id' },
    tenantId: { type: 'relation', target: 'tenant', targetField: 'id' }, // Fixed: This is a relation, not scalar
    // Scalar fields (kept as-is in Prisma data)
    id: { type: 'scalar' },
    nodeId: { type: 'scalar' }, // Note: This is a scalar, not a relation in the schema
    ignoredAt: { type: 'scalar' },
    ignoredBy: { type: 'scalar' },
    unignoredAt: { type: 'scalar' },
    unignoredBy: { type: 'scalar' }
  },

  // ============================================================================
  // JUNCTION AUTO-CREATION CONFIGURATION
  // ============================================================================
  junctionConfig: {
    // When creating a rule, check if we should auto-create RuleIgnore junction
    autoCreateOnParentCreate: true,
    
    // Navigation context detection - if these fields are present, auto-create junction
    navigationContext: {
      nodeId: 'string', // If nodeId is provided in rule creation, create RuleIgnore
      ignoredAt: 'string' // When the rule was ignored
    },
    
    // Default values for junction creation
    defaults: {
      ignoredAt: () => new Date().toISOString()
    }
  }
} as const; 