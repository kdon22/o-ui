'use client'

import { Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FONT_FAMILY_OPTIONS, MIN_FONT_SIZE, MAX_FONT_SIZE } from '../constants/font-options'
import { EditorPreferences } from '../types/editor-preferences'

interface FontSelectorProps {
  currentFontSize: number
  currentFontFamily: string
  fontAvailability: Record<string, boolean>
  onFontSizeChange: (size: number) => void
  onFontFamilyChange: (family: string) => void
  onCheckFonts: () => void
}

export function FontSelector({ 
  currentFontSize, 
  currentFontFamily, 
  fontAvailability,
  onFontSizeChange, 
  onFontFamilyChange,
  onCheckFonts
}: FontSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Font Size</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCheckFonts()
            }}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Check Fonts
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              type="number"
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              value={currentFontSize}
              showSuccessIndicator={false}
              onChange={(e) => {
                const value = e.target.value
                
                // Allow empty input while typing
                if (value === '') {
                  return
                }
                
                const numValue = parseInt(value)
                // Only update if it's a valid number in range
                if (!isNaN(numValue) && numValue >= MIN_FONT_SIZE && numValue <= MAX_FONT_SIZE) {
                  onFontSizeChange(numValue)
                }
              }}
              onBlur={(e) => {
                e.stopPropagation()
                // On blur, ensure we have a valid value
                const value = e.target.value
                const numValue = parseInt(value)
                
                if (value === '' || isNaN(numValue)) {
                  // If invalid, restore the current preference value
                  e.target.value = currentFontSize.toString()
                } else if (numValue < MIN_FONT_SIZE || numValue > MAX_FONT_SIZE) {
                  // If out of range, clamp it
                  const clampedValue = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, numValue))
                  onFontSizeChange(clampedValue)
                }
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  const increment = e.metaKey || e.ctrlKey ? 5 : 1
                  const newValue = Math.min(currentFontSize + increment, MAX_FONT_SIZE)
                  onFontSizeChange(newValue)
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  const decrement = e.metaKey || e.ctrlKey ? 5 : 1
                  const newValue = Math.max(currentFontSize - decrement, MIN_FONT_SIZE)
                  onFontSizeChange(newValue)
                } else if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
              onFocus={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="w-20 h-8 text-sm pl-3 pr-2 border rounded-md"
              step="1"
            />
          </div>
          <span className="text-xs text-gray-500">px</span>
          <div className="text-xs text-gray-400 ml-2">
            ({MIN_FONT_SIZE}-{MAX_FONT_SIZE}px)
          </div>
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Font Family</Label>
        <div className="space-y-1">
          {FONT_FAMILY_OPTIONS.map((font) => {
            const isAvailable = fontAvailability[font.label]
            return (
              <div
                key={font.value}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                  currentFontFamily === font.value 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50 border border-transparent'
                } ${!isAvailable ? 'opacity-60' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onFontFamilyChange(font.value)
                }}
              >
                <div className="flex items-center gap-2">
                  <span 
                    className="text-sm"
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </span>
                  {!isAvailable && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 text-red-600">Missing</Badge>
                  )}
                </div>
                {currentFontFamily === font.value && (
                  <Check className="w-3 h-3 text-blue-500" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}