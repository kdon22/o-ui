# Rule Engine Integration Architecture

## 🎯 **Purpose**
This document outlines the Universal Rule Execution System that processes business rules against UTR data. The execution flow is identical whether triggered from scheduled jobs, API calls, or queue processing.

## 🏗️ **Universal Rule Execution Architecture**

### **Execution Trigger Points**
The rule engine responds to three trigger types with **identical execution logic**:

1. **Scheduled Job**: Time-based execution from job scheduler
2. **API Call**: On-demand execution via REST endpoint  
3. **Queue Processing**: Batch processing from message queues

### **Job Package Structure**
```typescript
interface JobPackage {
  // Universal job identification
  jobId: string
  triggerType: 'scheduled' | 'api' | 'queue'
  
  // UTR context
  utr: UTR
  officeId: string
  
  // Execution scope
  workflowId?: string        // Execute entire workflow
  processId?: string         // Execute single process
  ruleIds?: string[]         // Execute specific rules
  
  // Execution context
  priority: 'high' | 'normal' | 'low'
  maxExecutionTime: number   // Timeout in seconds
  retryPolicy: RetryPolicy
}
```

### **Architecture Overview: Go ↔ Python Integration**

```
┌─────────────────────────────────────────────────────────────────┐
│                        GO ORCHESTRATOR                          │
├─────────────────────────────────────────────────────────────────┤
│ • Receives jobs (scheduled/API/queue)                          │
│ • Assembles UTR from multiple vendor sources                   │
│ • Resolves workflow/process/rules from database               │
│ • Manages ALL vendor API communications                       │
│ • Handles GDS queueing and final actions                     │
└─────────────────┬───────────────────────────┬─────────────────┘
                  │                           │
                  ▼                           ▼
        ┌─────────────────┐         ┌─────────────────┐
        │   PYTHON RULE   │         │  VENDOR APIs    │
        │     ENGINE      │         │ (Amadeus, Sabre│
        │                 │         │  Kayak, etc.)   │
        │ • Rule logic    │         │                 │
        │ • Business      │         │ • Flight data   │
        │   validation    │         │ • Hotel booking │
        │ • Requests      │         │ • Car rental    │
        │   vendor ops    │         │ • Fare rules    │
        └─────────────────┘         └─────────────────┘
```

