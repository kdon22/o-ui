/**
 * Workflow Builder Canvas - Updated for JSON Steps Integration
 * 
 * Visual workflow designer that reads/writes to the Workflow.steps JSON field
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { WorkflowNodeRenderer } from './workflow-node-renderer';
import { useWorkflowDefinition } from '../../hooks/useWorkflowDefinition';
import { useBranchContext } from '@/lib/session';
import type { WorkflowNode, CanvasNode } from '@/types/workflow-definition';

interface WorkflowBuilderCanvasProps {
  workflowId?: string;
  tenantId: string;
  readOnly?: boolean;
  onSave?: () => void;
}

export function WorkflowBuilderCanvas({
  workflowId,
  tenantId,
  readOnly = false,
  onSave
}: WorkflowBuilderCanvasProps) {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasViewport, setCanvasViewport] = useState({ x: 0, y: 0, zoom: 1 });
  
  // Get current branch
  const { currentBranchId } = useBranchContext();
  
  // Load workflow definition and canvas state
  const {
    workflowDefinition,
    canvasNodes,
    connections,
    selectedNodeId,
    isLoading,
    error,
    isSaving,
    updateNodePosition,
    addNode,
    removeNode,
    addConnection,
    removeConnection,
    setSelectedNodeId,
    saveCurrentState
  } = useWorkflowDefinition({
    workflowId,
    tenantId,
    branchId: currentBranchId
  });

  // ============================================================================
  // CANVAS INTERACTION HANDLERS
  // ============================================================================

  const handleCanvasClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    // Clear selection when clicking on canvas
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, [setSelectedNodeId]);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    if (readOnly) return;
    
    // Update node position if changed
    if (updates.position) {
      updateNodePosition(nodeId, updates.position);
    }
    
    // TODO: Handle other node updates (config, outputs, etc.)
  }, [readOnly, updateNodePosition]);

  const handleStartDrag = useCallback((nodeId: string, offset: { x: number; y: number }) => {
    if (readOnly) return;
    
    setIsDragging(true);
    setDragOffset(offset);
    setSelectedNodeId(nodeId);
  }, [readOnly, setSelectedNodeId]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !selectedNodeId || readOnly) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const newPosition = {
      x: event.clientX - rect.left - dragOffset.x,
      y: event.clientY - rect.top - dragOffset.y
    };
    
    updateNodePosition(selectedNodeId, newPosition);
  }, [isDragging, selectedNodeId, readOnly, dragOffset, updateNodePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleStartConnection = useCallback((sourceNodeId: string, outputType: string) => {
    if (readOnly) return;
    
    // TODO: Implement connection creation UI
    console.log('Starting connection from', sourceNodeId, outputType);
  }, [readOnly]);

  // ============================================================================
  // TOOLBAR ACTIONS
  // ============================================================================

  const handleAddNode = useCallback((nodeType: 'process' | 'gateway' | 'timer') => {
    if (readOnly) return;
    
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      name: `New ${nodeType}`,
      position: { 
        x: 300 + Math.random() * 200, 
        y: 200 + Math.random() * 200 
      },
      config: nodeType === 'process' ? {
        timeout_seconds: 300,
        retry_count: 2
      } : {},
      outputs: {
        success: [],
        error: []
      }
    };
    
    addNode(newNode);
  }, [readOnly, addNode]);

  const handleDeleteNode = useCallback(() => {
    if (readOnly || !selectedNodeId) return;
    
    // Prevent deleting start/end nodes
    const selectedNode = canvasNodes.find(n => n.id === selectedNodeId);
    if (selectedNode?.type === 'start' || selectedNode?.type === 'end') {
      return;
    }
    
    removeNode(selectedNodeId);
    setSelectedNodeId(null);
  }, [readOnly, selectedNodeId, canvasNodes, removeNode, setSelectedNodeId]);

  const handleSaveWorkflow = useCallback(async () => {
    if (!workflowDefinition) return;
    
    try {
      await saveCurrentState(
        workflowDefinition.workflow.name,
        workflowDefinition.workflow.description
      );
      onSave?.();
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  }, [workflowDefinition, saveCurrentState, onSave]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading workflow...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Failed to load workflow</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 p-4 border-b">
          <button
            onClick={() => handleAddNode('process')}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Add Process
          </button>
          <button
            onClick={() => handleAddNode('gateway')}
            className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
          >
            Add Gateway
          </button>
          <button
            onClick={handleDeleteNode}
            disabled={!selectedNodeId}
            className="px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
          >
            Delete
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSaveWorkflow}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={canvasRef}
          className="w-full h-full cursor-default"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid background */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connections */}
          {connections.map(connection => (
            <g key={connection.id}>
              <path
                d={buildConnectionPath(
                  canvasNodes.find(n => n.id === connection.source)?.position || { x: 0, y: 0 },
                  canvasNodes.find(n => n.id === connection.target)?.position || { x: 0, y: 0 }
                )}
                fill="none"
                stroke={connection.style.stroke}
                strokeWidth={connection.style.strokeWidth}
                strokeDasharray={connection.style.strokeDasharray}
                markerEnd="url(#arrowhead)"
              />
            </g>
          ))}

          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="hsl(var(--foreground))"
              />
            </marker>
          </defs>

          {/* Nodes */}
          {canvasNodes.map(node => (
            <g
              key={node.id}
              transform={`translate(${node.position.x}, ${node.position.y})`}
            >
              <WorkflowNodeRenderer
                node={node}
                selected={selectedNodeId === node.id}
                onUpdate={handleNodeUpdate}
                onSelect={handleNodeSelect}
                onStartConnection={handleStartConnection}
                onStartDrag={handleStartDrag}
                readOnly={readOnly}
              />
            </g>
          ))}
        </svg>

        {/* Node Properties Panel */}
        {selectedNodeId && !readOnly && (
          <div className="absolute top-4 right-4 w-80 bg-card border rounded-lg shadow-lg">
            <NodePropertiesPanel
              node={canvasNodes.find(n => n.id === selectedNodeId)}
              onUpdate={(updates) => handleNodeUpdate(selectedNodeId, updates)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS & FUNCTIONS
// ============================================================================

interface NodePropertiesPanelProps {
  node?: CanvasNode;
  onUpdate: (updates: Partial<WorkflowNode>) => void;
}

function NodePropertiesPanel({ node, onUpdate }: NodePropertiesPanelProps) {
  if (!node) return null;

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Node Properties</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Type</label>
          <div className="mt-1 text-sm text-muted-foreground">{node.type}</div>
        </div>
        
        {node.type === 'process' && (
          <div>
            <label className="text-sm font-medium">Timeout (seconds)</label>
            <input
              type="number"
              value={node.config.timeout_seconds || 300}
              onChange={(e) => onUpdate({
                config: { ...node.config, timeout_seconds: parseInt(e.target.value) }
              })}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
        )}
        
        <div>
          <label className="text-sm font-medium">Position</label>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              value={Math.round(node.position.x)}
              onChange={(e) => onUpdate({
                position: { ...node.position, x: parseInt(e.target.value) }
              })}
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="X"
            />
            <input
              type="number"
              value={Math.round(node.position.y)}
              onChange={(e) => onUpdate({
                position: { ...node.position, y: parseInt(e.target.value) }
              })}
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="Y"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function buildConnectionPath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Smooth curved path
  const cp1x = start.x + dx * 0.5;
  const cp1y = start.y;
  const cp2x = end.x - dx * 0.5;
  const cp2y = end.y;
  
  return `M ${start.x + 60},${start.y + 30} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x - 10},${end.y + 30}`;
}
