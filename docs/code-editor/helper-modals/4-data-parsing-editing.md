# Data Parsing & Editing - Converting Code Back to Forms

## 🎯 Overview

This guide covers how **existing helper code is parsed back into form data** so users can edit helpers by reopening the modal with their current settings pre-populated.

## 🔄 **Core Concept: Bi-Directional Conversion**

The helper system needs to work in **both directions**:
1. **Form Data → Python Code** (Initial creation)
2. **Python Code → Form Data** (Editing existing helpers)

```
Form: {systems: ['amadeus'], remark: 'TEST'} 
  ↓ (Schema pythonGenerator)
Python: "amadeus_remark = f'RMTEST/TEST'"
  ↓ (Data parser)  
Form: {systems: ['amadeus'], remark: 'TEST'}
```

## 🔍 **Data Extraction Architecture**

### **Helper Block Data Extractor**
```typescript
// o-ui/src/components/editor/helpers/helper-data-extractor.ts
export class HelperDataExtractor {
  private schemaRegistry: Map<string, UnifiedSchema> = new Map()
  
  constructor() {
    // Register all helper schemas for parsing
    ALL_HELPER_SCHEMAS.forEach(schema => {
      this.schemaRegistry.set(schema.id, schema)
    })
  }
  
  // Extract form data from helper block code
  extractHelperData(helperBlock: HelperBlock): Record<string, any> {
    const schema = this.schemaRegistry.get(helperBlock.schemaId)
    if (!schema) {
      throw new Error(`Schema not found: ${helperBlock.schemaId}`)
    }
    
    // Get the generated code without markers
    const cleanCode = this.extractCleanCode(helperBlock)
    
    // Use schema-specific parser or generic parser
    if (schema.dataParser) {
      return schema.dataParser(cleanCode)
    } else {
      return this.genericDataParser(cleanCode, schema)
    }
  }
  
  // Remove helper markers to get clean generated code
  private extractCleanCode(helperBlock: HelperBlock): string {
    const lines = helperBlock.generatedCode.split('\n')
    return lines
      .filter(line => !line.includes('HELPER_START:') && !line.includes('HELPER_END:'))
      .join('\n')
      .trim()
  }
}
```

## 🧩 **Schema-Specific Data Parsers**

### **Adding Data Parser to Schema**
```typescript
// o-ui/src/lib/editor/schemas/helpers/remark-helpers.ts
export const REMARK_HELPER_SCHEMAS: UnifiedSchema[] = [
  {
    id: 'find-remark-helper',
    name: 'Add Vendor Remark',
    // ... other schema properties
    
    // Add custom data parser for this helper
    dataParser: (generatedCode: string): Record<string, any> => {
      const data: Record<string, any> = {
        systems: [],
        remarkType: 'general',
        category: '',
        remark: '',
        condition: 'always',
        isErrorRemark: false,
        notContainedText: ''
      }
      
      // Parse systems from generated code
      data.systems = parseSelectedSystems(generatedCode)
      
      // Parse remark type
      data.remarkType = parseRemarkType(generatedCode)
      
      // Parse category and remark
      const remarkInfo = parseRemarkContent(generatedCode)
      data.category = remarkInfo.category
      data.remark = remarkInfo.remark
      
      // Parse condition
      data.condition = parseConditionType(generatedCode)
      
      // Parse error remark flag
      data.isErrorRemark = generatedCode.includes('mark_as_error_remark = True')
      
      // Parse not contained text if condition is 'not_contained'
      if (data.condition === 'not_contained') {
        data.notContainedText = parseNotContainedText(generatedCode)
      }
      
      return data
    },
    
    pythonGenerator: // ... existing generator
  }
]
```

### **Parsing Helper Functions**
```typescript
// Helper functions for parsing specific data from generated code
function parseSelectedSystems(code: string): string[] {
  const systems = []
  
  if (code.includes('amadeus_remark =')) systems.push('amadeus')
  if (code.includes('galileo_remark =')) systems.push('galileo')  
  if (code.includes('worldspan_remark =')) systems.push('worldspan')
  if (code.includes('sabre_remark =')) systems.push('sabre')
  if (code.includes('apollo_remark =')) systems.push('apollo')
  if (code.includes('abacus_remark =')) systems.push('abacus')
  
  return systems
}

function parseRemarkType(code: string): string {
  // Look for RM pattern (miscellaneous) vs NP pattern (general)
  if (code.includes('f"RM')) return 'miscellaneous'
  if (code.includes('f"NP.')) return 'general'
  if (code.includes('f"5')) return 'general5'
  
  return 'general'
}

function parseRemarkContent(code: string): { category: string; remark: string } {
  // Parse from patterns like: f"RM{category}/{remark}" or f"NP.{category} {remark}"
  
  // Try miscellaneous pattern: RM{category}/{remark}
  const miscMatch = code.match(/f"RM([^/]*?)\/([^"]*?)"/);
  if (miscMatch) {
    return { category: miscMatch[1], remark: miscMatch[2] }
  }
  
  // Try general pattern: NP.{category} {remark}
  const genMatch = code.match(/f"NP\.([^\s]*?)\s([^"]*?)"/);
  if (genMatch) {
    return { category: genMatch[1], remark: genMatch[2] }
  }
  
  // Try worldspan pattern: just the remark
  const wsMatch = code.match(/worldspan_remark = "([^"]*?)"/);
  if (wsMatch) {
    return { category: '', remark: wsMatch[1] }
  }
  
  return { category: '', remark: '' }
}

function parseConditionType(code: string): string {
  if (code.includes('if not any(r.text == ')) {
    return 'not_exists'
  }
  
  if (code.includes('if not any(') && code.includes('in r.text for r in')) {
    return 'not_contained'
  }
  
  return 'always'
}

function parseNotContainedText(code: string): string {
  const match = code.match(/if not any\("([^"]*?)" in r\.text for r in/);
  return match ? match[1] : ''
}
```

