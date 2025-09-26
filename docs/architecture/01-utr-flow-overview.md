# UTR Flow Overview - Complete Data Pipeline

## 🎯 **Purpose**
This document outlines the complete Universal Travel Record (UTR) data flow from GDS systems through the Go orchestrator to Python rule execution, providing a high-level understanding of the entire pipeline.

## 🌊 **The Complete Data Flow**

### **1. Job Initiation**
Jobs can be triggered via two primary methods:

#### **Scheduled Execution** 🕒
- Jobs pulled from queues based on time, office ID, and workflow configuration
- Automated processing of pending travel records
- Batch processing for efficiency

#### **Deep Link Execution** 🔗
- On-demand job execution via web links
- Encoded parameters include:
  - `officeId` - Travel agency office identifier
  - `PNR` - Passenger Name Record
  - `workflowId` - Specific workflow to execute
  - Additional runtime data for dynamic execution

### **2. Multi-Source GDS Data Acquisition**

```
Multiple GDS Systems → Go Orchestrator → Parallel API Calls
├── Amadeus NDC (real-time booking data)
├── Amadeus EDIFACT (traditional PNR data)  
├── Sabre GDS (alternative booking system)
├── Kayak/OTAs (pricing and availability)
└── Direct Connect APIs (airline-specific)
```

**Key Characteristics:**
- **Parallel Processing**: Multiple GDS calls executed simultaneously
- **Source Attribution**: Each data element tagged with its origin system
- **Associated Records**: Cross-references between different GDS record locators

### **3. UTR Normalization & Consolidation**

The Go orchestrator creates a unified UTR object with:

#### **Core Structure**
- **Associated Records**: Links between different GDS systems
- **Passenger Information**: Names, types, frequent flyer data
- **Booking Agent Data**: Agent details, queue information, office context
- **Travel Segments**: Air, hotel, car, miscellaneous segments
- **Fare Information**: Pricing, taxes, fare rules
- **Communications**: Email notifications, itineraries, invoices
- **Change History**: Snapshots of modifications over time

#### **Source Traceability**
Every data element includes source attribution:
```json
{
  "source": {
    "system": "amadeus",
    "type": "ndc",
    "associatedRecord": "29YCNW"
  }
}
```

### **4. Source Code Editor & Rule Engine Integration**

```
Business Code → Schema Translation → Python → Go Orchestrator → Vendor APIs
```

#### **Source Code Translation System**
- **Monaco Editor**: Users write business-friendly code (`if newVal.contains("hello"):`)
- **Schema Translation**: Real-time conversion to Python (`if string_contains(newVal, "hello"):`)
- **Global Helpers**: Python uses helper functions for clean line-by-line debugging
- **Go Integration**: Executes translated Python and handles vendor operations

#### **Cached UTR Rule Processing Pipeline**
1. **Monaco Editor**: User writes business-friendly rule code
2. **Schema Translation**: Real-time Python generation with source mapping
3. **Go resolves workflow/process/rules** from database (gets translated Python)
4. **Go filters rules** based on office node and ruleIgnore settings
5. **Go initializes Python context** with cached UTR object (one-time setup)
6. **Python rules execute sequentially** with UTR flowing in memory between rules
7. **Vendor operations** (`vendor.utr_get`, `vendor.cancel_segment`) trigger Go API calls
8. **Go processes vendor requests** and returns results to Python
9. **Python continues with updated cached UTR** for remaining rules
10. **Go handles final actions** (GDS queueing, database updates) after all rules complete

#### **Performance Benefits of Cached UTR**
- **Eliminates Go ↔ Python overhead** for each rule execution
- **UTR flows in Python memory** between sequential rules  
- **Go only called when vendor operations needed**
- **Significant performance improvement** for multi-rule workflows

#### **Debugging Flow**
- **Rule-Tester**: Executes friendly code but debugs in Python
- **Line Mapping**: Source maps connect friendly code lines to Python lines  
- **Breakpoints**: Set in friendly code, executed in Python with variable mapping
- **Stack Traces**: Python errors mapped back to friendly code locations

### **5. Action Execution & Feedback (Go-Managed)**

Based on Python rule results, the Go orchestrator handles:

