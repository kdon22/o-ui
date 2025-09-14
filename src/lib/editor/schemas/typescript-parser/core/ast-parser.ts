/**
 * 🎯 TYPESCRIPT AST PARSER - Core parsing logic
 * 
 * Uses TypeScript Compiler API to parse interface files
 * Focused on extracting interface definitions only
 * Small, focused file handling AST traversal
 */

import * as ts from 'typescript'
import { 
  ParsedInterface, 
  TypeScriptParseResult, 
  ParseError, 
  SourceLocation,
  InterfaceProperty,
  InterfaceMethod
} from './types'
import { mapTypeScriptType } from './type-mapper'

// =============================================================================
// MAIN PARSING FUNCTIONS
// =============================================================================

/**
 * Parse TypeScript source code and extract all interfaces
 */
export function parseTypeScriptInterfaces(
  sourceCode: string,
  fileName: string = 'schema.ts'
): TypeScriptParseResult {
  const errors: ParseError[] = []
  
  try {
    // Create TypeScript source file
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    )

    // Create program and type checker for advanced type resolution
    const program = ts.createProgram([fileName], {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.CommonJS,
      allowJs: false,
      declaration: false,
      skipLibCheck: true
    }, {
      getSourceFile: (name) => name === fileName ? sourceFile : undefined,
      writeFile: () => {},
      getCurrentDirectory: () => '',
      getDirectories: () => [],
      fileExists: () => true,
      readFile: () => '',
      getCanonicalFileName: (name) => name,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n'
    })

    const typeChecker = program.getTypeChecker()

    // Extract all interface declarations
    const interfaces = extractInterfaceDeclarations(sourceFile, typeChecker)

    return {
      interfaces,
      errors,
      warnings: [],
      sourceFile,
      typeChecker
    }

  } catch (error) {
    errors.push({
      message: `Failed to parse TypeScript: ${error instanceof Error ? error.message : 'Unknown error'}`,
      location: { line: 1, column: 1, fileName },
      severity: 'error'
    })

    return {
      interfaces: [],
      errors,
      warnings: [],
      sourceFile: ts.createSourceFile(fileName, '', ts.ScriptTarget.Latest),
      typeChecker: {} as ts.TypeChecker
    }
  }
}

/**
 * Extract all interface declarations from AST
 */
export function extractInterfaceDeclarations(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
): ParsedInterface[] {
  const interfaces: ParsedInterface[] = []

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      const parsedInterface = parseInterfaceDeclaration(node, sourceFile, typeChecker)
      if (parsedInterface) {
        interfaces.push(parsedInterface)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return interfaces
}

// =============================================================================
// INTERFACE PARSING
// =============================================================================

/**
 * Parse a single interface declaration
 */
function parseInterfaceDeclaration(
  node: ts.InterfaceDeclaration,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
): ParsedInterface | null {
  try {
    const name = node.name.text
    const location = getSourceLocation(node, sourceFile)
    
    // Extract properties
    const properties = extractProperties(node, sourceFile, typeChecker)
    
    // Extract methods (if any)
    const methods = extractMethods(node, sourceFile, typeChecker)
    
    // Extract extends clause
    const extendsClause = node.heritageClauses?.find(
      clause => clause.token === ts.SyntaxKind.ExtendsKeyword
    )
    const extends_ = extendsClause?.types.map(type => type.expression.getText()) || []

    // Extract documentation
    const documentation = extractDocumentation(node)

    return {
      name,
      properties,
      methods,
      extends: extends_,
      location,
      documentation
    }

  } catch (error) {
    console.warn(`Failed to parse interface: ${error}`)
    return null
  }
}

/**
 * Extract properties from interface
 */
function extractProperties(
  node: ts.InterfaceDeclaration,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
): InterfaceProperty[] {
  const properties: InterfaceProperty[] = []

  for (const member of node.members) {
    if (ts.isPropertySignature(member) && member.name) {
      const property = parsePropertySignature(member, sourceFile, typeChecker)
      if (property) {
        properties.push(property)
      }
    }
  }

  return properties
}

/**
 * Parse a property signature
 */
function parsePropertySignature(
  member: ts.PropertySignature,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
): InterfaceProperty | null {
  try {
    const name = member.name?.getText() || 'unknown'
    const optional = !!member.questionToken
    const readonly = member.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ReadonlyKeyword) || false
    const location = getSourceLocation(member, sourceFile)
    const documentation = extractDocumentation(member)

    if (!member.type) {
      return null
    }

    // Map TypeScript type to unified type
    const unifiedType = mapTypeScriptType(member.type, typeChecker)

    return {
      name,
      type: member.type,
      unifiedType,
      optional,
      readonly,
      location,
      documentation
    }

  } catch (error) {
    console.warn(`Failed to parse property: ${error}`)
    return null
  }
}

/**
 * Extract methods from interface (for future use)
 */
function extractMethods(
  node: ts.InterfaceDeclaration,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
): InterfaceMethod[] {
  // For now, return empty array
  // Can be extended later to handle method signatures
  return []
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get source location from AST node
 */
function getSourceLocation(node: ts.Node, sourceFile: ts.SourceFile): SourceLocation {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
  return {
    line: line + 1,
    column: character + 1,
    fileName: sourceFile.fileName
  }
}

/**
 * Extract JSDoc documentation from node
 */
function extractDocumentation(node: ts.Node): string | undefined {
  const jsDoc = (node as any).jsDoc
  if (jsDoc && jsDoc.length > 0) {
    return jsDoc[0].comment || undefined
  }
  return undefined
}
