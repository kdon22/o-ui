// Lightweight method invocation translator
// Converts simple member calls like "var.toBase64" into Python using method schemas

import { ALL_METHOD_SCHEMAS } from '@/lib/editor/schemas/methods'

type MethodSchema = {
  name: string
  category?: string
  noParensAllowed?: boolean
  parameters?: Array<{ name: string; type?: string; required?: boolean }>
  pythonGenerator?: (variable: string, resultVar?: string, params?: any, debugContext?: any) => string
  pythonImports?: string[]
  debugInfo?: { helperFunction?: string; complexity?: string }
}

export interface InvocationTranslateResult {
  code: string | null
  imports: Set<string>
  helperModules: Set<string>
}

export interface InvocationTranslateOptions {
  useHelpers: boolean
}

// Parse a very simple method call pattern: owner.method(...) or owner.method
// Returns null if not a simple method call we support
function parseSimpleMethodCall(expr: string): { owner: string; method: string; args: string | null } | null {
  const trimmed = expr.trim()

  // owner.method(args?)
  const callMatch = trimmed.match(/^([A-Za-z_][\w\.]*?)\.(\w+)\s*\((.*)\)\s*$/)
  if (callMatch) {
    return { owner: callMatch[1], method: callMatch[2], args: callMatch[3]?.trim() ?? '' }
  }

  // owner.method  (no parens)
  const propMatch = trimmed.match(/^([A-Za-z_][\w\.]*?)\.(\w+)\s*$/)
  if (propMatch) {
    return { owner: propMatch[1], method: propMatch[2], args: null }
  }

  return null
}

function getSchemaForMethod(method: string): MethodSchema | undefined {
  return (ALL_METHOD_SCHEMAS as unknown as MethodSchema[]).find(s => s.name === method)
}

// Naive argument parser: splits by commas while respecting simple quotes and parentheses
function parseArgsList(argList: string): string[] {
  const args: string[] = []
  if (!argList) return args
  let current = ''
  let depth = 0
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < argList.length; i++) {
    const ch = argList[i]
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
      current += ch
      continue
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble
      current += ch
      continue
    }
    if (!inSingle && !inDouble) {
      if (ch === '(') depth++
      if (ch === ')') depth = Math.max(0, depth - 1)
      if (ch === ',' && depth === 0) {
        args.push(current.trim())
        current = ''
        continue
      }
    }
    current += ch
  }
  if (current.trim()) args.push(current.trim())
  return args
}

function buildParamsObject(schema: MethodSchema | undefined, rawArgs: string | null): Record<string, string> {
  const params: Record<string, string> = {}
  if (!rawArgs || rawArgs.trim() === '') return params
  const parts = parseArgsList(rawArgs)
  if (!schema || !Array.isArray(schema.parameters) || schema.parameters.length === 0) {
    // Fallback to arg1/arg2 naming
    parts.forEach((val, idx) => { params[`arg${idx + 1}`] = val })
    return params
  }
  // Map positionally to declared parameter names
  schema.parameters.forEach((p, idx) => {
    if (idx < parts.length) params[p.name] = parts[idx]
  })
  return params
}

// Translate RHS expression of an assignment if it is a simple method invocation
export function translateAssignmentInvocation(
  lhs: string,
  rhs: string,
  options: InvocationTranslateOptions
): InvocationTranslateResult {
  const result: InvocationTranslateResult = {
    code: null,
    imports: new Set<string>(),
    helperModules: new Set<string>()
  }

  const parsed = parseSimpleMethodCall(rhs)
  if (!parsed) return result

  const schema = getSchemaForMethod(parsed.method)
  if (!schema || !schema.pythonGenerator) return result

  // If helpers preferred and helperFunction is available, ensure helper module import
  const debugContext = options.useHelpers ? { useHelpers: true } : undefined
  const params = buildParamsObject(schema, parsed.args)

  // Generate assignment code using schema’s generator
  try {
    const code = schema.pythonGenerator(parsed.owner, lhs, params, debugContext)
    if (code) {
      result.code = code
    }
  } catch {
    // Fall through – keep result.code as null
  }

  // Aggregate python imports (e.g., base64)
  if (Array.isArray(schema.pythonImports)) {
    for (const imp of schema.pythonImports) {
      result.imports.add(imp)
    }
  }

  // Aggregate helper module import if helperFunction provided and helpers are in use
  if (options.useHelpers && schema.debugInfo?.helperFunction) {
    // helperFunction format: "string_helpers.encode_base64" → import module name
    const parts = schema.debugInfo.helperFunction.split('.')
    if (parts.length >= 2) {
      const moduleName = parts[0] // e.g., string_helpers
      result.helperModules.add(moduleName)
    }
  }

  return result
}


