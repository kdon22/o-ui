# Multi-Source GDS Data Combination Strategy

## 🎯 **Purpose**
This document details the strategy for combining unique travel data from multiple Global Distribution Systems (GDS) into a unified Universal Travel Record (UTR) format, where each source contributes distinct booking segments.

## 🏗️ **The Reality**

### **Multi-Booking Scenario**
Different GDS systems contain **unique, non-overlapping** travel bookings:

**Example Travel Itinerary:**
- **Outbound Flight**: Booked on Amadeus (record: "29YCNW")
- **Return Flight**: Booked on Kayak (record: "JUDWWE") 
- **Hotel**: Booked on Sabre (record: "HTL123")
- **Car Rental**: Direct with vendor (record: "CAR456")

### **Source Characteristics**

#### **Amadeus NDC/EDIFACT** 
- **Contains**: Full PNR data for flights booked through Amadeus
- **Data Scope**: Passenger details, flight segments, fare information
- **Integration**: Direct GDS API access
- **Record Format**: Complete travel record with queue information

#### **Kayak/OTA Platforms**
- **Contains**: Flight bookings made through meta-search platforms
- **Data Scope**: Basic flight details, confirmation numbers, pricing
- **Integration**: OTA API or email confirmation parsing
- **Record Format**: Simplified booking confirmation

#### **Sabre GDS**
- **Contains**: Hotel, car, and airline bookings in Sabre system
- **Data Scope**: Comprehensive booking details with vendor information
- **Integration**: Sabre API suite
- **Record Format**: Native Sabre PNR structure

#### **Direct Vendor Bookings**
- **Contains**: Bookings made directly with airlines, hotels, car companies
- **Data Scope**: Confirmation details, basic itinerary information
- **Integration**: Vendor APIs or email parsing
- **Record Format**: Vendor-specific confirmation data

## 🔧 **Data Combination Strategy**

### **1. Multi-Source Data Assembly**

```typescript
interface UTRCombinationStrategy {
  // Associated records identify all sources
  associatedRecords: AssociatedRecord[]
  
  // Data combination approach
  combinationMethod: 'additive' // Each source contributes unique segments
  
  // Source mapping for data types
  sourceContributions: {
    [recordLocator: string]: {
      source: GDSSource
      dataTypes: SegmentType[]     // ['air', 'hotel', 'car', 'misc']
      segments: number[]           // Segment numbers this source provides
    }
  }
}

interface AssociatedRecord {
  recordLocator: string           // "29YCNW", "JUDWWE", etc.
  vendor: string                  // "amadeus", "kayak", "sabre"
  type: string                   // "ndc", "edifact", "direct"
}
```

### **2. Segment Attribution Mapping**

```typescript
interface SegmentAttribution {
  // Each segment knows its source
  segmentNumber: number
  source: {
    system: string               // "amadeus", "kayak", "sabre"
    type: string                // "ndc", "edifact", "ota"
    associatedRecord: string    // Record locator in that system
  }
  
  // Data completeness from this source
  dataCompleteness: {
    basicInfo: boolean          // Flight numbers, dates, airports
    fareInfo: boolean           // Pricing, taxes, fare rules
    passengerInfo: boolean      // Names, seat assignments
    specialServices: boolean    // Meals, baggage, etc.
  }
}
```

### **3. UTR Assembly Process**

```typescript
class UTRAssembler {
  async assembleFromSources(
    associatedRecords: AssociatedRecord[],
    jobContext: JobContext
  ): Promise<UTR> {
    
    const utr = new UTR()
    utr.associatedRecords = associatedRecords
    
    // Fetch data from each source in parallel
    const sourceDataPromises = associatedRecords.map(record => 
      this.fetchFromSource(record)
    )
    
    const sourceDataResults = await Promise.allSettled(sourceDataPromises)
    
    // Combine all segments from all sources
    for (let i = 0; i < sourceDataResults.length; i++) {
      const result = sourceDataResults[i]
      const record = associatedRecords[i]
      
      if (result.status === 'fulfilled') {
        this.addSegmentsToUTR(utr, result.value, record)
      } else {
        console.warn(`Failed to fetch from ${record.vendor}: ${result.reason}`)
      }
    }
    
    // Set passenger info from most complete source
    this.setPassengerInfo(utr, sourceDataResults)
    
    // Set office context and queue information
    this.setOfficeContext(utr, jobContext)
    
    return utr
  }
  
  private addSegmentsToUTR(utr: UTR, sourceData: any, record: AssociatedRecord): void {
    // Add segments with source attribution
    sourceData.segments?.forEach(segment => {
      segment.source = {
        system: record.vendor,
        type: record.type,
        associatedRecord: record.recordLocator
      }
      
      utr.segments.push(segment)
    })
    
    // Add fare information if present
    if (sourceData.fares) {
      sourceData.fares.forEach(fare => {
        fare.source = {
          system: record.vendor,
          type: record.type,
          associatedRecord: record.recordLocator
        }
        utr.fares.push(fare)
      })
    }
  }
}
```

## 🔄 **Assembly Process**

