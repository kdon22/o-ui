export interface EditorPreferences {
  theme: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'
  fontSize: number
  fontFamily: string
  wordWrap: boolean
  lineNumbers: 'on' | 'off' | 'relative'
}

export interface EditorPreferencesModalProps {
  className?: string
}

export interface ThemeOption {
  value: EditorPreferences['theme']
  label: string
  preview: string
}

export interface FontFamilyOption {
  value: string
  label: string
  webFont: boolean
  preview: string
}