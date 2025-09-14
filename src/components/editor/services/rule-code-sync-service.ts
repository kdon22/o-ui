import { ActionClient } from '@/lib/action-client'
import type { ActionRequest } from '@/lib/resource-system/schemas'
import { convertToPythonName } from '../utils/python-name-converter'
import { translateBusinessRulesToPython } from '@/lib/editor/python-generation'
import type { BusinessBlockMap, BlockInfo } from '@/lib/editor/execution-mapping/types'

export interface RuleData {
  id: string
  name: string
  pythonName?: string
  sourceCode?: string
  pythonCode?: string
  branchId: string
  tenantId: string
  sourceMap?: BusinessBlockMap  // Clean BusinessBlockMap for smart stepping
  pythonCodeHash?: string
}

/**
 * 🚀 **RULE CODE SYNC SERVICE** - Clean source map generation for smart stepping
 * 
 * Generates BusinessBlockMap for smart stepping debugging.
 * No legacy code, focused on business logic blocks.
 */
export class RuleCodeSyncService {
  constructor(private actionClient: ActionClient) {}

  /**
   * 🗺️ **GENERATE BUSINESS BLOCK MAP** - For smart stepping
   * 
   * DEPRECATED: Block map generation removed. Will be replaced with runtime AST parsing.
   */
  private generateBusinessBlockMap(
    businessRulesCode: string,
    pythonCode: string
  ): BusinessBlockMap | null {
    console.log('⚠️ [RuleCodeSyncService] Block map generation deprecated - returning null')
    return null
  }

  /**
   * 💾 **SAVE RULE** - Save rule with business block map
   */
  async saveRule(ruleData: Partial<RuleData>): Promise<boolean> {
    try {
      // Auto-generate pythonName from rule name
      if (ruleData.name) {
        ruleData.pythonName = convertToPythonName(ruleData.name)
      }

      // Generate Python code and business block map
      if (ruleData.sourceCode) {
        // Generate Python code
        ruleData.pythonCode = await this.generatePython(ruleData.sourceCode, ruleData.name || 'rule')

        // Block map generation deprecated - will be replaced with runtime AST parsing
        console.log('⚠️ [RuleCodeSyncService] Skipping deprecated block map generation')
      }

      const request: ActionRequest = {
        action: 'rule.update',
        data: this.buildSafeUpdate(ruleData)
      }

      await this.actionClient.executeAction(request)
      return true
    } catch (error) {
      console.error('❌ [RuleCodeSyncService] Save rule failed:', error)
      return false
    }
  }

  /**
   * 🔄 **AUTO-SAVE** - Optimized auto-save with block map
   */
  async autoSaveSourceCode(ruleId: string, sourceCode: string, ruleName?: string): Promise<void> {
    try {
      // Check if sourceCode actually changed
      const existingRule = await this.loadRule(ruleId)
      const sourceChanged = !existingRule || existingRule.sourceCode !== sourceCode

      const updateData: any = {
        id: ruleId,
        sourceCode,
        __checkpoint: true // Server optimization flag
      }

      if (ruleName) {
        updateData.pythonName = convertToPythonName(ruleName)
      }

      if (sourceChanged) {
        // Generate Python and business block map
        updateData.pythonCode = await this.generatePython(sourceCode, ruleName || 'rule')

        // Block map generation deprecated - will be replaced with runtime AST parsing
        console.log('⚠️ [RuleCodeSyncService] Skipping deprecated auto-save block map generation')
      }

      const request: ActionRequest = {
        action: 'rule.update',
        data: updateData
      }

      await this.actionClient.executeAction(request)

    } catch (error) {
      console.error('❌ [RuleCodeSyncService] Auto-save failed:', error)
      throw error
    }
  }

  /**
   * 📥 **LOAD RULE** - Load rule with business block map
   */
  async loadRule(ruleId: string): Promise<RuleData | null> {
    console.log('🔍 [RuleCodeSyncService] loadRule called:', { ruleId })
    try {
      const request: ActionRequest = {
        action: 'rule.read',
        data: { id: ruleId }
      }
      
      console.log('🔍 [RuleCodeSyncService] Executing action:', request)
      const result = await this.actionClient.executeAction(request)
      console.log('🔍 [RuleCodeSyncService] Action result:', {
        success: result.success,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        sourceCode: result.data?.sourceCode,
        sourceCodeLength: result.data?.sourceCode?.length || 0,
        sourceCodePreview: result.data?.sourceCode?.substring(0, 100) || 'EMPTY'
      })
      return result.data
    } catch (error) {
      console.error('❌ [RuleCodeSyncService] Load rule failed:', error)
      return null
    }
  }

  /**
   * 📋 **LIST RULES** - List rules with block map metadata
   */
  async listRules(nodeId?: string) {
    const filters = nodeId ? { nodeId } : {}
    
    const request: ActionRequest = {
      action: 'rule.list',
      options: { 
        limit: 200, 
        filters,
        include: ['junctions', 'sourceMap']
      }
    }

    return await this.actionClient.executeAction(request)
  }

