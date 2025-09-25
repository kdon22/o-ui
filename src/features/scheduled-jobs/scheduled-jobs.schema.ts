/**
 * Scheduled Jobs Schema - Job Management & Scheduling
 * 
 * Complete job scheduling system with cron expressions, configuration management,
 * and execution control. Used in Queue Management Scheduled Jobs tab.
 * 
 * Features:
 * - Cron expression scheduling with next run calculation
 * - Job configuration management (JSON config)
 * - Execution history and monitoring
 * - Row actions for job control (run, pause, edit)
 */

import { z } from 'zod';
import type { ResourceSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// CORE SCHEMA DEFINITION
// ============================================================================

export const ScheduledJobSchema = z.object({
  // Core fields
  id: z.string(),
  name: z.string().min(1, 'Job name is required'),
  jobType: z.string().min(1, 'Job type is required'),
  description: z.string().optional(),
  
  // Scheduling
  cronExpr: z.string().min(1, 'Cron expression is required'),
  timezone: z.string().default('UTC'),
  nextRunAt: z.string().optional(), // ISO timestamp
  lastRunAt: z.string().optional(), // ISO timestamp
  
  // Configuration
  config: z.record(z.any()).default({}), // JSON configuration
  priority: z.number().min(0).max(10).default(5),
  maxRetries: z.number().min(0).default(3),
  timeoutMinutes: z.number().min(1).default(30),
  
  // Status and control
  isActive: z.boolean().default(true),
  isPaused: z.boolean().default(false),
  status: z.enum(['idle', 'running', 'completed', 'failed', 'paused']).default('idle'),
  
  // Execution tracking
  totalRuns: z.number().default(0),
  successfulRuns: z.number().default(0),
  failedRuns: z.number().default(0),
  averageRuntimeMinutes: z.number().optional(),
  lastErrorMessage: z.string().optional(),
  
  // Dependencies
  dependsOn: z.array(z.string()).default([]), // Array of job IDs
  tags: z.array(z.string()).default([]),
  
  // System fields
  tenantId: z.string(),
  branchId: z.string(),
  version: z.number().default(1),
  
  // Audit fields
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().optional(),
  updatedById: z.string().optional(),
  
  // Branching fields
  originalScheduledJobId: z.string().optional(),
});

export type ScheduledJob = z.infer<typeof ScheduledJobSchema>;

// ============================================================================
// RESOURCE SCHEMA CONFIGURATION
// ============================================================================

export const SCHEDULED_JOBS_SCHEMA: ResourceSchema = {
  // Metadata
  key: 'scheduledJobs',
  version: '1.0.0',
  description: 'Scheduled job management with cron expressions and execution control',
  
  // Core configuration
  schema: ScheduledJobSchema,
  modelName: 'ScheduledJob',
  tableName: 'scheduled_jobs',
  
  // Display configuration
  displayName: 'Scheduled Job',
  displayNamePlural: 'Scheduled Jobs',
  
  // Icon and branding
  icon: 'Calendar',
  iconColor: 'purple',
  
  // ============================================================================
  // FIELD DEFINITIONS
  // ============================================================================
  fields: {
    // Primary identification
    id: { type: 'id', label: 'Job ID', visible: false },
    name: { 
      type: 'text', 
      label: 'Job Name', 
      visible: true, 
      searchable: true,
      required: true 
    },
    jobType: { 
      type: 'text', 
      label: 'Job Type', 
      visible: true, 
      filterable: true,
      searchable: true 
    },
    description: { type: 'textarea', label: 'Description', visible: true, searchable: true },
    
    // Scheduling configuration
    cronExpr: { 
      type: 'text', 
      label: 'Cron Expression', 
      visible: true,
      required: true,
      placeholder: '0 */15 * * * *' // Every 15 minutes
    },
    timezone: { 
      type: 'select', 
      label: 'Timezone', 
      visible: true,
      options: ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
      defaultValue: 'UTC'
    },
    nextRunAt: { type: 'datetime', label: 'Next Run', visible: true, sortable: true },
    lastRunAt: { type: 'datetime', label: 'Last Run', visible: true, sortable: true },
    
    // Status and control
    isActive: { type: 'boolean', label: 'Active', visible: true, filterable: true },
    isPaused: { type: 'boolean', label: 'Paused', visible: true, filterable: true },
    status: { 
      type: 'select', 
      label: 'Status', 
      visible: true, 
      filterable: true,
      options: ['idle', 'running', 'completed', 'failed', 'paused']
    },
    
    // Configuration
    priority: { type: 'number', label: 'Priority', visible: true, min: 0, max: 10 },
    maxRetries: { type: 'number', label: 'Max Retries', visible: true, min: 0 },
    timeoutMinutes: { type: 'number', label: 'Timeout (min)', visible: true, min: 1 },
    
    // Statistics
    totalRuns: { type: 'number', label: 'Total Runs', visible: true, readonly: true },
    successfulRuns: { type: 'number', label: 'Successful', visible: true, readonly: true },
    failedRuns: { type: 'number', label: 'Failed', visible: true, readonly: true },
    averageRuntimeMinutes: { type: 'number', label: 'Avg Runtime (min)', visible: true, readonly: true },
    
    // Metadata
    tags: { 
      type: 'multiselect', 
      label: 'Tags', 
      visible: true, 
      filterable: true,
      placeholder: 'Add tags...'
    },
    
    // Audit fields
    createdAt: { type: 'datetime', label: 'Created', visible: true, sortable: true },
    updatedAt: { type: 'datetime', label: 'Last Updated', visible: false, sortable: true },
  },
  
  // ============================================================================
  // ACTIONS CONFIGURATION
  // ============================================================================
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: true, // Useful for creating similar jobs
    bulk: true,      // Bulk enable/disable/delete
    optimistic: true, // Jobs can be updated optimistically
    serverOnly: false // Jobs can be cached locally
  },

  // Non-branch-aware: Scheduled jobs are tenant-level operational configs
  branchAware: false,

  // ============================================================================
  // ROW ACTIONS - Job Management Controls
  // ============================================================================
  rowActions: [
    {
      key: 'run-now',
      label: 'Run Now',
      icon: 'Play',
      variant: 'default',
      conditions: [
        { field: 'isActive', operator: 'equals', value: true },
        { field: 'status', operator: 'not_in', value: ['running'] }
      ],
      mutation: {
        action: 'scheduledJobs.runNow',
        payload: { immediate: true },
        confirmMessage: 'Execute this job immediately?'
      }
    },
    {
      key: 'pause',
      label: 'Pause',
      icon: 'Pause',
      variant: 'outline',
      conditions: [
        { field: 'isActive', operator: 'equals', value: true },
        { field: 'isPaused', operator: 'equals', value: false }
      ],
      mutation: {
        action: 'scheduledJobs.update',
        payload: { isPaused: true },
        confirmMessage: 'Pause this job? It will not run on schedule until resumed.'
      }
    },
    {
      key: 'resume',
      label: 'Resume',
      icon: 'Play',
      variant: 'default',
      conditions: [
        { field: 'isActive', operator: 'equals', value: true },
        { field: 'isPaused', operator: 'equals', value: true }
      ],
      mutation: {
        action: 'scheduledJobs.update',
        payload: { isPaused: false },
        confirmMessage: 'Resume this job? It will return to normal schedule.'
      }
    },
    {
      key: 'edit-schedule',
      label: 'Edit Schedule',
      icon: 'Clock',
      variant: 'ghost',
      dialog: {
        component: 'JobScheduleDialog',
        title: 'Edit Job Schedule',
        action: 'scheduledJobs.updateSchedule',
        props: { showCronHelper: true, showNextRuns: true }
      }
    },
    {
      key: 'view-config',
      label: 'View Config',
      icon: 'Settings',
      variant: 'ghost',
      dialog: {
        component: 'JobConfigDialog',
        title: 'Job Configuration',
        action: 'scheduledJobs.getConfig',
        props: { readonly: false, showJsonEditor: true }
      }
    },
    {
      key: 'view-history',
      label: 'View History',
      icon: 'History',
      variant: 'ghost',
      navigation: {
        href: '/jobs/{id}/history',
        target: '_blank'
      }
    },
    {
      key: 'duplicate',
      label: 'Duplicate',
      icon: 'Copy',
      variant: 'ghost',
      mutation: {
        action: 'scheduledJobs.duplicate',
        payload: { suffix: '_copy' },
        confirmMessage: 'Create a copy of this job?'
      }
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: 'Trash2',
      variant: 'destructive',
      conditions: [
        { field: 'status', operator: 'not_in', value: ['running'] }
      ],
      mutation: {
        action: 'scheduledJobs.delete',
        payload: {},
        confirmMessage: 'Delete this scheduled job? This action cannot be undone and will remove all execution history.'
      }
    }
  ],
  
  // ============================================================================
  // UI CONFIGURATION
  // ============================================================================
  
  // Default sorting (by next run time)
  defaultSort: [{ field: 'nextRunAt', direction: 'asc' }],
  
  // Default filters (active jobs only)
  defaultFilters: {
    isActive: true
  },
  
  // Search configuration
  searchFields: ['name', 'jobType', 'description', 'tags'],
  
  // Mobile configuration
  mobile: {
    cardView: true,
    primaryField: 'name',
    secondaryField: 'jobType',
    metaFields: ['status', 'nextRunAt', 'cronExpr'],
    compactMode: false // Jobs need more space for config details
  },
  
  // Form configuration
  form: {
    layout: 'tabs',
    tabs: [
      {
        key: 'general',
        label: 'General',
        fields: ['name', 'jobType', 'description', 'isActive']
      },
      {
        key: 'schedule',
        label: 'Schedule',
        fields: ['cronExpr', 'timezone', 'priority']
      },
      {
        key: 'config',
        label: 'Configuration',
        fields: ['config', 'maxRetries', 'timeoutMinutes', 'dependsOn', 'tags']
      }
    ]
  }
};

// Export for use in other components
export default SCHEDULED_JOBS_SCHEMA;
