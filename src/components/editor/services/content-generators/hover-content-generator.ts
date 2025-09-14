/**
 * 🎨 HOVER CONTENT GENERATOR
 * 
 * Generate rich hover content for variables and methods
 */

import type { UnifiedSchema } from '@/lib/editor/schemas'

/**
 * Service for generating hover content
 */
export class HoverContentGenerator {

  /**
   * Generate hover content for variables (type info + available methods)
   */
  generateVariableHoverContent(variableName: string, detectedType: string, availableMethods: any[]): string {
    
    
    const typeDisplayNames = {
      'string': 'Text',
      'number': 'Number', 
      'boolean': 'True/False',
      'object': 'Object',
      'array': 'List',
      'date': 'Date',
      'unknown': 'Unknown'
    }
    
    const displayType = typeDisplayNames[detectedType as keyof typeof typeDisplayNames] || detectedType
    
    const content = [
      `**${variableName}** → *${displayType}*`,
      '',
      `**Variable Type:** \`${detectedType}\``,
      `**Available Methods:** ${availableMethods.length} methods`,
      '',
      '**Quick Methods:**'
    ]
    
    // Show first 5 methods as examples
    const topMethods = availableMethods.slice(0, 5)
    topMethods.forEach(method => {
      content.push(`• \`${variableName}.${method.name}\` - ${method.description}`)
    })
    
    if (availableMethods.length > 5) {
      content.push(`• *...and ${availableMethods.length - 5} more methods*`)
    }
    
    content.push('')
    content.push('**Tip:** Type `' + variableName + '.` to see all available methods')
    content.push('')
    content.push(`*Variable detected from code analysis*`)
    
    return content.join('\n')
  }

  /**
   * Generate hover content from schema with enhanced formatting
   */
  generateHoverFromSchema(schema: UnifiedSchema): string {
    
    
    let content = `**${schema.name}**`
    
    if (schema.returnType) {
      content += ` → *${schema.returnType}*`
    }
    
    content += `\n\n${schema.description}`
    
    // Add category information
    content += `\n\n**Category:** \`${schema.category}\``
    
    if (schema.parameters && schema.parameters.length > 0) {
      content += '\n\n**Parameters:**'
      schema.parameters.forEach(param => {
        content += `\n- \`${param.name}\` (*${param.type}*${param.required ? '' : '?'})`
        if (param.description) {
          content += `: ${param.description}`
        }
      })
    }
    
    if (schema.examples && schema.examples.length > 0) {
      content += '\n\n**Examples:**'
      schema.examples.forEach(example => {
        content += `\n- \`${example}\``
      })
    }
    
    // Add type info for debugging
    content += `\n\n*Schema Type: ${schema.type} | ID: ${schema.id}*`
    
    
    return content
  }

  /**
   * Generate method hover content for user-defined class methods
   */
  generateMethodHoverContent(
    methodName: string, 
    methodType: string, 
    className: string, 
    returnType: string
  ): string {
    
    
    const content = [
      `**${methodName}** → *${returnType}*`,
      '',
      `**Class:** \`${className}\``,
      `**Type:** ${methodType === 'property' ? 'Property' : 'Method'}`,
      `**Returns:** \`${returnType}\``,
      '',
      `*User-defined ${methodType} from code analysis*`
    ]
    
    return content.join('\n')
  }

  /**
   * Generate class hover content
   */
  generateClassHoverContent(className: string, memberCount: number): string {
    
    
    const content = [
      `**${className}** → *Class*`,
      '',
      `**Type:** User-defined business class`,
      `**Members:** ${memberCount} properties and methods`,
      '',
      `**Usage:** \`${className}()\` to create instance`,
      '',
      `*User-defined class from code analysis*`
    ]
    
    return content.join('\n')
  }

  /**
   * Generate enum hover content
   */
  generateEnumHoverContent(enumName: string): string {
    
    
    const content = [
      `**${enumName}** → *Enum*`,
      '',
      `**Type:** User-defined enumeration`,
      '',
      `**Usage:** \`${enumName}.VALUE\` to access values`,
      '',
      `*User-defined enum from code analysis*`
    ]
    
    return content.join('\n')
  }
}