/**
 * Workflow Builder - Main Visual Workflow Editor
 * 
 * Complete workflow builder component that integrates with the existing
 * action system and WORKFLOW_SCHEMA. Provides drag-and-drop visual workflow creation.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useActionMutation } from '@/hooks/use-action-api';
import { WorkflowCanvas } from './workflow-canvas';
import { ProcessLibraryPanel } from './process-library-panel';
import { WorkflowSerializer } from '../../services/workflow-serializer';
import { useActionQuery } from '@/hooks/use-action-api';
import type { 
  VisualWorkflow,
  WorkflowNode,
  Viewport
} from '../../types/workflow-builder';
import type { Workflow } from '../../workflows.schema';

interface WorkflowBuilderProps {
  /** Existing workflow to edit (optional for new workflows) */
  workflow?: Workflow | null;
  
  /** Whether the builder is read-only */
  readOnly?: boolean;
  
  /** Custom class name */
  className?: string;
  
  /** Called when workflow is saved */
  onSaved?: (workflow: Workflow) => void;
  
  /** Called when workflow changes (for unsaved indicator) */
  onChange?: (hasChanges: boolean) => void;
}

export function WorkflowBuilder({
  workflow,
  readOnly = false,
  className,
  onSaved,
  onChange
}: WorkflowBuilderProps) {

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [visualWorkflow, setVisualWorkflow] = useState<VisualWorkflow>(() => {
    if (workflow) {
      return WorkflowSerializer.fromSchema(workflow);
    }
    
    // Create new workflow with default start and end nodes
    return {
      id: 'new',
      name: 'New Workflow',
      description: '',
      nodes: [
        // Always create a start node
        {
          id: 'start-node',
          type: 'start',
          position: { x: 100, y: 200 },
          size: { width: 60, height: 60 },
          label: 'Start',
          trigger: { type: 'manual' }
        },
        // Always create an end node
        {
          id: 'end-node',
          type: 'end',
          position: { x: 500, y: 200 },
          size: { width: 60, height: 60 },
          label: 'End',
          action: { type: 'success' }
        }
      ],
      connections: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      layout: {
        gridSize: 20,
        snapToGrid: true,
        showGrid: true
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }
    };
  });

  const [hasChanges, setHasChanges] = useState(false);

  // ============================================================================
  // PROCESS LIBRARY DATA LOADING
  // ============================================================================
  
  const { 
    data: processesResult, 
    isLoading: processesLoading 
  } = useActionQuery(
    'process.list',
    {
      filters: {},
      options: {
        limit: 1000,
        sort: { field: 'name', direction: 'asc' }
      }
    },
    {
      staleTime: 300000, // 5 minutes
      fallbackToCache: true
    }
  );

  const processes = processesResult?.data || [];

  // ============================================================================
  // ACTION INTEGRATION
  // ============================================================================

  const saveWorkflowMutation = useActionMutation({
    action: workflow ? 'workflow.update' : 'workflow.create',
    onSuccess: (result) => {
      setHasChanges(false);
      if (onSaved && result.data) {
        onSaved(result.data as Workflow);
      }
    }
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleWorkflowChange = useCallback((newVisualWorkflow: VisualWorkflow) => {
    setVisualWorkflow(newVisualWorkflow);
    setHasChanges(true);
    onChange?.(true);
  }, [onChange]);

  const handleSave = useCallback(async () => {
    const schemaData = WorkflowSerializer.toSchema(visualWorkflow);
    
    if (workflow) {
      // Update existing workflow
      await saveWorkflowMutation.mutateAsync({
        workflowId: workflow.id,
        updates: schemaData
      });
    } else {
      // Create new workflow
      await saveWorkflowMutation.mutateAsync(schemaData);
    }
  }, [visualWorkflow, workflow, saveWorkflowMutation]);

  const handleProcessDrag = useCallback((process: any, event: React.DragEvent) => {
    // Check if dataTransfer is available
    if (!event?.dataTransfer) {
      console.warn('Drag event dataTransfer not available');
      return;
    }

    // Prevent default to ensure smooth dragging
    event.stopPropagation();

    const dragData = {
      type: 'process',
      processId: process.id,
      processName: process.name,
      processType: process.type
    };

    // Set drag data
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'copy';
    
    // Add visual feedback to the dragged element
    const element = event.currentTarget as HTMLElement;
    element.style.opacity = '0.5';
    
    // Reset opacity after drag
    setTimeout(() => {
      element.style.opacity = '';
    }, 100);
  }, []);

  // ============================================================================
  // AUTO-SAVE FUNCTIONALITY
  // ============================================================================

  // Auto-save when workflow changes (debounced)
  useEffect(() => {
    if (!hasChanges || !visualWorkflow || visualWorkflow.id === 'new') return;

    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save after 2 seconds of no changes

    return () => clearTimeout(autoSaveTimer);
  }, [hasChanges, visualWorkflow, handleSave]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    onChange?.(hasChanges);
  }, [hasChanges, onChange]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`flex h-full ${className || ''}`}>
      
      {/* Process Library - Left Side */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
        <ProcessLibraryPanel
          processes={processes}
          onProcessDrag={handleProcessDrag}
          className="w-full h-full"
        />
      </div>
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {visualWorkflow.name}
              {hasChanges && (
                <span className="ml-2 text-sm text-amber-600 dark:text-amber-400">
                  (auto-saving...)
                </span>
              )}
            </h1>
            {visualWorkflow.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {visualWorkflow.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {saveWorkflowMutation.isPending && (
              <Loader2 size={16} className="animate-spin text-blue-600" />
            )}
            <span className="text-sm text-gray-500">
              {visualWorkflow.nodes.length} nodes
            </span>
          </div>
        </div>

        {/* Error Display */}
        {saveWorkflowMutation.error && (
          <Alert className="m-4" variant="destructive">
            <AlertDescription>
              Auto-save failed: {saveWorkflowMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Canvas - Full Width */}
        <div className="flex-1">
          <WorkflowCanvas
            workflow={visualWorkflow}
            onWorkflowChange={handleWorkflowChange}
            readOnly={readOnly}
            className="w-full h-full"
          />
        </div>

      </div>
    </div>
  );
}

// Export for easy usage
export { WorkflowBuilder as default };

