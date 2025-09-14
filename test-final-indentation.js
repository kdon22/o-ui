/**
 * 🎯 FINAL TEST: Complete Indentation Verification
 * 
 * This test verifies that our SimpleIndentation system now produces
 * the correct Python indentation for if-any constructs.
 */

// Complete mock with the corrected processContentLine
class SimpleIndentation {
  static INDENT_SIZE = 4

  static extractIndent(line) {
    const match = line.match(/^(\s*)/)
    return match ? match[1] : ''
  }

  static translateCondition(condition) {
    return condition
      .replace(/\s*=\s*/g, ' == ')
      .replace(/\s*<>\s*/g, ' != ')
  }

  static processContentLine(line, baseIndent) {
    const trimmed = line.trim()
    const originalIndent = this.extractIndent(line)

    // Use the original business rule indentation as relative indentation
    // This preserves the indentation structure from the business rules
    const relativeIndent = originalIndent

    // Apply simple indentation: base + relative
    const finalIndent = baseIndent + relativeIndent

    // Translate conditions and control structures
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

  static processIfAny(line, allLines, currentIndex) {
    const trimmed = line.trim()
    const baseIndent = this.extractIndent(line)

    const anyMatch = trimmed.match(/^if\s+any\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s+has\s+(.+)/)
    if (!anyMatch) {
      throw new Error(`Invalid if any syntax: ${trimmed}`)
    }

    const [, itemVar, collection, condition] = anyMatch
    const pythonCondition = this.translateCondition(condition)

    // Simple indentation calculation
    const forIndent = baseIndent                           // Same as business rule
    const ifIndent = baseIndent + '    '                   // +4 spaces
    const nestedIndent = baseIndent + '        '           // +8 spaces
    const breakIndent = baseIndent + '    '                // Same as if condition
    const elseIndent = baseIndent                          // Same as for loop

    // Generate Python structure
    const pythonLines = [
      `${forIndent}for ${itemVar} in ${collection}:`,
      `${ifIndent}if ${pythonCondition}:`
    ]

    // Find matching else clause
    const elseInfo = this.findMatchingElse(allLines, currentIndex, baseIndent.length)
    let consumedLines = 1

    if (elseInfo) {
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

    return {
      pythonLines,
      consumedLines
    }
  }
}

console.log('🎯 FINAL TEST: Complete Indentation Verification\n')

const businessRules = `if any testcls in testClasses has testcls.age = 4
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

const lines = businessRules.split('\n')

console.log('📝 Input Business Rules:')
lines.forEach((line, i) => {
  const spaces = line.match(/^( *)/)[1].length
  console.log(`  ${i+1}: (${spaces} spaces) ${JSON.stringify(line)}`)
})

console.log('\n🎯 Processing with Fixed SimpleIndentation...')

try {
  const result = SimpleIndentation.processIfAny(lines[0], lines, 0)
  
  console.log('\n✅ Generated Python Output:')
  result.pythonLines.forEach((line, i) => {
    const spaces = line.match(/^( *)/)[1].length
    const content = line.trim()
    console.log(`  ${i+1}: (${spaces} spaces) "${content}"`)
  })

  console.log('\n🔍 Indentation Analysis:')
  const expectedIndents = [0, 4, 8, 12, 8, 12, 4, 0, 4, 4, 8, 4, 8]
  let allCorrect = true

  result.pythonLines.forEach((line, i) => {
    const actualSpaces = line.match(/^( *)/)[1].length
    const expectedSpaces = expectedIndents[i]
    const isCorrect = actualSpaces === expectedSpaces
    
    if (!isCorrect) allCorrect = false
    
    console.log(`  Line ${i+1}: ${actualSpaces} spaces ${isCorrect ? '✅' : '❌'} (expected ${expectedSpaces})`)
  })

  console.log(`\n🎯 Overall Result: ${allCorrect ? '✅ ALL CORRECT!' : '❌ Some issues remain'}`)

  if (allCorrect) {
    console.log('\n🎉 SUCCESS! The indentation fix is working correctly:')
    console.log('  ✅ Break statement at 4 spaces (same as if condition)')
    console.log('  ✅ Nested if statements at 8 spaces')
    console.log('  ✅ Nested content at 12 spaces')
    console.log('  ✅ No double indentation issues')
    console.log('  ✅ Clean 4-space increments throughout')
  }

} catch (error) {
  console.error('❌ Error:', error.message)
}

console.log('\n🎯 Expected Final Python:')
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

console.log(expectedPython)
