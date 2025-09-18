import { Suspense } from 'react';
import { PromptExecutionPage } from '@/components/editor/components/prompt/prompt-execution-page';
import { prisma } from '@/lib/prisma';
import type { PromptExecutionData } from '@/components/editor/components/prompt/types';

// Run edge-fast and as dynamic; we SSR the execution for instant first paint
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    executionId: string;
  };
}

export default async function ExecutePage({ params }: PageProps) {
  // Fetch execution on the server to provide initialData to the client
  const execution = await prisma.promptExecution.findUnique({
    where: { id: params.executionId },
    include: {
      prompts: {
        include: { prompt: true },
        orderBy: { order: 'asc' }
      }
    }
  });

  let initialData: PromptExecutionData | undefined;
  if (execution) {
    initialData = {
      id: execution.id,
      status: execution.status as PromptExecutionData['status'],
      inputData: (execution.inputData as Record<string, any>) || {},
      responseData: (execution.responseData as Record<string, any>) || {},
      executionUrl: execution.executionUrl || undefined,
      startedAt: execution.startedAt?.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
      expiresAt: execution.expiresAt?.toISOString(),
      prompts: execution.prompts.map((ep) => ({
        id: ep.prompt.id,
        promptName: ep.prompt.promptName,
        layout: (ep.prompt.layout as any) || { items: [], canvasWidth: 800, canvasHeight: 600 },
        order: ep.order
      }))
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center">
      <div className="w-full max-w-fit py-8 px-4">
        <Suspense fallback={<div className="text-center">Loading prompt...</div>}>
          <PromptExecutionPage executionId={params.executionId} initialData={initialData} />
        </Suspense>
      </div>
    </div>
  );
}