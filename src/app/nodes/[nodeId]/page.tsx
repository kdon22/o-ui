'use client'

import React, { useState, useEffect } from 'react'
import { useActionQuery } from '@/hooks/use-action-api'
import { useNodeIdResolver } from '@/lib/utils/entity-id-resolver'
import { MainLayout } from '@/components/layout/main'
import { useRouter } from 'next/navigation'
import { useEnterpriseSession } from '@/hooks/use-enterprise-action-api'
import { useCacheContext } from '@/components/providers/cache-provider'
import { AnimatedLogo } from '@/components/ui/animated-logo'

interface NodePageProps {
  params: Promise<{ nodeId: string }>
}

export default function NodePage({ params }: NodePageProps) {
  const router = useRouter()
  
  // Handle async params properly for Next.js 15.5+
  const [nodeIdShort, setNodeIdShort] = useState<string | null>(null)
  
  // ✅ DEBUG: Track NodePage mount/unmount
  React.useEffect(() => {
    console.log('🔥 [NodePage] COMPONENT MOUNTED with params:', params);
    return () => {
      console.log('🔥 [NodePage] COMPONENT UNMOUNTED');
    };
  }, []);
  
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setNodeIdShort(resolvedParams.nodeId)
      } catch (error) {
        console.error('Error resolving params:', error)
        setNodeIdShort(null)
      }
    }
    
    resolveParams()
  }, [params])
  
  const { session, isAuthenticated, isLoading: sessionLoading, branchContext } = useEnterpriseSession()
  
  // 🔥 NEW: Use consolidated ID resolver (only when nodeIdShort is available)
  const { fullId: fullNodeId, isResolving: isResolvingId, error: resolveError, notFound } = useNodeIdResolver(nodeIdShort || '');
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if we have the required session data for cache context
  const hasRequiredSessionData = isAuthenticated && 
                                session?.user?.tenantId && 
                                branchContext?.currentBranchId

  // Always call useCacheContext hook (hooks must be called unconditionally)
  let cacheContext = null
  try {
    cacheContext = useCacheContext()
  } catch (error) {
    // CacheProvider not available yet, remain in loading state
    
    cacheContext = null
  }

  // Only use cache context if we have the required session data
  const shouldUseCacheContext = hasRequiredSessionData && cacheContext

  // Add detailed debugging for the node page
  console.log('🎯 NodePage: Initial state:', {
    nodeIdShort,
    hasSession: !!session,
    sessionLoading,
    isAuthenticated,
    sessionUserId: session?.user?.id,
    sessionTenantId: session?.user?.tenantId,
    hasRequiredSessionData,
    cacheIsInitialized: cacheContext?.isInitialized,
    cacheIsBootstrapping: cacheContext?.isBootstrapping,
    cacheBranchContext: cacheContext?.branchContext,
    cacheStats: cacheContext?.cacheStats
  })

  // Debug the resolver results
  console.log('🎯 NodePage: Resolver results:', {
    nodeIdShort,
    fullNodeId,
    isResolvingId,
    resolveError: resolveError?.message,
    sessionLoading,
    hasSession: !!session,
    cacheInitialized: cacheContext?.isInitialized
  })
  // 🚀 OPTION A: Branch Switch Fallback - Redirect to Root Node
  useEffect(() => {
    // If node not found and we have session data, redirect to root node
    if (notFound && session?.user?.rootNodeIdShort && !isResolvingId) {
      console.log('🔄 [NodePage] Node not found in current branch - redirecting to root node:', {
        searchedFor: nodeIdShort,
        redirectingTo: session.user.rootNodeIdShort,
        branchContext: branchContext?.currentBranchId
      });
      
      // Redirect to root node of current branch
      router.push(`/nodes/${session.user.rootNodeIdShort}`);
      return;
    }
  }, [notFound, session?.user?.rootNodeIdShort, nodeIdShort, isResolvingId, router, branchContext?.currentBranchId]);

  // Handle loading and error states from resolver
  useEffect(() => {
    if (sessionLoading || !shouldUseCacheContext || !cacheContext?.isInitialized) {
      
      setIsLoading(true)
      return
    }

    if (isResolvingId) {
      
      setIsLoading(true)
      return
    }

    // 🚀 BRANCH SWITCH FIX: Handle notFound gracefully (no error throwing)
    if (notFound) {
      console.warn('⚠️ [NodePage] Node not found - will redirect to root node')
      setIsLoading(true) // Keep loading while redirect happens
      return
    }

    if (resolveError) {
      console.error('❌ NodePage: ID resolution error:', resolveError)
      setError(`Node not found: ${resolveError.message}`)
      setIsLoading(false)
      return
    }

    if (fullNodeId) {
      
      setError(null)
      setIsLoading(false)
      return
    }

    // Still waiting for resolution
    setIsLoading(true)
  }, [sessionLoading, shouldUseCacheContext, cacheContext?.isInitialized, isResolvingId, resolveError, fullNodeId, notFound])

  // Removed redirect-on-error to avoid navigation loops between / and /nodes
  // When the node cannot be resolved, we render the error state below.

  // Show loading while params are being resolved
  if (!nodeIdShort) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <AnimatedLogo size="lg" showText={true} />
          <div className="space-y-2">
            <p className="text-foreground font-medium">Resolving node...</p>
            <div className="w-48 h-1 bg-primary/20 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while session is loading or cache is not ready
  if (sessionLoading || !shouldUseCacheContext || !cacheContext?.isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <AnimatedLogo size="lg" showText={true} />
          <div className="space-y-2">
            <p className="text-foreground font-medium">
              {sessionLoading 
                ? 'Loading session...' 
                : !shouldUseCacheContext 
                  ? 'Initializing user context...'
                  : 'Initializing cache...'}
            </p>
            <div className="w-48 h-1 bg-primary/20 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while we're finding the node
  if (isLoading || isResolvingId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <AnimatedLogo size="lg" showText={true} />
          <div className="space-y-2">
            <p className="text-foreground font-medium">
              {notFound 
                ? 'Redirecting to workspace root...' 
                : isResolvingId 
                  ? 'Finding node...' 
                  : 'Loading node...'}
            </p>
            <div className="w-48 h-1 bg-primary/20 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <AnimatedLogo size="md" showText={false} />
          <div className="space-y-4">
            <div className="text-destructive">
              <h3 className="text-xl font-semibold mb-2">Node Not Found</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Redirecting to home...</p>
              <div className="w-32 h-1 bg-primary/20 rounded-full mx-auto overflow-hidden">
                <div className="w-full h-full bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error if no node found (shouldn't reach here due to useEffect above)
  if (!fullNodeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <AnimatedLogo size="md" showText={false} />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-destructive">Node Not Found</h3>
            <p className="text-muted-foreground">Could not find node with ID: {nodeIdShort}</p>
          </div>
        </div>
      </div>
    )
  }

  // Use MainLayout with the selected node ID
  return <MainLayout initialSelectedNodeId={fullNodeId} />
}