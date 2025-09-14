"use client"

import { ScrollArea } from '@/components/ui/scroll-area'
import { SourceDataPanel } from './source-data-panel'
import { WorkflowSelector } from './workflow-selector'
import { EmailOverrides } from './email-overrides'
import { UTRStatusPanel } from './utr-status-panel'
import type { UTRConnectionConfig } from '../types'

interface UTRConnectionTabProps {
  config: UTRConnectionConfig
  onChange: (config: UTRConnectionConfig) => void
}

export const UTRConnectionTab = ({ config, onChange }: UTRConnectionTabProps) => {
  const updateSources = (sources: typeof config.sources) => {
    onChange({ ...config, sources, lastUpdated: new Date() })
  }

  const updateWorkflow = (workflow: typeof config.workflow) => {
    onChange({ ...config, workflow, lastUpdated: new Date() })
  }

  const updateEmailOverrides = (emailOverrides: typeof config.emailOverrides) => {
    onChange({ ...config, emailOverrides, lastUpdated: new Date() })
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Source Data Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Source Data</h4>
            <div className="text-xs text-muted-foreground">
              {config.sources.length} source{config.sources.length !== 1 ? 's' : ''}
            </div>
          </div>
          <SourceDataPanel 
            sources={config.sources}
            onChange={updateSources}
          />
        </div>

        {/* Workflow Selection */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Workflow / Process</h4>
          <WorkflowSelector 
            workflow={config.workflow}
            onChange={updateWorkflow}
          />
        </div>

        {/* Email Overrides */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Email Delivery</h4>
          <EmailOverrides 
            overrides={config.emailOverrides}
            onChange={updateEmailOverrides}
          />
        </div>

        {/* Connection Status */}
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">
            {config.lastUpdated ? (
              <>Last updated: {config.lastUpdated.toLocaleTimeString()}</>
            ) : (
              'Configuration not saved'
            )}
          </div>
        </div>
      </div>
      
      {/* UTR Status Panel - Fixed at bottom */}
      <div className="border-t border-border">
        <UTRStatusPanel config={config} />
      </div>
    </ScrollArea>
  )
}