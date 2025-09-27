/**
 * Workflow Builder Page - Visual Workflow Creation
 * 
 * Main page for creating and editing workflows using the drag-and-drop builder.
 * Integrates with existing action system, branching, and version control.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, X } from 'lucide-react';
import { useActionQuery } from '@/hooks/use-action-api';
import { queryKeys } from '@/hooks/use-action-api';
import { useActionClientContext } from '@/lib/session';
import dynamic from 'next/dynamic';
import { InlineNameEditor } from '@/features/workflows/components/workflow-builder/inline-name-editor';

// Lazy-load heavy components for better performance
const WorkflowBuilder = dynamic(
  () => import('@/features/workflows/components/workflow-builder'),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-64">Loading workflow builder...</div>,
  }
);

const UnsavedChangesModalDynamic = dynamic(
  () =>
    import('@/features/workflows/components/workflow-builder/unsaved-changes-modal').then((mod) => ({
      default: mod.UnsavedChangesModal
    })),
  {
    ssr: false,
    loading: () => <div />,
  }
);

import { useUnsavedChangesModal } from '@/features/workflows/components/workflow-builder/unsaved-changes-modal';
import type { Workflow } from '@/features/workflows/workflows.schema';
import type { ValidationError } from '@/features/workflows/utils/workflow-validator';

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get workflow ID from URL params (for editing existing workflows)
  const workflowId = searchParams.get('id');
  const isEditing = Boolean(workflowId);
  const { isReady: actionClientReady, tenantId, branchContext } = useActionClientContext();
  const currentBranchId = branchContext?.currentBranchId;
  const defaultBranchId = branchContext?.defaultBranchId;
  const queryEnabled = isEditing && !!workflowId && actionClientReady;
  const builderQueryKey = queryKeys.actionData('workflow.read', { id: workflowId }, currentBranchId);
  
  // State management
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [canSaveWorkflow, setCanSaveWorkflow] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);

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
    isFetching,
    error
  } = useActionQuery(
    'workflow.read',
    { id: workflowId },
    { 
      // Gate on branch/session readiness to avoid firing before context exists
      enabled: queryEnabled,
      retry: (failureCount, err: any) => {
        // Avoid retry loops on auth/branch context errors
        const msg = (err?.message || '').toString();
        if (msg.includes('Tenant ID not available') || msg.includes('Branch context')) return false;
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );


  // Set workflow data when loaded
  useEffect(() => {
    if (existingWorkflow?.data) {
      setWorkflow(existingWorkflow.data as Workflow);
    }
  }, [existingWorkflow]);

  // Ensure we pass the right workflow state to WorkflowBuilder
  const workflowForBuilder = React.useMemo(() => {
    // If we're editing and have fetched data, use it
    if (isEditing && existingWorkflow?.data) {
      return existingWorkflow.data as Workflow;
    }
    // If we're editing but still loading, use current state
    if (isEditing && workflow) {
      return workflow;
    }
    // For new workflows, return null
    return null;
  }, [isEditing, existingWorkflow?.data, workflow]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleWorkflowSaved = useCallback((savedWorkflow: Workflow) => {
    console.log('🐛 [DEBUG] handleWorkflowSaved called:', { 
      workflowId: savedWorkflow.id, 
      isEditing, 
      willNavigate: !isEditing,
      timestamp: new Date().toISOString() 
    });
    setWorkflow(savedWorkflow);
    setHasUnsavedChanges(false);
    
    // Update URL to editing mode if this was a new workflow
    if (!isEditing) {
      const newUrl = `/workflows/builder?id=${savedWorkflow.id}`;
      console.log('🐛 [DEBUG] Navigating to:', newUrl);
      // 🛡️ Use router.push instead of router.replace to avoid potential race conditions
      router.push(newUrl);
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
    
    // For now, just close the modal and let user manually save
    // In a real implementation, we'd expose a save method from WorkflowBuilder
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
          <div className="mt-6 text-left inline-block bg-gray-50 border border-gray-200 rounded p-4 max-w-xl">
            <p className="font-semibold mb-2">Debug</p>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify({
  workflowId,
  isEditing,
  actionClientReady,
  tenantId,
  currentBranchId,
  defaultBranchId,
  queryEnabled,
  isLoading,
  isFetching,
  error: (error as any)?.message,
  builderQueryKey
}, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing && error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load workflow: {(error as any)?.message ?? 'Unknown error'}
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
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">
                {workflow ? (
                  <InlineNameEditor
                    name={workflow.name}
                    isEditing={isEditingName}
                    onStartEdit={() => setIsEditingName(true)}
                    onCancel={() => setIsEditingName(false)}
                    onSave={(newName) => {
                      console.log('Saving new name:', newName);
                      setWorkflow(prev => (prev ? { ...prev, name: newName } : prev));
                      setIsEditingName(false);
                    }}
                  />
                ) : (
                  <span>Untitled Workflow</span>
                )}
              </h1>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                {workflow?.name || 'Untitled Workflow'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Unsaved changes
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
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
          workflow={workflowForBuilder}
          onSaved={handleWorkflowSaved}
          onChange={handleUnsavedChanges}
          onValidationChange={handleValidationChange}
          className="h-full"
        />
      </div>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModalDynamic
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

