/**
 * Workflow Definition Hook
 * 
 * Handles loading, saving, and managing workflow definitions with the JSON steps field
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  WorkflowDefinition, 
  CanvasNode, 
  CanvasConnection,
  WorkflowNode,
  NodeOutputs 
} from '@/types/workflow-definition';

interface UseWorkflowDefinitionProps {
  workflowId?: string;
  tenantId: string;
  branchId: string;
}

export function useWorkflowDefinition({
  workflowId,
  tenantId,
  branchId
}: UseWorkflowDefinitionProps) {
  const queryClient = useQueryClient();
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<CanvasConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // ============================================================================
  // QUERY: Load workflow definition
  // ============================================================================
  
  const { data: workflowData, isLoading, error } = useQuery({
    queryKey: ['workflow', workflowId, tenantId, branchId],
    queryFn: async () => {
      if (!workflowId) return null;
      
      const response = await fetch(`/api/workflows/${workflowId}?tenantId=${tenantId}&branchId=${branchId}`);
      if (!response.ok) throw new Error('Failed to load workflow');
      
      return response.json();
    },
    enabled: !!workflowId
  });

  // ============================================================================
  // WORKFLOW DEFINITION PARSING
  // ============================================================================
  
  const workflowDefinition: WorkflowDefinition | null = useMemo(() => {
    if (!workflowData?.steps) return null;
    return workflowData.steps as WorkflowDefinition;
  }, [workflowData]);

  // Convert workflow definition to canvas format
  const loadCanvasFromDefinition = useCallback((definition: WorkflowDefinition) => {
    // Convert nodes
    const canvasNodes: CanvasNode[] = definition.nodes.map(node => ({
      ...node,
      selected: false,
      dragging: false
    }));

    // Build connections from node outputs
    const connections: CanvasConnection[] = [];
    definition.nodes.forEach(node => {
      Object.entries(node.outputs).forEach(([outputType, targetNodes]) => {
        if (Array.isArray(targetNodes)) {
          targetNodes.forEach(targetId => {
            connections.push({
              id: `${node.id}-${outputType}-${targetId}`,
              source: node.id,
              target: targetId,
              sourceOutput: outputType as keyof NodeOutputs,
              style: getConnectionStyle(outputType)
            });
          });
        }
      });
    });

    setCanvasNodes(canvasNodes);
    setConnections(connections);
  }, []);

  // Load canvas when definition changes
  useMemo(() => {
    if (workflowDefinition) {
      loadCanvasFromDefinition(workflowDefinition);
    }
  }, [workflowDefinition, loadCanvasFromDefinition]);

  // ============================================================================
  // MUTATIONS: Save workflow definition
  // ============================================================================
  
  const saveWorkflowMutation = useMutation({
    mutationFn: async (definition: WorkflowDefinition) => {
      const url = workflowId 
        ? `/api/workflows/${workflowId}`
        : '/api/workflows';
      
      const method = workflowId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: definition.workflow.name,
          description: definition.workflow.description,
          steps: definition,
          executionSettings: definition.execution_settings,
          tenantId,
          branchId
        })
      });
      
      if (!response.ok) throw new Error('Failed to save workflow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    }
  });

  // ============================================================================
  // CANVAS OPERATIONS
  // ============================================================================
  
  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setCanvasNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, position }
        : node
    ));
  }, []);

  const addNode = useCallback((node: WorkflowNode) => {
    const canvasNode: CanvasNode = {
      ...node,
      selected: false,
      dragging: false
    };
    setCanvasNodes(prev => [...prev, canvasNode]);
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setCanvasNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.source !== nodeId && conn.target !== nodeId
    ));
  }, []);

  const addConnection = useCallback((connection: Omit<CanvasConnection, 'id' | 'style'>) => {
    const newConnection: CanvasConnection = {
      ...connection,
      id: `${connection.source}-${connection.sourceOutput}-${connection.target}`,
      style: getConnectionStyle(connection.sourceOutput)
    };
    setConnections(prev => [...prev, newConnection]);
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  // ============================================================================
  // SAVE CURRENT CANVAS STATE
  // ============================================================================
  
  const saveCurrentState = useCallback(async (workflowName: string, description?: string) => {
    // Convert canvas state back to workflow definition
    const definition: WorkflowDefinition = {
      workflow: {
        id: workflowId || `workflow_${Date.now()}`,
        name: workflowName,
        version: '1.0.0',
        description
      },
      nodes: canvasNodes.map(node => {
        // Build outputs from connections
        const nodeConnections = connections.filter(conn => conn.source === node.id);
        const outputs: NodeOutputs = {};
        
        nodeConnections.forEach(conn => {
          const outputType = conn.sourceOutput;
          if (!outputs[outputType]) outputs[outputType] = [];
          outputs[outputType]!.push(conn.target);
        });

        return {
          id: node.id,
          type: node.type,
          name: node.name,
          position: node.position,
          config: node.config,
          inputs: node.inputs,
          outputs
        };
      }),
      execution_settings: {
        parallel_execution: true,
        max_concurrent_nodes: 3,
        global_timeout_seconds: 1800,
        error_strategy: 'stop_on_critical_failure',
        retry_strategy: 'node_level',
        data_persistence: 'all_states'
      },
      parallel_groups: detectParallelGroups(canvasNodes, connections),
      runtime_config: {
        engine_version: '2.0',
        execution_mode: 'async',
        state_tracking: {
          save_intermediate_results: true,
          checkpoint_frequency: 'per_node',
          recovery_enabled: true
        },
        monitoring: {
          metrics_enabled: true,
          log_level: 'INFO',
          capture_timing: true,
          health_checks: true
        },
        queue_integration: {
          status_updates: true
        }
      }
    };

    await saveWorkflowMutation.mutateAsync(definition);
  }, [canvasNodes, connections, workflowId, saveWorkflowMutation]);

  return {
    // Data
    workflowDefinition,
    canvasNodes,
    connections,
    selectedNodeId,
    
    // Loading states
    isLoading,
    error,
    isSaving: saveWorkflowMutation.isPending,
    
    // Canvas operations
    updateNodePosition,
    addNode,
    removeNode,
    addConnection,
    removeConnection,
    setSelectedNodeId,
    
    // Persistence
    saveCurrentState,
    loadCanvasFromDefinition
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getConnectionStyle(outputType: string) {
  switch (outputType) {
    case 'success':
      return { stroke: '#10b981', strokeWidth: 2 };
    case 'error':
      return { stroke: '#ef4444', strokeWidth: 2 };
    case 'timeout':
      return { stroke: '#f59e0b', strokeWidth: 2 };
    case 'condition_true':
      return { stroke: '#3b82f6', strokeWidth: 2 };
    case 'condition_false':
      return { stroke: '#8b5cf6', strokeWidth: 2 };
    default:
      return { stroke: '#6b7280', strokeWidth: 2 };
  }
}

function detectParallelGroups(nodes: CanvasNode[], connections: CanvasConnection[]) {
  // Find nodes that can run in parallel (same input, different execution paths)
  const parallelGroups: Record<string, any> = {};
  
  // Simple parallel detection: nodes with same input source
  const nodesByInput = new Map<string, string[]>();
  
  connections.forEach(conn => {
    const targetNodes = nodesByInput.get(conn.source) || [];
    if (!targetNodes.includes(conn.target)) {
      targetNodes.push(conn.target);
      nodesByInput.set(conn.source, targetNodes);
    }
  });
  
  nodesByInput.forEach((targets, source) => {
    if (targets.length > 1) {
      parallelGroups[`parallel_from_${source}`] = {
        nodes: targets,
        execution: 'concurrent',
        failure_policy: 'continue_others'
      };
    }
  });
  
  return parallelGroups;
}
