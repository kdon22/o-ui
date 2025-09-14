'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, RefreshCw } from 'lucide-react'
import { AutoForm } from '@/components/auto-generated/form'
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api'
import { CLASS_SCHEMA } from '@/features/classes/classes.schema'
import { useSession } from 'next-auth/react'

interface ClassDetailsTabProps {
  classId: string // 'new' for create mode, actual ID for edit mode
  onSave?: () => void
  isCreateMode?: boolean
  onClassCreated?: (newClass: { id: string; idShort: string }) => void
}

export function ClassDetailsTab({ 
  classId, 
  onSave, 
  isCreateMode = false,
  onClassCreated 
}: ClassDetailsTabProps) {
  const { data: session, status } = useSession()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Don't initialize mutations until session is ready
  const isSessionReady = status !== 'loading' && !!session?.user?.tenantId

  // Only fetch class data if not in create mode
  const { data: classResponse, isLoading: loadingClass } = useActionQuery(
    'class.read', 
    { id: classId },
    { enabled: !isCreateMode && classId !== 'new' && isSessionReady }
  )
  
  // Use appropriate mutation based on mode - only when session is ready
  const createClassMutation = isSessionReady ? useActionMutation('class.create') : null
  const updateClassMutation = isSessionReady ? useActionMutation('class.update') : null

  // Extract class data from response
  const classEntity = classResponse?.data

  const handleFormSubmit = async (formData: any) => {
    if (!isSessionReady) {
      console.warn('Session not ready, cannot save class')
      return
    }

    setIsSaving(true)
    
    try {
      if (isCreateMode) {
        // Create new class
    
        
        const result = await createClassMutation?.mutateAsync(formData)
        
    
        
        // Clear any unsaved changes flag
        setHasUnsavedChanges(false)
        
        // Notify parent component of successful creation
        if (onClassCreated && result?.data) {
          onClassCreated({
            id: result.data.id,
            idShort: result.data.idShort || result.data.id
          })
        }
        
        // Call parent onSave if provided
        if (onSave) {
          onSave()
        }
        
      } else {
        // Update existing class
    
        
        const result = await updateClassMutation?.mutateAsync({
          id: classId,
          ...formData
        })
        
    
        
        // Clear any unsaved changes flag
        setHasUnsavedChanges(false)
        
        // Call parent onSave if provided
        if (onSave) {
          onSave()
        }
      }
      
    } catch (error) {
      console.error('❌ Error saving class:', error)
      // Keep saving state so user can retry
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {

    setHasUnsavedChanges(false)
    // Could navigate back or reset form here
  }

  // Show loading state if session is not ready
  if (!isSessionReady) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isCreateMode ? 'Create New Class' : 'Class Details'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isCreateMode 
                ? 'Define your class properties and settings'
                : 'Edit class properties and settings'
              }
            </p>
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center text-amber-600 text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              Unsaved changes
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loadingClass ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading class...</span>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <AutoForm
                schema={CLASS_SCHEMA}
                mode={isCreateMode ? "create" : "edit"}
                initialData={isCreateMode ? {} : classEntity}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
                isLoading={isSaving}
                compact={true}
                enableAnimations={false} // Disable animations in tab context
                className="space-y-6"
                onError={(error) => {
                  console.error('Form error:', error)
                  setIsSaving(false)
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}