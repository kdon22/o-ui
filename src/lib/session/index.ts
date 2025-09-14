/**
 * Enterprise Session Management System - CLIENT ONLY
 * 
 * Client-side session hooks and utilities.
 * For server-side session utilities, import directly from './server'
 */

export type { SessionData, ExtendedSession, NavigationContext, UserContext } from './types';

// CLIENT-SIDE EXPORTS ONLY (no server imports)
export { 
  useSessionData, 
  useAuth, 
  // REMOVED: useBranchContext - migrated to useEnterpriseSession
  useTenantId, 
  useNavigationContext,
  useLastSelectedNode,
  useIsSessionReady,
  useUserPreferences,
  useUserPermissions,
  useCurrentTenant 
} from './client';

// SHARED UTILITIES (client-safe, no server dependencies)
export { 
  updateLastSelectedNode,
  updateUserPreferences,
  extractBranchInfo,
  validateSessionData,
  debugSessionData
} from './utils'; 