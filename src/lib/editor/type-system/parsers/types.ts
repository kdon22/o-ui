// Shared types for parsers
export type VarType = string

export interface SymbolEntry {
  name: string
  type: VarType
  line: number
  source: 'literal' | 'assignment' | 'method' | 'module' | 'loop'
}
