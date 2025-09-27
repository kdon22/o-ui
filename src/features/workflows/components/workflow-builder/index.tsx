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
import { ValidatedNameEditor } from '@/components/ui/validated-name-editor';
import { useWorkflowNameValidation } from '@/hooks/use-name-validation';
import { WorkflowSerializer } from '../../services/workflow-serializer';
import { validateWorkflow, canWorkflowBeSaved, type ValidationResult, type ValidationError, type ValidationMode } from '../../utils/workflow-validator';
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

  /** Called when workflow validation status changes */
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void;
}

export function WorkflowBuilder({
  workflow,
  readOnly = false,
  className,
  onSaved,
  onChange,
  onValidationChange
}: WorkflowBuilderProps) {

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [visualWorkflow, setVisualWorkflow] = useState<VisualWorkflow>(() => {
    if (workflow) {
      return WorkflowSerializer.fromSchema(workflow);
    }
    
    // Create new workflow with default start and end nodes immediately
    return {
      id: 'new',
      name: 'Untitled Workflow',
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
        // Always create an end node positioned at the end of the canvas
        {
          id: 'end-node',
          type: 'end',
          position: { x: 1040, y: 200 },
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

  const [isEditingName, setIsEditingName] = useState<boolean>(!workflow);
  const [workflowName, setWorkflowName] = useState<string>(workflow?.name || 'New Workflow');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);  // Add saving state protection
  const [validationResult, setValidationResult] = useState<ValidationResult>(() => 
    validateWorkflow(visualWorkflow, 'immediate')
  );
  
  // Track processes already used in the workflow
  const [usedProcessIds, setUsedProcessIds] = useState<Set<string>>(() => {
    const used = new Set<string>();
    if (visualWorkflow) {
      visualWorkflow.nodes.forEach(node => {
        if (node.type === 'process' && node.processId) {
          used.add(node.processId);
        }
      });
    }
    return used;
  });

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
      gcTime: 600000 // 10 minutes
    }
  );

  // Filter out processes already used in the workflow
  const processes = (processesResult?.data || []).filter((process: any) => 
    !usedProcessIds.has(process.id)
  );

  // ============================================================================
  // ACTION INTEGRATION
  // ============================================================================

  const saveWorkflowMutation = useActionMutation('workflow.create', {
    onMutate: (variables) => {
      console.log('🐛 [DEBUG] saveWorkflowMutation.onMutate:', { 
        name: variables.name,
        id: variables.id,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: (result) => {
      console.log('🐛 [DEBUG] saveWorkflowMutation.onSuccess:', { 
        resultId: result.data?.id,
        timestamp: new Date().toISOString()
      });
      setHasChanges(false);
      if (onSaved && result.data) {
        onSaved(result.data as Workflow);
      }
    },
    onError: (error) => {
      console.log('🐛 [DEBUG] saveWorkflowMutation.onError:', { 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  const updateWorkflowMutation = useActionMutation('workflow.update', {
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

  const handleNameSave = useCallback(async (name: string) => {
    if (!name.trim()) return;
    
    // 🛡️ PREVENT MULTIPLE SAVES: Check if already saving
    if (isSaving) {
      console.warn('🚫 [WorkflowBuilder] Save already in progress, ignoring duplicate call');
      return;
    }

    try {
      setIsSaving(true);
      console.log('🐛 [DEBUG] handleNameSave called:', { name: name.trim(), hasWorkflow: !!workflow, timestamp: new Date().toISOString() });
      
      if (!workflow) {
        console.log('🐛 [DEBUG] Creating new workflow via mutation');
        // Create new workflow in database
        const initialVisual = WorkflowSerializer.toSchema(visualWorkflow).definition;
        const result = await saveWorkflowMutation.mutateAsync({
          name: name.trim(),
          description: '',
          type: 'SEQUENTIAL',
          definition: initialVisual,
          isActive: true
        });

        if (result.data) {
          // Update visual workflow with saved data
          const updatedWorkflow = {
            ...visualWorkflow,
            id: result.data.id,
            name: result.data.name,
            metadata: {
              ...visualWorkflow.metadata,
              createdAt: result.data.createdAt,
              updatedAt: result.data.updatedAt
            }
          };

          setVisualWorkflow(updatedWorkflow);
          setWorkflowName(result.data.name);
          setIsEditingName(false);
          
          // Notify parent that workflow was created
          if (onSaved) {
            onSaved(result.data as Workflow);
          }
        }
      } else {
        // Update existing workflow name
        await updateWorkflowMutation.mutateAsync({
          id: workflow.id,
          name: name.trim()
        });
        
        // Update local state
        const updatedWorkflow = { ...visualWorkflow, name: name.trim() };
        setVisualWorkflow(updatedWorkflow);
        setWorkflowName(name.trim());
        setIsEditingName(false);
      }
    } catch (error) {
      console.error('❌ [WorkflowBuilder] Failed to save workflow name:', error);
    } finally {
      setIsSaving(false);
    }
  }, [visualWorkflow, workflow, saveWorkflowMutation, updateWorkflowMutation, onSaved, isSaving]);

  const handleWorkflowChange = useCallback((newVisualWorkflow: VisualWorkflow) => {
    setVisualWorkflow(newVisualWorkflow);
    setHasChanges(true);
    onChange?.(true);
    
    // Update used process IDs based on current nodes
    const newUsedProcessIds = new Set<string>();
    newVisualWorkflow.nodes.forEach(node => {
      if (node.type === 'process' && node.processId) {
        newUsedProcessIds.add(node.processId);
      }
    });
    setUsedProcessIds(newUsedProcessIds);
    
    // Revalidate the workflow (immediate mode - only critical errors)
    setValidationResult(validateWorkflow(newVisualWorkflow, 'immediate'));
  }, [onChange]);

  // Revalidate when workflow name changes (immediate mode - only critical errors)
  useEffect(() => {
    const updatedWorkflow = { ...visualWorkflow, name: workflowName };
    setValidationResult(validateWorkflow(updatedWorkflow, 'immediate'));
  }, [visualWorkflow, workflowName]);

  // Notify parent about validation changes (send full validation for close decisions)
  useEffect(() => {
    const fullValidation = validateWorkflow({ ...visualWorkflow, name: workflowName }, 'on-close');
    onValidationChange?.(fullValidation.isValid, fullValidation.errors);
  }, [validationResult, visualWorkflow, workflowName]); // Removed onValidationChange from deps since it's memoized

  const handleSave = useCallback(async () => {
    if (!visualWorkflow || !workflow) return;
    
    // For auto-save, only validate immediate issues (like empty name)
    // Full validation only happens on manual close
    const currentValidation = validateWorkflow({ ...visualWorkflow, name: workflowName }, 'immediate');
    if (!currentValidation.isValid) {
      console.warn('Skipping auto-save due to validation errors:', currentValidation.errors);
      return;
    }
    
    const schemaData = WorkflowSerializer.toSchema(visualWorkflow);
    
    // For existing workflows, always update - use correct field names
    await updateWorkflowMutation.mutateAsync({
      id: workflow.id,
      name: schemaData.name || visualWorkflow.name,
      description: schemaData.description || visualWorkflow.description,
      definition: schemaData.definition || {
        visual: {
          nodes: visualWorkflow.nodes || [],
          connections: visualWorkflow.connections || [],
          viewport: visualWorkflow.viewport || { x: 0, y: 0, zoom: 1 },
          layout: visualWorkflow.layout || {
            gridSize: 20,
            snapToGrid: true,
            showGrid: true
          }
        },
        execution: {},
        metadata: {
          nodeCount: visualWorkflow.nodes?.length || 0,
          connectionCount: visualWorkflow.connections?.length || 0,
          complexity: 1
        }
      }
    });
  }, [visualWorkflow, workflow, updateWorkflowMutation]);

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
  // 🛡️ ONLY for existing workflows - NEW workflows should be saved explicitly via name editor
  useEffect(() => {
    if (!hasChanges || !visualWorkflow || visualWorkflow.id === 'new' || !workflow) return;
    
    // 🚫 DISABLED: Auto-save conflicts with explicit name-based creation for new workflows
    // For existing workflows, auto-save after changes but NOT during initial creation
    if (workflow && workflow.id && workflow.id !== 'new') {
      const autoSaveTimer = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of no changes

      return () => clearTimeout(autoSaveTimer);
    }
  }, [hasChanges, visualWorkflow, workflow, handleSave]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    onChange?.(hasChanges);
  }, [hasChanges, onChange]);

  // Sync workflow name with visual workflow name
  useEffect(() => {
    if (visualWorkflow.name !== workflowName && !isEditingName) {
      setWorkflowName(visualWorkflow.name);
    }
  }, [visualWorkflow.name, workflowName, isEditingName]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Always show the canvas - no separate name form screen

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
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ValidatedNameEditor
                  name={workflowName}
                  isEditing={isEditingName}
                  onSave={handleNameSave}
                  onCancel={() => {
                    setIsEditingName(false);
                    setWorkflowName(workflow?.name || visualWorkflow.name);
                  }}
                  onStartEdit={() => setIsEditingName(true)}
                  useValidation={useWorkflowNameValidation}
                  currentEntityId={workflow?.id}
                  placeholder="Enter workflow name..."
                  disabled={!validationResult.isValid}
                  showSuggestions={true}
                />
                {hasChanges && (
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    (auto-saving...)
                  </span>
                )}
                {!workflow && !isEditingName && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                    Click to name
                  </span>
                )}
              </div>
              {visualWorkflow.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {visualWorkflow.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {(saveWorkflowMutation.isPending || updateWorkflowMutation.isPending) && (
              <Loader2 size={16} className="animate-spin text-blue-600" />
            )}
            <span className="text-sm text-gray-500">
              {visualWorkflow.nodes.length} nodes
            </span>
          </div>
        </div>

        {/* Error Display */}
        {(saveWorkflowMutation.error || updateWorkflowMutation.error) && (
          <Alert className="m-4" variant="destructive">
            <AlertDescription>
              Auto-save failed: {(saveWorkflowMutation.error || updateWorkflowMutation.error)?.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {!validationResult.isValid && (
          <div className="m-4 space-y-2">
            {validationResult.errors.map((error) => (
              <Alert key={error.id} variant="destructive">
                <AlertDescription>
                  <strong>{error.message}</strong>
                  {error.description && <div className="text-sm mt-1">{error.description}</div>}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Validation Warnings */}
        {validationResult.warnings.length > 0 && (
          <div className="m-4 space-y-2">
            {validationResult.warnings.map((warning) => (
              <Alert key={warning.id} variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>{warning.message}</strong>
                  {warning.description && <div className="text-sm mt-1">{warning.description}</div>}
                </AlertDescription>
              </Alert>
            ))}
          </div>
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

