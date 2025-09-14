// Single factory for ALL generation - methods, helpers, debug mappings, UI
// This is the heart of the schema-driven system

import type { 
  SchemaFactoryConfig, 
  GenerationResult, 
  UnifiedSchema,
  GenerationContext,
  UIFieldSchema 
} from './types'

export class SchemaFactory {
  
  /**
   * Main generation entry point - handles both methods and helpers
   */
  static generate(config: SchemaFactoryConfig): GenerationResult {
    const { schema, context } = config
    
    // Generate Python code using schema's generator with debug context
    const debugContext = {
      mode: 'debug' as const,
      useHelpers: true,
      lineNumber: context.lineNumber,
      sourceText: context.sourceText
    }
    
    const code = schema.pythonGenerator(
      context.variable,
      context.resultVar,
      context.helperParams || context.parameters,
      debugContext
    )
    
    // Extract imports
    const imports = schema.pythonImports || []
    
    // Generate debug info
    const debugInfo = this.generateDebugInfo(schema, code, context)
    
    return {
      code: this.cleanPythonCode(code),
      imports: this.deduplicateImports(imports),
      debugInfo
    }
  }
  
  /**
   * Generate Monaco IntelliSense completion items from method schemas
   */
  static generateMonacoCompletions(schemas: UnifiedSchema[], monaco: any) {
    return schemas
      .filter(schema => schema.type === 'method')
      .map(schema => ({
        label: schema.name,
        kind: monaco.languages.CompletionItemKind.Method,
        documentation: {
          value: this.generateDocumentation(schema)
        },
        detail: schema.description,
        insertText: this.generateInsertText(schema),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: null // Will be set by Monaco
      }))
  }
  
  /**
   * Generate helper UI configuration from helper schemas
   */
  static generateHelperUI(schema: UnifiedSchema) {
    if (schema.type !== 'helper' || !schema.helperUI) {
      throw new Error(`Schema ${schema.id} is not a helper or missing helperUI config`)
    }
    
    return {
      id: schema.id,
      title: schema.helperUI.title,
      description: schema.helperUI.description,
      category: schema.helperUI.category,
      fields: schema.helperUI.fields,
      onGenerate: (formData: Record<string, any>) => {
        return this.generate({
          type: 'helper',
          schema,
          context: {
            variable: '', // Not used for helpers
            helperParams: formData
          }
        })
      }
    }
  }
  
  /**
   * Convert schema UI fields to auto-form compatible schema
   */
  static convertToAutoFormSchema(fields: UIFieldSchema[]) {
    return fields.map(field => ({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required || false,
      options: field.options,
      placeholder: field.placeholder,
      description: field.description,
      validation: field.validation
    }))
  }
  
  /**
   * Generate debug mapping information
   */
  private static generateDebugInfo(schema: UnifiedSchema, code: string, context: GenerationContext) {
    // Auto-generate variable watches from context and code analysis
    const variableWatches = [
      context.variable,
      context.resultVar,
      ...Object.keys(context.parameters || {}),
      ...Object.keys(context.helperParams || {})
    ].filter((v): v is string => Boolean(v))
    
    // Simple breakpoint hints based on line count
    const lineCount = code.split('\n').length
    const breakpointHints = lineCount > 1 ? [1, lineCount] : [1]
    
    return {
      variableWatches,
      breakpointHints,
      ...schema.debugConfig
    }
  }
  
  /**
   * Generate documentation for Monaco hover
   */
  private static generateDocumentation(schema: UnifiedSchema): string {
    let doc = `**${schema.name}** - ${schema.description}\n\n`
    
    if (schema.parameters && schema.parameters.length > 0) {
      doc += '**Parameters:**\n'
      schema.parameters.forEach(param => {
        doc += `- \`${param.name}\` (${param.type}${param.required ? '' : '?'}): ${param.description || ''}\n`
      })
      doc += '\n'
    }
    
    if (schema.examples && schema.examples.length > 0) {
      doc += '**Examples:**\n'
      schema.examples.forEach(example => {
        doc += `- \`${example}\`\n`
      })
    }
    
    return doc
  }
  
  /**
   * Generate Monaco insert text with parameter placeholders
   */
  private static generateInsertText(schema: UnifiedSchema): string {
    if (!schema.parameters || schema.parameters.length === 0) {
      return schema.name
    }
    
    const params = schema.parameters.map((param, index) => {
      const placeholder = param.defaultValue !== undefined 
        ? param.defaultValue 
        : `\${${index + 1}:${param.name}}`
      return placeholder
    }).join(', ')
    
    return `${schema.name}(${params})`
  }
  
  /**
   * Clean up generated Python code
   */
  private static cleanPythonCode(code: string): string {
    return code
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim()
  }
  
  /**
   * Remove duplicate imports
   */
  private static deduplicateImports(imports: string[]): string[] {
    return [...new Set(imports)]
  }
} 