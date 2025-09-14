/**
 * 🧪 **TEST RAW PYTHON GENERATOR**
 * 
 * Test the new RawPythonGenerator with your existing code
 * to ensure indentation is preserved perfectly
 */

// Simulate your perfectly indented Python code from IndexedDB
const rawPythonCode = `# this is a test
class Test:
    name = "ell"
    age = 12

air = "123"

newS = 5

newCls = Test()

newCls.age = 4
newCls.name = "ger"

new1Cls = Test()



testClasses = [newCls, new1Cls]

for testcls in testClasses:
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
        air = "gthan"
        air = ""
        air = "yes"`

// Simulate your business rules
const businessRules = `// this is a test
class Test {
  name = "ell"
  age = 12
}

air = "123"

newS = 5

newCls = Test()

newCls.age = 4
newCls.name = "ger"

new1Cls = Test()



testClasses = [newCls, new1Cls]

if any testcls in testClasses has testcls.age = 4
  if newCls.age = 5
    air = ""
  elseif newCls.age = 3
    air = "gthan"
else
  air = "RR"
  if newCls.age = 6
    air = ""
  elseif newCls.age = 12
    air = "gthan"
    air = ""
    air = "yes"`

// Test the raw generator
import { generateRawPython } from './o-ui/src/lib/editor/python-generation/raw-python-generator.js'

console.log('🧪 Testing Raw Python Generator...')
console.log('📝 Input Python code length:', rawPythonCode.length)
console.log('📝 Input business rules length:', businessRules.length)

const result = generateRawPython(rawPythonCode, businessRules, {
  debugMode: true
})

console.log('\n✅ Generation Result:')
console.log('Success:', result.success)
console.log('Errors:', result.errors)
console.log('Warnings:', result.warnings)
console.log('Source map mappings:', result.sourceMap.mappings.length)

console.log('\n🐍 Original Python (first 500 chars):')
console.log(result.pythonCode.substring(0, 500))

console.log('\n🔧 Instrumented Python (first 1000 chars):')
console.log(result.instrumentedCode.substring(0, 1000))

console.log('\n🗺️ Source Map Sample (first 5 mappings):')
console.log(result.sourceMap.mappings.slice(0, 5))

// Test indentation preservation
const originalLines = rawPythonCode.split('\n')
const instrumentedLines = result.instrumentedCode.split('\n')

console.log('\n📏 Indentation Test:')
let indentationPreserved = true
let testCount = 0

for (let i = 0; i < originalLines.length && testCount < 10; i++) {
  const originalLine = originalLines[i]
  if (originalLine.trim()) {
    // Find this line in the instrumented code (it should be there with 4 extra spaces for try block)
    const expectedLine = `    ${originalLine}`
    const found = instrumentedLines.some(line => line === expectedLine)
    
    if (!found) {
      console.log(`❌ Line ${i + 1} indentation not preserved:`)
      console.log(`   Original: "${originalLine}"`)
      console.log(`   Expected: "${expectedLine}"`)
      indentationPreserved = false
    } else {
      console.log(`✅ Line ${i + 1} indentation preserved`)
    }
    testCount++
  }
}

console.log(`\n🎯 Final Result: Indentation ${indentationPreserved ? 'PRESERVED ✅' : 'BROKEN ❌'}`)