### **Go Backend Orchestrator**
```go
type JobOrchestrator struct {
    db                *Database
    vendorClients     map[string]VendorClient
    pythonRuleEngine  *PythonRuleEngine
    gdsQueueManager   *GDSQueueManager
}

func (o *JobOrchestrator) ExecuteJobPackage(jobPackage JobPackage) (*ExecutionResult, error) {
    // 1. Resolve workflow/process/rules from database
    executionPlan, err := o.resolveExecutionPlan(jobPackage)
    if err != nil {
        return nil, err
    }
    
    // 2. Filter rules based on office node and ruleIgnore
    filteredRules, err := o.filterRules(executionPlan.Rules, jobPackage.OfficeID)
    if err != nil {
        return nil, err
    }
    
    // 3. Initialize Python rule executor with cached UTR
    pythonExecutor := NewPythonRuleExecutor()
    
    // Send initial UTR to Python memory (cached for entire rule execution)
    executionContext := &PythonExecutionContext{
        UTR:           jobPackage.UTR,
        OfficeID:      jobPackage.OfficeID,
        Context:       jobPackage.Context,
        VendorGateway: o.vendorGateway, // Only called for vendor.* operations
    }
    
    ruleResults := make([]*RuleResult, 0)
    
    for _, ruleGroup := range o.groupRulesByRunOrder(filteredRules) {
        if ruleGroup.RunOrder == 0 {
            // Parallel execution (UTR snapshots passed to each rule)
            results := pythonExecutor.ExecuteRulesParallel(ruleGroup.Rules, executionContext)
            ruleResults = append(ruleResults, results...)
        } else {
            // Sequential execution (UTR flows from rule to rule in Python memory)
            for _, rule := range ruleGroup.Rules {
                result := pythonExecutor.ExecuteRule(rule, executionContext)
                ruleResults = append(ruleResults, result)
                
                // UTR is now updated in Python memory for next rule
                // Go only involved if vendor operations were requested
                
                if result.Status == "critical_failure" {
                    break // Stop on critical failure
                }
            }
        }
    }
    
    // 4. Handle GDS queueing if needed
    if o.hasGDSSource(jobPackage.UTR) {
        queueResult, err := o.gdsQueueManager.QueueToAgent(jobPackage.UTR, ruleResults)
        if err != nil {
            log.Printf("GDS queueing failed: %v", err)
        }
    }
    
    return &ExecutionResult{
        JobID:       jobPackage.JobID,
        RuleResults: ruleResults,
        Success:     o.allRulesSuccessful(ruleResults),
    }, nil
}

func (o *JobOrchestrator) executeRule(rule Rule, utr UTR, officeID string) *RuleResult {
    // Call Python rule engine
    pythonRequest := PythonRuleRequest{
        RuleCode: rule.Code,
        UTR:      utr,
        OfficeID: officeID,
        Context:  o.buildRuleContext(rule, utr, officeID),
    }
    
    pythonResult, err := o.pythonRuleEngine.ExecuteRule(pythonRequest)
    if err != nil {
        return &RuleResult{
            RuleID: rule.ID,
            Status: "error",
            Error:  err.Error(),
        }
    }
    
    // Handle vendor operations requested by Python rule
    if len(pythonResult.VendorOperations) > 0 {
        vendorResults := make([]*VendorResult, 0)
        
        for _, vendorOp := range pythonResult.VendorOperations {
            vendorResult := o.executeVendorOperation(vendorOp, utr, officeID)
            vendorResults = append(vendorResults, vendorResult)
        }
        
        // Send vendor results back to Python rule for final processing
        finalResult, err := o.pythonRuleEngine.ProcessVendorResults(pythonResult.RuleID, vendorResults)
        if err != nil {
            log.Printf("Failed to process vendor results: %v", err)
        }
        
        return finalResult
    }
    
    return pythonResult
}

func (o *JobOrchestrator) executeVendorOperation(vendorOp VendorOperation, utr UTR, officeID string) *VendorResult {
    client, exists := o.vendorClients[vendorOp.TargetSystem]
    if !exists {
        return &VendorResult{
            OperationID: vendorOp.ID,
            Status:      "error",
            Error:       fmt.Sprintf("No client for vendor: %s", vendorOp.TargetSystem),
        }
    }
    
    switch vendorOp.Type {
    case "gds_lookup":
        return client.LookupFlightDetails(vendorOp.RecordLocator, officeID)
    case "gds_update":
        return client.UpdatePNR(vendorOp.RecordLocator, vendorOp.UpdateData, officeID)
    case "fare_lookup":
        return client.GetFareRules(vendorOp.Segments, officeID)
    case "vendor_booking":
        return client.CreateBooking(vendorOp.BookingData, utr)
    default:
        return &VendorResult{
            OperationID: vendorOp.ID,
            Status:      "error",
            Error:       fmt.Sprintf("Unknown operation type: %s", vendorOp.Type),
        }
    }
}
```

## 🔄 **Rule Execution Pipeline**

### **Python Rule Executor (UTR Cached in Memory)**
```python
class PythonRuleExecutor:
    """Python rule executor with cached UTR - Go only called for vendor.* operations"""
    
    def __init__(self):
        self.rule_compiler = RuleCompiler()
        self.validation_engine = ValidationEngine()
        self.cached_utr = None      # UTR flows between rules in Python memory
        self.vendor_gateway = None  # Only used when vendor.* operations called
    
    def initialize_context(self, execution_context: PythonExecutionContext):
        """Initialize with UTR cached in Python memory"""
        self.cached_utr = execution_context.utr
        self.office_id = execution_context.office_id
        self.context = execution_context.context
        self.vendor_gateway = execution_context.vendor_gateway
    
    def execute_rule(self, rule: Rule) -> PythonRuleResult:
        """Execute rule with cached UTR - vendor.* operations trigger Go calls"""
        
        try:
            # Compile rule source code to Python
            compiled_rule = self.rule_compiler.compile(rule.source_code)
            
            # Execute rule with cached UTR (flows in Python memory)
            rule_result = compiled_rule.execute(
                utr=self.cached_utr,           # Cached UTR object
                office_id=self.office_id,
                context=self.context,
                vendor=VendorProxy(self.vendor_gateway)  # Calls Go only for vendor.*
            )
            
            # Apply any UTR modifications to cached object
            if hasattr(rule_result, 'utr_updates'):
                self.apply_utr_updates(rule_result.utr_updates)
            
            return PythonRuleResult(
                rule_id=rule.id,
                status="success",
                vendor_operations_requested=rule_result.vendor_operations or [],
                utr_modified=hasattr(rule_result, 'utr_updates'),
                business_data=rule_result.business_data or {}
            )
            
        except Exception as e:
            return PythonRuleResult(
                rule_id=rule.id,
                status="error",
                error=str(e),
                vendor_operations_requested=[],
                utr_modified=False
            )
    
    def apply_utr_updates(self, updates: List[UTRUpdate]):
        """Apply modifications to cached UTR object"""
        for update in updates:
            if update.operation == "add_segment":
                self.cached_utr.segments.append(update.data)
            elif update.operation == "update_passenger":
                passenger = self.cached_utr.passengers[update.index]
                passenger.update(update.data)
            # ... additional update operations
    
    def get_current_utr(self) -> UTR:
        """Return current state of cached UTR"""
        return self.cached_utr
    
    def process_vendor_results(self, rule_id: str, vendor_results: List[VendorResult]) -> RuleResult:
        """Process vendor operation results and generate final rule result"""
        
        # Analyze vendor results
        successful_ops = [r for r in vendor_results if r.status == "success"]
        failed_ops = [r for r in vendor_results if r.status != "success"]
        
        # Determine final rule status
        if failed_ops:
            final_status = "partial_success" if successful_ops else "failed"
        else:
            final_status = "success"
        
        return RuleResult(
            rule_id=rule_id,
            status=final_status,
            vendor_operations_completed=len(successful_ops),
            vendor_operations_failed=len(failed_ops),
            vendor_results=vendor_results
        )
```

