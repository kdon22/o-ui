/**
 * Workflow Execution Engine - Gateway-Aware Parallel Execution
 * 
 * Enhanced execution engine that handles parallel and exclusive gateways.
 * Manages state, concurrency limits, and execution flow control.
 */

import type { 
  VisualWorkflow,
  WorkflowNode,
  WorkflowConnection,
  ParallelGatewayNode,
  ExclusiveGatewayNode
} from '../types/workflow-builder';

// ============================================================================
// EXECUTION TYPES
// ============================================================================

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  tenantId: string;
  userId: string;
  variables: Record<string, any>;
  startTime: string;
  status: ExecutionStatus;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface NodeExecutionState {
  nodeId: string;
  status: ExecutionStatus;
  startTime?: string;
  endTime?: string;
  result?: any;
  error?: string;
  retryCount?: number;
}

export interface GatewayExecutionState extends NodeExecutionState {
  gatewayType: 'parallel-gateway' | 'exclusive-gateway';
  branchStates: Record<string, ExecutionStatus>; // outputPort -> status
  activeBranches: string[]; // Currently executing branches
  completedBranches: string[]; // Successfully completed branches
  failedBranches: string[]; // Failed branches
}

export interface ExecutionPlan {
  nodes: ExecutionPlanNode[];
  dependencies: Record<string, string[]>; // nodeId -> dependency nodeIds
  parallelGroups: ParallelGroup[];
  gateways: GatewayPlan[];
}

export interface ExecutionPlanNode {
  nodeId: string;
  nodeType: string;
  depth: number;
  dependencies: string[];
  config: Record<string, any>;
}

export interface ParallelGroup {
  gatewayNodeId: string;
  branches: ExecutionBranch[];
  executionMode: 'all' | 'first' | 'any';
  maxConcurrent?: number;
}

export interface ExecutionBranch {
  branchId: string;
  outputPort: string;
  nodeIds: string[];
  status: ExecutionStatus;
}

export interface GatewayPlan {
  gatewayNodeId: string;
  type: 'parallel-gateway' | 'exclusive-gateway';
  inputNodes: string[];
  outputBranches: ExecutionBranch[];
  executionConfig: Record<string, any>;
}

// ============================================================================
// WORKFLOW EXECUTION ENGINE
// ============================================================================

export class WorkflowExecutionEngine {
  private workflow: VisualWorkflow;
  private executionContext: ExecutionContext;
  private nodeStates: Map<string, NodeExecutionState>;
  private executionPlan: ExecutionPlan;
  private callbacks: ExecutionCallbacks;

  constructor(
    workflow: VisualWorkflow,
    context: ExecutionContext,
    callbacks: ExecutionCallbacks
  ) {
    this.workflow = workflow;
    this.executionContext = context;
    this.nodeStates = new Map();
    this.callbacks = callbacks;
    this.executionPlan = this.generateExecutionPlan();
  }

  // ============================================================================
  // EXECUTION PLAN GENERATION
  // ============================================================================

  private generateExecutionPlan(): ExecutionPlan {
    const plan: ExecutionPlan = {
      nodes: [],
      dependencies: {},
      parallelGroups: [],
      gateways: []
    };

    // Build dependency graph
    const dependencies = this.buildDependencyGraph();
    plan.dependencies = dependencies;

    // Analyze workflow structure
    this.workflow.nodes.forEach(node => {
      const planNode: ExecutionPlanNode = {
        nodeId: node.id,
        nodeType: node.type,
        depth: this.calculateNodeDepth(node.id, dependencies),
        dependencies: dependencies[node.id] || [],
        config: this.getNodeExecutionConfig(node)
      };
      plan.nodes.push(planNode);

      // Handle gateway nodes
      if (node.type === 'parallel-gateway' || node.type === 'exclusive-gateway') {
        const gatewayPlan = this.createGatewayPlan(node as ParallelGatewayNode | ExclusiveGatewayNode);
        plan.gateways.push(gatewayPlan);

        if (node.type === 'parallel-gateway') {
          const parallelGroup = this.createParallelGroup(node as ParallelGatewayNode);
          plan.parallelGroups.push(parallelGroup);
        }
      }
    });

    return plan;
  }

