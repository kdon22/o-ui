"use client"

import { useState, useCallback } from 'react'
import { VendorIntegrationService } from '../services/vendor-integration'
import type { UTRConnectionConfig, ConsolidatedUTR } from '../types'

/**
 * 🎯 UTR INTEGRATION HOOK
 * 
 * Manages UTR data retrieval and assembly for rule testing.
 * Connects the UTR connection configuration to the vendor integration service.
 */

interface UTRIntegrationState {
  consolidatedUTR?: ConsolidatedUTR
  isLoading: boolean
  error?: string
  lastFetch?: Date
}

export function useUTRIntegration() {
  const [state, setState] = useState<UTRIntegrationState>({
    isLoading: false
  })
  
  const vendorService = new VendorIntegrationService()
  
  /**
   * 🔄 Fetch consolidated UTR from configured sources
   */
  const fetchUTR = useCallback(async (config: UTRConnectionConfig) => {
    if (config.sources.length === 0) {
      setState({ isLoading: false, error: 'No sources configured' })
      return
    }
    
    setState({ isLoading: true, error: undefined })
    
    try {
  
      
      const consolidatedUTR = await vendorService.getConsolidatedUTR(config)
      
      setState({
        consolidatedUTR,
        isLoading: false,
        lastFetch: new Date()
      })
      
  
      
      return consolidatedUTR
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ [useUTRIntegration] UTR fetch failed:', errorMessage)
      
      setState({
        isLoading: false,
        error: errorMessage
      })
      
      throw error
    }
  }, [vendorService])
  
  /**
   * 🧹 Clear UTR data
   */
  const clearUTR = useCallback(() => {
    setState({
      isLoading: false,
      consolidatedUTR: undefined,
      error: undefined,
      lastFetch: undefined
    })
  }, [])
  
  /**
   * 🎯 Get UTR data for rule execution
   */
  const getUTRForRuleExecution = useCallback(() => {
    return state.consolidatedUTR?.data
  }, [state.consolidatedUTR])
  
  /**
   * 📊 Get UTR metadata and status
   */
  const getUTRStatus = useCallback(() => {
    return {
      hasUTR: !!state.consolidatedUTR,
      sourceCount: state.consolidatedUTR?.metadata.sourceCount || 0,
      completenessScore: state.consolidatedUTR?.metadata.completenessScore || 0,
      lastFetch: state.lastFetch,
      errors: state.consolidatedUTR?.errors || (state.error ? [state.error] : [])
    }
  }, [state])
  
  return {
    // State
    consolidatedUTR: state.consolidatedUTR,
    isLoading: state.isLoading,
    error: state.error,
    lastFetch: state.lastFetch,
    
    // Actions
    fetchUTR,
    clearUTR,
    
    // Helpers
    getUTRForRuleExecution,
    getUTRStatus
  }
}