  /**
   * 🔄 **SYNC FROM PYTHON** - Update rule from Python code changes
   */
  async syncFromPython(ruleId: string, pythonCode: string): Promise<void> {
    try {
      console.log('🔄 [RuleCodeSyncService] Syncing from Python code changes')
      
      // For now, just update the Python code
      // TODO: Implement reverse translation from Python to business rules if needed
      const updateData = {
        id: ruleId,
        pythonCode,
        pythonCodeHash: this.fastHash(pythonCode)
      }

      const request: ActionRequest = {
        action: 'rule.update',
        data: updateData
      }

      await this.actionClient.executeAction(request)
      console.log('✅ [RuleCodeSyncService] Python code synced successfully')
    } catch (error) {
      console.error('❌ [RuleCodeSyncService] Sync from Python failed:', error)
      throw error
    }
  }

  // 🔧 **PRIVATE HELPER METHODS**

  private async generatePython(sourceCode: string, ruleName: string): Promise<string> {
    try {
      const result = translateBusinessRulesToPython(sourceCode, { 
        generateComments: true, 
        strictMode: false 
      })
      
      if (result.success) {
        return result.pythonCode
      } else {
        // Show actual errors instead of generic message
        console.error('❌ [RuleCodeSyncService] Python generation failed:', {
          errors: result.errors,
          warnings: result.warnings,
          sourceCode: sourceCode.substring(0, 200)
        })
        
        const errorDetails = result.errors.length > 0 
          ? `\n# Errors: ${result.errors.join(', ')}`
          : ''
        const warningDetails = result.warnings.length > 0 
          ? `\n# Warnings: ${result.warnings.join(', ')}`
          : ''
          
        return `# Translation failed for rule: ${ruleName}${errorDetails}${warningDetails}\n# Original source: ${sourceCode.slice(0, 100)}${sourceCode.length > 100 ? '...' : ''}\npass`
      }
    } catch (error) {
      // Catch and expose the actual error (like IndentationFactory not defined)
      console.error('❌ [RuleCodeSyncService] Critical error during Python generation:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      return `# CRITICAL ERROR during translation: ${errorMessage}\n# Rule: ${ruleName}\n# Original source: ${sourceCode.slice(0, 100)}${sourceCode.length > 100 ? '...' : ''}\npass`
    }
  }

  private buildSafeUpdate(ruleData: Partial<RuleData>): any {
    const safe: any = {}
    if (ruleData.id) safe.id = ruleData.id
    if (ruleData.name !== undefined) safe.name = ruleData.name
    if (ruleData.sourceCode !== undefined) safe.sourceCode = ruleData.sourceCode
    if (ruleData.pythonCode !== undefined) safe.pythonCode = ruleData.pythonCode
    if (ruleData.pythonName !== undefined) safe.pythonName = ruleData.pythonName
    if (ruleData.sourceMap !== undefined) safe.sourceMap = ruleData.sourceMap
    if (ruleData.pythonCodeHash !== undefined) safe.pythonCodeHash = ruleData.pythonCodeHash
    return safe
  }

  private getBlockType(line: string): 'condition' | 'action' | 'loop_start' | 'loop_end' | 'assignment' | 'function_call' {
    if (line.startsWith('if ') || line.startsWith('elseif ') || line.startsWith('else')) return 'condition'
    if (line.startsWith('for ') || line.startsWith('while ')) return 'loop_start'
    if (line.includes('=') && !line.includes('==') && !line.includes('!=')) return 'assignment'
    if (line.includes('(') && line.includes(')')) return 'function_call'
    return 'action'
  }

  private getBlockDescription(line: string, blockType: string): string {
    switch (blockType) {
      case 'condition':
        if (line.startsWith('if ')) return `Check condition: ${line.substring(3)}`
        if (line.startsWith('elseif ')) return `Check alternative: ${line.substring(7)}`
        if (line.startsWith('else')) return 'Execute else branch'
        return `Condition: ${line}`
      case 'assignment':
        return `Assign variable: ${line}`
      case 'function_call':
        return `Execute: ${line}`
      case 'loop_start':
        return `Start loop: ${line}`
      default:
        return `Execute: ${line}`
    }
  }

  private extractVariablesFromLine(line: string): string[] {
    const variables: string[] = []
    
    // Extract assignment variables (left side of =)
    const assignmentMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=/)
    if (assignmentMatch) {
      variables.push(assignmentMatch[1])
    }
    
    // Extract referenced variables (simple pattern)
    const referencedVars = line.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g)
    if (referencedVars) {
      variables.push(...referencedVars.filter(v => 
        !['if', 'else', 'elseif', 'for', 'while', 'print', 'and', 'or', 'not'].includes(v)
      ))
    }
    
    return [...new Set(variables)]
  }

  private estimatePythonLine(businessLine: number, businessTotal: number, pythonTotal: number): number {
    // Simple estimation - can be improved with actual mapping
    return Math.round((businessLine / businessTotal) * pythonTotal)
  }

  private fastHash(input: string): string {
    let h = 0x811c9dc5
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i)
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
    }
    return ('0000000' + (h >>> 0).toString(16)).slice(-8)
  }
}