  private buildDependencyGraph(): Record<string, string[]> {
    const dependencies: Record<string, string[]> = {};
    
    // Initialize all nodes
    this.workflow.nodes.forEach(node => {
      dependencies[node.id] = [];
    });

    // Build dependencies from connections
    this.workflow.connections.forEach(connection => {
      if (!dependencies[connection.targetNodeId]) {
        dependencies[connection.targetNodeId] = [];
      }
      dependencies[connection.targetNodeId].push(connection.sourceNodeId);
    });

    return dependencies;
  }

  private calculateNodeDepth(nodeId: string, dependencies: Record<string, string[]>): number {
    const visited = new Set<string>();
    
    const calculateDepth = (id: string): number => {
      if (visited.has(id)) return 0; // Prevent cycles
      visited.add(id);
      
      const deps = dependencies[id] || [];
      if (deps.length === 0) return 0;
      
      return 1 + Math.max(...deps.map(depId => calculateDepth(depId)));
    };

    return calculateDepth(nodeId);
  }

  private createGatewayPlan(gatewayNode: ParallelGatewayNode | ExclusiveGatewayNode): GatewayPlan {
    const outputConnections = this.workflow.connections.filter(
      conn => conn.sourceNodeId === gatewayNode.id
    );
    
    const outputBranches: ExecutionBranch[] = outputConnections.map((conn, index) => ({
      branchId: `${gatewayNode.id}-branch-${index}`,
      outputPort: conn.sourcePort || `out-${index}`,
      nodeIds: this.getDownstreamNodes(conn.targetNodeId),
      status: 'pending' as ExecutionStatus
    }));

    const inputNodes = this.workflow.connections
      .filter(conn => conn.targetNodeId === gatewayNode.id)
      .map(conn => conn.sourceNodeId);

    return {
      gatewayNodeId: gatewayNode.id,
      type: gatewayNode.type,
      inputNodes,
      outputBranches,
      executionConfig: this.getNodeExecutionConfig(gatewayNode)
    };
  }

  private createParallelGroup(gatewayNode: ParallelGatewayNode): ParallelGroup {
    const gatewayPlan = this.executionPlan.gateways.find(g => g.gatewayNodeId === gatewayNode.id);
    if (!gatewayPlan) {
      throw new Error(`Gateway plan not found for node ${gatewayNode.id}`);
    }

    return {
      gatewayNodeId: gatewayNode.id,
      branches: gatewayPlan.outputBranches,
      executionMode: gatewayNode.executionMode,
      maxConcurrent: gatewayNode.maxConcurrent
    };
  }

  private getDownstreamNodes(startNodeId: string): string[] {
    const visited = new Set<string>();
    const downstream: string[] = [];

    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      downstream.push(nodeId);

      const connections = this.workflow.connections.filter(conn => conn.sourceNodeId === nodeId);
      connections.forEach(conn => {
        const targetNode = this.workflow.nodes.find(n => n.id === conn.targetNodeId);
        if (targetNode && targetNode.type !== 'parallel-gateway' && targetNode.type !== 'exclusive-gateway') {
          traverse(conn.targetNodeId);
        }
      });
    };

