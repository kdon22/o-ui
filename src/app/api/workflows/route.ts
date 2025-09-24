/**
 * Workflows API - List and Create
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import type { WorkflowDefinition } from '@/types/workflow-definition';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const branchId = searchParams.get('branchId') || 'main';
    const queueId = searchParams.get('queueId'); // Filter by queue

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Build query with branch-aware filtering
    const where: any = {
      tenantId,
      branchId,
      isActive: true
    };

    // If queueId provided, filter by queue assignments
    if (queueId) {
      where.queueWorkflows = {
        some: {
          queueId,
          isActive: true
        }
      };
    }

    const workflows = await prisma.workflow.findMany({
      where,
      include: {
        queueWorkflows: {
          where: { isActive: true },
          include: {
            queue: {
              select: { id: true, name: true, type: true }
            }
          }
        },
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    });

    return NextResponse.json({
      workflows: workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        type: workflow.type,
        isActive: workflow.isActive,
        version: workflow.version,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        branchId: workflow.branchId,
        
        // Queue assignments
        queues: workflow.queueWorkflows.map(qw => qw.queue),
        
        // Execution stats
        executionCount: workflow._count.executions,
        
        // Steps preview (just basic info)
        stepsPreview: workflow.steps ? {
          nodeCount: (workflow.steps as any)?.nodes?.length || 0,
          hasParallelExecution: (workflow.steps as any)?.execution_settings?.parallel_execution || false
        } : null
      }))
    });

  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type = 'standard',
      steps,
      executionSettings,
      tenantId,
      branchId = 'main',
      queueIds = []
    } = body;

    // Validate required fields
    if (!name || !tenantId) {
      return NextResponse.json(
        { error: 'name and tenantId are required' },
        { status: 400 }
      );
    }

    // Validate steps structure if provided
    if (steps && !isValidWorkflowDefinition(steps)) {
      return NextResponse.json(
        { error: 'Invalid workflow definition structure' },
        { status: 400 }
      );
    }

    // Create workflow with transaction to handle queue assignments
    const result = await prisma.$transaction(async (tx) => {
      // Create the workflow
      const workflow = await tx.workflow.create({
        data: {
          name,
          description,
          type,
          steps: steps || null,
          executionSettings: executionSettings || null,
          tenantId,
          branchId,
          createdById: session.user.id,
          updatedById: session.user.id,
          originalWorkflowId: null, // New workflow, not a branch copy
          version: 1
        }
      });

      // Create queue assignments if provided
      if (queueIds.length > 0) {
        await tx.queueWorkflow.createMany({
          data: queueIds.map((queueId: string) => ({
            queueId,
            workflowId: workflow.id,
            tenantId,
            branchId,
            isActive: true,
            priority: 0
          }))
        });
      }

      return workflow;
    });

    return NextResponse.json({
      workflow: {
        id: result.id,
        name: result.name,
        description: result.description,
        type: result.type,
        steps: result.steps,
        executionSettings: result.executionSettings,
        tenantId: result.tenantId,
        branchId: result.branchId,
        version: result.version,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function isValidWorkflowDefinition(steps: any): steps is WorkflowDefinition {
  if (!steps || typeof steps !== 'object') return false;
  
  // Basic structure validation
  if (!steps.workflow || !steps.nodes || !Array.isArray(steps.nodes)) {
    return false;
  }
  
  // Validate required workflow fields
  if (!steps.workflow.id || !steps.workflow.name) {
    return false;
  }
  
  // Validate nodes structure
  for (const node of steps.nodes) {
    if (!node.id || !node.type || !node.name || !node.position || !node.outputs) {
      return false;
    }
    
    // Validate position
    if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      return false;
    }
  }
  
  return true;
}
