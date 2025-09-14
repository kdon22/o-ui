// Code Helper Components - Schema-driven helper UI system
// Original helper factory exports
export { HelperFactory, HelperSelector, useHelperFactory } from './helper-factory'

// Enhanced helper system exports
export { BlockBoundaryDetector, type HelperBlockBoundaries } from './block-boundary-detector'
export { AtomicDeletionManager } from './atomic-deletion-manager'
export { ReadOnlyDecorator } from './read-only-decorator'
export { EnhancedHelperManager, type HelperBlockInfo } from './enhanced-helper-manager'

// Utility schema exports (re-export from proper location)
export { CALL_UTILITY_SCHEMA, createUtilitySchema, parseUtilityCallForEditing } from '@/lib/editor/schemas/helpers/call-utility'

// CSS styles - import this in your app
export const HELPER_BLOCK_STYLES_PATH = './helper-block-styles.css'

// Usage examples
export { CodeHelperExample, BusinessRuleEditorWithHelpers, addHelpersToMonacoCompletions } from './example-usage'
export { EnhancedHelperExample, QuickHelperDemo } from './enhanced-usage-example'
export { TestRemarkHelper } from './test-remark-helper' 