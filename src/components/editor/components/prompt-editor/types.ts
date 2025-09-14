// Shared types for the unified prompt editor system

export type ComponentType = 'label' | 'radio' | 'text-input' | 'select' | 'checkbox' | 'button'

export interface ComponentConfig {
  label?: string
  fontSize?: number
  fontWeight?: string
  required?: boolean
  textColor?: string
  componentId?: string
  width?: number
  height?: number
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  isDisabled?: boolean
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderStyle?: string
  borderRadius?: number
  options?: Array<{ label: string; value: string; isDefault?: boolean }>
  isMulti?: boolean
  isClearable?: boolean
  isSearchable?: boolean
  labelText?: string
  checkboxSize?: 'sm' | 'md' | 'lg'
  defaultChecked?: boolean
  labelPosition?: 'top' | 'bottom' | 'left' | 'right'
  labelFontSize?: number
}

export interface ComponentItem {
  x: number
  y: number
  id: string
  type: ComponentType
  label: string
  labelPosition?: 'top' | 'bottom' | 'left' | 'right'
  config: ComponentConfig
}

export interface PromptLayout {
  items: ComponentItem[]
  canvasWidth?: number
  canvasHeight?: number
}

export interface FormState {
  [key: string]: any
}

export interface PromptEntity {
  id: string
  ruleId: string
  promptName: string
  content?: string
  layout: PromptLayout
  isPublic: boolean
  executionMode: 'INTERACTIVE' | 'AUTOMATED' | 'READ_ONLY'
  createdAt: string
  updatedAt: string
}

export interface CreatePromptInput {
  ruleId: string
  promptName: string
  content?: string
  layout: PromptLayout
  isPublic: boolean
  executionMode: 'INTERACTIVE' | 'AUTOMATED' | 'READ_ONLY'
}

export interface UpdatePromptInput {
  id: string
  promptName?: string
  content?: string
  layout?: PromptLayout
  isPublic?: boolean
  executionMode?: 'INTERACTIVE' | 'AUTOMATED' | 'READ_ONLY'
}

// Drag and Drop Types
export interface DragItem {
  type: ComponentType
  label: string
}

// Selection Types
export interface SelectionState {
  selectedPrompt: PromptEntity | null
  selectedComponent: ComponentItem | null
} 