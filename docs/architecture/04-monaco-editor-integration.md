# Monaco Editor Integration - Rule Development & Testing

## 🎯 **Purpose**
This document details the integration between the Monaco Editor system and the UTR-based rule engine, providing a comprehensive development and testing environment for business rules.

## 🏗️ **Integration Architecture**

### **Core Integration Components**

#### **UTR-Aware Monaco System**
```typescript
interface UTRMonacoIntegration {
  // UTR schema integration
  utrSchema: UTRSchema
  utrCompletionProvider: UTRCompletionProvider
  utrHoverProvider: UTRHoverProvider
  
  // Rule testing integration
  ruleTester: UTRRuleTester
  variableInspector: UTRVariableInspector
  debugSession: UTRDebugSession
  
  // Live data integration
  sampleUTRProvider: SampleUTRProvider
  realTimeDataConnector: RealTimeDataConnector
}
```

#### **UTR IntelliSense System**
```typescript
class UTRCompletionProvider implements monaco.languages.CompletionItemProvider {
  provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.languages.CompletionList {
    const context = this.parseUTRContext(model, position)
    
    // Provide UTR-specific completions
    if (context.isUTRAccess) {
      return this.generateUTRCompletions(context.path, this.utrSchema)
    }
    
    // Provide method completions for UTR objects
    if (context.isMethodAccess) {
      return this.generateMethodCompletions(context.objectType, context.currentPath)
    }
    
    return this.generateStandardCompletions(context)
  }
  
  private generateUTRCompletions(path: string[], schema: UTRSchema): monaco.languages.CompletionList {
    const completions: monaco.languages.CompletionItem[] = []
    
    // Navigate schema based on current path
    const currentSchema = this.navigateSchema(schema, path)
    
    if (currentSchema.type === 'object') {
      // Add property completions
      Object.entries(currentSchema.properties).forEach(([key, propSchema]) => {
        completions.push({
          label: key,
          kind: monaco.languages.CompletionItemKind.Property,
          documentation: propSchema.description,
          detail: propSchema.type,
          insertText: key
        })
      })
    } else if (currentSchema.type === 'array') {
      // Add array access patterns
      completions.push({
        label: '[0]',
        kind: monaco.languages.CompletionItemKind.Method,
        documentation: 'Access first element',
        insertText: '[0]'
      })
    }
    
    return { suggestions: completions }
  }
}
```

### **Schema-Driven Source Code Translation**

The Monaco editor operates as a **TypeScript/JavaScript-like compiler** for business rules, providing real-time translation from business-friendly syntax to executable Python:

#### **Translation Architecture**

```typescript
interface SourceCodeTranslation {
  // Business-friendly input (what users write)
  sourceCode: string          // "if newVal.contains('hello'): test = newVal.toBase64"
  
  // Schema-driven translation system  
  pythonTranslator: PythonTranslator
  schemas: SchemaRegistry
  
  // Generated Python output (for execution & debugging)
  pythonCode: string          // "if string_contains(newVal, 'hello'): test = encode_base64(newVal)"
  
  // Line mapping for debugging
  sourceMap: SourceMap        // Maps friendly code lines to Python lines
}
```

#### **Real-Time Translation Flow**

```typescript
class BusinessRuleTranslator {
  private schemas: SchemaRegistry
  private globalHelpers: GlobalFunctionRegistry
  
  translateToPython(sourceCode: string): TranslationResult {
    // 1. Parse business-friendly syntax
    const ast = this.parseBusinessCode(sourceCode)
    
    // 2. Apply schema transformations
    const transformedAst = this.applySchemaTransforms(ast)
    
    // 3. Generate Python with global helpers for debugging
    const pythonCode = this.generatePythonWithHelpers(transformedAst)
    
    // 4. Create source map for line-by-line debugging
    const sourceMap = this.createSourceMap(ast, transformedAst)
    
    return {
      success: true,
      pythonCode,
      sourceMap,
      helperFunctions: this.getRequiredHelpers(transformedAst)
    }
  }
  
  private generatePythonWithHelpers(ast: TransformedAST): string {
    // Convert method calls to global helper functions
    // Example: "newVal.contains('hello')" → "string_contains(newVal, 'hello')"
    // This keeps Python lines simple for easier debugging
    
    return this.walkAST(ast, (node) => {
      switch (node.type) {
        case 'MethodCall':
          return this.translateMethodToHelper(node)  // .contains() → string_contains()
        case 'PropertyAccess':  
          return this.translatePropertyToHelper(node) // .toBase64 → encode_base64()
        case 'ComparisonOperator':
          return this.translateComparisonToHelper(node) // < → compare_numbers()
        default:
          return node
      }
    })
  }
}
```

