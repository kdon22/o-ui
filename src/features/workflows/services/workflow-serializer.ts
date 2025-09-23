/**
 * Workflow Serializer - Convert Visual to Schema Format
 * 
 * Converts visual workflow data to/from the WORKFLOW_SCHEMA format.
 * Handles serialization for database storage and API integration.
 */

import type { 
  VisualWorkflow,
  WorkflowNode,
  WorkflowConnection,
  WorkflowNodeType
} from '../types/workflow-builder';
import type { Workflow, CreateWorkflow } from '../workflows.schema';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely convert a date (Date object or string) to ISO string format
 */
function toISOStringSafe(date: string | Date | null | undefined): string {
  if (!date) return new Date().toISOString();
  
  // If it's already a string, assume it's in ISO format
  if (typeof date === 'string') {
    return date;
  }
  
  // If it's a Date object, convert it
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  // Fallback to current date
  return new Date().toISOString();
}

// ============================================================================
// VISUAL TO SCHEMA CONVERSION
// ============================================================================

export class WorkflowSerializer {
  
  /**
   * Convert visual workflow to WORKFLOW_SCHEMA format
   */
  static toSchema(visualWorkflow: VisualWorkflow): CreateWorkflow {
    const workflowType = WorkflowSerializer.detectWorkflowType(visualWorkflow);
    const executionMode = WorkflowSerializer.detectExecutionMode(visualWorkflow);
    
    return {
      name: visualWorkflow.name,
      description: visualWorkflow.description || '',
      workflowType,
      executionMode,
      priority: 50, // Default priority
      timeout: WorkflowSerializer.calculateTimeout(visualWorkflow),
      enableRetry: WorkflowSerializer.hasRetryLogic(visualWorkflow),
      enableRollback: WorkflowSerializer.hasErrorHandling(visualWorkflow),
      enableNotifications: true, // Default
      enableAuditLog: true, // Default
      
      // Store the visual definition
      definition: {
        visual: {
          nodes: visualWorkflow.nodes,
          connections: visualWorkflow.connections,
          viewport: visualWorkflow.viewport,
          layout: visualWorkflow.layout
        },
        execution: WorkflowSerializer.generateExecutionPlan(visualWorkflow),
        metadata: {
          nodeCount: visualWorkflow.nodes.length,
          connectionCount: visualWorkflow.connections.length,
          complexity: WorkflowSerializer.calculateComplexity(visualWorkflow)
        }
      },
      
      // Extract triggers from start nodes
      triggers: WorkflowSerializer.extractTriggers(visualWorkflow),
      
      // Extract conditions from decision nodes
      conditions: WorkflowSerializer.extractConditions(visualWorkflow),
      
      // Extract variables from all nodes
      variables: WorkflowSerializer.extractVariables(visualWorkflow),
      
      // Set defaults
      deploymentStatus: 'DRAFT' as const,
      isActive: false,
      tenantId: '', // Will be set by the action system
      branchId: '' // Will be set by the action system
    };
  }

  /**
   * Convert WORKFLOW_SCHEMA format to visual workflow
   */
  static fromSchema(workflow: Workflow): VisualWorkflow {
    // Try to extract visual definition from schema
    const visualDef = workflow.definition?.visual;
    
    if (visualDef && visualDef.nodes && visualDef.connections) {
      const nodes = visualDef.nodes;
      
      // Ensure workflow has start and end nodes
      const hasStart = nodes.some((node: any) => node.type === 'start');
      const hasEnd = nodes.some((node: any) => node.type === 'end');
      
      if (!hasStart) {
        nodes.unshift({
          id: 'start-node',
          type: 'start',
          position: { x: 100, y: 200 },
          size: { width: 60, height: 60 },
          label: 'Start',
          trigger: { type: 'manual' }
        });
      }
      
      if (!hasEnd) {
        nodes.push({
          id: 'end-node',
          type: 'end',
          position: { x: 1040, y: 200 },
          size: { width: 60, height: 60 },
          label: 'End',
          action: { type: 'success' }
        });
      }
      
      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || '',
        nodes,
        connections: visualDef.connections,
        viewport: visualDef.viewport || { x: 0, y: 0, zoom: 1 },
        layout: visualDef.layout || {
          gridSize: 20,
          snapToGrid: true,
          showGrid: true
        },
        metadata: {
          createdAt: workflow.createdAt.toISOString(),
          updatedAt: workflow.updatedAt.toISOString(),
          version: workflow.version
        }
      };
    }
    
