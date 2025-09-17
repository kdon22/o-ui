/**
 * 🏆 REFACTORED EDITOR SERVICES INDEX
 * 
 * Clean exports for remaining editor services
 */

// Utilities
export * from './utils/monaco-utils'
export * from './utils/code-analysis-utils'

// Type Detection Services (keep only existing ones)
export { ClassMemberExtractor, type ClassMember } from './type-detection/class-member-extractor'
export { TypeInferenceUtils } from './type-detection/type-inference-utils'

// Save Coordination Services
// Deprecated: use editor-tabs/save instead

// Content Generation
export { HoverContentGenerator } from './content-generators/hover-content-generator' 