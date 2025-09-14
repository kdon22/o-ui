/**
 * Refactored Action System - Clean Modular Export
 * 
 * Server-side action routing system with:
 * - Modular handler architecture
 * - Clean separation of concerns  
 * - Focused utilities
 * - Better maintainability
 */

// ============================================================================
// CORE ROUTER (Main entry point)
// ============================================================================

export { 
  ActionRouterCore as ActionRouter,
  ActionRouterFactory,
  createActionRouter 
} from './core/action-router-core';

// ============================================================================
// HANDLERS
// ============================================================================

export { 
  ActionHandlerFactory,
  CreateHandler,
  ReadHandler,
  UpdateHandler,
  DeleteHandler,
  ListHandler 
} from './handlers';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  parseAction,
  getResourceSchema,
  isActionSupported,
  getResourceActions
} from './utils/action-parser';

export {
  getActionMetadata,
  getAvailableDatabaseKeys
} from './utils/action-metadata';

// ============================================================================
// TYPES
// ============================================================================

export type {
  ExecutionContext,
  ActionResult,
  ParsedAction,
  HandlerContext,
  // Re-exported from schemas
  ActionRequest,
  ActionResponse,
  BranchContext,
  ResourceSchema
} from './core/types';

// ============================================================================
// LEGACY COMPATIBILITY (Backward compatibility)
// ============================================================================

// Main ActionRouter export is already available above as 'ActionRouter'
// (ActionRouterCore as ActionRouter) 