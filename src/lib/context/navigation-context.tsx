'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export interface NavigationContext {
  // Source context - where the user came from
  sourceContext?: {
    type: 'process' | 'node' | 'workflow' | null
    id: string
    name?: string
    metadata?: Record<string, any>
  }
  
  // Target context - where they're going
  targetContext?: {
    type: 'rule' | 'process' | 'node' | 'workflow' | null
    action: 'create' | 'edit' | 'view'
  }
  
  // Junction creation context
  junctionContext?: {
    shouldCreateJunction: boolean
    junctionType: 'processRule' | 'nodeProcess' | 'nodeWorkflow' | null
    sourceId: string
    metadata?: Record<string, any>
  }
}

interface NavigationContextActions {
  setSourceContext: (context: NavigationContext['sourceContext']) => void
  setTargetContext: (context: NavigationContext['targetContext']) => void
  setJunctionContext: (context: NavigationContext['junctionContext']) => void
  clearContext: () => void
  
  // Convenience methods
  navigateFromProcess: (processId: string, processName?: string, metadata?: Record<string, any>) => void
  navigateFromNode: (nodeId: string, nodeName?: string, metadata?: Record<string, any>) => void
  navigateToCreateRule: () => void
}

interface NavigationContextValue extends NavigationContext, NavigationContextActions {}

const NavigationContextInstance = createContext<NavigationContextValue | undefined>(undefined)

export function NavigationContextProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const [sourceContext, setSourceContext] = useState<NavigationContext['sourceContext']>()
  const [targetContext, setTargetContext] = useState<NavigationContext['targetContext']>()
  const [junctionContext, setJunctionContext] = useState<NavigationContext['junctionContext']>()

  // Clear context when navigating away from rules page
  useEffect(() => {
    if (!pathname.startsWith('/rules')) {
      setSourceContext(undefined)
      setTargetContext(undefined)
      setJunctionContext(undefined)
    }
  }, [pathname])

  const clearContext = useCallback(() => {
    setSourceContext(undefined)
    setTargetContext(undefined)
    setJunctionContext(undefined)
  }, [])

  const navigateFromProcess = useCallback((processId: string, processName?: string, metadata?: Record<string, any>) => {
    console.log('🔗 [NavigationContext] Setting process source context:', {
      processId,
      processName,
      metadata,
      timestamp: new Date().toISOString()
    })
    
    setSourceContext({
      type: 'process',
      id: processId,
      name: processName,
      metadata
    })
    
    // Pre-configure junction context for rule creation
    setJunctionContext({
      shouldCreateJunction: true,
      junctionType: 'processRule',
      sourceId: processId,
      metadata
    })
  }, [])

  const navigateFromNode = useCallback((nodeId: string, nodeName?: string, metadata?: Record<string, any>) => {
    console.log('🔗 [NavigationContext] Setting node source context:', {
      nodeId,
      nodeName,
      metadata,
      timestamp: new Date().toISOString()
    })
    
    setSourceContext({
      type: 'node',
      id: nodeId,
      name: nodeName,
      metadata
    })
  }, [])

  const navigateToCreateRule = useCallback(() => {
    console.log('🔗 [NavigationContext] Setting rule target context:', {
      action: 'create',
      hasSourceContext: !!sourceContext,
      sourceType: sourceContext?.type,
      timestamp: new Date().toISOString()
    })
    
    setTargetContext({
      type: 'rule',
      action: 'create'
    })
  }, [sourceContext])

  const value: NavigationContextValue = {
    sourceContext,
    targetContext,
    junctionContext,
    setSourceContext,
    setTargetContext,
    setJunctionContext,
    clearContext,
    navigateFromProcess,
    navigateFromNode,
    navigateToCreateRule
  }

  return (
    <NavigationContextInstance.Provider value={value}>
      {children}
    </NavigationContextInstance.Provider>
  )
}

export function useNavigationContext(): NavigationContextValue {
  const context = useContext(NavigationContextInstance)
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationContextProvider')
  }
  return context
}

// Hook for detecting rule creation with process context
export function useRuleCreationContext() {
  const { sourceContext, targetContext, junctionContext, clearContext } = useNavigationContext()
  
  const isCreatingRuleFromProcess = !!(
    sourceContext?.type === 'process' &&
    targetContext?.type === 'rule' &&
    targetContext?.action === 'create' &&
    junctionContext?.shouldCreateJunction &&
    junctionContext?.junctionType === 'processRule'
  )
  
  const processContext = isCreatingRuleFromProcess ? {
    processId: sourceContext!.id,
    processName: sourceContext!.name,
    metadata: sourceContext!.metadata
  } : null
  
  return {
    isCreatingRuleFromProcess,
    processContext,
    junctionContext,
    clearContext
  }
} 