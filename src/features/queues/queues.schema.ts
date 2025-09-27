import { z } from 'zod'
import type { ResourceSchema } from '@/lib/resource-system/schemas'

// ============================================================================
// QUEUE ENTITY SCHEMAS
// ============================================================================

/**
 * Queue Entity Schema  
 * Represents a travel industry queue (GDS or Virtual) with container support
 */
export const QueueSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable(),
  description: z.string().nullable(),
  type: z.enum(['VIRTUAL', 'GDS']),
  
  // Container hierarchy for Named Queues
  isContainer: z.boolean().default(false),
  parentQueueId: z.string().nullable(),
  
  // GDS-specific fields
  vendor: z.enum(['SABRE', 'AMADEUS', 'TRAVELPORT']).nullable(),
  officeId: z.string().nullable(),
  queueNumber: z.string().nullable(), // String to support alphanumeric
  queueCategory: z.string().nullable(),
  
  // Virtual Queue fields
  vendors: z.array(z.enum(['SABRE', 'AMADEUS', 'TRAVELPORT'])).nullable(),
  
  // Scheduling configuration
  scheduleConfig: z.object({
    type: z.enum(['single', 'multiple']).optional(),
    checkInterval: z.number().optional(), // minutes
    schedules: z.array(z.object({
      days: z.array(z.string()).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(), 
      timezone: z.string().optional()
    })).optional()
  }).nullable(),
  
  // Workflow integration
  workflowId: z.string().nullable(),
  
  // Health and status
  healthStatus: z.string().default('ACTIVE'), // ACTIVE, PAUSED, ERROR
  maxAge: z.number().nullable(),
  isActive: z.boolean().default(true),
  
  // System fields
  tenantId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
})

export type Queue = z.infer<typeof QueueSchema>

/**
 * Queue Event Schema
 * Represents real-time queue events for activity stream
 */
export const QueueEventSchema = z.object({
  id: z.string(),
  queueId: z.string(),
  eventType: z.enum([
    'ITEM_ADDED',
    'ITEM_PROCESSED', 
    'ITEM_FAILED',
    'QUEUE_PAUSED',
    'QUEUE_RESUMED',
    'QUEUE_CLEARED',
    'STATUS_CHANGED'
  ]),
  eventData: z.record(z.any()),
  message: z.string(),
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).default('INFO'),
  timestamp: z.string(),
  
  // System fields
  tenantId: z.string(),
  branchId: z.string(),
})

export type QueueEvent = z.infer<typeof QueueEventSchema>

/**
 * Queue Worker Schema
 * Represents a worker processing queue messages
 */
export const QueueWorkerSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  host: z.string(),
  pid: z.number().nullable(),
  version: z.string(),
  status: z.enum(['idle', 'busy', 'offline', 'error']),
  lastHeartbeat: z.string(),
  startedAt: z.string(),
  currentJobId: z.string().nullable(),
  currentJobType: z.string().nullable(),
  currentJobStarted: z.string().nullable(),
  jobsCompleted: z.number().default(0),
  jobsFailed: z.number().default(0),
  averageJobTime: z.number().default(0), // milliseconds
  capabilities: z.array(z.string()),
  maxConcurrentJobs: z.number().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type QueueWorker = z.infer<typeof QueueWorkerSchema>

// ============================================================================
// RESOURCE SCHEMA DEFINITIONS
// ============================================================================

