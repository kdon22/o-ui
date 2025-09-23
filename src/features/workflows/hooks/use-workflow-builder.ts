/**
 * useWorkflowBuilder - Visual Workflow Builder State Management
 * 
 * Custom hook that manages the state for the visual workflow builder.
 * Handles nodes, connections, viewport, selection, and history.
 */

'use client';

import { useReducer, useCallback, useMemo } from 'react';
import { nanoid } from 'nanoid';
import type { 
  WorkflowBuilderState,
  WorkflowBuilderAction,
  VisualWorkflow,
  WorkflowNode,
  WorkflowConnection,
  Position,
  Viewport
} from '../types/workflow-builder';

// ============================================================================
// INITIAL STATE
// ============================================================================

const createInitialState = (): WorkflowBuilderState => ({
  workflow: {
    id: nanoid(),
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
  },
  selectedNodes: [],
  selectedConnections: [],
  dragState: {
    isDragging: false
  },
  connectionState: {
    isConnecting: false
  },
  viewport: { x: 0, y: 0, zoom: 1 },
  tool: 'select',
  history: {
    past: [],
    future: []
  }
});

// ============================================================================
// REDUCER
// ============================================================================

const workflowBuilderReducer = (
  state: WorkflowBuilderState,
  action: WorkflowBuilderAction
): WorkflowBuilderState => {
  const addToHistory = (newWorkflow: VisualWorkflow): WorkflowBuilderState => ({
    ...state,
    workflow: newWorkflow,
    history: {
      past: [...state.history.past, state.workflow],
      future: []
    }
  });

  switch (action.type) {
    case 'SET_WORKFLOW':
      return {
        ...state,
        workflow: action.payload,
        viewport: action.payload.viewport,
        history: { past: [], future: [] }
      };

    case 'ADD_NODE': {
      const newWorkflow = {
        ...state.workflow,
        nodes: [...state.workflow.nodes, action.payload.node],
        metadata: {
          ...state.workflow.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      return addToHistory(newWorkflow);
    }

    case 'UPDATE_NODE': {
      const newWorkflow = {
        ...state.workflow,
        nodes: state.workflow.nodes.map(node =>
          node.id === action.payload.nodeId
            ? { ...node, ...action.payload.updates }
            : node
        ),
        metadata: {
          ...state.workflow.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      return addToHistory(newWorkflow);
    }

    case 'DELETE_NODE': {
      const nodeId = action.payload.nodeId;
      const newWorkflow = {
        ...state.workflow,
        nodes: state.workflow.nodes.filter(node => node.id !== nodeId),
        connections: state.workflow.connections.filter(
          conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
        ),
        metadata: {
          ...state.workflow.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      return {
        ...addToHistory(newWorkflow),
        selectedNodes: state.selectedNodes.filter(id => id !== nodeId)
      };
    }

    case 'MOVE_NODE': {
      const { nodeId, position } = action.payload;
      let finalPosition = position;

      // Snap to grid if enabled
      if (state.workflow.layout.snapToGrid) {
        const gridSize = state.workflow.layout.gridSize;
        finalPosition = {
          x: Math.round(position.x / gridSize) * gridSize,
          y: Math.round(position.y / gridSize) * gridSize
        };
      }

      const newWorkflow = {
        ...state.workflow,
        nodes: state.workflow.nodes.map(node =>
          node.id === nodeId
            ? { ...node, position: finalPosition }
            : node
        ),
        metadata: {
          ...state.workflow.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      return { ...state, workflow: newWorkflow };
    }

    case 'ADD_CONNECTION': {
      const newWorkflow = {
        ...state.workflow,
        connections: [...state.workflow.connections, action.payload.connection],
        metadata: {
          ...state.workflow.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      return addToHistory(newWorkflow);
    }

    case 'DELETE_CONNECTION': {
      const newWorkflow = {
        ...state.workflow,
        connections: state.workflow.connections.filter(
          conn => conn.id !== action.payload.connectionId
        ),
        metadata: {
          ...state.workflow.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      return {
        ...addToHistory(newWorkflow),
        selectedConnections: state.selectedConnections.filter(
          id => id !== action.payload.connectionId
        )
      };
    }

    case 'SELECT_NODES':
      return {
        ...state,
        selectedNodes: action.payload.nodeIds,
        selectedConnections: []
      };

    case 'SELECT_CONNECTIONS':
      return {
        ...state,
        selectedNodes: [],
        selectedConnections: action.payload.connectionIds
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedNodes: [],
        selectedConnections: []
      };

    case 'START_DRAG':
      return {
        ...state,
        dragState: {
          isDragging: true,
          draggedNodeId: action.payload.nodeId,
          startPosition: action.payload.startPosition,
          offset: action.payload.offset
        }
      };

    case 'UPDATE_DRAG': {
      if (!state.dragState.isDragging || !state.dragState.draggedNodeId) {
        return state;
      }

      const newPosition = {
        x: action.payload.position.x - (state.dragState.offset?.x || 0),
        y: action.payload.position.y - (state.dragState.offset?.y || 0)
      };

      return workflowBuilderReducer(state, {
        type: 'MOVE_NODE',
        payload: {
          nodeId: state.dragState.draggedNodeId,
          position: newPosition
        }
      });
    }

    case 'END_DRAG':
      return {
        ...state,
        dragState: {
          isDragging: false
        }
      };

    case 'START_CONNECTION':
      return {
        ...state,
        connectionState: {
          isConnecting: true,
          sourceNodeId: action.payload.nodeId,
          sourcePort: action.payload.port
        }
      };

    case 'UPDATE_CONNECTION': {
      const sourceNode = state.workflow.nodes.find(
        n => n.id === state.connectionState.sourceNodeId
      );
      
      if (!sourceNode || !state.connectionState.isConnecting) {
        return state;
      }

      return {
        ...state,
        connectionState: {
          ...state.connectionState,
          tempConnection: {
            start: {
              x: sourceNode.position.x + sourceNode.size.width / 2,
              y: sourceNode.position.y + sourceNode.size.height / 2
            },
            end: action.payload.position
          }
        }
      };
    }

    case 'END_CONNECTION': {
      if (!state.connectionState.isConnecting || !state.connectionState.sourceNodeId) {
        return state;
      }

      const newConnection: WorkflowConnection = {
        id: nanoid(),
        sourceNodeId: state.connectionState.sourceNodeId,
        targetNodeId: action.payload.targetNodeId,
        sourcePort: state.connectionState.sourcePort,
        targetPort: action.payload.targetPort
      };

      const newState = workflowBuilderReducer(state, {
        type: 'ADD_CONNECTION',
        payload: { connection: newConnection }
      });

      return {
        ...newState,
        connectionState: {
          isConnecting: false
        }
      };
    }

    case 'CANCEL_CONNECTION':
      return {
        ...state,
        connectionState: {
          isConnecting: false
        }
      };

    case 'SET_VIEWPORT':
      return {
        ...state,
        viewport: action.payload,
        workflow: {
          ...state.workflow,
          viewport: action.payload
        }
      };

    case 'SET_TOOL':
      return {
        ...state,
        tool: action.payload
      };

    case 'UNDO': {
      if (state.history.past.length === 0) return state;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, state.history.past.length - 1);

      return {
        ...state,
        workflow: previous,
        history: {
          past: newPast,
          future: [state.workflow, ...state.history.future]
        }
      };
    }

    case 'REDO': {
      if (state.history.future.length === 0) return state;

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      return {
        ...state,
        workflow: next,
        history: {
          past: [...state.history.past, state.workflow],
          future: newFuture
        }
      };
    }

    default:
      return state;
  }
};

// ============================================================================
// HOOK
// ============================================================================

export const useWorkflowBuilder = () => {
  const [state, dispatch] = useReducer(workflowBuilderReducer, createInitialState());

  // Action creators
  const actions = useMemo(() => ({
    setWorkflow: (workflow: VisualWorkflow) => 
      dispatch({ type: 'SET_WORKFLOW', payload: workflow }),

    addNode: (node: WorkflowNode) => 
      dispatch({ type: 'ADD_NODE', payload: { node } }),

    updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => 
      dispatch({ type: 'UPDATE_NODE', payload: { nodeId, updates } }),

    deleteNode: (nodeId: string) => 
      dispatch({ type: 'DELETE_NODE', payload: { nodeId } }),

    moveNode: (nodeId: string, position: Position) => 
      dispatch({ type: 'MOVE_NODE', payload: { nodeId, position } }),

    addConnection: (connection: WorkflowConnection) => 
      dispatch({ type: 'ADD_CONNECTION', payload: { connection } }),

    deleteConnection: (connectionId: string) => 
      dispatch({ type: 'DELETE_CONNECTION', payload: { connectionId } }),

    selectNodes: (nodeIds: string[]) => 
      dispatch({ type: 'SELECT_NODES', payload: { nodeIds } }),

    selectConnections: (connectionIds: string[]) => 
      dispatch({ type: 'SELECT_CONNECTIONS', payload: { connectionIds } }),

    clearSelection: () => 
      dispatch({ type: 'CLEAR_SELECTION' }),

    startDrag: (nodeId: string, startPosition: Position, offset: Position) => 
      dispatch({ type: 'START_DRAG', payload: { nodeId, startPosition, offset } }),

    updateDrag: (position: Position) => 
      dispatch({ type: 'UPDATE_DRAG', payload: { position } }),

    endDrag: () => 
      dispatch({ type: 'END_DRAG' }),

    startConnection: (nodeId: string, port?: string) => 
      dispatch({ type: 'START_CONNECTION', payload: { nodeId, port } }),

    updateConnection: (position: Position) => 
      dispatch({ type: 'UPDATE_CONNECTION', payload: { position } }),

    endConnection: (targetNodeId: string, targetPort?: string) => 
      dispatch({ type: 'END_CONNECTION', payload: { targetNodeId, targetPort } }),

    cancelConnection: () => 
      dispatch({ type: 'CANCEL_CONNECTION' }),

    setViewport: (viewport: Viewport) => 
      dispatch({ type: 'SET_VIEWPORT', payload: viewport }),

    setTool: (tool: 'select' | 'connect' | 'pan') => 
      dispatch({ type: 'SET_TOOL', payload: tool }),

    undo: () => 
      dispatch({ type: 'UNDO' }),

    redo: () => 
      dispatch({ type: 'REDO' }),
  }), [dispatch]);

  return {
    state,
    actions
  };
};

