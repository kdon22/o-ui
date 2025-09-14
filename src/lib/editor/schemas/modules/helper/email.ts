// 🎯 Email Helper Functions - Interface-first approach for perfect IntelliSense
// Cross-tenant email utilities with clean type definitions

import type { UnifiedSchema } from '../../types'

// 🎯 INTERFACE-FIRST: Email operation result interfaces
export interface EmailSendResult {
  success: boolean
  messageId?: string
  recipients: string[]
  error?: string
  sentAt: string
  deliveryStatus: 'sent' | 'failed' | 'pending'
}

export interface EmailTemplateResult {
  renderedSubject: string
  renderedBody: string
  templateId: string
  variables: Record<string, any>
  renderedAt: string
}

export interface EmailValidateResult {
  isValid: boolean
  email: string
  errors: string[]
  warnings: string[]
  suggestions?: string[]
}

export interface EmailParseResult {
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: {
    text?: string
    html?: string
  }
  attachments: Array<{
    filename: string
    contentType: string
    size: number
  }>
  headers: Record<string, string>
}

// 🎯 EMAIL HELPER SCHEMAS - Interface-first for perfect IntelliSense
export const EMAIL_HELPER_SCHEMAS: UnifiedSchema[] = [
  // Future email helper functions will be added here
  // Examples: send, template, validate, parse, etc.
] 