// 🎯 Regex Helper Functions - Interface-first approach for perfect IntelliSense
// Cross-tenant regular expression utilities with clean type definitions

import type { UnifiedSchema } from '../../types'

// 🎯 INTERFACE-FIRST: Regex operation result interfaces
export interface RegexMatchResult {
  matched: boolean
  text: string
  pattern: string
  match?: string
  start?: number
  end?: number
}

export interface RegexCaptureGroupsResult {
  groups: Record<string, string>
  text: string
  pattern: string
  matched: boolean
  groupCount: number
}

export interface RegexFindAllResult extends Array<string> {
  text: string
  pattern: string
  count: number
}

export interface RegexReplaceResult {
  result: string
  original: string
  pattern: string
  replacement: string
  replacements: number
}

export interface RegexSplitResult extends Array<string> {
  original: string
  pattern: string
  parts: number
}

export interface RegexValidateResult {
  valid: boolean
  text: string
  pattern: string
  error?: string
}

export const REGEX_HELPER_SCHEMAS: UnifiedSchema[] = [
  // === PATTERN MATCHING ===
  {
    id: 'helper-regex-match',
    module: 'helper',
    name: 'regex.match',
    type: 'method',
    category: 'regex',
    description: 'Test if string matches a regex pattern (returns boolean match result)',
    examples: [
      'helper.regex.match(email, "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$")',
      'helper.regex.match(phone, "\\d{3}-\\d{3}-\\d{4}")',
      'helper.regex.match(zipCode, "^\\d{5}(-\\d{4})?$")'
    ],
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'Text to search in' },
      { name: 'pattern', type: 'string', required: true, description: 'Regex pattern' }
    ],
    snippetTemplate: 'regex.match("${1:text}", "${2:pattern}")',
    pythonGenerator: (variable: string, resultVar: string = 'match_result', params: any) => {
      const text = params?.text || params?.arg1 || 'text'
      const pattern = params?.pattern || params?.arg2 || '"pattern"'
      
      return `# Regex pattern matching
import re
${resultVar} = bool(re.search(${pattern}, ${text}))`
    },
    pythonImports: ['re']
  },

  // === CAPTURE GROUPS (Your Example!) ===
  {
    id: 'helper-regex-capture-groups',
    module: 'helper',
    name: 'regex.captureGroups',
    type: 'method',
    category: 'regex',
    returnInterface: 'RegexCaptureGroupsResult', // 🎯 Interface reference for perfect IntelliSense
    description: 'Extract named capture groups from regex pattern into structured result object',
    docstring: `Extract named capture groups from text using regex patterns.

**Your Example:**
\`\`\`
captureGroups = helper.regex.captureGroups(string, "(?P<pat1>\\d+).+?(?P<pat2>\\w+)")
\`\`\`

**Returns:** Dictionary with named groups as keys
- \`captureGroups.pat1\` - First captured group  
- \`captureGroups.pat2\` - Second captured group

**Use Cases:**
- Parse structured text (log files, data formats)
- Extract IDs, codes, or identifiers
- Parse complex strings into components`,
    examples: [
      'helper.regex.captureGroups(logLine, "(?P<timestamp>\\d{4}-\\d{2}-\\d{2}) (?P<level>\\w+): (?P<message>.*)")',
      'helper.regex.captureGroups(productCode, "(?P<category>\\w{2})(?P<id>\\d+)(?P<variant>[A-Z]+)")',
      'helper.regex.captureGroups(phoneNumber, "(?P<area>\\d{3})-(?P<exchange>\\d{3})-(?P<number>\\d{4})")'
    ],
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'Text to parse' },
      { name: 'pattern', type: 'string', required: true, description: 'Regex pattern with named groups (?P<name>...)' }
    ],
    snippetTemplate: 'regex.captureGroups("${1:text}", "(?P<${2:group1}>\\\\${3:pattern})")',
    pythonGenerator: (variable: string, resultVar: string = 'captured_groups', params: any) => {
      const text = params?.text || params?.arg1 || 'text'
      const pattern = params?.pattern || params?.arg2 || '"(?P<group1>\\\\w+)"'
      
      return `# Extract named capture groups from regex
import re

# Match pattern and extract named groups
match = re.search(${pattern}, ${text})
if match:
    ${resultVar} = match.groupdict()
    # Access groups: ${resultVar}['group_name'] or ${resultVar}.get('group_name', '')
else:
    ${resultVar} = {}  # No matches found

# Example access: captured_value = ${resultVar}.get('pat1', '')`
    },
    pythonImports: ['re']
  },

  // === FIND ALL MATCHES ===
  {
    id: 'helper-regex-find-all',
    module: 'helper',
    name: 'regex.findAll',
    type: 'method',
    category: 'regex',
    description: 'Find all matches of a pattern in text (returns array of matches)',
    examples: [
      'helper.regex.findAll(text, "\\b\\w+@\\w+\\.\\w+\\b")',  // Find all emails
      'helper.regex.findAll(content, "\\$\\d+\\.\\d{2}")',     // Find all prices
      'helper.regex.findAll(document, "#\\w+")'               // Find all hashtags
    ],
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'Text to search in' },
      { name: 'pattern', type: 'string', required: true, description: 'Regex pattern' }
    ],
    snippetTemplate: 'regex.findAll("${1:text}", "${2:pattern}")',
    pythonGenerator: (variable: string, resultVar: string = 'all_matches', params: any) => {
      const text = params?.text || params?.arg1 || 'text'
      const pattern = params?.pattern || params?.arg2 || '"pattern"'
      
      return `# Find all regex matches
import re
${resultVar} = re.findall(${pattern}, ${text})`
    },
    pythonImports: ['re']
  },

  // === REPLACE WITH REGEX ===
  {
    id: 'helper-regex-replace',
    module: 'helper',
    name: 'regex.replace',
    type: 'method',
    category: 'regex',
    description: 'Replace all matches of pattern with replacement text (returns modified string)',
    examples: [
      'helper.regex.replace(text, "\\d{3}-\\d{3}-\\d{4}", "XXX-XXX-XXXX")',  // Mask phone numbers
      'helper.regex.replace(content, "<[^>]+>", "")',                         // Strip HTML tags
      'helper.regex.replace(data, "\\s+", " ")'                               // Normalize whitespace
    ],
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'Text to process' },
      { name: 'pattern', type: 'string', required: true, description: 'Regex pattern to find' },
      { name: 'replacement', type: 'string', required: true, description: 'Replacement text' }
    ],
    snippetTemplate: 'regex.replace("${1:text}", "${2:pattern}", "${3:replacement}")',
    pythonGenerator: (variable: string, resultVar: string = 'replaced_text', params: any) => {
      const text = params?.text || params?.arg1 || 'text'
      const pattern = params?.pattern || params?.arg2 || '"pattern"'
      const replacement = params?.replacement || params?.arg3 || '"replacement"'
      
      return `# Regex find and replace
import re
${resultVar} = re.sub(${pattern}, ${replacement}, ${text})`
    },
    pythonImports: ['re']
  },

  // === SPLIT BY REGEX ===
  {
    id: 'helper-regex-split',
    module: 'helper',
    name: 'regex.split',
    type: 'method',
    category: 'regex',
    description: 'Split string using regex pattern as delimiter (returns array of parts)',
    examples: [
      'helper.regex.split(data, "[,;|]")',          // Split by comma, semicolon, or pipe
      'helper.regex.split(text, "\\s+")',           // Split by any whitespace
      'helper.regex.split(content, "\\n\\s*\\n")'   // Split by blank lines
    ],
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'Text to split' },
      { name: 'pattern', type: 'string', required: true, description: 'Regex pattern for splitting' }
    ],
    snippetTemplate: 'regex.split("${1:text}", "${2:pattern}")',
    pythonGenerator: (variable: string, resultVar: string = 'split_parts', params: any) => {
      const text = params?.text || params?.arg1 || 'text'
      const pattern = params?.pattern || params?.arg2 || '"\\\\s+"'
      
      return `# Split text using regex pattern
import re
${resultVar} = re.split(${pattern}, ${text})`
    },
    pythonImports: ['re']
  },

  // === VALIDATE FORMAT ===
  {
    id: 'helper-regex-validate',
    module: 'helper',
    name: 'regex.validate',
    type: 'method',
    category: 'regex',
    description: 'Validate that entire string matches pattern (returns boolean validation result)',
    examples: [
      'helper.regex.validate(email, "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$")',
      'helper.regex.validate(ssn, "^\\d{3}-\\d{2}-\\d{4}$")',
      'helper.regex.validate(uuid, "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")'
    ],
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'Text to validate' },
      { name: 'pattern', type: 'string', required: true, description: 'Full validation pattern (use ^ and $ anchors)' }
    ],
    snippetTemplate: 'regex.validate("${1:text}", "^${2:pattern}$")',
    pythonGenerator: (variable: string, resultVar: string = 'is_valid', params: any) => {
      const text = params?.text || params?.arg1 || 'text'
      const pattern = params?.pattern || params?.arg2 || '"^pattern$"'
      
      return `# Full string validation with regex
import re
${resultVar} = bool(re.fullmatch(${pattern}, ${text}))`
    },
    pythonImports: ['re']
  }
] 