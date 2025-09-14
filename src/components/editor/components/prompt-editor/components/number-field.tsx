import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NumberFieldProps {
  id: string
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  className?: string
  min?: number
  max?: number
}

export function NumberField({ 
  id, 
  label, 
  value, 
  onChange, 
  className = "h-8 text-sm",
  min,
  max
}: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input
        id={id}
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
        className={className}
        min={min}
        max={max}
        showSuccessIndicator={false}
      />
    </div>
  )
} 