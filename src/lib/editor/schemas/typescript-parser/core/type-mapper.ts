/**
 * 🎯 TYPE MAPPER - Convert TypeScript types to UnifiedType
 * 
 * Maps TS type system to business-friendly type system
 * Handles primitives, arrays, nested objects, unions
 * Small, focused file for type conversion logic
 */

import * as ts from 'typescript'
import { 
  UnifiedType, 
  UnifiedPrimitiveType, 
  UnifiedCollectionType,
  BusinessObjectType 
} from '../../types/unified-types'
import { TypeMappingContext, TypeMappingResult } from './types'

// =============================================================================
// MAIN TYPE MAPPING FUNCTIONS
// =============================================================================

/**
 * Map TypeScript type to UnifiedType
 */
export function mapTypeScriptType(
  typeNode: ts.TypeNode,
  typeChecker: ts.TypeChecker,
  context?: Partial<TypeMappingContext>
): UnifiedType {
  const fullContext: TypeMappingContext = {
    typeChecker,
    sourceFile: context?.sourceFile || {} as ts.SourceFile,
    currentInterface: context?.currentInterface,
    visitedTypes: context?.visitedTypes || new Set()
  }

  const result = mapTypeNode(typeNode, fullContext)
  return result.unifiedType
}

/**
 * Map type node with full context
 */
function mapTypeNode(
  typeNode: ts.TypeNode,
  context: TypeMappingContext
): TypeMappingResult {
  // Handle different TypeScript type kinds
  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return { unifiedType: 'string', dependencies: [], isComplex: false }
    
    case ts.SyntaxKind.NumberKeyword:
      return { unifiedType: 'number', dependencies: [], isComplex: false }
    
    case ts.SyntaxKind.BooleanKeyword:
      return { unifiedType: 'boolean', dependencies: [], isComplex: false }
    
    case ts.SyntaxKind.ArrayType:
      return mapArrayType(typeNode as ts.ArrayTypeNode, context)
    
    case ts.SyntaxKind.TypeReference:
      return mapTypeReference(typeNode as ts.TypeReferenceNode, context)
    
    case ts.SyntaxKind.UnionType:
      return mapUnionType(typeNode as ts.UnionTypeNode, context)
    
    case ts.SyntaxKind.LiteralType:
      return mapLiteralType(typeNode as ts.LiteralTypeNode, context)
    
    default:
      return { unifiedType: 'unknown', dependencies: [], isComplex: false }
  }
}

// =============================================================================
// SPECIFIC TYPE MAPPERS
// =============================================================================

/**
 * Map array types (T[])
 */
function mapArrayType(
  arrayType: ts.ArrayTypeNode,
  context: TypeMappingContext
): TypeMappingResult {
  const elementResult = mapTypeNode(arrayType.elementType, context)
  
  const collectionType: UnifiedCollectionType = {
    type: 'collection',
    elementType: elementResult.unifiedType,
    syntax: `<${getTypeDisplayName(elementResult.unifiedType)}>`
  }

  return {
    unifiedType: collectionType,
    dependencies: elementResult.dependencies,
    isComplex: true
  }
}

/**
 * Map type references (interface names, built-in types)
 */
function mapTypeReference(
  typeRef: ts.TypeReferenceNode,
  context: TypeMappingContext
): TypeMappingResult {
  const typeName = typeRef.typeName.getText()
  
  // Handle built-in types
  const builtInType = mapBuiltInType(typeName)
  if (builtInType) {
    return { unifiedType: builtInType, dependencies: [], isComplex: false }
  }

  // Handle generic array syntax (Array<T>)
  if (typeName === 'Array' && typeRef.typeArguments && typeRef.typeArguments.length > 0) {
    const elementResult = mapTypeNode(typeRef.typeArguments[0], context)
    
    const collectionType: UnifiedCollectionType = {
      type: 'collection',
      elementType: elementResult.unifiedType,
      syntax: `<${getTypeDisplayName(elementResult.unifiedType)}>`
    }

    return {
      unifiedType: collectionType,
      dependencies: elementResult.dependencies,
      isComplex: true
    }
  }

  // Handle business object types (interface references)
  return {
    unifiedType: typeName as BusinessObjectType,
    dependencies: [typeName],
    isComplex: true
  }
}

/**
 * Map union types (A | B)
 */
function mapUnionType(
  unionType: ts.UnionTypeNode,
  context: TypeMappingContext
): TypeMappingResult {
  // For now, take the first type in the union
  // TODO: Implement proper union type support
  if (unionType.types.length > 0) {
    return mapTypeNode(unionType.types[0], context)
  }
  
  return { unifiedType: 'unknown', dependencies: [], isComplex: false }
}

/**
 * Map literal types (string literals, number literals)
 */
function mapLiteralType(
  literalType: ts.LiteralTypeNode,
  context: TypeMappingContext
): TypeMappingResult {
  if (ts.isStringLiteral(literalType.literal)) {
    return { unifiedType: 'string', dependencies: [], isComplex: false }
  }
  
  if (ts.isNumericLiteral(literalType.literal)) {
    return { unifiedType: 'number', dependencies: [], isComplex: false }
  }
  
  return { unifiedType: 'unknown', dependencies: [], isComplex: false }
}

// =============================================================================
// BUILT-IN TYPE MAPPING
// =============================================================================

/**
 * Map built-in TypeScript types to UnifiedType
 */
function mapBuiltInType(typeName: string): UnifiedPrimitiveType | null {
  const builtInMap: Record<string, UnifiedPrimitiveType> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'Date': 'date',
    'object': 'object',
    'any': 'unknown',
    'unknown': 'unknown',
    'void': 'unknown',
    'null': 'null',
    'undefined': 'undefined'
  }

  return builtInMap[typeName] || null
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get display name for a unified type
 */
function getTypeDisplayName(type: UnifiedType): string {
  if (typeof type === 'string') {
    return type
  }
  
  if (typeof type === 'object' && type.type === 'collection') {
    return getTypeDisplayName(type.elementType)
  }
  
  return 'unknown'
}

/**
 * Check if a type is a primitive
 */
export function isPrimitiveTypeName(typeName: string): boolean {
  const primitives = ['string', 'number', 'boolean', 'Date', 'object', 'any', 'unknown', 'void']
  return primitives.includes(typeName)
}

/**
 * Check if a type is likely a business object
 */
export function isBusinessObjectTypeName(typeName: string): boolean {
  // Business objects typically start with uppercase
  return /^[A-Z][a-zA-Z0-9]*$/.test(typeName) && !isPrimitiveTypeName(typeName)
}