### **Go ↔ Python Communication Flow**

```
1. Go receives job (scheduled/API/queue)
   ↓
2. Go assembles UTR from multiple vendor sources
   ↓ 
3. Go resolves workflow/process/rules from database
   ↓
4. Go filters rules based on office node and ruleIgnore
   ↓
5. Go calls Python rule engine with UTR + rule context
   ↓
6. Python rule executes business logic
   ↓
7. Python rule REQUESTS vendor operations (doesn't execute)
   ↓ 
8. Go receives vendor operation requests from Python
   ↓
9. Go executes vendor operations via API clients
   ↓
10. Go sends vendor results back to Python rule
    ↓
11. Python rule processes vendor results and returns final result
    ↓
12. Go handles GDS queueing and completes job
```

## 🔧 **Business Rule Types & Patterns**

### **Validation Rules**
Rules that check UTR data integrity and business compliance:
```python
class UTRValidationRule(BusinessRule):
    async def execute(self, utr: UTR, office_id: str) -> RuleResult:
        """Validate UTR data for completeness and consistency"""
        issues = []
        
        # Validate passenger information
        issues.extend(self.validate_passengers(utr.passengers))
        
        # Validate travel sequence
        issues.extend(self.validate_travel_sequence(utr.segments))
        
        # Validate fare information
        issues.extend(self.validate_fares(utr.fares))
        
        return RuleResult(
            rule_type='validation',
            issues=issues,
            requires_vendor_calls=False,
            action_required='review' if issues else 'none'
        )
```

### **Data Enhancement Rules**
Rules that analyze UTR and REQUEST additional data from Go:
```python
class DataEnhancementRule(BusinessRule):
    def execute(self, utr: UTR, office_id: str, context: dict) -> PythonRuleResult:
        """Analyze UTR and request missing data from Go orchestrator"""
        
        vendor_operations_requested = []
        
        # Check for missing flight details
        if self.needs_flight_details(utr):
            vendor_operations_requested.append({
                'operation_id': f'flight_lookup_{utr.segments[0].segmentNumber}',
                'type': 'gds_lookup',
                'target_system': 'amadeus',
                'record_locator': self.get_record_locator(utr),
                'operation_data': {
                    'lookup_type': 'flight_details',
                    'segments': [s.segmentNumber for s in utr.segments if s.type == 'air']
                }
            })
        
        # Check for missing fare rules
        if self.needs_fare_rules(utr):
            vendor_operations_requested.append({
                'operation_id': f'fare_rules_{office_id}',
                'type': 'fare_lookup',
                'target_system': 'sabre',
                'operation_data': {
                    'segments': self.get_air_segments_data(utr),
                    'fare_basis': self.extract_fare_basis(utr)
                }
            })
        
        return PythonRuleResult(
            rule_id=self.rule_id,
            status='needs_vendor_data',
            vendor_operations_requested=vendor_operations_requested,
            message='Requesting additional flight and fare data'
        )
```

### **VendorProxy - Go Integration with UTR Synchronization**

The `VendorProxy` ensures Go is only called when `vendor.*` operations are used AND maintains data consistency by updating the cached UTR when vendor operations modify data:

