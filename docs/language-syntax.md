# Business Rule Language Syntax Guide

## 🎯 Overview

This document defines the complete syntax for the business rule language used in our Monaco editor. The language is designed to be **non-coder friendly** while maintaining the power and flexibility needed for complex business logic.

## 📋 Core Design Principles

- **Natural Language Inspired**: Readable by business stakeholders
- **Python-Style Blocks**: Uses colons (`:`) and indentation for clear structure
- **Safety First**: Built-in protections against infinite loops and errors
- **Type Aware**: Intelligent auto-completion and validation

---

## 🔧 Basic Statement Types

### 1. Assignment Statements
```javascript
// Simple assignments
variable = value
customer.name = "John Smith"
age = 25
isEligible = true
totalAmount = 1250.50

// Complex assignments with expressions
discount = customer.isVIP ? 0.20 : 0.10
fullName = customer.firstName + " " + customer.lastName
```

### 2. If/Else Statements (Python-style colons)
```javascript
// Simple if statement
if customer.age > 18:
    eligibleForDiscount = true

// If-else
if customer.age > 18:
    eligibleForDiscount = true
    sendWelcomeEmail = true
else:
    requireGuardian = true
    restrictedAccess = true

// If-elseif-else chain
if customer.age >= 65:
    discount = 0.30
    category = "senior"
elseif customer.age >= 18:
    discount = 0.10
    category = "adult"
elseif customer.age >= 12:
    discount = 0.05
    category = "youth"
else:
    discount = 0.0
    category = "child"

// Nested conditions
if customer.age > 18:
    if customer.isVIP:
        discount = 0.25
    else:
        discount = 0.10
else:
    discount = 0.0
```

### 3. For-In Loops
```javascript
// Simple iteration
for passenger in passengers:
    processPassenger(passenger)

// With nested logic
for passenger in passengers:
    if passenger.age < 18:
        requireGuardian = true
        addSpecialAssistance = true
    processPassenger(passenger)

// With complex conditions
for booking in bookings:
    if booking.hasPassengers:
        for passenger in booking.passengers:
            validateDocuments(passenger)
        finalizeBooking = true
```

### 4. While Loops (with Safety Counter)
```javascript
// Basic while loop with safety limit
while numberCount > 0 | maxloop 10:
    processItem = true
    numberCount = numberCount - 1

// Complex while with multiple conditions
while hasItemsToProcess and errorCount < 3 | maxloop 50:
    item = getNextItem()
    if item.isValid:
        processItem(item)
    else:
        errorCount = errorCount + 1
```

### 5. Switch/When Statements (Natural Language Style)
```javascript
// Natural language switch
switch customer.type is:
    'premium' then discount = 0.20
    'regular' then discount = 0.10
    'basic' then discount = 0.05
    default discount = 0.0

// Multi-line actions
switch booking.status is:
    'confirmed' then:
        sendConfirmation = true
        updateInventory = true
    'cancelled' then:
        refundPayment = true
        releaseInventory = true
    default:
        logUnknownStatus = true
```

---

## 📝 Advanced Features

### Template Strings (Multi-line with Variable Substitution)
```javascript
// Multi-line template with variables
confirmationMessage = """
Dear {customer.name},

Your booking for {booking.destination} on {booking.date} has been confirmed.
Booking Reference: {booking.reference}
Total Amount: ${booking.total}

Thank you for choosing our service!
"""

// Single line templates
subject = "Booking Confirmation - {booking.reference}"
```

### Multi-line Function Calls
```javascript
// Parameters can span multiple lines
result = calculateTotal(
    basePrice=1000,
    taxRate=0.08,
    discountPercent=15,
    customerType="premium"
)

// Complex nested calls
bookingResult = processBooking(
    customer=getCustomer(id=customerId),
    flights=getFlights(
        origin="LAX",
        destination="JFK",
        date=departureDate
    ),
    options=getBookingOptions(
        insurance=true,
        seatSelection=true
    )
)
```

