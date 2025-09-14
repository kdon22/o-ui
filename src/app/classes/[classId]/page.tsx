'use client'

import { use, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActionQuery } from '@/hooks/use-action-api'
import { useClassIdResolver } from '@/lib/utils/entity-id-resolver'
import EditorLayout from '@/components/layout/editor/editor-layout'
import { ExtendedClass } from '@/components/layout/editor/types'

interface ClassEditPageProps {
  params: Promise<{ classId: string }>
}

export default function ClassEditPage({ params }: ClassEditPageProps) {
  const searchParams = useSearchParams()
  const { classId: classIdShort } = use(params) // This is actually idShort from URL
  
  // Get branch from URL params, default to 'main'
  const branchParam = searchParams.get('branch')
  const branch = branchParam || 'main'

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [classEntity, setClassEntity] = useState<ExtendedClass | null>(null)

  // 🔥 Resolve idShort to real ID
  const { fullId: classId, isResolving: isResolvingId, error: resolveError } = useClassIdResolver(classIdShort);

  // Load class data using the action system (only after ID is resolved)
  const { data: classData, isLoading: isLoadingClass, error: classError } = useActionQuery(
    'class.read',
    { id: classId, branch },
    { enabled: !!classId } // Only fetch when we have the real ID
  )

  useEffect(() => {
    // State update - silent

    // Show loading while resolving ID or loading class data
    if (isResolvingId || isLoadingClass) {
      setIsLoading(true)
      return
    }

    // Handle ID resolution errors
    if (resolveError) {
      setError(`Failed to find class: ${resolveError.message || 'Class not found'}`)
      setIsLoading(false)
      return
    }

    // Handle class loading errors
    if (classError) {
      setError(`Failed to load class: ${classError.message || 'Unknown error'}`)
      setIsLoading(false)
      return
    }

    if (classData?.data) {
      // Transform the class data to ExtendedClass format expected by editor
      const classContent = classData.data.sourceCode || classData.data.pythonCode || ''
      const transformedClass: ExtendedClass = {
        id: classData.data.id,
        name: classData.data.name || 'Untitled Class',
        description: classData.data.description,
        sourceCode: classContent,
        pythonCode: classData.data.pythonCode || classContent,
        content: classContent, // For Monaco editor compatibility
        pythonName: classData.data.pythonName,
        category: classData.data.category || 'Utility',
        isActive: classData.data.isActive ?? true,
        isAbstract: classData.data.isAbstract ?? false,
        version: classData.data.version || 1,
        tenantId: classData.data.tenantId,
        createdAt: classData.data.createdAt,
        updatedAt: classData.data.updatedAt,
        createdBy: classData.data.createdBy,
        updatedBy: classData.data.updatedBy,
        branchId: classData.data.branchId || branch
      }
      setClassEntity(transformedClass)
      setError(null)
    } else if (!isLoadingClass) {
      setError('Class not found')
    }

    setIsLoading(false)
  }, [classData, isLoadingClass, classError, isResolvingId, resolveError, branch])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading class...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <h3 className="text-lg font-semibold mb-2">Class Not Found</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Branch: <span className="font-mono">{branch}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <EditorLayout 
      classId={classId}
      classIdShort={classIdShort}
      initialClass={classEntity}
    />
  )
} 