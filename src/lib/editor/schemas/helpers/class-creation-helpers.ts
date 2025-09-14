// Class creation helpers for creating custom Python classes
// Integrates seamlessly with existing schema system and helper UI generation

import type { UnifiedSchema } from '../types'

export const CLASS_CREATION_HELPER_SCHEMAS: UnifiedSchema[] = [
  {
    id: 'create-custom-class',
    name: 'Create Custom Class',
    type: 'helper',
    category: 'class-management',
    description: 'Create a custom Python class with properties and methods that can be imported into your business rules',
    examples: [
      'Create Customer class with properties and validation methods',
      'Create BookingService class with business logic methods'
    ],
    
    // Keyboard shortcut for quick access
    keyboard: {
      shortcut: 'Cmd+Shift+C',
      keyCode: 'CtrlCmd+Shift+KeyC'
    },
    
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const className = params?.className || 'CustomClass'
      const properties = params?.properties || []
      const methods = params?.methods || []
      const baseClass = params?.baseClass || ''
      const docstring = params?.docstring || `Custom ${className} class`
      
      let code = `# Custom Class: ${className}\n`
      
      // Class definition with optional inheritance
      if (baseClass) {
        code += `class ${className}(${baseClass}):\n`
      } else {
        code += `class ${className}:\n`
      }
      
      // Class docstring
      code += `    """\n    ${docstring}\n    """\n\n`
      
      // Constructor with properties
      if (properties.length > 0) {
        code += `    def __init__(self${properties.map((p: any) => `, ${p.name}: ${p.type || 'str'}`).join('')}):\n`
        properties.forEach((prop: any) => {
          code += `        self.${prop.name} = ${prop.name}\n`
        })
        code += '\n'
      } else {
        code += `    def __init__(self):\n        pass\n\n`
      }
      
      // Property getters/setters if requested
      properties.forEach((prop: any) => {
        if (prop.generateGetter) {
          code += `    @property\n`
          code += `    def ${prop.name}_value(self):\n`
          code += `        """Get ${prop.name} value"""\n`
          code += `        return self.${prop.name}\n\n`
        }
        
        if (prop.generateSetter) {
          code += `    @${prop.name}_value.setter\n`
          code += `    def ${prop.name}_value(self, value):\n`
          code += `        """Set ${prop.name} value"""\n`
          if (prop.validation) {
            code += `        if not ${prop.validation}(value):\n`
            code += `            raise ValueError(f"Invalid ${prop.name}: {value}")\n`
          }
          code += `        self.${prop.name} = value\n\n`
        }
      })
      
      // Custom methods
      methods.forEach((method: any) => {
        const methodName = method.name || 'custom_method'
        const params = method.parameters || []
        const returnType = method.returnType || 'None'
        const body = method.body || 'pass'
        
        code += `    def ${methodName}(self${params.map((p: any) => `, ${p.name}: ${p.type || 'str'}`).join('')}) -> ${returnType}:\n`
        code += `        """\n        ${method.description || `${methodName} method`}\n        """\n`
        code += `        ${body.split('\n').join('\n        ')}\n\n`
      })
      
      // String representation
      code += `    def __str__(self):\n`
      code += `        return f"${className}(${properties.map((p: any) => `${p.name}={self.${p.name}}`).join(', ')})"\n\n`
      
      // Representation for debugging
      code += `    def __repr__(self):\n`
      code += `        return self.__str__()\n\n`
      
      // Save to file for import
      code += `\n# Save class to file for import\n`
      code += `# File will be saved as: custom_classes/${className.toLowerCase()}.py\n`
      code += `# Import with: from custom_classes.${className.toLowerCase()} import ${className}\n`
      
      return code
    },
    
    pythonImports: [], // No imports needed for basic class creation
    
    helperUI: {
      title: 'Create Custom Python Class',
      description: 'Design a custom Python class with properties and methods that you can import into your business rules',
      category: 'Class Management',
      fields: [
        {
          name: 'className',
          label: 'Class Name',
          type: 'text',
          required: true,
          placeholder: 'CustomerService',
          description: 'Name of your custom class (use PascalCase)'
        },
        {
          name: 'docstring', 
          label: 'Class Description',
          type: 'textarea',
          placeholder: 'This class handles customer-related business logic...',
          description: 'Brief description of what this class does'
        },
        {
          name: 'baseClass',
          label: 'Inherit From (Optional)',
          type: 'text',
          placeholder: 'BaseService',
          description: 'Parent class to inherit from (leave empty for no inheritance)'
        },
        {
          name: 'properties',
          label: 'Class Properties',
          type: 'dynamic-list', // New field type for adding/removing items
          description: 'Properties that the class will store',
          itemFields: [
            { name: 'name', label: 'Property Name', type: 'text', required: true },
            { name: 'type', label: 'Type', type: 'select', options: [
              { value: 'str', label: 'String' },
              { value: 'int', label: 'Integer' },
              { value: 'float', label: 'Float' },
              { value: 'bool', label: 'Boolean' },
              { value: 'list', label: 'List' },
              { value: 'dict', label: 'Dictionary' },
              { value: 'any', label: 'Any' }
            ]},
            { name: 'generateGetter', label: 'Generate Getter', type: 'checkbox' },
            { name: 'generateSetter', label: 'Generate Setter', type: 'checkbox' },
            { name: 'validation', label: 'Validation Function', type: 'text', placeholder: 'lambda x: len(x) > 0' }
          ]
        },
        {
          name: 'methods',
          label: 'Class Methods',
          type: 'dynamic-list',
          description: 'Custom methods for your class',
          itemFields: [
            { name: 'name', label: 'Method Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'text', placeholder: 'What this method does' },
            { name: 'parameters', label: 'Parameters', type: 'dynamic-list', 
              itemFields: [
                { name: 'name', label: 'Parameter Name', type: 'text', required: true },
                { name: 'type', label: 'Type', type: 'text', placeholder: 'str' }
              ]
            },
            { name: 'returnType', label: 'Return Type', type: 'text', placeholder: 'str' },
            { name: 'body', label: 'Method Body', type: 'textarea', 
              placeholder: 'return "Hello World"', 
              description: 'Python code for the method (use proper indentation)' 
            }
          ]
        }
      ]
    }
  },
  
  {
    id: 'import-custom-class',
    name: 'Import Custom Class',
    type: 'helper', 
    category: 'class-management',
    description: 'Import a previously created custom class into your business rules',
    examples: [
      'Import Customer class and create instance',
      'Import BookingService and call methods'
    ],
    
    keyboard: {
      shortcut: 'Cmd+Shift+I',
      keyCode: 'CtrlCmd+Shift+KeyI'
    },
    
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const selectedClass = params?.selectedClass || ''
      const instanceName = params?.instanceName || 'instance'
      const constructorArgs = params?.constructorArgs || []
      const methodCalls = params?.methodCalls || []
      
      if (!selectedClass) {
        return '# No class selected for import'
      }
      
      let code = `# Import Custom Class: ${selectedClass}\n`
      code += `from custom_classes.${selectedClass.toLowerCase()} import ${selectedClass}\n\n`
      
      // Create instance
      code += `# Create instance of ${selectedClass}\n`
      if (constructorArgs.length > 0) {
        const args = constructorArgs.map((arg: any) => `${arg.name}="${arg.value}"`).join(', ')
        code += `${instanceName} = ${selectedClass}(${args})\n\n`
      } else {
        code += `${instanceName} = ${selectedClass}()\n\n`
      }
      
      // Method calls
      if (methodCalls.length > 0) {
        code += `# Call methods on the instance\n`
        methodCalls.forEach((call: any) => {
          const methodName = call.methodName || 'method'
          const args = call.arguments ? call.arguments.map((arg: any) => `"${arg}"`).join(', ') : ''
          if (call.assignToVariable) {
            code += `${call.resultVariable || 'result'} = ${instanceName}.${methodName}(${args})\n`
          } else {
            code += `${instanceName}.${methodName}(${args})\n`
          }
        })
      }
      
      return code
    },
    
    pythonImports: [], // Imports are generated dynamically
    
    helperUI: {
      title: 'Import Custom Class',
      description: 'Select and import a previously created custom class into your business rules',
      category: 'Class Management',
      fields: [
        {
          name: 'selectedClass',
          label: 'Select Class to Import',
          type: 'select',
          required: true,
          // TODO: This would be populated dynamically by scanning created classes
          options: [
            { value: 'CustomerService', label: 'CustomerService - Customer business logic' },
            { value: 'BookingValidator', label: 'BookingValidator - Booking validation rules' },
            { value: 'PricingEngine', label: 'PricingEngine - Price calculation logic' }
          ],
          description: 'Choose from your previously created custom classes'
        },
        {
          name: 'instanceName',
          label: 'Instance Variable Name',
          type: 'text',
          required: true,
          placeholder: 'customer_service',
          description: 'Name for the class instance variable'
        },
        {
          name: 'constructorArgs',
          label: 'Constructor Arguments',
          type: 'dynamic-list',
          description: 'Arguments to pass when creating the class instance',
          itemFields: [
            { name: 'name', label: 'Parameter Name', type: 'text', required: true },
            { name: 'value', label: 'Value', type: 'text', required: true }
          ]
        },
        {
          name: 'methodCalls',
          label: 'Method Calls',
          type: 'dynamic-list',
          description: 'Methods to call on the imported class instance',
          itemFields: [
            { name: 'methodName', label: 'Method Name', type: 'text', required: true },
            { name: 'arguments', label: 'Arguments', type: 'dynamic-list',
              itemFields: [{ name: 'value', label: 'Argument', type: 'text' }]
            },
            { name: 'assignToVariable', label: 'Assign Result to Variable', type: 'checkbox' },
            { name: 'resultVariable', label: 'Result Variable Name', type: 'text', placeholder: 'result' }
          ]
        }
      ]
    }
  }
] 