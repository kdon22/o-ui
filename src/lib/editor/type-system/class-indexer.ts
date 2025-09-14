// Lightweight in-model class indexer (SSOT)
export interface IndexedClass {
  name: string
  properties: Array<{ name: string; type?: string; description?: string }>
  actions: Array<{ name: string; returnType?: string; parameters?: Array<{ name: string; type?: string; optional?: boolean }>; description?: string }>
}

export class ClassIndexer {
  static index(allText: string): Record<string, IndexedClass> {
    console.log(`[ClassIndexer] Starting index of text with ${allText.length} characters`)
    const result: Record<string, IndexedClass> = {}
    const lines = allText.split('\n')
    console.log(`[ClassIndexer] Processing ${lines.length} lines`)
    let i = 0

    while (i < lines.length) {
      const line = lines[i]
      const classMatch = line.match(/^\s*class\s+([A-Z][A-Za-z0-9_]*)\s*\{\s*$/)
      if (!classMatch) { i++; continue }
      const className = classMatch[1]
      console.log(`[ClassIndexer] Found class: ${className}`)
      const props: IndexedClass['properties'] = []
      const actions: IndexedClass['actions'] = []

      i++
      while (i < lines.length) {
        const l = lines[i]
        if (/^\s*\}\s*$/.test(l)) { break }

        const assign = l.match(/^\s*([a-zA-Z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*(?:\/\/.*)?$/)
        if (assign) {
          const name = assign[1]
          const rhs = assign[2].trim()
          let typeToken: string | undefined
          const collection = rhs.match(/^<\s*([^>]+)\s*>$/)
          const ctor = rhs.match(/^([A-Z][A-Za-z0-9_]*)\s*\(\s*\)\s*$/)
          const bareType = rhs.match(/^([A-Z][A-Za-z0-9_]*)$/)
          if (collection) typeToken = `<${collection[1]}>`
          else if (ctor) typeToken = ctor[1]
          else if (bareType) typeToken = bareType[1]
          else if (/^['"][\s\S]*['"]$/.test(rhs)) typeToken = 'str'
          else if (/^\d+(?:\.\d+)?$/.test(rhs)) typeToken = rhs.includes('.') ? 'float' : 'int'
          else if (/^(true|false)$/.test(rhs)) typeToken = 'bool'
          else typeToken = undefined
          if (name) props.push({ name, type: typeToken })
          i++; continue
        }

        const actionArrow = l.match(/^\s*([a-zA-Z_][A-Za-z0-9_]*)\s*->\s*([A-Za-z_][A-Za-z0-9_]*)\s*$/)
        if (actionArrow) {
          const [, name, returnType] = actionArrow
          actions.push({ name, returnType })
          i++; continue
        }

        const actionParen = l.match(/^\s*([a-zA-Z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*->\s*([A-Za-z_][A-Za-z0-9_]*)\s*$/)
        if (actionParen) {
          const [, name, paramsText, returnType] = actionParen
          const params = paramsText
            ? paramsText.split(',').map(p => p.trim()).filter(Boolean).map(p => ({ name: p }))
            : []
          actions.push({ name, returnType, parameters: params })
          i++; continue
        }

        i++
      }

      result[className] = { name: className, properties: props, actions }
      console.log(`[ClassIndexer] Indexed class ${className} with ${props.length} properties and ${actions.length} actions`)
      while (i < lines.length && !/^\s*\}\s*$/.test(lines[i])) i++
      if (i < lines.length) i++
    }

    console.log(`[ClassIndexer] Final result:`, Object.keys(result))
    return result
  }
}


