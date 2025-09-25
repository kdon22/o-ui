/**
 * Communications Schema - Server-Only Configuration
 * Communication settings for email, SMS, and notifications
 */

import { z } from 'zod';

// Communications Configuration Schema
export const CommunicationsSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['email', 'sms', 'webhook', 'slack']).default('email'),
  isActive: z.boolean().default(true),
  
  // Email settings
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromEmail: z.string().optional(),
  fromName: z.string().optional(),
  
  // SMS settings
  smsProvider: z.string().optional(),
  smsApiKey: z.string().optional(),
  smsFromNumber: z.string().optional(),
  
  // Webhook settings
  webhookUrl: z.string().optional(),
  webhookSecret: z.string().optional(),
  
  // Template settings
  templates: z.record(z.string(), z.string()).default({}),
  
  // System fields
  tenantId: z.string(),
  branchId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdById: z.string().nullable(),
  updatedById: z.string().nullable(),
  version: z.number().default(1),
  
  // Branching fields
  originalCommunicationsId: z.string().nullable(),
});

export type Communications = z.infer<typeof CommunicationsSchema>;

export const COMMUNICATIONS_SCHEMA = {
  databaseKey: 'communications',
  modelName: 'Communications',
  actionPrefix: 'communications',
  schema: CommunicationsSchema,
  relations: ['tenant', 'branch', 'createdBy', 'updatedBy'],
  primaryKey: ['id'],
  
  // Server-only configuration - no IndexedDB caching
  serverOnly: true,
  
  // ResourceSchema for auto-table/form generation
  ui: {
    displayField: 'name',
    searchFields: ['name', 'description', 'type'],
    tableColumns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'type', label: 'Type', sortable: true },
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
      label: 'Type',
      options: [
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
        { value: 'webhook', label: 'Webhook' },
        { value: 'slack', label: 'Slack' }
      ]
    },
    isActive: { type: 'boolean', label: 'Active' },
    
    // Conditional fields based on type
    smtpHost: { type: 'text', label: 'SMTP Host', showIf: { type: 'email' } },
    smtpPort: { type: 'number', label: 'SMTP Port', showIf: { type: 'email' } },
    smtpUser: { type: 'text', label: 'SMTP Username', showIf: { type: 'email' } },
    smtpPassword: { type: 'password', label: 'SMTP Password', showIf: { type: 'email' } },
    fromEmail: { type: 'email', label: 'From Email', showIf: { type: 'email' } },
    fromName: { type: 'text', label: 'From Name', showIf: { type: 'email' } },
    
    smsProvider: { type: 'text', label: 'SMS Provider', showIf: { type: 'sms' } },
    smsApiKey: { type: 'password', label: 'API Key', showIf: { type: 'sms' } },
    smsFromNumber: { type: 'text', label: 'From Number', showIf: { type: 'sms' } },
    
    webhookUrl: { type: 'url', label: 'Webhook URL', showIf: { type: 'webhook' } },
    webhookSecret: { type: 'password', label: 'Webhook Secret', showIf: { type: 'webhook' } }
  }
} as const;