```python
class VendorProxy:
    """Proxy that calls Go backend only when vendor operations are needed"""
    
    def __init__(self, vendor_gateway):
        self.vendor_gateway = vendor_gateway
        
    def utr_get(self, reference: str, source_object: dict) -> UTR:
        """Load UTR from vendor system (calls Go)"""
        return self.vendor_gateway.call_vendor_operation("utr_get", {
            "reference": reference,
            "source_object": source_object
        })
    
    def cancel_segment(self, utr: UTR, segment_id: str, reason: str) -> VendorResult:
        """Cancel segment via vendor system (calls Go) and updates cached UTR"""  
        result = self.vendor_gateway.call_vendor_operation("cancel_segment", {
            "utr": utr,
            "segment_id": segment_id,
            "reason": reason
        })
        
        # Update cached UTR with vendor changes
        if result.success and result.updated_utr:
            self._update_cached_utr(result.updated_utr)
            
        return result
    
    def utr_redisplay(self, utr: UTR, format_options: dict) -> dict:
        """Redisplay UTR with formatting (calls Go)"""
        return self.vendor_gateway.call_vendor_operation("utr_redisplay", {
            "utr": utr,
            "format_options": format_options
        })

# Example: Sequential Rules with UTR Updates
def rule_1_cancel_segment(utr, office_id, context, vendor):
    """Rule 1: Cancel problematic segment and update cached UTR"""
    
    # Work with cached UTR
    problematic_segments = [s for s in utr.segments if s.status == "waitlisted"]
    
    if problematic_segments:
        # This calls Go AND updates the cached UTR
        result = vendor.cancel_segment(utr, problematic_segments[0].id, "waitlist_policy")
        return {"status": "segment_cancelled", "cancelled_segment": problematic_segments[0].id}
    
    return {"status": "no_action_needed"}

def rule_2_validate_remaining(utr, office_id, context, vendor):
    """Rule 2: Validate remaining segments (sees updated UTR from Rule 1)"""
    
    # UTR now reflects cancellation from Rule 1
    active_segments = [s for s in utr.segments if s.status == "confirmed"]
    cancelled_segments = [s for s in utr.segments if s.status == "cancelled"]
    
    return {
        "status": "validation_complete",
        "active_count": len(active_segments),
        "cancelled_count": len(cancelled_segments)  # This includes Rule 1's cancellation
    }
```

### **UTR Data Consistency & Synchronization**

Critical: When vendor operations modify UTR data, the cached UTR object is automatically updated so subsequent rules see the changes:

#### **Vendor Operations That Update UTR**
```python
# Operations that modify UTR and update cached object:
vendor.cancel_segment(utr, segment_id, reason)     # Updates segment status
vendor.update_passenger(utr, passenger_data)       # Updates passenger info  
vendor.add_segment(utr, new_segment_data)          # Adds new segment
vendor.update_pnr(utr, pnr_updates)               # Updates PNR data
vendor.apply_fare_change(utr, fare_data)          # Updates fare information

# Operations that only read data (no UTR updates):
vendor.utr_get(reference, source)                 # Returns fresh UTR copy
vendor.utr_redisplay(utr, format_options)         # Returns formatted display
vendor.get_fare_rules(segments, office_id)        # Returns fare rule data
```

#### **Sequential Rule Execution with Data Consistency**

```python
# WORKFLOW: Rule 1 → Rule 2 → Rule 3 (Sequential execution)

def rule_1_process_booking(utr, office_id, context, vendor):
    """Modifies UTR data via vendor operations"""
    
    # Original UTR state
    original_segment_count = len(utr.segments)
    
    # Vendor operation that modifies UTR 
    if needs_additional_segment(utr):
        result = vendor.add_segment(utr, build_segment_data())
        # UTR is now updated with new segment
    
    return {"segments_added": len(utr.segments) - original_segment_count}

def rule_2_validate_segments(utr, office_id, context, vendor):
    """Sees updated UTR from Rule 1"""
    
    # UTR now includes segment added by Rule 1
    all_segments = utr.segments  # Includes new segment from Rule 1
    invalid_segments = [s for s in all_segments if not validate_segment(s)]
    
    if invalid_segments:
        # Cancel invalid segments (updates UTR again)
        for segment in invalid_segments:
            vendor.cancel_segment(utr, segment.id, "validation_failed")
    
    return {"validated": True, "cancelled_invalid": len(invalid_segments)}

def rule_3_final_processing(utr, office_id, context, vendor):
    """Sees all UTR changes from Rules 1 & 2"""
    
    # UTR reflects all previous modifications:
    # - Segments added by Rule 1
    # - Invalid segments cancelled by Rule 2
    final_segments = [s for s in utr.segments if s.status == "confirmed"]
    
    return {"final_segment_count": len(final_segments)}
```

