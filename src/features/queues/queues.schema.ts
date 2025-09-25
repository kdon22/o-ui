import { z } from 'zod'
import type { ResourceSchema } from '@/lib/resource-system/schemas'

// ============================================================================
// QUEUE ENTITY SCHEMAS
// ============================================================================

/**
 * Queue Entity Schema
 * Represents a processing queue with real-time status
 */
export const QueueSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  queueType: z.enum(['VENDOR', 'INTERNAL', 'CRITICAL', 'STANDARD', 'ROUTINE']),
  office: z.string().nullable(),
  queueNumber: z.number(),
  category: z.string().nullable(),
  maxAge: z.number().default(0),
  isActive: z.boolean().default(true),
  
  // Real-time metrics
  monitoring: z.number().default(0),
  failed: z.number().default(0),
  sleeping: z.number().default(0),
  pnrsOnQueue: z.number().default(0),
  
  // Health indicators
  healthStatus: z.enum(['HEALTHY', 'WARNING', 'CRITICAL', 'OFFLINE']).default('HEALTHY'),
  lastProcessedAt: z.string().nullable(),
  processingRate: z.number().default(0), // items per minute
  averageWaitTime: z.number().default(0), // milliseconds
  
  // System fields
  tenantId: z.string(),
  branchId: z.string(),
  isDeleted: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  originalQueueId: z.string().nullable(),
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
  // SERVER-ONLY CONFIGURATION
  // ============================================================================
  serverOnly: true, // Large dataset - server-side rendering only
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
  // FIELD DEFINITIONS
  // ============================================================================
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: 'text' as const,
      autoValue: { source: 'auto.uuid' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { showInTable: false, tableWidth: 'xs' as const }
    },
    {
      key: 'name',
      label: 'Queue Name',
      type: 'text' as const,
      required: true,
      validation: [
        { type: 'required' as const, message: 'Queue name is required' },
        { type: 'minLength' as const, value: 3, message: 'Name too short' },
        { type: 'maxLength' as const, value: 100, message: 'Name too long' }
      ],
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { showInTable: true, tableWidth: 'lg' as const, sortable: true }
    },
    {
      key: 'displayName',
      label: 'Display Name', 
      type: 'text' as const,
      required: true,
      validation: [
        { type: 'required' as const, message: 'Display name is required' },
        { type: 'minLength' as const, value: 3, message: 'Display name too short' },
        { type: 'maxLength' as const, value: 150, message: 'Display name too long' }
      ],
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { showInTable: true, tableWidth: 'lg' as const, sortable: true }
    },
    {
      key: 'queueType',
      label: 'Queue Type',
      type: 'select' as const,
      required: true,
      options: {
        static: [
          { value: 'VENDOR', label: 'Vendor Queue' },
          { value: 'INTERNAL', label: 'Internal Queue' },
          { value: 'CRITICAL', label: 'Critical Operations' },
          { value: 'STANDARD', label: 'Standard Operations' },
          { value: 'ROUTINE', label: 'Routine Operations' }
        ]
      },
      mobile: { priority: 'medium' as const, displayFormat: 'badge' as const },
      desktop: { showInTable: true, tableWidth: 'md' as const, filterable: true }
    },
    {
      key: 'queueNumber',
      label: 'Queue #',
      type: 'number' as const,
      required: true,
      validation: [
        { type: 'required' as const, message: 'Queue number is required' },
        { type: 'min' as const, value: 1, message: 'Queue number must be positive' },
        { type: 'max' as const, value: 999, message: 'Queue number too large' }
      ],
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { showInTable: true, tableWidth: 'sm' as const, sortable: true }
    },
    {
      key: 'office',
      label: 'Office',
      type: 'text' as const,
      required: false,
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { showInTable: true, tableWidth: 'md' as const, filterable: true }
    },
    {
      key: 'category',
      label: 'Category',
      type: 'text' as const,
      required: false,
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { showInTable: false, tableWidth: 'md' as const }
    },
    {
      key: 'maxAge',
      label: 'Max Age (min)',
      type: 'number' as const,
      required: true,
      defaultValue: 0,
      validation: [
        { type: 'min' as const, value: 0, message: 'Max age must be non-negative' }
      ],
      mobile: { priority: 'low' as const, displayFormat: 'text' as const },
      desktop: { showInTable: false, tableWidth: 'sm' as const }
    },
    {
      key: 'pnrsOnQueue',
      label: 'Items in Queue',
      type: 'number' as const,
      required: false,
      defaultValue: 0,
      mobile: { priority: 'high' as const, displayFormat: 'badge' as const },
      desktop: { showInTable: true, tableWidth: 'sm' as const, sortable: true }
    },
    {
      key: 'healthStatus',
      label: 'Health',
      type: 'select' as const,
      required: true,
      defaultValue: 'HEALTHY',
      options: {
        static: [
          { value: 'HEALTHY', label: 'Healthy' },
          { value: 'WARNING', label: 'Warning' },
          { value: 'CRITICAL', label: 'Critical' },
          { value: 'OFFLINE', label: 'Offline' }
        ]
      },
      mobile: { priority: 'high' as const, displayFormat: 'badge' as const },
      desktop: { showInTable: true, tableWidth: 'md' as const, filterable: true }
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'boolean' as const,
      required: true,
      defaultValue: true,
      mobile: { priority: 'medium' as const, displayFormat: 'badge' as const },
      desktop: { showInTable: true, tableWidth: 'sm' as const, filterable: true }
    },
    // System fields
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text' as const,
      autoValue: { source: 'context.tenantId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { showInTable: false, tableWidth: 'xs' as const }
    },
    {
      key: 'branchId', 
      label: 'Branch ID',
      type: 'text' as const,
      autoValue: { source: 'context.branchId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { showInTable: false, tableWidth: 'xs' as const }
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
    bulkActions: false, // Critical infrastructure - no bulk operations
    density: 'normal' as const
  },
  
  // ============================================================================
  // INDEXEDDB CONFIGURATION
  // ============================================================================
  indexedDBKey: (record: any) => record.id,
  
  // ============================================================================
  // REAL-TIME CAPABILITIES
  // ============================================================================
  enableRealTimeUpdates: true,
  updateInterval: 5000 // 5 seconds
}

