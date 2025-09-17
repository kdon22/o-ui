/**
 * 🏆 PythonOutputTab - Python Code Viewer
 * 
 * Clean wrapper around the existing RulePythonViewer.
 * Displays generated Python code with proper syntax highlighting.
 */

import { RulePythonViewer } from '@/components/editor/components/rule-python-viewer'
import type { PythonOutputTabProps } from '../../types'

export function PythonOutputTab({
  pythonCode,
  readOnly = true
}: PythonOutputTabProps) {
  
  console.log('📺 [PythonOutputTab] Rendering with Python code:', {
    pythonCodeLength: pythonCode?.length || 0,
    preview: pythonCode ? `"${pythonCode.substring(0, 50)}..."` : 'EMPTY',
    readOnly
  })
  
  return (
    <div className="h-full">
      <RulePythonViewer
        key="python-output-monaco-viewer"
        value={pythonCode || ''}
        readOnly={readOnly}
        height="100%"
        // 🛡️ ALL EXISTING FEATURES PRESERVED:
        // - Python syntax highlighting
        // - Code folding and formatting
        // - Monaco editor features
      />
    </div>
  )
}
