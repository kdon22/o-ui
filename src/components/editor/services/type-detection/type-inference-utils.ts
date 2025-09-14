/**
 * 🔧 TYPE INFERENCE UTILITIES
 * 
 * Coordinates between type detection and method lookup for intelligent completions
 */

import { ALL_METHOD_SCHEMAS } from '@/lib/editor/schemas'
import { VariableTypeDetector } from './variable-type-detector'
import { ClassMemberExtractor, type ClassMember } from './class-member-extractor'

/**
 * Service that coordinates type detection and method lookup
 */
export class TypeInferenceUtils {
  private typeDetector: VariableTypeDetector
  private memberExtractor: ClassMemberExtractor

  constructor() {
    this.typeDetector = new VariableTypeDetector()
    this.memberExtractor = new ClassMemberExtractor()
  }

  /**
   * Detect variable type using the type detector
   */
  detectVariableType(variableName: string, fullCode: string): string {
    return this.typeDetector.detectVariableType(variableName, fullCode)
  }

  /**
   * Get methods available for a detected type
   */
  getMethodsForType(detectedType: string, fullCode: string): any[] {

    
    // If it's a user-defined class, extract its properties and methods from the code
    if (this.isUserDefinedType(detectedType)) {
      const classMethods = this.memberExtractor.extractClassMembers(detectedType, fullCode)
      if (classMethods.length > 0) {
        console.log(`🔍 [MethodsForType] Found ${classMethods.length} members for class ${detectedType}:`, classMethods.map(m => m.name))
        return classMethods
      }
    }
    
    // Fallback to schema-based methods for built-in types
    return this.getBuiltInMethods(detectedType)
  }

  /**
   * Check if a type is user-defined (class/enum) vs built-in
   */
  private isUserDefinedType(detectedType: string): boolean {
    const builtInTypes = ['unknown', 'str', 'int', 'bool', 'float', 'date', 'array', 'object']
    return detectedType && !builtInTypes.includes(detectedType)
  }

  /**
   * Get methods for built-in types from schemas
   */
  private getBuiltInMethods(detectedType: string): any[] {

    
    const filteredMethods = ALL_METHOD_SCHEMAS.filter(schema => {
      return schema.category === detectedType || 
             (detectedType === 'int' && (schema.category === 'number' || schema.category === 'validation')) ||
             (detectedType === 'str' && (schema.category === 'string' || schema.category === 'validation' || schema.category === 'encoding')) ||
             (detectedType === 'array' && schema.category === 'array') ||
             (detectedType === 'object' && schema.category === 'property')
    })
    
    console.log(`🔍 [MethodsForType] Found ${filteredMethods.length} methods for built-in type ${detectedType}:`, 
                filteredMethods.map(m => `${m.name} (${m.category})`))
    
    return filteredMethods
  }

  /**
   * Extract class members (wrapper for direct access)
   */
  extractClassMembers(className: string, fullCode: string): ClassMember[] {
    return this.memberExtractor.extractClassMembers(className, fullCode)
  }
}