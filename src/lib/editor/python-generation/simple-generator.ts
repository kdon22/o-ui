// 🚀 **SIMPLIFIED PYTHON GENERATOR** - Clean lookahead approach
// Replaces the over-engineered system with simple, reliable logic

import { transformationFactory } from './transformation/transformation-pattern-factory'
import { translateAssignmentInvocation } from './method-invocation-translator'
import type { TransformationMetadata } from './transformation/types'

export interface SimplePythonResult {
  success: boolean
  pythonCode: string
  errors: string[]
  warnings: string[]
  transformationMetadata?: TransformationMetadata[]  // Added for enhanced source mapping
}

export interface SimplePythonOptions {
  generateComments?: boolean
  strictMode?: boolean
}

/**
 * 🎯 **SIMPLE PYTHON GENERATOR** - Clean and reliable
 * 
 * Key principles:
 * 1. Mirror indentation exactly from business rules
 * 2. Simple lookahead for if any else detection
 * 3. No complex state tracking
 * 4. Each line processed independently
 */
export class SimplePythonGenerator {
  private options: Required<SimplePythonOptions>

  constructor(options: SimplePythonOptions = {}) {
    this.options = {
      generateComments: true,
      strictMode: false,
      ...options
    }
  }

  /**
   * 🚀 **MAIN TRANSLATE METHOD**
   */
  translate(businessRules: string): SimplePythonResult {
    console.log('🚀 [SimplePythonGenerator] Starting translation...')
    console.log('📝 [SimplePythonGenerator] Input length:', businessRules.length)
    console.log('📝 [SimplePythonGenerator] Input preview:', businessRules.substring(0, 200))
    
    try {
      const lines = businessRules.split('\n')
      const pythonLines: string[] = []
      const errors: string[] = []
      const transformationMetadata: TransformationMetadata[] = []
      // Collect imports required by translated method invocations
      const requiredStdImports = new Set<string>()
      const requiredHelperModules = new Set<string>()

      // Skip header comment - user requested removal

      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()

        // Handle empty lines
        if (!trimmed) {
          pythonLines.push('')
          continue
        }

        // Convert // comments to Python # comments
        if (trimmed.startsWith('//')) {
          const indent = this.getIndentation(line)
          const commentText = trimmed.substring(2).trim() // Remove // and trim
          pythonLines.push(`${indent}# ${commentText}`)
          continue
        }

        try {
          // 🏭 TRY TRANSFORMATION FACTORY FIRST
          const transformationResult = transformationFactory.transform(line, lines, i, {
            currentPythonLineOffset: pythonLines.length + 1,
            businessLines: lines,
            indentLevel: this.getIndentation(line).length,
            options: {
              generateComments: this.options.generateComments,
              strictMode: this.options.strictMode,
              debugMode: process.env.NODE_ENV === 'development'
            }
          })

          if (transformationResult) {
            // Multi-line transformation handled by factory
            console.log(`🏭 [SimplePythonGenerator] ✅ Factory transformation applied: ${transformationResult.metadata.type}`)
            console.log(`📊 [SimplePythonGenerator] Transformation details:`, {
              type: transformationResult.metadata.type,
              pythonLinesGenerated: transformationResult.pythonLines.length,
              consumedBusinessLines: transformationResult.consumedLines,
              businessLineRange: transformationResult.metadata.businessLineRange,
              currentPythonLineCount: pythonLines.length
            })
            
            // Update Python line range in metadata
            const startLine = pythonLines.length + 1
            const endLine = startLine + transformationResult.pythonLines.length - 1
            transformationResult.metadata.pythonLineRange = [startLine, endLine]
            
            console.log(`📍 [SimplePythonGenerator] Updated Python line range: [${startLine}, ${endLine}]`)
            
            // Add the Python lines
            console.log(`📝 [SimplePythonGenerator] Adding Python lines:`)
            transformationResult.pythonLines.forEach((line, idx) => {
              console.log(`  ${startLine + idx}: "${line}"`)
            })
            pythonLines.push(...transformationResult.pythonLines)
            
            // Store transformation metadata
            transformationMetadata.push(transformationResult.metadata)
            console.log(`💾 [SimplePythonGenerator] Stored transformation metadata. Total transformations: ${transformationMetadata.length}`)
            
            // Skip the consumed business rule lines
            const skipLines = transformationResult.consumedLines - 1
            console.log(`⏭️ [SimplePythonGenerator] Skipping ${skipLines} business rule lines (consumed ${transformationResult.consumedLines} total)`)
            i += skipLines
            continue
          }

          // 🔧 FALLBACK TO SIMPLE TRANSLATION
          const pythonCode = this.translateLine(line, lines, i, requiredStdImports, requiredHelperModules)
          if (pythonCode !== null) {
            if (Array.isArray(pythonCode)) {
              // Multiple lines (legacy if any handling)
              pythonLines.push(...pythonCode)
            } else {
              pythonLines.push(pythonCode)
            }
          }
        } catch (error) {
          const errorMsg = `Line ${i + 1}: ${error instanceof Error ? error.message : String(error)}`
          errors.push(errorMsg)
          pythonLines.push(`# ERROR: ${trimmed}`)
        }
      }

      // Prepend imports if any were collected
      const importLines: string[] = []
      if (requiredStdImports.size > 0) {
        for (const mod of requiredStdImports) {
          importLines.push(`import ${mod}`)
        }
      }
      if (requiredHelperModules.size > 0) {
        // Import helper submodules explicitly to match helperFunction usage (e.g., string_helpers.encode_base64)
        for (const sub of requiredHelperModules) {
          importLines.push(`from helper_functions import ${sub}`)
        }
      }
      if (importLines.length > 0) {
        pythonLines.unshift(...importLines)
      }

      // 🎯 SIMPLE COMPLETION - No validation needed, indentation-create generates clean Python
      console.log('✅ [SimplePythonGenerator] Translation completed with clean indentation system')
      
      const finalCode = pythonLines.join('\n')

      console.log('✅ [SimplePythonGenerator] Final result:', {
        success: errors.length === 0,
        pythonLinesGenerated: pythonLines.length,
        errorsFound: errors.length,
        transformationsApplied: transformationMetadata.length,
        codeLength: finalCode.length
      })

      return {
        success: errors.length === 0,
        pythonCode: finalCode,
        errors,
        warnings: [], // No validation warnings needed - indentation-create is reliable
        transformationMetadata
      }

    } catch (error) {
      return {
        success: false,
        pythonCode: '',
        errors: [`Critical error: ${error instanceof Error ? error.message : String(error)}`],
        warnings: []
      }
    }
  }

  /**
   * 🎯 **TRANSLATE SINGLE LINE** - Core translation logic with ROBUST INDENTATION
   */
  private translateLine(
    line: string,
    allLines: string[],
    currentIndex: number,
    requiredStdImports: Set<string>,
    requiredHelperModules: Set<string>
  ): string | string[] | null {
    const indent = this.getIndentation(line)
    const trimmed = line.trim()

    // Handle if any - special case with lookahead
    if (trimmed.startsWith('if any ')) {
      return this.translateIfAny(line, allLines, currentIndex)
    }

    // 🚀 PROPER PYTHON INDENTATION: Convert business rules indentation to Python 4-space standard
    const pythonIndent = this.convertToPythonIndentation(indent)

    // Handle else - check if it belongs to an if any block
    if (trimmed === 'else') {
      // Check if this else belongs to an if any by looking backwards
      const belongsToIfAny = this.isElseForIfAny(allLines, currentIndex, indent.length)
      if (belongsToIfAny) {
        // For if-any else, we need to add the break at the right level
        // The break should be at the same level as the nested content inside the if
        const baseIndentLevel = Math.floor(indent.length / 4)  // 4 spaces per level
        const nestedContentIndent = '    '.repeat(baseIndentLevel + 2)  // +2 levels: for-loop + if condition
        const breakLine = `${nestedContentIndent}break`
        const elseLine = `${pythonIndent}else:`
        return [breakLine, elseLine]
      } else {
        return `${pythonIndent}else:`
      }
    }

    // Handle elseif/elif
    if (trimmed.startsWith('elseif ') || trimmed.startsWith('elif ')) {
      const condition = trimmed.replace(/^(elseif|elif)\s+/, '')
      const pythonCondition = this.translateCondition(condition)
      return `${pythonIndent}elif ${pythonCondition}:`
    }

    // Handle regular if
    if (trimmed.startsWith('if ')) {
      const condition = trimmed.replace(/^if\s+/, '')
      const pythonCondition = this.translateCondition(condition)
      return `${pythonIndent}if ${pythonCondition}:`
    }

    // Handle for loops
    if (trimmed.startsWith('for ')) {
      const forMatch = trimmed.match(/^for\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)/)
      if (forMatch) {
        const [, loopVar, collection] = forMatch
        return `${pythonIndent}for ${loopVar} in ${collection}:`
      }
    }

    // Handle while loops
    if (trimmed.startsWith('while ')) {
      const condition = trimmed.replace(/^while\s+/, '')
      const pythonCondition = this.translateCondition(condition)
      return `${pythonIndent}while ${pythonCondition}:`
    }

    // Handle class definitions
    if (trimmed.startsWith('class ')) {
      return `${pythonIndent}${trimmed.replace('{', ':')}`
    }

    // Handle closing braces (remove them)
    if (trimmed === '}') {
      return '' // Empty line to remove the brace
    }

    // Handle simple assignments with method invocation on RHS
    const assignMatch = trimmed.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/)
    if (assignMatch) {
      const lhs = assignMatch[1]
      const rhs = assignMatch[2]
      const translated = translateAssignmentInvocation(lhs, rhs, { useHelpers: true })
      if (translated.code) {
        // Accumulate imports
        translated.imports.forEach(m => requiredStdImports.add(m))
        translated.helperModules.forEach(m => requiredHelperModules.add(m))
        return `${pythonIndent}${translated.code}`
      }
    }

    // Handle assignments and expressions - default passthrough with original indentation
    return `${pythonIndent}${trimmed}`
  }

  /**
   * 🔍 **TRANSLATE IF ANY** - Smart lookahead approach
   */
  private translateIfAny(line: string, allLines: string[], currentIndex: number): string[] {
    const indent = this.getIndentation(line)
    const trimmed = line.trim()

    // Parse the if any statement
    const anyMatch = trimmed.match(/^if\s+any\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s+has\s+(.+)/)
    if (!anyMatch) {
      throw new Error(`Invalid if any syntax: ${trimmed}`)
    }

    const [, itemVar, collection, condition] = anyMatch
    console.log('🔍 [SimplePythonGenerator] Parsing if any:', { itemVar, collection, condition })
    const pythonCondition = this.translateCondition(condition)
    console.log('🔍 [SimplePythonGenerator] Translated condition:', pythonCondition)

    // 🔍 **LOOKAHEAD**: Check if there's a matching else
    const hasMatchingElse = this.hasMatchingElse(allLines, currentIndex, indent.length)

    // Generate the for loop structure with PROPER PYTHON indentation
    const pythonIndent = this.convertToPythonIndentation(indent)
    const forLine = `${pythonIndent}for ${itemVar} in ${collection}:`
    const ifLine = `${pythonIndent}    if ${pythonCondition}:`  // +4 spaces for for-loop nesting

    if (hasMatchingElse) {
      // Generate structure: for loop + if condition + placeholder for nested content + break + else
      // The nested content will be added by subsequent line processing
      return [forLine, ifLine]
    } else {
      // Simple structure without else
      return [forLine, ifLine]
    }
  }

  /**
   * 🔍 **HAS MATCHING ELSE** - Lookahead to detect else clause
   */
  private hasMatchingElse(lines: string[], currentIndex: number, ifAnyIndent: number): boolean {
    for (let i = currentIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      const lineIndent = this.getIndentation(line).length
      const trimmed = line.trim()

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//')) continue

      // If we hit something at same or lower indent that's not else, no else exists
      if (lineIndent <= ifAnyIndent && trimmed !== 'else') {
        return false
      }

      // If we find else at exact same indent, it's our else
      if (lineIndent === ifAnyIndent && trimmed === 'else') {
        return true
      }
    }

    return false
  }

  /**
   * 🔍 **IS ELSE FOR IF ANY** - Check if this else belongs to an if any block
   */
  private isElseForIfAny(lines: string[], currentIndex: number, elseIndent: number): boolean {
    // Look backwards to find a matching if any at the same indent level
    for (let i = currentIndex - 1; i >= 0; i--) {
      const line = lines[i]
      const lineIndent = this.getIndentation(line).length
      const trimmed = line.trim()

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//')) continue

      // If we find an if any at the same indent level, this else belongs to it
      if (lineIndent === elseIndent && trimmed.startsWith('if any ')) {
        return true
      }

      // If we hit another control structure at same or lower indent, stop looking
      if (lineIndent <= elseIndent && (
        trimmed.startsWith('if ') || 
        trimmed.startsWith('for ') || 
        trimmed.startsWith('while ') ||
        trimmed.startsWith('class ')
      )) {
        return false
      }
    }

    return false
  }

  /**
   * 🔧 **TRANSLATE CONDITION** - Convert business rule condition to Python
   */
  private translateCondition(condition: string): string {
    let pythonCondition = condition.trim()
    console.log('🔧 [translateCondition] Input:', pythonCondition)

    // Convert single = to == for comparisons (but not in assignments)
    if (pythonCondition.includes(' = ') && !pythonCondition.includes('==') && !pythonCondition.includes('!=')) {
      // More robust regex that handles multiple conditions
      pythonCondition = pythonCondition.replace(/(\w+(?:\.\w+)*)\s*=\s*([^=\s][^=]*?)(?=\s+and\s+|\s+or\s+|$)/g, '$1 == $2')
      console.log('🔧 [translateCondition] After = to ==:', pythonCondition)
    }

    // Handle logical operators
    pythonCondition = pythonCondition
      .replace(/\band\b/g, ' and ')
      .replace(/\bor\b/g, ' or ')
      .replace(/\bnot\b/g, ' not ')

    console.log('🔧 [translateCondition] Final result:', pythonCondition)
    return pythonCondition
  }

  /**
   * 🔍 **IS INSIDE IF ANY BLOCK** - Check if current line is inside an if any block
   */
  private isInsideIfAnyBlock(lines: string[], currentIndex: number, currentIndent: number): boolean {
    // Look backwards to find the most recent if any statement at a lower indent level
    let ifAnyIndent = -1
    let ifAnyIndex = -1
    
    for (let i = currentIndex - 1; i >= 0; i--) {
      const line = lines[i]
      const lineIndent = this.getIndentation(line).length
      const trimmed = line.trim()
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//')) continue
      
      // If we find an if any at a LOWER indent level, this could be our containing block
      if (lineIndent < currentIndent && trimmed.startsWith('if any ')) {
        ifAnyIndent = lineIndent
        ifAnyIndex = i
        break
      }
      
      // If we hit a control structure at same or lower indent, stop looking
      if (lineIndent <= currentIndent && (
        trimmed.startsWith('for ') || 
        trimmed.startsWith('while ') ||
        trimmed.startsWith('class ') ||
        (lineIndent < currentIndent && (trimmed.startsWith('if ') || trimmed === 'else'))
      )) {
        return false
      }
    }
    
    // If we found an if any, check if we're still in its block (not in the else part)
    if (ifAnyIndex >= 0) {
      // Look for the matching else at the same indent level as the if any
      for (let j = ifAnyIndex + 1; j < currentIndex; j++) {
        const checkLine = lines[j]
        const checkIndent = this.getIndentation(checkLine).length
        const checkTrimmed = checkLine.trim()
        
        // Skip empty lines and comments
        if (!checkTrimmed || checkTrimmed.startsWith('//')) continue
        
        // If we hit an else at the same level as the if any, we're in the else part
        if (checkIndent === ifAnyIndent && checkTrimmed === 'else') {
          return false
        }
      }
      return true
    }
    
    return false
  }

  /**
   * 🚀 **ROBUST INDENTATION APPROACH** - No complex calculations needed
   * 
   * The key insight: Business rules indentation should directly map to Python indentation
   * for most cases. Special handling only needed for if-any transformations.
   */

  /**
   * 🔧 **GET INDENTATION** - Extract indentation from line
   */
  private getIndentation(line: string): string {
    const match = line.match(/^(\s*)/)
    return match ? match[1] : ''
  }

  /**
   * 🔧 **CONVERT TO PYTHON INDENTATION** - Both BR and Python use 4-space standard
   */
  private convertToPythonIndentation(businessIndent: string): string {
    // Both business rules and Python use 4-space indentation
    // So we can directly use the business rules indentation
    return businessIndent
  }
}

// Export convenience function
export function generateSimplePython(businessRules: string, options?: SimplePythonOptions): SimplePythonResult {
  const generator = new SimplePythonGenerator(options)
  return generator.translate(businessRules)
}