#### **Line-by-Line Debugging Integration**

```typescript
class RuleTesterDebugger {
  private sourceMap: SourceMap
  private pythonExecutor: PythonDebugExecutor
  
  async debugRule(sourceCode: string, utr: UTR): Promise<DebugSession> {
    // 1. Translate to Python with line mapping
    const translation = this.translator.translateToPython(sourceCode)
    
    // 2. Set up Python debugger with breakpoints
    const debugSession = await this.pythonExecutor.createDebugSession({
      pythonCode: translation.pythonCode,
      sourceMap: translation.sourceMap,
      globalHelpers: translation.helperFunctions
    })
    
    // 3. Map user breakpoints from friendly code to Python lines
    this.mapBreakpoints(debugSession, translation.sourceMap)
    
    return debugSession
  }
  
  private mapBreakpoints(session: DebugSession, sourceMap: SourceMap): void {
    // When user sets breakpoint on line 5 of friendly code:
    // "if newVal.contains('hello'):"
    // Map to corresponding Python line:
    // "if string_contains(newVal, 'hello'):"
    
    session.onBreakpoint((pythonLine, variables) => {
      const friendlyLine = sourceMap.mapPythonToSource(pythonLine)
      
      // Show debugging info in terms of original friendly code
      this.showDebugInfo({
        friendlyLine,
        pythonLine, 
        variables: this.translatePythonVariablesToFriendly(variables),
        stackTrace: this.mapStackTraceToFriendly(session.stackTrace)
      })
    })
  }
}
```

### **Global Vendor Module IntelliSense**

Monaco editor provides **global vendor helpers** that integrate with the schema-driven translation system. These non-tenant scoped functions are available in both friendly syntax and Python translation:

