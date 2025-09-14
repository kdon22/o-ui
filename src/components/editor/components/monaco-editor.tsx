// SSR-Safe Monaco Editor with Dynamic Loading
import dynamic from 'next/dynamic'
import type { MonacoEditorProps } from '../types'

// Dynamic import with SSR disabled to prevent "window is not defined" errors
const MonacoEditorClient = dynamic(
  () => import('./monaco-editor-client'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center border border-border rounded-md bg-background">
        <div className="text-sm text-muted-foreground">Loading Monaco Editor...</div>
      </div>
    )
  }
)

// Export the dynamically loaded Monaco Editor
export const MonacoEditor = (props: MonacoEditorProps) => {
  return <MonacoEditorClient {...props} />
}

export default MonacoEditor 