export const QUEUE_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'queues',
  modelName: 'Queue', 
  actionPrefix: 'queues',
  
  // ============================================================================
  // SERVER-ONLY CONFIGURATION (Non-Branch-Aware)
  // ============================================================================
  serverOnly: true, // Large dataset - server-side rendering only
  // Queue configs are tenant-level, not branch-specific
  cacheStrategy: 'server-only' as const,
  
  // ============================================================================
  // UI DISPLAY
  // ============================================================================
  display: {
    title: 'Queues',
    description: 'Real-time queue monitoring and management',
    icon: 'Queue'
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
  // FIELD DEFINITIONS
  // ============================================================================
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: 'text' as const,
      autoValue: { source: 'auto.uuid' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    },
    {
      key: 'name',
      label: 'Name',
      type: 'text' as const,
      required: true,
      table: {
        width: 'md'
      },
      form: {
        row: 1,
        width: '3quarters',
        order: 1
      },
      validation: [
        { type: 'required' as const, message: 'Queue name is required' },
        { type: 'minLength' as const, value: 3, message: 'Name too short' },
        { type: 'maxLength' as const, value: 100, message: 'Name too long' }
      ],
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'displayName',
      label: 'Display Name', 
      type: 'text' as const,
      required: false, // Made optional to not clutter the form
      table: {
        width: 'md'
      },
      validation: [
        { type: 'minLength' as const, value: 3, message: 'Display name too short' },
        { type: 'maxLength' as const, value: 150, message: 'Display name too long' }
      ],
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: false,
      table: {
        width: 'lg'
      },
      form: {
        row: 2,
        width: 'full',
        order: 1
      },
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'type',
      label: 'Type',
      type: 'radio' as const,
      required: true,
      table: {
        width: 'md',
        filterable: true
      },
      form: {
        row: 3,
        width: 'half',
        order: 1
      },
      options: {
        static: [
          { value: 'GDS', label: 'GDS' },
          { value: 'VIRTUAL', label: 'Virtual' }
        ],
        layout: 'horizontal'
      },
      mobile: { priority: 'medium' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'md' as const },
    },
    {
      key: 'isContainer',
      label: 'Named Queue',
      type: 'switch' as const,
      required: false,
      defaultValue: false,
      mobile: { priority: 'medium' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'sm' as const }
    },
    {
      key: 'parentQueueId',
      label: 'Parent Queue',
      type: 'select' as const,
      required: false,
      table: {
        width: 'md',
        filterable: true
      },
      options: {
        source: 'queues.list',     // ✅ CORRECT: queues is plural in the schema
        when: {
          isContainer: true  // Only show Named Queues as parent options
        }
      } as any, // TODO: Update FieldOptions type to include SmartSelectOptions
      description: 'Select parent Named Queue (only shown for child queues)',
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'vendor',
      label: 'Vendor',
      type: 'select' as const,
      required: false,
      table: {
        width: 'sm',
        filterable: true
      },
      form: {
        row: 4,
        width: 'half',
        order: 1
      },
      options: {
        static: [
          { value: 'SABRE', label: 'Sabre' },
          { value: 'AMADEUS', label: 'Amadeus' },
          { value: 'TRAVELPORT', label: 'Travelport' }
        ]
      },
      description: '',
      mobile: { priority: 'medium' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'sm' as const }
    },
    {
      key: 'officeId',
      label: 'Office',
      type: 'select' as const,
      required: false,
      table: {
        width: 'md',
        filterable: true
      },
      form: {
        row: 4,
        width: 'half',
        order: 2
      },
      options: {
        source: 'office.list',     // ✅ FIXED: Use correct singular action name
        when: {
          vendor: '=${vendor}',      // Filter by selected vendor
          type: {                    // Complex conditional logic made simple
            'GDS': { supportedTypes: 'GDS' },
            'VIRTUAL': { supportedTypes: 'VIRTUAL' },
            '*': { isActive: true }  // Default for all other values
          }
        },
        cache: '2m'               // Cache for 2 minutes
      } as any, // TODO: Update FieldOptions type to include SmartSelectOptions
      description: 'Office filtered by vendor and queue type',
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'queueNumber',
      label: 'Queue Number',
      type: 'text' as const,
      required: true,
      table: {
        width: 'sm'
      },
      form: {
        row: 5,
        width: 'sm',
        order: 1
      },
      validation: [
        { type: 'maxLength' as const, value: 10, message: 'Queue number too long' }
      ],
      description: '',
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'sm' as const }
    },
    {
      key: 'queueCategory',
      label: 'Queue Category',
      type: 'text' as const,
      required: false,
      table: {
        width: 'sm'
      },
      form: {
        row: 5,
        width: 'sm',
        order: 2
      },
      description: 'Queue category (Not applicable for Sabre - GDS queues only)',
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'maxAge',
      label: 'Max Age (min)',
      type: 'number' as const,
      required: false,
      defaultValue: 0,
      table: {
        width: 'sm',
        filterable: true
      },
      form: {
        row: 5, // Hidden from main form layout
        width: 'sm',
        order: 3
      },
      validation: [
        { type: 'min' as const, value: 0, message: 'Max age must be non-negative' }
      ],
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'sm' as const }
    },
    {
      key: 'workflowId',
      label: 'Workflow',
      type: 'select' as const,
      required: false,
      table: {
        width: 'md',
        filterable: true
      },
      form: {
        row: 6,
        width: 'half',
        order: 2
      },
      options: {
        source: 'workflow.list',   // ✅ FIXED: Use correct singular action name
        searchable: true,           // Force enable search
        cache: '5m',               // Cache for 5 minutes
        transform: (workflow: any) => ({
          value: workflow.id,
          label: `${workflow.name} (${workflow.type})`,
          disabled: !workflow.isActive
        })
      } as any, // TODO: Update FieldOptions type to include SmartSelectOptions
      description: 'Workflow to execute for queue processing (searchable, with type display)',
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'scheduleConfig',
      label: 'Schedule Configuration',
      type: 'schedule-builder' as const,
      required: false,
      table: {
        width: 'lg'
      },
      form: {
        row: 6,
        width: 'half',
        order: 3
      },
      description: 'Configure queue scheduling parameters using a user-friendly interface',
      placeholder: 'Click to configure when this queue should be active',
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'pnrsOnQueue',
      label: 'Items in Queue',
      type: 'number' as const,
      required: false,
      defaultValue: 0,
      table: {
        width: 'sm'
      },
      mobile: { priority: 'high' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'sm' as const }
    },
    {
      key: 'healthStatus',
      label: 'Health',
      type: 'select' as const,
      required: false,
      table: {
        width: 'md',
        filterable: true
      },
      defaultValue: 'HEALTHY',
      options: {
        static: [
          { value: 'HEALTHY', label: 'Healthy' },
          { value: 'WARNING', label: 'Warning' },
          { value: 'CRITICAL', label: 'Critical' },
          { value: 'OFFLINE', label: 'Offline' }
        ],
        searchable: false // Status dropdown doesn't need search
      },
      mobile: { priority: 'high' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'switch' as const,
      required: false,
      defaultValue: true,
      mobile: { priority: 'medium' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'sm' as const }
    },
    // System fields
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text' as const,
      autoValue: { source: 'session.user.tenantId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    },
    {
      key: 'branchId', 
      label: 'Branch ID',
      type: 'text' as const,
      autoValue: { source: 'session.user.branchContext.currentBranchId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    }
  ],
  
  // ============================================================================
  // SEARCH CONFIGURATION
  // ============================================================================
  search: {
    fields: ['name', 'displayName', 'office', 'category'],
    placeholder: 'Search queues...',
    fuzzy: true
  },
  
  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: false,
    bulk: true,
    optimistic: false, // Real-time data - server-only operations
    serverOnly: true
  },

  // ============================================================================
  // ROW-LEVEL ACTIONS - Individual Queue Controls
  // ============================================================================
  rowActions: [
    {
      key: 'resume',
      label: 'Resume',
      icon: 'Play',
      variant: 'default' as const,
      size: 'sm' as const,
      actionType: 'mutation' as const,
      condition: {
        field: 'healthStatus',
        operator: 'in' as const,
        value: ['WARNING', 'CRITICAL', 'OFFLINE']
      },
      mutation: {
        action: 'queues.update',
        payload: { 
          healthStatus: 'HEALTHY',
          isActive: true 
        }
      },
      tooltip: 'Resume queue processing',
      loadingText: 'Resuming...'
    },
    {
      key: 'pause',
      label: 'Pause',
      icon: 'Pause',
      variant: 'secondary' as const,
      size: 'sm' as const,
      actionType: 'mutation' as const,
      condition: {
        field: 'healthStatus',
        operator: 'equals' as const,
        value: 'HEALTHY'
      },
      mutation: {
        action: 'queues.update',
        payload: { 
          healthStatus: 'WARNING',
          isActive: false 
        },
        confirmMessage: 'This will temporarily stop processing for this queue.'
      },
      tooltip: 'Pause queue processing',
      loadingText: 'Pausing...'
    },
    {
      key: 'sleep',
      label: 'Sleep',
      icon: 'Moon',
      variant: 'secondary' as const,
      size: 'sm' as const,
      actionType: 'dialog' as const,
      condition: {
        field: 'healthStatus',
        operator: 'not_equals' as const,
        value: 'OFFLINE'
      },
      dialog: {
        component: 'SleepDialog',
        title: 'Schedule Queue Sleep',
        action: 'queues.update',
        props: {
          defaultReason: 'Scheduled maintenance'
        }
      },
      tooltip: 'Schedule queue sleep',
      loadingText: 'Scheduling...'
    },
    {
      key: 'fail',
      label: 'Stop',
      icon: 'XCircle',
      variant: 'destructive' as const,
      size: 'sm' as const,
      actionType: 'mutation' as const,
      condition: {
        field: 'healthStatus',
        operator: 'in' as const,
        value: ['HEALTHY', 'WARNING']
      },
      mutation: {
        action: 'queues.update',
        payload: { 
          healthStatus: 'CRITICAL',
          isActive: false 
        },
        confirmMessage: 'This will immediately stop queue processing and mark it as failed. Are you sure?'
      },
      tooltip: 'Stop queue and mark as failed',
      loadingText: 'Stopping...'
    }
  ],
  
  // ============================================================================
  // MOBILE CONFIGURATION
  // ============================================================================
  mobile: {
    cardFormat: 'detailed' as const,
    primaryField: 'displayName',
    secondaryFields: ['queueType', 'pnrsOnQueue', 'healthStatus'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right' as const
  },
  
  // ============================================================================
  // DESKTOP CONFIGURATION  
  // ============================================================================
  desktop: {
    sortField: 'queueNumber',
    sortOrder: 'asc' as const,
    editableField: 'displayName',
    rowActions: true,
    bulkActions: true, // Enable bulk operations
    density: 'normal' as const
  },
  
  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================
  table: {
    width: 'full',
    bulkSelect: true,        // ✅ Enables select checkboxes
    columnFilter: true,      // ✅ Enables column filters
    sortableColumns: true,
    bulkSelectOptions: [
      {
        id: 'resume',
        label: 'Resume Selected',
        icon: 'Play',
        description: 'Resume selected queues',
        handler: 'bulkResumeQueues'
      },
      {
        id: 'pause',
        label: 'Pause Selected', 
        icon: 'Pause',
        description: 'Pause selected queues',
        handler: 'bulkPauseQueues',
        confirmMessage: 'Are you sure you want to pause the selected queues?'
      },
      {
        id: 'export',
        label: 'Export Selected',
        icon: 'download',
        description: 'Export selected queues to CSV',
        handler: 'bulkExportQueues'
      }
    ]
  },
  
  // ============================================================================
  // INDEXEDDB CONFIGURATION
  // ============================================================================
  indexedDBKey: (record: any) => record.id,
  
  // ============================================================================
  // REAL-TIME CAPABILITIES (Comment only - not implemented in schema yet)
  // ============================================================================
  // enableRealTimeUpdates: true,
  // updateInterval: 5000 // 5 seconds
}

export const QUEUE_EVENT_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'queueEvents',
  modelName: 'QueueMessage',
  actionPrefix: 'queueEvents',
  
  // ============================================================================
  // SERVER-ONLY CONFIGURATION
  // ============================================================================
  serverOnly: true, // High-volume event stream - server-side only
  cacheStrategy: 'server-only' as const,
  
  // ============================================================================
  // UI DISPLAY
  // ============================================================================
  display: {
    title: 'Queue Events',
    description: 'Real-time queue activity event stream',
    icon: 'Activity'
  },
  
  // ============================================================================
  // FIELD DEFINITIONS
  // ============================================================================
  fields: [
    {
      key: 'id',
      label: 'Event ID',
      type: 'text' as const,
      autoValue: { source: 'auto.uuid' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    },
    {
      key: 'queueId',
      label: 'Queue',
      type: 'text' as const,
      required: true,
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'eventType',
      label: 'Event Type',
      type: 'select' as const,
      required: true,
      options: {
        static: [
          { value: 'ITEM_ADDED', label: 'Item Added' },
          { value: 'ITEM_PROCESSED', label: 'Item Processed' },
          { value: 'ITEM_FAILED', label: 'Item Failed' },
          { value: 'QUEUE_PAUSED', label: 'Queue Paused' },
          { value: 'QUEUE_RESUMED', label: 'Queue Resumed' },
          { value: 'QUEUE_CLEARED', label: 'Queue Cleared' },
          { value: 'STATUS_CHANGED', label: 'Status Changed' }
        ]
      },
      mobile: { priority: 'high' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'message',
      label: 'Message',
      type: 'text' as const,
      required: true,
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'xl' as const }
    },
    {
      key: 'severity',
      label: 'Severity',
      type: 'select' as const,
      required: true,
      defaultValue: 'INFO',
      options: {
        static: [
          { value: 'INFO', label: 'Info' },
          { value: 'WARNING', label: 'Warning' },
          { value: 'ERROR', label: 'Error' },
          { value: 'CRITICAL', label: 'Critical' }
        ]
      },
      mobile: { priority: 'high' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      type: 'datetime' as const,
      required: true,
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    // System fields
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text' as const,
      autoValue: { source: 'session.user.tenantId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text' as const,
      autoValue: { source: 'session.user.branchContext.currentBranchId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    }
  ],
  
  // ============================================================================
  // SEARCH CONFIGURATION
  // ============================================================================
  search: {
    fields: ['message', 'eventType', 'severity'],
    placeholder: 'Search events...',
    fuzzy: true
  },

  // ============================================================================
  // FILTERING CONFIGURATION - Two-Level System for Activity Stream
  // ============================================================================
  filtering: {
    level1: {
      title: 'Event Type',
      filterField: 'eventType',
      tabs: [
        { id: 'all', label: 'All Events', value: 'all' },
        { id: 'processed', label: 'Processed', value: 'ITEM_PROCESSED', icon: 'CheckCircle' },
        { id: 'failed', label: 'Failed', value: 'ITEM_FAILED', icon: 'XCircle' },
        { id: 'queue-ops', label: 'Queue Ops', value: 'QUEUE_PAUSED,QUEUE_RESUMED,QUEUE_CLEARED', icon: 'Settings' },
        { id: 'status', label: 'Status Changes', value: 'STATUS_CHANGED', icon: 'Activity' }
      ],
      showAll: true,
      defaultTab: 'all'
    },
    level2: {
      title: 'Severity',
      filterField: 'severity',
      groupBy: 'severity',
      showAll: true
    }
  },
  
  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,  // Events can be logged
    update: false, // Events are immutable once created
    delete: false, // Auto-cleanup handles deletion
    duplicate: false,
    bulk: false,
    optimistic: false,
    serverOnly: true
  },
  
  // ============================================================================
  // MOBILE CONFIGURATION
  // ============================================================================
  mobile: {
    cardFormat: 'detailed' as const,
    primaryField: 'message',
    secondaryFields: ['eventType', 'severity', 'timestamp'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right' as const
  },
  
  // ============================================================================
  // DESKTOP CONFIGURATION
  // ============================================================================
  desktop: {
    sortField: 'timestamp',
    sortOrder: 'desc' as const, // Latest events first
    editableField: undefined, // Events are read-only
    rowActions: false, // No row actions for events
    bulkActions: false,
    density: 'compact' as const // More events visible
  },
  
  // ============================================================================
  // INDEXEDDB CONFIGURATION
  // ============================================================================
  indexedDBKey: (record: any) => record.id,
  
  // ============================================================================
  // REAL-TIME CAPABILITIES (Comment only - not implemented in schema yet)
  // ============================================================================
  // streamChannel: 'queue-events',
  
  // ============================================================================
  // AUTO-CLEANUP CONFIGURATION (Comment only - not implemented in schema yet)
  // ============================================================================
  // autoCleanup: {
  //   enabled: true,
  //   retentionDays: 7 // Keep events for 7 days
  // }

  // ============================================================================
  // ENHANCED ACTIVITY STREAM FILTERS (Future Implementation)
  // ============================================================================
  // Advanced filtering capabilities for the activity stream:
  // 
  // additionalFilters: [
  //   {
  //     key: 'eventType',
  //     label: 'Event Type',
  //     type: 'dropdown',
  //     multiple: true,
  //     options: [
  //       { value: 'ITEM_ADDED', label: 'Item Added', icon: 'Plus' },
  //       { value: 'ITEM_PROCESSED', label: 'Item Processed', icon: 'CheckCircle' },
  //       { value: 'ITEM_FAILED', label: 'Item Failed', icon: 'XCircle' },
  //       { value: 'QUEUE_PAUSED', label: 'Queue Paused', icon: 'Pause' },
  //       { value: 'QUEUE_RESUMED', label: 'Queue Resumed', icon: 'Play' },
  //       { value: 'QUEUE_CLEARED', label: 'Queue Cleared', icon: 'Trash2' },
  //       { value: 'STATUS_CHANGED', label: 'Status Changed', icon: 'Activity' }
  //     ],
  //     defaultValue: ['ITEM_PROCESSED', 'ITEM_FAILED', 'QUEUE_PAUSED', 'QUEUE_RESUMED']
  //   },
  //   {
  //     key: 'queueId',
  //     label: 'Queue',
  //     type: 'dropdown',
  //     multiple: true,
  //     dataSource: {
  //       endpoint: '/api/queues',
  //       valueField: 'id',
  //       labelField: 'displayName'
  //     }
  //   },
  //   {
  //     key: 'dateRange',
  //     label: 'Time Range',
  //     type: 'daterange',
  //     defaultValue: 'last24h',
  //     presets: [
  //       { value: 'last1h', label: 'Last Hour' },
  //       { value: 'last6h', label: 'Last 6 Hours' },
  //       { value: 'last24h', label: 'Last 24 Hours' },
  //       { value: 'last7d', label: 'Last 7 Days' },
  //       { value: 'last30d', label: 'Last 30 Days' },
  //       { value: 'custom', label: 'Custom Range' }
  //     ]
  //   }
  // ],
  //
  // autoRefresh: {
  //   enabled: true,
  //   intervals: [5000, 15000, 30000, 60000], // 5s, 15s, 30s, 1min
  //   defaultInterval: 15000
  // }
}

// ============================================================================
// ANALYTICS SCHEMAS
// ============================================================================

/**
 * Queue Analytics Schema
 * On-demand analytics data
 */
export const QueueAnalyticsSchema = z.object({
  queueId: z.string(),
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']),
  
  // Performance metrics
  totalProcessed: z.number(),
  totalFailed: z.number(),
  averageProcessingTime: z.number(),
  peakProcessingRate: z.number(),
  
  // Health metrics  
  uptime: z.number(), // percentage
  errorRate: z.number(), // percentage
  
  // Time series data
  processingRateHistory: z.array(z.object({
    timestamp: z.string(),
    rate: z.number()
  })),
  
  queueSizeHistory: z.array(z.object({
    timestamp: z.string(), 
    size: z.number()
  }))
})

export type QueueAnalytics = z.infer<typeof QueueAnalyticsSchema>

// ============================================================================
// JOB EXECUTION SYSTEM SCHEMAS - DISTRIBUTED JOB PROCESSING
// ============================================================================

/**
 * JobPackage Entity Schema
 * Represents a distributed job with full lifecycle tracking
 */
export const JobPackageSchema = z.object({
  id: z.string(),
  jobId: z.string(), // Universal job identifier
  tenantId: z.string(),
  branchId: z.string().nullable(),
  
  // Execution timing and scheduling
  runTimeUtc: z.string(), // ISO datetime
  queuedAt: z.string(),
  scheduleFrequencyMinutes: z.number().nullable(),
  
  // Trigger context
  triggerType: z.enum(['SCHEDULED', 'API_CALL', 'WEBHOOK', 'MANUAL', 'DEPENDENCY', 'QUEUE_EVENT']),
  triggerSource: z.string().nullable(),
  triggeredBy: z.string().nullable(),
  
  // Job definition
  jobType: z.string(),
  workflowId: z.string().nullable(),
  processId: z.string().nullable(),
  ruleId: z.string().nullable(),
  
  // Processing state
  status: z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING', 'TIMEOUT']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL', 'URGENT']),
  priorityScore: z.number().default(0),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  
  // Results and timing
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  timeoutAt: z.string().nullable(),
  duration: z.number().nullable(),
  error: z.string().nullable(),
  errorCode: z.string().nullable(),
  
  // Resource tracking
  workerId: z.string().nullable(), // ✅ Key field for sorting!
  workerInstanceId: z.string().nullable(),
  containerInstance: z.string().nullable(),
  
  // Performance metrics
  cpuUsage: z.number().nullable(),
  memoryUsage: z.number().nullable(),
  networkUsage: z.number().nullable(),
  
  // Dependencies and relationships
  parentJobId: z.string().nullable(),
  batchId: z.string().nullable(),
  queueId: z.string().nullable(),
  
  // System fields
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  isArchived: z.boolean().default(false),
})

export type JobPackage = z.infer<typeof JobPackageSchema>

/**
 * JobActivity Entity Schema
 * Represents activity stream events for jobs
 */
export const JobActivitySchema = z.object({
  id: z.string(),
  jobId: z.string(), // References JobPackage.jobId
  tenantId: z.string(),
  
  // Activity details
  activityType: z.enum([
    'JOB_CREATED', 'JOB_STARTED', 'JOB_COMPLETED', 'JOB_FAILED', 'JOB_CANCELLED',
    'JOB_RETRIED', 'JOB_TIMEOUT', 'WORKER_ASSIGNED', 'WORKER_RELEASED',
    'DEPENDENCY_RESOLVED', 'RESOURCE_ALLOCATED', 'RESOURCE_RELEASED',
    'ERROR_OCCURRED', 'WARNING_ISSUED', 'METRIC_RECORDED', 'USER_ACTION', 'SYSTEM_EVENT'
  ]),
  title: z.string(),
  description: z.string().nullable(),
  
  // Context
  entityType: z.string().nullable(),
  entityId: z.string().nullable(),
  userId: z.string().nullable(),
  systemComponent: z.string().nullable(),
  
  // Error details
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).nullable(),
  
  // Performance
  duration: z.number().nullable(),
  
  // Correlation
  correlationId: z.string().nullable(),
  traceId: z.string().nullable(),
  
  // Visibility
  isVisible: z.boolean().default(true),
  isSystemGenerated: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  
  // System fields
  createdAt: z.string(),
  retentionDays: z.number().default(365),
  isArchived: z.boolean().default(false),
})

export type JobActivity = z.infer<typeof JobActivitySchema>

// ============================================================================
// JOB PACKAGE RESOURCE SCHEMA - AUTO-TABLE CONFIGURATION
// ============================================================================

export const JOB_PACKAGE_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY
  // ============================================================================
  databaseKey: 'jobPackages',
  modelName: 'JobPackage', 
  actionPrefix: 'jobPackages',
  
  // ============================================================================
  // SERVER-ONLY CONFIGURATION
  // ============================================================================
  serverOnly: true, // High-volume job data - server-side rendering only
  notHasBranchContext: true, // Job execution is tenant-level operational data, not branch-specific
  cacheStrategy: 'server-only' as const,
  
  // ============================================================================
  // UI DISPLAY
  // ============================================================================
  display: {
    title: 'Job Packages',
    description: 'Distributed job execution monitoring and management',
    icon: 'Package'
  },
  
  // ============================================================================
  // FIELD DEFINITIONS
  // ============================================================================
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: 'text' as const,
      autoValue: { source: 'auto.uuid' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    },
    {
      key: 'jobId',
      label: 'Job ID',
      type: 'text' as const,
      required: true,
      table: {
        width: 'lg'
      },
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      required: true,
      options: {
        static: [
          { value: 'QUEUED', label: 'Queued' },
          { value: 'RUNNING', label: 'Running' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'FAILED', label: 'Failed' },
          { value: 'CANCELLED', label: 'Cancelled' },
          { value: 'RETRYING', label: 'Retrying' },
          { value: 'TIMEOUT', label: 'Timeout' }
        ]
      },
      table: {
        width: 'md',
        filterable: true
      },
      mobile: { priority: 'high' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select' as const,
      required: true,
      options: {
        static: [
          { value: 'LOW', label: 'Low' },
          { value: 'NORMAL', label: 'Normal' },
          { value: 'HIGH', label: 'High' },
          { value: 'CRITICAL', label: 'Critical' },
          { value: 'URGENT', label: 'Urgent' }
        ]
      },
      table: {
        width: 'sm',
        filterable: true
      },
      mobile: { priority: 'medium' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'sm' as const }
    },
    {
      key: 'jobType',
      label: 'Job Type',
      type: 'text' as const,
      required: true,
      table: {
        width: 'md',
        filterable: true
      },
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'workerId',
      label: 'Worker ID',
      type: 'text' as const,
      required: false,
      table: {
        width: 'lg',
        filterable: true,
        sortable: true // ✅ Enable sorting by workerId
      },
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'triggerType',
      label: 'Trigger',
      type: 'select' as const,
      required: true,
      options: {
        static: [
          { value: 'SCHEDULED', label: 'Scheduled' },
          { value: 'API_CALL', label: 'API Call' },
          { value: 'WEBHOOK', label: 'Webhook' },
          { value: 'MANUAL', label: 'Manual' },
          { value: 'DEPENDENCY', label: 'Dependency' },
          { value: 'QUEUE_EVENT', label: 'Queue Event' }
        ]
      },
      table: {
        width: 'md',
        filterable: true
      },
      mobile: { priority: 'low' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'duration',
      label: 'Duration (ms)',
      type: 'number' as const,
      required: false,
      table: {
        width: 'sm'
      },
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'sm' as const }
    },
    {
      key: 'retryCount',
      label: 'Retries',
      type: 'number' as const,
      required: false,
      defaultValue: 0,
      table: {
        width: 'xs'
      },
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'xs' as const }
    },
    {
      key: 'queuedAt',
      label: 'Queued At',
      type: 'datetime' as const,
      required: true,
      table: {
        width: 'lg'
      },
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'startedAt',
      label: 'Started At',
      type: 'datetime' as const,
      required: false,
      table: {
        width: 'lg'
      },
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'completedAt',
      label: 'Completed At',
      type: 'datetime' as const,
      required: false,
      table: {
        width: 'lg'
      },
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'error',
      label: 'Error Message',
      type: 'textarea' as const,
      required: false,
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'xl' as const }
    },
    // System fields
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text' as const,
      autoValue: { source: 'session.user.tenantId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text' as const,
      autoValue: { source: 'session.user.branchContext.currentBranchId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    }
  ],
  
  // ============================================================================
  // SEARCH CONFIGURATION
  // ============================================================================
  search: {
    fields: ['jobId', 'jobType', 'workerId', 'error'],
    placeholder: 'Search jobs...',
    fuzzy: true
  },
  
  // ============================================================================
  // FILTERING CONFIGURATION - Multi-Level Job Filtering
  // ============================================================================
  filtering: {
    level1: {
      title: 'Job Status',
      filterField: 'status',
      tabs: [
        { id: 'all', label: 'All Jobs', value: 'all' },
        { id: 'running', label: 'Running', value: 'RUNNING', icon: 'Play' },
        { id: 'completed', label: 'Completed', value: 'COMPLETED', icon: 'CheckCircle' },
        { id: 'failed', label: 'Failed', value: 'FAILED', icon: 'XCircle' },
        { id: 'queued', label: 'Queued', value: 'QUEUED', icon: 'Clock' },
        { id: 'retrying', label: 'Retrying', value: 'RETRYING', icon: 'RotateCcw' }
      ],
      showAll: true,
      defaultTab: 'all'
    },
    level2: {
      title: 'Priority',
      filterField: 'priority',
      groupBy: 'priority',
      showAll: true
    }
  },
  
  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,
    update: false, // Jobs are managed by the system
    delete: false, // Jobs have retention policies
    duplicate: false,
    bulk: true,
    optimistic: false,
    serverOnly: true
  },

  // ============================================================================
  // ROW-LEVEL ACTIONS - Job Management
  // ============================================================================
  rowActions: [
    {
      key: 'retry',
      label: 'Retry',
      icon: 'RotateCcw',
      variant: 'default' as const,
      size: 'sm' as const,
      actionType: 'mutation' as const,
      condition: {
        field: 'status',
        operator: 'in' as const,
        value: ['FAILED', 'TIMEOUT', 'CANCELLED']
      },
      mutation: {
        action: 'jobPackages.retry',
        payload: { status: 'QUEUED', retryCount: '+1' }
      },
      tooltip: 'Retry failed job',
      loadingText: 'Retrying...'
    },
    {
      key: 'cancel',
      label: 'Cancel',
      icon: 'X',
      variant: 'destructive' as const,
      size: 'sm' as const,
      actionType: 'mutation' as const,
      condition: {
        field: 'status',
        operator: 'in' as const,
        value: ['QUEUED', 'RUNNING']
      },
      mutation: {
        action: 'jobPackages.update',
        payload: { status: 'CANCELLED' },
        confirmMessage: 'This will cancel the running job. Are you sure?'
      },
      tooltip: 'Cancel job',
      loadingText: 'Cancelling...'
    }
  ],
  
  // ============================================================================
  // MOBILE CONFIGURATION
  // ============================================================================
  mobile: {
    cardFormat: 'detailed' as const,
    primaryField: 'jobId',
    secondaryFields: ['status', 'priority', 'jobType', 'workerId'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right' as const
  },
  
  // ============================================================================
  // DESKTOP CONFIGURATION
  // ============================================================================
  desktop: {
    sortField: 'queuedAt',
    sortOrder: 'desc' as const, // Latest jobs first
    editableField: undefined,
    rowActions: true,
    bulkActions: true,
    density: 'normal' as const
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
        id: 'retry',
        label: 'Retry Selected',
        icon: 'RotateCcw',
        description: 'Retry selected failed jobs',
        handler: 'bulkRetryJobs'
      },
      {
        id: 'cancel',
        label: 'Cancel Selected',
        icon: 'X',
        description: 'Cancel selected jobs',
        handler: 'bulkCancelJobs',
        confirmMessage: 'Are you sure you want to cancel the selected jobs?'
      },
      {
        id: 'export',
        label: 'Export Selected',
        icon: 'Download',
        description: 'Export selected jobs to CSV',
        handler: 'bulkExportJobs'
      }
    ]
  },
  
  // ============================================================================
  // INDEXEDDB CONFIGURATION
  // ============================================================================
  indexedDBKey: (record: any) => record.id,
}

