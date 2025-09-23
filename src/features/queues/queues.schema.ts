/**
 * Travel Queue Management Schemas - Action System Integration
 * 
 * Frequency-based queue configurations for travel operations:
 * - Critical: 0-15 minutes (ticketing, payments, urgent)
 * - Standard: 16-60 minutes (seating, upgrades, waitlist) 
 * - Routine: 61+ minutes (reporting, cleanup, maintenance)
 */

import { z } from 'zod';
import type { ResourceSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const QueueConfigSchema = z.object({
  id: z.string(),
  tenantId: z.string(), 
  
  // Queue Identity
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  
  // Queue Type & Configuration
  type: z.enum(['GDS', 'Virtual']),
  priority: z.enum(['critical', 'standard', 'routine']),
  
  // Scheduling Configuration
  frequencyMinutes: z.number(),
  scheduleExpression: z.string(), // "*/5 * * * *" for every 5 minutes
  
  // GDS Configuration (for GDS type)
  gdsSystem: z.enum(['amadeus', 'sabre']).nullable(),
  gdsQueue: z.string().nullable(), // "Q/9", "Q/URGENT", etc.
  gdsOffice: z.string().nullable(), // "13Q1", "1SUB", etc.
  
  // Processing Configuration
  processId: z.string().nullable(),
  workflowId: z.string().nullable(),
  officeId: z.string().nullable(),
  
  // Operational Settings
  maxRetries: z.number(),
  timeoutMinutes: z.number(),
  concurrentLimit: z.number(),
  
  // Status & Control
  status: z.enum(['active', 'paused', 'sleeping', 'failed']),
  sleepUntil: z.string().nullable(),
  pauseReason: z.string().nullable(),
  
  // Performance Tracking
  lastRun: z.string().nullable(),
  nextRun: z.string().nullable(),
  averageRunTime: z.number().nullable(),
  successRate: z.number().nullable(),
  
  // System Fields
  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
});

export const QueueMessageSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  queueConfigId: z.string(),
  
  // Job Identity
  jobType: z.enum(['gds_queue_check', 'virtual_scheduled', 'utr_processing', 'follow_up']),
  pnr: z.string().nullable(),
  gdsLocator: z.string().nullable(),
  
  // Processing Status
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled', 'retrying']),
  priority: z.number(),
  
  // Worker Assignment
  workerId: z.string().nullable(),
  workerHost: z.string().nullable(),
  
  // Timing
  scheduledFor: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  processingTimeMs: z.number().nullable(),
  
  // Retry Handling
  attemptCount: z.number(),
  maxAttempts: z.number(),
  lastError: z.string().nullable(),
  
  // Job Data
  jobData: z.record(z.any()),
  result: z.record(z.any()).nullable(),
  
  // UTR Processing Specific
  utrCount: z.number().nullable(),
  utrsProcessed: z.number().nullable(),
  followUpJobsCreated: z.number().nullable(),
  
  // System Fields
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const QueueWorkerSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  
  // Worker Identity
  name: z.string(),
  host: z.string(),
  pid: z.number().nullable(),
  version: z.string().nullable(),
  
  // Status & Health
  status: z.enum(['idle', 'busy', 'offline', 'error']),
  lastHeartbeat: z.string().nullable(),
  startedAt: z.string(),
  
  // Current Assignment
  currentJobId: z.string().nullable(),
  currentJobType: z.string().nullable(),
  currentJobStarted: z.string().nullable(),
  
  // Performance
  jobsCompleted: z.number(),
  jobsFailed: z.number(),
  averageJobTime: z.number().nullable(),
  
  // Capabilities
  capabilities: z.array(z.string()),
  maxConcurrentJobs: z.number(),
  
  // System Fields
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type QueueConfig = z.infer<typeof QueueConfigSchema>;
export type QueueMessage = z.infer<typeof QueueMessageSchema>;
export type QueueWorker = z.infer<typeof QueueWorkerSchema>;

// ============================================================================
// RESOURCE SCHEMAS - ACTION SYSTEM INTEGRATION
// ============================================================================

export const QUEUE_CONFIG_SCHEMA: ResourceSchema = {
  databaseKey: 'queueConfigs',
  modelName: 'QueueConfig', 
  actionPrefix: 'queueConfigs',
  
  // Server-only configuration
  serverOnly: true,
  cacheStrategy: 'server-only',
  notHasBranchContext: true,
  
  display: {
    title: 'Travel Queue Configurations',
    description: 'GDS queue cleaning and scheduled job management',
    icon: 'clock',
    color: 'blue'
  },
  
  fields: [
    // Identity
    { 
      key: 'id', 
      label: 'ID', 
      type: 'text', 
      required: true,
      autoValue: { source: 'auto.uuid', required: true },
      form: { row: 1, width: 'full', showInForm: false }, 
      table: { width: 'sm', showInTable: false }
    },
    { 
      key: 'tenantId', 
      label: 'Tenant ID', 
      type: 'text', 
      required: true,
      autoValue: { source: 'session.user.tenantId', required: true },
      form: { row: 1, width: 'full', showInForm: false }, 
      table: { width: 'sm', showInTable: false }
    },
    
    // Queue Configuration
    { 
      key: 'name', 
      label: 'Queue Name', 
      type: 'text', 
      required: true,
      placeholder: 'e.g., ticketing-urgent',
      form: { row: 1, width: 'half' }, 
      table: { width: 'lg', sortable: true }
    },
    { 
      key: 'displayName', 
      label: 'Display Name', 
      type: 'text', 
      required: true,
      placeholder: 'e.g., Ticketing - Urgent Processing',
      form: { row: 1, width: 'half' }, 
      table: { width: 'xl', sortable: true }
    },
    { 
      key: 'description', 
      label: 'Description', 
      type: 'textarea', 
      form: { row: 2, width: 'full' }, 
      table: { width: 'xl', showInTable: false }
    },
    
    // Type & Priority
    { 
      key: 'type', 
      label: 'Queue Type', 
      type: 'select', 
      required: true,
      options: { 
        static: [
          { value: 'GDS', label: 'GDS Queue Cleaning' },
          { value: 'Virtual', label: 'Scheduled Jobs' }
        ]
      },
      form: { row: 3, width: 'third' }, 
      table: { width: 'sm', sortable: true }
    },
    { 
      key: 'priority', 
      label: 'Priority Level', 
      type: 'select', 
      required: true,
      options: {
        static: [
          { value: 'critical', label: 'Critical (0-15 min)' },
          { value: 'standard', label: 'Standard (16-60 min)' },
          { value: 'routine', label: 'Routine (61+ min)' }
        ]
      },
      form: { row: 3, width: 'third' }, 
      table: { width: 'sm', sortable: true }
    },
    { 
      key: 'frequencyMinutes', 
      label: 'Frequency (minutes)', 
      type: 'number', 
      required: true,
      form: { row: 3, width: 'third' }, 
      table: { width: 'sm', sortable: true }
    },
    
    // GDS Configuration
    { 
      key: 'gdsSystem', 
      label: 'GDS System', 
      type: 'select',
      options: {
        static: [
          { value: 'amadeus', label: 'Amadeus' },
          { value: 'sabre', label: 'Sabre' }
        ]
      },
      form: { row: 4, width: 'third' }, 
      table: { width: 'sm' }
    },
    { 
      key: 'gdsQueue', 
      label: 'GDS Queue', 
      type: 'text',
      placeholder: 'Q/9, Q/URGENT, etc.',
      form: { row: 4, width: 'third' }, 
      table: { width: 'sm' }
    },
    { 
      key: 'gdsOffice', 
      label: 'GDS Office', 
      type: 'text',
      placeholder: '13Q1, 1SUB, etc.',
      form: { row: 4, width: 'third' }, 
      table: { width: 'sm' }
    },
    
    // Processing Assignment
    { 
      key: 'processId', 
      label: 'Process ID', 
      type: 'text',
      form: { row: 5, width: 'third' }, 
      table: { width: 'sm', showInTable: false }
    },
    { 
      key: 'workflowId', 
      label: 'Workflow ID', 
      type: 'text',
      form: { row: 5, width: 'third' }, 
      table: { width: 'sm', showInTable: false }
    },
    { 
      key: 'officeId', 
      label: 'Office ID', 
      type: 'text',
      form: { row: 5, width: 'third' }, 
      table: { width: 'sm', showInTable: false }
    },
    
    // Operational Settings
    { 
      key: 'maxRetries', 
      label: 'Max Retries', 
      type: 'number', 
      defaultValue: 3,
      form: { row: 6, width: 'third' }, 
      table: { width: 'xs', showInTable: false }
    },
    { 
      key: 'timeoutMinutes', 
      label: 'Timeout (min)', 
      type: 'number', 
      defaultValue: 10,
      form: { row: 6, width: 'third' }, 
      table: { width: 'xs', showInTable: false }
    },
    { 
      key: 'concurrentLimit', 
      label: 'Concurrent Limit', 
      type: 'number', 
      defaultValue: 1,
      form: { row: 6, width: 'third' }, 
      table: { width: 'xs', showInTable: false }
    },
    
    // Status & Control
    { 
      key: 'status', 
      label: 'Status', 
      type: 'select', 
      required: true,
      defaultValue: 'active',
      options: {
        static: [
          { value: 'active', label: 'Active' },
          { value: 'paused', label: 'Paused' },
          { value: 'sleeping', label: 'Sleeping' },
          { value: 'failed', label: 'Failed' }
        ]
      },
      form: { row: 7, width: 'third' }, 
      table: { width: 'sm', sortable: true }
    },
    { 
      key: 'sleepUntil', 
      label: 'Sleep Until', 
      type: 'datetime',
      form: { row: 7, width: 'third' }, 
      table: { width: 'md' }
    },
    { 
      key: 'pauseReason', 
      label: 'Pause Reason', 
      type: 'text',
      form: { row: 7, width: 'third' }, 
      table: { width: 'lg', showInTable: false }
    },
    
    // Performance Fields (read-only, computed)
    { 
      key: 'lastRun', 
      label: 'Last Run', 
      type: 'datetime',
      form: { row: 8, width: 'half', showInForm: false }, 
      table: { width: 'md' }
    },
    { 
      key: 'nextRun', 
      label: 'Next Run', 
      type: 'datetime',
      form: { row: 8, width: 'half', showInForm: false }, 
      table: { width: 'md' }
    },
    
    // System Fields
    { 
      key: 'createdAt', 
      label: 'Created', 
      type: 'datetime',
      autoValue: { source: 'auto.timestamp', required: true },
      form: { row: 9, width: 'half', showInForm: false }, 
      table: { width: 'sm', showInTable: false }
    },
    { 
      key: 'updatedAt', 
      label: 'Updated', 
      type: 'datetime',
      autoValue: { source: 'auto.timestamp', required: true },
      form: { row: 9, width: 'half', showInForm: false }, 
      table: { width: 'sm', showInTable: false }
    }
  ],
  
  search: { 
    fields: ['name', 'displayName', 'type', 'gdsQueue', 'gdsOffice'], 
    placeholder: 'Search queues...', 
    mobileFilters: true, 
    fuzzy: true 
  },
  
  actions: { 
    create: true, 
    update: true, 
    delete: true,
    custom: [
      { id: 'pause', label: 'Pause Queue', icon: 'pause' },
      { id: 'resume', label: 'Resume Queue', icon: 'play' },
      { id: 'sleep', label: 'Sleep Queue', icon: 'moon' },
      { id: 'wake', label: 'Wake Queue', icon: 'sun' },
      { id: 'testConnection', label: 'Test Connection', icon: 'link' },
      { id: 'bulkUpdate', label: 'Bulk Update Queues', icon: 'layers' }
    ],
    serverOnly: true 
  },
  
  mobile: { 
    cardFormat: 'compact', 
    primaryField: 'displayName', 
    secondaryFields: ['type', 'priority', 'status'],
    showSearch: true, 
    showFilters: true, 
    fabPosition: 'bottom-right' 
  },
  
  desktop: { 
    sortField: 'displayName', 
    sortOrder: 'asc', 
    density: 'normal', 
    rowActions: true, 
    bulkActions: true 
  },
  
  table: { 
    width: 'full', 
    bulkSelect: true, 
    columnFilter: true, 
    sortableColumns: true 
  }
};

export const QUEUE_MESSAGE_SCHEMA: ResourceSchema = {
  databaseKey: 'queueMessages',
  modelName: 'QueueMessage',
  actionPrefix: 'queueMessages',
  
  serverOnly: true,
  cacheStrategy: 'server-only',
  notHasBranchContext: true,
  
  display: {
    title: 'Travel Processing Jobs',
    description: 'UTR processing and scheduled travel tasks',
    icon: 'activity',
    color: 'green'
  },
  
  fields: [
    // Identity
    { 
      key: 'id', 
      label: 'Job ID', 
      type: 'text', 
      required: true,
      form: { row: 1, width: 'full', showInForm: false }, 
      table: { width: 'md', sortable: true }
    },
    { 
      key: 'queueConfigId', 
      label: 'Queue', 
      type: 'text', 
      required: true,
      form: { row: 1, width: 'half' }, 
      table: { width: 'lg' }
    },
    { 
      key: 'jobType', 
      label: 'Job Type', 
      type: 'select',
      options: {
        static: [
          { value: 'gds_queue_check', label: 'GDS Queue Check' },
          { value: 'virtual_scheduled', label: 'Virtual Scheduled' },
          { value: 'utr_processing', label: 'UTR Processing' },
          { value: 'follow_up', label: 'Follow-up Task' }
        ]
      },
      form: { row: 1, width: 'half' }, 
      table: { width: 'sm', sortable: true }
    },
    
    // Travel Context
    { 
      key: 'pnr', 
      label: 'PNR', 
      type: 'text',
      form: { row: 2, width: 'half' }, 
      table: { width: 'sm' }
    },
    { 
      key: 'gdsLocator', 
      label: 'GDS Locator', 
      type: 'text',
      form: { row: 2, width: 'half' }, 
      table: { width: 'sm' }
    },
    
    // Status & Processing
    { 
      key: 'status', 
      label: 'Status', 
      type: 'select',
      options: {
        static: [
          { value: 'queued', label: 'Queued' },
          { value: 'processing', label: 'Processing' },
          { value: 'completed', label: 'Completed' },
          { value: 'failed', label: 'Failed' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'retrying', label: 'Retrying' }
        ]
      },
      form: { row: 3, width: 'third' }, 
      table: { width: 'sm', sortable: true }
    },
    { 
      key: 'priority', 
      label: 'Priority', 
      type: 'number',
      form: { row: 3, width: 'third' }, 
      table: { width: 'xs' }
    },
    { 
      key: 'workerId', 
      label: 'Worker', 
      type: 'text',
      form: { row: 3, width: 'third' }, 
      table: { width: 'sm' }
    },
    
    // Timing
    { 
      key: 'scheduledFor', 
      label: 'Scheduled For', 
      type: 'datetime',
      form: { row: 4, width: 'third' }, 
      table: { width: 'md', sortable: true }
    },
    { 
      key: 'startedAt', 
      label: 'Started At', 
      type: 'datetime',
      form: { row: 4, width: 'third' }, 
      table: { width: 'md' }
    },
    { 
      key: 'completedAt', 
      label: 'Completed At', 
      type: 'datetime',
      form: { row: 4, width: 'third' }, 
      table: { width: 'md' }
    },
    
    // UTR Processing Results
    { 
      key: 'utrCount', 
      label: 'UTRs Found', 
      type: 'number',
      form: { row: 5, width: 'third' }, 
      table: { width: 'xs' }
    },
    { 
      key: 'utrsProcessed', 
      label: 'UTRs Processed', 
      type: 'number',
      form: { row: 5, width: 'third' }, 
      table: { width: 'xs' }
    },
    { 
      key: 'followUpJobsCreated', 
      label: 'Follow-up Jobs', 
      type: 'number',
      form: { row: 5, width: 'third' }, 
      table: { width: 'xs' }
    },
    
    // Error Handling
    { 
      key: 'attemptCount', 
      label: 'Attempts', 
      type: 'number',
      form: { row: 6, width: 'half' }, 
      table: { width: 'xs' }
    },
    { 
      key: 'lastError', 
      label: 'Last Error', 
      type: 'textarea',
      form: { row: 6, width: 'half' }, 
      table: { width: 'xl', showInTable: false }
    },
    
    { 
      key: 'createdAt', 
      label: 'Created', 
      type: 'datetime',
      form: { row: 7, width: 'full', showInForm: false }, 
      table: { width: 'md', sortable: true }
    }
  ],
  
  search: { 
    fields: ['pnr', 'gdsLocator', 'status', 'jobType'], 
    placeholder: 'Search jobs...', 
    mobileFilters: true 
  },
  
  actions: { 
    create: false,
    update: false, 
    delete: false,
    list: true,
    custom: [
      { id: 'requeue', label: 'Requeue Job', icon: 'refresh' },
      { id: 'cancel', label: 'Cancel Job', icon: 'x' },
      { id: 'retry', label: 'Retry Now', icon: 'repeat' },
      { id: 'viewPayload', label: 'View Payload', icon: 'eye' }
    ],
    serverOnly: true 
  },
  
  mobile: { 
    cardFormat: 'expanded', 
    primaryField: 'pnr', 
    secondaryFields: ['jobType', 'status', 'scheduledFor'] 
  },
  
  desktop: { 
    sortField: 'createdAt', 
    sortOrder: 'desc' 
  }
};

export const QUEUE_WORKER_SCHEMA: ResourceSchema = {
  databaseKey: 'queueWorkers',
  modelName: 'QueueWorker',
  actionPrefix: 'queueWorkers',
  
  serverOnly: true,
  cacheStrategy: 'server-only',
  notHasBranchContext: true,
  
  display: {
    title: 'Queue Workers',
    description: 'GDS processing workers and system capacity',
    icon: 'server',
    color: 'purple'
  },
  
  fields: [
    { 
      key: 'id', 
      label: 'Worker ID', 
      type: 'text',
      form: { row: 1, width: 'full', showInForm: false }, 
      table: { width: 'md' }
    },
    { 
      key: 'name', 
      label: 'Worker Name', 
      type: 'text', 
      required: true,
      form: { row: 1, width: 'half' }, 
      table: { width: 'lg', sortable: true }
    },
    { 
      key: 'host', 
      label: 'Host', 
      type: 'text', 
      required: true,
      form: { row: 1, width: 'half' }, 
      table: { width: 'md' }
    },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'select',
      options: {
        static: [
          { value: 'idle', label: 'Idle' },
          { value: 'busy', label: 'Busy' },
          { value: 'offline', label: 'Offline' },
          { value: 'error', label: 'Error' }
        ]
      },
      form: { row: 2, width: 'third' }, 
      table: { width: 'sm', sortable: true }
    },
    { 
      key: 'currentJobId', 
      label: 'Current Job', 
      type: 'text',
      form: { row: 2, width: 'third' }, 
      table: { width: 'md' }
    },
    { 
      key: 'lastHeartbeat', 
      label: 'Last Heartbeat', 
      type: 'datetime',
      form: { row: 2, width: 'third' }, 
      table: { width: 'md', sortable: true }
    },
    { 
      key: 'jobsCompleted', 
      label: 'Jobs Completed', 
      type: 'number',
      form: { row: 3, width: 'half' }, 
      table: { width: 'sm' }
    },
    { 
      key: 'jobsFailed', 
      label: 'Jobs Failed', 
      type: 'number',
      form: { row: 3, width: 'half' }, 
      table: { width: 'sm' }
    }
  ],
  
  actions: { 
    create: false,
    update: false,
    delete: false,
    list: true,
    custom: [
      { id: 'terminate', label: 'Terminate Worker', icon: 'x-circle' },
      { id: 'restart', label: 'Restart Worker', icon: 'refresh' },
      { id: 'viewLogs', label: 'View Logs', icon: 'file-text' }
    ],
    serverOnly: true 
  },
  
  mobile: { 
    cardFormat: 'compact', 
    primaryField: 'name', 
    secondaryFields: ['status', 'host'] 
  }
};