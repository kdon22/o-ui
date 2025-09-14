"use client"

import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Database, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUTRIntegration } from '../hooks/use-utr-integration'
import type { UTRConnectionConfig } from '../types'

interface UTRStatusPanelProps {
  config: UTRConnectionConfig
}

export const UTRStatusPanel = ({ config }: UTRStatusPanelProps) => {
  const { consolidatedUTR, isLoading, error, fetchUTR } = useUTRIntegration()
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  
  const handleFetchUTR = async () => {
    setHasAttemptedFetch(true)
    try {
      await fetchUTR(config)
    } catch (err) {
      // Error is handled by the hook
    }
  }
  
  const getStatusColor = () => {
    if (isLoading) return 'text-blue-500'
    if (error) return 'text-red-500'
    if (consolidatedUTR) return 'text-green-500'
    return 'text-muted-foreground'
  }
  
  const getStatusText = () => {
    if (isLoading) return 'Loading UTR data...'
    if (error) return 'Failed to load UTR'
    if (consolidatedUTR) return 'UTR data ready'
    if (config.sources.length === 0) return 'No sources configured'
    return 'Ready to fetch UTR'
  }
  
  return (
    <div className="p-3 border-t border-border bg-muted/20">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className={`w-4 h-4 ${getStatusColor()}`} />
          <span className="text-sm font-medium">UTR Data Status</span>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleFetchUTR}
          disabled={isLoading || config.sources.length === 0}
          className="h-7"
        >
          {isLoading ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            'Fetch UTR'
          )}
        </Button>
      </div>
      
      {/* Status Message */}
      <div className={`text-sm ${getStatusColor()}`}>
        {getStatusText()}
      </div>
      
      {/* UTR Metadata */}
      {consolidatedUTR && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {consolidatedUTR.metadata.sourceCount} sources
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {Math.round(consolidatedUTR.metadata.completenessScore * 100)}% complete
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {consolidatedUTR.metadata.assembledAt.toLocaleTimeString()}
            </div>
          </div>
          
          {/* Source Status */}
          <div className="flex flex-wrap gap-1">
            {consolidatedUTR.sources.map((source) => (
              <Badge 
                key={source.id} 
                variant={source.status === 'loaded' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {source.vendor}: {source.locator}
                {source.status === 'loaded' && <CheckCircle className="w-2 h-2 ml-1" />}
                {source.status === 'error' && <AlertCircle className="w-2 h-2 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      {/* Errors from UTR Assembly */}
      {consolidatedUTR?.errors && consolidatedUTR.errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {consolidatedUTR.errors.map((err, index) => (
            <div key={index} className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              {err}
            </div>
          ))}
        </div>
      )}
      
      {/* Help Text */}
      {config.sources.length === 0 && !hasAttemptedFetch && (
        <div className="mt-2 text-xs text-muted-foreground">
          Add source data (vendor + locator) to test rules with real UTR objects
        </div>
      )}
    </div>
  )
}