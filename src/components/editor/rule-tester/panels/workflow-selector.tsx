"use client"

import { Settings, Play, TestTube } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { WorkflowConfig } from '../types'

interface WorkflowSelectorProps {
  workflow: WorkflowConfig
  onChange: (workflow: WorkflowConfig) => void
}

// Mock workflow data - will connect to action system later
const MOCK_WORKFLOWS = [
  {
    id: 'pnr-validation',
    name: 'PNR Validation',
    description: 'Standard PNR validation and cleanup rules'
  },
  {
    id: 'fare-auditing',
    name: 'Fare Auditing',
    description: 'Validate fare calculations and taxes'
  },
  {
    id: 'corporate-approval',
    name: 'Corporate Approval',
    description: 'Corporate travel policy validation'
  },
  {
    id: 'emergency-handling',
    name: 'Emergency Handling',
    description: 'High-priority travel disruption rules'
  },
  {
    id: 'custom-testing',
    name: 'Custom Testing',
    description: 'Free-form rule testing environment'
  }
]

const MOCK_PROCESSES = [
  'UTR Processing',
  'Email Notifications',
  'Agent Queue Assignment',
  'Vendor Callbacks',
  'Data Validation',
  'Custom Process'
]

export const WorkflowSelector = ({ workflow, onChange }: WorkflowSelectorProps) => {
  const selectedWorkflow = MOCK_WORKFLOWS.find(w => w.id === workflow.workflowId)

  const updateWorkflow = (updates: Partial<WorkflowConfig>) => {
    onChange({ ...workflow, ...updates })
  }

  return (
    <div className="space-y-3 p-3 border border-border rounded-md bg-card">
      {/* Mock Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TestTube className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Mock Mode</span>
          <Badge variant="outline" className="text-xs">
            {workflow.mockMode ? 'Testing' : 'Live'}
          </Badge>
        </div>
        <Switch
          checked={workflow.mockMode}
          onCheckedChange={(checked) => updateWorkflow({ mockMode: checked })}
        />
      </div>

      {workflow.mockMode && (
        <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
          Mock mode uses simulated workflows. Will connect to action system later.
        </div>
      )}

      {/* Workflow Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Settings className="w-3 h-3" />
          Workflow
        </label>
        <Select 
          value={workflow.workflowId} 
          onValueChange={(value) => {
            const selected = MOCK_WORKFLOWS.find(w => w.id === value)
            updateWorkflow({ 
              workflowId: value,
              description: selected?.description 
            })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select workflow..." />
          </SelectTrigger>
          <SelectContent>
            {MOCK_WORKFLOWS.map((wf) => (
              <SelectItem key={wf.id} value={wf.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{wf.name}</span>
                  <span className="text-xs text-muted-foreground">{wf.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Process Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Play className="w-3 h-3" />
          Process Name
        </label>
        <Select 
          value={workflow.processName} 
          onValueChange={(value) => updateWorkflow({ processName: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select process..." />
          </SelectTrigger>
          <SelectContent>
            {MOCK_PROCESSES.map((process) => (
              <SelectItem key={process} value={process}>
                {process}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Workflow Description */}
      {selectedWorkflow && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          {selectedWorkflow.description}
        </div>
      )}

      {/* Connection Status */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
        <span className="text-xs text-muted-foreground">
          {workflow.mockMode ? 'Mock data ready' : 'Will connect to action system'}
        </span>
      </div>
    </div>
  )
}