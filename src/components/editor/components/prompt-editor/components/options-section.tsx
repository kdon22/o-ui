import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Trash2, Plus } from 'lucide-react'

interface OptionsSectionProps {
  type: string
  config: any
  onConfigChange: (key: string, value: any) => void
}

export function OptionsSection({ 
  type, 
  config, 
  onConfigChange 
}: OptionsSectionProps) {
  if (type !== 'select' && type !== 'radio') {
    return null
  }

  const options = config.options || []

  const addOption = () => {
    const newOption = {
      label: `Option ${options.length + 1}`,
      value: `opt${options.length + 1}`,
      isDefault: options.length === 0
    }
    onConfigChange('options', [...options, newOption])
  }

  const updateOption = (index: number, field: string, value: any) => {
    const updatedOptions = [...options]
    updatedOptions[index] = { ...updatedOptions[index], [field]: value }
    
    // If setting as default, unset others
    if (field === 'isDefault' && value) {
      updatedOptions.forEach((opt, i) => {
        if (i !== index) opt.isDefault = false
      })
    }
    
    onConfigChange('options', updatedOptions)
  }

  const removeOption = (index: number) => {
    const updatedOptions = [...options]
    updatedOptions.splice(index, 1)
    onConfigChange('options', updatedOptions)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Options</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={addOption}
          className="h-7 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((option: any, index: number) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <div className="flex-1 space-y-1">
              <Input
                value={option.label}
                onChange={(e) => updateOption(index, 'label', e.target.value)}
                placeholder="Option label"
                className="h-7 text-xs"
                showSuccessIndicator={false}
              />
              <Input
                value={option.value}
                onChange={(e) => updateOption(index, 'value', e.target.value)}
                placeholder="Option value"
                className="h-7 text-xs font-mono"
                showSuccessIndicator={false}
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Switch
                checked={option.isDefault || false}
                onCheckedChange={(checked) => updateOption(index, 'isDefault', checked)}
              />
              <span className="text-xs text-gray-500">Default</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeOption(index)}
              className="h-6 w-6 p-0 text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 