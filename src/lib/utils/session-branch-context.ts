/**
 * Session Branch Context Utilities
 * 
 * CRITICAL: Never hardcode 'main' - always get branch context from session
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export interface BranchContext {
  currentBranchId: string;
  defaultBranchId: string;
  tenantId: string;
  userId: string;
}

/**
 * Get branch context from session - NEVER hardcode 'main'
 * Throws error if session or branch context is missing
 */
export async function getSessionBranchContext(): Promise<BranchContext> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Authentication required - no session found');
  }

  if (!session.user.tenantId) {
    throw new Error('Tenant ID required - user not associated with tenant');
  }

  const sessionBranchContext = session.user.branchContext;
  
  if (!sessionBranchContext?.currentBranchId || !sessionBranchContext?.defaultBranchId) {
    throw new Error('Branch context missing from session - invalid session state');
  }

  return {
    currentBranchId: sessionBranchContext.currentBranchId,
    defaultBranchId: sessionBranchContext.defaultBranchId,
    tenantId: session.user.tenantId,
    userId: session.user.id
  };
}

/**
 * Get branch context with fallback for marketplace operations
 * Marketplace operations might not need strict branch context
 */
export async function getMarketplaceBranchContext(): Promise<BranchContext> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Authentication required - no session found');
  }

  const sessionBranchContext = session.user.branchContext;
  
  return {
    currentBranchId: sessionBranchContext?.currentBranchId || sessionBranchContext?.defaultBranchId || '',
    defaultBranchId: sessionBranchContext?.defaultBranchId || sessionBranchContext?.currentBranchId || '',
    tenantId: session.user.tenantId || '',
    userId: session.user.id
  };
}

/**
 * Extract branch context from existing session object
 */
export function extractBranchContextFromSession(session: any): BranchContext {
  if (!session?.user) {
    throw new Error('Invalid session object');
  }

  const sessionBranchContext = session.user.branchContext;
  
  if (!sessionBranchContext?.currentBranchId || !sessionBranchContext?.defaultBranchId) {
    throw new Error('Branch context missing from session');
  }

  return {
    currentBranchId: sessionBranchContext.currentBranchId,
    defaultBranchId: sessionBranchContext.defaultBranchId,
    tenantId: session.user.tenantId,
    userId: session.user.id
  };
}
