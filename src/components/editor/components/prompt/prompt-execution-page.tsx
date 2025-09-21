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
  initialData?: PromptExecutionData;
}

export const PromptExecutionPage: React.FC<PromptExecutionPageProps> = ({ executionId, initialData }) => {
  const [formData, setFormData] = useState<PromptFormData>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Auto-size prompts: no forced uniform width; let content determine size

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
    initialData,
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
    // Merge incoming prompt data into the aggregate formData (support multiple prompts)
    const { __validation, ...rest } = data || {};
    setFormData(prev => ({ ...prev, ...rest }));
    try {
      // Debug: log each change with current values snapshot
      const dbg = { ...rest } as Record<string, any>;
      if ('__validation' in dbg) delete (dbg as any).__validation;
      // eslint-disable-next-line no-console
      console.log('[Prompt] onChange data:', dbg);
    } catch {}
    
    // Simple validation - check if required fields are filled
    const validation = __validation;
    setIsFormValid(!validation?.missingRequired?.length);
  };

  // Ensure defaults are saved into formData if not present (select/radio isDefault, checkbox default false)
  useEffect(() => {
    if (!execution?.prompts?.length) return;
    const next: Record<string, any> = { ...formData };
    let changed = false;
    execution.prompts.forEach((p) => {
      const items = (p.layout?.items || []) as Array<any>;
      items.forEach((item) => {
        const id = item?.config?.componentId || item?.id;
        if (!id) return;
        const type = item?.type as string;
        if (next[id] !== undefined) return;
        if (type === 'checkbox') {
          next[id] = false; changed = true;
        } else if (type === 'select' || type === 'radio') {
          const def = item?.config?.options?.find((o: any) => o.isDefault)?.value;
          if (def !== undefined && def !== null && def !== '') { next[id] = def; changed = true; }
        }
      });
    });
    if (changed) {
      setFormData(prev => ({ ...prev, ...next }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execution?.prompts]);

  // Handle form submission
  const handleSubmit = () => {
    if (!isFormValid || !execution) return;
    
    // Clean the form data before submitting
    const cleanedData = { ...formData } as Record<string, any>;
    const validation = cleanedData.__validation;
    if ('__validation' in cleanedData) {
      delete cleanedData.__validation;
    }
    // eslint-disable-next-line no-console
    console.log('[Prompt] handleSubmit cleanedData:', cleanedData);

    // Build structured response with fields + flat values map per prompt (no summary)
    const submittedAt = new Date().toISOString();
    const responsePayload = execution.prompts.map((prompt) => {
      const items = (prompt.layout?.items || []) as Array<any>;

      const fields = items.map((item) => {
        const id = item?.config?.componentId || item?.id;
        const type = item?.type as string;
        const label = item?.config?.label || item?.label || '';
        const isRequired = Boolean(item?.config?.required);
        const errorMsg = validation?.errors?.[id];
        const base = {
          id,
          type,
          label,
          isRequired,
          errors: errorMsg ? [errorMsg] : [],
        } as any;

        switch (type) {
          case 'label':
            return { ...base, text: label, isAnswerable: false };
          case 'divider':
            return { ...base, label: 'Divider', isAnswerable: false };
          case 'text-input': {
            const value = cleanedData[id] ?? '';
            return { ...base, value, isAnswered: value !== '' };
          }
          case 'select': {
            const options = (item?.config?.options || []).map((o: any) => ({ id: o.value, label: o.label }));
            const value = cleanedData[id] ?? '';
            const selected = options.find((o: any) => o.id === value);
            return { ...base, options, value, displayText: selected?.label, isAnswered: value !== '' };
          }
          case 'radio': {
            const options = (item?.config?.options || []).map((o: any) => ({ id: o.value, label: o.label }));
            const value = cleanedData[id] ?? '';
            const selected = options.find((o: any) => o.id === value);
            return { ...base, options, value, displayText: selected?.label, isAnswered: value !== '' };
          }
          case 'checkbox': {
            const value = cleanedData[id] === true;
            return { ...base, value, isAnswered: cleanedData[id] !== undefined };
          }
          case 'table': {
            const tableBinding = ((execution.inputData as any)?.bindings?.[prompt.promptName]?.[id]) || {};
            const rows: any[] = Array.isArray(tableBinding?.rows) ? tableBinding.rows : [];
            const selection = tableBinding?.selection || { mode: 'none' };
            const mode: 'none' | 'single' | 'multi' = selection?.mode || 'none';
            let selectedRows: any[] = [];
            let selectedIndices: number[] = [];
            const raw = cleanedData[id];
            if (mode === 'single' && typeof raw === 'number') {
              selectedRows = rows[raw] ? [rows[raw]] : [];
              selectedIndices = Number.isInteger(raw) ? [raw] : [];
            } else if (mode === 'multi' && Array.isArray(raw)) {
              selectedRows = (raw as number[]).map((i) => rows[i]).filter(Boolean);
              selectedIndices = (raw as number[]).filter((i) => Number.isInteger(i));
            }
            return { ...base, isAnswerable: mode !== 'none', value: selectedRows, selectedIndices };
          }
          default:
            return base;
        }
      });

      // Values map: id -> raw submitted value (answerable fields only)
      const values = fields.reduce((acc: Record<string, any>, f: any) => {
        if (f.isAnswerable === false) return acc;
        acc[f.id] = f.value;
        return acc;
      }, {} as Record<string, any>);
      // eslint-disable-next-line no-console
      console.log(`[Prompt] built values for ${prompt.promptName}:`, values);

      return {
        prompt: prompt.promptName,
        executionId: execution.id,
        status: 'COMPLETED',
        submittedAt,
        error: null,
        fields,
        values
      };
    });

    submitMutation.mutate(responsePayload as unknown as Record<string, any>);
  };

  // Loading state (if we had initialData, this branch typically won't run)
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

  // We no longer enforce a uniform width; allow each prompt to size naturally

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
      {execution.prompts.map((prompt) => (
        <Card key={prompt.id} className="w-fit">
          <CardContent className="p-0">
            <PromptRenderer
              layout={prompt.layout}
              data={{}}
              bindings={(execution.inputData as any)?.bindings?.[prompt.promptName] || {}}
              onChange={handleFormChange}
              readOnly={isReadOnly}
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