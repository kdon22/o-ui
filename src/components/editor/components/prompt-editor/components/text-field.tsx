import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TextFieldProps {
  id: string
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
  className?: string
}

export function TextField({ 
  id, 
  label, 
  value, 
  placeholder, 
  onChange, 
  className = "h-8 text-sm" 
}: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        showSuccessIndicator={false}
      />
    </div>
  )
} 