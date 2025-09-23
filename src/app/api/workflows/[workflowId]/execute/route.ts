/**
 * Workflow Execution API
 * 
 * Handles starting workflow executions and tracking their progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import type { 
  WorkflowDefinition, 
  WorkflowExecutionState,
  NodeExecutionState 
} from '@/types/workflow-definition';

interface RouteParams {
  params: {
    workflowId: string;
  };
}

// Start workflow execution
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      queueId,
      inputData,
      tenantId,
      branchId = 'main',
      triggeredBy
    } = body;

    if (!tenantId || !queueId) {
      return NextResponse.json(
        { error: 'tenantId and queueId are required' },
        { status: 400 }
      );
    }

    // Get workflow with branch fallback
    let workflow = await prisma.workflow.findFirst({
      where: {
        id: params.workflowId,
        tenantId,
        branchId,
        isActive: true
      }
    });

    // Fallback to default branch
    if (!workflow && branchId !== 'main') {
      workflow = await prisma.workflow.findFirst({
        where: {
          id: params.workflowId,
          tenantId,
          branchId: 'main',
          isActive: true
        }
      });
    }

    if (!workflow || !workflow.steps) {
      return NextResponse.json(
        { error: 'Workflow not found or has no steps defined' },
        { status: 404 }
      );
    }

    // Verify queue assignment
    const queueAssignment = await prisma.queueWorkflow.findFirst({
      where: {
        workflowId: workflow.id,
        queueId,
        isActive: true
      }
    });

    if (!queueAssignment) {
      return NextResponse.json(
        { error: 'Workflow is not assigned to this queue' },
        { status: 403 }
      );
    }

    const workflowDefinition = workflow.steps as WorkflowDefinition;
    
    // Initialize execution state
    const initialNodeStates = initializeNodeStates(workflowDefinition);
    
    // Calculate timeout
    const timeoutSeconds = workflowDefinition.execution_settings?.global_timeout_seconds || 1800;
    const timeoutAt = new Date(Date.now() + timeoutSeconds * 1000);

    // Create workflow execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        queueId,
        triggeredBy: triggeredBy || session.user.id,
        status: 'RUNNING',
        inputData,
        nodeStates: initialNodeStates,
        timeoutAt,
        startedAt: new Date(),
        tenantId,
        branchId: workflow.branchId
      }
    });

    // Start workflow execution (this would typically be queued for background processing)
    await startWorkflowExecution(execution.id, workflowDefinition, inputData);

    return NextResponse.json({
      execution: {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        startedAt: execution.startedAt,
        nodeStates: execution.nodeStates,
        inputData: execution.inputData
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to start workflow execution:', error);
    return NextResponse.json(
      { error: 'Failed to start workflow execution' },
      { status: 500 }
    );
  }
}

// Get execution status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');
    const tenantId = searchParams.get('tenantId');

    if (!executionId || !tenantId) {
      return NextResponse.json(
        { error: 'executionId and tenantId are required' },
        { status: 400 }
      );
    }

    const execution = await prisma.workflowExecution.findFirst({
      where: {
        id: executionId,
        workflowId: params.workflowId,
        tenantId
      },
      include: {
        workflow: {
          select: {
            name: true,
            steps: true
          }
        }
      }
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      execution: {
        id: execution.id,
        workflowId: execution.workflowId,
        workflowName: execution.workflow.name,
        status: execution.status,
        currentNodeId: execution.currentNodeId,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        nodeStates: execution.nodeStates,
        inputData: execution.inputData,
        outputData: execution.outputData,
        error: execution.error,
        retryCount: execution.retryCount
      }
    });

  } catch (error) {
    console.error('Failed to get execution status:', error);
    return NextResponse.json(
      { error: 'Failed to get execution status' },
      { status: 500 }
    );
  }
}

// ============================================================================
// WORKFLOW EXECUTION ENGINE
// ============================================================================

async function startWorkflowExecution(
  executionId: string,
  workflowDefinition: WorkflowDefinition,
  inputData: any
) {
  // This would typically be handled by a background job queue
  // For now, we'll simulate immediate execution
  
  try {
    // Find start nodes
    const startNodes = workflowDefinition.nodes.filter(node => node.type === 'start');
    
    if (startNodes.length === 0) {
      throw new Error('No start node found in workflow');
    }

    // Execute start nodes (usually just one)
    for (const startNode of startNodes) {
      await executeNode(executionId, startNode.id, inputData);
    }

  } catch (error) {
    console.error('Workflow execution failed:', error);
    
    // Update execution as failed
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date()
      }
    });
  }
}

async function executeNode(executionId: string, nodeId: string, nodeInput: any) {
  try {
    // Get current execution state
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        workflow: true
      }
    });

    if (!execution || !execution.workflow.steps) {
      throw new Error('Execution or workflow definition not found');
    }

    const workflowDefinition = execution.workflow.steps as WorkflowDefinition;
    const node = workflowDefinition.nodes.find(n => n.id === nodeId);
    
    if (!node) {
      throw new Error(`Node ${nodeId} not found in workflow`);
    }

    // Update node state to running
    const nodeStates = execution.nodeStates as WorkflowExecutionState;
    nodeStates[nodeId] = {
      ...nodeStates[nodeId],
      status: 'running',
      started_at: new Date().toISOString(),
      input_data: nodeInput
    };

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        currentNodeId: nodeId,
        nodeStates
      }
    });

    // Execute node based on type
    let nodeOutput: any;
    let success = true;

    switch (node.type) {
      case 'start':
        nodeOutput = nodeInput; // Pass through input data
        break;
        
      case 'process':
        nodeOutput = await executeProcessNode(node, nodeInput);
        break;
        
      case 'end':
        nodeOutput = nodeInput;
        // Mark workflow as completed
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: 'COMPLETED',
            outputData: nodeOutput,
            completedAt: new Date()
          }
        });
        break;
        
      default:
        nodeOutput = nodeInput; // Default pass-through
    }

    // Update node state to completed
    nodeStates[nodeId] = {
      ...nodeStates[nodeId],
      status: 'completed',
      completed_at: new Date().toISOString(),
      output_data: nodeOutput
    };

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: { nodeStates }
    });

    // Execute next nodes
    if (success && node.outputs.success) {
      for (const nextNodeId of node.outputs.success) {
        await executeNode(executionId, nextNodeId, nodeOutput);
      }
    }

  } catch (error) {
    console.error(`Node ${nodeId} execution failed:`, error);
    
    // Update node state to failed
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId }
    });
    
    if (execution) {
      const nodeStates = execution.nodeStates as WorkflowExecutionState;
      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        status: 'failed',
        completed_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { nodeStates }
      });
    }
  }
}

async function executeProcessNode(node: any, input: any) {
  // This would call your actual process execution logic
  // For now, simulate process execution
  
  if (!node.config?.process_id) {
    throw new Error('Process node missing process_id');
  }

  // Simulate calling the actual process
  // In reality, this would:
  // 1. Load the process from the Process table
  // 2. Execute the process rules/code
  // 3. Return the process output
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
  
  return {
    processId: node.config.process_id,
    result: 'success',
    output: input,
    executedAt: new Date().toISOString()
  };
}

function initializeNodeStates(workflowDefinition: WorkflowDefinition): WorkflowExecutionState {
  const nodeStates: WorkflowExecutionState = {};
  
  workflowDefinition.nodes.forEach(node => {
    nodeStates[node.id] = {
      status: node.type === 'start' ? 'running' : 'waiting'
    };
  });
  
  return nodeStates;
}
