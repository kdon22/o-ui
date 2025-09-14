'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PromptRenderer } from './prompt-renderer';
import type { PromptExecutionData, PromptFormData, SubmitExecutionRequest } from './types';

interface PromptExecutionPageProps {
  executionId: string;
}

export const PromptExecutionPage: React.FC<PromptExecutionPageProps> = ({ executionId }) => {
  const [formData, setFormData] = useState<PromptFormData>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Calculate consistent width for all prompts
  const calculateUniformWidth = (prompts: any[]) => {
    if (prompts.length <= 1) return undefined; // Let single prompts auto-size
    
    let maxWidth = 300; // Minimum width
    
    prompts.forEach(prompt => {
      if (prompt.layout?.items?.length) {
        const promptWidth = prompt.layout.items.reduce((max: number, item: any) => {
          const rightEdge = item.x + (item.config.width || 200);
          return Math.max(max, rightEdge);
        }, 0);
        
        maxWidth = Math.max(maxWidth, promptWidth + 40); // Add padding
      }
    });
    
    return maxWidth;
  };

  // Fetch execution data
  const { data: execution, isLoading, error, refetch } = useQuery({
    queryKey: ['prompt-execution', executionId],
    queryFn: async (): Promise<PromptExecutionData> => {
      const response = await fetch(`/api/prompt/executions/${executionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch execution');
      }
      return response.json();
    },
         refetchInterval: (query) => {
       // Poll every 2 seconds if status is PENDING or RUNNING
       return query.state.data?.status === 'PENDING' || query.state.data?.status === 'RUNNING' ? 2000 : false;
     },
    retry: 3
  });

  // Submit response mutation
  const submitMutation = useMutation({
    mutationFn: async (responseData: Record<string, any>) => {
      const payload: SubmitExecutionRequest = { responseData };
      const response = await fetch(`/api/prompt/executions/${executionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      return response.json();
    },
    onSuccess: () => {
      refetch();
    }
  });

  // Handle form data changes
  const handleFormChange = (data: PromptFormData) => {
    setFormData(data);
    
    // Simple validation - check if required fields are filled
    const validation = data.__validation;
    setIsFormValid(!validation?.missingRequired?.length);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!isFormValid || !execution) return;
    
    // Clean the form data before submitting
    const cleanedData = { ...formData };
    if ('__validation' in cleanedData) {
      delete cleanedData.__validation;
    }
    
    submitMutation.mutate(cleanedData);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading prompt execution...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load the prompt execution. It may have expired or been removed.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!execution) {
    return null;
  }

  // Calculate uniform width for multiple prompts
  const uniformWidth = calculateUniformWidth(execution.prompts);

  // Status-based rendering
  const isExpired = execution.expiresAt && new Date(execution.expiresAt) < new Date();
  const isCompleted = execution.status === 'COMPLETED';
  const isFailed = execution.status === 'FAILED' || execution.status === 'TIMEOUT';
  const isReadOnly = isExpired || isCompleted || isFailed;

  // Status indicator
  const getStatusIndicator = () => {
    switch (execution.status) {
      case 'PENDING':
        return (
          <div className="flex items-center space-x-2 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </div>
        );
      case 'RUNNING':
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Running</span>
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Completed</span>
          </div>
        );
      case 'FAILED':
      case 'TIMEOUT':
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>{execution.status === 'TIMEOUT' ? 'Timed Out' : 'Failed'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-fit mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Prompt Execution</CardTitle>
            {getStatusIndicator()}
          </div>
          {execution.expiresAt && (
            <p className="text-sm text-gray-600">
              Expires: {new Date(execution.expiresAt).toLocaleString()}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Status alerts */}
      {(isExpired || isCompleted || isFailed) && (
        <Alert variant={isFailed ? "destructive" : "default"}>
          <AlertTitle>
            {isExpired && 'Expired'}
            {isCompleted && 'Already Submitted'}
            {isFailed && (execution.status === 'TIMEOUT' ? 'Timed Out' : 'Failed')}
          </AlertTitle>
          <AlertDescription>
            {isExpired && 'This prompt has expired and can no longer be submitted.'}
            {isCompleted && 'This prompt has already been submitted successfully.'}
            {isFailed && 'This prompt execution encountered an error.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Render all prompts */}
      {execution.prompts.map((prompt, index) => (
        <Card key={prompt.id} className="w-fit">
          <CardHeader>
            <CardTitle className="text-lg">
              {execution.prompts.length > 1 && `${index + 1}. `}
              {prompt.promptName}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PromptRenderer
              layout={prompt.layout}
              data={execution.inputData || {}}
              onChange={handleFormChange}
              readOnly={isReadOnly}
              fixedWidth={uniformWidth}
            />
          </CardContent>
        </Card>
      ))}

      {/* Submit footer */}
      {!isReadOnly && (
        <Card>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || submitMutation.isPending}
              className="min-w-[120px]"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Response'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Success message */}
      {isCompleted && execution.responseData && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Response submitted successfully!</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 