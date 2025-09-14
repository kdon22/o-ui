// Log Global Function - Simple logging for business rules
// Business Rule: log("message") -> Python: print("message")

import type { UnifiedSchema } from '../types'

export const LOG_FUNCTION_SCHEMA: UnifiedSchema = {
  id: 'global-log-function',
  name: 'log',
  type: 'method',
  category: 'global-function',
  returnType: 'void',
  description: 'Simple logging with optional email alerts and system logging',
  docstring: `Simple log function for business rules with optional advanced features.

**Usage:**
\`\`\`
log("Processing customer")                                    // Screen only
log("Error occurred", email="admin@company.com", log=true)   // Screen + email + logging
\`\`\`

**Parameters:**
- **message**: Log message text (required)
- **email**: Email address for alerts (optional)
- **log**: Write to system logging (optional, default: false)`,
  
  examples: [
    'log("Customer processing started")',
    'log("Payment completed successfully")',
    'log("Error occurred", email="admin@company.com", log=true)',
    'log("Critical system error", email="alerts@company.com", log=true)'
  ],
  
  parameters: [
    { name: 'message', type: 'string', required: true, description: 'Log message text' },
    { name: 'email', type: 'string', required: false, description: 'Email address for alerts' },
    { name: 'log', type: 'boolean', required: false, description: 'Write to system logging' }
  ],
  
  snippetTemplate: 'log("${1:message}")',
  
  pythonGenerator: (variable: string, resultVar: string = '', params: any) => {
    const message = params?.message || params?.arg1 || '"Log message"'
    const email = params?.email
    const logEnabled = params?.log === 'true' || params?.log === true
    
    // Build clean one-line function call
    let args = [message]
    
    if (email) {
      // Ensure email is properly quoted for Python
      const quotedEmail = email.startsWith('"') || email.startsWith("'") ? email : `"${email}"`
      args.push(`email=${quotedEmail}`)
    }
    
    if (logEnabled) {
      // Convert JavaScript boolean to Python boolean
      args.push(`log=True`)
    }
    
    // Clean one-line call to helper function
    return `log_message(${args.join(', ')})`
  },
  
  pythonImports: ['from helper_functions.log_helpers import log_message']
}
