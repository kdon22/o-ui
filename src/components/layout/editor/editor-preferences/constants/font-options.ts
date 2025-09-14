import { FontFamilyOption } from '../types/editor-preferences'

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  { 
    value: 'var(--font-mono-fira), "Fira Code", "SF Mono", Monaco, Consolas, monospace', 
    label: 'Fira Code (System)',
    webFont: false,
    preview: '"Fira Code", monospace'
  },
  { 
    value: '"Fira Code", "SF Mono", Monaco, Consolas, monospace', 
    label: 'Fira Code',
    webFont: false,
    preview: '"Fira Code", monospace'
  },
  { 
    value: '"JetBrains Mono", "Fira Code", monospace', 
    label: 'JetBrains Mono',
    webFont: false,
    preview: '"JetBrains Mono", monospace'
  },
  { 
    value: '"SF Mono", Monaco, "Cascadia Code", monospace', 
    label: 'SF Mono',
    webFont: false,
    preview: '"SF Mono", monospace'
  },
  { 
    value: '"Cascadia Code", Consolas, monospace', 
    label: 'Cascadia Code',
    webFont: false,
    preview: '"Cascadia Code", monospace'
  },
  { 
    value: 'Consolas, "Courier New", monospace', 
    label: 'Consolas',
    webFont: false,
    preview: 'Consolas, monospace'
  },
  { 
    value: 'Monaco, Menlo, monospace', 
    label: 'Monaco',
    webFont: false,
    preview: 'Monaco, monospace'
  },
  { 
    value: 'Menlo, Monaco, "Courier New", monospace', 
    label: 'Menlo',
    webFont: false,
    preview: 'Menlo, monospace'
  },
  { 
    value: '"Source Code Pro", Consolas, monospace', 
    label: 'Source Code Pro',
    webFont: false,
    preview: '"Source Code Pro", monospace'
  },
  { 
    value: '"Ubuntu Mono", monospace', 
    label: 'Ubuntu Mono',
    webFont: false,
    preview: '"Ubuntu Mono", monospace'
  },
  { 
    value: 'monospace', 
    label: 'System Default',
    webFont: false,
    preview: 'monospace'
  }
]

// Font size range for validation
export const MIN_FONT_SIZE = 8
export const MAX_FONT_SIZE = 32

export const STORAGE_KEY = 'editorPreferences'