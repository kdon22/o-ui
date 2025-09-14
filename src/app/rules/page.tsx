'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// 🚀 **PERFORMANCE FIX**: Lazy load heavy editor system
// Only loads Monaco + language services when actually needed
const EditorLayout = dynamic(
  () => import('@/components/layout/editor/editor-layout'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen flex flex-col bg-gray-50">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
            <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mx-auto" />
            <div className="text-sm text-muted-foreground mt-4">Loading rules editor...</div>
          </div>
        </div>
      </div>
    )
  }
)

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