    // Fallback: Generate visual representation from workflow metadata
    return WorkflowSerializer.generateVisualFromMetadata(workflow);
  }

  // ============================================================================
  // WORKFLOW TYPE DETECTION
  // ============================================================================

  private static detectWorkflowType(visual: VisualWorkflow): Workflow['workflowType'] {
    const hasParallelNodes = visual.nodes.some(n => n.type === 'parallel' || n.type === 'parallel-gateway');
    const hasDecisionNodes = visual.nodes.some(n => n.type === 'decision' || n.type === 'exclusive-gateway');
    const hasLoopConnections = WorkflowSerializer.hasLoops(visual);
    
    if (hasParallelNodes) return 'PARALLEL';
    if (hasDecisionNodes) return 'CONDITIONAL';
    if (hasLoopConnections) return 'HYBRID';
    return 'SEQUENTIAL';
  }

  private static detectExecutionMode(visual: VisualWorkflow): Workflow['executionMode'] {
    const hasParallelNodes = visual.nodes.some(n => n.type === 'parallel' || n.type === 'parallel-gateway');
    const processNodes = visual.nodes.filter(n => n.type === 'process');
    
    if (hasParallelNodes) return 'MIXED';
    
    // Check if processes have long timeouts (async indicators)
    const hasLongTimeouts = processNodes.some(n => 
      'timeout' in n && n.timeout && n.timeout > 60
    );
    
    return hasLongTimeouts ? 'ASYNC' : 'SYNC';
  }

  // ============================================================================
  // ANALYSIS HELPERS
  // ============================================================================

  private static calculateTimeout(visual: VisualWorkflow): number {
    const processNodes = visual.nodes.filter(n => n.type === 'process');
    const totalTimeout = processNodes.reduce((sum, node) => {
      if ('timeout' in node && node.timeout) {
        return sum + node.timeout;
      }
      return sum + 30; // Default timeout
    }, 0);
    
    return Math.max(totalTimeout, 300); // Minimum 5 minutes
  }

  private static hasRetryLogic(visual: VisualWorkflow): boolean {
    return visual.nodes.some(node => 
      node.type === 'process' && 'retryCount' in node && node.retryCount && node.retryCount > 0
    );
  }

  private static hasErrorHandling(visual: VisualWorkflow): boolean {
    return visual.connections.some(conn => conn.sourcePort === 'error');
  }

  private static hasLoops(visual: VisualWorkflow): boolean {
    // Simple cycle detection
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visiting.add(nodeId);
      
      const outgoing = visual.connections.filter(c => c.sourceNodeId === nodeId);
      for (const conn of outgoing) {
        if (hasCycle(conn.targetNodeId)) return true;
      }
      
      visiting.delete(nodeId);
      visited.add(nodeId);
      return false;
    };
    
    return visual.nodes.some(node => hasCycle(node.id));
  }

  private static calculateComplexity(visual: VisualWorkflow): number {
    let complexity = 0;
    
    // Base complexity
    complexity += visual.nodes.length;
    complexity += visual.connections.length;
    
    // Node type complexity multipliers
    visual.nodes.forEach(node => {
      switch (node.type) {
        case 'decision': complexity += 2; break;
        case 'parallel': complexity += 3; break;
        case 'parallel-gateway': complexity += 4; break; // Higher complexity for gateway
        case 'exclusive-gateway': complexity += 3; break;
        case 'merge': complexity += 2; break;
        case 'process': complexity += 1; break;
        default: break;
      }
    });
    
    // Loop complexity
    if (WorkflowSerializer.hasLoops(visual)) {
      complexity += 5;
    }
    
    return complexity;
  }

  // ============================================================================
  // EXECUTION PLAN GENERATION
  // ============================================================================

  private static generateExecutionPlan(visual: VisualWorkflow): any {
    const plan: any = {
      steps: [],
      dependencies: {},
      parallelGroups: [],
      errorHandling: {}
    };
    
    // Find start node
    const startNode = visual.nodes.find(n => n.type === 'start');
    if (!startNode) return plan;
    
    // Build execution steps
    const visited = new Set<string>();
    const steps: any[] = [];
    
    const traverse = (nodeId: string, depth = 0) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = visual.nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      steps.push({
        id: node.id,
        type: node.type,
        label: node.label,
        depth,
        config: WorkflowSerializer.getNodeExecutionConfig(node)
      });
      
      // Find next nodes
      const outgoing = visual.connections.filter(c => c.sourceNodeId === nodeId);
      outgoing.forEach(conn => traverse(conn.targetNodeId, depth + 1));
    };
    
    traverse(startNode.id);
    plan.steps = steps;
    
    return plan;
  }

  private static getNodeExecutionConfig(node: WorkflowNode): any {
    switch (node.type) {
      case 'process':
        return {
          processId: 'processId' in node ? node.processId : null,
          timeout: 'timeout' in node ? node.timeout : 30,
          retryCount: 'retryCount' in node ? node.retryCount : 0,
          rules: 'rules' in node ? node.rules : []
        };
      
      case 'decision':
        return {
          condition: 'condition' in node ? node.condition : null,
          branches: 'branches' in node ? node.branches : null
        };
      
      case 'parallel':
        return {
          branches: 'branches' in node ? node.branches : []
        };
      
      case 'merge':
        return {
          waitForAll: 'waitForAll' in node ? node.waitForAll : true
        };
      
      case 'parallel-gateway':
        return {
          executionMode: 'executionMode' in node ? node.executionMode : 'all',
          maxConcurrent: 'maxConcurrent' in node ? node.maxConcurrent : undefined
        };
      
      case 'exclusive-gateway':
        return {
          condition: 'condition' in node ? node.condition : null,
          defaultBranch: 'defaultBranch' in node ? node.defaultBranch : null
        };
      
      default:
        return {};
    }
  }

  // ============================================================================
  // DATA EXTRACTION
  // ============================================================================

  private static extractTriggers(visual: VisualWorkflow): Record<string, any> {
    const triggers = {};
    
    visual.nodes.forEach(node => {
      if (node.type === 'start' && 'trigger' in node && node.trigger) {
        Object.assign(triggers, { [node.id]: node.trigger });
      }
    });
    
    return triggers;
  }

  private static extractConditions(visual: VisualWorkflow): Record<string, any> {
    const conditions = {};
    
    visual.nodes.forEach(node => {
      if (node.type === 'decision' && 'condition' in node) {
        Object.assign(conditions, { [node.id]: node.condition });
      }
    });
    
    return conditions;
  }

  private static extractVariables(visual: VisualWorkflow): Record<string, any> {
    const variables: Record<string, any> = {
      // Standard workflow variables
      workflowId: '${workflow.id}',
      workflowName: '${workflow.name}',
      executionId: '${execution.id}',
      startTime: '${execution.startTime}',
      // Add more as needed
    };
    
    // Extract variables from node configurations
    visual.nodes.forEach(node => {
      if (node.type === 'process' && 'processId' in node && node.processId) {
        const processKey = `process_${node.id}_result`;
        variables[processKey] = '${process.result}';
      }
    });
    
    return variables;
  }

  // ============================================================================
  // FALLBACK VISUAL GENERATION
  // ============================================================================

  private static generateVisualFromMetadata(workflow: Workflow): VisualWorkflow {
    // Generate a simple linear visual representation
    const nodes: WorkflowNode[] = [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 200 },
        size: { width: 60, height: 60 },
        label: 'Start'
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 1040, y: 200 },
        size: { width: 60, height: 60 },
        label: 'End'
      }
    ];

    // Only create connections if there are more than just start and end nodes
    // If it's just start and end, leave them unconnected
    const connections: WorkflowConnection[] = [];

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || '',
      nodes,
      connections,
      viewport: { x: 0, y: 0, zoom: 1 },
      layout: {
        gridSize: 20,
        snapToGrid: true,
        showGrid: true
      },
      metadata: {
        createdAt: toISOStringSafe(workflow.createdAt),
        updatedAt: toISOStringSafe(workflow.updatedAt),
        version: workflow.version
      }
    };
  }
}
