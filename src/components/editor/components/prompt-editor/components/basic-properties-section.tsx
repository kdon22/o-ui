import { TextField } from './text-field'
import { SwitchField } from './switch-field'
import type { ComponentItem } from '../types'

interface BasicPropertiesSectionProps {
  type: string
  config: any
  onConfigChange: (key: string, value: any) => void
}

export function BasicPropertiesSection({ 
  type, 
  config, 
  onConfigChange 
}: BasicPropertiesSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
        Basic Properties
      </h4>

      <TextField
        id="label"
        label="Label"
        value={config.label || ''}
        placeholder="Component label"
        onChange={(value) => onConfigChange('label', value)}
      />

      {config.componentId && (
        <TextField
          id="componentId"
          label="Component ID"
          value={config.componentId}
          onChange={(value) => onConfigChange('componentId', value)}
          className="h-8 text-sm font-mono"
        />
      )}

      {(type === 'text-input' || type === 'select') && (
        <TextField
          id="placeholder"
          label="Placeholder"
          value={config.placeholder || ''}
          placeholder="Enter placeholder text"
          onChange={(value) => onConfigChange('placeholder', value)}
        />
      )}

      <SwitchField
        id="required"
        label="Required"
        checked={config.required || false}
        onChange={(checked) => onConfigChange('required', checked)}
      />

      <SwitchField
        id="disabled"
        label="Disabled"
        checked={config.isDisabled || false}
        onChange={(checked) => onConfigChange('isDisabled', checked)}
      />
    </div>
  )
} 