export const QUEUE_EVENT_SCHEMA: ResourceSchema = {
  // ============================================================================
  // RESOURCE IDENTITY - BULLETPROOF 3-FIELD DESIGN
  // ============================================================================
  databaseKey: 'queueEvents',
  modelName: 'QueueEvent',
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
      desktop: { showInTable: false, tableWidth: 'xs' as const }
    },
    {
      key: 'queueId',
      label: 'Queue',
      type: 'text' as const,
      required: true,
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { showInTable: true, tableWidth: 'md' as const, filterable: true }
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
      desktop: { showInTable: true, tableWidth: 'lg' as const, filterable: true }
    },
    {
      key: 'message',
      label: 'Message',
      type: 'text' as const,
      required: true,
      mobile: { priority: 'high' as const, displayFormat: 'text' as const },
      desktop: { showInTable: true, tableWidth: 'xl' as const }
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
      desktop: { showInTable: true, tableWidth: 'md' as const, filterable: true }
    },
    {
      key: 'timestamp',
      label: 'Timestamp',
      type: 'datetime' as const,
      required: true,
      mobile: { priority: 'medium' as const, displayFormat: 'text' as const },
      desktop: { showInTable: true, tableWidth: 'lg' as const, sortable: true }
    },
    // System fields
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text' as const,
      autoValue: { source: 'context.tenantId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { showInTable: false, tableWidth: 'xs' as const }
    },
    {
      key: 'branchId',
      label: 'Branch ID',
      type: 'text' as const,
      autoValue: { source: 'context.branchId' as const },
      mobile: { priority: 'low' as const, displayFormat: 'hidden' as const },
      desktop: { showInTable: false, tableWidth: 'xs' as const }
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
    editableField: null, // Events are read-only
    rowActions: false, // No row actions for events
    bulkActions: false,
    density: 'compact' as const // More events visible
  },
  
  // ============================================================================
  // INDEXEDDB CONFIGURATION
  // ============================================================================
  indexedDBKey: (record: any) => record.id,
  
  // ============================================================================
  // REAL-TIME CAPABILITIES
  // ============================================================================
  enableRealTimeStream: true,
  streamChannel: 'queue-events',
  
  // ============================================================================
  // AUTO-CLEANUP CONFIGURATION
  // ============================================================================
  autoCleanup: {
    enabled: true,
    retentionDays: 7 // Keep events for 7 days
  }
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