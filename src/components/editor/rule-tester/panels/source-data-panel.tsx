"use client"

import { useState } from 'react'
import { Plus, Trash2, Star, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { UTRSourceData } from '../types'

interface SourceDataPanelProps {
  sources: UTRSourceData[]
  onChange: (sources: UTRSourceData[]) => void
}

const VENDOR_OPTIONS = [
  { value: 'amadeus', label: 'Amadeus', description: 'NDC/EDIFACT' },
  { value: 'sabre', label: 'Sabre', description: 'GDS' },
  { value: 'kayak', label: 'Kayak', description: 'OTA' },
  { value: 'direct', label: 'Direct', description: 'Airline Direct' }
] as const

const DATA_TYPE_OPTIONS = [
  'flights', 'hotel', 'car', 'pricing', 'remarks', 'corporate', 'contacts'
]

export const SourceDataPanel = ({ sources, onChange }: SourceDataPanelProps) => {
  const [newSource, setNewSource] = useState<Partial<UTRSourceData>>({
    vendor: 'amadeus',
    locator: '',
    isPrimary: false,
    dataTypes: ['flights'],
    status: 'pending'
  })

  const addSource = () => {
    if (!newSource.vendor || !newSource.locator) return

    const source: UTRSourceData = {
      id: `${newSource.vendor}-${newSource.locator}-${Date.now()}`,
      vendor: newSource.vendor as any,
      locator: newSource.locator.toUpperCase(),
      isPrimary: sources.length === 0, // First source is primary
      dataTypes: newSource.dataTypes || ['flights'],
      status: 'pending'
    }

    onChange([...sources, source])
    setNewSource({
      vendor: 'amadeus',
      locator: '',
      isPrimary: false,
      dataTypes: ['flights'],
      status: 'pending'
    })
  }

  const removeSource = (id: string) => {
    onChange(sources.filter(s => s.id !== id))
  }

  const updateSource = (id: string, updates: Partial<UTRSourceData>) => {
    onChange(sources.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const setPrimary = (id: string) => {
    onChange(sources.map(s => ({ ...s, isPrimary: s.id === id })))
  }

  const getStatusIcon = (status: UTRSourceData['status']) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-3 h-3 text-muted-foreground" />
      case 'loading': return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
      case 'loaded': return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'error': return <AlertCircle className="w-3 h-3 text-red-500" />
      default: return null
    }
  }

  return (
    <div className="space-y-3">
      {/* Existing Sources */}
      {sources.map((source) => (
        <div key={source.id} className="border border-border rounded-md p-3 bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(source.status)}
              <Badge variant={source.isPrimary ? "default" : "secondary"} className="text-xs">
                {source.vendor.toUpperCase()}
              </Badge>
              <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                {source.locator}
              </code>
              {source.isPrimary && (
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <div className="flex items-center gap-1">
              {!source.isPrimary && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPrimary(source.id)}
                  className="h-6 w-6 p-0"
                  title="Set as primary"
                >
                  <Star className="w-3 h-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeSource(source.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {source.dataTypes.map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>

          {source.error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              {source.error}
            </div>
          )}
        </div>
      ))}

      {/* Add New Source */}
      <div className="border border-dashed border-border rounded-md p-3 bg-muted/20">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select 
              value={newSource.vendor} 
              onValueChange={(value) => setNewSource({ ...newSource, vendor: value as any })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_OPTIONS.map((vendor) => (
                  <SelectItem key={vendor.value} value={vendor.value}>
                    <div className="flex flex-col">
                      <span>{vendor.label}</span>
                      <span className="text-xs text-muted-foreground">{vendor.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Record locator (e.g., AB4P35)"
              value={newSource.locator}
              onChange={(e) => setNewSource({ ...newSource, locator: e.target.value.toUpperCase() })}
              className="flex-1"
              maxLength={10}
            />

            <Button 
              size="sm" 
              onClick={addSource}
              disabled={!newSource.vendor || !newSource.locator}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {DATA_TYPE_OPTIONS.map((type) => (
              <label key={type} className="flex items-center gap-1 text-xs">
                <Checkbox
                  checked={newSource.dataTypes?.includes(type)}
                  onCheckedChange={(checked) => {
                    const current = newSource.dataTypes || []
                    const updated = checked 
                      ? [...current, type]
                      : current.filter(t => t !== type)
                    setNewSource({ ...newSource, dataTypes: updated })
                  }}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      </div>

      {sources.length === 0 && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          Add source data to test rules with real UTR objects
        </div>
      )}
    </div>
  )
}