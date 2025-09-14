'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useActionMutation } from '@/hooks/use-action-api'
import { EditorPreferences } from '../types/editor-preferences'
import type * as MonacoTypes from 'monaco-editor'
import type { Monaco } from '@monaco-editor/react'

// Default preferences - only Monaco built-in themes
const DEFAULT_PREFERENCES: EditorPreferences = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: '"Fira Code", "SF Mono", Monaco, Consolas, monospace',
  wordWrap: false,
  lineNumbers: 'on'
}

// Apply preferences to Monaco using built-in APIs only
function applyToMonaco(preferences: EditorPreferences) {
  console.log('🎨 [MONACO] applyToMonaco called:', {
    preferences,
    windowExists: typeof window !== 'undefined',
    monacoExists: typeof window !== 'undefined' && !!(window as any).monaco,
    timestamp: new Date().toISOString()
  })
  
  if (typeof window === 'undefined' || !(window as any).monaco) {

    return
  }
  
  const monaco = (window as any).monaco
  
  try {
    // Set global theme

    monaco.editor.setTheme(preferences.theme)

    
    // Update all editor instances
    const editors = monaco.editor.getEditors?.() || []

    
    editors.forEach((editor: any, index: number) => {
  
      editor.updateOptions({
        fontSize: preferences.fontSize,
        fontFamily: preferences.fontFamily,
        wordWrap: preferences.wordWrap ? 'on' : 'off',
        lineNumbers: preferences.lineNumbers,
        minimap: { enabled: false },
        automaticLayout: true
      })
  
    })
    

  } catch (error) {
    console.error('❌ [MONACO] Error applying preferences:', error)
  }
}

