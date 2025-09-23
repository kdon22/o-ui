/**
 * Workflow Builder Page - Visual Workflow Creation
 * 
 * Main page for creating and editing workflows using the drag-and-drop builder.
 * Integrates with existing action system, branching, and version control.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Play, Download, X } from 'lucide-react';
import { useActionQuery } from '@/hooks/use-action-api';
import { useCleanBranchContext } from '@/hooks/use-clean-branch-context';
import { WorkflowBuilder } from '@/features/workflows/components/workflow-builder';
import { UnsavedChangesModal, useUnsavedChangesModal } from '@/features/workflows/components/workflow-builder/unsaved-changes-modal';
import type { Workflow } from '@/features/workflows/workflows.schema';
import type { ValidationError } from '@/features/workflows/utils/workflow-validator';

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get workflow ID from URL params (for editing existing workflows)
  const workflowId = searchParams.get('id');
  const isEditing = Boolean(workflowId);
  
  // Remove branch context requirement
  
  // State management
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [canSaveWorkflow, setCanSaveWorkflow] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Unsaved changes modal
  const {
    isOpen: isUnsavedModalOpen,
    setIsOpen: setIsUnsavedModalOpen,
    showModal: showUnsavedModal,
    handleDiscard: handleDiscardChanges,
    handleContinueEditing
  } = useUnsavedChangesModal();

  // ============================================================================
  // DATA FETCHING - Uses existing action system with branch awareness
  // ============================================================================

  const {
    data: existingWorkflow,
    isLoading,
    error
  } = useActionQuery(
    'workflow.read',
    { id: workflowId },
    { 
      enabled: isEditing && !!workflowId,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  // Set workflow data when loaded
  useEffect(() => {
    if (existingWorkflow?.data) {
      setWorkflow(existingWorkflow.data as Workflow);
    }
  }, [existingWorkflow]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleWorkflowSaved = useCallback((savedWorkflow: Workflow) => {
    setWorkflow(savedWorkflow);
    setHasUnsavedChanges(false);
    
    // Update URL to editing mode if this was a new workflow
    if (!isEditing) {
      const newUrl = `/workflows/builder?id=${savedWorkflow.id}`;
      router.replace(newUrl);
    }
  }, [isEditing, router]);

  const handleUnsavedChanges = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  const handleValidationChange = useCallback((isValid: boolean, errors: ValidationError[]) => {
    setCanSaveWorkflow(isValid);
    setValidationErrors(errors);
  }, []);

  const handleBackToList = () => {
    if (hasUnsavedChanges) {
      showUnsavedModal(() => router.push('/workflows'));
      return;
    }
    
    router.push('/workflows');
  };

  const handleSaveAndClose = async () => {
    // For now, we can't trigger save from here since WorkflowBuilder handles its own saves
    // This is a limitation that would need to be addressed by exposing a save method
    // from WorkflowBuilder or changing the architecture
    console.warn('Save from modal not yet implemented - WorkflowBuilder handles its own saving');
    
    // For now, just close the modal and let user manually save
    // In a real implementation, we'd expose a save method from WorkflowBuilder
  };

  const handleTestWorkflow = () => {
    if (!workflow) return;
    
    // TODO: Implement workflow testing
    console.log('Testing workflow:', workflow.id);
    // Could navigate to a test runner page or open a modal
  };

  // ============================================================================
  // LOADING STATES
  // ============================================================================

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (isEditing && error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load workflow: {error.message}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => router.push('/workflows')} 
          className="mt-4"
          variant="outline"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Workflows
        </Button>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-screen flex flex-col">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        
        {/* Left: Back button and title */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBackToList}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Workflows
          </Button>
          
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Workflow' : 'Create New Workflow'}
            </h1>
            {workflow && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {workflow.name} • {workflow.workflowType || 'SEQUENTIAL'}
              </p>
            )}
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-sm text-amber-700 dark:text-amber-300">
                Unsaved changes
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">

          {workflow && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTestWorkflow}
              >
                <Play size={16} className="mr-2" />
                Test
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // TODO: Export workflow functionality
                  console.log('Exporting workflow');
                }}
              >
                <Download size={16} className="mr-2" />
                Export
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Close workflow builder"
          >
            <X size={18} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" />
          </Button>
        </div>
      </div>

      {/* Main Workflow Builder */}
      <div className="flex-1 overflow-hidden">
        <WorkflowBuilder
          workflow={workflow}
          onSaved={handleWorkflowSaved}
          onChange={handleUnsavedChanges}
          onValidationChange={handleValidationChange}
          className="h-full"
        />
      </div>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        open={isUnsavedModalOpen}
        onOpenChange={setIsUnsavedModalOpen}
        canSave={false} // Temporarily disabled - would need WorkflowBuilder save method
        validationErrors={validationErrors}
        onSave={handleSaveAndClose}
        onDiscard={handleDiscardChanges}
        onContinueEditing={handleContinueEditing}
        workflowName={workflow?.name || 'Untitled Workflow'}
      />

    </div>
  );
}
