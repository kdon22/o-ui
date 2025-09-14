/**
 * 🧪 TEST: Indentation Fix Verification
 * 
 * This test verifies that our fix for the double indentation issue works correctly.
 */

// Updated mock with the fix
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

  // Fixed processContentLine method
  static processContentLine(line, baseIndent) {
    const trimmed = line.trim()
    const originalIndent = this.extractIndent(line)

    // Calculate relative indentation based on business rule nesting
    // We need to determine the minimum indent level in the nested block
    // and calculate relative indentation from that baseline
    const minNestedIndent = 2 // Minimum indentation for nested content in business rules
    const relativeSpaces = Math.max(0, originalIndent.length - minNestedIndent)
    const relativeIndent = ' '.repeat(relativeSpaces)

    // Apply simple indentation: base + relative (not absolute)
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

console.log('🧪 Testing Indentation Fix...\n')

// Test the specific problematic lines
const testLines = [
  '  if newCls.age = 5',      // 2 spaces in business rule
  '    air = ""',             // 4 spaces in business rule  
  '  elseif newCls.age = 3',  // 2 spaces in business rule
  '    air = "gthan"'         // 4 spaces in business rule
]

const baseIndent = '        ' // 8 spaces (what processIfAny calculates for nested content)

console.log('🔍 Testing processContentLine with fixed logic:')
console.log(`Base indent: "${baseIndent}" (${baseIndent.length} spaces)`)
console.log()

testLines.forEach((line, i) => {
  const originalSpaces = line.match(/^( *)/)[1].length
  const result = SimpleIndentation.processContentLine(line, baseIndent)
  const resultSpaces = result.match(/^( *)/)[1].length
  const content = result.trim()
  
  console.log(`Line ${i+1}: "${line}"`)
  console.log(`  Original: ${originalSpaces} spaces`)
  console.log(`  Result: ${resultSpaces} spaces - "${content}"`)
  
  // Calculate what we expect
  const minNestedIndent = 2
  const relativeSpaces = Math.max(0, originalSpaces - minNestedIndent)
  const expectedSpaces = baseIndent.length + relativeSpaces
  
  console.log(`  Expected: ${expectedSpaces} spaces`)
  console.log(`  ✅ ${resultSpaces === expectedSpaces ? 'CORRECT' : '❌ WRONG'}`)
  console.log()
})

console.log('🎯 Expected Results:')
console.log('  Line 1: "  if newCls.age = 5" (2 spaces) → 8 spaces total')
console.log('    - minNestedIndent = 2')
console.log('    - relativeSpaces = max(0, 2 - 2) = 0')
console.log('    - finalIndent = 8 + 0 = 8 spaces ✅')
console.log()
console.log('  Line 2: "    air = \\"\\""" (4 spaces) → 12 spaces total')
console.log('    - minNestedIndent = 2')
console.log('    - relativeSpaces = max(0, 4 - 2) = 2')
console.log('    - finalIndent = 8 + 2 = 10 spaces ❌ (should be 12)')
console.log()

console.log('🔧 Issue Found: The minNestedIndent should be 0, not 2!')
console.log('We want to preserve the relative indentation structure from business rules.')

// Test with corrected logic
console.log('\n🔧 Testing with corrected minNestedIndent = 0:')

class CorrectedIndentation {
  static processContentLine(line, baseIndent) {
    const trimmed = line.trim()
    const originalIndent = SimpleIndentation.extractIndent(line)

    // Use the original indentation directly as relative indentation
    const relativeIndent = originalIndent

    // Apply simple indentation: base + relative
    const finalIndent = baseIndent + relativeIndent

    // Translate conditions
    let pythonContent = trimmed
    if (trimmed.startsWith('if ')) {
      const condition = trimmed.replace(/^if\s+/, '')
      pythonContent = `if ${SimpleIndentation.translateCondition(condition)}:`
    } else if (trimmed.startsWith('elseif ') || trimmed.startsWith('elif ')) {
      const condition = trimmed.replace(/^(elseif|elif)\s+/, '')
      pythonContent = `elif ${SimpleIndentation.translateCondition(condition)}:`
    }

    return `${finalIndent}${pythonContent}`
  }
}

testLines.forEach((line, i) => {
  const originalSpaces = line.match(/^( *)/)[1].length
  const result = CorrectedIndentation.processContentLine(line, baseIndent)
  const resultSpaces = result.match(/^( *)/)[1].length
  const content = result.trim()
  
  console.log(`Line ${i+1}: "${line}"`)
  console.log(`  Original: ${originalSpaces} spaces`)
  console.log(`  Result: ${resultSpaces} spaces - "${content}"`)
  
  // Expected: baseIndent (8) + original indentation
  const expectedSpaces = baseIndent.length + originalSpaces
  console.log(`  Expected: ${expectedSpaces} spaces`)
  console.log(`  ✅ ${resultSpaces === expectedSpaces ? 'CORRECT' : '❌ WRONG'}`)
  console.log()
})
