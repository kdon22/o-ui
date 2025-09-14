/**
 * 🎯 DYNAMIC TYPE SYSTEM - Core Type Definitions
 * 
 * Supports both user-defined classes and built-in types for the Deep Type Inference Engine.
 * Handles Ruby-style methods, collections, enums, and nested business objects.
 */

// =============================================================================
// CORE TYPE SYSTEM INTERFACES
// =============================================================================

/**
 * Base interface for all business object schemas (static or dynamic)
 */
export interface BusinessObjectSchema {
  name: string
  properties: PropertyMap
  methods?: MethodMap  
  relationships?: RelationshipMap
  description?: string
  isUserDefined?: boolean  // true for class-parsed schemas
  sourceLocation?: { line: number; column: number }
}

/**
 * Property definition within a business object
 */
export interface PropertyDefinition {
  name: string
  type: PropertyType
  nullable: boolean
  description: string
  examples?: string[]
  readonly?: boolean
  isCollection?: boolean     // true for <ClassName> syntax
  elementType?: PropertyType // type inside collections
}

/**
 * Method definition within a business object
 */
export interface MethodDefinition {
  name: string
  returnType: PropertyType
  returnInterface?: string    // Interface name for complex return types (e.g., 'StringSplitResult')
  parameters?: ParameterDefinition[]
  description: string
  examples?: string[]
  category: string
  hasParentheses?: boolean   // Ruby-style vs traditional
  isUserDefined?: boolean    // true for class-parsed methods
}

/**
 * Parameter definition for business object methods
 */
export interface ParameterDefinition {
  name: string
  type: PropertyType
  optional?: boolean
  description?: string
  defaultValue?: any
}

/**
 * Relationship definition between business objects
 */
export interface RelationshipDefinition {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  target: string // Target business object name
  description: string
}

// =============================================================================
// TYPE SYSTEM MAPS
// =============================================================================

export type PropertyMap = Record<string, PropertyDefinition>
export type MethodMap = Record<string, MethodDefinition>  
export type RelationshipMap = Record<string, RelationshipDefinition>

// =============================================================================
// DYNAMIC PROPERTY TYPE SYSTEM
// =============================================================================

/**
 * All possible property types in the business domain
 */
export type PropertyType = 
  | PrimitiveType 
  | BusinessObjectType
  | CollectionType
  | EnumType
  | UnionType

/**
 * Primitive data types (business-friendly names)
 */
export type PrimitiveType =
  | 'string'   // Direct string type
  | 'number'   // Direct number type
  | 'boolean'  // Direct boolean type
  | 'float'    // Direct float type (separate from number)
  | 'date'     // Direct date type
  | 'dictionary' // Direct dictionary type
  | 'array'    // Direct array type
  | 'object'   // Generic object
  | 'undefined' // Undefined type
  | 'null'     // Null type
  | 'unknown'  // Unknown type

  // Legacy support (for migration)
  | 'str'      // Legacy: use 'string'
  | 'int'      // Legacy: use 'number'
  | 'bool'     // Legacy: use 'boolean'
  | 'list'     // Legacy: use 'array'
  | 'dict'     // Legacy: use 'dictionary'

/**
 * Business object type references (user-defined classes)
 */
export type BusinessObjectType = string  // Dynamic - any class name

/**
 * Collection type for <ClassName> syntax
 */
export interface CollectionType {
  type: 'collection'
  elementType: PropertyType
  syntax: string  // e.g. '<Passenger>'
}

/**
 * Enum type for choice lists
 */
export interface EnumType {
  type: 'enum'
  name: string
  values: string[]
}

/**
 * Union type for multiple possible types
 */  
export interface UnionType {
  type: 'union'
  types: PropertyType[]
}

// =============================================================================
// TYPE INFERENCE CONTEXT
// =============================================================================

/**
 * Information about inferred variable types
 */
export interface InferredTypeInfo {
  name: string
  type: PropertyType
  source: InferenceSource
  confidence: number // 0-1 confidence score
  context?: InferenceContext
  isUserDefinedClass?: boolean
}

/**
 * Source of type inference
 */
export type InferenceSource = 
  | 'literal_assignment'    // user = "John"
  | 'class_definition'      // class Passenger { ... }
  | 'business_object'       // passenger.name  
  | 'method_return'         // getDisplayName -> str
  | 'property_access'       // object.property
  | 'collection_access'     // items[0] or <ClassName>
  | 'loop_variable'         // for passenger in passengers
  | 'enum_value'            // Status.Active
  | 'parameter'             // function parameter
  | 'variable_completion'   // Partial variable match for completion
  | 'unknown'

/**
 * Context information for type inference
 */
export interface InferenceContext {
  parentType?: PropertyType
  propertyChain?: string[]
  methodChain?: string[]
  loopContext?: LoopContext
  classDefinitions?: Record<string, BusinessObjectSchema>
  enumDefinitions?: Record<string, EnumType>
}

