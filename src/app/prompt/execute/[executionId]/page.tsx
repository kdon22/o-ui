import { Suspense } from 'react';
import { PromptExecutionPage } from '@/components/editor/components/prompt/prompt-execution-page';

interface PageProps {
  params: {
    executionId: string;
  };
}

export default function ExecutePage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center">
      <div className="w-full max-w-fit py-8 px-4">
        <Suspense fallback={<div className="text-center">Loading prompt...</div>}>
          <PromptExecutionPage executionId={params.executionId} />
        </Suspense>
      </div>
    </div>
  );
} 