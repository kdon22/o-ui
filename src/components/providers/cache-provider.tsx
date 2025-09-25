'use client'

import React, { createContext, useContext, useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { useBranchContext } from '@/lib/session'
import { getActionClient } from '@/lib/action-client'
import workspaceBootstrap from '@/lib/services/workspace-bootstrap'

// ============================================================================
// CLEAN CACHE PROVIDER - SSOT VIA INDEXEDDB MANAGER
// ============================================================================

interface CacheProviderProps {
  children: React.ReactNode
  tenantId: string
}

interface CacheContextValue {
  tenantId: string
  isBootstrapping: boolean
}

const CacheContext = createContext<CacheContextValue | null>(null)

export function CacheProvider({ children, tenantId }: CacheProviderProps) {
  const branchContext = useBranchContext()
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const bootstrapAttempted = useRef<string | null>(null) // Track last attempted bootstrap context

  // ============================================================================
  // CLEAN BOOTSTRAP - SSOT VIA INDEXEDDB MANAGER
  // ============================================================================
  
  const performBootstrap = useCallback(async () => {
    if (isBootstrapping) return

    setIsBootstrapping(true)
    try {
      console.log('🚀 [CacheProvider] Clean bootstrap starting')
      
      // Perform bootstrap - simplified without IndexedDB bootstrap checking
      const result = await workspaceBootstrap.bootstrap({
        tenantId,
        branchContext,
        strategy: 'critical',
        maxRecordsPerResource: 1000
      })
      
      if (result.success) {
        console.log('✅ [CacheProvider] Bootstrap completed')
      } else {
        console.error('❌ [CacheProvider] Bootstrap failed:', result.errors)
        // Reset attempt tracking on failure so it can be retried
        bootstrapAttempted.current = null
      }
      
    } catch (error) {
      console.error('❌ [CacheProvider] Bootstrap error:', error)
      // Reset attempt tracking on error so it can be retried  
      bootstrapAttempted.current = null
    } finally {
      setIsBootstrapping(false)
    }
  }, [tenantId, branchContext]) // Removed isBootstrapping from dependencies

  // Auto-bootstrap when ready - FIXED: Use ref to prevent infinite loops
  useEffect(() => {
    const contextKey = `${tenantId}:${branchContext.currentBranchId}:${branchContext.defaultBranchId}`
    
    if (branchContext.isReady && !isBootstrapping && bootstrapAttempted.current !== contextKey) {
      bootstrapAttempted.current = contextKey // Mark this context as attempted
      performBootstrap()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [branchContext.isReady, branchContext.currentBranchId, branchContext.defaultBranchId, tenantId, isBootstrapping]) // ✅ Removed performBootstrap from deps

  // Clean context value
  const contextValue = useMemo(() => ({
    tenantId,
    isBootstrapping
  }), [tenantId, isBootstrapping])

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCacheContext() {
  const context = useContext(CacheContext)
  if (!context) {
    throw new Error('useCacheContext must be used within a CacheProvider')
  }
  return context
}

export function useOptionalCacheContext() {
  const context = useContext(CacheContext)
  return context // Returns null if not in provider, doesn't throw
}
