# UTR Integration for Business Rules - Implementation Complete ✅

## Overview

The UTR (Universal Travel Record) object is now automatically available in **every BUSINESS rule** during debugging and testing. This provides access to real travel data including passengers, segments, pricing, and booking details.

## 🎯 Key Features

### **Automatic UTR Availability**
- **BUSINESS rules**: UTR object automatically loaded and available as `utr` variable
- **UTILITY rules**: No UTR access (performance optimization)
- **GLOBAL_VAR rules**: No UTR access (performance optimization)

### **Rich Travel Data Access**
- **Passengers**: `utr.passengers` - Name, documents, contact info
- **Segments**: `utr.segments` - Flight, hotel, car segments with details
- **Pricing**: `utr.pricing` - Fare breakdowns, taxes, TST information
- **Booking Details**: `utr.pnrHeader` - Record locator, creation date, office context

## 🚀 Usage Examples

### **Basic UTR Access**
```javascript
// Access passenger information
passenger_name = utr.passengers[0].name.displayName
passenger_count = utr.passengers.length

// Access flight segments
first_flight = utr.segments[0]
departure_airport = first_flight.departure.airport
arrival_airport = first_flight.arrival.airport

// Access booking details
record_locator = utr.pnrHeader.recordLocator
booking_office = utr.officeContext.responsibilityOffice
```

### **Business Logic Examples**
```javascript
// Check if passenger has corporate travel
has_corporate = utr.passengers[0].corporateInfo != null

// Validate flight segments
if (utr.segments.length > 0) {
    segment_type = utr.segments[0].type
    if (segment_type == "air") {
        flight_valid = true
    }
}

// Extract contact information
if (utr.passengers[0].contactInfo.length > 0) {
    primary_contact = utr.passengers[0].contactInfo[0].value
    contact_type = utr.passengers[0].contactInfo[0].type
}
```

### **Advanced UTR Operations**
```javascript
// Calculate total fare amount
total_fare = 0
if (utr.pricing && utr.pricing.invoices) {
    for (invoice in utr.pricing.invoices) {
        total_fare = total_fare + invoice.totalAmount.amount
    }
}

// Check for special service requests
special_services = []
for (passenger in utr.passengers) {
    if (passenger.serviceRequests) {
        for (service in passenger.serviceRequests) {
            special_services.push(service.type)
        }
    }
}
```

## 📊 Available UTR Data Structure

### **Mock Data Source**
- **File**: `schemas/utr/normalized/amadeus-utr-full.json`
- **Source**: Real Amadeus PNR data normalized to UTR format
- **Record Locator**: AB4P35
- **Passengers**: 1 (GRAMS/JEAN)
- **Segments**: Multiple air segments with rich operational data

### **Key Data Points**
```json
{
  "pnrHeader": {
    "recordLocator": "AB4P35",
    "creationDate": "2025-08-01",
    "creationOffice": "INDG22407"
  },
  "passengers": [{
    "passengerNumber": 1,
    "name": { "first": "JEAN", "last": "GRAMS", "displayName": "GRAMS/JEAN" },
    "documents": [{ "type": "passport", "birthDate": "1992-07-21" }],
    "contactInfo": [{ "type": "mobile", "value": "16124568569" }]
  }],
  "segments": [
    // Rich flight segment data with operational details
  ],
  "pricing": {
    // TST information, fare breakdowns, taxes
  }
}
```

## 🔧 Implementation Details

### **System Architecture**
1. **Rule Type Detection**: Automatically determines if rule is BUSINESS, UTILITY, or GLOBAL_VAR
2. **UTR Loading**: Amadeus mock data loaded from `schemas/utr/normalized/amadeus-utr-full.json`
3. **Variable Injection**: UTR object added as built-in variable for BUSINESS rules only
4. **Debug Integration**: Full support in both execution engines (standard and bulletproof)

### **Performance Optimization**
- **Lazy Loading**: UTR data only loaded when needed
- **Rule Type Filtering**: Only BUSINESS rules get UTR access
- **Memory Efficient**: Single UTR instance shared across execution

### **Error Handling**
- **Graceful Fallback**: If UTR loading fails, rule execution continues without UTR
- **Console Logging**: Clear feedback about UTR availability and data loading
- **Type Safety**: UTR object properly typed as 'object' in variable system

## 🧪 Testing

### **Quick Test Business Rule**
```javascript
// Test UTR availability
test_utr_available = utr != null
test_record_locator = utr.pnrHeader.recordLocator
test_passenger_count = utr.passengers.length

// Should output:
// test_utr_available = true
// test_record_locator = "AB4P35" 
// test_passenger_count = 1
```

### **Debug Console Output**
When starting a BUSINESS rule debug session, you should see:
```
✅ [UTR] Loaded mock data for bulletproof debug: { recordLocator: 'AB4P35', passengerCount: 1, segmentCount: X }
🌐 [DebugAdapter] UTR data set for rule type: BUSINESS { hasUTR: true, recordLocator: 'AB4P35' }
✅ [Interpreter] UTR object made available to business rule: { passengerCount: 1, segmentCount: X, recordLocator: 'AB4P35' }
```

## 🎯 Next Steps

1. **Real UTR Integration**: Replace mock data with actual vendor.get() calls
2. **Multi-Source UTR**: Support combining data from Amadeus, Sabre, etc.
3. **UTR Helpers**: Add convenience methods like `utr.getTotalFare()`, `utr.getPrimaryContact()`
4. **Schema Validation**: Ensure UTR data matches expected schema
5. **Performance Monitoring**: Track UTR loading and access performance

---

**✅ IMPLEMENTATION COMPLETE**: UTR object is now available in every BUSINESS rule automatically during debugging and testing.