> **Infrastructure Note**: The Go orchestrator and Python rule engine execute as containerized workers in the AWS cloud infrastructure described in [/docs/cloud-architecture/](../../../docs/cloud-architecture/). Jobs are queued, prioritized, and auto-scaled based on workload.

#### **Automated Actions (Go Executes)**
- **Data Corrections**: Go applies fixes to PNR data via vendor APIs
- **GDS Write-back**: Go updates records in source systems (Amadeus, Sabre)
- **Vendor Operations**: Go handles bookings, cancellations, modifications

#### **GDS Queue Management (Go Handles)**
- **Agent Assignment**: Go queues UTRs to appropriate agent queues
- **Priority Routing**: Based on rule results (urgent/review/completed)
- **Queue Categories**: Go determines correct Amadeus/Sabre queue categories

#### **Notification System (Go Triggers)**
- **Email Alerts**: Go sends notifications for flagged records
- **Dashboard Updates**: Real-time updates via Go API endpoints
- **Agent Notifications**: Go manages communication to travel agents

## 🔄 **Integration Points**

### **Monaco Editor Integration (Development Environment)**
- **Rule Development**: Visual Python rule creation and testing
- **UTR Debugging**: Step-through rule execution with live UTR data
- **IntelliSense**: Context-aware code completion for UTR structure
- **Variable Inspection**: Real-time examination of UTR data during rule execution
- **Vendor Operation Testing**: Simulate vendor API requests and responses

### **Go-Python Communication Layer**
- **Request/Response Protocol**: Standardized data exchange format
- **Vendor Operation Queueing**: Python requests queued and executed by Go
- **Result Processing**: Vendor results returned to Python for final rule completion
- **Error Handling**: Go manages vendor API failures and retry logic

### **Learning & Optimization (Go-Managed)**
- **Agent Feedback**: Go captures agent actions on rule results
- **Pattern Recognition**: Go identifies common issues and solutions
- **Rule Performance**: Go tracks rule effectiveness and execution time
- **Vendor API Monitoring**: Go monitors vendor API performance and reliability

## 🎯 **Key Benefits**

1. **Unified Data Model**: Single UTR format regardless of source GDS
2. **Source Attribution**: Full traceability of data origins
3. **Real-time Processing**: Immediate rule execution on data changes
4. **Flexible Triggers**: Both scheduled and on-demand execution
5. **Comprehensive Coverage**: Handles all travel record types
6. **Scalable Architecture**: Parallel processing and efficient queuing

## 📊 **Performance Characteristics**

- **Data Acquisition (Go)**: < 2 seconds for parallel GDS calls
- **UTR Assembly (Go)**: < 500ms for standard PNR normalization
- **Rule Execution (Python)**: < 1 second for typical business logic
- **Vendor Operations (Go)**: < 2 seconds for standard API calls
- **GDS Queueing (Go)**: < 500ms for agent queue assignment
- **End-to-End Processing**: < 5 seconds for complete automation cycle

## ⚠️ **Current Implementation Gap (January 2025)**

### **Documented vs. Reality**
- **Documentation**: Complete end-to-end UTR flow with Monaco integration
- **Current State**: UTR schemas exist but are disconnected from rule testing
- **Impact**: Rules are developed and tested without real travel data context

### **Missing Integration Points**
1. **UTR → Rule Tester**: No connection between UTR schemas and rule testing system
2. **Vendor Operations**: `vendor.get()` calls documented but not implemented in testing
3. **Source Attribution**: Rule testing lacks multi-GDS context awareness
4. **Email Controls**: No override system for rule-generated notifications

### **Next Steps for Integration**
- Connect UTR templates to rule tester variable system
- Implement `vendor.get()` integration for real UTR data
- Add source data configuration UI (vendor + locator pairs)
- Build email override controls for testing scenarios

## 🔗 **Related Documentation**

- [Multi-Source Data Normalization](./02-multi-source-normalization.md)
- [Rule Engine Integration](./03-rule-engine-integration.md)
- [Monaco Editor Integration](./04-monaco-editor-integration.md)
- [Gold Standard Recommendations](./05-gold-standard-recommendations.md)
- [Implementation Status](./06-implementation-status.md) - **Current reality and integration gaps**