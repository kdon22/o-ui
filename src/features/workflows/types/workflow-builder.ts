/**
 * Workflow Builder Types - Visual Workflow Construction
 * 
 * Types for the visual workflow builder component system.
 * Separates visual representation from database schema.
 */

import type { Workflow } from '../workflows.schema';

// ============================================================================
// CORE VISUAL TYPES
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// ============================================================================
// NODE TYPES
// ============================================================================

export type WorkflowNodeType = 'start' | 'end' | 'process' | 'decision' | 'parallel' | 'merge' | 'parallel-gateway' | 'exclusive-gateway';

export interface BaseWorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: Position;
  size: Size;
  label: string;
  selected?: boolean;
  dragging?: boolean;
}

export interface StartNode extends BaseWorkflowNode {
  type: 'start';
  trigger?: {
    type: 'manual' | 'scheduled' | 'event';
    config?: Record<string, any>;
  };
}

export interface EndNode extends BaseWorkflowNode {
  type: 'end';
  action?: {
    type: 'success' | 'failure' | 'custom';
    message?: string;
  };
}

export interface ProcessNode extends BaseWorkflowNode {
  type: 'process';
  processId?: string;
  processName?: string;
  processType?: string; // UTR, SCHEDULED, TICKETING, etc.
  rules?: string[]; // Rule IDs
  timeout?: number;
  retryCount?: number;
}

export interface DecisionNode extends BaseWorkflowNode {
  type: 'decision';
  condition: {
    type: 'rule' | 'expression' | 'custom';
    value: string;
    ruleId?: string;
  };
  branches: {
    true: string; // Next node ID
    false: string; // Next node ID
  };
}

export interface ParallelNode extends BaseWorkflowNode {
  type: 'parallel';
  branches: string[]; // Next node IDs for parallel execution
}

export interface MergeNode extends BaseWorkflowNode {
  type: 'merge';
  waitForAll: boolean; // Wait for all parallel branches or just first
}

export interface ParallelGatewayNode extends BaseWorkflowNode {
  type: 'parallel-gateway';
  executionMode: 'all' | 'first' | 'any'; // How to handle parallel branch execution
  maxConcurrent?: number; // Optional limit on concurrent branches
}

export interface ExclusiveGatewayNode extends BaseWorkflowNode {
  type: 'exclusive-gateway';
  condition?: {
    type: 'rule' | 'expression' | 'custom';
    value: string;
    ruleId?: string;
  };
  defaultBranch?: string; // Default output if no conditions match
}

export type WorkflowNode = StartNode | EndNode | ProcessNode | DecisionNode | ParallelNode | MergeNode | ParallelGatewayNode | ExclusiveGatewayNode;

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePort?: string; // For nodes with multiple outputs
  targetPort?: string; // For nodes with multiple inputs
  label?: string;
  condition?: string; // For conditional connections
  selected?: boolean;
}

// ============================================================================
// VISUAL WORKFLOW
// ============================================================================

export interface VisualWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  viewport: Viewport;
  layout: {
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

// ============================================================================
// BUILDER STATE
// ============================================================================

export interface WorkflowBuilderState {
  workflow: VisualWorkflow;
  selectedNodes: string[];
  selectedConnections: string[];
  dragState: {
    isDragging: boolean;
    draggedNodeId?: string;
    startPosition?: Position;
    offset?: Position;
  };
  connectionState: {
    isConnecting: boolean;
    sourceNodeId?: string;
    sourcePort?: string;
    tempConnection?: {
      start: Position;
      end: Position;
    };
  };
  viewport: Viewport;
  tool: 'select' | 'connect' | 'pan';
  history: {
    past: VisualWorkflow[];
    future: VisualWorkflow[];
  };
}

// ============================================================================
// BUILDER ACTIONS
// ============================================================================

export type WorkflowBuilderAction =
  | { type: 'SET_WORKFLOW'; payload: VisualWorkflow }
  | { type: 'ADD_NODE'; payload: { node: WorkflowNode } }
  | { type: 'UPDATE_NODE'; payload: { nodeId: string; updates: Partial<WorkflowNode> } }
  | { type: 'DELETE_NODE'; payload: { nodeId: string } }
  | { type: 'MOVE_NODE'; payload: { nodeId: string; position: Position } }
  | { type: 'ADD_CONNECTION'; payload: { connection: WorkflowConnection } }
  | { type: 'DELETE_CONNECTION'; payload: { connectionId: string } }
  | { type: 'SELECT_NODES'; payload: { nodeIds: string[] } }
  | { type: 'SELECT_CONNECTIONS'; payload: { connectionIds: string[] } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'START_DRAG'; payload: { nodeId: string; startPosition: Position; offset: Position } }
  | { type: 'UPDATE_DRAG'; payload: { position: Position } }
  | { type: 'END_DRAG' }
  | { type: 'START_CONNECTION'; payload: { nodeId: string; port?: string } }
  | { type: 'UPDATE_CONNECTION'; payload: { position: Position } }
  | { type: 'END_CONNECTION'; payload: { targetNodeId: string; targetPort?: string } }
  | { type: 'CANCEL_CONNECTION' }
  | { type: 'SET_VIEWPORT'; payload: Viewport }
  | { type: 'SET_TOOL'; payload: 'select' | 'connect' | 'pan' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface WorkflowCanvasProps {
  workflow: VisualWorkflow;
  onWorkflowChange: (workflow: VisualWorkflow) => void;
  readOnly?: boolean;
  className?: string;
}

export interface WorkflowNodeProps {
  node: WorkflowNode;
  selected: boolean;
  onUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  onSelect: (nodeId: string) => void;
  onStartConnection: (nodeId: string, port?: string) => void;
  onStartDrag?: (nodeId: string, startPosition: Position, offset: Position) => void;
  readOnly?: boolean;
}

export interface WorkflowConnectionProps {
  connection: WorkflowConnection;
  sourceNode: WorkflowNode;
  targetNode: WorkflowNode;
  selected: boolean;
  onSelect: (connectionId: string) => void;
  onDelete: (connectionId: string) => void;
  readOnly?: boolean;
}

