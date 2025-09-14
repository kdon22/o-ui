/**
 * 🏗️ CLASS MEMBER EXTRACTOR
 * 
 * Extracts properties and methods from user-defined class definitions
 */

import { 
  findClassDefinition, 
  extractClassProperties, 
  extractClassMethods,
  findAllClassDefinitions,
  findAllAssignments 
} from '../utils/code-analysis-utils'

export interface ClassMember {
  name: string
  returnType: string
  kind: 'property' | 'method'
  category: string
  description: string
  confidence: number
  isProperty?: boolean
  isMethod?: boolean
  isUserDefined: boolean
  hasParentheses?: boolean
}

/**
 * Service for extracting class members
 */
export class ClassMemberExtractor {

  /**
   * Extract all members (properties and methods) from a class
   */
  extractClassMembers(className: string, fullCode: string): ClassMember[] {
    if (!fullCode) {
  
      return []
    }
    


    
    
    const members: ClassMember[] = []
    
    // Find the class definition
    const classDefinition = findClassDefinition(fullCode, className)
    
    if (!classDefinition) {
  
  
      
      // Debug: try to find any class definition
      const allClasses = findAllClassDefinitions(fullCode)
      console.log('🔍 [ExtractClassMembers] All classes found:', allClasses.map(c => c.name))
      
      return []
    }
    
    const { classBody } = classDefinition
    

    
    // Extract properties
    const properties = this.extractProperties(classBody)
    members.push(...properties)
    
    // Extract methods  
    const methods = this.extractMethods(classBody)
    members.push(...methods)
    

    
    
    return members
  }

  /**
   * Extract properties from class body
   */
  private extractProperties(classBody: string): ClassMember[] {
    const members: ClassMember[] = []
    

    
    // Debug: also try to find ALL assignment patterns
    const allAssignments = findAllAssignments(classBody)
    console.log('🔍 [ExtractClassMembers] All assignments found:', allAssignments.map(a => `${a.variable} = ${a.value}`))
    
    const properties = extractClassProperties(classBody)
    
    properties.forEach(prop => {
  
      
      members.push({
        name: prop.name,
        returnType: prop.type,
        kind: 'property',
        category: 'property',
        description: `Property of type ${prop.type}`,
        confidence: 0.9,
        isProperty: true,
        isUserDefined: true
      })
    })
    
    return members
  }

  /**
   * Extract methods from class body
   */
  private extractMethods(classBody: string): ClassMember[] {
    const members: ClassMember[] = []
    

    
    const methods = extractClassMethods(classBody)
    
    methods.forEach(method => {
  
      
      members.push({
        name: method.name,
        returnType: method.returnType,
        kind: 'method',
        category: 'method',
        description: `Method returning ${method.returnType}`,
        confidence: 0.9,
        hasParentheses: false,  // Ruby-style methods
        isMethod: true,
        isUserDefined: true
      })
    })
    
    return members
  }
}