/**
 * Smart Gateway Creator - Intelligent Gateway Suggestions
 * 
 * Automatically detects when gateway nodes would be beneficial and
 * provides smart creation and connection logic for parallel execution.
 */

import { nanoid } from 'nanoid/non-secure';
import type { 
  WorkflowNode, 
  WorkflowConnection, 
  VisualWorkflow,
  ParallelGatewayNode,
  Position
} from '../../types/workflow-builder';

export class SmartGatewayCreator {

  /**
   * Check if a gateway should be suggested based on connection patterns
   */
  static shouldSuggestGateway(
    workflow: VisualWorkflow,
    sourceNodeId: string,
    sourcePort?: string
  ): { suggest: boolean; reason: string; type: 'parallel-gateway' | 'exclusive-gateway' } {
    
    // Find existing connections from this source
    const existingConnections = workflow.connections.filter(
      conn => conn.sourceNodeId === sourceNodeId && 
               (sourcePort ? conn.sourcePort === sourcePort : !conn.sourcePort)
    );

    // If there's already one connection and user is trying to add another
    if (existingConnections.length >= 1) {
      const sourceNode = workflow.nodes.find(n => n.id === sourceNodeId);
      
      if (sourceNode?.type === 'process') {
        return {
          suggest: true,
          reason: 'Multiple processes need to run after this step',
          type: 'parallel-gateway'
        };
      }
      
      if (sourceNode?.type === 'decision') {
        return {
          suggest: true,
          reason: 'Complex decision logic requires gateway',
          type: 'exclusive-gateway'
        };
      }
    }

    return { suggest: false, reason: '', type: 'parallel-gateway' };
  }

  /**
   * Create a gateway node with optimal positioning
   */
  static createGatewayNode(
    type: 'parallel-gateway' | 'exclusive-gateway',
    sourceNode: WorkflowNode,
    targetNodes: WorkflowNode[]
  ): ParallelGatewayNode {
    
    // Calculate optimal position between source and targets
    const targetCenterX = targetNodes.reduce((sum, node) => sum + node.position.x, 0) / targetNodes.length;
    const targetCenterY = targetNodes.reduce((sum, node) => sum + node.position.y, 0) / targetNodes.length;
    
    const gatewayPosition: Position = {
      x: sourceNode.position.x + (targetCenterX - sourceNode.position.x) * 0.5,
      y: sourceNode.position.y + (targetCenterY - sourceNode.position.y) * 0.5
    };

    // Ensure minimum spacing
    gatewayPosition.x = Math.max(sourceNode.position.x + 200, gatewayPosition.x);

    const gatewayNode: ParallelGatewayNode = {
      id: nanoid(),
      type,
      position: gatewayPosition,
      size: { width: 60, height: 60 },
      label: type === 'parallel-gateway' ? 'Parallel' : 'Decision',
      executionMode: 'all',
      maxConcurrent: targetNodes.length
    };

    return gatewayNode;
  }

  /**
   * Create connections from source through gateway to targets
   */
  static createGatewayConnections(
    sourceNodeId: string,
    gatewayNodeId: string,
    targetNodeIds: string[],
    sourcePort?: string
  ): WorkflowConnection[] {
    
    const connections: WorkflowConnection[] = [];

    // Connection from source to gateway
    connections.push({
      id: nanoid(),
      sourceNodeId,
      targetNodeId: gatewayNodeId,
      sourcePort,
      targetPort: 'input',
      label: 'to gateway'
    });

    // Connections from gateway to each target
    targetNodeIds.forEach((targetId, index) => {
      connections.push({
        id: nanoid(),
        sourceNodeId: gatewayNodeId,
        targetNodeId: targetId,
        sourcePort: `out-${index}`,
        label: `branch ${index + 1}`
      });
    });

    return connections;
  }

