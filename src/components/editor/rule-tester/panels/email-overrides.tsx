"use client"

import { Mail, AlertTriangle, Send, Copy } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { EmailOverrides as EmailOverridesType } from '../types'

interface EmailOverridesProps {
  overrides: EmailOverridesType
  onChange: (overrides: EmailOverridesType) => void
}

const EMAIL_MODE_OPTIONS = [
  {
    value: 'override_all',
    label: 'Override All',
    description: 'Send all emails to test address instead of original recipients',
    icon: <AlertTriangle className="w-3 h-3" />
  },
  {
    value: 'bcc',
    label: 'BCC Mode',
    description: 'Send emails to original recipients + BCC to test address',
    icon: <Copy className="w-3 h-3" />
  },
  {
    value: 'regular',
    label: 'Regular Delivery',
    description: 'Send emails to original recipients (production mode)',
    icon: <Send className="w-3 h-3" />
  },
  {
    value: 'delivery_test',
    label: 'Test Delivery',
    description: 'Send to delivery@rule-tester for testing',
    icon: <Mail className="w-3 h-3" />
  }
] as const

export const EmailOverrides = ({ overrides, onChange }: EmailOverridesProps) => {
  const selectedMode = EMAIL_MODE_OPTIONS.find(mode => mode.value === overrides.mode)
  const needsTestEmail = overrides.mode === 'override_all' || overrides.mode === 'bcc'

  const updateOverrides = (updates: Partial<EmailOverridesType>) => {
    onChange({ ...overrides, ...updates })
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'override_all': return 'bg-red-500'
      case 'bcc': return 'bg-orange-500'
      case 'regular': return 'bg-green-500'
      case 'delivery_test': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="space-y-3 p-3 border border-border rounded-md bg-card">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Email Overrides</span>
          <Badge variant={overrides.enabled ? "default" : "secondary"} className="text-xs">
            {overrides.enabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
        <Switch
          checked={overrides.enabled}
          onCheckedChange={(checked) => updateOverrides({ enabled: checked })}
        />
      </div>

      {overrides.enabled && (
        <>
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Delivery Mode</label>
            <Select 
              value={overrides.mode} 
              onValueChange={(value) => updateOverrides({ mode: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_MODE_OPTIONS.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    <div className="flex items-center gap-2">
                      {mode.icon}
                      <div className="flex flex-col">
                        <span className="font-medium">{mode.label}</span>
                        <span className="text-xs text-muted-foreground">{mode.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Email Input */}
          {needsTestEmail && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Email Address</label>
              <Input
                type="email"
                placeholder="test@example.com"
                value={overrides.testEmail || ''}
                onChange={(e) => updateOverrides({ testEmail: e.target.value })}
              />
            </div>
          )}

          {/* Delivery Address (for delivery_test mode) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Delivery Address</label>
            <div className="flex gap-2">
              <Input
                value={overrides.deliveryAddress}
                onChange={(e) => updateOverrides({ deliveryAddress: e.target.value })}
                placeholder="delivery@rule-tester"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateOverrides({ deliveryAddress: 'delivery@rule-tester' })}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Mode Description */}
          {selectedMode && (
            <div className="flex items-start gap-2 p-2 bg-muted rounded text-xs">
              <div className={`w-2 h-2 rounded-full mt-1 ${getModeColor(selectedMode.value)}`}></div>
              <div>
                <div className="font-medium">{selectedMode.label}</div>
                <div className="text-muted-foreground mt-1">{selectedMode.description}</div>
              </div>
            </div>
          )}

          {/* Warning for Production Mode */}
          {overrides.mode === 'regular' && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <AlertTriangle className="w-3 h-3" />
              <span>⚠️ Production mode: Emails will be sent to real recipients</span>
            </div>
          )}
        </>
      )}

      {!overrides.enabled && (
        <div className="text-xs text-muted-foreground">
          Email overrides are disabled. Rules will use default email settings.
        </div>
      )}
    </div>
  )
}