'use client'

// 🏆 UNIFIED EDITOR SAVE SYSTEM - SSOT for all editor saves
// 
// Single source of truth for ALL editor tab saves across the application.
// Eliminates competing save systems and provides unified auto-save behavior.

export * from './types'
export { useEditorSave, useMultiTabEditorSave } from './use-editor-save'
export * from './adapters'
