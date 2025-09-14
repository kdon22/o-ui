// Monaco Editor Theme Definitions
import type { Monaco } from './types'
import type * as MonacoTypes from 'monaco-editor'

/**
 * Business rules light theme definition with CLASS SUPPORT
 */
export function createBusinessRulesTheme(): MonacoTypes.editor.IStandaloneThemeData {
  return {
    base: 'vs',
    inherit: true,
    rules: [
      // 🎯 CLASS & ENUM SUPPORT: Beautiful syntax highlighting for business objects
      { token: 'keyword.class', foreground: '0066CC', fontStyle: 'bold' },         // class/enum keywords - bright blue
      { token: 'entity.name.class', foreground: '228B22', fontStyle: 'bold' },      // Class names - forest green
      { token: 'type.business', foreground: '8B4513', fontStyle: 'bold' },         // Business types (str, int, bool) - saddle brown
      { token: 'type.collection', foreground: '9932CC', fontStyle: 'bold' },       // Collection types <ClassName> - dark orchid
      { token: 'variable.name', foreground: '4169E1' },                            // Property names - royal blue
      { token: 'support.function.user', foreground: 'FF6347' },                    // User-defined methods - tomato red
      { token: 'keyword.operator.arrow', foreground: 'FF1493' },                   // -> arrow operator - deep pink
      
      // 🎯 NAMED PARAMETERS: Syntax highlighting for parameter names
      { token: 'parameter.name', foreground: '4169E1', fontStyle: 'bold' },        // Parameter names - royal blue, bold
      { token: 'parameter.separator', foreground: 'FF1493' },                      // Parameter colon (:) - deep pink
      
      // Original business rules tokens
      { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },               // Control flow - blue
      { token: 'keyword.control', foreground: '0000FF', fontStyle: 'bold' },       // if, for, while - blue  
      { token: 'keyword.other', foreground: '800080', fontStyle: 'bold' },         // any, all, items - purple
      { token: 'keyword.operator.logical', foreground: 'FF4500', fontStyle: 'bold' }, // And, Or - orange red
      { token: 'keyword.operator.string', foreground: '20B2AA' },                  // BeginsWith, Contains - light sea green
      { token: 'keyword.operator.assignment', foreground: 'FF0000' },              // = assignment - red
      { token: 'keyword.operator.comparison', foreground: 'FF0000' },              // ==, !=, <, > - red
      { token: 'keyword.operator.arithmetic', foreground: 'FF0000' },              // +, -, *, / - red
      
      // Data types and values
      { token: 'string', foreground: '008000' },                                   // Strings - green
      { token: 'number', foreground: '800080' },                                   // Numbers - purple
      { token: 'number.float', foreground: '800080' },                             // Float numbers - purple
      { token: 'type', foreground: '1E90FF' },                                     // Traditional types - dodger blue
      
      // Variables and functions
      { token: 'variable', foreground: '000000' },                                 // Variables - black (light mode)
      { token: 'support.function', foreground: 'B22222' },                         // Built-in methods - fire brick
      { token: 'support.property', foreground: '4682B4' },                         // Properties - steel blue
      
      // Comments and misc
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },             // Comments - green italic
      { token: 'delimiter', foreground: '666666' },                                // Commas, semicolons - gray
    ],
    colors: {
      'editor.foreground': '#000000',
      'editor.background': '#FFFFFF',
      'editor.lineHighlightBackground': '#F0F8FF',                                 // Light blue line highlight
      'editorLineNumber.foreground': '#999999',
      'editorIndentGuide.background': '#E0E0E0',
      'editorBracketMatch.background': '#FFE4B5',                                  // Moccasin bracket match
    }
  }
}

/**
 * Business rules dark theme definition with CLASS SUPPORT
 */
export function createBusinessRulesDarkTheme(): MonacoTypes.editor.IStandaloneThemeData {
  return {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // 🎯 CLASS & ENUM SUPPORT: Dark theme colors for business objects
      { token: 'keyword.class', foreground: '87CEEB', fontStyle: 'bold' },         // class/enum keywords - sky blue
      { token: 'entity.name.class', foreground: '98FB98', fontStyle: 'bold' },      // Class names - pale green
      { token: 'type.business', foreground: 'DEB887', fontStyle: 'bold' },         // Business types - burlywood
      { token: 'type.collection', foreground: 'DDA0DD', fontStyle: 'bold' },       // Collection types - plum
      { token: 'variable.name', foreground: '87CEFA' },                            // Property names - light sky blue
      { token: 'support.function.user', foreground: 'FA8072' },                    // User-defined methods - salmon
      { token: 'keyword.operator.arrow', foreground: 'FF69B4' },                   // -> arrow operator - hot pink
      
      // 🎯 NAMED PARAMETERS: Dark theme colors for parameter names
      { token: 'parameter.name', foreground: '87CEFA', fontStyle: 'bold' },        // Parameter names - light sky blue, bold
      { token: 'parameter.separator', foreground: 'FF69B4' },                      // Parameter colon (:) - hot pink
      
      // Original business rules tokens (dark theme)
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },               // Control flow - light blue
      { token: 'keyword.control', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'keyword.other', foreground: 'D8A0DF', fontStyle: 'bold' },         // any, all - light purple
      { token: 'keyword.operator.logical', foreground: 'FF7F50', fontStyle: 'bold' }, // And, Or - coral
      { token: 'keyword.operator.string', foreground: '7FFFD4' },                  // String operators - aquamarine
      { token: 'keyword.operator.assignment', foreground: 'FF6B6B' },              // Assignment - light red
      { token: 'keyword.operator.comparison', foreground: 'FF6B6B' },
      { token: 'keyword.operator.arithmetic', foreground: 'FF6B6B' },
      
      // Data types and values (dark theme)
      { token: 'string', foreground: 'CE9178' },                                   // Strings - light brown
      { token: 'number', foreground: 'B5CEA8' },                                   // Numbers - light green
      { token: 'number.float', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },                                     // Types - teal
      
      // Variables and functions (dark theme)
      { token: 'variable', foreground: 'FFFFFF' },                                 // Variables - white (dark mode)
      { token: 'support.function', foreground: 'DCDCAA' },                         // Functions - light yellow
      { token: 'support.property', foreground: '9CDCFE' },                         // Properties - light blue
      
      // Comments and misc (dark theme)
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },             // Comments - green
      { token: 'delimiter', foreground: 'CCCCCC' },                                // Delimiters - light gray
    ],
    colors: {
      'editor.foreground': '#D4D4D4',
      'editor.background': '#1E1E1E',
      'editor.lineHighlightBackground': '#2A2A2A',
      'editorLineNumber.foreground': '#858585',
      'editorIndentGuide.background': '#404040',
      'editorBracketMatch.background': '#0064001A',
    }
  }
} 