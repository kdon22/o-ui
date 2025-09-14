// BusinessObjectRegistry (SSOT)
import { ClassIndexer } from '@/lib/editor/type-system/class-indexer'
import { ALL_MODULE_SCHEMAS } from '@/lib/editor/schemas/modules'
import { ALL_BUSINESS_OBJECT_SCHEMAS } from '@/lib/editor/schemas/business-objects'

export interface BOProperty { name: string; type: string; description?: string }
export interface BOMethod { name: string; returnType: string; returnInterface?: string; parameters?: Array<{ name: string; type?: string; optional?: boolean }>; description?: string }
export interface BOType { name: string; properties: BOProperty[]; methods: BOMethod[] }

const PRIMITIVE_NORMALIZE: Record<string, string> = {
  str: 'string',
  int: 'number',
  bool: 'boolean',
  float: 'number',
  date: 'date',
}

function normalizeType(t?: string): string {
  if (!t) return 'unknown'
  const collectionMatch = t.trim().match(/^<\s*([^>]+)\s*>$/)
  const token = collectionMatch ? collectionMatch[1] : t
  const simple = token.replace(/\s+/g, '')
  return PRIMITIVE_NORMALIZE[simple] || simple
}

export class BusinessObjectRegistry {
  private map: Record<string, BOType> = {}

  constructor(allText: string) {
    this.buildFromClasses(allText)
    this.addModuleReturnObjects()
    this.addGlobalBusinessObjects()
  }

  private buildFromClasses(allText: string) {
    const classes = ClassIndexer.index(allText)
    for (const [name, cls] of Object.entries(classes)) {
      const properties: BOProperty[] = cls.properties.map(p => ({
        name: p.name,
        type: normalizeType(p.type),
        description: p.description
      }))
      const methods: BOMethod[] = cls.actions.map(a => ({
        name: a.name,
        returnType: normalizeType(a.returnType),
        parameters: a.parameters?.map(p => ({ name: p.name, type: normalizeType((p as any).type), optional: (p as any).optional })),
        description: a.description
      }))
      this.map[name] = { name, properties, methods }
    }
  }

  private addModuleReturnObjects() {
    console.log('[BusinessObjectRegistry] Processing module return objects...')
    for (const schema of ALL_MODULE_SCHEMAS as any[]) {
      const retObj = (schema as any).returnObject as undefined | { name: string; properties?: Record<string, string>; methods?: any[] }
      console.log(`[BusinessObjectRegistry] Processing schema ${schema.id}, returnObject:`, retObj)
      if (!retObj || !retObj.name) {
        console.log(`[BusinessObjectRegistry] Skipping schema ${schema.id} - no returnObject or name`)
        continue
      }
      if (!this.map[retObj.name]) {
        console.log(`[BusinessObjectRegistry] Creating new entry for ${retObj.name}`)
        const properties: BOProperty[] = Object.entries(retObj.properties || {}).map(([k, v]) => ({ name: k, type: normalizeType(String(v)) }))
        const methods: BOMethod[] = (retObj.methods || []).map((m: any) => ({ name: m.name, returnType: normalizeType(m.returnType), parameters: m.parameters, description: m.description }))
        this.map[retObj.name] = { name: retObj.name, properties, methods }
        console.log(`[BusinessObjectRegistry] Created ${retObj.name} with ${properties.length} properties:`, properties)
      } else {
        console.log(`[BusinessObjectRegistry] Merging with existing entry for ${retObj.name}`)
        const existing = this.map[retObj.name]
        const newProps = Object.entries(retObj.properties || {}).map(([k, v]) => ({ name: k, type: normalizeType(String(v)) }))
        const mergedProps = [...existing.properties]
        for (const p of newProps) {
          if (!mergedProps.find(mp => mp.name === p.name)) mergedProps.push(p)
        }
        existing.properties = mergedProps
        const newMethods: BOMethod[] = (retObj.methods || []).map((m: any) => ({ name: m.name, returnType: normalizeType(m.returnType), parameters: m.parameters, description: m.description }))
        for (const m of newMethods) {
          if (!existing.methods.find(mm => mm.name === m.name)) existing.methods.push(m)
        }
      }
    }
    console.log('[BusinessObjectRegistry] Final registry map:', Object.keys(this.map))
  }

  private addGlobalBusinessObjects() {
    // Add global business objects (like UTR) to the registry
    for (const schema of ALL_BUSINESS_OBJECT_SCHEMAS) {
      if (!this.map[schema.name]) {
        const properties: BOProperty[] = Object.values(schema.properties).map(prop => ({
          name: prop.name,
          type: normalizeType(typeof prop.type === 'string' ? prop.type : prop.type.toString()),
          description: prop.description
        }))
        
        const methods: BOMethod[] = schema.methods ? Object.values(schema.methods).map(method => ({
          name: method.name,
          returnType: normalizeType(typeof method.returnType === 'string' ? method.returnType : method.returnType.toString()),
          parameters: method.parameters?.map(param => ({
            name: param.name,
            type: normalizeType(typeof param.type === 'string' ? param.type : param.type.toString()),
            optional: param.optional
          })),
          description: method.description
        })) : []
        
        this.map[schema.name] = { name: schema.name, properties, methods }
      }
    }
  }

  getType(name: string): BOType | undefined {
    return this.map[name]
  }

  getPropertyType(typeName: string, propName: string): string | undefined {
    const t = this.map[typeName]
    return t?.properties.find(p => p.name === propName)?.type
  }

  getAllTypes(): string[] {
    return Object.keys(this.map)
  }
}

export function createBusinessObjectRegistry(allText: string): BusinessObjectRegistry {
  return new BusinessObjectRegistry(allText)
}