// ============================================================================
// JOB ACTIVITY RESOURCE SCHEMA - ACTIVITY STREAM CONFIGURATION
// ============================================================================

export const JOB_ACTIVITY_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY
  // ============================================================================
  databaseKey: 'jobActivities',
  modelName: 'JobActivity', 
  actionPrefix: 'jobActivities',
  
  // ============================================================================
  // SERVER-ONLY CONFIGURATION
  // ============================================================================
  serverOnly: true, // High-volume activity stream - server-side only
  notHasBranchContext: true, // Activity logs are tenant-level operational data, not branch-specific
  cacheStrategy: 'server-only' as const,
  
  // ============================================================================
  // UI DISPLAY
  // ============================================================================
  display: {
    title: 'Activity Stream',
    description: 'Real-time job activity and event monitoring',
    icon: 'Activity'
  },
  
  // ============================================================================
  // FIELD DEFINITIONS
  // ============================================================================
  fields: [
    {
      key: 'id',
      label: 'Activity ID',
      type: 'text' as const,
      autoValue: { source: 'auto.uuid' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    },
    {
      key: 'jobId',
      label: 'Job ID',
      type: 'text' as const,
      required: true,
      table: {
        width: 'lg',
        filterable: true
      },
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'activityType',
      label: 'Activity',
      type: 'select' as const,
      required: true,
      options: {
        static: [
          { value: 'JOB_CREATED', label: 'Job Created' },
          { value: 'JOB_STARTED', label: 'Job Started' },
          { value: 'JOB_COMPLETED', label: 'Job Completed' },
          { value: 'JOB_FAILED', label: 'Job Failed' },
          { value: 'JOB_CANCELLED', label: 'Job Cancelled' },
          { value: 'JOB_RETRIED', label: 'Job Retried' },
          { value: 'JOB_TIMEOUT', label: 'Job Timeout' },
          { value: 'WORKER_ASSIGNED', label: 'Worker Assigned' },
          { value: 'WORKER_RELEASED', label: 'Worker Released' },
          { value: 'RESOURCE_ALLOCATED', label: 'Resource Allocated' },
          { value: 'RESOURCE_RELEASED', label: 'Resource Released' },
          { value: 'ERROR_OCCURRED', label: 'Error Occurred' },
          { value: 'USER_ACTION', label: 'User Action' },
          { value: 'SYSTEM_EVENT', label: 'System Event' }
        ]
      },
      table: {
        width: 'lg',
        filterable: true
      },
      mobile: { priority: 'high' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'title',
      label: 'Title',
      type: 'text' as const,
      required: true,
      table: {
        width: 'xl'
      },
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'xl' as const }
    },
    {
      key: 'severity',
      label: 'Severity',
      type: 'select' as const,
      required: false,
      options: {
        static: [
          { value: 'INFO', label: 'Info' },
          { value: 'WARNING', label: 'Warning' },
          { value: 'ERROR', label: 'Error' },
          { value: 'CRITICAL', label: 'Critical' }
        ]
      },
      table: {
        width: 'sm',
        filterable: true
      },
      mobile: { priority: 'medium' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'sm' as const }
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: false,
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'xl' as const }
    },
    {
      key: 'userId',
      label: 'User',
      type: 'text' as const,
      required: false,
      table: {
        width: 'md',
        filterable: true
      },
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'systemComponent',
      label: 'Component',
      type: 'text' as const,
      required: false,
      table: {
        width: 'md',
        filterable: true
      },
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'md' as const }
    },
    {
      key: 'duration',
      label: 'Duration (ms)',
      type: 'number' as const,
      required: false,
      table: {
        width: 'sm'
      },
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'sm' as const }
    },
    {
      key: 'correlationId',
      label: 'Correlation ID',
      type: 'text' as const,
      required: false,
      table: {
        width: 'lg',
        filterable: true
      },
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'traceId',
      label: 'Trace ID',
      type: 'text' as const,
      required: false,
      table: {
        width: 'lg',
        filterable: true
      },
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'createdAt',
      label: 'Timestamp',
      type: 'datetime' as const,
      required: true,
      table: {
        width: 'lg'
      },
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { tableWidth: 'lg' as const }
    },
    {
      key: 'isVisible',
      label: 'Visible',
      type: 'switch' as const,
      required: true,
      defaultValue: true,
      mobile: { priority: 'low' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'xs' as const }
    },
    {
      key: 'isSystemGenerated',
      label: 'System',
      type: 'switch' as const,
      required: true,
      defaultValue: false,
      table: {
        width: 'xs',
        filterable: true
      },
      mobile: { priority: 'low' as const, displayFormat: 'badge' as const },
      desktop: { tableWidth: 'xs' as const }
    },
    // System fields
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text' as const,
      autoValue: { source: 'session.user.tenantId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { tableWidth: 'xs' as const }
    }
  ],
  
  // ============================================================================
  // SEARCH CONFIGURATION
  // ============================================================================
  search: {
    fields: ['title', 'description', 'jobId', 'correlationId', 'traceId'],
    placeholder: 'Search activities...',
    fuzzy: true
  },
  
  // ============================================================================
  // FILTERING CONFIGURATION - Advanced Activity Stream Filtering
  // ============================================================================
  filtering: {
    level1: {
      title: 'Activity Type',
      filterField: 'activityType',
      tabs: [
        { id: 'all', label: 'All Activities', value: 'all' },
        { id: 'job-lifecycle', label: 'Job Lifecycle', value: 'JOB_CREATED,JOB_STARTED,JOB_COMPLETED', icon: 'Package' },
        { id: 'errors', label: 'Errors', value: 'JOB_FAILED,ERROR_OCCURRED,JOB_TIMEOUT', icon: 'AlertTriangle' },
        { id: 'workers', label: 'Workers', value: 'WORKER_ASSIGNED,WORKER_RELEASED', icon: 'Users' },
        { id: 'resources', label: 'Resources', value: 'RESOURCE_ALLOCATED,RESOURCE_RELEASED', icon: 'Server' },
        { id: 'user-actions', label: 'User Actions', value: 'USER_ACTION', icon: 'User' }
      ],
      showAll: true,
      defaultTab: 'all'
    },
    level2: {
      title: 'Severity',
      filterField: 'severity',
      groupBy: 'severity',
      showAll: true
    }
  },
  
  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,  // Activities can be logged manually
    update: false, // Activities are immutable
    delete: false, // Auto-cleanup handles deletion
    duplicate: false,
    bulk: false,
    optimistic: false,
    serverOnly: true
  },
  
  // ============================================================================
  // MOBILE CONFIGURATION
  // ============================================================================
  mobile: {
    cardFormat: 'detailed' as const,
    primaryField: 'title',
    secondaryFields: ['activityType', 'severity', 'createdAt', 'jobId'],
    showSearch: true,
    showFilters: true,
    fabPosition: 'bottom-right' as const
  },
  
  // ============================================================================
  // DESKTOP CONFIGURATION
  // ============================================================================
  desktop: {
    sortField: 'createdAt',
    sortOrder: 'desc' as const, // Latest activities first
    editableField: undefined, // Activities are read-only
    rowActions: false,
    bulkActions: false,
    density: 'compact' as const // More activities visible
  },
  
  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================
  table: {
    width: 'full',
    bulkSelect: false, // No bulk operations for activities
    columnFilter: true,
    sortableColumns: true
  },
  
  // ============================================================================
  // INDEXEDDB CONFIGURATION
  // ============================================================================
  indexedDBKey: (record: any) => record.id,
}