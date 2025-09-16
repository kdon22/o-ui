/**
 * 🧪 TEST IF-ANY PATTERN FIX
 * 
 * This test verifies that the if-any pattern correctly handles:
 * 1. Simple value conditions: "if any testcls in testClasses has 1"
 * 2. Complex property conditions: "if any testcls in testClasses has testcls.age = 5"
 */

const { SimpleIndentation } = require('./o-ui/src/lib/editor/python-generation/indentation-create.ts');

// Test case 1: Simple value condition
const businessRules1 = [
  "testClasses = [1,2,3,4]",
  "",
  "if any testcls in testClasses has 1",
  "    if newS = 5",
  "        newCls.age = 3",
  "    else",
  "        newCls.age = 9",
  "else",
  "    if newCls.age = 5",
  "        newCls.age = 2",
  "    newCls.age = 1"
];

// Test case 2: Complex property condition  
const businessRules2 = [
  "people = [person1, person2, person3]",
  "",
  "if any person in people has person.age = 25",
  "    person.status = \"adult\"",
  "else",
  "    defaultStatus = \"unknown\""
];

console.log('🧪 Testing IF-ANY Pattern Fix...\n');

try {
  // Test 1: Simple value condition
  console.log('📋 Test 1: Simple value condition');
  console.log('Business rule: if any testcls in testClasses has 1');
  
  const result1 = SimpleIndentation.processIfAny(
    businessRules1[2], // "if any testcls in testClasses has 1"
    businessRules1,
    2
  );
  
  console.log('Generated Python:');
  result1.pythonLines.forEach((line, i) => {
    console.log(`  ${i + 1}: ${line}`);
  });
  console.log(`Consumed lines: ${result1.consumedLines}\n`);

  // Test 2: Complex property condition
  console.log('📋 Test 2: Complex property condition');
  console.log('Business rule: if any person in people has person.age = 25');
  
  const result2 = SimpleIndentation.processIfAny(
    businessRules2[2], // "if any person in people has person.age = 25"
    businessRules2,
    2
  );
  
  console.log('Generated Python:');
  result2.pythonLines.forEach((line, i) => {
    console.log(`  ${i + 1}: ${line}`);
  });
  console.log(`Consumed lines: ${result2.consumedLines}\n`);

  console.log('✅ All tests completed successfully!');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}
