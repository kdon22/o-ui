import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface TableOptionsSectionProps {
  type: string
  config: any
  onConfigChange: (key: string, value: any) => void
}

export function TableOptionsSection({ type, config, onConfigChange }: TableOptionsSectionProps) {
  if (type !== 'table') return null

  const selectionMode = (config?.selection?.mode || 'none') as 'none' | 'single' | 'multi'

  const setSelectionMode = (mode: 'none' | 'single' | 'multi') => {
    const current = config?.selection || {}
    onConfigChange('selection', { ...current, mode })
  }

  const copyComponentId = async () => {
    const id = config?.componentId
    if (!id) return
    try { await navigator.clipboard.writeText(String(id)) } catch {}
  }

  const generateBindings = async () => {
    const id = config?.componentId || 'yourComponentId'
    const snippet = `bindings = {\n    "<promptName>": {\n        "${id}": {\n            "type": "table",\n            "rows": [["A", "B", "C"]],\n            "selection": { "mode": "${selectionMode}" }\n        }\n    }\n}`
    try { await navigator.clipboard.writeText(snippet) } catch {}
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Table Options</h4>

      <div className="space-y-2">
        <label className="text-xs text-gray-600 font-medium">Mode</label>
        <Select onValueChange={(v) => setSelectionMode(v as any)} value={selectionMode}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Display" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Display</SelectItem>
            <SelectItem value="single">Single Select</SelectItem>
            <SelectItem value="multi">Multi Select</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[11px] text-gray-500">Selection values are returned as index(es) in submitted response.</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-600 font-medium">Zebra Striping</div>
          <div className="text-[11px] text-gray-500">Alternating row background for readability</div>
        </div>
        <Switch checked={Boolean(config?.zebraStriping)} onCheckedChange={(v) => onConfigChange('zebraStriping', v)} />
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={copyComponentId}>Copy componentId</Button>
        <Button size="sm" onClick={generateBindings}>Generate bindings snippet</Button>
      </div>
    </div>
  )
}


