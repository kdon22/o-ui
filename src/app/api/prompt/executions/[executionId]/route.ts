import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { PromptExecutionData, SubmitExecutionRequest } from '@/components/editor/components/prompt/types';

interface RouteParams {
  params: {
    executionId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { executionId } = params;

    const execution = await prisma.promptExecution.findUnique({
      where: { id: executionId },
      include: {
        prompts: {
          include: {
            prompt: true
          },
          orderBy: {
            order: 'asc'
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

    // Check if execution has expired
    if (execution.expiresAt && new Date() > execution.expiresAt) {
      await prisma.promptExecution.update({
        where: { id: executionId },
        data: { status: 'TIMEOUT' }
      });
      execution.status = 'TIMEOUT';
    }

    const response: PromptExecutionData = {
      id: execution.id,
      status: execution.status as PromptExecutionData['status'],
      inputData: execution.inputData as Record<string, any> || {},
      responseData: execution.responseData as Record<string, any> || {},
      executionUrl: execution.executionUrl || undefined,
      startedAt: execution.startedAt?.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
      expiresAt: execution.expiresAt?.toISOString(),
      prompts: execution.prompts.map(ep => ({
        id: ep.prompt.id,
        promptName: ep.prompt.promptName,
        layout: ep.prompt.layout as any || { items: [], canvasWidth: 800, canvasHeight: 600 },
        order: ep.order
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching execution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { executionId } = params;
    const body: SubmitExecutionRequest = await request.json();

    const execution = await prisma.promptExecution.findUnique({
      where: { id: executionId }
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Check if execution has expired
    if (execution.expiresAt && new Date() > execution.expiresAt) {
      return NextResponse.json(
        { error: 'Execution has expired' },
        { status: 410 }
      );
    }

    // Check if already completed
    if (execution.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Execution already completed' },
        { status: 409 }
      );
    }

    // Update execution with response data
    const updatedExecution = await prisma.promptExecution.update({
      where: { id: executionId },
      data: {
        status: 'COMPLETED',
        responseData: body.responseData,
        completedAt: new Date()
      }
    });

    return NextResponse.json({
      id: updatedExecution.id,
      status: updatedExecution.status,
      completedAt: updatedExecution.completedAt?.toISOString()
    });

  } catch (error) {
    console.error('Error submitting execution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 