```typescript
class VendorModuleCompletionProvider implements monaco.languages.CompletionItemProvider {
  private globalVendorFunctions = new Map<string, VendorFunctionDefinition>([
    ['utr_get', {
      friendlySyntax: 'utr = vendor.utr_get(reference, source_object)',
      pythonTranslation: 'utr = vendor_utr_get(reference, source_object)',
      signature: '(reference: str, source_object: dict) -> UTR', 
      description: 'Load UTR from vendor system using reference and source details',
      category: 'data_retrieval',
      examples: [
        {
          friendly: 'utr = vendor.utr_get("ABC123", {"system": "amadeus", "office": "NYC1S2123"})',
          python: 'utr = vendor_utr_get("ABC123", {"system": "amadeus", "office": "NYC1S2123"})'
        }
      ]
    }],
    ['cancel_segment', {
      signature: '(utr: UTR, segment_id: int, reason: str) -> VendorResult',
      description: 'Cancel a specific segment in the UTR',
      category: 'booking_modification',
      examples: [
        'result = vendor.cancel_segment(utr, 1, "customer_request")',
        'cancel_result = vendor.cancel_segment(current_utr, seg_num, "schedule_change")'
      ]
    }],
    ['utr_redisplay', {
      signature: '(utr: UTR, format_options: dict) -> DisplayData',
      description: 'Format UTR for display or output',
      category: 'data_formatting',
      examples: [
        'display = vendor.utr_redisplay(utr, {"format": "summary"})',
        'formatted = vendor.utr_redisplay(utr, {"include_source": True, "show_prices": False})'
      ]
    }],
    ['update_pnr', {
      signature: '(record_locator: str, updates: dict, system: str) -> VendorResult',
      description: 'Update PNR record in vendor system',
      category: 'booking_modification',
      examples: [
        'result = vendor.update_pnr("ABC123", {"passenger_phone": "+1234567890"}, "amadeus")',
        'update_result = vendor.update_pnr(pnr_ref, contact_updates, gds_system)'
      ]
    }]
  ])

  provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): monaco.languages.CompletionList {
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 0,
      startColumn: 0,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    })

    // Check if we're completing after "vendor."
    if (textUntilPosition.endsWith('vendor.')) {
      return this.generateVendorCompletions()
    }

    return { suggestions: [] }
  }

  private generateVendorCompletions(): monaco.languages.CompletionList {
    const completions: monaco.languages.CompletionItem[] = []

    this.globalVendorFunctions.forEach((definition, functionName) => {
      completions.push({
        label: functionName,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: this.generateSnippet(functionName, definition.signature),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: this.formatDocumentation(functionName, definition),
          isTrusted: true
        },
        detail: definition.signature,
        sortText: `0_${functionName}` // Prioritize vendor functions
      })
    })

    return { suggestions: completions }
  }

  private generateSnippet(functionName: string, signature: string): string {
    // Parse signature to generate snippet with placeholders
    const params = this.parseSignatureParams(signature)
    const snippetParams = params.map((param, index) => `\${${index + 1}:${param.name}}`).join(', ')
    return `${functionName}(${snippetParams})`
  }

  private formatDocumentation(functionName: string, definition: VendorFunctionDefinition): string {
    return [
      `**vendor.${functionName}**`,
      '',
      definition.description,
      '',
      '**Signature:**',
      `\`${definition.signature}\``,
      '',
      '**Examples:**',
      ...definition.examples.map(example => `\`\`\`python\n${example}\n\`\`\``),
      '',
      `**Category:** ${definition.category}`
    ].join('\n')
  }
}
```

#### **Global Vendor Function Registry**

The Monaco editor maintains a registry of all available vendor functions loaded from the global rule database:

```typescript
class GlobalVendorRegistry {
  private functions = new Map<string, GlobalVendorFunction>()
  
  async loadFromDatabase(): Promise<void> {
    // Load from GlobalRule table where type = 'VENDOR_HELPER'
    const globalRules = await this.apiClient.get('/api/global-rules?type=VENDOR_HELPER')
    
    globalRules.forEach(rule => {
      this.functions.set(rule.pythonName, {
        id: rule.id,
        name: rule.pythonName,
        displayName: rule.name,
        description: rule.description,
        signature: this.parseSignature(rule.pythonCode),
        category: rule.category,
        sourceCode: rule.sourceCode,
        pythonCode: rule.pythonCode,
        examples: this.extractExamples(rule.sourceCode),
        version: rule.version
      })
    })
  }
  
  getFunction(name: string): GlobalVendorFunction | undefined {
    return this.functions.get(name)
  }
  
  getAllByCategory(category: string): GlobalVendorFunction[] {
    return Array.from(this.functions.values())
      .filter(func => func.category === category)
  }
  
  // Real-time updates when global rules change
  onGlobalRuleUpdate(rule: GlobalRule): void {
    if (rule.type === 'VENDOR_HELPER') {
      this.functions.set(rule.pythonName, this.convertToVendorFunction(rule))
      this.notifyEditorProviders()
    }
  }
}
```

### **UTR Variable Inspector**
```typescript
class UTRVariableInspector {
  private currentUTR: UTR | null = null
  private debugVariables = new Map<string, any>()
  
  async inspectVariable(variablePath: string): Promise<VariableInspection> {
    if (!this.currentUTR) {
      throw new Error('No UTR loaded for inspection')
    }
    
    const value = this.resolveVariablePath(variablePath, {
      utr: this.currentUTR,
      ...this.debugVariables
    })
    
    return {
      path: variablePath,
      value: value,
      type: this.getValueType(value),
      properties: this.getAvailableProperties(value),
      sourceAttribution: this.getSourceAttribution(variablePath, this.currentUTR)
    }
  }
  
