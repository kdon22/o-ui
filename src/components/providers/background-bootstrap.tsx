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

      console.log('📋 [Bootstrap] TWO-PHASE STRATEGY:')
      console.log('   Phase 1: Core resources (instant UI) - branches, node, process, rule')  
      console.log('   Phase 2: Secondary resources (background) - user, credential, settings, etc.')

      // Get action client
      const actionClient = getActionClient(tenantId, branchContext)
      
      // ============================================================================
      // PHASE 1: CORE RESOURCES (Immediate Population for Instant UI)
      // ============================================================================
      // Only populate essential resources for instant tree navigation and basic CRUD
      const coreResources = [
        { type: 'branches', limit: 10 }, // Essential for branch switching
        { type: 'node', limit: 50 }, // Root + immediate children only  
        { type: 'process', limit: 25 }, // Essential processes for tree navigation
        { type: 'rule', limit: 25 }, // Core rules for basic functionality
      ]

      setBootstrapProgress(10)

      // PHASE 1: Load core resources with timeout protection (instant UI)
      for (let i = 0; i < coreResources.length; i++) {
        const resource = coreResources[i]
        
        try {
          // 3 second timeout per resource
          await Promise.race([
            actionClient.executeAction({
              action: `${resource.type}.list`, // branches → branches.list, node → node.list, process → process.list, rule → rule.list
              data: { limit: resource.limit },
              branchContext
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`${resource.type} timeout`)), 3000)
            )
          ])

          const progress = 10 + ((i + 1) / coreResources.length) * 40
          setBootstrapProgress(progress)
          
        } catch (error) {
          console.warn(`⚠️ [Bootstrap] ${resource.type} failed, continuing:`, error)
          // Continue with other resources - fail-open strategy
        }
      }

      console.log('✅ [Bootstrap] Phase 1 COMPLETE: Core resources loaded - UI ready for navigation!')
      setBootstrapProgress(50) // Core resources complete

      // ============================================================================
      // PHASE 2: SECONDARY RESOURCES (Background Population - Non-Blocking)  
      // ============================================================================
      // Start background population immediately (don't wait)
      setTimeout(() => {
        loadSecondaryResources(actionClient, branchContext)
      }, 100) // Start almost immediately but don't block core completion

      setBootstrapProgress(100)
      setLastBootstrap(Date.now())

    } catch (error) {
      console.error('❌ [Bootstrap] Critical failure:', error)
      setIsOffline(true)
    } finally {
      setIsBootstrapping(false)
    }
  }, [isBootstrapping, status, session])

  // PHASE 2: Load secondary resources in background (no UI blocking)
  const loadSecondaryResources = async (actionClient: any, branchContext: any) => {
    // ✅ CRITICAL: Only load if authenticated and not on auth page
    if (status !== 'authenticated' || !session?.user?.tenantId || isAuthPage) {
      console.log('🚫 [Bootstrap] Skipping secondary resource loading:', {
        status,
        hasSession: !!session,
        hasTenantId: !!session?.user?.tenantId,
        isAuthPage,
        pathname
      })
      return
    }

    console.log('🔄 [Bootstrap] Starting Phase 2: Background secondary resource population...')

    // Secondary resources (populate after core UI is ready)
    const secondaryResources = [
      // User & configuration (commonly accessed from settings)
      { type: 'user', limit: 100 },
      { type: 'credential', limit: 50 },
      { type: 'office', limit: 100 },
      { type: 'workflow', limit: 100 },
      
      // Settings System (server-only but accessible via actions)
      { type: 'endTransactSettings', limit: 10 },
      { type: 'hitSettings', limit: 10 },
      { type: 'runtimeNotifications', limit: 10 },
      
      // Pull Request & Settings (accessed from settings pages)
      { type: 'pullRequests', limit: 10 },
      { type: 'pullRequestReviews', limit: 10 },
      { type: 'pullRequestComments', limit: 10 },
      { type: 'prSettings', limit: 10 },
      
      // Data management & marketplace
      { type: 'dataTables', limit: 50 },
      { type: 'tableCategories', limit: 20 },
      { type: 'tableData', limit: 50 },
      { type: 'session', limit: 20 },
      
      // Tag system
      { type: 'tagGroups', limit: 20 },
      { type: 'tags', limit: 100 },
      { type: 'classes', limit: 50 },
      
      // Queue system (server-only)
      { type: 'queueConfigs', limit: 10 },
      { type: 'queueMessages', limit: 50 },
      { type: 'queueWorkers', limit: 10 },
      
      // Marketplace
      { type: 'marketplacePackages', limit: 50 },
      { type: 'packageInstallations', limit: 20 }
    ]
    
    let completedCount = 0
    for (const resource of secondaryResources) {
      try {
        await Promise.race([
          actionClient.executeAction({
            action: `${resource.type}.list`,
            data: { limit: resource.limit },
            branchContext
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`${resource.type} timeout`)), 5000)
          )
        ])
        completedCount++
        console.log(`✅ [Bootstrap] Secondary resource loaded: ${resource.type} (${completedCount}/${secondaryResources.length})`)
      } catch (error) {
        console.warn(`⚠️ [Bootstrap] ${resource.type} background load failed:`, error)
        // Silent failure - don't affect UI
      }
    }

    console.log(`🎉 [Bootstrap] Phase 2 complete: ${completedCount}/${secondaryResources.length} secondary resources loaded`)
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
      console.log('🚀 [BackgroundBootstrap] Starting TWO-PHASE bootstrap: Core → Secondary')
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