#### **Data Flow Summary**
```
Rule 1: UTR (original) → vendor.add_segment() → UTR (updated) 
                                                      ↓
Rule 2: UTR (with new segment) → vendor.cancel_segment() → UTR (updated)
                                                                ↓  
Rule 3: UTR (final state with all changes) → business logic → Result
```

**Key Benefit**: Each rule always works with the **current, synchronized UTR state** including all vendor modifications from previous rules.

    def process_vendor_results(self, vendor_results: List[VendorResult]) -> BusinessRuleResult:
        """Process vendor data returned by Go and generate final result"""
        
        enhanced_data = {}
        
        for vendor_result in vendor_results:
            if vendor_result.operation_id.startswith('flight_lookup'):
                enhanced_data['flight_details'] = vendor_result.data
            elif vendor_result.operation_id.startswith('fare_rules'):
                enhanced_data['fare_rules'] = vendor_result.data
        
        return BusinessRuleResult(
            success=True,
            data_enhancements=enhanced_data,
            action_required='update_utr' if enhanced_data else 'none'
        )
```

### **Correction Rules**
Rules that identify issues and REQUEST corrections through Go:
```python
class AutoCorrectionRule(BusinessRule):
    def execute(self, utr: UTR, office_id: str, context: dict) -> PythonRuleResult:
        """Identify corrections needed and request Go to apply them"""
        
        corrections_needed = []
        vendor_operations_requested = []
        
        # Identify passenger type corrections
        for passenger in utr.passengers:
            if not passenger.passengerType and passenger.birthDate:
                corrections_needed.append({
                    'field': f'passengers[{passenger.passengerNumber-1}].passengerType',
                    'old_value': None,
                    'new_value': self.infer_passenger_type(passenger.birthDate),
                    'confidence': 0.95,
                    'method': 'birth_date_inference'
                })
        
        # Request Go to apply corrections via GDS if needed
        if corrections_needed and self.has_gds_source(utr):
            vendor_operations_requested.append({
                'operation_id': f'gds_correction_{office_id}',
                'type': 'gds_update',
                'target_system': self.get_primary_gds_system(utr),
                'record_locator': self.get_record_locator(utr),
                'operation_data': {
                    'corrections': corrections_needed,
                    'update_reason': 'automated_passenger_type_correction'
                }
            })
        
        return PythonRuleResult(
            rule_id=self.rule_id,
            status='needs_corrections' if vendor_operations_requested else 'completed',
            vendor_operations_requested=vendor_operations_requested,
            corrections_identified=corrections_needed
        )
    
    def process_vendor_results(self, vendor_results: List[VendorResult]) -> BusinessRuleResult:
        """Process correction results from Go"""
        
        successful_corrections = []
        failed_corrections = []
        
        for vendor_result in vendor_results:
            if vendor_result.status == 'success':
                successful_corrections.extend(vendor_result.data.get('applied_corrections', []))
            else:
                failed_corrections.extend(vendor_result.data.get('failed_corrections', []))
        
        return BusinessRuleResult(
            success=len(failed_corrections) == 0,
            corrections_applied=successful_corrections,
            corrections_failed=failed_corrections,
            action_required='review' if failed_corrections else 'none'
        )
```

## 🎮 **Universal Execution Examples**

### **Scheduled Job Execution**
```python
# Scheduled job package
scheduled_package = JobPackage(
    jobId="sched_001",
    triggerType="scheduled",
    workflowId="daily_pnr_audit",
    utr=assembled_utr,
    officeId="YVRC42100",
    priority="normal"
)

result = await rule_engine.execute_job_package(scheduled_package)
```

### **API Call Execution**
```python
# API-triggered execution
api_package = JobPackage(
    jobId="api_001", 
    triggerType="api",
    processId="fare_validation",
    utr=request_utr,
    officeId=request.office_id,
    priority="high"
)

result = await rule_engine.execute_job_package(api_package)
```

### **Queue Processing Execution**
```python
# Queue-based execution
queue_package = JobPackage(
    jobId="queue_001",
    triggerType="queue", 
    ruleIds=["rule_123", "rule_456"],
    utr=queued_utr,
    officeId=queue_context.office_id,
    priority="normal"
)

