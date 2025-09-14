/**
 * 🎯 SIMPLE INDENTATION - Clean, Reliable, Predictable
 * 
 * This class handles indentation with a simple approach:
 * - 4-space indentation (Python standard)
 * - Lines ending with ':' get +4 spaces for next line
 * - No complex calculations, just simple increment logic
 * 
 * Key principle: "Previous line indent + 4 spaces"
 */

export interface IndentResult {
  pythonLines: string[]
  consumedLines: number
}

export class SimpleIndentation {
  private static readonly INDENT_SIZE = 4 // 4-space Python standard

  /**
   * 🎯 EXTRACT INDENTATION - Get current line's indentation
   */
  static extractIndent(line: string): string {
    const match = line.match(/^(\s*)/)
    return match ? match[1] : ''
  }

  /**
   * 🎯 GET NEXT LINE INDENT - Simple indentation logic
   * Lines ending with ':' get +4 spaces for next line
   */
  static getNextLineIndent(currentLine: string): string {
    const currentIndent = this.extractIndent(currentLine)
    const trimmed = currentLine.trim()
    
    // If line ends with :, next line gets +4 spaces
    if (trimmed.endsWith(':')) {
      return currentIndent + ' '.repeat(this.INDENT_SIZE)
    }
    
    // Otherwise, keep same indentation
    return currentIndent
  }

  /**
   * 🎯 PROCESS IF-ANY CONSTRUCT - Simple indentation approach
   * 
   * Business rule: if any testcls in testClasses has testcls.age = 4
   * Python output: for testcls in testClasses:
   *                    if testcls.age == 4:
   *                        # nested content here
   *                        break
   *                else:
   *                    # else content here
   */
  static processIfAny(
    line: string,
    allLines: string[],
    currentIndex: number
  ): IndentResult {
    console.log(`🎯 [SimpleIndentation] Processing if-any with simple approach`)
    
    const trimmed = line.trim()
    const baseIndent = this.extractIndent(line)

    // Parse the if any statement
    const anyMatch = trimmed.match(/^if\s+any\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s+has\s+(.+)/)
    if (!anyMatch) {
      throw new Error(`Invalid if any syntax: ${trimmed}`)
    }

    const [, itemVar, collection, condition] = anyMatch
    
    // 🎯 SMART CONDITION PARSING - Handle different "has" patterns
    let pythonCondition: string
    
    // Check if condition already contains the item variable (e.g., "testcls.age = 5")
    if (condition.includes(itemVar)) {
      // Complex condition like "testcls.age = 5" -> "testcls.age == 5"
      pythonCondition = this.translateCondition(condition)
    } else {
      // Simple value condition like "1" -> "testcls == 1"
      const translatedCondition = this.translateCondition(condition)
      pythonCondition = `${itemVar} == ${translatedCondition}`
    }

    console.log(`🔍 [SimpleIndentation] Parsed:`, {
      itemVar,
      collection,
      condition: pythonCondition,
      baseIndent: `"${baseIndent}"`
    })

    // Simple indentation calculation
    const forIndent = baseIndent                           // Same as business rule
    const ifIndent = baseIndent + '    '                   // +4 spaces
    const nestedIndent = baseIndent + '        '           // +8 spaces
    const breakIndent = baseIndent + '        '            // Same as nested content (FIXED: was +4, should be +8)
    const elseIndent = baseIndent                          // Same as for loop

    console.log(`🎯 [SimpleIndentation] Calculated indents:`, {
      forIndent: `"${forIndent}" (${forIndent.length} spaces)`,
      ifIndent: `"${ifIndent}" (${ifIndent.length} spaces)`,
      nestedIndent: `"${nestedIndent}" (${nestedIndent.length} spaces)`,
      breakIndent: `"${breakIndent}" (${breakIndent.length} spaces)`,
      elseIndent: `"${elseIndent}" (${elseIndent.length} spaces)`
    })

    // Find matching else clause FIRST to determine structure
    const elseInfo = this.findMatchingElse(allLines, currentIndex, baseIndent.length)
    let consumedLines = 1

    // Generate Python structure - ALWAYS start with for loop
    const pythonLines = [
      `${forIndent}for ${itemVar} in ${collection}:`
    ]

    if (elseInfo) {
      console.log(`✅ [SimpleIndentation] Found else at line ${elseInfo.lineNumber} (0-based)`)
      console.log(`🔍 [SimpleIndentation] Current index: ${currentIndex}, Else line: ${elseInfo.lineNumber}`)
      
      // Add the if condition inside the for loop
      pythonLines.push(`${ifIndent}if ${pythonCondition}:`)
      
      // Process nested content between if-any and else
      const nestedLines = this.processNestedContent(
        allLines,
        currentIndex + 1,
        elseInfo.lineNumber,
        nestedIndent
      )
      pythonLines.push(...nestedLines)

      // Add break statement (inside the if block)
      pythonLines.push(`${breakIndent}break`)

      // Add else clause (paired with the for loop)
      pythonLines.push(`${elseIndent}else:`)

      // Process else content
      const elseLines = this.processElseContent(
        allLines,
        elseInfo.lineNumber,
        elseIndent + '    ' // +4 spaces for else content
      )
      pythonLines.push(...elseLines.pythonLines)
      consumedLines = elseLines.endIndex - currentIndex
      console.log(`🔍 [SimpleIndentation] Consumed lines calculation: endIndex=${elseLines.endIndex}, currentIndex=${currentIndex}, consumedLines=${consumedLines}`)
    } else {
      console.log(`❌ [SimpleIndentation] No else clause found - generating simple for-if structure`)
      
      // Add the if condition inside the for loop
      pythonLines.push(`${ifIndent}if ${pythonCondition}:`)
      
      // Process remaining nested content until end of block
      const nestedLines = this.processNestedContent(
        allLines,
        currentIndex + 1,
        allLines.length,
        nestedIndent
      )
      pythonLines.push(...nestedLines)
      
      // Add break statement (inside the if block)
      pythonLines.push(`${breakIndent}break`)
      
      // Calculate consumed lines properly
      let endIndex = currentIndex + 1
      const ifAnyIndentLevel = baseIndent.length
      
      for (let i = currentIndex + 1; i < allLines.length; i++) {
        const line = allLines[i]
        const lineIndent = this.extractIndent(line).length
        const trimmed = line.trim()
        
        // Stop if we hit something at same or lower indent level
        if (trimmed && lineIndent <= ifAnyIndentLevel) {
          break
        }
        endIndex = i + 1
      }
      
      consumedLines = endIndex - currentIndex
    }

    console.log(`✅ [SimpleIndentation] Generated ${pythonLines.length} Python lines, consumed ${consumedLines} business lines`)

    return {
      pythonLines,
      consumedLines
    }
  }

