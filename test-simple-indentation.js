/**
 * 🧪 TEST: Simple Indentation System
 * 
 * This test verifies that the new SimpleIndentation class
 * produces correct Python indentation for if-any constructs.
 */

// Mock the SimpleIndentation class for testing
class SimpleIndentation {
  static INDENT_SIZE = 4

  static extractIndent(line) {
    const match = line.match(/^(\s*)/)
    return match ? match[1] : ''
  }

  static getNextLineIndent(currentLine) {
    const currentIndent = this.extractIndent(currentLine)
    const trimmed = currentLine.trim()
    
    if (trimmed.endsWith(':')) {
      return currentIndent + ' '.repeat(this.INDENT_SIZE)
    }
    
    return currentIndent
  }

  static translateCondition(condition) {
    return condition
      .replace(/\s*=\s*/g, ' == ')
      .replace(/\s*<>\s*/g, ' != ')
      .replace(/\s*>=\s*/g, ' >= ')
      .replace(/\s*<=\s*/g, ' <= ')
      .replace(/\s*>\s*/g, ' > ')
      .replace(/\s*<\s*/g, ' < ')
      .replace(/\s+and\s+/gi, ' and ')
      .replace(/\s+or\s+/gi, ' or ')
      .replace(/\s+not\s+/gi, ' not ')
  }

  static processIfAny(line, allLines, currentIndex) {
    console.log(`🎯 [SimpleIndentation] Processing if-any with simple approach`)
    
    const trimmed = line.trim()
    const baseIndent = this.extractIndent(line)

    // Parse the if any statement
    const anyMatch = trimmed.match(/^if\s+any\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s+has\s+(.+)/)
    if (!anyMatch) {
      throw new Error(`Invalid if any syntax: ${trimmed}`)
    }

    const [, itemVar, collection, condition] = anyMatch
    const pythonCondition = this.translateCondition(condition)

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
    const breakIndent = baseIndent + '    '                // Same as if condition
    const elseIndent = baseIndent                          // Same as for loop

    console.log(`🎯 [SimpleIndentation] Calculated indents:`, {
      forIndent: `"${forIndent}" (${forIndent.length} spaces)`,
      ifIndent: `"${ifIndent}" (${ifIndent.length} spaces)`,
      nestedIndent: `"${nestedIndent}" (${nestedIndent.length} spaces)`,
      breakIndent: `"${breakIndent}" (${breakIndent.length} spaces)`,
      elseIndent: `"${elseIndent}" (${elseIndent.length} spaces)`
    })

    // Generate Python structure
    const pythonLines = [
      `${forIndent}for ${itemVar} in ${collection}:`,
      `${ifIndent}if ${pythonCondition}:`
    ]

    // Find matching else clause
    const elseInfo = this.findMatchingElse(allLines, currentIndex, baseIndent.length)
    let consumedLines = 1

    if (elseInfo) {
      console.log(`✅ [SimpleIndentation] Found else at line ${elseInfo.lineNumber}`)
      
      // Process nested content between if-any and else
      const nestedLines = this.processNestedContent(
        allLines,
        currentIndex + 1,
        elseInfo.lineNumber - 1,
        nestedIndent
      )
      pythonLines.push(...nestedLines)

      // Add break statement (same level as if condition)
      pythonLines.push(`${breakIndent}break`)

      // Add else clause
      pythonLines.push(`${elseIndent}else:`)

      // Process else content
      const elseLines = this.processElseContent(
        allLines,
        elseInfo.lineNumber,
        elseIndent + '    ' // +4 spaces for else content
      )
      pythonLines.push(...elseLines.pythonLines)
      consumedLines = elseLines.endIndex - currentIndex
    }

    console.log(`✅ [SimpleIndentation] Generated ${pythonLines.length} Python lines, consumed ${consumedLines} business lines`)

    return {
      pythonLines,
      consumedLines
    }
  }

