// Regex Global Function - Simple business rule function that calls sophisticated backend helpers
// Business Rule: captureGroups = regex(text, pattern) -> Python: captureGroups = helper.regex(text, pattern)

import type { UnifiedSchema } from '../types'

// 🎯 INTERFACE-FIRST: Regex operation result interfaces for perfect IntelliSense
export interface RegexMatchResult {
  // Regex match result with capture groups and metadata
  success: boolean
  match?: string
  groups?: Record<string, string>
  captures?: string[]
  start?: number
  end?: number
}

export const REGEX_FUNCTION_SCHEMA: UnifiedSchema = {
  id: 'global-regex-function',
  name: 'regex',
  type: 'method',
  category: 'global-function',
  returnInterface: 'RegexMatchResult', // 🎯 Interface reference for perfect IntelliSense
  description: 'Extract regex patterns and capture groups using sophisticated backend processing',
  docstring: `Simple regex function that calls sophisticated backend helpers.

**Your Example:**
\`\`\`
captureGroups = regex(string, "(?P<pat1>\\\\d+).+?(?P<pat2>\\\\w+)")
\`\`\`

**Backend Helper:** Calls sophisticated \`helper.regex()\` function in Python that handles:
- Complex regex parsing and validation
- Named capture group extraction  
- Error handling for invalid patterns
- Performance optimization for large texts`,
  
  examples: [
    'groups = regex(logLine, "(?P<timestamp>\\\\d{4}-\\\\d{2}-\\\\d{2}) (?P<level>\\\\w+)")',
    'matches = regex(text, "\\\\b\\\\w+@\\\\w+\\\\.\\\\w+\\\\b")',
    'parts = regex(phoneNumber, "(?P<area>\\\\d{3})-(?P<exchange>\\\\d{3})-(?P<number>\\\\d{4})")'
  ],
  
  parameters: [
    { name: 'text', type: 'string', required: true, description: 'Text to process with regex' },
    { name: 'pattern', type: 'string', required: true, description: 'Regex pattern (supports named groups)' },
    { name: 'operation', type: 'string', required: false, description: 'Operation: "match", "findall", "groups" (default: "groups")' }
  ],
  
  snippetTemplate: 'regex("${1:text}", "${2:pattern}")',
  
  // 🎯 CLEAN TRANSLATION: Just call backend helper function
  pythonGenerator: (variable: string, resultVar: string = 'regex_result', params: any) => {
    const text = params?.text || params?.arg1 || 'text'
    const pattern = params?.pattern || params?.arg2 || '"pattern"'
    const operation = params?.operation || params?.arg3
    
    // Build clean function call to sophisticated backend helper
    let args = [text, pattern]
    
    if (operation) {
      args.push(`operation="${operation}"`)
    }
    
    // Clean 1-2 line translation - backend does the heavy lifting
    return `# Call sophisticated backend regex helper
${resultVar} = helper.regex(${args.join(', ')})`
  },
  
  pythonImports: [] // No imports needed - backend helper handles everything
} 