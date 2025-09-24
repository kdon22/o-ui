'use client'

import React, { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react'
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

  // ============================================================================
  // CLEAN BOOTSTRAP - SSOT VIA INDEXEDDB MANAGER
  // ============================================================================
  
  const performBootstrap = useCallback(async () => {
    if (isBootstrapping) return

    setIsBootstrapping(true)
    try {
      console.log('🚀 [CacheProvider] Clean bootstrap starting')
      
      const actionClient = getActionClient(tenantId, branchContext)
      
      // Check SSOT bootstrap status
      const alreadyBootstrapped = await actionClient.indexedDB.isBootstrapped()
      if (alreadyBootstrapped) {
        console.log('✅ [CacheProvider] Already bootstrapped via SSOT')
        return
      }
      
      // Perform bootstrap
      const result = await workspaceBootstrap.bootstrap({
        tenantId,
        branchContext,
        strategy: 'critical',
        maxRecordsPerResource: 1000
      })
      
      if (result.success) {
        // Mark as bootstrapped via SSOT
        await actionClient.indexedDB.setBootstrapped(true)
        console.log('✅ [CacheProvider] Bootstrap completed via SSOT')
      } else {
        console.error('❌ [CacheProvider] Bootstrap failed:', result.errors)
      }
      
    } catch (error) {
      console.error('❌ [CacheProvider] Bootstrap error:', error)
    } finally {
      setIsBootstrapping(false)
    }
  }, [tenantId, branchContext]) // Removed isBootstrapping from dependencies

  // Auto-bootstrap when ready
  useEffect(() => {
    if (branchContext.isReady && !isBootstrapping) {
      performBootstrap()
    }
  }, [branchContext.isReady, performBootstrap]) // Removed isBootstrapping from dependencies

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