  private getSourceAttribution(path: string, utr: UTR): SourceAttribution | null {
    // For paths like 'utr.segments[0]', return source information
    const pathParts = this.parseVariablePath(path)
    
    if (pathParts.includes('segments')) {
      const segmentIndex = this.extractArrayIndex(path, 'segments')
      const segment = utr.segments[segmentIndex]
      return segment?.source || null
    }
    
    if (pathParts.includes('passengers')) {
      const passengerIndex = this.extractArrayIndex(path, 'passengers')
      const passenger = utr.passengers[passengerIndex]
      // Return source from associated segments or booking info
      return this.inferPassengerSource(passenger, utr)
    }
    
    return null
  }
}
```

## 🧪 **Rule Testing Framework**

### **Live Rule Testing**
```typescript
class UTRRuleTester {
  private pythonExecutor: PythonRuleExecutor
  private sampleUTRProvider: SampleUTRProvider
  
  async testRule(ruleCode: string, selectedUTR?: UTR): Promise<RuleTestResult> {
    // Compile the rule from Monaco editor content
    const compiledRule = await this.compileRule(ruleCode)
    
    // Get UTR for testing (selected or sample)
    const testUTR = selectedUTR || await this.sampleUTRProvider.getRandomSample()
    
    // Execute rule with debug information
    const executionResult = await this.pythonExecutor.executeWithDebug(
      compiledRule,
      testUTR,
      this.createTestContext()
    )
    
    return {
      success: executionResult.success,
      result: executionResult.result,
      actions: executionResult.actions,
      executionTime: executionResult.executionTime,
      debugInfo: executionResult.debugInfo,
      variableStates: executionResult.variableStates,
      sourceAttribution: this.analyzeSourceUsage(executionResult, testUTR)
    }
  }
  
  private analyzeSourceUsage(result: PythonExecutionResult, utr: UTR): SourceUsageAnalysis {
    const sourcesUsed = new Set<string>()
    const dataQualityImpact = new Map<string, number>()
    
    // Analyze which data sources were accessed during rule execution
    result.variableAccesses.forEach(access => {
      const sourceAttribution = this.getSourceForAccess(access.path, utr)
      if (sourceAttribution) {
        sourcesUsed.add(`${sourceAttribution.system}-${sourceAttribution.type}`)
        
        // Calculate impact of data quality on rule result
        const qualityScore = this.calculateDataQuality(access.value, sourceAttribution)
        dataQualityImpact.set(access.path, qualityScore)
      }
    })
    
    return {
      sourcesUsed: Array.from(sourcesUsed),
      dataQualityImpact: Object.fromEntries(dataQualityImpact),
      reliabilityScore: this.calculateOverallReliability(dataQualityImpact)
    }
  }
}
```

### **Vendor Module Integration with Rule Testing**

The rule-tester integrates with the global vendor module to provide realistic testing scenarios:

```typescript
class VendorAwareRuleTester extends UTRRuleTester {
  private vendorRegistry: GlobalVendorRegistry
  private vendorSimulator: VendorOperationSimulator
  
  async testRuleWithVendorOperations(ruleCode: string, testScenario: TestScenario): Promise<EnhancedRuleTestResult> {
    // 1. Initialize test UTR using vendor.utr_get if needed
    let testUTR: UTR
    if (testScenario.requiresLiveData) {
      testUTR = await this.loadLiveUTR(testScenario.reference, testScenario.sourceConfig)
    } else {
      testUTR = testScenario.mockUTR
    }
    
    // 2. Execute rule with vendor operation tracking
    const executionResult = await this.executeRuleWithVendorTracking(ruleCode, testUTR)
    
    // 3. Simulate vendor operations requested by the rule
    const vendorResults = await this.simulateVendorOperations(executionResult.vendorOperations)
    
    // 4. Continue rule execution with vendor results
    const finalResult = await this.completeRuleExecution(executionResult, vendorResults)
    
    return {
      ...finalResult,
      vendorOperationsExecuted: vendorResults,
      simulationAccuracy: this.assessSimulationAccuracy(vendorResults),
      realWorldViability: this.assessRealWorldViability(executionResult, vendorResults)
    }
  }
  
  private async loadLiveUTR(reference: string, sourceConfig: any): Promise<UTR> {
    // Use global vendor.utr_get function to load real UTR data
    const vendorGetFunction = this.vendorRegistry.getFunction('utr_get')
    if (!vendorGetFunction) {
      throw new Error('vendor.utr_get function not available')
    }
    
    // Execute the global vendor function
    const result = await this.executeGlobalVendorFunction('utr_get', {
      reference,
      source_object: sourceConfig
    })
    
    return result.data as UTR
  }
  
