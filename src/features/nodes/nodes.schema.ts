/**
 * Node Schema - Primary Tree Navigation Resource
 * 
 * Single Source of Truth for:
 * - Tree navigation component
 * - CRUD operations and forms
 * - Mobile-first responsive design
 * - Field validation and types
 * - Relationship management
 * - Context menu actions
 * - Search and filtering
 * 
 * This schema will auto-generate the entire tree navigation system
 * replacing 1,000+ lines of fragmented TreeNavigation code.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import { z } from 'zod';

export const NODE_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'node',       // IndexedDB store + API endpoints
  modelName: 'Node',          // Prisma model access
  actionPrefix: 'node',       // Action naming

  // ============================================================================
  // UI DISPLAY CONFIGURATION
  // ============================================================================
  display: {
    title: 'Nodes',
    description: 'Hierarchical business entities that form the organizational structure',
    icon: 'folder',
    color: 'blue'
  },

  // (Form config optional) Keeping lean – components infer sensible defaults

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
      // hidden from form
    },
    {
      key: 'idShort',
      label: 'Short ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'auto.nodeShortId',
        required: true
      },
      // hidden from form
    },
    {
      key: 'originalNodeId',
      label: 'Original Node ID',
      type: 'text',
      // hidden from form
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
      // hidden from form
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text',
      required: true,
      autoValue: {
        source: 'session.user.branchContext.currentBranchId',
        fallback: 'main',
        required: true
      },
      // hidden from form
    },


    // ============================================================================
    // PRIMARY BUSINESS FIELDS - GENERAL TAB
    // ============================================================================
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      form: { row: 1, width: 'full'},
      validation: [
        { type: 'required', message: 'Name is required' },
        { type: 'minLength', value: 1, message: 'Name cannot be empty' },
        { type: 'maxLength', value: 255, message: 'Name cannot exceed 255 characters' }
      ]
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      defaultValue: 'NODE',
      options: {
        static: [
          { value: 'NODE', label: 'Node' },
          { value: 'CUSTOMER', label: 'Customer' }
        ]
      }
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea',
      form: { row: 2, width: 'full'},
      
      validation: [
        { type: 'maxLength', value: 1000, message: 'Description cannot exceed 1000 characters' }
      ]
    },
    {
      key: 'overrideKey',
      label: 'Override Key',
      type: 'text',
      form: { row: 3, width: 'lg'},
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch',
      required: true,
      defaultValue: true,
    },

    // ============================================================================
    // TREE STRUCTURE FIELDS - HIERARCHY TAB
    // ============================================================================
    {
      key: 'parentId',
      label: 'Parent',
      type: 'select',
      required: false,
      // UI helper, but persisted when present
      transient: false,
      autoValue: {
        source: 'navigation.parentId'
      },
      options: {
        dynamic: {
          resource: 'nodes',
          valueField: 'id',
          labelField: 'name'
        }
      }
    },
    {
      key: 'level',
      label: 'Level',
      type: 'number',
      computed: true,
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      type: 'number',
      computed: true,
    },
    {
      key: 'childCount',
      label: 'Children',
      type: 'number',
      computed: true,
    },

    // ============================================================================
    // RULE CONFIGURATION - RULES TAB
    // ============================================================================
    // NOTE: ruleIgnores is handled through junction tables, not as a direct field

    // ============================================================================
    // AUDIT FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'createdAt',
      label: 'Created',
      type: 'date',
      // hidden from form
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      type: 'date',
      // hidden from form
    },
    {
      key: 'createdById',
      label: 'Created By ID',
      type: 'text',
      // hidden from form
    },
    {
      key: 'updatedById',
      label: 'Updated By ID',
      type: 'text',
      form: { row: 1, width: 'full', showInForm: false }
    },
    {
      key: 'version',
      label: 'Version',
      type: 'number',
    },

    // ============================================================================
    // COMPUTED TREE FIELDS (Performance Optimization) - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: 'path',
      label: 'Tree Path',
      type: 'json',
      defaultValue: [],
      computed: true,
    },
    {
      key: 'ancestorIds',
      label: 'Ancestor IDs',
      type: 'json',
      defaultValue: [],
      computed: true,
    },
    {
      key: 'isLeaf',
      label: 'Is Leaf',
      type: 'switch',
      computed: true,
    },

    // ============================================================================
    // CACHE OPTIMIZATION FIELDS - HIDDEN FROM FORMS
    // ============================================================================
    {
      key: '_cached',
      label: 'Cached',
      type: 'switch',
      description: 'Whether this record is from cache',
      // hidden from form
    },
    {
      key: '_optimistic',
      label: 'Optimistic',
      type: 'switch',
      description: 'Whether this is an optimistic update',
      // hidden from form
    }
  ],

  // ============================================================================
  // UNIFIED RELATIONSHIP DEFINITIONS - ENHANCED ENTERPRISE JUNCTION SYSTEM
  // ============================================================================
  relationships: {
    tenant: {
      type: 'one-to-one',
      relatedEntity: 'tenants',
      description: 'Tenant that owns this node',
      foreignKey: 'tenantId',
      cacheStrategy: 'memory',
      preload: false
    },
    branch: {
      type: 'one-to-one',
      relatedEntity: 'branches',
      description: 'Branch that this node belongs to',
      foreignKey: 'branchId',
      cacheStrategy: 'memory',
      preload: false
    },
    originalNode: {
      type: 'one-to-one',
      relatedEntity: 'nodes',
      description: 'Original node this is a branched copy of',
      foreignKey: 'originalNodeId',
      cacheStrategy: 'memory',
      preload: false
    },
    createdBy: {
      type: 'one-to-one',
      relatedEntity: 'users',
      description: 'User who created this node',
      foreignKey: 'createdById',
      cacheStrategy: 'memory',
      preload: false
    },
    updatedBy: {
      type: 'one-to-one',
      relatedEntity: 'users',
      description: 'User who last updated this node',
      foreignKey: 'updatedById',
      cacheStrategy: 'memory',
      preload: false
    },
    parent: {
      type: 'one-to-one',
      relatedEntity: 'nodes',
      description: 'Parent node in the hierarchy',
      foreignKey: 'parentId',
      cacheStrategy: 'hybrid',
      preload: true
    },
    children: {
      type: 'one-to-many',
      relatedEntity: 'nodes',
      description: 'Child nodes in the hierarchy',
      foreignKey: 'parentId',
      orderBy: 'sortOrder',
      cacheStrategy: 'hybrid',
      preload: true
    },
    processes: {
      type: 'many-to-many',
      relatedEntity: 'processes',
      description: 'Processes associated with this node',
      junction: {
        tableName: 'nodeProcesses', // ✅ Standard: node + processes → nodeProcesses
        field: 'nodeId',
        relatedField: 'processId',
        attributes: {
          order: {
            type: 'number',
            required: false,
            default: 0
          },
          isActive: {
            type: 'boolean',
            required: false,
            default: true
          }
        },
        indexes: [
          { fields: ['nodeId', 'order'], name: 'idx_node_processes_order' },
          { fields: ['processId'], name: 'idx_node_processes_process' }
        ]
      },
      cacheStrategy: 'indexeddb',
      auditTrail: true
    },
    nodeWorkflows: {
      type: 'many-to-many',
      relatedEntity: 'workflows',
      description: 'Workflows associated with this node',
      junction: {
        tableName: 'nodeWorkflows', // ✅ Standard: node + workflows → nodeWorkflows
        field: 'nodeId',
        relatedField: 'workflowId',
        attributes: {
          sequence: {
            type: 'number',
            required: false,
            default: 0
          },
          isActive: {
            type: 'boolean',
            required: false,
            default: true
          }
        }
      },
      cacheStrategy: 'indexeddb'
    },
    offices: {
      type: 'one-to-many',
      relatedEntity: 'offices',
      description: 'Offices associated with this node',
      foreignKey: 'nodeId',
      cacheStrategy: 'indexeddb'
    },
    userTenants: {
      type: 'one-to-many',
      relatedEntity: 'userTenants',
      description: 'User tenants associated with this node',
      foreignKey: 'nodeId',
      cacheStrategy: 'memory'
    },
    nodeTags: {
      type: 'many-to-many',
      relatedEntity: 'tags',
      description: 'Tags associated with this node',
      junction: {
        tableName: 'nodeTags', // ✅ Standard: node + tags → nodeTags
        field: 'nodeId',
        relatedField: 'tagId'
      },
      cacheStrategy: 'memory'
    },
    ruleIgnores: {
      type: 'many-to-many',
      relatedEntity: 'rules',
      description: 'Rules that are ignored for this node (bypass relationship)',
      excludeFromPrismaInclude: true, // ✅ CRITICAL: This is stored as scalar field in Prisma, not a relation
      junction: {
        tableName: 'ruleIgnores',
        field: 'nodeId',
        relatedField: 'ruleId',
        attributes: {
          reason: {
            type: 'string',
            required: false
          },
          ignoredBy: {
            type: 'string',
            required: true
          },
          ignoredAt: {
            type: 'date',
            required: true
          },
          unignoredAt: {
            type: 'date',
            required: false
          },
          unignoredBy: {
            type: 'string',
            required: false
          }
        },
        constraints: [
          {
            type: 'unique',
            fields: ['nodeId', 'ruleId', 'branchId']
          }
        ],
        indexes: [
          { fields: ['nodeId'], name: 'idx_rule_ignores_node' },
          { fields: ['ruleId'], name: 'idx_rule_ignores_rule' },
          { fields: ['branchId'], name: 'idx_rule_ignores_branch' }
        ]
      },
      cacheStrategy: 'indexeddb',
      auditTrail: true,
      validation: {
        beforeCreate: ['validateIgnorePermissions'],
        afterCreate: ['invalidateEffectiveRulesCache'],
        beforeDelete: ['validateUnignorePermissions'],
        afterDelete: ['invalidateEffectiveRulesCache']
      }
    },
    // ✅ NEW: Computed relationship for complex business logic
    effectiveRules: {
      type: 'computed',
      relatedEntity: 'rules',
      description: 'Rules that apply to this node (via processes, minus ignores)',
      excludeFromPrismaInclude: true, // ✅ CRITICAL: This is computed, not a Prisma relation
      computation: {
        include: ['processes.rules'],
        exclude: ['ruleIgnores'],
        orderBy: ['processes.order', 'processRules.order'],
        filters: {
          isActive: true
        }
      },
      cacheStrategy: 'hybrid',
      validation: {
        afterUpdate: ['invalidateEffectiveRulesCache']
      }
    }
  },

  // Minimal tree configuration (UnifiedAutoTree doesn’t read schema anyway)
  tree: { parentField: 'parentId' },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================
  search: { fields: ['name', 'description', 'overrideKey'] },

  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    // Standard CRUD actions
    create: true,
    update: true,
    delete: true,
    duplicate: true,
    bulk: true,
    
    // Tree-specific actions
    custom: [
      {
        id: 'addNode',
        label: 'Add Child Node',
        icon: 'plus',
        description: 'Add a child node to this node',
        handler: 'addNode'
      },
      {
        id: 'addProcess',
        label: 'Add Process',
        icon: 'cog',
        description: 'Add a process to this node',
        handler: 'addProcess'
      },
      {
        id: 'addOffice',
        label: 'Add Office',
        icon: 'building',
        description: 'Add an office to this node',
        handler: 'addOffice'
      },
      {
        id: 'moveNode',
        label: 'Move Node',
        icon: 'move',
        description: 'Move this node to a different parent',
        handler: 'moveNode'
      },
      {
        id: 'copyNode',
        label: 'Copy Node',
        icon: 'copy',
        description: 'Create a copy of this node',
        handler: 'copyNode'
      },
      {
        id: 'expandAll',
        label: 'Expand All',
        icon: 'expand',
        description: 'Expand all child nodes',
        handler: 'expandAll'
      },
      {
        id: 'collapseAll',
        label: 'Collapse All',
        icon: 'collapse',
        description: 'Collapse all child nodes',
        handler: 'collapseAll'
      },
      
      // ============================================================================
      // BRANCHING ACTIONS
      // ============================================================================
      {
        id: 'viewHistory',
        label: 'View History',
        icon: 'clock',
        description: 'View version history for this node',
        handler: 'viewHistory'
      },
      {
        id: 'branchFrom',
        label: 'Create Branch',
        icon: 'git-branch',
        description: 'Create a new branch from this node',
        handler: 'branchFrom',
        confirmation: {
          title: 'Create Branch',
          message: 'Create a new branch starting from this node?',
          confirmText: 'Create Branch',
          cancelText: 'Cancel'
        }
      },
      {
        id: 'mergeTo',
        label: 'Merge Changes',
        icon: 'git-merge',
        description: 'Merge changes from this branch',
        handler: 'mergeTo',
        confirmation: {
          title: 'Merge Changes',
          message: 'Merge changes from the current branch?',
          confirmText: 'Merge',
          cancelText: 'Cancel'
        }
      },
      {
        id: 'switchBranch',
        label: 'Switch Branch',
        icon: 'git-branch',
        description: 'Switch to a different branch',
        handler: 'switchBranch'
      },
      {
        id: 'compareBranches',
        label: 'Compare Branches',
        icon: 'git-compare',
        description: 'Compare this node across branches',
        handler: 'compareBranches'
      }
    ]
  },

  // Minimal mobile/desktop (schema requires presence; keep lean)
  mobile: {
    cardFormat: 'compact',
    primaryField: 'name',
    secondaryFields: ['type'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right'
  },

  // ============================================================================
  // DESKTOP TABLE CONFIGURATION
  // ============================================================================
  desktop: { sortField: 'name', sortOrder: 'asc' },

  // Table config optional – removed for lean schema

  // ============================================================================
  // PERMISSIONS - Enhanced for Branching
  // ============================================================================
  permissions: {
    create: 'node.create',
    view: 'node.read',
    update: 'node.update',
    delete: 'node.delete',
    custom: {
      move: 'node.move',
      copy: 'node.copy',
      viewHistory: 'node.history',
      branchFrom: 'branch.create',
      mergeTo: 'branch.merge',
      switchBranch: 'branch.switch',
      compareBranches: 'branch.compare'
    }
  },

  // ============================================================================
  // HOOKS FOR CUSTOM LOGIC
  // ============================================================================
  hooks: {
    beforeCreate: 'validateNodeHierarchy',
    afterCreate: 'updateParentChildCount',
    beforeUpdate: 'validateNodeMove',
    afterUpdate: 'recalculateTreeOptimization',
    beforeDelete: 'checkNodeChildren',
    afterDelete: 'updateParentChildCount'
  },

  // ✅ ENTITY: IndexedDB key configuration
  indexedDBKey: (record: any) => record.id
};

// ============================================================================
// JUNCTION SCHEMAS: NODE RELATIONSHIPS
// ============================================================================



 