  /**
   * 🔍 FIND MATCHING ELSE - Look for else at same indent level
   */
  private static findMatchingElse(
    lines: string[],
    currentIndex: number,
    ifAnyIndent: number
  ): { lineNumber: number } | null {
    for (let i = currentIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      const lineIndent = this.extractIndent(line).length
      const trimmed = line.trim()

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//')) continue

      // If we hit something at same or lower indent that's not else, no else exists
      if (lineIndent <= ifAnyIndent && trimmed !== 'else') {
        return null
      }

      // If we find else at exact same indent, it's our else
      if (lineIndent === ifAnyIndent && trimmed === 'else') {
        return { lineNumber: i } // Keep 0-based for consistency
      }
    }

    return null
  }

  /**
   * 🔄 PROCESS NESTED CONTENT - Handle nested if-else structures properly
   */
  private static processNestedContent(
    lines: string[],
    startIndex: number,
    endIndex: number,
    baseIndent: string
  ): string[] {
    const pythonLines: string[] = []

    for (let i = startIndex; i < endIndex && i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // Skip empty lines
      if (!trimmed) {
        pythonLines.push('')
        continue
      }

      // Handle comments
      if (trimmed.startsWith('//')) {
        const commentText = trimmed.substring(2).trim()
        pythonLines.push(`${baseIndent}# ${commentText}`)
        continue
      }

      // 🎯 HANDLE CONTROL STRUCTURES - if, else, elseif
      if (trimmed.startsWith('if ')) {
        const pythonLine = this.processContentLine(line, baseIndent)
        pythonLines.push(pythonLine)
        continue
      }

      if (trimmed === 'else') {
        // Calculate proper indentation for else - same as the matching if
        const originalIndent = this.extractIndent(line)
        // 🎯 FIX: Map business rule indentation directly to Python indentation
        // Business rule: 4 spaces → Python: baseIndent + 4 spaces
        // Business rule: 8 spaces → Python: baseIndent + 8 spaces, etc.
        const pythonIndent = baseIndent + ' '.repeat(originalIndent.length)
        pythonLines.push(`${pythonIndent}else:`)
        continue
      }

      if (trimmed.startsWith('elseif ')) {
        // Convert elseif to elif
        const condition = trimmed.substring(7).trim() // Remove 'elseif '
        const translatedCondition = this.translateCondition(condition)
        const originalIndent = this.extractIndent(line)
        // 🎯 FIX: Map business rule indentation directly to Python indentation
        const pythonIndent = baseIndent + ' '.repeat(originalIndent.length)
        pythonLines.push(`${pythonIndent}elif ${translatedCondition}:`)
        continue
      }

      // Process regular content with simple indentation
      const pythonLine = this.processContentLine(line, baseIndent)
      pythonLines.push(pythonLine)
    }

    return pythonLines
  }

