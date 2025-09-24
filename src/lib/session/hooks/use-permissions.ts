/**
 * usePermissions - User Permissions Hook
 * 
 * Single source of truth for user permissions and access control.
 * Provides role-based access control and resource-level permissions.
 */

import { useSession } from 'next-auth/react';
import { useCallback, useMemo } from 'react';
import type { PermissionsHookReturn, UserPermissions } from '../types';

export function usePermissions(): PermissionsHookReturn {
  const { data: session } = useSession();
  
  // ============================================================================
  // PERMISSIONS STATE
  // ============================================================================
  
  const isReady = !!session?.user;
  const permissions: UserPermissions | null = useMemo(() => {
    if (!session?.user) return null;
    
    return {
      role: session.user.role || 'user',
      permissions: session.user.permissions || [],
      tenantPermissions: session.user.tenantPermissions || [],
      canAccessBranches: session.user.canAccessBranches ?? true,
      canManageUsers: session.user.canManageUsers ?? false,
      canManageSettings: session.user.canManageSettings ?? false,
    };
  }, [session?.user]);
  
  // ============================================================================
  // PERMISSION CHECKING UTILITIES
  // ============================================================================
  
  const hasPermission = useCallback((permission: string): boolean => {
    if (!permissions) return false;
    
    // Super admin has all permissions
    if (permissions.role === 'super_admin') return true;
    
    // Check direct permissions
    if (permissions.permissions.includes(permission)) return true;
    
    // Check tenant-specific permissions
    return permissions.tenantPermissions.some(
      tp => tp.permissions.includes(permission)
    );
  }, [permissions]);
  
  const canAccessResource = useCallback((resource: string, action: string): boolean => {
    if (!permissions) return false;
    
    // Super admin can do anything
    if (permissions.role === 'super_admin') return true;
    
    // Check specific permission pattern: resource:action (e.g., "rules:create", "nodes:delete")
    const specificPermission = `${resource}:${action}`;
    if (hasPermission(specificPermission)) return true;
    
    // Check wildcard permission: resource:* (e.g., "rules:*")
    const wildcardPermission = `${resource}:*`;
    if (hasPermission(wildcardPermission)) return true;
    
    // Check admin permissions
    if (permissions.role === 'admin' && action === 'read') return true;
    if (permissions.role === 'admin' && ['create', 'update', 'delete'].includes(action)) return true;
    
    // Check editor permissions
    if (permissions.role === 'editor' && ['read', 'create', 'update'].includes(action)) return true;
    
    // Default deny
    return false;
  }, [permissions, hasPermission]);
  
  const userRole = useMemo(() => {
    return permissions?.role || null;
  }, [permissions]);
  
  // ============================================================================
  // RETURN VALUES
  // ============================================================================
  
  return {
    permissions,
    hasPermission,
    canAccessResource,
    userRole,
    isReady,
  };
}