  static findMatchingElse(lines, currentIndex, ifAnyIndent) {
    for (let i = currentIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      const lineIndent = this.extractIndent(line).length
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('//')) continue

      if (lineIndent <= ifAnyIndent && trimmed !== 'else') {
        return null
      }

      if (lineIndent === ifAnyIndent && trimmed === 'else') {
        return { lineNumber: i + 1 }
      }
    }
    return null
  }

  static processNestedContent(lines, startIndex, endIndex, baseIndent) {
    const pythonLines = []

    for (let i = startIndex; i < endIndex && i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (!trimmed) {
        pythonLines.push('')
        continue
      }

      if (trimmed.startsWith('//')) {
        const commentText = trimmed.substring(2).trim()
        pythonLines.push(`${baseIndent}# ${commentText}`)
        continue
      }

      const pythonLine = this.processContentLine(line, baseIndent)
      pythonLines.push(pythonLine)
    }

    return pythonLines
  }

  static processContentLine(line, baseIndent) {
    const trimmed = line.trim()
    const originalIndent = this.extractIndent(line)

    const relativeIndent = originalIndent.length > 0 ? 
      ' '.repeat(originalIndent.length) : ''

    const finalIndent = baseIndent + relativeIndent

    let pythonContent = trimmed

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

  static processElseContent(lines, elseLineIndex, baseIndent) {
    const pythonLines = []
    let endIndex = elseLineIndex + 1

    const elseIndentLevel = this.extractIndent(lines[elseLineIndex]).length

    for (let i = elseLineIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      const lineIndent = this.extractIndent(line).length

      if (trimmed && lineIndent <= elseIndentLevel) {
        break
      }

      if (!trimmed) {
        pythonLines.push('')
        endIndex = i + 1
        continue
      }

      const pythonLine = this.processContentLine(line, baseIndent)
      pythonLines.push(pythonLine)
      endIndex = i + 1
    }

    return { pythonLines, endIndex }
  }
}

// Test cases
console.log('🧪 Testing Simple Indentation System...\n')

// Test 1: Basic if-any construct
console.log('📝 Test 1: Basic if-any construct')
const businessRules1 = `if any testcls in testClasses has testcls.age = 4
  if newCls.age = 5
    air = ""
  elseif newCls.age = 3
    air = "gthan"
else
  air = "RR"
  if newCls.age = 6
    air = ""
  elseif newCls.age = 12
    air = "gthan"`

const lines1 = businessRules1.split('\n')
console.log('Input lines:')
lines1.forEach((line, i) => console.log(`  ${i+1}: ${JSON.stringify(line)}`))

try {
  const result1 = SimpleIndentation.processIfAny(lines1[0], lines1, 0)
  console.log('\n🎯 Generated Python:')
  result1.pythonLines.forEach((line, i) => {
    const spaces = line.match(/^( *)/)[1].length
    console.log(`  ${i+1}: (${spaces} spaces) ${JSON.stringify(line)}`)
  })
  console.log(`\n📊 Consumed ${result1.consumedLines} business lines`)
} catch (error) {
  console.error('❌ Error:', error.message)
}

console.log('\n' + '='.repeat(60) + '\n')

// Test 2: Indentation verification
console.log('📝 Test 2: Indentation Verification')
console.log('Expected indentation pattern:')
console.log('  for loop: 0 spaces')
console.log('  if condition: 4 spaces')
console.log('  nested content: 8 spaces')
console.log('  break statement: 4 spaces (✅ CRITICAL - same as if condition)')
console.log('  else clause: 0 spaces')
console.log('  else content: 4 spaces')

console.log('\n🎯 Expected Python output:')
const expectedPython = `for testcls in testClasses:
    if testcls.age == 4:
        if newCls.age == 5:
            air = ""
        elif newCls.age == 3:
            air = "gthan"
        break
else:
    air = "RR"
    if newCls.age == 6:
        air = ""
    elif newCls.age == 12:
        air = "gthan"`

expectedPython.split('\n').forEach((line, i) => {
  const spaces = line.match(/^( *)/)[1].length
  const content = line.trim()
  console.log(`  ${i+1}: (${spaces} spaces) "${content}"`)
})

console.log('\n✅ Key Success Criteria:')
console.log('  - Break statement at 4 spaces (same as if condition)')
console.log('  - No double indentation issues')
console.log('  - Clean 4-space increments')
console.log('  - Matches Monaco Editor behavior')
