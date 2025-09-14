// 🎯 Vendor Module - Interface-first approach for perfect IntelliSense
// GDS operations with clean type definitions for maximum completion accuracy

import type { UnifiedSchema } from '../types'

// 🎯 INTERFACE-FIRST: Vendor operation result interfaces for perfect IntelliSense
export interface VendorUtrResult {
  success: boolean
  data: Record<string, any> | null
  error: string | null
  sourcesQueried: string[]
  processingTime: number
  recordLocator: string
}

export interface VendorRedisplayResult {
  success: boolean
  updatedData: Record<string, any> | null
  error: string | null
  changesDetected: boolean
  processingTime: number
}

export interface VendorCancelResult {
  success: boolean
  cancelledSegments: number[]
  error: string | null
  confirmationCode: string | null
  processingTime: number
}

export interface VendorEmailResult extends Boolean {} // Boolean result for email send

// 🎯 VENDOR MODULE SCHEMAS - Interface-first for perfect IntelliSense
export const VENDOR_MODULE_SCHEMAS: UnifiedSchema[] = [
  {
    id: 'vendor-utr-get',
    module: 'vendor',
    name: 'utrGet',
    type: 'method',
    category: 'gds',
    returnInterface: 'VendorUtrResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Retrieve Universal Travel Record from GDS systems with success status, data, error info, sources queried, and processing time',
    examples: [
      'vendor.utrGet("ABC123")',
      'vendor.utrGet("ABC123", ["amadeus", "sabre"])',
      'vendor.utrGet("ABC123", [], { "includeHistory": true })'
    ],
    snippetTemplate: 'utrGet(${1:recordLocator}${2:, sources}${3:, options})',
    debugInfo: {
      helperFunction: 'vendor_utr_get',
      complexity: 'multi-line',
      variableMapping: {
        input: 'variable',
        output: 'resultVar',
        params: ['recordLocator', 'sources', 'options']
      }
    },
    parameters: [
      {
        name: 'recordLocator',
        type: 'string',
        required: true,
        description: 'PNR record locator to retrieve'
      },
      {
        name: 'sources',
        type: 'array',
        required: false,
        description: 'GDS sources to query (defaults to all available)'
      },
      {
        name: 'options',
        type: 'object',
        required: false,
        description: 'Additional retrieval options'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'utr_data', params: any, debugContext?: any) => {
      const recordLocator = params?.recordLocator || params?.arg1 || '"ABC123"'
      const sources = params?.sources || params?.arg2 || '[]'
      const options = params?.options || params?.arg3 || '{}'

      if (debugContext?.useHelpers || debugContext?.mode === 'debug') {
        if (sources !== '[]' || options !== '{}') {
          return `${resultVar} = vendor_utr_get(${recordLocator}, sources=${sources}, options=${options})`
        } else {
          return `${resultVar} = vendor_utr_get(${recordLocator})`
        }
      }

      return `# Retrieve UTR from GDS systems
${resultVar} = vendor_client.get_utr(
    record_locator=${recordLocator},
    sources=${sources},
    options=${options}
)
# Normalize multi-source data to unified UTR format
utr = normalize_utr_data(${resultVar})`
    },
    pythonImports: ['from gds_client import vendor_client, normalize_utr_data']
  },

  {
    id: 'vendor-utr-redisplay',
    module: 'vendor',
    name: 'utrRedisplay',
    type: 'method',
    category: 'gds',
    returnInterface: 'VendorRedisplayResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Redisplay PNR with latest data from GDS, returning success status, updated data, error info, and change detection',
    examples: [
      'vendor.utrRedisplay("ABC123")',
      'vendor.utrRedisplay("ABC123", "amadeus")'
    ],
    parameters: [
      {
        name: 'recordLocator',
        type: 'string',
        required: true,
        description: 'PNR record locator to redisplay'
      },
      {
        name: 'preferredSource',
        type: 'string',
        required: false,
        description: 'Preferred GDS source for redisplay'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'redisplay_result', params: any) => {
      const recordLocator = params?.recordLocator || params?.arg1 || '"ABC123"'
      const preferredSource = params?.preferredSource || params?.arg2 || 'None'

      return `# Redisplay PNR with fresh data
${resultVar} = vendor_client.redisplay_pnr(
    record_locator=${recordLocator},
    preferred_source=${preferredSource}
)
updated_utr = normalize_utr_data(${resultVar})`
    },
    pythonImports: ['from gds_client import vendor_client, normalize_utr_data']
  },

  {
    id: 'vendor-segments-cancel',
    module: 'vendor',
    name: 'segmentsCancel',
    type: 'method',
    category: 'gds',
    returnInterface: 'VendorCancelResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Cancel specific segments in PNR, returning success status, cancelled segments, error info, and confirmation code',
    examples: [
      'vendor.segmentsCancel("ABC123", [1, 2])',
      'vendor.segmentsCancel("ABC123", [1, 2], "Cancelled by automation")'
    ],
    parameters: [
      {
        name: 'recordLocator',
        type: 'string',
        required: true,
        description: 'PNR record locator'
      },
      {
        name: 'segmentNumbers',
        type: 'array',
        required: true,
        description: 'Array of segment numbers to cancel'
      },
      {
        name: 'reason',
        type: 'string',
        required: false,
        description: 'Cancellation reason'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'cancel_result', params: any) => {
      const recordLocator = params?.recordLocator || params?.arg1 || '"ABC123"'
      const segmentNumbers = params?.segmentNumbers || params?.arg2 || '[1, 2]'
      const reason = params?.reason || params?.arg3 || '"Cancelled by automation"'

      return `# Cancel segments in PNR
${resultVar} = vendor_client.cancel_segments(
    record_locator=${recordLocator},
    segment_numbers=${segmentNumbers},
    reason=${reason}
)
# Log cancellation action
logger.info(f"Cancelled segments {${segmentNumbers}} in PNR ${recordLocator}")`
    },
    pythonImports: ['from gds_client import vendor_client', 'import logging as logger']
  },

  {
    id: 'vendor-email-send',
    module: 'vendor',
    name: 'emailSend',
    type: 'method',
    category: 'communication',
    description: 'Send email notifications via vendor systems (returns boolean success status)',
    examples: [
      'vendor.emailSend("user@company.com", "Booking Confirmed", emailBody)',
      'vendor.emailSend(["user@company.com", "manager@company.com"], "Alert", emailBody, { "priority": "high" })'
    ],
    parameters: [
      {
        name: 'recipients',
        type: 'string|array',
        required: true,
        description: 'Email recipient(s)'
      },
      {
        name: 'subject',
        type: 'string',
        required: true,
        description: 'Email subject line'
      },
      {
        name: 'body',
        type: 'string',
        required: true,
        description: 'Email body content'
      },
      {
        name: 'options',
        type: 'object',
        required: false,
        description: 'Email options (priority, attachments, etc.)'
      }
    ],
    pythonGenerator: (variable: string, resultVar: string = 'email_sent', params: any) => {
      const recipients = params?.recipients || params?.arg1 || '"user@company.com"'
      const subject = params?.subject || params?.arg2 || '"Notification"'
      const body = params?.body || params?.arg3 || '"Email content"'
      const options = params?.options || params?.arg4 || '{}'

      return `# Send email via vendor system
${resultVar} = vendor_client.send_email(
    recipients=${recipients},
    subject=${subject},
    body=${body},
    options=${options}
)
if ${resultVar}:
    logger.info(f"Email sent successfully to {${recipients}}")
else:
    logger.error(f"Failed to send email to {${recipients}}")`
    },
    pythonImports: ['from gds_client import vendor_client', 'import logging as logger']
  }
]