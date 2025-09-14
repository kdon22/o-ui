/**
 * Session Feature - Public API
 * 
 * Exports for ActionClient integration
 */

// Schema
export { SESSION_SCHEMA } from './session.schema';

// Types
export type {
  SessionEntity,
  UpdateBranchPayload,
  RefreshContextPayload,
  CreateSessionPayload,
  UpdateSessionPayload,
  BranchContext,
  SessionBranchData,
  SessionUIState,
  SessionActionContext,
  SessionOptimisticUpdate,
  LegacySessionData
} from './types';

// Hooks
export { useSessionActions } from './hooks/use-session-actions';

// Services
export { SessionService } from './services/session-service';