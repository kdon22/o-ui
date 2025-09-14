// Monaco Helper System - Registry

import type * as monaco from 'monaco-editor'
import { ALL_HELPER_SCHEMAS } from '@/lib/editor/schemas'

export interface HelperTrigger {
  type: 'keybinding' | 'intellisense' | 'command'
  value: string | number | ((monaco: typeof import('monaco-editor')) => number)
  description?: string
}

export interface HelperConfig {
  id: string
  name: string
  description: string
  icon?: string
  
  // Multiple trigger types
  triggers: HelperTrigger[]
  
  // Data source configuration
  dataSource: {
    action: string           // Action system call
    filters?: Record<string, any>
    transform?: string       // Transform function name
  }
  
  // UI configuration
  modal: {
    type: 'search-and-configure' | 'quick-insert' | 'picker'
    title?: string
    searchPlaceholder?: string
  }
  
  // Code generation
  generator: {
    type: string            // Generator function name
    template?: string       // Default template
    options?: Record<string, any>
  }
}

// Helper function to convert keyCode string to Monaco KeyMod combination
function parseKeyCode(keyCode: string, monaco: typeof import('monaco-editor')): number {
  const parts = keyCode.split('+')
  let result = 0
  
  for (const part of parts) {
    switch (part) {
      case 'CtrlCmd':
        result |= monaco.KeyMod.CtrlCmd
        break
      case 'Shift':
        result |= monaco.KeyMod.Shift
        break
      case 'Alt':
        result |= monaco.KeyMod.Alt
        break
      case 'KeyU':
        result |= monaco.KeyCode.KeyU
        break
      case 'KeyR':
        result |= monaco.KeyCode.KeyR
        break
      case 'KeyL':
        result |= monaco.KeyCode.KeyL
        break
      case 'KeyE':
        result |= monaco.KeyCode.KeyE
        break
      case 'KeyS':
        result |= monaco.KeyCode.KeyS
        break
      case 'KeyV':
        result |= monaco.KeyCode.KeyV
        break
      case 'Slash':
        result |= monaco.KeyCode.Slash
        break
      case 'KeyP':
        result |= monaco.KeyCode.KeyP
        break
      case 'Period':
        result |= monaco.KeyCode.Period
        break
      case 'KeyK':
        result |= monaco.KeyCode.KeyK
        break
      // Add more key mappings as needed
    }
  }
  
  return result
}

// Generate helper registry from schemas
function generateHelperRegistryFromSchemas(): Record<string, HelperConfig> {
  const registry: Record<string, HelperConfig> = {}
  
  for (const schema of ALL_HELPER_SCHEMAS) {
    if (schema.type === 'helper' && schema.helperUI) {
      const triggers: HelperTrigger[] = []
      
      // Add keyboard shortcut if available
      if (schema.keyboard?.shortcut) {
        triggers.push({
          type: 'keybinding',
          value: (monaco) => parseKeyCode(schema.keyboard!.keyCode || '', monaco),
          description: schema.keyboard.shortcut
        })
      }
      
      // Add default intellisense triggers based on schema category/name
      const lowerName = schema.name.toLowerCase()
      if (lowerName.includes('utility') || lowerName.includes('call')) {
        triggers.push(
          {
            type: 'intellisense',
            value: 'call:',
            description: 'Type "call:" to open utility helper'
          },
          {
            type: 'intellisense', 
            value: 'utility:',
            description: 'Type "utility:" to open utility helper'
          }
        )
      } else if (lowerName.includes('remark') || lowerName.includes('vendor')) {
        triggers.push(
          {
            type: 'intellisense',
            value: 'remark:',
            description: 'Type "remark:" to add vendor remarks'
          },
          {
            type: 'intellisense',
            value: 'vendor:',
            description: 'Type "vendor:" to add vendor operations'
          }
        )
      }
      
      registry[schema.id] = {
        id: schema.id,
        name: schema.name,
        description: schema.description,
        icon: getIconForCategory(schema.category),
        triggers,
        dataSource: {
          action: `${schema.category}.list`,
          transform: `transform${schema.category}`
        },
        modal: {
          type: 'search-and-configure',
          title: schema.helperUI.title,
          searchPlaceholder: `Search ${schema.helperUI.category.toLowerCase()}...`
        },
        generator: {
          type: schema.category,
          template: `Generated from ${schema.name}`,
          options: {
            schemaId: schema.id
          }
        }
      }
    }
  }
  
  return registry
}

// Helper function to get icon based on category
function getIconForCategory(category: string): string {
  const categoryLower = category.toLowerCase()
  if (categoryLower.includes('utility') || categoryLower.includes('util')) return 'code'
  if (categoryLower.includes('remark') || categoryLower.includes('vendor')) return 'hash'
  if (categoryLower.includes('condition') || categoryLower.includes('flow')) return 'zap'
  if (categoryLower.includes('loop')) return 'repeat'
  if (categoryLower.includes('data') || categoryLower.includes('validation')) return 'shield-check'
  if (categoryLower.includes('error')) return 'alert-triangle'
  if (categoryLower.includes('api') || categoryLower.includes('http')) return 'globe'
  if (categoryLower.includes('doc') || categoryLower.includes('comment')) return 'book-open'
  if (categoryLower.includes('snippet')) return 'file-text'
  if (categoryLower.includes('variable')) return 'variable'
  return 'code' // default
}

// Helper Registry - Now generated from schemas (single source of truth)
export const HELPER_REGISTRY: Record<string, HelperConfig> = generateHelperRegistryFromSchemas()

// Get helper configuration by ID
export function getHelperConfig(helperId: string): HelperConfig | undefined {
  return HELPER_REGISTRY[helperId]
}

// Get all helpers
export function getAllHelpers(): HelperConfig[] {
  return Object.values(HELPER_REGISTRY)
}

// Get helpers by trigger type
export function getHelpersByTriggerType(triggerType: string): HelperConfig[] {
  return getAllHelpers().filter(helper => 
    helper.triggers.some(trigger => trigger.type === triggerType)
  )
}

// Get helper by IntelliSense trigger
export function getHelperByIntelliSenseTrigger(trigger: string): HelperConfig | undefined {
  return getAllHelpers().find(helper =>
    helper.triggers.some(t => 
      t.type === 'intellisense' && t.value === trigger
    )
  )
} 