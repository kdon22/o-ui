/**
 * Runtime Notifications Schema - Server-Only Configuration
 * Real-time notification settings for system events and alerts
 */

import { z } from 'zod';

// Runtime Notifications Configuration Schema
export const RuntimeNotificationsSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  eventType: z.enum(['error', 'warning', 'info', 'success', 'critical']).default('info'),
  isActive: z.boolean().default(true),
  
  // Trigger settings
  triggerCondition: z.string().optional(), // JSON condition
  triggerThreshold: z.number().optional(),
  triggerFrequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('immediate'),
  
  // Notification channels
  channels: z.array(z.enum(['email', 'sms', 'webhook', 'slack', 'teams'])).default(['email']),
  recipients: z.array(z.string()).default([]), // Email addresses or user IDs
  
  // Advanced settings
  cooldownMinutes: z.number().default(60), // Prevent spam
  maxPerDay: z.number().default(100),
  escalationRules: z.record(z.string(), z.any()).default({}),
  
  // Template settings
  subject: z.string().optional(),
  message: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  
  // System fields
  tenantId: z.string(),
  branchId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  version: z.number().default(1),
  
  // Branching fields
  originalRuntimeNotificationsId: z.string().nullable(),
});

export type RuntimeNotifications = z.infer<typeof RuntimeNotificationsSchema>;

export const RUNTIME_NOTIFICATIONS_SCHEMA = {
  databaseKey: 'runtimeNotifications',
  modelName: 'RuntimeNotifications',
  actionPrefix: 'runtimeNotifications',
  schema: RuntimeNotificationsSchema,
  relations: ['tenant', 'branch', 'createdBy', 'updatedBy'],
  primaryKey: ['id'],
  
  // Server-only configuration - no IndexedDB caching
  serverOnly: true,
  
  // ResourceSchema for auto-table/form generation
  ui: {
    displayField: 'name',
    searchFields: ['name', 'description', 'eventType'],
    tableColumns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'eventType', label: 'Event Type', sortable: true },
      { key: 'priority', label: 'Priority', sortable: true },
      { key: 'isActive', label: 'Status', type: 'boolean' },
      { key: 'updatedAt', label: 'Last Updated', type: 'datetime' }
    ]
  },
  
  // Form fields for auto-form
  fields: {
    name: { type: 'text', required: true, label: 'Name' },
    description: { type: 'textarea', label: 'Description' },
    eventType: { 
      type: 'select', 
      required: true,
      label: 'Event Type',
      options: [
        { value: 'error', label: 'Error' },
        { value: 'warning', label: 'Warning' },
        { value: 'info', label: 'Info' },
        { value: 'success', label: 'Success' },
        { value: 'critical', label: 'Critical' }
      ]
    },
    isActive: { type: 'boolean', label: 'Active' },
    triggerCondition: { type: 'textarea', label: 'Trigger Condition (JSON)' },
    triggerThreshold: { type: 'number', label: 'Trigger Threshold' },
    triggerFrequency: { 
      type: 'select', 
      label: 'Frequency',
      options: [
        { value: 'immediate', label: 'Immediate' },
        { value: 'hourly', label: 'Hourly' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' }
      ]
    },
    channels: { 
      type: 'multiselect', 
      label: 'Notification Channels',
      options: [
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
        { value: 'webhook', label: 'Webhook' },
        { value: 'slack', label: 'Slack' },
        { value: 'teams', label: 'Microsoft Teams' }
      ]
    },
    recipients: { type: 'tags', label: 'Recipients (emails)' },
    cooldownMinutes: { type: 'number', label: 'Cooldown (minutes)' },
    maxPerDay: { type: 'number', label: 'Max per Day' },
    subject: { type: 'text', label: 'Subject Template' },
    message: { type: 'textarea', label: 'Message Template' },
    priority: { 
      type: 'select', 
      label: 'Priority',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ]
    }
  }
} as const;