### **Phase 1: Source Discovery**
1. **Record Identification**: Parse job package for associated record locators
2. **Source Mapping**: Map each record locator to its GDS/vendor system
3. **Parallel Fetching**: Request data from all sources simultaneously
4. **Failure Handling**: Continue assembly even if some sources fail

### **Phase 2: Data Integration**
```typescript
interface DataIntegration {
  // Combine segments from all sources
  segmentCombination: {
    method: 'append'              // Add all segments to single array
    sorting: 'chronological'      // Sort by departure date/time
    numbering: 'sequential'       // Renumber segments 1, 2, 3...
  }
  
  // Handle passenger information
  passengerConsolidation: {
    strategy: 'most-complete-source'  // Use fullest passenger data
    fallback: 'merge-available'       // Combine partial data if needed
  }
  
  // Office and agent context
  contextSetting: {
    officeId: 'from-job-context'      // Use job's office ID
    agentInfo: 'from-primary-pnr'     // Agent from main booking
    queueInfo: 'from-gds-source'      // Queue from GDS records
  }
}
```

### **Phase 3: Quality Assurance**
1. **Completeness Check**: Verify all expected segments are present
2. **Consistency Validation**: Ensure passenger names match across sources
3. **Date/Time Verification**: Validate travel sequence makes sense
4. **Source Attribution**: Confirm all segments have proper source tags

## 📊 **Data Quality Assurance**

### **Assembly Validation Rules**
```typescript
interface AssemblyValidationRules {
  // Cross-source consistency checks
  crossSourceValidation: {
    passengerNameConsistency: true    // Names match across all sources
    travelDateSequencing: true        // Logical travel flow
    contactInfoAlignment: true        // Email/phone consistency
  }
  
  // Individual source validation
  sourceValidation: {
    validRecordLocators: true         // Each record exists in its system
    dataCompletenessMinimum: 0.7     // At least 70% of expected fields
    requiredFieldsPresent: true       // Critical fields must exist
  }
  
  // Business logic validation
  businessRules: {
    minimumSegmentCount: 1            // At least one travel segment
    farePositiveValues: true          // No negative fares
    futureTravel: true               // Travel dates in future
  }
}
```

### **Assembly Quality Scoring**
```typescript
interface AssemblyQualityScore {
  sourceContribution: number        // 0-1: How many sources contributed data
  dataCompleteness: number         // 0-1: Percentage of expected fields filled
  crossSourceConsistency: number   // 0-1: How well sources align
  businessLogicCompliance: number  // 0-1: Passes business rule validation
  overallAssemblyScore: number     // Weighted average of above factors
}
```

## 🚨 **Error Handling & Graceful Assembly**

### **Partial Source Failures**
```typescript
interface PartialFailureHandling {
  // Continue assembly with available sources
  continueWithPartialData: {
    minimumSources: 1                 // Need at least 1 successful source
    logMissingData: true             // Document what couldn't be retrieved
    flagForReview: true              // Mark UTR as incomplete
  }
  
  // Source retry strategy
  retryFailedSources: {
    maxRetries: 2
    backoffDelay: '1-second'
    timeoutIncrease: '50-percent'
  }
}
```

### **Data Inconsistency Handling**
```typescript
interface InconsistencyHandling {
  // When passenger names don't match across sources
  nameDiscrepancy: {
    action: 'use-most-complete'       // Use source with fullest name data
    flagForReview: true              // Alert agent to discrepancy  
    logDiscrepancy: true             // Document for investigation
  }
  
  // When travel dates seem inconsistent
  dateInconsistency: {
    action: 'preserve-all'           // Keep all segments even if odd
    addWarningFlag: true             // Flag for agent attention
    suggestReview: true              // Recommend manual validation
  }
}
```

## 🔍 **Monitoring & Performance**

### **Assembly Metrics**
- **Source Success Rates**: Percentage of successful fetches per GDS
- **Assembly Time**: Total time to combine all sources into UTR
- **Data Completeness**: Average completeness score across assemblies
- **Review Queue Size**: UTRs flagged for manual review due to issues

### **Source Performance Tracking**
```typescript
interface SourcePerformanceMetrics {
  responseTime: {
    average: number      // Average response time in milliseconds
    p95: number         // 95th percentile response time
    timeout_rate: number // Percentage of requests that timeout
  }
  
  dataQuality: {
    completeness_score: number      // Average data completeness
    consistency_score: number       // Cross-validation with other sources
    error_rate: number             // Percentage of malformed responses
  }
  
  reliability: {
    uptime_percentage: number       // System availability
    success_rate: number           // Successful request percentage
    retry_rate: number             // How often retries are needed
  }
}
```

### **Continuous Improvement**
- **Pattern Recognition**: Identify common assembly issues
- **Source Optimization**: Improve slow or unreliable sources
- **Validation Rule Refinement**: Adjust rules based on real-world data
- **Performance Tuning**: Optimize parallel fetching and assembly

## 🔗 **Related Documentation**

- [UTR Flow Overview](./01-utr-flow-overview.md)
- [Rule Engine Integration](./03-rule-engine-integration.md)
- [Gold Standard Recommendations](./05-gold-standard-recommendations.md)