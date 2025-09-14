'use client';

import { useState } from 'react';
import { useActionMutation } from '@/hooks/use-action-api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';

export default function NodeProcessTest() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const createNodeProcessMutation = useActionMutation('node_processes.create');

  const handleCreateNodeProcess = async () => {
    try {
      setError(null);
      setResult(null);
      
      const testData = {
        nodeId: 'root-1',
        processId: '7c4c2eb4-c3ce-48d5-bfa7-4d82d7ba634d', // Use existing process ID
        tenantId: session?.user?.tenantId || '1BD',
        branchId: session?.user?.branchContext?.currentBranchId || 'f-F2m-p6-mYM2PQdrNSOZ'
      };
      
      // Creating NodeProcess
      const result = await createNodeProcessMutation.mutateAsync(testData);
      
      // Success
      setResult(result);
    } catch (error) {
      console.error('🔥 [NodeProcessTest] Error:', error);
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>NodeProcess Creation Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleCreateNodeProcess}
          disabled={createNodeProcessMutation.isPending}
        >
          {createNodeProcessMutation.isPending ? 'Creating...' : 'Create NodeProcess'}
        </Button>
        
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <h3 className="font-bold">Error:</h3>
            <pre className="text-xs mt-2 whitespace-pre-wrap">{error}</pre>
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <h3 className="font-bold">Success!</h3>
            <pre className="text-xs mt-2 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>Session Info:</strong></p>
          <p>Tenant ID: {session?.user?.tenantId}</p>
          <p>Branch ID: {session?.user?.branchContext?.currentBranchId}</p>
        </div>
      </CardContent>
    </Card>
  );
}