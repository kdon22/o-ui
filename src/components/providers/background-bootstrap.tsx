/**
 * Background Bootstrap - Non-Blocking IndexedDB Initialization
 * 
 * World-class approach:
 * - Never blocks UI rendering
 * - Timeout protection (3-5s per resource)
 * - Fail-open strategy (show offline indicator)
 * - Progressive loading via React Query placeholderData
 * - Leverages existing action system for Dexie-first reads
 */

'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { getActionClient } from '@/lib/action-client'

interface BootstrapContextValue {
  isInitialized: boolean
  isBootstrapping: boolean
  isOffline: boolean
  bootstrapProgress: number
  lastBootstrap: number | null
  retryBootstrap: () => void
}

const BootstrapContext = createContext<BootstrapContextValue | null>(null)

interface BackgroundBootstrapProps {
  children: React.ReactNode
}

export function BackgroundBootstrap({ children }: BackgroundBootstrapProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  
  // ✅ ALL HOOKS MUST BE CALLED UNCONDITIONALLY - React Rules of Hooks
  const [isInitialized, setIsInitialized] = useState(true) // Always start true - never block UI
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [bootstrapProgress, setBootstrapProgress] = useState(0)
  const [lastBootstrap, setLastBootstrap] = useState<number | null>(null)

  // Check if we're on an auth page - DON'T bootstrap on these pages
  const isAuthPage = pathname === '/login' || 
                     pathname === '/devices' || 
                     pathname?.startsWith('/(auth)') ||
                     pathname?.includes('/auth/') ||
                     status === 'unauthenticated' ||
                     status === 'loading'

  // Background bootstrap function with timeout protection - MUST BE DEFINED BEFORE EARLY RETURNhve
  const performBootstrap = useCallback(async () => {
    if (isBootstrapping || status !== 'authenticated' || !session?.user?.tenantId) {
      return
    }

    setIsBootstrapping(true)
    setIsOffline(false)
    setBootstrapProgress(0)

    try {
      const tenantId = session.user.tenantId
      const branchContext = {
        currentBranchId: session.user.branchContext?.currentBranchId || 'main',
        defaultBranchId: session.user.branchContext?.defaultBranchId || 'main',
        tenantId,
        userId: session.user.id,
        isReady: true as const
      }

      // Get action client
      const actionClient = getActionClient(tenantId, branchContext)
      
      // Critical resources only (for instant navigation)
      const criticalResources = [
        { type: 'branches', limit: 10 },
        { type: 'nodes', limit: 50 }, // Root + immediate children only
      ]

      setBootstrapProgress(10)

      // Load critical resources with timeout protection
      for (let i = 0; i < criticalResources.length; i++) {
        const resource = criticalResources[i]
        
        try {
          // 3 second timeout per resource
          await Promise.race([
            actionClient.executeAction({
              action: `${resource.type === 'branches' ? 'branches' : resource.type.slice(0, -1)}.list`,
              data: { limit: resource.limit },
              branchContext
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`${resource.type} timeout`)), 3000)
            )
          ])

          const progress = 10 + ((i + 1) / criticalResources.length) * 40
          setBootstrapProgress(progress)
          
        } catch (error) {
          console.warn(`⚠️ [Bootstrap] ${resource.type} failed, continuing:`, error)
          // Continue with other resources - fail-open strategy
        }
      }

      setBootstrapProgress(100)
      setLastBootstrap(Date.now())
      
      // Start lazy loading non-critical resources in background
      setTimeout(() => {
        loadNonCriticalResources(actionClient, branchContext)
      }, 1000)

    } catch (error) {
      console.error('❌ [Bootstrap] Critical failure:', error)
      setIsOffline(true)
    } finally {
      setIsBootstrapping(false)
    }
  }, [isBootstrapping, status, session])

  // Load non-critical resources in background (no UI blocking)
  const loadNonCriticalResources = async (actionClient: any, branchContext: any) => {
    // ✅ CRITICAL: Only load if authenticated and not on auth page
    if (status !== 'authenticated' || !session?.user?.tenantId || isAuthPage) {
      console.log('🚫 [Bootstrap] Skipping non-critical resource loading:', {
        status,
        hasSession: !!session,
        hasTenantId: !!session?.user?.tenantId,
        isAuthPage,
        pathname
      })
      return
    }

    const nonCriticalResources = ['rules', 'processes', 'workflows', 'offices']
    
    for (const resourceType of nonCriticalResources) {
      try {
        await Promise.race([
          actionClient.executeAction({
            action: `${resourceType}.list`,
            data: { limit: 200 },
            branchContext
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`${resourceType} timeout`)), 5000)
          )
        ])
      } catch (error) {
        console.warn(`⚠️ [Bootstrap] ${resourceType} background load failed:`, error)
        // Silent failure - don't affect UI
      }
    }
  }

  // Retry function - MUST BE DEFINED BEFORE EARLY RETURN
  const retryBootstrap = useCallback(() => {
    setIsOffline(false)
    performBootstrap()
  }, [performBootstrap])

  // Start bootstrap after first paint - but NEVER on auth pages
  useEffect(() => {
    console.log('🔍 [BackgroundBootstrap] Bootstrap check:', {
      status,
      hasSession: !!session,
      hasTenantId: !!session?.user?.tenantId,
      isAuthPage,
      pathname,
      willBootstrap: status === 'authenticated' && session?.user?.tenantId && !isAuthPage
    })
    
    if (status === 'authenticated' && session?.user?.tenantId && !isAuthPage) {
      console.log('✅ [BackgroundBootstrap] Starting bootstrap in background')
      // Use setTimeout with a small delay to ensure session is fully synchronized
      setTimeout(performBootstrap, 1000) // 1 second delay to allow session sync
    } else if (isAuthPage) {
      console.log('🚫 [BackgroundBootstrap] Skipping bootstrap on auth page:', pathname)
    }
  }, [status, session?.user?.tenantId, isAuthPage, pathname, performBootstrap])

  // 🚫 SIMPLE FIX: If we're on auth pages, just render children with no bootstrap
  if (isAuthPage) {
    console.log('🚫 [BackgroundBootstrap] Skipping bootstrap - on auth page:', {
      pathname,
      status,
      isAuthPage: true
    })
    return <BootstrapContext.Provider value={{
      isInitialized: true,
      isBootstrapping: false,
      isOffline: false,
      bootstrapProgress: 0,
      lastBootstrap: null,
      retryBootstrap: () => {}
    }}>
      {children}
    </BootstrapContext.Provider>
  }

  const contextValue: BootstrapContextValue = {
    isInitialized,
    isBootstrapping,
    isOffline,
    bootstrapProgress,
    lastBootstrap,
    retryBootstrap
  }

  return (
    <BootstrapContext.Provider value={contextValue}>
      {children}
      {isOffline && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-md shadow-lg">
          <div className="flex items-center space-x-2">
            <span>Offline mode</span>
            <button
              onClick={retryBootstrap}
              className="text-yellow-900 hover:text-yellow-700 underline text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </BootstrapContext.Provider>
  )
}

export function useBootstrap() {
  const context = useContext(BootstrapContext)
  if (!context) {
    throw new Error('useBootstrap must be used within BackgroundBootstrap')
  }
  return context
}
