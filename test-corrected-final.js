/**
 * 🎯 CORRECTED FINAL TEST: With Updated Logic
 */

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

  // CORRECTED processContentLine with the new logic
  static processContentLine(line, baseIndent) {
    const trimmed = line.trim()
    const originalIndent = this.extractIndent(line)

    // Calculate relative indentation from the minimum nested level
    // Business rule indentation maps to Python indentation:
    // 2 spaces (first level) → base indentation (8 spaces)
    // 4 spaces (second level) → base + 4 spaces (12 spaces)
    const minNestedLevel = 2 // First level of nesting in business rules
    const businessRuleLevels = Math.max(0, (originalIndent.length - minNestedLevel) / 2)
    const relativeSpaces = businessRuleLevels * this.INDENT_SIZE
    const relativeIndent = ' '.repeat(relativeSpaces)

    // Apply simple indentation: base + relative offset
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
}

console.log('🎯 CORRECTED FINAL TEST\n')

// Test the specific nested content processing
const nestedLines = [
  '  if newCls.age = 5',      // Should be 8 spaces
  '    air = ""',             // Should be 12 spaces
  '  elseif newCls.age = 3',  // Should be 8 spaces
  '    air = "gthan"'         // Should be 12 spaces
]

const baseIndent = '        ' // 8 spaces

console.log('🔍 Testing Corrected processContentLine:')
console.log(`Base indent: "${baseIndent}" (${baseIndent.length} spaces)`)
console.log()

nestedLines.forEach((line, i) => {
  const result = SimpleIndentation.processContentLine(line, baseIndent)
  const resultSpaces = result.match(/^( *)/)[1].length
  const content = result.trim()
  
  console.log(`Line ${i+1}: "${line}"`)
  console.log(`  Result: ${resultSpaces} spaces - "${content}"`)
  
  // Expected results
  const expectedSpaces = i % 2 === 0 ? 8 : 12 // if/elif = 8, content = 12
  console.log(`  Expected: ${expectedSpaces} spaces`)
  console.log(`  ✅ ${resultSpaces === expectedSpaces ? 'CORRECT' : '❌ WRONG'}`)
  console.log()
})

console.log('🎯 Expected Mapping:')
console.log('  Business "  if newCls.age = 5" (2 spaces) → Python 8 spaces')
console.log('  Business "    air = \\"\\""" (4 spaces) → Python 12 spaces')
console.log('  Business "  elseif newCls.age = 3" (2 spaces) → Python 8 spaces')
console.log('  Business "    air = \\"gthan\\"" (4 spaces) → Python 12 spaces')

// Test the complete nested content processing
console.log('\n🔍 Testing Complete processNestedContent:')
const result = SimpleIndentation.processNestedContent(nestedLines, 0, nestedLines.length, baseIndent)

console.log('Complete nested content result:')
result.forEach((line, i) => {
  const spaces = line.match(/^( *)/)[1].length
  const content = line.trim()
  console.log(`  ${i+1}: (${spaces} spaces) "${content}"`)
})

const expectedSpacesArray = [8, 12, 8, 12]
let allCorrect = true

result.forEach((line, i) => {
  const actualSpaces = line.match(/^( *)/)[1].length
  const expectedSpaces = expectedSpacesArray[i]
  if (actualSpaces !== expectedSpaces) {
    allCorrect = false
  }
})

console.log(`\n🎯 Result: ${allCorrect ? '✅ ALL CORRECT!' : '❌ Issues remain'}`)