  private async simulateVendorOperations(operations: VendorOperation[]): Promise<VendorOperationResult[]> {
    const results: VendorOperationResult[] = []
    
    for (const operation of operations) {
      try {
        // Check if we have a global vendor function for this operation
        const vendorFunction = this.vendorRegistry.getFunction(operation.functionName)
        
        if (vendorFunction) {
          // Execute actual global vendor function in test mode
          const result = await this.executeGlobalVendorFunction(
            operation.functionName, 
            operation.parameters,
            { testMode: true, simulateOnly: true }
          )
          
          results.push({
            operation,
            success: true,
            result: result.data,
            executionTime: result.executionTime,
            simulationNotes: result.simulationNotes
          })
        } else {
          // Fall back to mock simulation
          const mockResult = await this.vendorSimulator.simulate(operation)
          results.push({
            operation,
            success: mockResult.success,
            result: mockResult.data,
            executionTime: mockResult.executionTime,
            simulationNotes: ['Mock simulation - no actual vendor function available']
          })
        }
      } catch (error) {
        results.push({
          operation,
          success: false,
          error: error.message,
          simulationNotes: ['Simulation failed']
        })
      }
    }
    
    return results
  }
}
```

#### **Workflow Testing with Source Code Translation**

```typescript
class WorkflowTesterWithTranslation {
  private translator: BusinessRuleTranslator
  private pythonDebugger: PythonDebugExecutor
  
  async testWorkflowFromStart(workflowId: string, initialReference: string, sourceConfig: any): Promise<WorkflowTestResult> {
    // 1. Load initial UTR using vendor helper (friendly syntax)
    const initialUTR = await this.loadUTRWithFriendlyCode(
      `utr = vendor.utr_get("${initialReference}", ${JSON.stringify(sourceConfig)})`
    )
    
    // 2. Execute complete workflow with source code translation
    const workflowSteps: WorkflowStepResult[] = []
    let currentUTR = initialUTR
    
    const workflow = await this.getWorkflow(workflowId)
    
    for (const process of workflow.processes) {
      for (const rule of process.rules) {
        const stepResult = await this.testRuleWithTranslation(
          rule.sourceCode, // Business-friendly code
          currentUTR,
          {
            enableDebugging: true,
            showPythonTranslation: true,
            enableLineMapping: true
          }
        )
        
        workflowSteps.push({
          ruleId: rule.id,
          ruleName: rule.name,
          sourceCode: rule.sourceCode,
          translatedPython: stepResult.pythonCode,
          sourceMap: stepResult.sourceMap,
          result: stepResult,
          debugInfo: stepResult.debugSession,
          utrStateAfter: stepResult.updatedUTR || currentUTR
        })
        
        // Update UTR state for next rule
        if (stepResult.updatedUTR) {
          currentUTR = stepResult.updatedUTR
        }
      }
    }
    
    return {
      workflowId,
      initialUTR,
      finalUTR: currentUTR,
      steps: workflowSteps,
      translationMetrics: this.calculateTranslationMetrics(workflowSteps),
      overallSuccess: workflowSteps.every(step => step.result.success),
      executionTime: workflowSteps.reduce((total, step) => total + step.result.executionTime, 0)
    }
  }
  