  /**
   * 🔄 PROCESS CONTENT LINE - Handle individual line with simple indentation
   */
  private static processContentLine(line: string, baseIndent: string): string {
    const trimmed = line.trim()
    const originalIndent = this.extractIndent(line)

    // Calculate relative indentation from the minimum nested level
    // Business rule indentation maps to Python indentation:
    // 4 spaces (first level) → base indentation (8 spaces)
    // 8 spaces (second level) → base + 4 spaces (12 spaces)
    const minNestedLevel = 4 // First level of nesting in business rules (4-space standard)
    const businessRuleLevels = Math.max(0, (originalIndent.length - minNestedLevel) / 4)
    const relativeSpaces = businessRuleLevels * this.INDENT_SIZE
    const relativeIndent = ' '.repeat(relativeSpaces)

    // Apply simple indentation: base + relative offset
    const finalIndent = baseIndent + relativeIndent

    // Translate conditions and control structures
    let pythonContent = trimmed

    // Handle if/elif/else
    if (trimmed.startsWith('if ')) {
      const condition = trimmed.replace(/^if\s+/, '')
      pythonContent = `if ${this.translateCondition(condition)}:`
    } else if (trimmed.startsWith('elseif ') || trimmed.startsWith('elif ')) {
      const condition = trimmed.replace(/^(elseif|elif)\s+/, '')
      pythonContent = `elif ${this.translateCondition(condition)}:`
    } else if (trimmed === 'else') {
      pythonContent = 'else:'
    }

    return `${finalIndent}${pythonContent}`
  }

  /**
   * 🔄 PROCESS ELSE CONTENT - Handle else clause content
   */
  private static processElseContent(
    lines: string[],
    elseLineIndex: number,
    baseIndent: string
  ): { pythonLines: string[], endIndex: number } {
    const pythonLines: string[] = []
    let endIndex = elseLineIndex + 1

    const elseIndentLevel = this.extractIndent(lines[elseLineIndex]).length

    for (let i = elseLineIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      const lineIndent = this.extractIndent(line).length

      // Stop if we hit something at same or lower indent level
      if (trimmed && lineIndent <= elseIndentLevel) {
        break
      }

      // Skip empty lines
      if (!trimmed) {
        pythonLines.push('')
        endIndex = i + 1
        continue
      }

      // Process the line with base indent
      const pythonLine = this.processContentLine(line, baseIndent)
      pythonLines.push(pythonLine)
      endIndex = i + 1
    }

    return { pythonLines, endIndex }
  }

  /**
   * 🔧 TRANSLATE CONDITION - Convert business rule condition to Python
   */
  private static translateCondition(condition: string): string {
    return condition
      .replace(/\s*=\s*/g, ' == ')     // = becomes ==
      .replace(/\s*<>\s*/g, ' != ')    // <> becomes !=
      .replace(/\s*>=\s*/g, ' >= ')    // Normalize >=
      .replace(/\s*<=\s*/g, ' <= ')    // Normalize <=
      .replace(/\s*>\s*/g, ' > ')      // Normalize >
      .replace(/\s*<\s*/g, ' < ')      // Normalize <
      .replace(/\s+and\s+/gi, ' and ') // Normalize and
      .replace(/\s+or\s+/gi, ' or ')   // Normalize or
      .replace(/\s+not\s+/gi, ' not ') // Normalize not
  }
}
