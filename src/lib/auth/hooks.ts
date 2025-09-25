// Auth.js v5 hooks to replace multiple auth stores
import { useSession } from "next-auth/react"
import { useCallback } from "react"
import type { UserTenant } from "./types"

/**
 * Main auth hook - replaces all the different auth stores
 * Provides single source of truth for authentication state
 */
export function useAuth() {
  const { data: session, status, update } = useSession()
  
  return {
    // User info
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading: status === "loading",
    
    // Tenant info (preserves your multi-tenant setup)
    currentTenant: session?.user?.tenantId || null,
    rootNodeId: session?.user?.rootNodeId || null,
    userTenants: session?.user?.userTenants || [],
    
    // Actions
    updateSession: update,
    
    // Helpers
    hasAccess: (requiredRole?: string) => {
      if (!session?.user) return false
      // Add your role checking logic here
      return true
    },
    
    switchTenant: async (tenantId: string) => {
      await update({
        ...session,
        user: {
          ...session?.user,
          tenantId,
        },
      })
    },
  }
}

/**
 * Hook for TOTP operations
 */
export function useTotp() {
  const sendCode = useCallback(async (email: string) => {
    try {
      const response = await fetch("/api/auth/totp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to send TOTP code")
      }
      
      return { success: true }
    } catch (error) {
      console.error("TOTP send error:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }, [])
  
  const verifyCode = useCallback(async (email: string, code: string) => {
    try {
      const response = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to verify TOTP code")
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error("TOTP verify error:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }, [])
  
  return {
    sendCode,
    verifyCode,
  }
}

/**
 * Hook for device management
 */
export function useDevices() {
  const { data: session } = useSession()
  
  const getDevices = useCallback(async () => {
    if (!session?.user?.id) return []
    
    try {
      const response = await fetch("/api/auth/devices")
      if (!response.ok) return []
      
      return await response.json()
    } catch (error) {
      console.error("Failed to fetch devices:", error)
      return []
    }
  }, [session?.user?.id])
  
  const revokeDevice = useCallback(async (deviceId: string) => {
    try {
      const response = await fetch(`/api/auth/devices/${deviceId}`, {
        method: "DELETE",
      })
      
      return response.ok
    } catch (error) {
      console.error("Failed to revoke device:", error)
      return false
    }
  }, [])
  
  return {
    getDevices,
    revokeDevice,
  }
}

/**
 * Hook for session management
 */
export function useSessionManager() {
  const { data: session } = useSession()
  
  const extendSession = useCallback(async (days: number = 7) => {
    try {
      const response = await fetch("/api/auth/session/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      })
      
      return response.ok
    } catch (error) {
      console.error("Failed to extend session:", error)
      return false
    }
  }, [])
  
  const getSessionInfo = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session/info")
      if (!response.ok) return null
      
      return await response.json()
    } catch (error) {
      console.error("Failed to get session info:", error)
      return null
    }
  }, [])
  
  return {
    extendSession,
    getSessionInfo,
    expiresAt: session?.expires,
  }
} 