  private async testRuleWithTranslation(
    sourceCode: string, 
    utr: UTR, 
    options: TestOptions
  ): Promise<RuleTestResultWithTranslation> {
    
    // 1. Translate friendly code to Python
    const translation = this.translator.translateToPython(sourceCode)
    
    if (!translation.success) {
      return {
        success: false,
        sourceCode,
        pythonCode: translation.pythonCode || '',
        errors: translation.errors,
        sourceMap: null
      }
    }
    
    // 2. Execute Python with debugging if enabled
    let debugSession = null
    if (options.enableDebugging) {
      debugSession = await this.pythonDebugger.createDebugSession({
        pythonCode: translation.pythonCode,
        sourceMap: translation.sourceMap,
        globalHelpers: translation.helperFunctions,
        utr,
        breakpoints: this.extractBreakpointsFromSource(sourceCode)
      })
    }
    
    // 3. Execute the rule
    const executionResult = await this.executeTranslatedRule(
      translation.pythonCode,
      utr,
      { debugSession, globalHelpers: translation.helperFunctions }
    )
    
    return {
      success: executionResult.success,
      sourceCode,
      pythonCode: translation.pythonCode,
      sourceMap: translation.sourceMap,
      debugSession,
      result: executionResult.result,
      vendorOperationsExecuted: executionResult.vendorOperations,
      executionTime: executionResult.executionTime,
      updatedUTR: executionResult.updatedUTR
    }
  }
  
  private calculateTranslationMetrics(steps: WorkflowStepResult[]): TranslationMetrics {
    return {
      totalRules: steps.length,
      translationSuccessRate: steps.filter(s => s.result.success).length / steps.length,
      averageTranslationTime: steps.reduce((sum, s) => sum + (s.result.translationTime || 0), 0) / steps.length,
      pythonLinesGenerated: steps.reduce((sum, s) => sum + (s.translatedPython?.split('\n').length || 0), 0),
      globalHelpersUsed: new Set(steps.flatMap(s => s.result.helperFunctionsUsed || [])).size,
      debugBreakpointsHit: steps.reduce((sum, s) => sum + (s.debugInfo?.breakpointsHit || 0), 0)
    }
  }
}
```

### **Sample UTR Management**
```typescript
class SampleUTRProvider {
  private sampleCache = new Map<string, UTR>()
  private sampleCategories = new Map<string, UTR[]>()
  
  async loadSampleUTRs(): Promise<void> {
    // Load various UTR samples for testing
    const samples = await this.fetchSampleUTRs([
      'simple-domestic-flight',
      'complex-international-multi-city',
      'flight-hotel-car-package',
      'group-booking',
      'corporate-travel',
      'last-minute-booking',
      'schedule-change-scenario',
      'cancellation-scenario'
    ])
    
    samples.forEach(sample => {
      this.sampleCache.set(sample.id, sample.utr)
      
      // Categorize samples
      sample.categories.forEach(category => {
        if (!this.sampleCategories.has(category)) {
          this.sampleCategories.set(category, [])
        }
        this.sampleCategories.get(category)!.push(sample.utr)
      })
    })
  }
  
  getByCategory(category: string): UTR[] {
    return this.sampleCategories.get(category) || []
  }
  
  getRandomSample(): UTR {
    const allSamples = Array.from(this.sampleCache.values())
    return allSamples[Math.floor(Math.random() * allSamples.length)]
  }
  
  getSampleWithCharacteristics(characteristics: UTRCharacteristics): UTR | null {
    for (const utr of this.sampleCache.values()) {
      if (this.matchesCharacteristics(utr, characteristics)) {
        return utr
      }
    }
    return null
  }
}
```

## 🔍 **Advanced Debugging Features**

### **Multi-Source Data Awareness**
```typescript
class UTRDebugSession {
  private breakpoints = new Set<number>()
  private currentExecutionState: ExecutionState | null = null
  
  async startDebugSession(ruleCode: string, utr: UTR): Promise<DebugSession> {
    const session = new DebugSession({
      ruleCode,
      utr,
      breakpoints: Array.from(this.breakpoints),
      sourceHighlighting: true,
      variableTracking: true
    })
    
    // Enhanced debugging for multi-source data
    session.onVariableAccess((path: string, value: any) => {
      const sourceInfo = this.getSourceInformation(path, utr)
      
      this.highlightSourceInEditor(sourceInfo)
      this.showDataQualityIndicators(path, value, sourceInfo)
    })
    
    return session
  }
  
