import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface SwitchFieldProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function SwitchField({ id, label, checked, onChange }: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  )
} 