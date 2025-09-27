/**
 * Individual Workflow API - Get, Update, Delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import type { WorkflowDefinition } from '@/types/workflow-definition';

interface RouteParams {
  params: {
    workflowId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const branchId = searchParams.get('branchId') || 'main';

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Branch-aware workflow fetch with fallback
    let workflow = await prisma.workflow.findFirst({
      where: {
        id: params.workflowId,
        tenantId,
        branchId, // Try current branch first
        isActive: true
      },
      include: {
        queueWorkflows: {
          where: { isActive: true },
          include: {
            queue: {
              select: { id: true, name: true, type: true }
            }
          }
        },
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            error: true
          }
        }
      }
    });

    // Fallback to default branch if not found in current branch
    if (!workflow && branchId !== 'main') {
      workflow = await prisma.workflow.findFirst({
        where: {
          id: params.workflowId,
          tenantId,
          branchId: 'main',
          isActive: true
        },
        include: {
          queueWorkflows: {
            where: { isActive: true },
            include: {
              queue: {
                select: { id: true, name: true, type: true }
              }
            }
          },
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              status: true,
              startedAt: true,
              completedAt: true,
              error: true
            }
          }
        }
      });
    }

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        type: workflow.type,
        steps: workflow.steps, // Full workflow definition JSON
        executionSettings: workflow.executionSettings,
        isActive: workflow.isActive,
        version: workflow.version,
        tenantId: workflow.tenantId,
        branchId: workflow.branchId,
        originalWorkflowId: workflow.originalWorkflowId,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        
        // Queue assignments
        queues: workflow.queueWorkflows.map(qw => qw.queue),
        
        // Recent executions
        recentExecutions: workflow.executions
      }
    });

  } catch (error) {
    console.error('Failed to fetch workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      steps, // legacy support
      definition, // preferred field
      executionSettings,
      tenantId,
      branchId = 'main',
      queueIds
    } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Validate definition/steps structure if provided
    const defToValidate = definition || steps;
    if (defToValidate && !isValidWorkflowDefinition(defToValidate)) {
      return NextResponse.json(
        { error: 'Invalid workflow definition structure' },
        { status: 400 }
      );
    }

    // Check if workflow exists on current branch
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id: params.workflowId,
        tenantId,
        isActive: true
      }
    });

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Branch-aware update logic (Copy-on-Write if needed)
    const result = await prisma.$transaction(async (tx) => {
      let updatedWorkflow;

      if (existingWorkflow.branchId === branchId) {
        // Update in place - same branch
        updatedWorkflow = await tx.workflow.update({
          where: { id: params.workflowId },
          data: {
            name: name || existingWorkflow.name,
            description: description !== undefined ? description : existingWorkflow.description,
            type: type || existingWorkflow.type,
            // Prefer `definition`; fall back to legacy `steps` for backward compat
            steps: defToValidate !== undefined ? defToValidate : existingWorkflow.steps,
            executionSettings: executionSettings !== undefined ? executionSettings : existingWorkflow.executionSettings,
            updatedById: session.user.id,
            version: existingWorkflow.version + 1
          }
        });
      } else {
        // Copy-on-Write - create new version for current branch
        updatedWorkflow = await tx.workflow.create({
          data: {
            name: name || existingWorkflow.name,
            description: description !== undefined ? description : existingWorkflow.description,
            type: type || existingWorkflow.type,
            steps: steps !== undefined ? steps : existingWorkflow.steps,
            executionSettings: executionSettings !== undefined ? executionSettings : existingWorkflow.executionSettings,
            tenantId,
            branchId,
            originalWorkflowId: existingWorkflow.id,
            createdById: session.user.id,
            updatedById: session.user.id,
            version: 1 // New branch version starts at 1
          }
        });

        // Copy queue assignments to new branch version
        const queueAssignments = await tx.queueWorkflow.findMany({
          where: {
            workflowId: existingWorkflow.id,
            isActive: true
          }
        });

        if (queueAssignments.length > 0) {
          await tx.queueWorkflow.createMany({
            data: queueAssignments.map(qa => ({
              queueId: qa.queueId,
              workflowId: updatedWorkflow.id,
              tenantId,
              branchId,
              isActive: true,
              priority: qa.priority
            }))
          });
        }
      }

      // Update queue assignments if provided
      if (queueIds !== undefined) {
        // Remove existing assignments
        await tx.queueWorkflow.updateMany({
          where: {
            workflowId: updatedWorkflow.id,
            branchId
          },
          data: { isActive: false }
        });

        // Add new assignments
        if (queueIds.length > 0) {
          await tx.queueWorkflow.createMany({
            data: queueIds.map((queueId: string) => ({
              queueId,
              workflowId: updatedWorkflow.id,
              tenantId,
              branchId,
              isActive: true,
              priority: 0
            })),
            skipDuplicates: true
          });
        }
      }

      return updatedWorkflow;
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
    });

  } catch (error) {
    console.error('Failed to update workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const branchId = searchParams.get('branchId') || 'main';

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // Branch-aware soft delete
    const deletedWorkflow = await prisma.workflow.updateMany({
      where: {
        id: params.workflowId,
        tenantId,
        branchId,
        isActive: true
      },
      data: {
        isActive: false,
        updatedById: session.user.id
      }
    });

    if (deletedWorkflow.count === 0) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Also deactivate queue assignments
    await prisma.queueWorkflow.updateMany({
      where: {
        workflowId: params.workflowId,
        branchId
      },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
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
