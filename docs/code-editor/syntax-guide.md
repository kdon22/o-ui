# Business Rules Language – Supported Syntax (Current)

This guide reflects what the editor supports now after cleanup. It is intentionally minimal and business-focused.

## 1) Core Principles
- Simple, readable statements for non‑coders
- Schema-driven methods/operators (no hardcoded string operators)
- Equality/assignment uses a single `=` (no `==`, `!=`)
- No ternary (`? :`), no `when`/`unless`/`then`, no `&&`/`||`, no `->` return arrow

## 2) Keywords
- Control flow: `if`, `elseif`, `else`, `while`, `for`, `switch`, `case`, `default`, `try`, `catch`, `finally`
- Collections: `any`, `all`, `in`
- Declarations: `class`, `enum`, `interface`

Notes:
- Logical words are `and`, `or`, `not` (uppercase `And`/`Or` are also recognized for readability).
- Everything else (operators like BeginsWith, Contains, etc.) comes from schema-defined methods, not language keywords.

## 3) Operators
- Assignment / equality: `=`
- Relational: `<`, `<=`, `>`, `>=`
- Logical: `and`, `or`, `not`
- Arithmetic: `+`, `-`, `*`, `/`, `%`

Not supported: `==`, `!=`, `? :`, `&&`, `||`.

## 4) Indentation & Blocks
- Use indentation to define blocks (2 spaces)
- Typical structure:

```
if condition
  # statements
elseif otherCondition
  # statements
else
  # statements
```

Applies similarly to `while`, `for`, and `switch` blocks.

## 5) Variables & Types
- Variables: camelCase (e.g., `customerName`, `totalAmount`)
- Common types used in docs and schemas: `string`, `number`, `boolean`, `array`, `object` (plus your business classes / enums)
- Examples:

```
customerName = "John"
amount = 120.5
isActive = true
items = []
```

## 6) Control Flow Examples
- If / Elseif / Else
```
if customerName = "ABC"
  message = "A"
elseif customerName = "DEF"
  message = "B"
else
  message = "Other"
```

- While
```
while isActive
  count = count + 1
```

- For (over arrays or collections)
```
for passenger in booking.passengers
  if passenger.age >= 65
    passenger.requiresAssistance = true
```

- Switch
```
switch seatClass
  case "Economy"
    fee = 0
  case "Business"
    fee = 50
  default
    fee = 0
```

## 7) Classes, Enums & Interfaces
- You can declare simple business objects, enums, and interfaces; properties are listed and used directly in rules.

### Classes & Enums:
```
enum Priority {
  High
  Medium
  Low
}

class Booking {
  totalAmount = number
  passengers = <Passenger>
}

class Passenger {
  name = string
  age = number
  requiresAssistance = boolean
}
```

### Interfaces (Return Types):
```
interface HttpResponse {
  statusCode = number
  error = string | null
  response = object
}

interface DateResult {
  date = Date
  timestamp = number
  formatted = string
}
```

### Usage in Rules:
```
# Using classes in loops
for passenger in booking.passengers
  if passenger.age >= 18
    passenger.requiresAssistance = false

# Using interface return types
apiResult = http.get(url: "https://api.example.com/data")
if apiResult.statusCode = 200
  data = apiResult.response
  
dateInfo = date.parse(value: "2024-01-15")
timestamp = dateInfo.timestamp
```

## 8) Schema‑Driven Methods & Return Types
- Methods and helpers (like string contains, conversions, date helpers) come from your schemas/modules. They are not language keywords.
- Many methods return interface types that provide IntelliSense for their properties.

### Method Examples:
```
# String methods
if customerName.contains("John")
  message = "Found"

textValue = numberValue.toString
countValue = items.count

# HTTP methods (return HttpResponse interface)
response = http.get(url: "https://api.example.com/users")
if response.statusCode = 200
  users = response.response
  
# Array methods (return typed results)
firstUser = users.first
lastUser = users.last
userCount = users.length

# Date methods (return DateResult interface)  
parsedDate = date.parse(value: "2024-01-15")
timestamp = parsedDate.timestamp
formatted = parsedDate.formatted
```

## 9) Embedded SQL Queries & Results
The editor supports SELECT queries embedded in assignments. Completion covers tables and columns from your configured data tables.

- Syntax (supported today):
```
rows = SELECT column1, column2 FROM tableName WHERE column1 = "X" ORDER BY column2
```

- Result type: an array of records (objects). Use like any list.
  - Length: `rows.count`
  - Iteration:
```
for row in rows
  if row.status = "Active"
    activeCount = activeCount + 1
```
  - Direct access:
```
firstName = rows[0].name
```

- Sections recognized for completions: SELECT, FROM, WHERE, ORDER BY, GROUP BY.
- Operators available in SQL context (completion): `=`, `!=`, `<>`, `>`, `<`, `>=`, `<=`, `LIKE`, `IN`, `NOT IN`, `IS NULL`, `IS NOT NULL`.

Note: Only SELECT is wired for completions at this time; other statements may be added later.

## 10) Common Patterns (Quick Reference)
- **Equality / assignment**: `x = 5`, `if name = "A"`
- **Relational**: `if totalAmount >= 1000`
- **Logical**: `if isVip and hasCredit`
- **Collections**: `if any booking.passengers as passenger` (or iterate with `for`)
- **Interface usage**: `result = http.get(url)` → `result.statusCode`, `result.response`
- **Method chaining**: `customerName.contains("text")`, `items.length`, `date.parse(value).timestamp`
- **SQL integration**: `rows = SELECT * FROM table` → `for row in rows` → `row.columnName`

This document is the single source for the supported syntax in the editor after the cleanup. Keep domain logic readable, use schemas for methods/operators, leverage interfaces for return types, and rely on simple, explicit control flow.