### Range Operations
```javascript
// Numeric ranges
for day in 1..30:
    processDay(day)

// Date ranges  
for date in startDate..endDate:
    checkAvailability(date)

// Conditional ranges
if customer.age in 18..65:
    fullPrice = true
elseif customer.age in 65..120:
    seniorDiscount = true
else:
    childDiscount = true
```

### Error Handling
```javascript
// Try-catch blocks
try:
    paymentResult = processPayment(booking)
    sendConfirmation = true
catch PaymentError:
    sendFailureNotification = true
    logPaymentError = true
catch NetworkError:
    retryPayment = true
finally:
    updateBookingStatus = true
```

---

## 🚀 Built-in Functions and Operators

### Global Functions
```javascript
// Debugging and logging
log.warn("Processing customer: {customer.id}")
log.error("Processing customer: {customer.id}")
// default would be same as console.log


// Pattern matching
regex(pattern="^[A-Z]{2}[0-9]{4}$", text=bookingCode)

// Communication
email(to=customer.email, subject="Confirmation", body=message, from="noreply@me.com")
sms(to=customer.phone, message=shortMessage)


### Conditional Expressions (Ternary)
```javascript
// Simple ternary
discount = customer.isVIP ? 0.20 : 0.10
status = booking.confirmed ? "CONFIRMED" : "PENDING"

// Nested ternary
priority = customer.isVIP ? "HIGH" : 
           customer.isFrequent ? "MEDIUM" : "LOW"
```

####  FUTURE ######
### Data Flow with Pipes
```javascript
// Chain operations
eligibleCustomers = customers
    | filter(age > 18)
    | filter(hasValidEmail)
    | map(customer -> customer.name)
    | sort()

// Complex data processing
report = bookings
    | filter(status == "confirmed")
    | groupBy(destination)
    | map(group -> {
        destination: group.key,
        count: group.values.length,
        revenue: group.values.sum(total)
    })
```


#### FUTURE #####
---

## 📅 Date and Time Literals

### Date/Time Syntax
```javascript
// Specific dates
departureDate = @2024-12-25
checkInTime = @2024-12-25T14:30:00

// Relative dates
today = @today
tomorrow = @tomorrow  
nextWeek = @today + 7.days
nextMonth = @today + 1.month

// Time calculations
bookingWindow = @now + 2.hours
expirationDate = @today + 30.days
```

---

## 💡 Constants and Variables

### Declaration Types
```javascript
// Constants (cannot be changed)
const MAX_PASSENGERS = 9
const COMPANY_NAME = "Travel Corporation"
const TAX_RATE = 0.08

// Readonly (set once, then immutable)
read SESSION_ID = generateSessionId()
read BOOKING_DATE = @today

// Regular variables
customerCount = 0
processingStatus = "pending"
```

---

## ✍️ Comments and Documentation

### Comment Styles
```javascript
// Single line comment
totalAmount = basePrice + tax  // Calculate final amount

/* 
Multi-line comment
for complex business logic explanations
*/

"""
Rule Documentation Block:
Purpose: Calculate customer discounts based on tier and history
Author: Business Team
Last Modified: 2024-01-15
Dependencies: Customer.tier, Customer.bookingHistory
"""
if customer.tier == 'premium':
    discount = 0.25
```

---

## 🏷️ Advanced Business Rule Features

### Rule Annotations
```javascript
@rule("Customer Eligibility Check")
@priority(high)
@effective_date("2024-01-01")
@expires_date("2024-12-31")
@author("Business Team")
if customer.age >= 18 and customer.hasValidId:
    eligibleForBooking = true
```


#### 
### Pattern Matching
```javascript
// Complex pattern matching
when booking matches:
    {type: 'flight', passengers > 5, destination: 'international'} then:
        applyGroupDiscount = true
        requirePassports = true
    {type: 'hotel', nights >= 7, season: 'peak'} then:
        applyWeeklyRate = true
        addPeakSurcharge = true
    {type: 'car', rentalDays > 14} then:
        applyLongTermRate = true
    otherwise:
        applyStandardRate = true
