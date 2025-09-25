/**
 * Hit Settings Schema - Server-Only Configuration
 * Configuration for system hit detection and processing
 */

import { z } from 'zod';

// Hit Settings Configuration Schema
export const HitSettingsSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['api', 'database', 'file', 'queue']).default('api'),
  isActive: z.boolean().default(true),
  
  // Hit detection settings
  pattern: z.string().optional(), // Regex or pattern to match
  threshold: z.number().default(1),
  timeWindow: z.number().default(60), // seconds
  
  // Processing settings
  action: z.enum(['log', 'alert', 'block', 'redirect', 'custom']).default('log'),
  actionConfig: z.record(z.string(), z.any()).default({}),
  
  // Rate limiting
  rateLimitEnabled: z.boolean().default(false),
  maxHitsPerMinute: z.number().default(60),
  maxHitsPerHour: z.number().default(1000),
  
  // Response settings
  responseCode: z.number().default(200),
  responseMessage: z.string().optional(),
  responseHeaders: z.record(z.string(), z.string()).default({}),
  
  // Logging settings
  logLevel: z.enum(['none', 'error', 'warn', 'info', 'debug']).default('info'),
  logFormat: z.string().optional(),
  logRetentionDays: z.number().default(30),
  
  // System fields
  tenantId: z.string(),
  branchId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  version: z.number().default(1),
  
  // Branching fields
  originalHitSettingsId: z.string().nullable(),
});

export type HitSettings = z.infer<typeof HitSettingsSchema>;

export const HIT_SETTINGS_SCHEMA = {
  databaseKey: 'hitSettings',
  modelName: 'HitSettings',
  actionPrefix: 'hitSettings',
  schema: HitSettingsSchema,
  relations: ['tenant', 'branch', 'createdBy', 'updatedBy'],
  primaryKey: ['id'],
  
  // Server-only configuration - no IndexedDB caching
  serverOnly: true,
  
  // ResourceSchema for auto-table/form generation
  ui: {
    displayField: 'name',
    searchFields: ['name', 'description', 'type', 'pattern'],
    tableColumns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'type', label: 'Type', sortable: true },
      { key: 'action', label: 'Action', sortable: true },
      { key: 'isActive', label: 'Status', type: 'boolean' },
      { key: 'updatedAt', label: 'Last Updated', type: 'datetime' }
    ]
  },
  
  // Form fields for auto-form
  fields: {
    name: { type: 'text', required: true, label: 'Name' },
    description: { type: 'textarea', label: 'Description' },
    type: { 
      type: 'select', 
      required: true,
      label: 'Hit Type',
      options: [
        { value: 'api', label: 'API Hit' },
        { value: 'database', label: 'Database Hit' },
        { value: 'file', label: 'File Access' },
        { value: 'queue', label: 'Queue Hit' }
      ]
    },
    isActive: { type: 'boolean', label: 'Active' },
    pattern: { type: 'text', label: 'Pattern/Regex' },
    threshold: { type: 'number', label: 'Hit Threshold' },
    timeWindow: { type: 'number', label: 'Time Window (seconds)' },
    action: { 
      type: 'select', 
      label: 'Action',
      options: [
        { value: 'log', label: 'Log Only' },
        { value: 'alert', label: 'Send Alert' },
        { value: 'block', label: 'Block Request' },
        { value: 'redirect', label: 'Redirect' },
        { value: 'custom', label: 'Custom Action' }
      ]
    },
    rateLimitEnabled: { type: 'boolean', label: 'Enable Rate Limiting' },
    maxHitsPerMinute: { type: 'number', label: 'Max Hits/Minute', showIf: { rateLimitEnabled: true } },
    maxHitsPerHour: { type: 'number', label: 'Max Hits/Hour', showIf: { rateLimitEnabled: true } },
    responseCode: { type: 'number', label: 'Response Code' },
    responseMessage: { type: 'text', label: 'Response Message' },
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
    logRetentionDays: { type: 'number', label: 'Log Retention (days)' }
  }
} as const;
