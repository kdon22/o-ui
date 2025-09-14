/**
 * 🏆 REFACTORED EDITOR SERVICES INDEX
 * 
 * Clean exports for remaining editor services
 */

// Utilities
export * from './utils/monaco-utils'
export * from './utils/code-analysis-utils'

// Type Detection Services
export { VariableTypeDetector } from './type-detection/variable-type-detector'
export { ClassMemberExtractor, type ClassMember } from './type-detection/class-member-extractor'
export { TypeInferenceUtils } from './type-detection/type-inference-utils'

// Code Sync Services (still in use)
export { RuleCodeSyncService, type RuleData } from './rule-code-sync-service'

// Content Generation
export { HoverContentGenerator } from './content-generators/hover-content-generator' 