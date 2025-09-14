// React hook for Monaco editors to register with the global registry
import { useEffect, useRef } from 'react'
import type * as monaco from 'monaco-editor'
import { MonacoCodeInsertion } from './monaco-code-insertion'

/**
 * Hook for Monaco editors to register themselves with the global registry
 * This enables universal search to find and insert code into active editors
 */
export function useMonacoRegistry(
  editorId: string,
  editor: monaco.editor.IStandaloneCodeEditor | null,
  enabled = true
) {
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled || !editor) {
      return
    }

    // Register the editor
    cleanupRef.current = MonacoCodeInsertion.registerEditor(editorId, editor)

    // Cleanup on unmount or editor change
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [editorId, editor, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])
}

/**
 * Convenience hook that automatically generates an editor ID based on component props
 */
export function useMonacoRegistryAuto(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  options: {
    prefix?: string
    ruleId?: string
    enabled?: boolean
  } = {}
) {
  const { prefix = 'editor', ruleId, enabled = true } = options
  
  // Generate a unique ID for this editor instance
  const editorId = ruleId ? `${prefix}-${ruleId}` : `${prefix}-${Date.now()}`
  
  useMonacoRegistry(editorId, editor, enabled)
  
  return editorId
}