## 🔄 **Generic Data Parser**

### **Fallback Parser for Simple Cases**
```typescript
// Generic parser when schema doesn't provide custom dataParser
private genericDataParser(code: string, schema: UnifiedSchema): Record<string, any> {
  const data: Record<string, any> = {}
  
  // Initialize with default values from schema
  schema.helperUI?.fields.forEach(field => {
    switch (field.type) {
      case 'checkboxGroup':
        data[field.name] = []
        break
      case 'checkbox':
        data[field.name] = false
        break
      case 'select':
      case 'radio':
        data[field.name] = field.options?.[0]?.value || ''
        break
      default:
        data[field.name] = ''
    }
  })
  
  // Try to extract values using common patterns
  schema.helperUI?.fields.forEach(field => {
    data[field.name] = this.extractFieldValue(code, field)
  })
  
  return data
}

private extractFieldValue(code: string, field: UIFieldSchema): any {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return this.extractStringValue(code, field.name)
      
    case 'checkbox':
      return this.extractBooleanValue(code, field.name)
      
    case 'select':
    case 'radio':
      return this.extractOptionValue(code, field)
      
    case 'checkboxGroup':
      return this.extractArrayValue(code, field)
      
    default:
      return ''
  }
}
```

## 🎨 **Modal Pre-population**

### **Helper Factory with Initial Data**
```typescript
// o-ui/src/components/auto-generated/code-helper/helper-factory.tsx
export function HelperFactory({
  schema,
  initialData, // Pre-populated form data from parsed code
  onCodeGenerated,
  onClose
}: HelperFactoryProps) {
  
  // Initialize form with existing data or defaults
  const { formData, updateField, validateForm } = useAutoForm(
    schema.helperUI?.fields || [],
    initialData // This comes from the data parser
  )
  
  // Show different title for editing vs creating
  const isEditing = Boolean(initialData && Object.keys(initialData).length > 0)
  const title = isEditing ? `Edit ${schema.name}` : `Create ${schema.name}`
  
  const handleSubmit = () => {
    if (validateForm()) {
      const result = SchemaFactory.generate({
        type: 'helper',
        schema,
        context: { helperParams: formData }
      })
      
      onCodeGenerated(result.code)
    }
  }
  
  return (
    <Modal isOpen={true} onClose={onClose}>
      <ModalHeader>
        {isEditing ? '✏️' : '➕'} {title}
      </ModalHeader>
      
      <ModalBody>
        {isEditing && (
          <Alert type="info">
            Editing existing helper. Current settings have been loaded.
          </Alert>
        )}
        
        <AutoForm
          fields={schema.helperUI?.fields || []}
          data={formData}
          onChange={updateField}
        />
      </ModalBody>
      
      <ModalFooter>
        <Button onClick={onClose} variant="secondary">Cancel</Button>
        <Button onClick={handleSubmit} variant="primary">
          {isEditing ? 'Update Helper' : 'Generate Code'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
```

### **Complete Edit Flow**
```typescript
// o-ui/src/components/editor/helpers/business-rules-editor-with-utility.tsx
export function BusinessRulesEditorWithUtility() {
  const [modalState, setModalState] = useState<HelperModalState>()
  const dataExtractor = useRef(new HelperDataExtractor())
  
  // Handle editing existing helper block
  const handleEditHelper = (helperBlock: HelperBlock) => {
    try {
      // Extract current data from the helper block
      const currentData = dataExtractor.current.extractHelperData(helperBlock)
      
      // Get the schema for this helper
      const schema = getSchemaById(helperBlock.schemaId)
      
      if (schema) {
        setModalState({
          schema,
          mode: 'edit',
          initialData: currentData, // Pre-populate form
          sourceBlock: helperBlock,
          onComplete: (newCode) => handleHelperUpdate(helperBlock, newCode),
          onCancel: () => setModalState(null)
        })
      }
    } catch (error) {
      console.error('Failed to extract helper data:', error)
      showErrorMessage('Unable to edit helper. The code may be corrupted.')
    }
  }
  
  // Update existing helper block with new code
  const handleHelperUpdate = (originalBlock: HelperBlock, newCode: string) => {
    const editor = editorRef.current
    if (!editor) return
    
    // Replace the content within the helper markers
    const newWrappedCode = wrapWithHelperMarkers(newCode, originalBlock.schemaId, originalBlock.id)
    
    editor.executeEdits('helper-update', [{
      range: originalBlock.range,
      text: newWrappedCode
    }])
    
    // Update the block tracking
    const updatedBlock = { ...originalBlock, generatedCode: newCode }
    helperBlockManager.current?.updateBlock(updatedBlock)
    
    setModalState(null)
  }
  
  return (
    <>
      <MonacoEditor 
        onMount={(editor) => {
          editorRef.current = editor
          setupHelperBlockHandlers(editor, handleEditHelper)
        }}
      />
      
      {modalState && (
        <HelperFactory
          schema={modalState.schema}
          initialData={modalState.initialData} // Form pre-populated
          onCodeGenerated={modalState.onComplete}
          onClose={modalState.onCancel}
        />
      )}
    </>
  )
}
```

