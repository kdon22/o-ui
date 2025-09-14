/**
 * AutoValue Service
 * 
 * Main service for generating auto-values from schema configurations.
 * Schema-driven, context-aware, and performance-optimized.
 */

import type { ResourceSchema } from './schemas'
import type { 
  AutoValueContext, 
  AutoValueResult, 
  AutoValueField,
  AutoValueSource
} from './auto-value-types'
import { autoValueGenerators, hasGenerator, getGenerator } from './auto-value-generators'

// ============================================================================
// AUTO-VALUE SERVICE CLASS
// ============================================================================

export class AutoValueService {
  private static instance: AutoValueService

  /**
   * Singleton instance
   */
  static getInstance(): AutoValueService {
    if (!AutoValueService.instance) {
      AutoValueService.instance = new AutoValueService()
    }
    return AutoValueService.instance
  }

  /**
   * Generate auto-values for a schema and input data
   */
  async generateAutoValues(
    schema: ResourceSchema,
    inputData: any,
    context: AutoValueContext
  ): Promise<AutoValueResult> {
    const startTime = performance.now()
    
    console.log('🏭 [AutoValueService] generateAutoValues ENTRY:', {
      schemaModelName: schema.modelName,
      schemaActionPrefix: schema.actionPrefix,
      inputDataKeys: Object.keys(inputData),
      inputDataId: inputData?.id,
      contextMode: context.mode,
      contextTenantId: context.tenantId,
      contextUserId: context.userId,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Extract autoValue fields from schema
      const autoValueFields = this.extractAutoValueFields(schema)
      
      console.log('🔍 [AutoValueService] Extracted autoValue fields:', {
        schemaModelName: schema.modelName,
        autoValueFieldsCount: autoValueFields.length,
        autoValueFields: autoValueFields.map(f => ({ key: f.key, source: f.autoValue.source })),
        timestamp: new Date().toISOString()
      });
      
      if (autoValueFields.length === 0) {
        console.log('⚠️ [AutoValueService] No autoValue fields found, returning input data as-is');
        // No autoValue fields, return input data as-is
        return {
          success: true,
          data: { ...inputData },
          metadata: {
            generatedFields: [],
            skippedFields: [],
            generationTime: performance.now() - startTime
          }
        }
      }

      console.log('🚀 [AutoValueService] Processing autoValue fields:', {
        fieldsCount: autoValueFields.length,
        inputDataKeys: Object.keys(inputData),
        timestamp: new Date().toISOString()
      });

      // Process autoValue fields
      const result = await this.processAutoValueFields(
        autoValueFields,
        inputData,
        context
      )
      
      console.log('✅ [AutoValueService] processAutoValueFields result:', {
        success: !!result,
        resultDataKeys: result?.data ? Object.keys(result.data) : null,
        resultDataId: result?.data?.id,
        generatedFields: result?.generatedFields,
        skippedFields: result?.skippedFields,
        timestamp: new Date().toISOString()
      });

      const endTime = performance.now()

      return {
        success: true,
        data: result.data,
        metadata: {
          generatedFields: result.generatedFields,
          skippedFields: result.skippedFields,
          generationTime: endTime - startTime
        }
      }

    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error during autoValue generation',
          originalError: error instanceof Error ? error : new Error(String(error))
        }
      }
    }
  }

  /**
   * Extract autoValue field configurations from schema
   */
  private extractAutoValueFields(schema: ResourceSchema): AutoValueField[] {
    const autoValueFields: AutoValueField[] = []

    if (!schema.fields || !Array.isArray(schema.fields)) {
      return autoValueFields
    }

    for (const field of schema.fields) {
      if (field.autoValue && field.autoValue.source) {
        // Normalize to AutoValueField type expected by generators
        autoValueFields.push({
          key: field.key,
          autoValue: {
            source: ((): any => {
              // Map legacy ContextSource strings to AutoValueSource where names diverge
              const src = field.autoValue.source as any
              if (src === 'session.user.branchContext.defaultBranchId') return 'context.defaultBranchId'
              return src
            })(),
            params: undefined,
            modes: undefined,
            condition: undefined
          }
        })
      }
    }

    return autoValueFields
  }

  /**
   * Process all autoValue fields
   */
  private async processAutoValueFields(
    autoValueFields: AutoValueField[],
    inputData: any,
    context: AutoValueContext
  ): Promise<{
    data: any
    generatedFields: string[]
    skippedFields: string[]
  }> {
      console.log('🔍 [AutoValueService] processAutoValueFields called:', {
      fieldsCount: autoValueFields.length,
        fields: autoValueFields.map(f => ({ key: f.key, source: f.autoValue.source })),
      hasNavigationContext: !!context.navigationContext,
      navigationContext: context.navigationContext,
      timestamp: new Date().toISOString()
    });
    
    const result = { ...inputData }
    const generatedFields: string[] = []
    const skippedFields: string[] = []

    // Schema-derived rule: derive executionMode from runOrder if present
    try {
      if (typeof result.runOrder === 'number') {
        result.executionMode = result.runOrder === 0 ? 'SYNC' : 'ASYNC'
      }
    } catch {}

    // Process each autoValue field
    for (const field of autoValueFields) {
      try {
        const shouldGenerate = this.shouldGenerateValue(field, result, context)
        
        console.log(`🔍 [AutoValueService] Processing field '${field.key}':`, {
          source: field.autoValue.source,
          shouldGenerate,
          currentValue: result[field.key],
          timestamp: new Date().toISOString()
        });
        
        if (!shouldGenerate) {
          skippedFields.push(field.key)
          continue
        }

        // Generate the value
        const generatedValue = await this.generateFieldValue(field, result, context)
        
        console.log(`🔍 [AutoValueService] Generated value for '${field.key}':`, {
          generatedValue,
          valueType: typeof generatedValue,
          timestamp: new Date().toISOString()
        });
        
        if (generatedValue !== undefined) {
          result[field.key] = generatedValue
          generatedFields.push(field.key)
        } else {
          skippedFields.push(field.key)
        }

      } catch (error) {
        console.warn(`⚠️ [AutoValueService] Failed to generate value for field '${field.key}':`, error)
        skippedFields.push(field.key)
      }
    }

    return {
      data: result,
      generatedFields,
      skippedFields
    }
  }

  /**
   * Determine if a value should be generated for a field
   */
  private shouldGenerateValue(
    field: AutoValueField,
    currentData: any,
    context: AutoValueContext
  ): boolean {
    // Skip if value already exists (unless it's an update mode field)
    if (currentData[field.key] !== undefined && currentData[field.key] !== null) {
      // Check if this is an update-only field (like updatedAt, updatedBy)
      const isUpdateField = field.autoValue.source === 'auto.timestamp' && 
        (field.key === 'updatedAt' || field.key.includes('updated'))
      
      if (!isUpdateField) {
        return false
      }
    }

    // Check mode restrictions
    if (field.autoValue.modes && !field.autoValue.modes.includes(context.mode)) {
      return false
    }

    // Check custom condition
    if (field.autoValue.condition && !field.autoValue.condition(context, currentData)) {
      return false
    }

    // Check if generator exists
    if (!hasGenerator(field.autoValue.source)) {
      console.warn(`⚠️ [AutoValueService] No generator found for source: ${field.autoValue.source}`)
      return false
    }

    return true
  }

  /**
   * Generate a value for a specific field
   */
  private async generateFieldValue(
    field: AutoValueField,
    currentData: any,
    context: AutoValueContext
  ): Promise<any> {
    const generator = getGenerator(field.autoValue.source)
    
    if (!generator) {
      throw new Error(`No generator found for source: ${field.autoValue.source}`)
    }

    try {
      const value = await generator(context, currentData, field.autoValue.params)
      return value
    } catch (error) {
      throw new Error(
        `Generator failed for field '${field.key}' with source '${field.autoValue.source}': ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  /**
   * Validate that all required autoValue fields are present
   */
  validateRequiredFields(
    schema: ResourceSchema,
    data: any,
    mode: 'create' | 'update' = 'create'
  ): { isValid: boolean; missingFields: string[] } {
    const autoValueFields = this.extractAutoValueFields(schema)
    const missingFields: string[] = []

    for (const field of autoValueFields) {
      // Skip fields that don't apply to this mode
      if (field.autoValue.modes && !field.autoValue.modes.includes(mode)) {
        continue
      }

      // Check if required field is missing
      if (data[field.key] === undefined || data[field.key] === null) {
        // Some fields are optional (like parentId for root nodes)
        const isOptional = field.key === 'parentId' || 
                          field.key === 'originalNodeId' ||
                          field.autoValue.source.startsWith('default.')
        
        if (!isOptional) {
          missingFields.push(field.key)
        }
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  /**
   * Get debug info about autoValue fields in a schema
   */
  getSchemaAutoValueInfo(schema: ResourceSchema): {
    totalFields: number
    autoValueFields: number
    sources: AutoValueSource[]
    fieldDetails: Array<{ key: string; source: AutoValueSource; hasGenerator: boolean }>
  } {
    const autoValueFields = this.extractAutoValueFields(schema)
    const sources = autoValueFields.map(f => f.autoValue.source)
    const uniqueSources = [...new Set(sources)] as AutoValueSource[]

    const fieldDetails = autoValueFields.map(field => ({
      key: field.key,
      source: field.autoValue.source,
      hasGenerator: hasGenerator(field.autoValue.source)
    }))

    return {
      totalFields: schema.fields?.length || 0,
      autoValueFields: autoValueFields.length,
      sources: uniqueSources,
      fieldDetails
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Convenience function to generate auto-values
 */
export async function generateAutoValues(
  schema: ResourceSchema,
  inputData: any,
  context: AutoValueContext
): Promise<AutoValueResult> {
  const service = AutoValueService.getInstance()
  return service.generateAutoValues(schema, inputData, context)
}

/**
 * Convenience function to validate required fields
 */
export function validateAutoValueFields(
  schema: ResourceSchema,
  data: any,
  mode: 'create' | 'update' = 'create'
): { isValid: boolean; missingFields: string[] } {
  const service = AutoValueService.getInstance()
  return service.validateRequiredFields(schema, data, mode)
}

/**
 * Convenience function to get schema autoValue info
 */
export function getSchemaAutoValueInfo(schema: ResourceSchema) {
  const service = AutoValueService.getInstance()
  return service.getSchemaAutoValueInfo(schema)
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Default export - singleton instance
 */
export default AutoValueService.getInstance()