```

---

## 🛡️ Safety Features

### Loop Safety
- All `while` loops must include `| maxloop N` to prevent infinite loops
- Default maxloop is 1000 if not specified
- System will automatically terminate and log error if limit exceeded

### Type Safety
- Variables maintain type consistency
- Automatic type inference from assignments
- Runtime type checking for critical operations

### Error Prevention
- Division by zero protection
- Null/undefined access protection  
- Array bounds checking
- Required field validation

---

## 📊 Implementation Priority

### Phase 1: Core Features (Must Have)
- ✅ Assignment statements
- ✅ If/elseif/else with colons
- ✅ For-in loops
- 🆕 While loops with maxloop
- 🆕 Template strings with """
- 🆕 Switch/when statements
- 🆕 Comments (// and /* */)

### Phase 2: Enhanced Productivity (Should Have)
- 🆕 Multi-line function calls
- 🆕 Assert/validate statements
- 🆕 Range operations (1..10)
- 🆕 Ternary expressions (? :)
- 🆕 Try/catch error handling
- 🆕 Constants (const/readonly)
- 🆕 Date/time literals (@today, @now)

### Phase 3: Advanced Features (Nice to Have)
- 🆕 Pipe operations for data flow
- 🆕 Pattern matching
- 🆕 Business rule annotations
- 🆕 Built-in formatters and validators
- 🆕 Conditional compilation

---

## 🎯 Examples of Complete Business Rules

### Customer Eligibility Rule
```javascript
@rule("Premium Customer Eligibility")
@priority(high)

// Constants
const MIN_AGE = 18
const PREMIUM_THRESHOLD = 10000

// Main logic
if customer.age >= MIN_AGE and customer.hasValidId:
    if customer.totalBookingValue >= PREMIUM_THRESHOLD:
        customer.tier = "premium"
        discount = 0.25
        
        // Send personalized message
        message = """
        Dear {customer.name},
        
        Congratulations! You've been upgraded to Premium status.
        Your new discount rate is 25%.
        """
        
        email(to=customer.email, subject="Premium Upgrade", body=message)
    elseif customer.totalBookingValue >= 5000:
        customer.tier = "gold"
        discount = 0.15
    elseif customer.totalBookingValue >= 1000:
        customer.tier = "silver"
        discount = 0.12
    else:
        customer.tier = "regular"
        discount = 0.10
else:
    customer.tier = "restricted"
    discount = 0.0
    requireAdditionalVerification = true
```

### Booking Processing Rule
```javascript
@rule("Booking Validation and Processing")

// Validate booking
assert booking.passengers.count <= MAX_PASSENGERS
assert booking.departureDate > @today
validate booking.totalAmount > 0

// Process each passenger
for passenger in booking.passengers:
    if passenger.age >= 65:
        seatType = "senior"
        priorityBoarding = true
    elseif passenger.age >= 18:
        seatType = "adult"
    elseif passenger.age >= 12:
        seatType = "minor"
        requireGuardian = true
    elseif passenger.age >= 3:
        seatType = "child"
        requireGuardian = true
    else:
        seatType = "infant"
        requireGuardian = true
        requireSpecialSeating = true
    
    // Generate boarding pass
    boardingPass = """
    Passenger: {passenger.name}
    Flight: {booking.flightNumber}
    Seat: {passenger.seat}
    Gate: {booking.gate}
    """

// Final processing
try:
    paymentResult = processPayment(booking)
    booking.status = "confirmed"
    sendConfirmation = true
catch PaymentError:
    booking.status = "payment_failed"
    sendPaymentFailureNotice = true
finally:
    updateBookingRecord = true
    log(level="info", message="Booking processed: {booking.id}")
```

---

This syntax guide provides a comprehensive foundation for building powerful, readable business rules while maintaining safety and ease of use for non-technical users.
