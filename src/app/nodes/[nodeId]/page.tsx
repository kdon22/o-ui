'use client';

import { useParams } from 'next/navigation';
import React, { Suspense } from 'react';
import MainLayout from '@/components/layout/main/main-layout';

export default function NodePage() {
  console.log('🟡 [NodePage] COMPONENT RENDER START')
  
  const params = useParams();
  const nodeId = params.nodeId as string;

  console.log('🟡 [NodePage] Params:', { nodeId, params })

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading node details...</p>
        </div>
      </div>
    }>
      <MainLayout initialSelectedNodeId={nodeId} />
    </Suspense>
  );
}