/**
 * 🏆 Rule Studio Constants - Enterprise Configuration
 * 
 * Central configuration for tab IDs, defaults, and settings
 */

import type { TabId, TabInfo } from './types'

// Tab definitions
export const TAB_IDS: Record<string, TabId> = {
  BUSINESS_RULES: 'business-rules',
  PARAMETERS: 'parameters', 
  PYTHON: 'python',
  TEST: 'test'
} as const

export const DEFAULT_TAB: TabId = 'business-rules'

// Tab configurations
export const TAB_CONFIGS: Record<TabId, TabInfo> = {
  'business-rules': {
    id: 'business-rules',
    label: 'Business Rules',
    isVisible: true
  },
  'parameters': {
    id: 'parameters', 
    label: 'Parameters Function',
    isVisible: true // Will be conditionally shown for UTILITY rules
  },
  'python': {
    id: 'python',
    label: 'Python Output', 
    isVisible: true
  },
  'test': {
    id: 'test',
    label: 'Test',
    isVisible: true
  }
}

// Default options
export const DEFAULT_STUDIO_OPTIONS = {
  enableParameters: true,
  enableAnalytics: false,
  enableCollaboration: false
}

// Auto-save settings (inherited from generic save system)
export const AUTO_SAVE_CONFIG = {
  IDLE_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  DEBOUNCE_DELAY: 1000,         // 1 second
  ENABLE_TAB_SWITCH_SAVE: true,
  ENABLE_BEFOREUNLOAD_SAVE: true
}

// Rule types that support parameters
export const PARAMETER_ENABLED_RULE_TYPES = ['UTILITY'] as const

// Loading states
export const LOADING_MESSAGES = {
  RULE: 'Loading rule...',
  EDITOR: 'Initializing editor...',
  INHERITANCE: 'Checking permissions...',
  SAVING: 'Saving changes...'
}

// Error messages  
export const ERROR_MESSAGES = {
  RULE_NOT_FOUND: 'Rule not found',
  LOAD_FAILED: 'Failed to load rule',
  SAVE_FAILED: 'Failed to save changes',
  PERMISSION_DENIED: 'Permission denied'
}
