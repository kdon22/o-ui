'use client'

import { ThemeSelector } from './theme-selector'
import { PreferencesStatus } from './preferences-status'
import { EditorPreferences } from '../types/editor-preferences'

interface AppearanceTabProps {
  currentTheme: EditorPreferences['theme']
  onThemeChange: (theme: EditorPreferences['theme']) => void
  isLoading: boolean
  isPending: boolean
  isError: boolean
  errorMessage?: string
}

export function AppearanceTab({
  currentTheme,
  onThemeChange,
  isLoading,
  isPending,
  isError,
  errorMessage
}: AppearanceTabProps) {
  return (
    <div className="space-y-4 mt-0">
      <ThemeSelector 
        currentTheme={currentTheme}
        onThemeChange={onThemeChange}
      />
      
      <PreferencesStatus
        isLoading={isLoading}
        isPending={isPending}
        isError={isError}
        errorMessage={errorMessage}
      />
    </div>
  )
}