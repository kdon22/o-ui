/**
 * Workflow Canvas - Main Visual Editor
 * 
 * The core canvas component for the workflow builder.
 * Handles drag/drop, selection, and viewport management.
 */

'use client';

import { useRef, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid/non-secure';
import { cn } from '@/lib/utils/generalUtils'
import { useWorkflowBuilder } from '../../hooks/use-workflow-builder';
import { WorkflowNodeRenderer } from './workflow-node-renderer';
import { WorkflowConnectionRenderer } from './workflow-connection-renderer';
import { WorkflowGrid } from './workflow-grid';
import type { WorkflowCanvasProps, Position, ProcessNode, WorkflowNode } from '../../types/workflow-builder';

export function WorkflowCanvas({ 
  workflow, 
  onWorkflowChange, 
  readOnly = false,
  className 
}: WorkflowCanvasProps) {
  const canvasRef = useRef<SVGSVGElement>(null);
  const initializedRef = useRef(false);
  const {
    state,
    actions: {
      setWorkflow,
      addNode,
      updateNode,
      deleteNode,
      moveNode,
      addConnection,
      deleteConnection,
      selectNodes,
      selectConnections,
      clearSelection,
      startDrag,
      updateDrag,
      endDrag,
      startConnection,
      updateConnection,
      endConnection,
      cancelConnection,
      setViewport,
      setTool,
      undo,
      redo
    }
  } = useWorkflowBuilder();

  // Initialize workflow from props once only
  useEffect(() => {
    if (workflow && !initializedRef.current) {
      setWorkflow(workflow);
      initializedRef.current = true;
    }
  }, [workflow, setWorkflow]); // Only initialize once

  // Notify parent of changes (but avoid circular updates)
  useEffect(() => {
    // Only notify parent if we have a workflow, it's different from props,
    // and we've completed initialization
    if (state.workflow && initializedRef.current && state.workflow !== workflow) {
      onWorkflowChange(state.workflow);
    }
  }, [state.workflow, workflow, onWorkflowChange]);

  // ============================================================================
  // COORDINATE HELPERS
  // ============================================================================

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): Position | null => {
    if (!canvasRef.current) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // ============================================================================
  // DRAG & DROP HANDLERS - FOLLOWS PROMPT-EDITOR PATTERN
  // ============================================================================

  interface ProcessDragData {
    type: 'process';
    processId: string;
    processName: string;
    processType: string;
  }

  interface GatewayDragData {
    type: 'gateway';
    gatewayType: 'parallel-gateway' | 'exclusive-gateway';
    name: string;
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual feedback
    if (canvasRef.current) {
      canvasRef.current.style.backgroundColor = '';
    }
    
    if (readOnly) return;

    try {
      // Get drag data and validate it exists
      const dragDataString = e.dataTransfer.getData('application/json');
      if (!dragDataString || dragDataString.trim() === '') {
        console.warn('No drag data found - this may be a node move operation');
        return;
      }

      const dragData: ProcessDragData | GatewayDragData = JSON.parse(dragDataString);
      
      // Get canvas coordinates
      const canvasPos = getCanvasCoordinates(e.clientX, e.clientY);
      if (!canvasPos) return;

      // Handle different drop types
      if (dragData.type === 'process') {
        // Validate process drag data
        const processData = dragData as ProcessDragData;
        if (!processData.processId) {
          console.warn('Invalid process drag data:', processData);
          return;
        }

        // Create ProcessNode from dropped process, centered on drop location
        const newProcessNode: ProcessNode = {
          id: nanoid(),
          type: 'process',
          position: {
            x: Math.max(0, canvasPos.x - 70), // Center node on cursor (half width)
            y: Math.max(0, canvasPos.y - 40)  // Center node on cursor (half height)
          },
          size: { width: 140, height: 80 },
          label: processData.processName, // Clean process name only
          processId: processData.processId,
          processName: processData.processName,
          processType: processData.processType,
          rules: [],
          timeout: 30,
          retryCount: 3
        };

        // Add node to workflow using the builder action
        addNode(newProcessNode);

      } else if (dragData.type === 'gateway') {
        // Handle gateway drop
        const gatewayData = dragData as GatewayDragData;
        
        const gatewayNode: WorkflowNode = {
          id: nanoid(),
          type: gatewayData.gatewayType,
          position: {
            x: Math.max(0, canvasPos.x - 30), // Center gateway (half width)
            y: Math.max(0, canvasPos.y - 30)  // Center gateway (half height)
          },
          size: { width: 60, height: 60 },
          label: gatewayData.name,
          ...(gatewayData.gatewayType === 'parallel-gateway' 
            ? { executionMode: 'all' as const, maxConcurrent: undefined }
            : { condition: undefined, defaultBranch: undefined }
          )
        } as any;

        // Add gateway node to workflow
        addNode(gatewayNode);

      } else {
        console.warn('Unknown drag data type:', (dragData as any).type || 'unknown');
        return;
      }

    } catch (error) {
      console.error('Failed to parse drag data:', error);
      // Silently fail for invalid drag operations
    }
  }, [readOnly, getCanvasCoordinates, addNode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    
    // Add visual feedback during drag over
    if (canvasRef.current) {
      canvasRef.current.style.backgroundColor = '#f0f9ff'; // Light blue tint
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual feedback when leaving
    if (canvasRef.current) {
      canvasRef.current.style.backgroundColor = '';
    }
  }, []);

  // ============================================================================
  // EVENT HANDLERS - MOUSE
  // ============================================================================

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (readOnly) return;
    
    // Clear selection on canvas click
    if (event.target === canvasRef.current) {
      clearSelection();
    }
  }, [readOnly, clearSelection]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (readOnly) return;
    
    // Get canvas coordinates
    const canvasPos = getCanvasCoordinates(event.clientX, event.clientY);
    if (!canvasPos) return;
    
    // Update drag state
    if (state.dragState.isDragging) {
      updateDrag(canvasPos);
    }
    
    // Update connection state
    if (state.connectionState.isConnecting) {
      updateConnection(canvasPos);
    }
  }, [
    readOnly,
    getCanvasCoordinates,
    state.dragState.isDragging,
    state.connectionState.isConnecting,
    updateDrag,
    updateConnection
  ]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (readOnly) return;
    
    // End drag
    if (state.dragState.isDragging) {
      endDrag();
    }
    
    // Handle connection completion
    if (state.connectionState.isConnecting) {
      // Check if we're dropping on a node's input port
      const target = event.target as SVGElement;
      const nodeElement = target.closest('[data-node-id]');
      
      if (nodeElement) {
        const targetNodeId = nodeElement.getAttribute('data-node-id');
        const isInputPort = target.getAttribute('data-port-type') === 'input';
        
        if (targetNodeId && isInputPort) {
          // Complete the connection
          endConnection(targetNodeId, 'input');
        } else {
          // Cancel connection if not dropped on input port
          cancelConnection();
        }
      } else {
        // Cancel connection if dropped on canvas
        cancelConnection();
      }
    }
  }, [
    readOnly,
    state.dragState.isDragging,
    state.connectionState.isConnecting,
    endDrag,
    endConnection,
    cancelConnection
  ]);

  // ============================================================================
  // EVENT HANDLERS - KEYBOARD
  // ============================================================================

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (readOnly) return;
    
    // Delete selected items
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      state.selectedNodes.forEach(nodeId => deleteNode(nodeId));
      state.selectedConnections.forEach(connId => deleteConnection(connId));
    }
    
    // Undo/Redo
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (event.key === 'z' && event.shiftKey || event.key === 'y') {
        event.preventDefault();
        redo();
      }
    }
    
    // Tool selection
    if (event.key === 'v') setTool('select');
    if (event.key === 'c') setTool('connect');
    if (event.key === 'h') setTool('pan');
  }, [
    readOnly,
    state.selectedNodes,
    state.selectedConnections,
    deleteNode,
    deleteConnection,
    undo,
    redo,
    setTool
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div 
      className={cn(
        "relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900",
        "border border-gray-200 dark:border-gray-700 rounded-lg",
        className
      )}
    >
      <svg
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          cursor: state.tool === 'pan' ? 'grab' : 
                 state.tool === 'connect' ? 'crosshair' : 'default'
        }}
      >
        {/* Grid Background */}
        <WorkflowGrid 
          viewport={{ x: 0, y: 0, zoom: 1 }}
          gridSize={state.workflow?.layout.gridSize || 20}
          show={state.workflow?.layout.showGrid !== false}
        />

        {/* Main Content Group - No zoom/pan transformation */}
        <g>
          
          {/* Connections (render behind nodes) */}
          {state.workflow?.connections.map(connection => {
            const sourceNode = state.workflow.nodes.find(n => n.id === connection.sourceNodeId);
            const targetNode = state.workflow.nodes.find(n => n.id === connection.targetNodeId);
            
            if (!sourceNode || !targetNode) return null;
            
            return (
              <WorkflowConnectionRenderer
                key={connection.id}
                connection={connection}
                sourceNode={sourceNode}
                targetNode={targetNode}
                selected={state.selectedConnections.includes(connection.id)}
                onSelect={(id) => selectConnections([id])}
                onDelete={deleteConnection}
                readOnly={readOnly}
              />
            );
          })}

          {/* Temporary Connection Line */}
          {state.connectionState.isConnecting && state.connectionState.tempConnection && (
            <line
              x1={state.connectionState.tempConnection.start.x}
              y1={state.connectionState.tempConnection.start.y}
              x2={state.connectionState.tempConnection.end.x}
              y2={state.connectionState.tempConnection.end.y}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity={0.7}
            />
          )}

          {/* Nodes (render on top) */}
          {state.workflow?.nodes.map(node => (
            <WorkflowNodeRenderer
              key={node.id}
              node={node}
              selected={state.selectedNodes.includes(node.id)}
              onUpdate={updateNode}
              onSelect={(nodeId) => selectNodes([nodeId])}
              onStartConnection={startConnection}
              onStartDrag={startDrag}
              readOnly={readOnly}
            />
          ))}

        </g>
      </svg>

      {/* Canvas Info Overlay */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-3 py-2 rounded shadow text-xs text-gray-600 dark:text-gray-400">
        <div>Processes: {state.workflow?.nodes.length || 0}</div>
        <div>Connections: {state.workflow?.connections.length || 0}</div>
      </div>

    </div>
  );
}

