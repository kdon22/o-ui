import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ColorFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  defaultValue?: string
}

export function ColorField({ 
  id, 
  label, 
  value, 
  onChange, 
  defaultValue = '#374151' 
}: ColorFieldProps) {
  const colorValue = value || defaultValue

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="color"
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-12 p-1"
          showSuccessIndicator={false}
        />
        <Input
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm font-mono flex-1"
          showSuccessIndicator={false}
        />
      </div>
    </div>
  )
} 