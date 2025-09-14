/**
 * Enhanced Session Hooks - SSOT Data Access
 * 
 * ⚠️  DEPRECATED: Use @/lib/session instead
 * 
 * This file is kept for backward compatibility but all new code should use:
 * import { useSessionData, useBranchContext, useTenantId } from '@/lib/session'
 * 
 * Enterprise-grade session management with identical SSR and client interfaces.
 */

import { 
  useSessionData, 
  useBranchContext, 
  useTenantId, 
  useNavigationContext,
  useIsSessionReady,
  useLastSelectedNode
} from '@/lib/session';

// Re-export for backward compatibility
export const useSessionContexts = useSessionData;
export { useBranchContext, useTenantId, useNavigationContext, useIsSessionReady, useLastSelectedNode };

// Legacy interface - use SessionData from @/lib/session instead
export interface SessionContexts {
  userId: string | null;
  tenantId: string | null;
  branchContext: any | null;
  navigationContext: {
    rootNodeId: string | null;
    workspaceStructure: any;
  };
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionValid: boolean;
  lastDataSync: string | null;
} 