/**
 * End Transact Settings Schema - Server-Only Configuration
 * Configuration for transaction completion and finalization processes
 */

import { z } from 'zod';

// End Transact Settings Configuration Schema
export const EndTransactSettingsSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  transactionType: z.enum(['booking', 'payment', 'cancellation', 'refund', 'modification']).default('booking'),
  isActive: z.boolean().default(true),
  
  // Transaction completion settings
  autoComplete: z.boolean().default(true),
  completionDelay: z.number().default(0), // seconds
  requireConfirmation: z.boolean().default(false),
  
  // Validation settings
  validateBeforeComplete: z.boolean().default(true),
  validationRules: z.array(z.string()).default([]), // Rule IDs
  failureAction: z.enum(['retry', 'abort', 'manual', 'rollback']).default('retry'),
  
  // Retry settings
  maxRetries: z.number().default(3),
  retryDelay: z.number().default(5), // seconds
  backoffMultiplier: z.number().default(2),
  
  // Notification settings
  notifyOnSuccess: z.boolean().default(false),
  notifyOnFailure: z.boolean().default(true),
  notificationChannels: z.array(z.enum(['email', 'sms', 'webhook'])).default(['email']),
  recipients: z.array(z.string()).default([]),
  
  // Cleanup settings
  cleanupEnabled: z.boolean().default(true),
  cleanupDelay: z.number().default(3600), // seconds
  archiveCompleted: z.boolean().default(true),
  archiveAfterDays: z.number().default(30),
  
  // Logging settings
  logLevel: z.enum(['none', 'error', 'warn', 'info', 'debug']).default('info'),
  logDetails: z.boolean().default(true),
  auditTrail: z.boolean().default(true),
  
  // System fields
  tenantId: z.string(),
  branchId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  version: z.number().default(1),
  
  // Branching fields
  originalEndTransactSettingsId: z.string().nullable(),
});

export type EndTransactSettings = z.infer<typeof EndTransactSettingsSchema>;

export const END_TRANSACT_SETTINGS_SCHEMA = {
  databaseKey: 'endTransactSettings',
  modelName: 'EndTransactSettings',
  actionPrefix: 'endTransactSettings',
  schema: EndTransactSettingsSchema,
  relations: ['tenant', 'branch', 'createdBy', 'updatedBy'],
  primaryKey: ['id'],
  
  // Server-only configuration - no IndexedDB caching
  serverOnly: true,
  
  // ResourceSchema for auto-table/form generation
  ui: {
    displayField: 'name',
    searchFields: ['name', 'description', 'transactionType'],
    tableColumns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'transactionType', label: 'Transaction Type', sortable: true },
      { key: 'autoComplete', label: 'Auto Complete', type: 'boolean' },
      { key: 'isActive', label: 'Status', type: 'boolean' },
      { key: 'updatedAt', label: 'Last Updated', type: 'datetime' }
    ]
  },
  
  // Form fields for auto-form
  fields: {
    name: { type: 'text', required: true, label: 'Name' },
    description: { type: 'textarea', label: 'Description' },
    transactionType: { 
      type: 'select', 
      required: true,
      label: 'Transaction Type',
      options: [
        { value: 'booking', label: 'Booking' },
        { value: 'payment', label: 'Payment' },
        { value: 'cancellation', label: 'Cancellation' },
        { value: 'refund', label: 'Refund' },
        { value: 'modification', label: 'Modification' }
      ]
    },
    isActive: { type: 'boolean', label: 'Active' },
    autoComplete: { type: 'boolean', label: 'Auto Complete' },
    completionDelay: { type: 'number', label: 'Completion Delay (seconds)' },
    requireConfirmation: { type: 'boolean', label: 'Require Confirmation' },
    validateBeforeComplete: { type: 'boolean', label: 'Validate Before Complete' },
    failureAction: { 
      type: 'select', 
      label: 'Failure Action',
      options: [
        { value: 'retry', label: 'Retry' },
        { value: 'abort', label: 'Abort' },
        { value: 'manual', label: 'Manual Review' },
        { value: 'rollback', label: 'Rollback' }
      ]
    },
    maxRetries: { type: 'number', label: 'Max Retries' },
    retryDelay: { type: 'number', label: 'Retry Delay (seconds)' },
    backoffMultiplier: { type: 'number', label: 'Backoff Multiplier' },
    notifyOnSuccess: { type: 'boolean', label: 'Notify on Success' },
    notifyOnFailure: { type: 'boolean', label: 'Notify on Failure' },
    notificationChannels: { 
      type: 'multiselect', 
      label: 'Notification Channels',
      options: [
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
        { value: 'webhook', label: 'Webhook' }
      ]
    },
    recipients: { type: 'tags', label: 'Recipients' },
    cleanupEnabled: { type: 'boolean', label: 'Enable Cleanup' },
    cleanupDelay: { type: 'number', label: 'Cleanup Delay (seconds)' },
    archiveCompleted: { type: 'boolean', label: 'Archive Completed' },
    archiveAfterDays: { type: 'number', label: 'Archive After (days)' },
    logLevel: { 
      type: 'select', 
      label: 'Log Level',
      options: [
        { value: 'none', label: 'None' },
        { value: 'error', label: 'Error' },
        { value: 'warn', label: 'Warning' },
        { value: 'info', label: 'Info' },
        { value: 'debug', label: 'Debug' }
      ]
    },
    logDetails: { type: 'boolean', label: 'Log Details' },
    auditTrail: { type: 'boolean', label: 'Audit Trail' }
  }
} as const;