    traverse(startNodeId);
    return downstream;
  }

  private getNodeExecutionConfig(node: WorkflowNode): Record<string, any> {
    switch (node.type) {
      case 'process':
        return {
          processId: 'processId' in node ? node.processId : null,
          timeout: 'timeout' in node ? node.timeout : 30,
          retryCount: 'retryCount' in node ? node.retryCount : 0
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
  // EXECUTION CONTROL
  // ============================================================================

  async executeWorkflow(): Promise<ExecutionContext> {
    this.executionContext.status = 'running';
    
    try {
      // Find start node
      const startNode = this.workflow.nodes.find(n => n.type === 'start');
      if (!startNode) {
        throw new Error('No start node found in workflow');
      }

      await this.executeNode(startNode.id);
      
      this.executionContext.status = 'completed';
      return this.executionContext;

    } catch (error) {
      this.executionContext.status = 'failed';
      await this.callbacks.onExecutionError(this.executionContext, error as Error);
      throw error;
    }
  }

  private async executeNode(nodeId: string): Promise<void> {
    const node = this.workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Check dependencies
    const dependencies = this.executionPlan.dependencies[nodeId] || [];
    const allDependenciesComplete = dependencies.every(depId => {
      const state = this.nodeStates.get(depId);
      return state?.status === 'completed';
    });

    if (!allDependenciesComplete) {
      throw new Error(`Dependencies not met for node ${nodeId}`);
    }

    // Initialize node state
    const nodeState: NodeExecutionState = {
      nodeId,
      status: 'running',
      startTime: new Date().toISOString()
    };
    this.nodeStates.set(nodeId, nodeState);

    try {
      // Execute based on node type
      switch (node.type) {
        case 'start':
          await this.executeStartNode(node);
          break;
        case 'process':
          await this.executeProcessNode(node);
          break;
        case 'parallel-gateway':
          await this.executeParallelGateway(node as ParallelGatewayNode);
          break;
        case 'exclusive-gateway':
          await this.executeExclusiveGateway(node as ExclusiveGatewayNode);
          break;
        case 'end':
          await this.executeEndNode(node);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Mark as completed
      nodeState.status = 'completed';
      nodeState.endTime = new Date().toISOString();
      
      await this.callbacks.onNodeComplete(nodeState);

    } catch (error) {
      nodeState.status = 'failed';
      nodeState.endTime = new Date().toISOString();
      nodeState.error = (error as Error).message;
      
      await this.callbacks.onNodeError(nodeState, error as Error);
      throw error;
    }
  }

  private async executeParallelGateway(gatewayNode: ParallelGatewayNode): Promise<void> {
    const gatewayPlan = this.executionPlan.gateways.find(g => g.gatewayNodeId === gatewayNode.id);
    if (!gatewayPlan) {
      throw new Error(`Gateway plan not found for ${gatewayNode.id}`);
    }

    const gatewayState: GatewayExecutionState = {
      nodeId: gatewayNode.id,
      status: 'running',
      startTime: new Date().toISOString(),
      gatewayType: 'parallel-gateway',
      branchStates: {},
      activeBranches: [],
      completedBranches: [],
      failedBranches: []
    };
    this.nodeStates.set(gatewayNode.id, gatewayState);

    // Execute all branches based on execution mode
    const branches = gatewayPlan.outputBranches;
    const maxConcurrent = gatewayNode.maxConcurrent || branches.length;

    if (gatewayNode.executionMode === 'all') {
      // Wait for all branches to complete
      const branchPromises = branches.slice(0, maxConcurrent).map(branch => 
        this.executeBranch(branch, gatewayState)
      );
      
      await Promise.all(branchPromises);
      
    } else if (gatewayNode.executionMode === 'first') {
      // Wait for first branch to complete
      const branchPromises = branches.map(branch => 
        this.executeBranch(branch, gatewayState)
      );
      
      await Promise.race(branchPromises);
      
    } else if (gatewayNode.executionMode === 'any') {
      // Continue when any branch completes successfully
      const branchPromises = branches.map(branch => 
        this.executeBranch(branch, gatewayState)
      );
      
      await Promise.any(branchPromises);
    }

    gatewayState.status = 'completed';
    gatewayState.endTime = new Date().toISOString();
  }

  private async executeBranch(branch: ExecutionBranch, gatewayState: GatewayExecutionState): Promise<void> {
    gatewayState.activeBranches.push(branch.branchId);
    branch.status = 'running';
    
    try {
      // Execute all nodes in the branch
      for (const nodeId of branch.nodeIds) {
        await this.executeNode(nodeId);
      }
      
      branch.status = 'completed';
      gatewayState.completedBranches.push(branch.branchId);
      gatewayState.branchStates[branch.outputPort] = 'completed';
      
    } catch (error) {
      branch.status = 'failed';
      gatewayState.failedBranches.push(branch.branchId);
      gatewayState.branchStates[branch.outputPort] = 'failed';
      throw error;
    } finally {
      const index = gatewayState.activeBranches.indexOf(branch.branchId);
      if (index > -1) {
        gatewayState.activeBranches.splice(index, 1);
      }
    }
  }

  private async executeExclusiveGateway(gatewayNode: ExclusiveGatewayNode): Promise<void> {
    // Evaluate condition and execute appropriate branch
    const condition = gatewayNode.condition;
    let selectedBranch: string | null = null;

    if (condition) {
      const result = await this.evaluateCondition(condition);
      if (result) {
        // Find the matching output port based on condition result
        const connections = this.workflow.connections.filter(
          conn => conn.sourceNodeId === gatewayNode.id
        );
        selectedBranch = connections[0]?.sourcePort || 'out-0';
      }
    }

    // Use default branch if no condition matched
    if (!selectedBranch && gatewayNode.defaultBranch) {
      selectedBranch = gatewayNode.defaultBranch;
    }

    if (selectedBranch) {
      const targetConnection = this.workflow.connections.find(
        conn => conn.sourceNodeId === gatewayNode.id && conn.sourcePort === selectedBranch
      );
      
      if (targetConnection) {
        await this.executeNode(targetConnection.targetNodeId);
      }
    }
  }

  private async evaluateCondition(condition: any): Promise<boolean> {
    // TODO: Implement condition evaluation logic
    // This would integrate with your rule engine or expression evaluator
    return true;
  }

  private async executeStartNode(node: WorkflowNode): Promise<void> {
    // Start node just triggers the next nodes
    await this.callbacks.onNodeStart(this.nodeStates.get(node.id)!);
    await this.executeNextNodes(node.id);
  }

  private async executeProcessNode(node: WorkflowNode): Promise<void> {
    const config = this.getNodeExecutionConfig(node);
    const result = await this.callbacks.onProcessExecution(node, config);
    
    const nodeState = this.nodeStates.get(node.id)!;
    nodeState.result = result;
    
    await this.executeNextNodes(node.id);
  }

  private async executeEndNode(node: WorkflowNode): Promise<void> {
    await this.callbacks.onWorkflowComplete(this.executionContext);
  }

  private async executeNextNodes(nodeId: string): Promise<void> {
    const outgoingConnections = this.workflow.connections.filter(
      conn => conn.sourceNodeId === nodeId
    );

    for (const connection of outgoingConnections) {
      await this.executeNode(connection.targetNodeId);
    }
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  getNodeState(nodeId: string): NodeExecutionState | undefined {
    return this.nodeStates.get(nodeId);
  }

  getAllNodeStates(): NodeExecutionState[] {
    return Array.from(this.nodeStates.values());
  }

  getExecutionStatus(): ExecutionStatus {
    return this.executionContext.status;
  }

  getExecutionPlan(): ExecutionPlan {
    return this.executionPlan;
  }
}

// ============================================================================
// CALLBACK INTERFACES
// ============================================================================

export interface ExecutionCallbacks {
  onNodeStart(nodeState: NodeExecutionState): Promise<void>;
  onNodeComplete(nodeState: NodeExecutionState): Promise<void>;
  onNodeError(nodeState: NodeExecutionState, error: Error): Promise<void>;
  onProcessExecution(node: WorkflowNode, config: Record<string, any>): Promise<any>;
  onWorkflowComplete(context: ExecutionContext): Promise<void>;
  onExecutionError(context: ExecutionContext, error: Error): Promise<void>;
}