  /**
   * Auto-convert existing connections to use gateway
   */
  static convertToGateway(
    workflow: VisualWorkflow,
    sourceNodeId: string,
    newTargetNodeId: string,
    sourcePort?: string
  ): { 
    workflow: VisualWorkflow;
    gatewayNode: ParallelGatewayNode;
    newConnections: WorkflowConnection[];
  } {

    // Find existing connections from this source/port
    const existingConnections = workflow.connections.filter(
      conn => conn.sourceNodeId === sourceNodeId && 
               (sourcePort ? conn.sourcePort === sourcePort : !conn.sourcePort)
    );

    // Get all target nodes (existing + new)
    const existingTargetIds = existingConnections.map(conn => conn.targetNodeId);
    const allTargetIds = [...existingTargetIds, newTargetNodeId];
    const targetNodes = workflow.nodes.filter(node => allTargetIds.includes(node.id));
    const sourceNode = workflow.nodes.find(n => n.id === sourceNodeId)!;

    // Create gateway node
    const gatewayNode = SmartGatewayCreator.createGatewayNode(
      'parallel-gateway',
      sourceNode,
      targetNodes
    );

    // Create new connections through gateway
    const newConnections = SmartGatewayCreator.createGatewayConnections(
      sourceNodeId,
      gatewayNode.id,
      allTargetIds,
      sourcePort
    );

    // Remove old connections and add new ones
    const updatedConnections = workflow.connections.filter(
      conn => !existingConnections.some(existing => existing.id === conn.id)
    ).concat(newConnections);

    const updatedWorkflow: VisualWorkflow = {
      ...workflow,
      nodes: [...workflow.nodes, gatewayNode],
      connections: updatedConnections,
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    return {
      workflow: updatedWorkflow,
      gatewayNode,
      newConnections
    };
  }

  /**
   * Check if gateway can be optimized (too few connections)
   */
  static shouldOptimizeGateway(
    workflow: VisualWorkflow,
    gatewayNodeId: string
  ): boolean {
    const outgoingConnections = workflow.connections.filter(
      conn => conn.sourceNodeId === gatewayNodeId
    );
    
    // If gateway has only 1 output connection, it's not needed
    return outgoingConnections.length <= 1;
  }

  /**
   * Remove unnecessary gateway and reconnect directly
   */
  static optimizeGateway(
    workflow: VisualWorkflow,
    gatewayNodeId: string
  ): VisualWorkflow {
    
    const gatewayNode = workflow.nodes.find(n => n.id === gatewayNodeId);
    if (!gatewayNode) return workflow;

    const incomingConnection = workflow.connections.find(
      conn => conn.targetNodeId === gatewayNodeId
    );
    const outgoingConnections = workflow.connections.filter(
      conn => conn.sourceNodeId === gatewayNodeId
    );

    if (!incomingConnection || outgoingConnections.length === 0) {
      return workflow; // Can't optimize
    }

    // Create direct connections
    const directConnections = outgoingConnections.map(outConn => ({
      ...outConn,
      id: nanoid(),
      sourceNodeId: incomingConnection.sourceNodeId,
      sourcePort: incomingConnection.sourcePort
    }));

    // Remove gateway and its connections, add direct connections
    const updatedWorkflow: VisualWorkflow = {
      ...workflow,
      nodes: workflow.nodes.filter(n => n.id !== gatewayNodeId),
      connections: workflow.connections
        .filter(conn => 
          conn.sourceNodeId !== gatewayNodeId && 
          conn.targetNodeId !== gatewayNodeId
        )
        .concat(directConnections),
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    return updatedWorkflow;
  }

  /**
   * Suggest optimal gateway placement for drag-and-drop
   */
  static suggestGatewayPlacement(
    sourceNode: WorkflowNode,
    targetNodes: WorkflowNode[]
  ): Position {
    
    if (targetNodes.length === 0) {
      return {
        x: sourceNode.position.x + 150,
        y: sourceNode.position.y
      };
    }

    // Calculate centroid of target nodes
    const centroidX = targetNodes.reduce((sum, node) => sum + node.position.x, 0) / targetNodes.length;
    const centroidY = targetNodes.reduce((sum, node) => sum + node.position.y, 0) / targetNodes.length;

    // Place gateway 1/3 of the way from source to centroid
    return {
      x: sourceNode.position.x + (centroidX - sourceNode.position.x) * 0.33,
      y: sourceNode.position.y + (centroidY - sourceNode.position.y) * 0.33
    };
  }
}
