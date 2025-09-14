import EditorLayout from '@/components/layout/editor/editor-layout'
import { Suspense } from 'react'

export default function RulesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    }>
      <EditorLayout 
        ruleId={null}
        initialRule={null}
      />
    </Suspense>
  )
} 