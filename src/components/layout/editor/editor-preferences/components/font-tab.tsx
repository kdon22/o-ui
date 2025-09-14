'use client'

import { FontSelector } from './font-selector'
import { EditorPreferences } from '../types/editor-preferences'

interface FontTabProps {
  currentFontSize: number
  currentFontFamily: string
  fontAvailability: Record<string, boolean>
  onFontSizeChange: (size: number) => void
  onFontFamilyChange: (family: string) => void
  onCheckFonts: () => void
}

export function FontTab({
  currentFontSize,
  currentFontFamily,
  fontAvailability,
  onFontSizeChange,
  onFontFamilyChange,
  onCheckFonts
}: FontTabProps) {
  return (
    <div className="space-y-4 mt-0">
      <FontSelector
        currentFontSize={currentFontSize}
        currentFontFamily={currentFontFamily}
        fontAvailability={fontAvailability}
        onFontSizeChange={onFontSizeChange}
        onFontFamilyChange={onFontFamilyChange}
        onCheckFonts={onCheckFonts}
      />
    </div>
  )
}