  private showDataQualityIndicators(path: string, value: any, source: SourceAttribution): void {
    const qualityIndicators = {
      freshness: this.calculateFreshness(source.timestamp),
      reliability: this.getSourceReliability(source.system),
      completeness: this.checkDataCompleteness(value),
      consistency: this.checkDataConsistency(value, path)
    }
    
    // Show indicators in Monaco editor
    this.monacoEditor.addDecoration({
      range: this.getCurrentVariableRange(path),
      options: {
        className: 'data-quality-indicator',
        hoverMessage: this.formatQualityMessage(qualityIndicators, source),
        glyphMarginClassName: this.getQualityGlyphClass(qualityIndicators)
      }
    })
  }
}
```

### **Source Attribution Visualization**
```typescript
class SourceAttributionVisualizer {
  private colorMap = new Map<string, string>([
    ['amadeus-ndc', '#00ff00'],      // Green for real-time
    ['amadeus-edifact', '#ffff00'],  // Yellow for traditional
    ['sabre', '#ff8800'],            // Orange for alternative
    ['ota', '#ff0088']               // Pink for OTA data
  ])
  
  visualizeDataSources(utr: UTR, activeVariablePath?: string): void {
    // Highlight different data sources in the variable inspector
    const decorations: monaco.editor.IModelDeltaDecoration[] = []
    
    // For each variable access, show source color coding
    this.variableAccesses.forEach(access => {
      const source = this.getSourceForPath(access.path, utr)
      if (source) {
        const color = this.colorMap.get(`${source.system}-${source.type}`)
        
        decorations.push({
          range: access.range,
          options: {
            className: 'source-attribution',
            backgroundColor: color + '20', // 20% opacity
            borderLeft: `3px solid ${color}`,
            hoverMessage: `Data from: ${source.system} (${source.type})\nRecord: ${source.associatedRecord}`
          }
        })
      }
    })
    
    this.monacoEditor.deltaDecorations([], decorations)
  }
}
```

## 🚀 **Rule Development Workflow**

### **Integrated Development Experience**
```typescript
class UTRRuleDevelopmentWorkflow {
  private monacoEditor: monaco.editor.IStandaloneCodeEditor
  private ruleTester: UTRRuleTester
  private variableInspector: UTRVariableInspector
  
  async initializeWorkflow(): Promise<void> {
    // Set up auto-save and continuous testing
    this.monacoEditor.onDidChangeModelContent(
      debounce(async () => {
        await this.autoTestRule()
      }, 1000)
    )
    
    // Set up hover providers for UTR data
    monaco.languages.registerHoverProvider('python', {
      provideHover: async (model, position) => {
        const word = model.getWordAtPosition(position)
        if (word && this.isUTRVariable(word.word)) {
          const inspection = await this.variableInspector.inspectVariable(word.word)
          return {
            contents: [
              { value: `**${word.word}**: ${inspection.type}` },
              { value: inspection.value ? `Value: ${JSON.stringify(inspection.value, null, 2)}` : 'No current value' },
              ...(inspection.sourceAttribution ? [
                { value: `Source: ${inspection.sourceAttribution.system} (${inspection.sourceAttribution.type})` }
              ] : [])
            ]
          }
        }
      }
    })
  }
  
  private async autoTestRule(): Promise<void> {
    const ruleCode = this.monacoEditor.getValue()
    if (this.isValidRuleCode(ruleCode)) {
      const testResult = await this.ruleTester.testRule(ruleCode)
      this.updateTestResultsPanel(testResult)
      this.highlightRuleIssues(testResult)
    }
  }
}
```

### **Performance Optimization**
```typescript
class RulePerformanceProfiler {
  async profileRule(ruleCode: string, utr: UTR): Promise<PerformanceProfile> {
    const startTime = performance.now()
    
    // Execute rule with detailed timing
    const result = await this.executeWithTiming(ruleCode, utr)
    
    const endTime = performance.now()
    
    return {
      totalExecutionTime: endTime - startTime,
      dataAccessTime: result.timings.dataAccess,
      computationTime: result.timings.computation,
      hotspots: result.timings.hotspots,
      memoryUsage: result.memoryUsage,
      optimizationSuggestions: this.generateOptimizationSuggestions(result)
    }
  }
  
  private generateOptimizationSuggestions(result: TimedExecutionResult): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []
    
    // Suggest caching for repeated data access
    if (result.timings.repeatedAccesses.length > 0) {
      suggestions.push({
        type: 'caching',
        description: 'Cache frequently accessed UTR properties',
        impact: 'medium',
        example: 'Store utr.segments in a local variable'
      })
    }
    
