// Business Rules Language Configuration for Monaco Editor
import type { Monaco } from './types'
import type * as MonacoTypes from 'monaco-editor'

/**
 * Business rules language configuration with CLASS SUPPORT
 */
export function createLanguageConfig(monaco: Monaco): MonacoTypes.languages.LanguageConfiguration {
  return {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },
    
    // 🎯 CLASS SUPPORT: Enhanced bracket matching for class definitions
    brackets: [
      ['{', '}'],          // Class/enum bodies
      ['[', ']'], 
      ['(', ')'],          // Method parentheses
      ['"', '"'],
      ["'", "'"],
      ['<', '>']           // Collection types <ClassName>
    ],
    
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string'] },
      { open: '<', close: '>', notIn: ['string', 'comment'] }  // Auto-close collection types
    ],
    
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '<', close: '>' }
    ],
    
    // 🎯 CLASS FOLDING: Enable code folding for class and enum definitions
    folding: {
      offSide: true,
      markers: {
        start: /^\s*(class|enum)\s+\w+\s*\{?$/,                    // Fold class/enum definitions
        end: /^\s*\}$/
      }
    },
    
    // Enhanced word pattern to include class names and collection types
    wordPattern: /(-?\d*\.\d\w*)|([A-Za-z_]\w*)|(<[A-Za-z_]\w*>)/g,
    
    // 🎯 CLASS INDENTATION: Smart indentation rules for class structures
    indentationRules: {
      // Increase indent after class/enum declaration or control structures
      increaseIndentPattern: /^(.*\s+(if|while|for|when|unless|any|all|class|enum)\s+.*|\s*(if|while|for|when|unless|any|all|class|enum)\s+.*|\{.*$)/,
      
      // Decrease indent for closing braces and else statements
      decreaseIndentPattern: /^\s*(else|elif|except|finally|\})\b.*$/,
      
      // Indent next line after class/enum or control structures  
      indentNextLinePattern: /^(.*\s+(if|while|for|when|unless|any|all|class|enum)\s+.*|\s*(if|while|for|when|unless|any|all|class|enum)\s+.*|\{.*$)/,
      
      // Don't indent empty lines or comments
      unIndentedLinePattern: /^(\s*(\/\/.*)?)?$/
    },
    
    // 🎯 ENHANCED ON-ENTER RULES: Smart line handling for class structures
    onEnterRules: [
      // Auto-indent after class or enum declaration
      {
        beforeText: /^(\s*)(class|enum)(\s+\w+\s*\{?)\s*$/,
        action: { 
          indentAction: monaco.languages.IndentAction.Indent 
        }
      },
      
      // Auto-indent after opening brace
      {
        beforeText: /^\s*\{\s*$/,
        action: { 
          indentAction: monaco.languages.IndentAction.Indent 
        }
      },
      
      // Auto-indent after control structures
      {
        beforeText: /^(\s*)(if|while|for|when|unless|any|all)(\s+.*)$/,
        action: { 
          indentAction: monaco.languages.IndentAction.Indent 
        }
      },
      
      // Don't indent empty lines
      {
        beforeText: /^\s*$/,
        action: { 
          indentAction: monaco.languages.IndentAction.None 
        }
      },
      
      // Don't indent comments
      {
        beforeText: /^\s*\/\/.*$/,
        action: { 
          indentAction: monaco.languages.IndentAction.None 
        }
      },
      
      // Auto-dedent after closing brace
      {
        beforeText: /^\s*\}\s*$/,
        action: { 
          indentAction: monaco.languages.IndentAction.Outdent 
        }
      }
    ]
  }
} 