result = await rule_engine.execute_job_package(queue_package)
```

## 📊 **Monaco Editor Integration**

### **Live Rule Testing**
```typescript
class UTRRuleTester {
  async testRule(ruleCode: string, sampleUTR: UTR, officeId: string): Promise<TestResult> {
    // Create test job package
    const testPackage: JobPackage = {
      jobId: generateTestId(),
      triggerType: 'api',
      ruleIds: [ruleCode], // Compiled rule
      utr: sampleUTR,
      officeId: officeId,
      priority: 'high',
      maxExecutionTime: 30
    }
    
    // Execute via rule engine
    const result = await this.ruleEngine.execute_job_package(testPackage)
    
    return {
      success: result.success,
      executionTime: result.executionTime,
      vendorCalls: result.vendorResults,
      gdsQueueResult: result.queueResult,
      debugInfo: result.debugTrace
    }
  }
}
```

## 🚨 **Error Handling & Recovery**

### **Universal Error Handling**
```python
class UniversalErrorHandler:
    async def handle_execution_error(self, error: Exception, job_package: JobPackage) -> ErrorResult:
        """Handle errors regardless of trigger type"""
        
        error_context = {
            'job_id': job_package.jobId,
            'trigger_type': job_package.triggerType,
            'office_id': job_package.officeId,
            'utr_id': job_package.utr.get_primary_record_locator()
        }
        
        if isinstance(error, VendorAPIException):
            return await self.handle_vendor_error(error, job_package)
        elif isinstance(error, DatabaseException):
            return await self.handle_database_error(error, job_package)
        elif isinstance(error, TimeoutException):
            return await self.handle_timeout_error(error, job_package)
        else:
            return await self.handle_unknown_error(error, job_package)
```

## 📈 **Performance Metrics**

### **Universal Execution Metrics**
- **Trigger Type Performance**: Execution time by trigger (scheduled/API/queue)
- **Rule Execution**: Average time per rule, parallel vs sequential performance
- **Vendor Integration**: API call success rates and response times
- **GDS Queue Performance**: Queue success rates by GDS system
- **Office-Specific Metrics**: Performance by office ID and node location

### **Optimization Strategies**
- **Rule Caching**: Cache compiled rules and database lookups
- **Parallel Optimization**: Optimize parallel rule execution for runOrder=0
- **Vendor API Pooling**: Connection pooling for vendor API calls
- **Smart Queueing**: Batch GDS queue operations when possible

## 🔧 **Vendor Module Architecture**

### **Global Vendor Helpers (Non-Tenant Scoped)**

The system includes a **vendor module** that provides standardized methods for UTR operations. These helpers are **globally available** across all tenants and integrate with both the Monaco editor and Python rule execution.

#### **Vendor Module Interface**
```python
# Global vendor operations accessible in all rules
utr = vendor.utr_get(reference, source_object)
display_data = vendor.utr_redisplay(utr, format_options)
result = vendor.cancel_segment(utr, segment_id, reason)
booking_result = vendor.create_booking(booking_data, vendor_system)
fare_data = vendor.get_fare_rules(segments, office_id)
update_result = vendor.update_pnr(record_locator, updates, system)
queue_result = vendor.queue_to_agent(utr, queue_config)
```

#### **Database Architecture for Global Helpers**

**Current Schema Analysis**: The existing `Rule` model is tenant-scoped (`tenantId` field required), but global vendor helpers need to be **non-tenant scoped**.

**Proposed Schema Extension**:
```prisma
// Global helper rules (non-tenant scoped)
model GlobalRule {
  id              String        @id @default(cuid())
  idShort         String        @unique // Global navigation ID
  name            String        @unique // Global unique name
  description     String?
  type            String        @default("VENDOR_HELPER") // "VENDOR_HELPER", "UTILITY_GLOBAL"
  pythonName      String        // Function name (e.g., "utr_get", "cancel_segment")
  sourceCode      String        @db.Text // Implementation logic
  pythonCode      String        @db.Text // Generated Python code
  category        String        // "vendor", "utility", "conversion"
  isActive        Boolean       @default(true)
  version         Int           @default(1)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  createdById     String?
  updatedById     String?
  
  // Global helpers have no tenant or branch restrictions
  // Available to ALL tenants and branches
  
  createdBy       User?         @relation("GlobalRuleCreatedBy", fields: [createdById], references: [id])
  updatedBy       User?         @relation("GlobalRuleUpdatedBy", fields: [updatedById], references: [id])
  
  @@index([type])
  @@index([category])
  @@index([pythonName])
  @@index([isActive])
}
```

#### **Monaco Editor Integration**

**IntelliSense for Vendor Module**:
```typescript
// Monaco completion provider includes global vendor helpers
const vendorCompletions = [
  {
    label: 'vendor.utr_get',
    kind: CompletionItemKind.Function,
    insertText: 'vendor.utr_get(${1:reference}, ${2:source_object})',
    documentation: 'Retrieve UTR from vendor system using reference and source details'
  },
  {
    label: 'vendor.cancel_segment', 
    kind: CompletionItemKind.Function,
    insertText: 'vendor.cancel_segment(${1:utr}, ${2:segment_id}, ${3:reason})',
    documentation: 'Cancel a specific segment in the UTR'
  }
  // ... additional vendor helpers
]
```

**Rule-Tester Integration**:
```typescript
// Rule-tester can execute full workflow with vendor operations
const executeWorkflowTest = async (workflowId: string, testUTR: UTR) => {
  // 1. Load UTR using vendor module
  const utr = await vendor.utr_get(testUTR.reference, testUTR.source)
  
  // 2. Execute workflow rules against loaded UTR
  const workflowResults = await executeWorkflow(workflowId, utr)
  
  // 3. Apply any vendor operations requested by rules
  for (const operation of workflowResults.vendorOperations) {
    await vendor[operation.method](...operation.params)
  }
  
  return workflowResults
}
```

#### **Source Code Editor & Python Translation System**

**Business-Friendly Code (Monaco Editor)**:
```javascript
// Users write intuitive, business-friendly syntax
if newVal.contains("hello"):
    test = newVal.toBase64
    