    // Suggest early returns for expensive operations
    if (result.timings.unnecessaryComputations > 0) {
      suggestions.push({
        type: 'early_return',
        description: 'Add early return conditions',
        impact: 'high',
        example: 'Check simple conditions before complex calculations'
      })
    }
    
    return suggestions
  }
}
```

## 📊 **Integration Metrics & Analytics**

### **Usage Analytics**
```typescript
interface RuleDevelopmentMetrics {
  // Development patterns
  averageRuleComplexity: number
  mostUsedUTRProperties: string[]
  commonRulePatterns: RulePattern[]
  
  // Testing patterns  
  testExecutionFrequency: number
  sampleUTRUsage: Map<string, number>
  debugSessionDuration: number
  
  // Performance metrics
  averageRuleExecutionTime: number
  memoryUsage: MemoryUsageStats
  errorRate: number
  
  // Data source analytics
  sourceReliabilityScores: Map<string, number>
  dataQualityTrends: QualityTrend[]
  sourceUsageDistribution: Map<string, number>
}
```

### **Quality Assurance**
```typescript
class RuleQualityAssurance {
  async validateRule(ruleCode: string): Promise<QualityReport> {
    const report: QualityReport = {
      codeQuality: await this.analyzeCodeQuality(ruleCode),
      testCoverage: await this.analyzeTestCoverage(ruleCode),
      performanceImpact: await this.analyzePerformanceImpact(ruleCode),
      dataSourceDependencies: await this.analyzeDataDependencies(ruleCode)
    }
    
    return report
  }
  
  private async analyzeDataDependencies(ruleCode: string): Promise<DataDependencyAnalysis> {
    // Analyze which UTR properties the rule depends on
    const dependencies = this.extractUTRDependencies(ruleCode)
    
    return {
      requiredProperties: dependencies.required,
      optionalProperties: dependencies.optional,
      riskAssessment: this.assessDataRisk(dependencies),
      alternatives: this.suggestAlternativeProperties(dependencies)
    }
  }
}
```

## ⚠️ **Current Implementation Limitations (January 2025)**

### **UTR Integration Status**
- **Planned**: Complete UTR schema integration with Monaco IntelliSense
- **Current**: Monaco editor works independently of UTR system
- **Gap**: No UTR-aware code completion or variable detection

### **Rule Testing Reality**
- **Documented**: Live UTR data flows into rule testing and debugging
- **Current**: Rule tester uses generic mock data without travel context
- **Impact**: Rules developed without understanding actual UTR object structure

### **Required Integration Work**

#### **Phase 1: Schema Connection**
```typescript
// CURRENT: Generic IntelliSense
monaco.languages.registerCompletionItemProvider('business-rules', {
  provideCompletionItems: () => genericSuggestions
})

// TARGET: UTR-aware IntelliSense  
monaco.languages.registerCompletionItemProvider('business-rules', {
  provideCompletionItems: () => utrAwareSuggestions(loadedUTR)
})
```

#### **Phase 2: Real Data Integration**
```typescript
// Connect UTR templates to Monaco type system
const utrTemplate = await import('../../schemas/utr/templates/business-rules-template.js')
monaco.languages.typescript.typescriptDefaults.addExtraLib(utrTemplate)
```

#### **Phase 3: Testing Integration**
- Load real UTR examples from `schemas/utr/normalized/` into rule tester
- Connect `vendor.get()` calls to retrieve live UTR data for testing
- Add UTR object inspection and debugging capabilities

### **Integration Priority**
The Monaco editor system is well-architected and functional. The missing piece is connecting it to the equally well-designed UTR system for travel-data-aware rule development.

## 🔗 **Related Documentation**

- [UTR Flow Overview](./01-utr-flow-overview.md)
- [Multi-Source Data Normalization](./02-multi-source-normalization.md)
- [Rule Engine Integration](./03-rule-engine-integration.md)
- [Gold Standard Recommendations](./05-gold-standard-recommendations.md)
- [Implementation Status](./06-implementation-status.md) - **Current UTR integration gaps**