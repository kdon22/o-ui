// Client-only Monaco Editor wrapper to prevent SSR issues
'use client'

import React, { useRef, useCallback, useEffect, memo } from 'react'
import Editor from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import type { MonacoEditorProps } from '../types'
import { useEditorPreferences } from '@/components/layout/editor/editor-preferences'
import { MonacoCodeInsertion } from '../../search/monaco-code-insertion'
import '../monaco-hover-fix.css'
import '../rule-tester/styles/debug.css'

const MonacoEditorClient = ({
  value,
  onChange,
  onSave,
  onMount,
  hasUnsavedChanges,
  height = '100%',
  className = '',
  userVariables = [],
  language = 'business-rules', // Default to business-rules for backward compatibility
  debugMode = false,
  breakpoints = [],
  currentExecutionLine,
  onBreakpointToggle,
  debugVariables = []
}: MonacoEditorProps) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof monaco | null>(null)
  const searchCleanupRef = useRef<(() => void) | null>(null)
  
  // 🎯 **DECORATION MANAGEMENT**: Track decoration IDs to prevent accumulation
  const breakpointDecorationsRef = useRef<string[]>([])
  const executionLineDecorationsRef = useRef<string[]>([])

  const { preferences } = useEditorPreferences()

  const handleEditorDidMount = useCallback(async (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    editorRef.current = editor
    monacoRef.current = monacoInstance

    // 🎯 **APPLY INITIAL PREFERENCES**: Set preferences on mount (no registry needed)

    editor.updateOptions({
      fontSize: preferences.fontSize,
      fontFamily: preferences.fontFamily,
      wordWrap: preferences.wordWrap ? 'on' : 'off',
      lineNumbers: preferences.lineNumbers,
    })

    
    // 🎯 **REGISTER FOR UNIVERSAL SEARCH**: Connect to code insertion system
    const unregisterFromSearch = MonacoCodeInsertion.registerEditor(`editor-${Date.now()}`, editor)

    
    // Store cleanup function
    searchCleanupRef.current = unregisterFromSearch

    // 🚨 DISABLED: Complex initialization system to prevent conflicts with direct schema integration

    
    // 🔍 **DEBUG MODE INFO**: Log debug configuration
    if (debugMode) {
      console.log('🎯 [MonacoEditor] Debug mode enabled:', {
        debugMode,
        glyphMargin: editor.getOptions().get(monacoInstance.editor.EditorOption.glyphMargin),
        hasBreakpointToggleHandler: !!onBreakpointToggle,
        breakpointsCount: breakpoints.length
      })
    }
    
    // 🎯 **BREAKPOINT CLICK HANDLER** - Only for non-debug mode
    // In debug mode, EnterpriseDebugAdapter handles breakpoints
    if (!debugMode && onBreakpointToggle) {
      
      // Add glyph margin click listener for breakpoint toggling
      const clickDisposable = editor.onMouseDown((e) => {
        console.log('🖱️ [MonacoEditor] Mouse click detected:', {
          targetType: e.target.type,
          position: e.target.position,
          isGlyphMargin: e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN,
          isLineNumbers: e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_LINE_NUMBERS
        })
        
        // Also listen for line number clicks as fallback
        if (e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN || 
            e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
          const line = e.target.position?.lineNumber
          if (line) {
            const hasBreakpoint = breakpoints.includes(line)
        
            onBreakpointToggle(line, !hasBreakpoint)
          }
        }
      })
      
      // Store cleanup function
      const cleanupClick = () => {
        clickDisposable.dispose()
    
      }
      
      // Add to existing cleanup
      const existingCleanup = searchCleanupRef.current
      searchCleanupRef.current = () => {
        existingCleanup?.()
        cleanupClick()
      }
    }
    
    // Call the external onMount callback if provided (this will handle the direct integration)
    onMount?.(editor, monacoInstance)
  }, [userVariables, onMount, preferences, debugMode, onBreakpointToggle, breakpoints])

  const handleChange = useCallback((value: string | undefined) => {
    const actualValue = value || ''
    console.log('🚨🚨🚨 [MonacoEditorClient] MONACO CHANGE DETECTED!', {
      value: actualValue,
      valueLength: actualValue.length,
      hasOnChange: !!onChange,
      preview: actualValue.substring(0, 100) + (actualValue.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    })
    
    if (onChange) {
      console.log('🔥 [MonacoEditorClient] Calling parent onChange...')
      onChange(actualValue)
      console.log('✅ [MonacoEditorClient] Parent onChange called successfully')
    } else {
      console.log('⚠️ [MonacoEditorClient] No onChange handler provided!')
    }
  }, [onChange])
  
  // 🏆 **MONACO NATIVE DISPOSAL**: Use Monaco's built-in dispose() method
  useEffect(() => {
    return () => {
      // Clean up search registration first
      if (searchCleanupRef.current) {
        searchCleanupRef.current()
    
      }
      
      // 🏆 **MONACO'S NATIVE DISPOSAL**: This is the key to preventing multiple instances
      if (editorRef.current) {
        console.log('🧹 [MonacoEditorClient] Disposing Monaco editor with native dispose()')
        editorRef.current.dispose()
    
        editorRef.current = null
      }
    }
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return

    const editor = editorRef.current
    const monaco = monacoRef.current

    // Add save shortcut
    const saveAction = editor.addAction({
      id: 'save-content',
      label: 'Save',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        onSave?.()
      }
    })

    // Add universal search shortcut (fallback if global handler doesn't work)
    const universalSearchAction = editor.addAction({
      id: 'universal-search',
      label: 'Universal Rule Search',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      run: () => {
    
        // Dispatch a custom event that the provider can listen to
        window.dispatchEvent(new CustomEvent('universal-search-open', { 
          detail: { source: 'monaco-editor' }
        }))
      }
    })

    return () => {
      saveAction.dispose()
      universalSearchAction.dispose()
    }
  }, [onSave])

  // 🎯 **CLICK HANDLER MOVED** - Now handled in handleEditorDidMount for proper timing

  // 🎯 **NATIVE MONACO BREAKPOINTS**: Using Monaco's built-in decoration system
  // Only handle breakpoints when NOT in debug mode (EnterpriseDebugAdapter handles debug mode)
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || debugMode) {
      // Clear breakpoints when in debug mode (let EnterpriseDebugAdapter handle them)
      if (breakpointDecorationsRef.current.length > 0) {
        editorRef.current?.deltaDecorations(breakpointDecorationsRef.current, [])
        breakpointDecorationsRef.current = []
      }
      return
    }

    const editor = editorRef.current
    const monaco = monacoRef.current

    // 🔴 **NATIVE MONACO BREAKPOINTS**: Use Monaco's native decoration system
    const decorations = breakpoints.map(line => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        // Use Monaco's native glyph margin decoration
        glyphMarginClassName: 'codicon codicon-debug-breakpoint',
        glyphMarginHoverMessage: { value: `Breakpoint at line ${line}` },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }))

    // Apply decorations using Monaco's native system
    breakpointDecorationsRef.current = editor.deltaDecorations(
      breakpointDecorationsRef.current,
      decorations
    )
    

  }, [debugMode, breakpoints])

  // 🎯 **NATIVE EXECUTION LINE**: Using Monaco's built-in decoration system  
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !debugMode) {
      // Clear execution line when not in debug mode
      if (executionLineDecorationsRef.current.length > 0) {
        editorRef.current?.deltaDecorations(executionLineDecorationsRef.current, [])
        executionLineDecorationsRef.current = []
      }
      return
    }

    const editor = editorRef.current
    const monaco = monacoRef.current

    // 🟢 **NATIVE MONACO EXECUTION LINE**: Use Monaco's native debugging decorations
    const decorations = currentExecutionLine !== undefined ? [{
      range: new monaco.Range(currentExecutionLine, 1, currentExecutionLine, 1),
      options: {
        isWholeLine: true,
        // Use Monaco's native execution line styling
        className: 'editor-line-highlight',
        glyphMarginClassName: 'codicon codicon-debug-stackframe',
        glyphMarginHoverMessage: { value: `Current execution line: ${currentExecutionLine}` },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        // Add Monaco's native line highlighting
        linesDecorationsClassName: 'debug-line-decorator'
      }
    }] : []

    // Apply decorations using Monaco's native system
    executionLineDecorationsRef.current = editor.deltaDecorations(
      executionLineDecorationsRef.current,
      decorations
    )
    
    if (currentExecutionLine !== undefined) {
  
    } else {
  
    }
  }, [debugMode, currentExecutionLine])

  return (
    <div className={`monaco-editor-container ${className}`} style={{ height }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={language === 'python' 
          ? (preferences.theme === 'dark' ? 'vs-dark' : 'vs') 
          : (preferences.theme === 'dark' ? 'business-rules-dark' : 'business-rules-light')
        }
        options={{
          // 🎯 **NATIVE DEBUGGING SUPPORT**: Essential options for proper debugging
          fontSize: preferences.fontSize,
          tabSize: preferences.tabSize,
          wordWrap: preferences.wordWrap ? 'on' : 'off',
          minimap: { enabled: false }, // Minimap disabled - cleaner editor experience
          
          // 🔢 **LINE NUMBERS**: Native Monaco line number display
          lineNumbers: 'on',
          lineNumbersMinChars: 4, // Ensure adequate space for line numbers
          
          // 🔴 **BREAKPOINT SUPPORT**: Native glyph margin for breakpoints  
          glyphMargin: true,
          
          // 🎨 **NATIVE STYLING**: Let Monaco handle its own styling
          folding: true,
          foldingStrategy: 'indentation',
          renderLineHighlight: debugMode ? 'none' : 'line', // Let debug decorations handle highlighting
          selectOnLineNumbers: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 10, bottom: 10 },
          
          // 🧠 **INTELLISENSE**: Keep existing completion configuration
          suggest: {
            showKeywords: false, // We handle keywords via our custom completion provider
            showSnippets: true,
            showFunctions: true,
            showVariables: true,
            showFields: true,
            showValues: true,
            showStatus: false, // Disable "no suggestions" bubble
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on'
        }}
      />
    </div>
  )
}

export default memo(MonacoEditorClient)