if passenger.age < 18:
    passengerType = "CHD"
    
utr = vendor.utr_get(reference, source_object)
segments = utr.segments.filter(s => s.type == "air")
```

**Schema-Driven Python Translation**:
```python
# Auto-generated Python with global helper functions for debugging
if string_contains(newVal, "hello"):
    test = encode_base64(newVal)
    
if compare_numbers(passenger.age, 18, "<"):
    passengerType = "CHD"
    
utr = vendor_utr_get(reference, source_object)  
segments = filter_array(utr.segments, lambda s: s.type == "air")
```

**Global Python Helper Functions** (for line-by-line debugging):
```python
# Global helpers reduce multi-line complexity for better debugging
def string_contains(text: str, substring: str) -> bool:
    """Helper for .contains() method"""
    return substring in text if text else False

def encode_base64(value: str) -> str:
    """Helper for .toBase64 property"""
    import base64
    return base64.b64encode(value.encode()).decode()

def compare_numbers(a: float, b: float, operator: str) -> bool:
    """Helper for numeric comparisons"""
    if operator == "<": return a < b
    elif operator == ">": return a > b
    elif operator == ">=": return a >= b
    elif operator == "<=": return a <= b
    elif operator == "==": return a == b
    return False

def filter_array(array: list, predicate) -> list:
    """Helper for .filter() method"""
    return [item for item in array if predicate(item)]
```

**Rule Execution Flow**:
1. **Monaco Editor**: User writes business-friendly code
2. **Schema Translation**: Real-time conversion to Python using `@/lib/editor/python-translation/`  
3. **Global Helpers**: Python uses helper functions for clean debugging
4. **Rule-Tester**: Executes friendly code, debugs in Python with line mapping
5. **Go Backend**: Executes the generated Python code with vendor operations

#### **Go Backend Vendor Module Implementation**

**Vendor Module Manager**:
```go
type VendorModule struct {
    globalRuleRepo   *GlobalRuleRepository
    vendorClients    map[string]VendorClient
    pythonExecutor   *PythonExecutor
}

func (vm *VendorModule) ExecuteVendorFunction(functionName string, params map[string]interface{}) (*VendorResult, error) {
    // Load global rule for this vendor function
    globalRule, err := vm.globalRuleRepo.FindByPythonName(functionName)
    if err != nil {
        return nil, fmt.Errorf("vendor function not found: %s", functionName)
    }
    
    // Execute the global helper rule
    result, err := vm.pythonExecutor.ExecuteRule(globalRule.PythonCode, params)
    if err != nil {
        return nil, err
    }
    
    return result, nil
}

