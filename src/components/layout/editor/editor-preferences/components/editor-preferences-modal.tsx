'use client'

import { useState, useCallback } from 'react'
import { 
  Button, 
  Badge, 
  Label, 
  Switch, 
  NumberInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui'
import { 
  Settings,
  RotateCcw,
  X
} from 'lucide-react'

import { useEditorPreferences } from '../hooks/use-editor-preferences'
import { THEME_OPTIONS } from '../constants/theme-options'
import { FONT_FAMILY_OPTIONS, MIN_FONT_SIZE, MAX_FONT_SIZE } from '../constants/font-options'
import { EditorPreferencesModalProps, EditorPreferences } from '../types/editor-preferences'

export function EditorPreferencesModal({ className }: EditorPreferencesModalProps) {
  const [open, setOpen] = useState(false)

  const {
    preferences,
    updatePreference,
    resetToDefaults,
    updateSession,
    isLoading,
    updateUserMutation
  } = useEditorPreferences()

  // Prevent modal from closing when making preference changes
  const handlePreferenceChange = useCallback((key: keyof EditorPreferences, value: any) => {
    updatePreference(key, value)
    // Don't close modal - let user continue adjusting settings
  }, [updatePreference])

  // Handle font size change with NumberInput
  const handleFontSizeChange = useCallback((value: number) => {
    console.log('🔧 [EditorPreferences] Font size change:', {
      newValue: value,
      currentPrefs: preferences.fontSize,
      timestamp: new Date().toISOString()
    })
    handlePreferenceChange('fontSize', value)
  }, [handlePreferenceChange, preferences.fontSize])

  // Handle modal close - update session with final preferences
  const handleModalClose = useCallback(async (isOpen: boolean) => {
    if (!isOpen) {
      // Modal is closing - update session
      await updateSession()
    }
    setOpen(isOpen)
  }, [updateSession])

  return (
    <Popover open={open} onOpenChange={handleModalClose} modal>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Settings className="h-4 w-4" />
          {(updateUserMutation?.isPending || isLoading) && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0" side="bottom">
        {/* Header */}
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Editor Preferences</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Changes apply instantly
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleModalClose(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          
          {/* Theme Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Theme</Label>
            <Select 
              value={preferences.theme} 
              onValueChange={(value: any) => handlePreferenceChange('theme', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme..." />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-3 rounded border border-gray-300"
                        style={{ backgroundColor: theme.preview }}
                      />
                      <span>{theme.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Family Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Font Family</Label>
            <Select 
              value={preferences.fontFamily} 
              onValueChange={(value: string) => handlePreferenceChange('fontFamily', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select font..." />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILY_OPTIONS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.preview }}>
                      {font.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Font Size</Label>
            <div className="flex items-center gap-3">
              <NumberInput
                value={preferences.fontSize}
                onChange={handleFontSizeChange}
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                step={1}
                className="h-9 w-20 font-medium"
                showSpinner={true}
              />
              <span className="text-sm text-muted-foreground">px</span>
            </div>
          </div>

          {/* Editor Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Options</Label>
            <div className="space-y-3">
              
              {/* Word Wrap */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Word Wrap</Label>
                  <p className="text-xs text-muted-foreground">Wrap long lines</p>
                </div>
                <Switch
                  checked={preferences.wordWrap}
                  onCheckedChange={(checked) => handlePreferenceChange('wordWrap', checked)}
                />
              </div>

              {/* Line Numbers */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Line Numbers</Label>
                  <p className="text-xs text-muted-foreground">Show line numbers</p>
                </div>
                <Switch
                  checked={preferences.lineNumbers === 'on'}
                  onCheckedChange={(checked) => handlePreferenceChange('lineNumbers', checked ? 'on' : 'off')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            onClick={resetToDefaults}
            className="h-7 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          
          {updateUserMutation?.isPending && (
            <Badge variant="secondary" className="text-xs">
              Saving...
            </Badge>
          )}
          
          {updateUserMutation?.isError && (
            <div className="text-xs text-red-600">
              Save failed
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}