/**
 * Session Utilities - DEPRECATED - Use Action System Instead
 * 
 * @deprecated These functions use the old direct API approach.
 * New code should use the action system for user updates.
 */

export async function updateLastSelectedNode(nodeId: string, nodeIdShort: string, updateSession?: any) {
  
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lastAccessedNodeId: nodeId,
        lastAccessedNodeIdShort: nodeIdShort
      })
    });

    if (updateSession && response.ok) {
      // Simple session update
      await updateSession({});
    }

    return response.ok;
  } catch (error) {
    
    return false;
  }
}

export async function updateUserPreferences(preferences: Record<string, any>, updateSession?: any) {
  
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });

    return response.ok;
  } catch (error) {
    
    return false;
  }
}

export function extractBranchInfo(session: any) {
  if (!session?.user?.branchContext) {
    return {
      currentBranch: null,
      availableBranches: []
    };
  }

  const branchContext = session.user.branchContext;
  const currentBranch = branchContext.availableBranches?.find(
    (branch: any) => branch.id === branchContext.currentBranchId
  ) || {
    id: branchContext.currentBranchId,
    name: branchContext.currentBranchId,
    description: null,
    isDefault: branchContext.currentBranchId === branchContext.defaultBranchId,
    lastModified: new Date().toISOString()
  };

  return {
    currentBranch,
    availableBranches: branchContext.availableBranches || []
  };
}

export function validateSessionData(session: any) {
  return {
    isValid: !!session?.user?.tenantId,
    missing: [],
    warnings: []
  };
}

export function debugSessionData(session: any, label: string = 'Session Debug') {

}