'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useNodeData } from '@/components/providers/node-data-provider'
import { useCacheContext } from '@/components/providers/cache-provider'

export function NavigationTracker() {
  const pathname = usePathname()
  const { data: session, update } = useSession()
  const updateTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Add cache context debugging
  const cacheContext = useCacheContext()
  
  // Add detailed debugging for session and cache
  console.log('🧭 NavigationTracker: Current state:', {
    pathname,
    hasSession: !!session,
    sessionUserId: session?.user?.id,
    sessionTenantId: session?.user?.tenantId,
    cacheIsInitialized: cacheContext.isInitialized,
    cacheIsBootstrapping: cacheContext.isBootstrapping,
    cacheBranchContext: cacheContext.branchContext,
    cacheStats: cacheContext.cacheStats
  })

  // Get all nodes from centralized provider to resolve idShort to full node data
  const { nodes, error: nodesError, isLoading: nodesLoading } = useNodeData();

  // Log nodes data state
  console.log('🧭 NavigationTracker: Nodes data state:', {
    hasNodesData: nodes.length > 0,
    nodesDataLength: nodes.length,
    nodesError: nodesError,
    nodesLoading,
    sampleNodes: nodes.slice(0, 2).map((node) => ({
      id: node.id,
      idShort: node.idShort,
      name: node.name
    }))
  })

  useEffect(() => {
    // Only track if user is logged in and we have nodes data
    if (!session?.user?.id || nodes.length === 0) {
      console.log('🧭 NavigationTracker: Skipping tracking - missing requirements:', {
        hasSession: !!session?.user?.id,
        hasNodesData: nodes.length > 0
      })
      return
    }

    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    // Check if we're on a node page (simpler format: /nodes/NNCHCMX)
    const nodePathMatch = pathname.match(/^\/nodes\/([^\/]+)$/)
    if (!nodePathMatch) {

      return
    }

    const nodeIdShort = nodePathMatch[1]
    
    // Find the full node data from idShort
    const foundNode = nodes.find((node) => {
      const nodeIdShortValue = node.idShort || node.id.slice(0, 8)
      return nodeIdShortValue === nodeIdShort
    })

    if (!foundNode) {
      console.warn('🧭 NavigationTracker: Could not find node for idShort:', nodeIdShort)
      return
    }

    // Skip if this is already the current last accessed node
    if (session.user.preferences?.lastAccessedNodeIdShort === nodeIdShort) {
      
      return
    }

    // Debounce updates to avoid excessive API calls
    updateTimeoutRef.current = setTimeout(async () => {
      try {

        
        // Update via action system (offline-first)
        const tenantId = session.user?.tenantId
        if (!tenantId) {
          console.error('❌ NavigationTracker: No tenant ID available')
          return
        }

        const { getActionClient } = await import('@/lib/action-client')
        const actionClient = getActionClient(tenantId)
        
        // Get current personalPreferences and merge navigation data
        const currentPersonalPrefs = (session.user as any)?.personalPreferences || {}
        
        await actionClient.executeAction({
          action: 'user.update',
          data: {
            id: session.user.id,
            personalPreferences: {
              ...currentPersonalPrefs,
              lastAccessedNodeId: foundNode.id,
              lastAccessedNodeIdShort: nodeIdShort,
              lastAccessedAt: new Date().toISOString()
            }
          }
        })

        // Update the session to reflect the new last accessed node
        await update({
          user: {
            ...session.user,
            personalPreferences: {
              ...currentPersonalPrefs,
              lastAccessedNodeId: foundNode.id,
              lastAccessedNodeIdShort: nodeIdShort,
              lastAccessedAt: new Date().toISOString()
            }
          }
        })

  
      } catch (error) {
        console.error('❌ NavigationTracker: Error updating last accessed node:', error)
      }
    }, 1000) // 1 second debounce
    
  }, [pathname, session, nodes, update])

  // Cleanup function
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  return null // This component doesn't render anything
}