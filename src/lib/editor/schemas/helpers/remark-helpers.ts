// Remark helper schemas for non-coders
// Based on Add Vendor Remark functionality

import type { UnifiedSchema } from '../types'

export const REMARK_HELPER_SCHEMAS: UnifiedSchema[] = [
  {
    id: 'add-remark',
    name: 'Add Vendor Remark',
    type: 'helper',
    category: 'remarks',
    description: 'Add remarks to vendor systems with conditions and validation',
    examples: ['Add remark to Amadeus with specific conditions', 'Add general remark across multiple systems'],
    
    // Keyboard shortcut
    keyboard: {
      shortcut: 'Cmd+Shift+R',
      keyCode: 'CtrlCmd+Shift+KeyR'
    },
    
    pythonGenerator: (variable: string, resultVar: string = 'result', params: any) => {
      const selectedSystems = params?.systems || []
      const remarkType = params?.remarkType || 'general'
      const category = params?.category || ''
      const remark = params?.remark || ''
      const condition = params?.condition || 'always'
      const isErrorRemark = params?.isErrorRemark || false
      const notContainedText = params?.notContainedText || ''

      let code = '# Add Vendor Remark\n'
      
      // Generate system-specific logic
      if (selectedSystems.includes('amadeus')) {
        code += `# Amadeus system remark\n`
        if (remarkType === 'miscellaneous') {
          code += `amadeus_remark = f"RM{category}/{remark}"\n`
        } else {
          code += `amadeus_remark = f"NP.{category} {remark}"\n`
        }
      }
      
      if (selectedSystems.includes('galileo')) {
        code += `# Galileo system remark\n`
        if (remarkType === 'miscellaneous') {
          code += `galileo_remark = f"RM{category}/{remark}"\n`
        } else {
          code += `galileo_remark = f"NP.{category} {remark}"\n`
        }
      }

      if (selectedSystems.includes('worldspan')) {
        code += `# Worldspan system remark\n`
        code += `worldspan_remark = "${remark}"\n`
      }

      // Add condition logic
      if (condition === 'not_exists') {
        code += `\n# Only add if exact remark doesn't exist\n`
        code += `if not any(r.text == "${remark}" for r in existing_remarks):\n`
        code += `    # Add the remark\n`
        code += `    add_remark_to_systems([${selectedSystems.map((s: string) => `"${s}"`).join(', ')}])\n`
      } else if (condition === 'not_contained') {
        code += `\n# Only add if text not contained in any remark\n`
        code += `if not any("${notContainedText}" in r.text for r in existing_remarks):\n`
        code += `    # Add the remark\n`
        code += `    add_remark_to_systems([${selectedSystems.map((s: string) => `"${s}"`).join(', ')}])\n`
      } else {
        code += `\n# Always add the remark\n`
        code += `add_remark_to_systems([${selectedSystems.map((s: string) => `"${s}"`).join(', ')}])\n`
      }

      if (isErrorRemark) {
        code += `\n# Mark as error remark for validation\n`
        code += `mark_as_error_remark = True\n`
      }

      return code
    },
    pythonImports: [],
    helperUI: {
      title: 'Add Vendor Remark',
      description: 'Add remarks to vendor booking systems with conditional logic',
      category: 'Booking Systems',
      fields: [
        {
          name: 'systems',
          label: 'Select Systems',
          type: 'checkboxGroup',
          required: true,
          options: [
            { value: 'abacus', label: 'Abacus' },
            { value: 'amadeus', label: 'Amadeus' },
            { value: 'apollo', label: 'Apollo' },
            { value: 'galileo', label: 'Galileo' },
            { value: 'sabre', label: 'Sabre' },
            { value: 'worldspan', label: 'Worldspan' }
          ]
        },
        {
          name: 'remarkType',
          label: 'Remark Type',
          type: 'select',
          required: true,
          options: [
            { value: 'miscellaneous', label: 'Miscellaneous - RM<cat>/' },
            { value: 'general', label: 'General - NP.<cat>' },
            { value: 'general5', label: 'General - 5' }
          ]
        },
        {
          name: 'category',
          label: 'Category',
          type: 'text',
          placeholder: 'Enter category code'
        },
        {
          name: 'remark',
          label: 'Remark',
          type: 'textarea',
          required: true,
          placeholder: 'Enter your remark text'
        },
        {
          name: 'condition',
          label: 'Under What Condition Should The Remark Be Added?',
          type: 'radio',
          required: true,
          options: [
            { value: 'always', label: 'Always' },
            { value: 'not_exists', label: 'Only When Exactly The Same Remark Does Not Already Exist' },
            { value: 'not_contained', label: 'Only When The Following Is Not Contained In Any Remark' }
          ]
        },
        {
          name: 'notContainedText',
          label: 'Text to Check',
          type: 'text',
          placeholder: 'Text that should not be contained in existing remarks'
        },
        {
          name: 'isErrorRemark',
          label: 'This Remark Is An Error Remark',
          type: 'checkbox'
        }
      ]
    },
    testCases: [
      {
        input: {
          systems: ['amadeus', 'galileo'],
          remarkType: 'miscellaneous',
          category: 'T',
          remark: 'TEST',
          condition: 'always'
        },
        expected: 'Generates remark addition code for Amadeus and Galileo systems',
        description: 'Basic remark addition'
      }
    ]
  }
] 