// Debug Global Function - Simple business rule function that calls sophisticated backend helpers
// Business Rule: debug("message") -> Python: helper.debug("message")

import type { UnifiedSchema } from '../types'

export const DEBUG_FUNCTION_SCHEMA: UnifiedSchema = {
  id: 'global-debug-function',
  name: 'debug',
  type: 'method',
  category: 'global-function',
  returnType: 'void',
  description: 'Debug output with optional logging and email alerts',
  docstring: `Simple debug function that calls sophisticated backend helpers.

**Usage:**
\`\`\`
debug("Processing customer")                                    // Screen only
debug("Payment failed", log=true)                              // Screen + logging  
debug("Critical error", log=true, email="admin@company.com")   // Screen + logging + email
\`\`\`

**Backend Helper:** Calls sophisticated \`helper.debug()\` function in Python that handles:
- Tenant-specific logging configuration
- SMTP settings per tenant  
- Screen output formatting
- Log level management`,
  
  examples: [
    'debug("Customer processing started")',
    'debug("Payment completed successfully", log=true)',
    'debug("Critical system error", log=true, email="admin@company.com", subject="Production Alert")'
  ],
  
  parameters: [
    { name: 'message', type: 'string', required: true, description: 'Debug message text' },
    { name: 'log', type: 'boolean', required: false, description: 'Write to logging system' },
    { name: 'email', type: 'string', required: false, description: 'Email address for alerts' },
    { name: 'subject', type: 'string', required: false, description: 'Email subject line' }
  ],
  
  snippetTemplate: 'debug("${1:message}")',
  
  // 🎯 CLEAN TRANSLATION: Just call backend helper function
  pythonGenerator: (variable: string, resultVar: string = '', params: any) => {
    const message = params?.message || params?.arg1 || '"Debug message"'
    const log = params?.log
    const email = params?.email  
    const subject = params?.subject
    
    // Build clean function call to sophisticated backend helper
    let args = [message]
    
    if (log !== undefined) {
      args.push(`log=${log}`)
    }
    
    if (email) {
      args.push(`email=${email}`)
    }
    
    if (subject) {
      args.push(`subject=${subject}`)
    }
    
    // Clean 1-2 line translation - backend does the heavy lifting
    return `# Call sophisticated backend debug helper
helper.debug(${args.join(', ')})`
  },
  
  pythonImports: [] // No imports needed - backend helper handles everything
} 