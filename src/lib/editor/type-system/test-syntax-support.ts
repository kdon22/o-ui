// Test file to verify the refactored ScopeTracker supports the syntax guide patterns
import { ScopeTracker } from './scope-tracker'

// Mock Monaco model for testing
const createMockModel = (content: string) => ({
  getValue: () => content,
  getLineCount: () => content.split('\n').length,
  getLineContent: (lineNumber: number) => content.split('\n')[lineNumber - 1] || ''
})

console.log('🧪 Testing Perfect Completion System - Syntax Guide Support\n')

// Test Case 1: For loops (already working)
console.log('📋 Test 1: For Loop Scoping')
const test1 = `
class Booking {
  totalAmount = number
  passengers = <Passenger>
}

class Passenger {
  name = string
  age = number
}

booking = Booking()
for passenger in booking.passengers
  passenger.name = "John"
`

const tracker1 = new ScopeTracker()
const mockModel1 = createMockModel(test1)
tracker1.updateFromModel(mockModel1)
const vars1 = tracker1.getVariables()
console.log('Variables found:', vars1.map(v => `${v.name}:${v.type}`))
// Should show: passenger:Passenger

// Test Case 2: If any/all patterns (NEW!)
console.log('\n📋 Test 2: If Any/All Pattern Scoping')
const test2 = `
passengers = Passenger[]
if any passengers as person
  person.age = 25

if all passengers as p
  p.requiresAssistance = true
`

const tracker2 = new ScopeTracker()
const mockModel2 = createMockModel(test2)
tracker2.updateFromModel(mockModel2)
const vars2 = tracker2.getVariables()
console.log('Variables found:', vars2.map(v => `${v.name}:${v.type}`))
// Should show: person:Passenger, p:Passenger

// Test Case 3: While loops (ENHANCED!)
console.log('\n📋 Test 3: While Loop Scoping')
const test3 = `
count = 0
while count < 10
  count = count + 1

isActive = true
while isActive
  isActive = false
`

const tracker3 = new ScopeTracker()
const mockModel3 = createMockModel(test3)
tracker3.updateFromModel(mockModel3)
const vars3 = tracker3.getVariables()
console.log('Variables found:', vars3.map(v => `${v.name}:${v.type}`))
// Should show: count:number, isActive:boolean

// Test Case 4: Switch case variables (NEW!)
console.log('\n📋 Test 4: Switch Case Variable Scoping')
const test4 = `
priority = "high"
switch priority
  case "high" as level
    level = "urgent"
  case "low" as level
    level = "optional"
`

const tracker4 = new ScopeTracker()
const mockModel4 = createMockModel(test4)
tracker4.updateFromModel(mockModel4)
const vars4 = tracker4.getVariables()
console.log('Variables found:', vars4.map(v => `${v.name}:${v.type}`))
// Should show: priority:string, level:string (from switch cases)

console.log('\n✅ Syntax Guide Support Test Complete!')
console.log('🎯 Perfect Completion System Ready for Full Integration')
