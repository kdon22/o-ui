/**
 * 🧪 TEST: If Any Else Fix Verification
 * 
 * This test verifies that the if any...else construct now generates
 * correct Python code including the else clause content.
 */

const { generateSimplePython } = require('./src/lib/editor/python-generation/simple-generator.ts')

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
    air = "gthan"`

console.log('🧪 Testing if any...else fix...')
console.log('📝 Input business rules:')
console.log(businessRules)
console.log('\n' + '='.repeat(80) + '\n')

try {
  const result = generateSimplePython(businessRules)
  
  console.log('✅ Translation result:')
  console.log('Success:', result.success)
  console.log('Errors:', result.errors)
  console.log('Warnings:', result.warnings)
  console.log('\n📝 Generated Python code:')
  console.log(result.pythonCode)
  
  // Check if else content is present
  const hasElseContent = result.pythonCode.includes('air = "RR"')
  const hasNestedIf = result.pythonCode.includes('if newCls.age == 6:')
  const hasNestedElif = result.pythonCode.includes('elif newCls.age == 12:')
  
  console.log('\n🔍 Verification checks:')
  console.log('✅ Else content present:', hasElseContent)
  console.log('✅ Nested if in else:', hasNestedIf)  
  console.log('✅ Nested elif in else:', hasNestedElif)
  
  if (hasElseContent && hasNestedIf && hasNestedElif) {
    console.log('\n🎉 SUCCESS: If any...else fix is working correctly!')
  } else {
    console.log('\n❌ FAILURE: Some else content is still missing')
  }
  
} catch (error) {
  console.error('❌ Test failed with error:', error)
}