func (vm *VendorModule) UTRGet(reference string, sourceObj map[string]interface{}) (*UTR, error) {
    params := map[string]interface{}{
        "reference": reference,
        "source_object": sourceObj,
    }
    
    result, err := vm.ExecuteVendorFunction("utr_get", params)
    if err != nil {
        return nil, err
    }
    
    // Convert result to UTR object
    return vm.convertToUTR(result.Data), nil
}
```

#### **Access Patterns**

**Rule-Tester Workflow**:
1. User selects workflow in rule-tester
2. Rule-tester calls `vendor.utr_get(reference, source)` to load test UTR
3. Workflow executes with access to all global vendor helpers
4. Results show both rule outcomes and vendor operations performed

**Monaco Editor Development**:
1. Developer types `vendor.` → IntelliSense shows all global helpers
2. Developer selects `vendor.utr_get` → Auto-completion with parameters
3. Global helper documentation available on hover
4. Type inference works with UTR return types

**Python Rule Execution**:
1. Go calls Python rule with UTR context
2. Python rule can import and use global vendor helpers
3. Vendor helper requests are queued and executed by Go
4. Results returned to Python rule for final processing

## 📋 **Key Architecture Summary**

### **✅ CORRECTED: UTR Cached Execution with Selective Go Integration**

**❌ PREVIOUS** (Inefficient approach):
- Go involved in every rule execution step
- UTR passed from Go to Python for each rule
- Constant Go ↔ Python communication overhead

**✅ CURRENT** (Optimized cached approach):
- **UTR cached in Python memory** and flows between rules
- **Go only called for `vendor.*` operations** (utr_get, cancel_segment, etc.)
- **Sequential rules** modify the same cached UTR object
- **Parallel rules** work with UTR snapshots
- **Vendor operations automatically update cached UTR** for data consistency
- **Subsequent rules see all previous vendor modifications**
- **Significant performance improvement** by eliminating unnecessary Go calls

### **Performance Benefits**

```
Traditional Approach (❌):
┌─────────┐    ┌─────────┐    ┌─────────┐
│  Rule 1 │◄──►│   Go    │◄──►│  Rule 2 │  
└─────────┘    └─────────┘    └─────────┘
     ▲              ▲              ▲
   UTR Copy    UTR Copy     UTR Copy
   
Cached Approach with Data Consistency (✅):
┌─────────┐    ┌─────────┐    ┌─────────┐
│  Rule 1 │───►│  Rule 2 │───►│  Rule 3 │
└─────────┘    └─────────┘    └─────────┘
     ▲              ▲              ▲
  UTR v1       UTR v2       UTR v3
(original)   (+ Rule 1    (+ Rule 1&2
              changes)     changes)
              
┌─────────────────────────────────────────┐
│ Go called ONLY when vendor.* operations │
│ • vendor.cancel_segment() → UTR updated │  
│ • vendor.add_segment() → UTR updated    │
│ • vendor.update_pnr() → UTR updated     │
└─────────────────────────────────────────┘
```

### **Complete Flow Summary**
```
┌─────────────────────────────────────────────────────────────────┐
│                    TRIGGER SOURCES                              │
│  • Scheduled Jobs  • API Calls  • Queue Processing            │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GO ORCHESTRATOR                               │
│  1. Assembles UTR from multiple vendor sources                 │
│  2. Resolves workflow → processes → rules from database        │
│  3. Filters rules based on office node + ruleIgnore           │
│  4. Executes rules with runOrder logic (parallel/sequential)   │
│  5. Handles ALL vendor API communications                      │
│  6. Manages GDS queueing to agents                            │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PYTHON RULE ENGINE                            │
│  • Executes business logic against UTR data                   │
│  • Validates travel data and business rules                   │
│  • REQUESTS vendor operations (doesn't execute them)          │
│  • Processes vendor results returned by Go                    │
│  • Returns final rule results to Go                           │
└─────────────────────────────────────────────────────────────────┘
```

### **Universal Execution Pattern**
The **SAME execution flow** applies regardless of trigger:
- ✅ Scheduled job → Go → Python → Vendor APIs → GDS Queue
- ✅ API call → Go → Python → Vendor APIs → GDS Queue  
- ✅ Queue processing → Go → Python → Vendor APIs → GDS Queue

## 🔗 **Related Documentation**

- [UTR Flow Overview](./01-utr-flow-overview.md) - High-level system overview
- [Multi-Source Data Combination](./02-multi-source-normalization.md) - How Go assembles UTR from multiple sources
- [Monaco Editor Integration](./04-monaco-editor-integration.md) - Rule development and testing
- [Gold Standard Recommendations](./05-gold-standard-recommendations.md) - Future enhancements