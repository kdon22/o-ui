// Parsers index - LEGACY PARSERS DELETED, USING MASTER TYPE DETECTION SYSTEM
// Only keeping types and remaining parsers that aren't replaced yet

export { PropertyAccessParser } from './property-access-parser'
export { ConditionalParser } from './conditional-parser'
export type { SymbolEntry, VarType } from './types'

// ❌ DELETED - Replaced by master-type-detector.ts:
// - LoopParser
// - LiteralParser  
// - VariableParser
// - MethodCallParser
