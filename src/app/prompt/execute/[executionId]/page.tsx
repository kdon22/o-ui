import { Suspense } from 'react';
import { PromptExecutionPage } from '@/components/editor/components/prompt/prompt-execution-page';

// Run edge-fast and as dynamic; we SSR the execution for instant first paint
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    executionId: string;
  };
}

export default async function ExecutePage({ params }: PageProps) {
  const { executionId } = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center">
      <div className="w-full max-w-fit py-8 px-4">
        <Suspense fallback={<div className="text-center">Loading prompt...</div>}>
          <PromptExecutionPage executionId={executionId} />
        </Suspense>
      </div>
    </div>
  );
}