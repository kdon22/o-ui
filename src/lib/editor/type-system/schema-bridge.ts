// Schema Bridge (SSOT): reads only from lib/editor/schemas
import { ALL_MODULE_SCHEMAS } from '@/lib/editor/schemas/modules'
import { ALL_METHOD_SCHEMAS } from '@/lib/editor/schemas/methods'
import { ALL_BUSINESS_OBJECT_SCHEMAS } from '@/lib/editor/schemas/business-objects'

export type BaseType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | string

export interface MethodSignature {
  name: string
  returnType: BaseType
  returnTypeRef?: string
  parameters?: Array<{ name: string; type: BaseType; typeRef?: string; required?: boolean }>
}

export interface SchemaBridge {
  getModuleReturnType(moduleName: string, methodName: string): BaseType | 'unknown'
  getModuleReturnTypeRef(moduleName: string, methodName: string): string | null
  getTypeMethodReturnType(baseType: BaseType, methodName: string): BaseType | 'unknown'
  getParametersForModuleMethod(moduleName: string, methodName: string): MethodSignature['parameters']
  getParametersForTypeMethod(baseType: BaseType, methodName: string): MethodSignature['parameters']
  getBusinessObjectPropertyType?(typeName: string, propName: string, allText?: string): string | 'unknown'
}

const moduleIndex: Record<string, Record<string, MethodSignature>> = {}
const typeMethodIndex: Record<string, Record<string, MethodSignature>> = {}

function normalizeModuleName(name: string): string {
  return name.toLowerCase()
}

for (const schema of ALL_MODULE_SCHEMAS as any[]) {
  // Use the new 'module' field if available, otherwise fall back to parsing examples
  let moduleName = ''
  if (schema.module) {
    moduleName = normalizeModuleName(schema.module)
  } else {
    const examples: string[] = schema.examples || []
    moduleName = examples.length > 0 ? normalizeModuleName(examples[0].split('.')[0]) : ''
  }
  
  if (!moduleName) continue
  if (!moduleIndex[moduleName]) moduleIndex[moduleName] = {}
  moduleIndex[moduleName][schema.name] = {
    name: schema.name,
    returnType: schema.returnType || (schema.returnInterface ? 'object' : 'unknown'), // ✅ Handle both returnType and returnInterface
    returnTypeRef: (schema as any).returnTypeRef || (schema as any).returnInterface, // ✅ Use returnInterface as returnTypeRef for complex objects
    parameters: schema.parameters?.map((p: any) => ({ name: p.name, type: typeof p.type === 'string' ? p.type : 'object', typeRef: (p as any).typeRef, required: p.required }))
  }
}

function categoryToBaseType(category: string): BaseType | null {
  const c = category.toLowerCase()
  if (['string', 'validation', 'formatting', 'encoding', 'property', 'conversion'].includes(c)) return 'string'
  if (['number', 'math', 'numeric', 'float', 'int'].includes(c)) return 'number'
  if (['boolean'].includes(c)) return 'boolean'
  if (['array', 'list', 'collection'].includes(c)) return 'array'
  if (['object', 'dict', 'dictionary', 'utility'].includes(c)) return 'object'
  if (['date'].includes(c)) return 'date'
  return null
}

for (const schema of ALL_METHOD_SCHEMAS as any[]) {
  const category = (schema.category as string | undefined) || ''
  const baseType = categoryToBaseType(category)
  if (!baseType) continue
  if (!typeMethodIndex[baseType]) typeMethodIndex[baseType] = {}
  typeMethodIndex[baseType][schema.name] = {
    name: schema.name,
    returnType: schema.returnType || (schema.returnInterface ? 'object' : 'unknown'), // ✅ Handle both returnType and returnInterface
    returnTypeRef: (schema as any).returnTypeRef || (schema as any).returnInterface, // ✅ Use returnInterface as returnTypeRef for complex objects
    parameters: schema.parameters?.map((p: any) => ({ name: p.name, type: typeof p.type === 'string' ? p.type : 'object', typeRef: (p as any).typeRef, required: p.required }))
  }
}

export const schemaBridge: SchemaBridge = {
  getModuleReturnType(moduleName: string, methodName: string) {
    const mod = moduleIndex[normalizeModuleName(moduleName)]
    const sig = mod?.[methodName]
    return sig?.returnType || 'unknown'
  },
  getModuleReturnTypeRef(moduleName: string, methodName: string) {
    const mod = moduleIndex[normalizeModuleName(moduleName)]
    const sig = mod?.[methodName]
    return sig?.returnTypeRef || null
  },
  getTypeMethodReturnType(baseType: BaseType, methodName: string) {
    const idx = typeMethodIndex[String(baseType)]
    const sig = idx?.[methodName]
    return sig?.returnType || 'unknown'
  },
  getParametersForModuleMethod(moduleName: string, methodName: string) {
    const mod = moduleIndex[normalizeModuleName(moduleName)]
    return mod?.[methodName]?.parameters || []
  },
  getParametersForTypeMethod(baseType: BaseType, methodName: string) {
    const idx = typeMethodIndex[String(baseType)]
    return idx?.[methodName]?.parameters || []
  },
  getBusinessObjectPropertyType(typeName: string, propName: string, allText?: string) {
    try {
      if (!allText) return 'unknown'

      // First try BusinessObjectRegistry (fast path: classes, modules, top-level BOs)
      try {
        const { createBusinessObjectRegistry } = require('@/lib/editor/type-system/business-object-registry')
        const reg = createBusinessObjectRegistry(allText)
        const boType = reg.getPropertyType(typeName, propName)
        if (boType && boType !== 'unknown') {
          return boType
        }
      } catch {}

      // Fallback: Use NestedTypeFactory (sync, if already initialized) to resolve
      // interfaces like AccountingEntry → source: SourceAttribution
      try {
        const { getReadyNestedTypeFactory } = require('@/lib/editor/type-system/nested-type-factory')
        const factory = getReadyNestedTypeFactory(allText)
        if (!factory) return 'unknown'
        const typeDef = factory.getType(typeName)
        if (!typeDef) return 'unknown'
        const prop = typeDef.properties.find((p: { name: string; type?: string; elementType?: string }) => p.name === propName)
        if (!prop) return 'unknown'
        return String(prop.elementType || prop.type || 'unknown')
      } catch {
        return 'unknown'
      }
    } catch {
      return 'unknown'
    }
  }
}

// Additional helper for collections: read from business object schemas
export function getCollectionElementType(typeName: string, propName: string): string | 'unknown' {
  try {
    const schema = ALL_BUSINESS_OBJECT_SCHEMAS.find(s => s.name === typeName)
    if (!schema) return 'unknown'
    const prop = (schema.properties as any)[propName]
    if (prop && prop.isCollection && prop.elementType) {
      return String(prop.elementType)
    }
    return 'unknown'
  } catch {
    return 'unknown'
  }
}


