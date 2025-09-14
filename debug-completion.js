// Debug script for completion system
// Run this in browser console to test type detection

// Test case from user
const testCode = `
air = ""
num = 4
class Test {
  age = 4
  name = "tom"
  what = false
}

newClass = Test()

if num.
`;

// Test the primitive types inference
const { inferTypeWithConfidence } = require('./src/lib/editor/schemas/types/primitive-types.ts');

console.log('Testing type inference for num = 4:');
const result = inferTypeWithConfidence('num', 'num = 4');
console.log('Result:', result);

// Test the completion provider logic
const { getTypeSpecificCompletions } = require('./src/lib/editor/completion/provider.ts');

console.log('\\nTesting completions for detected type:');
const completions = getTypeSpecificCompletions(result.type);
console.log('Completions found:', completions.length);
console.log('Completions:', completions);