## 🔧 **Advanced Parsing Techniques**

### **Multi-Line Pattern Matching**
```typescript
// Parse complex multi-line structures
function parseComplexStructure(code: string): any {
  const lines = code.split('\n')
  const data = {}
  
  let currentSection = null
  let indentLevel = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Detect section headers
    if (trimmed.startsWith('# ')) {
      currentSection = parseSectionHeader(trimmed)
      continue
    }
    
    // Parse assignments within sections
    if (trimmed.includes(' = ')) {
      const [key, value] = trimmed.split(' = ')
      data[key] = parseValue(value)
    }
    
    // Parse conditional structures
    if (trimmed.startsWith('if ')) {
      data.condition = parseCondition(trimmed)
    }
  }
  
  return data
}
```

### **Robust Error Handling**
```typescript
// Safe parsing with fallbacks
extractHelperDataSafely(helperBlock: HelperBlock): Record<string, any> {
  try {
    return this.extractHelperData(helperBlock)
  } catch (error) {
    console.warn('Primary data extraction failed, trying fallback:', error)
    
    try {
      // Fallback to generic extraction
      return this.genericDataParser(helperBlock.generatedCode, this.getSchema(helperBlock.schemaId))
    } catch (fallbackError) {
      console.error('All data extraction methods failed:', fallbackError)
      
      // Return empty form data as last resort
      return this.getDefaultFormData(helperBlock.schemaId)
    }
  }
}

private getDefaultFormData(schemaId: string): Record<string, any> {
  const schema = this.schemaRegistry.get(schemaId)
  const data: Record<string, any> = {}
  
  schema?.helperUI?.fields.forEach(field => {
    data[field.name] = this.getFieldDefaultValue(field)
  })
  
  return data
}
```

## 📊 **Testing Data Parsing**

### **Unit Tests for Parsers**
```typescript
// Test parsing accuracy
describe('HelperDataExtractor', () => {
  it('should parse Add Vendor Remark helper correctly', () => {
    const generatedCode = `
# Add Vendor Remark
amadeus_remark = f"RMT/TEST REMARK"
galileo_remark = f"RMT/TEST REMARK"

if not any(r.text == "TEST REMARK" for r in existing_remarks):
    add_remark_to_systems(["amadeus", "galileo"])
    `.trim()
    
    const extractor = new HelperDataExtractor()
    const result = extractor.extractHelperData({
      schemaId: 'find-remark-helper',
      generatedCode
    })
    
    expect(result).toEqual({
      systems: ['amadeus', 'galileo'],
      remarkType: 'miscellaneous',
      category: 'T',
      remark: 'TEST REMARK',
      condition: 'not_exists',
      isErrorRemark: false,
      notContainedText: ''
    })
  })
})
```

### **Visual Testing Component**
```typescript
// Test helper for visual verification
export function DataParsingTest() {
  const [testCode, setTestCode] = useState(sampleGeneratedCode)
  const [parsedData, setParsedData] = useState({})
  
  const handleParse = () => {
    const extractor = new HelperDataExtractor()
    try {
      const result = extractor.extractHelperData({
        schemaId: 'find-remark-helper',
        generatedCode: testCode
      })
      setParsedData(result)
    } catch (error) {
      setParsedData({ error: error.message })
    }
  }
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>Generated Code</h3>
        <textarea 
          value={testCode}
          onChange={(e) => setTestCode(e.target.value)}
          className="w-full h-64"
        />
        <button onClick={handleParse}>Parse Data</button>
      </div>
      
      <div>
        <h3>Extracted Form Data</h3>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(parsedData, null, 2)}
        </pre>
      </div>
    </div>
  )
}
```

## 🎯 **Best Practices**

### **1. Keep Parsers Simple**
- Design generated code to be easily parseable
- Use consistent patterns and naming
- Include metadata comments when helpful

### **2. Handle Edge Cases**
- Corrupted or modified code
- Missing required data
- Schema version mismatches

### **3. Provide Fallbacks**
- Generic parser for unknown patterns
- Default values for missing data
- User-friendly error messages

### **4. Test Thoroughly**
- Unit tests for all parser functions
- Integration tests for full edit flow
- Visual tests for complex cases

This data parsing system enables **seamless round-trip editing** where users can modify any helper through the same guided interface that created it, maintaining the no-code experience even for complex modifications. 