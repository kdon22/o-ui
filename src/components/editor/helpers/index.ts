// Monaco Helper System - Main Exports

// Core Helper System Components  
export { SmartInputField, type ParameterDefinition } from './smart-input-field'
export { createMonacoHelperFactory, type MonacoHelperFactory, type HelperModalController } from './helper-factory'
export { HELPER_REGISTRY, getHelperConfig, getAllHelpers, getHelpersByTriggerType, getHelperByIntelliSenseTrigger, type HelperConfig, type HelperTrigger } from './helper-registry'
// Intellisense integration removed - using type inference system instead
export {
  parseCodeContext,
  generateUpdatedUtilityCall,
  replaceUtilityCall,
  getUtilityParameterDefinitions,
  type CodeContext,
  type UtilityCallContext
} from './code-context-parser'

// NEW: Command Palette System (20+ helpers)
export { HelperCommandPalette } from './helper-command-palette'
export { EnhancedHelperAccess, setupEnhancedHelperAccess } from './enhanced-helper-access'

// NEW: Bulletproof Helper Metadata System
export { HelperMetadataManager, type HelperMetadata, type HelperValidationResult } from './helper-metadata-manager'

// Usage Example:
// import { EnhancedHelperAccess, HelperMetadataManager } from '@/components/editor/helpers'
// <EnhancedHelperAccess editor={editorRef.current} helperFactory={helperFactory} />

// Key Features:
// ✅ Command Palette for 20+ helpers (Cmd+. to open)
// ✅ Multiple access methods: keyboard, context menu, IntelliSense
// ✅ Auto-categorization by helper type (Utilities, Vendor Operations, Control Flow, etc.)
// ✅ Bulletproof metadata persistence with complex data support
// ✅ Smart input fields with validation
// ✅ Context-aware editing and restoration
// ✅ Factory-driven helper system
// ✅ Non-coder friendly with search and guided configuration 