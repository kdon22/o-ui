/**
 * 🧪 TEST: If Any Simple Condition Fix
 * 
 * This test verifies that "if any testcls in testClasses has 1" 
 * correctly generates "if testcls == 1:" instead of malformed conditions.
 */

const { generateSimplePython } = require('./src/lib/editor/python-generation/simple-generator.ts')

const businessRules = `// this is a test
class Test {
    name = "ell"
    age = 12
}

air = "1WWWW23"


if air = "1WWWW23"
    air = "1"
else
    air = "2"


newS = 5

newCls = Test()

newCls.age = 4
newCls.name = "ger"

new1Cls = Test()



testClasses = [1,2,3,4]

if any testcls in testClasses has 1
    if newS = 5
          if newCls.age = 5
            newCls.age = 3
    else
        newCls.age = 9
else
    if newCls.age = 5
        newCls.age = 2
    newCls.age = 1`

console.log('🧪 Testing if any simple condition fix...')
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
  
  // Check if the condition is correctly generated
  const hasCorrectCondition = result.pythonCode.includes('if testcls == 1:')
  const hasForLoop = result.pythonCode.includes('for testcls in testClasses:')
  const hasBreakStatement = result.pythonCode.includes('break')
  const hasElseClause = result.pythonCode.includes('else:')
  
  console.log('\n🔍 Verification checks:')
  console.log('✅ Correct condition (testcls == 1):', hasCorrectCondition)
  console.log('✅ For loop present:', hasForLoop)  
  console.log('✅ Break statement present:', hasBreakStatement)
  console.log('✅ Else clause present:', hasElseClause)
  
  if (hasCorrectCondition && hasForLoop && hasBreakStatement && hasElseClause) {
    console.log('\n🎉 SUCCESS: If any simple condition fix is working correctly!')
  } else {
    console.log('\n❌ FAILURE: Some expected elements are missing')
    
    // Show what we're looking for vs what we got
    console.log('\n🔍 Detailed analysis:')
    if (!hasCorrectCondition) {
      console.log('❌ Missing "if testcls == 1:" - check condition parsing')
    }
    if (!hasForLoop) {
      console.log('❌ Missing "for testcls in testClasses:" - check loop generation')
    }
    if (!hasBreakStatement) {
      console.log('❌ Missing "break" - check break insertion')
    }
    if (!hasElseClause) {
      console.log('❌ Missing "else:" - check else clause handling')
    }
  }
  
} catch (error) {
  console.error('❌ Test failed with error:', error)
  console.error('Stack trace:', error.stack)
}
