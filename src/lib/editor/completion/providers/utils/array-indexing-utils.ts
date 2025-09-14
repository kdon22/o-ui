// =============================================================================
// ARRAY INDEXING SUPPORT
// =============================================================================

export interface ArrayIndexingResult {
  path: string
  isArrayAccess: boolean
}

/**
 * Handle array indexing syntax like "utr.accountingData[0]"
 * Converts to "utr.accountingData" and marks as array access
 */
export function handleArrayIndexing(expression: string): ArrayIndexingResult {
  console.log(`[ArrayIndexing] Processing expression: "${expression}"`)

  // Check if expression contains array indexing - support multiple levels like [0][1] or [0].prop[1]
  const arrayIndexMatch = expression.match(/^(.+)\[\d+\]$/)

  if (arrayIndexMatch) {
    const basePath = arrayIndexMatch[1]
    console.log(`[ArrayIndexing] Detected array access: "${expression}" -> base: "${basePath}"`)

    return {
      path: basePath,
      isArrayAccess: true
    }
  }

  console.log(`[ArrayIndexing] No array access detected in: "${expression}"`)
  return {
    path: expression,
    isArrayAccess: false
  }
}
