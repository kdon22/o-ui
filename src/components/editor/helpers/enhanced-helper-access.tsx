'use client'

import React, { useState, useRef, useCallback } from 'react'
import type * as monaco from 'monaco-editor'
import { HelperCommandPalette } from './helper-command-palette'
import { getHelperConfig } from './helper-registry'
import type { MonacoHelperFactory } from './helper-factory'

interface EnhancedHelperAccessProps {
  editor: monaco.editor.IStandaloneCodeEditor
  onSelectHelper?: (helperId: string, context?: any) => void
  helperFactory?: MonacoHelperFactory // Optional for backward compatibility
}

export function EnhancedHelperAccess({ 
  editor, 
  helperFactory,
  onSelectHelper 
}: EnhancedHelperAccessProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [cursorContext, setCursorContext] = useState<{
    position: { line: number; column: number }
    text: string
  } | null>(null)

  // Open command palette with current cursor context
  const openCommandPalette = useCallback(() => {
    const position = editor.getPosition()
    if (!position) return

    const model = editor.getModel()
    if (!model) return

    // Get context around cursor
    const currentLine = model.getLineContent(position.lineNumber)
    const textBeforeCursor = currentLine.substring(0, position.column - 1)
    const textAfterCursor = currentLine.substring(position.column - 1)

    setCursorContext({
      position: { 
        line: position.lineNumber, 
        column: position.column 
      },
      text: textBeforeCursor.trim()
    })

    setIsPaletteOpen(true)
  }, [editor])

  // Handle helper selection from palette
  const handleSelectHelper = useCallback((helperId: string, context?: any) => {
    
    
    const helperConfig = getHelperConfig(helperId)
    if (!helperConfig) {
      
      return
    }

    // Close palette first
    setIsPaletteOpen(false)

    // Use callback if provided, otherwise fall back to helperFactory
    if (onSelectHelper) {
      onSelectHelper(helperId, context)
    } else if (helperFactory) {
      // Trigger helper via factory
      // Use a slight delay to ensure palette is closed
      setTimeout(() => {
        try {
          // Use helper factory's public method to open helper
          helperFactory?.openHelper(helperId, context)
        } catch (error) {
          
        }
      }, 100)
    } else {
      console.warn('⚠️ No helper handler available (onSelectHelper or helperFactory)')
    }
  }, [helperFactory, onSelectHelper])

  // Register keyboard shortcuts
  React.useEffect(() => {
    if (!editor) return

    // Primary command palette shortcut: Cmd+. (like VS Code Quick Fix)
    const commandPaletteAction = editor.addAction({
      id: 'helper.commandPalette',
      label: 'Open Helper Command Palette',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period // Cmd+. / Ctrl+.
      ],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1,
      run: () => {
        openCommandPalette()
      }
    })

    // Alternative shortcut: Cmd+Shift+P (like VS Code Command Palette)
    const altCommandPaletteAction = editor.addAction({
      id: 'helper.commandPaletteAlt',
      label: 'Open Helper Command Palette (Alt)',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP
      ],
      run: () => {
        openCommandPalette()
      }
    })

    // Quick helper shortcut: Removed Cmd+K to avoid conflict with universal search
    // Use Cmd+. or Cmd+Shift+P instead for helper access
    const quickHelperAction = editor.addAction({
      id: 'helper.quickAccess',
      label: 'Quick Helper Access',
      keybindings: [
        // Removed conflicting Cmd+K - use Cmd+. instead
      ],
      run: () => {
        openCommandPalette()
      }
    })

    return () => {
      commandPaletteAction.dispose()
      altCommandPaletteAction.dispose()
      quickHelperAction.dispose()
    }
  }, [editor, openCommandPalette])

  // Add context menu integration
  React.useEffect(() => {
    if (!editor) return

    // Add helper option to context menu
    const contextMenuContribution = editor.addAction({
      id: 'helper.contextMenu',
      label: '🪄 Insert Helper...',
      contextMenuGroupId: '1_modification',
      contextMenuOrder: 1,
      run: () => {
        openCommandPalette()
      }
    })

    return () => {
      contextMenuContribution.dispose()
    }
  }, [editor, openCommandPalette])

  return (
    <>
      {/* Command Palette Overlay */}
      <HelperCommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelectHelper={handleSelectHelper}
        cursorPosition={cursorContext?.position}
        contextText={cursorContext?.text}
      />

      {/* Helper Status/Debug Panel (Optional) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono">
          <div>💡 Helper Access:</div>
          <div>• Cmd+. - Command Palette</div>
          <div>• Cmd+K - Quick Access</div>
          <div>• Right-click - Context Menu</div>
          <div>• Type "call:" - IntelliSense</div>
          {cursorContext && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <div>Context: {cursorContext.text || '(empty)'}</div>
              <div>Line: {cursorContext.position.line}, Col: {cursorContext.position.column}</div>
            </div>
          )}
        </div>
      )} */}
    </>
  )
}

// Helper function to register enhanced helper access with existing editor
export function setupEnhancedHelperAccess(
  editor: monaco.editor.IStandaloneCodeEditor,
  helperFactory: MonacoHelperFactory
) {
  // This function can be called from your business rule editor
  // to set up the enhanced helper access system
  
  
  
  // The actual setup is handled by the React component
  // This is just a marker function for integration
  
  return () => {
    
  }
}