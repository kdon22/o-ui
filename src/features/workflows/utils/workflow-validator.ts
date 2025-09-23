/**
 * Workflow Validation Utilities
 * 
 * Validates workflow structure and connections to ensure proper flow
 */

import type { VisualWorkflow, WorkflowNode, WorkflowConnection } from '../types/workflow-builder';

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  id: string;
  type: 'error' | 'warning';
  nodeId?: string;
  message: string;
  description?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validation modes determine when to show different types of errors
 */
export type ValidationMode = 'immediate' | 'on-close' | 'all';

/**
 * Validate entire workflow structure with different modes
 */
export function validateWorkflow(workflow: VisualWorkflow, mode: ValidationMode = 'all'): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Always check critical immediate issues (like empty name)
  validateImmediateIssues(workflow, errors);
  
  if (mode === 'on-close' || mode === 'all') {
    // Check for connection issues (only on close or all)
    validateConnections(workflow, errors, warnings);
    
    // Check for process node success connections (only on close or all)
    validateProcessConnections(workflow, errors);
    
    // Check for structural issues (only on close or all)
    validateStructuralIssues(workflow, errors);
  }

  if (mode === 'all') {
    // Check for isolated nodes (warnings only, only in full validation)
    validateNodeConnectivity(workflow, warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate immediate issues that should be shown right away
 */
function validateImmediateIssues(workflow: VisualWorkflow, errors: ValidationError[]): void {
  // Check for empty workflow name (immediate feedback)
  if (!workflow.name || workflow.name.trim() === '' || workflow.name === 'Untitled Workflow') {
    errors.push({
      id: 'empty-workflow-name',
      type: 'error',
      message: 'Workflow must have a name',
      description: 'Please provide a meaningful name for your workflow'
    });
  }
}

/**
 * Validate structural issues that can wait until close
 */
function validateStructuralIssues(workflow: VisualWorkflow, errors: ValidationError[]): void {
  // Check for start node
  const startNodes = workflow.nodes.filter(n => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push({
      id: 'no-start-node',
      type: 'error',
      message: 'Workflow must have a start node',
      description: 'Every workflow needs exactly one start node to begin execution'
    });
  } else if (startNodes.length > 1) {
    errors.push({
      id: 'multiple-start-nodes',
      type: 'error',
      message: 'Workflow has multiple start nodes',
      description: 'Only one start node is allowed per workflow'
    });
  }

  // Check for end node
  const endNodes = workflow.nodes.filter(n => n.type === 'end');
  if (endNodes.length === 0) {
    errors.push({
      id: 'no-end-node',
      type: 'error',
      message: 'Workflow must have an end node',
      description: 'Every workflow needs at least one end node to complete execution'
    });
  }
}

/**
 * Validate connections structure
 */
function validateConnections(workflow: VisualWorkflow, errors: ValidationError[], warnings: ValidationError[]): void {
  workflow.connections.forEach(connection => {
    // Check if source node exists
    const sourceNode = workflow.nodes.find(n => n.id === connection.sourceNodeId);
    if (!sourceNode) {
      errors.push({
        id: `invalid-source-${connection.id}`,
        type: 'error',
        message: `Connection references non-existent source node: ${connection.sourceNodeId}`,
        description: 'This connection should be removed'
      });
    }

    // Check if target node exists
    const targetNode = workflow.nodes.find(n => n.id === connection.targetNodeId);
    if (!targetNode) {
      errors.push({
        id: `invalid-target-${connection.id}`,
        type: 'error',
        message: `Connection references non-existent target node: ${connection.targetNodeId}`,
        description: 'This connection should be removed'
      });
    }

    // Check for self-connections
    if (connection.sourceNodeId === connection.targetNodeId) {
      errors.push({
        id: `self-connection-${connection.id}`,
        type: 'error',
        nodeId: connection.sourceNodeId,
        message: 'Node cannot connect to itself',
        description: 'Self-connections are not allowed'
      });
    }
  });
}

/**
 * Validate that all process nodes have success connections
 */
function validateProcessConnections(workflow: VisualWorkflow, errors: ValidationError[]): void {
  const processNodes = workflow.nodes.filter(n => n.type === 'process');
  
  processNodes.forEach(node => {
    // Find all outgoing connections from this process node
    const outgoingConnections = workflow.connections.filter(
      conn => conn.sourceNodeId === node.id
    );
    
    // Check if there are any success connections (non-error connections)
    const successConnections = outgoingConnections.filter(
      conn => conn.sourcePort !== 'error'
    );
    
    if (successConnections.length === 0) {
      errors.push({
        id: `no-success-connection-${node.id}`,
        type: 'error',
        nodeId: node.id,
        message: `Process "${node.label || node.id}" has no success connection`,
        description: 'Process nodes must have at least one success connection to continue the workflow'
      });
    }
  });
}

/**
 * Validate node connectivity (detect isolated nodes)
 */
function validateNodeConnectivity(workflow: VisualWorkflow, warnings: ValidationError[]): void {
  workflow.nodes.forEach(node => {
    // Skip start and end nodes from isolation check
    if (node.type === 'start' || node.type === 'end') return;
    
    const hasIncoming = workflow.connections.some(conn => conn.targetNodeId === node.id);
    const hasOutgoing = workflow.connections.some(conn => conn.sourceNodeId === node.id);
    
    if (!hasIncoming && !hasOutgoing) {
      warnings.push({
        id: `isolated-node-${node.id}`,
        type: 'warning',
        nodeId: node.id,
        message: `Node "${node.label || node.id}" is isolated`,
        description: 'This node has no connections and will not be executed'
      });
    } else if (!hasIncoming) {
      warnings.push({
        id: `no-incoming-${node.id}`,
        type: 'warning',
        nodeId: node.id,
        message: `Node "${node.label || node.id}" has no incoming connections`,
        description: 'This node may not be reachable during execution'
      });
    }
  });
}

/**
 * Get validation errors for a specific node
 */
export function getNodeValidationErrors(workflow: VisualWorkflow, nodeId: string): ValidationError[] {
  const result = validateWorkflow(workflow);
  return [...result.errors, ...result.warnings].filter(error => error.nodeId === nodeId);
}

/**
 * Quick check if workflow can be saved/executed
 */
export function canWorkflowBeSaved(workflow: VisualWorkflow): boolean {
  const result = validateWorkflow(workflow, 'on-close');
  return result.isValid;
}
