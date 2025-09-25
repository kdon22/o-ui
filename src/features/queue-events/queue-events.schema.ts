/**
 * Queue Events Schema - Activity Stream Management
 * 
 * Real-time queue event monitoring and activity streaming.
 * Used in Queue Management Activity Stream tab.
 * 
 * Features:
 * - Real-time event streaming with 5-second polling
 * - Event filtering and severity levels
 * - Activity metrics and processing rates
 * - Row actions for event management
 */

import { z } from 'zod';
import type { ResourceSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// CORE SCHEMA DEFINITION
// ============================================================================

export const QueueEventSchema = z.object({
  // Core fields
  id: z.string(),
  queueId: z.string(),
  type: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'retrying']),
  priority: z.number().min(0).max(10),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  
  // Event data
  eventType: z.string(), // 'JOB_START', 'JOB_COMPLETE', 'QUEUE_PAUSE', etc.
  message: z.string(),
  data: z.record(z.any()),
  metadata: z.record(z.any()),
  
  // Processing info
  processingTime: z.number().optional(), // milliseconds
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  lastError: z.string().optional(),
  
  // Timestamps
  queuedAt: z.string(), // ISO timestamp
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  nextRetryAt: z.string().optional(),
  
  // System fields
  tenantId: z.string(),
  branchId: z.string(),
  version: z.number().default(1),
  isActive: z.boolean().default(true),
  
  // Audit fields
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().optional(),
  updatedById: z.string().optional(),
  
  // Branching fields
  originalQueueEventId: z.string().optional(),
});

export type QueueEvent = z.infer<typeof QueueEventSchema>;

// ============================================================================
// RESOURCE SCHEMA CONFIGURATION
// ============================================================================

export const QUEUE_EVENTS_SCHEMA: ResourceSchema = {
  // Metadata
  key: 'queueEvents',
  version: '1.0.0',
  description: 'Real-time queue event monitoring and activity stream',
  
  // Core configuration
  schema: QueueEventSchema,
  modelName: 'QueueMessage', 
  tableName: 'queue_messages',
  
  // Display configuration
  displayName: 'Queue Events',
  displayNamePlural: 'Queue Events',
  
  // Icon and branding
  icon: 'Activity',
  iconColor: 'orange',
  
  // ============================================================================
  // FIELD DEFINITIONS
  // ============================================================================
  fields: {
    // Primary identification
    id: { type: 'id', label: 'Event ID', visible: false },
    queueId: { type: 'text', label: 'Queue ID', visible: true, searchable: true },
    type: { type: 'text', label: 'Type', visible: true, filterable: true },
    eventType: { type: 'text', label: 'Event Type', visible: true, filterable: true },
    
    // Status and priority
    status: { 
      type: 'select', 
      label: 'Status', 
      visible: true, 
      filterable: true,
      options: ['queued', 'processing', 'completed', 'failed', 'retrying']
    },
    severity: { 
      type: 'select', 
      label: 'Severity', 
      visible: true, 
      filterable: true,
      options: ['info', 'warning', 'error', 'critical']
    },
    priority: { type: 'number', label: 'Priority', visible: true, sortable: true },
    
    // Event details
    message: { type: 'text', label: 'Message', visible: true, searchable: true },
    processingTime: { type: 'number', label: 'Processing Time (ms)', visible: true },
    attempts: { type: 'number', label: 'Attempts', visible: true },
    
    // Timestamps
    queuedAt: { type: 'datetime', label: 'Queued At', visible: true, sortable: true },
    startedAt: { type: 'datetime', label: 'Started At', visible: true, sortable: true },
    completedAt: { type: 'datetime', label: 'Completed At', visible: true, sortable: true },
    
    // Audit fields  
    createdAt: { type: 'datetime', label: 'Created', visible: true, sortable: true },
    updatedAt: { type: 'datetime', label: 'Last Updated', visible: false, sortable: true },
  },
  
  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: false, // Events are system-generated
    update: false, // Events are immutable
    delete: true,  // Allow cleanup of old events
    duplicate: false,
    bulk: true,    // Bulk cleanup operations
    optimistic: false,
    serverOnly: true // Always fetch from server for real-time data
  },

  // Non-branch-aware: Queue events are operational data, not user content
  branchAware: false,

  // ============================================================================
  // ROW ACTIONS - Event Management
  // ============================================================================
  rowActions: [
    {
      key: 'retry',
      label: 'Retry',
      icon: 'RefreshCw',
      variant: 'default',
      conditions: [
        { field: 'status', operator: 'in', value: ['failed', 'error'] },
        { field: 'attempts', operator: '<', value: 3 }
      ],
      mutation: {
        action: 'queueEvents.retry',
        payload: { action: 'retry' },
        confirmMessage: 'Retry this failed event?'
      }
    },
    {
      key: 'view-details',
      label: 'View Details',
      icon: 'Eye',
      variant: 'ghost',
      dialog: {
        component: 'QueueEventDetailsDialog',
        title: 'Event Details',
        action: 'queueEvents.getDetails',
        props: { showMetadata: true, showData: true }
      }
    },
    {
      key: 'view-logs',
      label: 'View Logs',
      icon: 'FileText',
      variant: 'ghost',
      navigation: {
        href: '/logs?eventId={id}',
        target: '_blank'
      }
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: 'Trash2',
      variant: 'destructive',
      conditions: [
        { field: 'status', operator: 'in', value: ['completed', 'failed'] }
      ],
      mutation: {
        action: 'queueEvents.delete',
        payload: {},
        confirmMessage: 'Delete this event record? This action cannot be undone.'
      }
    }
  ],
  
  // ============================================================================
  // UI CONFIGURATION
  // ============================================================================
  
  // Default sorting (newest first)
  defaultSort: [{ field: 'createdAt', direction: 'desc' }],
  
  // Default filters for activity stream
  defaultFilters: {
    isActive: true,
    // Show events from last 24 hours by default
    createdAt: { 
      operator: 'gte', 
      value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
    }
  },
  
  // Real-time configuration
  realTime: {
    enabled: true,
    interval: 5000, // 5 second polling
    maxItems: 1000, // Limit for performance
    autoRefresh: true
  },
  
  // Mobile configuration
  mobile: {
    cardView: true,
    primaryField: 'message',
    secondaryField: 'eventType',
    metaFields: ['status', 'severity', 'queuedAt'],
    compactMode: true
  }
};

// Export for use in other components
export default QUEUE_EVENTS_SCHEMA;
