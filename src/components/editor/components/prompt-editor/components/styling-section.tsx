import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NumberField } from './number-field'
import { ColorField } from './color-field'

interface StylingSectionProps {
  type: string
  config: any
  onConfigChange: (key: string, value: any) => void
}

// Define which styling options are available for each component type
const STYLING_OPTIONS = {
  'text-input': { useFont: true, useBackground: true, useBorder: true },
  'select': { useFont: true, useBackground: true, useBorder: true },
  'checkbox': { useBackground: true, useBorder: true },
  'radio': { useBackground: true, useBorder: true, useLabelPosition: true },
  'label': { useFont: true },
  'button': { useFont: true, useBackground: true, useBorder: true },
  'divider': { useDivider: true }
}

export function StylingSection({ 
  type, 
  config, 
  onConfigChange 
}: StylingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Get available styling options for this component type
  const options = STYLING_OPTIONS[type as keyof typeof STYLING_OPTIONS]
  
  // Don't show styling section if no options are available
  if (!options) return null

  return (
    <div className="space-y-2">
      {/* Accordion Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        <span>Styling Options</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="space-y-4 p-3 border border-gray-200 rounded-md bg-gray-50">
          
          {/* Font Styling */}
          {'useFont' in options && options.useFont && (
            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Font</h5>
              
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  id="fontSize"
                  label="Font Size (px)"
                  value={config.fontSize}
                  onChange={(value) => onConfigChange('fontSize', value)}
                  min={8}
                  max={72}
                />
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Font Weight</label>
                  <Select onValueChange={(value) => onConfigChange('fontWeight', value)} defaultValue={config.fontWeight || 'normal'}>
                    <SelectTrigger className="w-full h-8 text-sm border border-gray-300 rounded px-2">
                      <SelectValue placeholder="Select a font weight" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="semibold">Semi Bold</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ColorField
                id="textColor"
                label="Text Color"
                value={config.textColor}
                onChange={(value) => onConfigChange('textColor', value)}
                defaultValue="#374151"
              />
            </div>
          )}

          {/* Background Styling */}
          {'useBackground' in options && options.useBackground && (
            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Background</h5>
              
              <ColorField
                id="backgroundColor"
                label="Background Color"
                value={config.backgroundColor}
                onChange={(value) => onConfigChange('backgroundColor', value)}
                defaultValue="#ffffff"
              />
            </div>
          )}

          {/* Radio specific: label position */}
          {'useLabelPosition' in options && (options as any).useLabelPosition && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Radio Layout</h5>
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Label Position</label>
                <Select onValueChange={(value) => onConfigChange('labelPosition', value)} defaultValue={config.labelPosition || 'right'}>
                  <SelectTrigger className="w-full h-8 text-sm border border-gray-300 rounded px-2">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="top">Above</SelectItem>
                    <SelectItem value="bottom">Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Border Styling */}
          {'useBorder' in options && options.useBorder && (
            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Border</h5>
              
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  id="borderWidth"
                  label="Border Width (px)"
                  value={config.borderWidth}
                  onChange={(value) => onConfigChange('borderWidth', value)}
                  min={0}
                  max={10}
                />
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Border Style</label>
                  <Select onValueChange={(value) => onConfigChange('borderStyle', value)} defaultValue={config.borderStyle || 'solid'}>
                    <SelectTrigger className="w-full h-8 text-sm border border-gray-300 rounded px-2">
                      <SelectValue placeholder="Select a border style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ColorField
                id="borderColor"
                label="Border Color"
                value={config.borderColor}
                onChange={(value) => onConfigChange('borderColor', value)}
                defaultValue="#d1d5db"
              />

              <NumberField
                id="borderRadius"
                label="Border Radius (px)"
                value={config.borderRadius}
                onChange={(value) => onConfigChange('borderRadius', value)}
                min={0}
                max={50}
              />
            </div>
          )}

          {/* Divider Styling */}
          {'useDivider' in options && (options as any).useDivider && (
            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Divider</h5>
              <NumberField
                id="thickness"
                label="Thickness (px)"
                value={config.thickness}
                onChange={(value) => onConfigChange('thickness', value)}
                min={1}
                max={8}
              />
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Line Style</label>
                <Select onValueChange={(value) => onConfigChange('style', value)} defaultValue={config.style || 'solid'}>
                  <SelectTrigger className="w-full h-8 text-sm border border-gray-300 rounded px-2">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ColorField
                id="color"
                label="Color"
                value={config.color}
                onChange={(value) => onConfigChange('color', value)}
                defaultValue="#e5e7eb"
              />
              <NumberField
                id="width"
                label="Width (px)"
                value={config.width}
                onChange={(value) => onConfigChange('width', value)}
                min={50}
                max={600}
              />
            </div>
          )}

          {/* Dimensions (for components that support it) */}
          {(type === 'text-input' || type === 'select' || type === 'button') && (
            <div className="space-y-3">
              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">Dimensions</h5>
              
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  id="width"
                  label="Width (px)"
                  value={config.width}
                  onChange={(value) => onConfigChange('width', value)}
                  min={50}
                  max={500}
                />
                <NumberField
                  id="height"
                  label="Height (px)"
                  value={config.height}
                  onChange={(value) => onConfigChange('height', value)}
                  min={20}
                  max={200}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 