export function useEditorPreferences() {
  const { data: session, status, update } = useSession()
  
  // Local optimistic state for immediate updates
  const [localPreferences, setLocalPreferences] = useState<EditorPreferences | null>(null)
  
  // Get base preferences from session or defaults
  const sessionPreferences = session?.user?.codeEditorPreferences || DEFAULT_PREFERENCES
  
  // Use local preferences if available, otherwise session preferences
  const preferences = localPreferences || sessionPreferences
  
  // 🔍 DEBUG: Log everything
  console.log('🎨 [DEBUG] useEditorPreferences state:', {
    sessionStatus: status,
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    sessionPrefs: session?.user?.codeEditorPreferences,
    localPrefs: localPreferences,
    usingLocalPrefs: !!localPreferences,
    finalPreferences: preferences,
    defaultPreferences: DEFAULT_PREFERENCES,
    timestamp: new Date().toISOString()
  })
  
  // Mutation for saving to database - purely optimistic, no session refresh
  const updateUserMutation = useActionMutation('user.update', {
    onMutate: async (variables: any) => {
      console.log('🔥 [MUTATION] onMutate started:', {
        variables,
        currentPrefs: preferences,
        newPrefs: variables.codeEditorPreferences,
        timestamp: new Date().toISOString()
      })
      
      // Apply immediately to Monaco for live preview
      applyToMonaco(variables.codeEditorPreferences)
  
      
      return { previousPrefs: preferences }
    },
    onSuccess: async (data: any, variables: any) => {
      console.log('✅ [MUTATION] onSuccess - Preferences saved to database:', {
        data,
        variables,
        newPrefs: variables.codeEditorPreferences,
        timestamp: new Date().toISOString()
      })
      
      // Session update deferred until modal closes for better UX
  
    },
    onError: (error: any, variables: any, context: any) => {
      console.error('❌ [MUTATION] onError:', {
        error,
        variables,
        context,
        timestamp: new Date().toISOString()
      })
      
      // Rollback Monaco changes on error
      if (context?.previousPrefs) {
    
        applyToMonaco(context.previousPrefs)
      }
    }
  })

  // Apply preferences to Monaco when session loads
  useEffect(() => {
    console.log('🎨 [EFFECT] Applying preferences to Monaco:', {
      preferences,
      hasPreferences: !!preferences,
      timestamp: new Date().toISOString()
    })
    
    if (preferences) {
      applyToMonaco(preferences)
    }
  }, [preferences])

  const updatePreference = useCallback((key: keyof EditorPreferences, value: any) => {
    console.log('🔧 [UPDATE] updatePreference called:', {
      key,
      value,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      currentPrefs: preferences,
      timestamp: new Date().toISOString()
    })
    
    if (!session?.user?.id) {
      console.error('❌ [UPDATE] No session or user ID!')
      return
    }
    
    const newPrefs = { ...preferences, [key]: value }

    
    // Update local state immediately for UI responsiveness
    setLocalPreferences(newPrefs)
    console.log('✅ [UPDATE] Local preferences updated immediately')
    
    // Save to database - Monaco update happens in onMutate for immediate feedback
    console.log('🚀 [UPDATE] Calling mutation with:', {
      id: session.user.id,
      codeEditorPreferences: newPrefs
    })
    
    updateUserMutation.mutate({
      id: session.user.id,
      codeEditorPreferences: newPrefs
    })
  }, [preferences, session?.user?.id, updateUserMutation])

  const resetToDefaults = useCallback(() => {
    console.log('🔄 [RESET] resetToDefaults called:', {
      hasSession: !!session,
      userId: session?.user?.id,
      defaults: DEFAULT_PREFERENCES
    })
    
    if (!session?.user?.id) {
      console.error('❌ [RESET] No session or user ID!')
      return
    }
    
    // Update local state immediately
    setLocalPreferences(DEFAULT_PREFERENCES)
    console.log('✅ [RESET] Local preferences reset to defaults')
    
    updateUserMutation.mutate({
      id: session.user.id,
      codeEditorPreferences: DEFAULT_PREFERENCES
    })
  }, [session?.user?.id, updateUserMutation])

  const updateSession = useCallback(async () => {
    console.log('🔄 [SESSION_UPDATE] Updating session with current preferences:', {
      preferences,
      hasSession: !!session,
      timestamp: new Date().toISOString()
    })
    
    if (!session) {
      console.error('❌ [SESSION_UPDATE] No session available!')
      return
    }
    
    try {
      await update({
        codeEditorPreferences: preferences
      })
      console.log('✅ [SESSION_UPDATE] Session updated successfully')
      
      // Clear local state so preferences fall back to session
      setLocalPreferences(null)
      console.log('✅ [SESSION_UPDATE] Local state cleared, falling back to session preferences')
    } catch (error) {
      console.error('❌ [SESSION_UPDATE] Failed to update session:', error)
    }
  }, [preferences, session, update])

  // Callback to apply preferences when Monaco editor is ready
  const applyPreferencesToEditor = useCallback((
    editor: MonacoTypes.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    console.log('🎯 [EDITOR_READY] Applying preferences to specific editor:', {
      preferences,
      hasEditor: !!editor,
      hasMonaco: !!monaco,
      timestamp: new Date().toISOString()
    })
    
    if (!editor || !monaco) {
      console.error('❌ [EDITOR_READY] Missing editor or monaco instance')
      return
    }
    
    try {
      // Apply preferences directly to the specific editor instance
      editor.updateOptions({
        fontSize: preferences.fontSize,
        fontFamily: preferences.fontFamily, 
        wordWrap: preferences.wordWrap ? 'on' : 'off',
        lineNumbers: preferences.lineNumbers as any,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true
      })
      
      // Set global theme
      monaco.editor.setTheme(preferences.theme)
      
      console.log('✅ [EDITOR_READY] Preferences applied successfully to editor')
    } catch (error) {
      console.error('❌ [EDITOR_READY] Error applying preferences:', error)
    }
  }, [preferences])

  return {
    preferences,
    updatePreference,
    resetToDefaults,
    updateSession,
    applyPreferencesToEditor,
    isLoading: status === 'loading',
    updateUserMutation
  }
}