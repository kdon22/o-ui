'use client'

import { Check } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { THEME_OPTIONS } from '../constants/theme-options'
import { EditorPreferences } from '../types/editor-preferences'

interface ThemeSelectorProps {
  currentTheme: EditorPreferences['theme']
  onThemeChange: (theme: EditorPreferences['theme']) => void
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Theme</Label>
      <div className="grid grid-cols-3 gap-2">
        {THEME_OPTIONS.map((theme) => (
          <div
            key={theme.value}
            className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all ${
              currentTheme === theme.value 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onThemeChange(theme.value)
            }}
          >
            <div 
              className="w-8 h-6 rounded mb-2 border border-gray-300"
              style={{ backgroundColor: theme.preview }}
            />
            <span className="text-xs font-medium">{theme.label}</span>
            {currentTheme === theme.value && (
              <Check className="w-3 h-3 text-blue-500 mt-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}