/**
 * Loop context for variable inference
 */
export interface LoopContext {
  variable: string
  collection: string
  collectionType: PropertyType
  elementType?: PropertyType
}

// =============================================================================
// COMPLETION SYSTEM TYPES  
// =============================================================================

/**
 * Enhanced completion item with business object context
 */
export interface BusinessObjectCompletion {
  label: string
  type: PropertyType
  kind: 'property' | 'method' | 'variable' | 'object' | 'enum' | 'class'
  description: string
  examples?: string[]
  insertText?: string
  snippet?: boolean
  documentation?: string
  confidence: number
  isUserDefined?: boolean
  hasParentheses?: boolean  // Ruby-style vs traditional methods
}

/**
 * Completion context for intelligent suggestions
 */
export interface CompletionContext {
  currentType?: PropertyType
  propertyChain: string[]
  textBeforeCursor: string
  allText: string
  position: { line: number; column: number }
  classDefinitions?: Record<string, BusinessObjectSchema>
  enumDefinitions?: Record<string, EnumType>
  globalVariables?: Record<string, any>  // ✅ Global variables merged into context
}

// =============================================================================
// SCHEMA GENERATION TYPES
// =============================================================================

/**
 * Result of parsing business classes from code
 */
export interface ClassParseResult {
  classes: BusinessObjectSchema[]
  enums: EnumType[]
  errors: ParseError[]
  warnings: ParseWarning[]
}

/**
 * Error from parsing business classes
 */
export interface ParseError {
  message: string
  line: number
  column: number
  type: 'syntax' | 'type' | 'semantic'
  severity: 'error' | 'warning'
}

/**
 * Warning from parsing business classes
 */
export interface ParseWarning {
  message: string
  line: number
  column: number
  type: 'style' | 'best-practice' | 'performance'
}

// =============================================================================
// HELPER TYPE UTILITIES
// =============================================================================

/**
 * Type guard for business object types
 */
export function isBusinessObjectType(type: PropertyType): type is BusinessObjectType {
  return typeof type === 'string' && 
         !isPrimitiveType(type) && 
         !isCollectionType(type) && 
         !isEnumType(type) && 
         !isUnionType(type);
}

/**
 * Type guard for collection types
 */
export function isCollectionType(type: PropertyType): type is CollectionType {
  return typeof type === 'object' && type !== null && 'type' in type && type.type === 'collection';
}

/**
 * Type guard for enum types
 */
export function isEnumType(type: PropertyType): type is EnumType {
  return typeof type === 'object' && type !== null && 'type' in type && type.type === 'enum';
}

/**
 * Type guard for union types
 */
export function isUnionType(type: PropertyType): type is UnionType {
  return typeof type === 'object' && type !== null && 'type' in type && type.type === 'union';
}

/**
 * Type guard for primitive types
 */
export function isPrimitiveType(type: PropertyType): type is PrimitiveType {
  const primitives: PrimitiveType[] = ['str', 'int', 'bool', 'float', 'date', 'object', 'unknown'];
  return typeof type === 'string' && primitives.includes(type as PrimitiveType);
}

/**
 * Extract element type from collection type
 */
export function getCollectionElementType(type: CollectionType): PropertyType {
  return type.elementType;
}

/**
 * Convert property type to string representation
 */
export function propertyTypeToString(type: PropertyType): string {
  if (typeof type === 'string') {
    return type;
  }
  
  if (isCollectionType(type)) {
    return `<${propertyTypeToString(type.elementType)}>`;
  }
  
  if (isEnumType(type)) {
    return type.name;
  }
  
  if (isUnionType(type)) {
    return type.types.map(propertyTypeToString).join(' | ');
  }
  
  return 'unknown';
}

/**
 * Create collection type from element type
 */
export function createCollectionType(elementType: PropertyType): CollectionType {
  return {
    type: 'collection',
    elementType,
    syntax: `<${propertyTypeToString(elementType)}>`
  };
}

/**
 * Create enum type from name and values
 */
export function createEnumType(name: string, values: string[]): EnumType {
  return {
    type: 'enum',
    name,
    values
  };
}

/**
 * Map business-friendly types to JavaScript types
 */
export const PRIMITIVE_TYPE_MAPPING: Record<string, string> = {
  // New direct types
  'string': 'string',
  'number': 'number',
  'boolean': 'boolean',
  'float': 'number', // Keep as number for JS compatibility
  'date': 'Date',
  'dictionary': 'object',
  'array': 'Array',
  'object': 'object',
  'undefined': 'undefined',
  'null': 'null',
  'unknown': 'unknown',

  // Legacy support
  'str': 'string',
  'int': 'number',
  'bool': 'boolean',
  'list': 'Array',
  'dict': 'object'
};

/**
 * Get JavaScript type name for business type
 */
export function getJavaScriptType(businessType: PrimitiveType): string {
  return PRIMITIVE_TYPE_MAPPING[businessType] || 'unknown';
} 