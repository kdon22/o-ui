# Developer Examples - Practical Usage Patterns

## 🎯 **Overview**

This document provides practical, real-world examples of using the Unified Action System with Junction Creation. Each example includes complete code with explanations and best practices.

## 🏗️ **Basic CRUD Operations**

### **Example 1: Simple Entity Creation**

```typescript
// components/ProcessCreator.tsx
import { useState } from 'react';
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ProcessCreatorProps {
  nodeId?: string;  // Optional: if creating from Node context
  onProcessCreated?: (process: any) => void;
}

export function ProcessCreator({ nodeId, onProcessCreated }: ProcessCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (processData: any) => {
    console.log('Process created:', processData);
    
    // Close modal
    setIsOpen(false);
    
    // Notify parent component
    onProcessCreated?.(processData);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create Process</Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <AutoForm
          schema={PROCESS_SCHEMA}
          mode="create"
          navigationContext={nodeId ? { nodeId } : undefined}
          enableJunctionCreation={!!nodeId}  // Enable only if in Node context
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}

// Usage in Node page
function NodeDetailsPage({ nodeId }: { nodeId: string }) {
  const handleProcessCreated = (process: any) => {
    // Refresh process list or show success message
    console.log('New process created:', process.name);
    // The NodeProcess junction was created automatically
  };

  return (
    <div>
      <h1>Node Details</h1>
      
      <ProcessCreator 
        nodeId={nodeId}
        onProcessCreated={handleProcessCreated}
      />
      
      {/* Process list will automatically show the new process */}
      <ProcessList nodeId={nodeId} />
    </div>
  );
}
```

### **Example 2: Entity List with Actions**

```typescript
// components/ProcessList.tsx
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Play } from 'lucide-react';

interface ProcessListProps {
  nodeId?: string;  // Optional: filter by node
}

export function ProcessList({ nodeId }: ProcessListProps) {
  // Fetch processes with optional node filtering
  const { 
    data: processes, 
    isLoading, 
    error, 
    refetch 
  } = useActionQuery({
    action: 'process.list',
    data: nodeId ? { nodeId } : {},
    options: { 
      limit: 50,
      orderBy: 'name',
      direction: 'asc'
    },
    queryKey: ['processes', nodeId],
    enabled: true
  });

  // Delete mutation
  const deleteProcess = useActionMutation({
    action: 'process.delete',
    onSuccess: () => {
      console.log('Process deleted successfully');
      refetch(); // Refresh the list
    },
    onError: (error) => {
      console.error('Failed to delete process:', error);
    }
  });

  // Update mutation
  const updateProcess = useActionMutation({
    action: 'process.update',
    onSuccess: (data) => {
      console.log('Process updated:', data);
      refetch(); // Refresh the list
    }
  });

  const handleDelete = async (processId: string) => {
    if (confirm('Are you sure you want to delete this process?')) {
      await deleteProcess.mutateAsync({ id: processId });
    }
  };

  const handleToggleActive = async (process: any) => {
    await updateProcess.mutateAsync({
      id: process.id,
      isActive: !process.isActive
    });
  };

  if (isLoading) {
    return <div className="p-4">Loading processes...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading processes: {error.message}
        <Button onClick={() => refetch()} className="ml-2">
          Retry
        </Button>
      </div>
    );
  }

  if (!processes?.length) {
    return (
      <div className="p-4 text-gray-500">
        No processes found. {nodeId && 'Create one using the button above.'}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {processes.map((process) => (
        <Card key={process.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{process.name}</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={process.isActive ? "default" : "outline"}
                onClick={() => handleToggleActive(process)}
                disabled={updateProcess.isPending}
              >
                <Play className="h-4 w-4" />
                {process.isActive ? 'Active' : 'Inactive'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => {/* Open edit modal */}}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(process.id)}
                disabled={deleteProcess.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          {process.description && (
            <CardContent>
              <p className="text-gray-600">{process.description}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
```

## 🔗 **Junction Creation Examples**

### **Example 3: Multi-Level Relationship Creation**

```typescript
// components/RuleCreator.tsx
import { useState } from 'react';
import { useContextualCreate } from '@/lib/junction-orchestration';
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { RULE_SCHEMA } from '@/features/rules/rules.schema';

interface RuleCreatorProps {
  processId: string;  // Creating rule from process context
}

export function RuleCreator({ processId }: RuleCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Using contextual create hook directly for more control
  const contextualCreate = useContextualCreate(
    'rule',
    { processId },  // Process context for ProcessRule junction
    {
      onSuccess: (result) => {
        console.log('Rule and junction created:', {
          rule: result.entity.data,
          junctionCreated: result.junctionCreated,
          junction: result.junction?.data
        });
        setIsOpen(false);
      },
      onError: (error) => {
        console.error('Rule creation failed:', error);
      }
    }
  );

  const handleSubmit = async (ruleData: any) => {
    // This will create both Rule and ProcessRule junction
    await contextualCreate.mutateAsync({
      name: ruleData.name,
      description: ruleData.description,
      ruleCode: ruleData.ruleCode,
      isActive: true
    });
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Add Rule to Process
      </Button>

      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <AutoForm
              schema={RULE_SCHEMA}
              mode="create"
              navigationContext={{ processId }}
              enableJunctionCreation={true}
              onSubmit={handleSubmit}
              onCancel={() => setIsOpen(false)}
              isLoading={contextualCreate.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Usage: Process details page with rule management
function ProcessDetailsPage({ processId }: { processId: string }) {
  return (
    <div className="space-y-6">
      <ProcessInfo processId={processId} />
      
      <div>
        <h2>Rules</h2>
        <RuleCreator processId={processId} />
        <RuleList processId={processId} />
      </div>
    </div>
  );
}
```

### **Example 4: Complex Workflow Creation**

```typescript
// components/WorkflowBuilder.tsx
import { useState } from 'react';
import { useActionMutation } from '@/hooks/use-action-api';
import { useContextualCreate } from '@/lib/junction-orchestration';

interface WorkflowBuilderProps {
  nodeId: string;
}

export function WorkflowBuilder({ nodeId }: WorkflowBuilderProps) {
  const [workflow, setWorkflow] = useState<any>(null);
  const [processes, setProcesses] = useState<any[]>([]);

  // Create workflow with node junction
  const createWorkflow = useContextualCreate(
    'workflow',
    { nodeId },
    {
      onSuccess: (result) => {
        console.log('Workflow created with node junction:', result);
        setWorkflow(result.entity.data);
      }
    }
  );

  // Add processes to workflow
  const addProcessToWorkflow = useActionMutation({
    action: 'workflowProcesses.create',
    onSuccess: (data) => {
      console.log('Process added to workflow:', data);
      setProcesses(prev => [...prev, data]);
    }
  });

  const handleCreateWorkflow = async (workflowData: any) => {
    // Creates Workflow + NodeWorkflow junction
    await createWorkflow.mutateAsync(workflowData);
  };

  const handleAddProcess = async (processId: string, sequence: number) => {
    if (!workflow) return;

    // Create WorkflowProcess junction manually
    await addProcessToWorkflow.mutateAsync({
      workflowId: workflow.id,
      processId,
      sequence,
      tenantId: workflow.tenantId,
      branchId: workflow.branchId
    });
  };

  return (
    <div className="space-y-4">
      {!workflow ? (
        <AutoForm
          schema={WORKFLOW_SCHEMA}
          mode="create"
          navigationContext={{ nodeId }}
          enableJunctionCreation={true}
          onSubmit={handleCreateWorkflow}
          onCancel={() => {}}
        />
      ) : (
        <div>
          <h3>Workflow: {workflow.name}</h3>
          
          <ProcessSelector
            onProcessSelected={(processId) => 
              handleAddProcess(processId, processes.length + 1)
            }
          />
          
          <WorkflowProcessList
            workflowId={workflow.id}
            processes={processes}
          />
        </div>
      )}
    </div>
  );
}
```

## 🎣 **Custom Hook Patterns**

### **Example 5: Domain-Specific Data Hook**

```typescript
// hooks/useProcessManagement.ts
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { useContextualCreate } from '@/lib/junction-orchestration';
import { useQueryClient } from '@tanstack/react-query';

interface ProcessManagementOptions {
  nodeId?: string;
  autoRefresh?: boolean;
}

export function useProcessManagement(options: ProcessManagementOptions = {}) {
  const { nodeId, autoRefresh = true } = options;
  const queryClient = useQueryClient();

  // Query for processes
  const processesQuery = useActionQuery({
    action: 'process.list',
    data: nodeId ? { nodeId } : {},
    options: { 
      limit: 100,
      orderBy: 'name'
    },
    queryKey: ['processes', nodeId],
    refetchInterval: autoRefresh ? 30000 : false  // Refresh every 30s
  });

  // Create process with junction
  const createProcess = useContextualCreate(
    'process',
    nodeId ? { nodeId } : {},
    {
      onSuccess: () => {
        if (autoRefresh) {
          queryClient.invalidateQueries(['processes']);
        }
      }
    }
  );

  // Update process
  const updateProcess = useActionMutation({
    action: 'process.update',
    onSuccess: () => {
      if (autoRefresh) {
        queryClient.invalidateQueries(['processes']);
      }
    }
  });

  // Delete process
  const deleteProcess = useActionMutation({
    action: 'process.delete',
    onSuccess: () => {
      if (autoRefresh) {
        queryClient.invalidateQueries(['processes']);
      }
    }
  });

  // Bulk operations
  const bulkUpdateProcesses = useActionMutation({
    action: 'process.bulkUpdate',
    onSuccess: () => {
      if (autoRefresh) {
        queryClient.invalidateQueries(['processes']);
      }
    }
  });

  // Helper functions
  const toggleProcessActive = async (processId: string, isActive: boolean) => {
    return updateProcess.mutateAsync({
      id: processId,
      isActive: !isActive
    });
  };

  const duplicateProcess = async (originalProcess: any) => {
    return createProcess.mutateAsync({
      ...originalProcess,
      name: `${originalProcess.name} (Copy)`,
      id: undefined,  // Remove ID to create new
      createdAt: undefined,
      updatedAt: undefined
    });
  };

  return {
    // Data
    processes: processesQuery.data || [],
    isLoading: processesQuery.isLoading,
    error: processesQuery.error,
    
    // Actions
    createProcess: createProcess.mutateAsync,
    updateProcess: updateProcess.mutateAsync,
    deleteProcess: deleteProcess.mutateAsync,
    bulkUpdate: bulkUpdateProcesses.mutateAsync,
    
    // Helpers
    toggleProcessActive,
    duplicateProcess,
    refetch: processesQuery.refetch,
    
    // Status
    isCreating: createProcess.isPending,
    isUpdating: updateProcess.isPending,
    isDeleting: deleteProcess.isPending
  };
}

// Usage in component
function ProcessManagementPage({ nodeId }: { nodeId: string }) {
  const {
    processes,
    isLoading,
    createProcess,
    updateProcess,
    deleteProcess,
    toggleProcessActive,
    duplicateProcess,
    isCreating
  } = useProcessManagement({ nodeId, autoRefresh: true });

  const handleQuickCreate = async () => {
    await createProcess({
      name: 'Quick Process',
      description: 'Created via quick action',
      isActive: true
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Button onClick={handleQuickCreate} disabled={isCreating}>
        Quick Create Process
      </Button>
      
      {processes.map(process => (
        <ProcessCard
          key={process.id}
          process={process}
          onToggleActive={() => toggleProcessActive(process.id, process.isActive)}
          onDuplicate={() => duplicateProcess(process)}
          onDelete={() => deleteProcess({ id: process.id })}
        />
      ))}
    </div>
  );
}
```

### **Example 6: Real-Time Data Hook**

```typescript
// hooks/useRealtimeProcesses.ts
import { useActionQuery } from '@/hooks/use-action-api';
import { useEffect, useState } from 'react';

interface RealtimeProcessesOptions {
  nodeId?: string;
  pollInterval?: number;
  enableWebSocket?: boolean;
}

export function useRealtimeProcesses(options: RealtimeProcessesOptions = {}) {
  const { nodeId, pollInterval = 5000, enableWebSocket = false } = options;
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Base query with polling
  const processesQuery = useActionQuery({
    action: 'process.list',
    data: nodeId ? { nodeId } : {},
    queryKey: ['processes', 'realtime', nodeId],
    refetchInterval: pollInterval,
    refetchIntervalInBackground: true
  });

  // WebSocket connection (if enabled)
  useEffect(() => {
    if (!enableWebSocket) return;

    setConnectionStatus('connecting');
    
    const ws = new WebSocket(`ws://localhost:3000/api/realtime/processes${nodeId ? `?nodeId=${nodeId}` : ''}`);
    
    ws.onopen = () => {
      setConnectionStatus('connected');
      console.log('WebSocket connected for realtime processes');
    };
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      // Update the query cache with real-time data
      processesQuery.refetch();
      
      console.log('Realtime process update:', update);
    };
    
    ws.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      setConnectionStatus('disconnected');
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [enableWebSocket, nodeId]);

  return {
    processes: processesQuery.data || [],
    isLoading: processesQuery.isLoading,
    error: processesQuery.error,
    connectionStatus,
    lastUpdated: processesQuery.dataUpdatedAt,
    refetch: processesQuery.refetch
  };
}

// Usage with real-time updates
function RealtimeProcessDashboard({ nodeId }: { nodeId: string }) {
  const { 
    processes, 
    isLoading, 
    connectionStatus, 
    lastUpdated 
  } = useRealtimeProcesses({ 
    nodeId, 
    pollInterval: 3000, 
    enableWebSocket: true 
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500' : 
          connectionStatus === 'connecting' ? 'bg-yellow-500' : 
          'bg-red-500'
        }`} />
        <span className="text-sm text-gray-600">
          {connectionStatus} • Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      </div>
      
      {isLoading ? (
        <div>Loading processes...</div>
      ) : (
        <ProcessList processes={processes} realtime />
      )}
    </div>
  );
}
```

## 🎯 **Advanced Patterns**

### **Example 7: Batch Operations with Progress**

```typescript
// components/BatchProcessManager.tsx
import { useState } from 'react';
import { useActionMutation } from '@/hooks/use-action-api';
import { Progress } from '@/components/ui/progress';

interface BatchOperation {
  id: string;
  action: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export function BatchProcessManager({ nodeId }: { nodeId: string }) {
  const [operations, setOperations] = useState<BatchOperation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const createProcess = useActionMutation({
    action: 'process.create'
  });

  const addOperation = (processData: any) => {
    const operation: BatchOperation = {
      id: Math.random().toString(36),
      action: 'process.create',
      data: { ...processData, nodeId },
      status: 'pending'
    };
    
    setOperations(prev => [...prev, operation]);
  };

  const processBatch = async () => {
    setIsProcessing(true);
    
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      if (operation.status !== 'pending') continue;
      
      // Update status to processing
      setOperations(prev => prev.map(op => 
        op.id === operation.id 
          ? { ...op, status: 'processing' }
          : op
      ));
      
      try {
        // Execute the operation
        await createProcess.mutateAsync(operation.data);
        
        // Mark as completed
        setOperations(prev => prev.map(op => 
          op.id === operation.id 
            ? { ...op, status: 'completed' }
            : op
        ));
        
      } catch (error: any) {
        // Mark as failed
        setOperations(prev => prev.map(op => 
          op.id === operation.id 
            ? { ...op, status: 'failed', error: error.message }
            : op
        ));
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsProcessing(false);
  };

  const completedCount = operations.filter(op => op.status === 'completed').length;
  const failedCount = operations.filter(op => op.status === 'failed').length;
  const progress = operations.length > 0 ? ((completedCount + failedCount) / operations.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={() => addOperation({ 
            name: `Process ${operations.length + 1}`,
            description: 'Batch created process'
          })}
          disabled={isProcessing}
        >
          Add Process
        </Button>
        
        <Button 
          onClick={processBatch}
          disabled={operations.length === 0 || isProcessing}
        >
          Process Batch ({operations.length})
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => setOperations([])}
          disabled={isProcessing}
        >
          Clear
        </Button>
      </div>
      
      {operations.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress: {completedCount}/{operations.length}</span>
            <span>Failed: {failedCount}</span>
          </div>
          
          <Progress value={progress} />
          
          <div className="max-h-40 overflow-y-auto space-y-1">
            {operations.map(operation => (
              <div 
                key={operation.id}
                className={`p-2 rounded text-sm ${
                  operation.status === 'completed' ? 'bg-green-50 text-green-700' :
                  operation.status === 'failed' ? 'bg-red-50 text-red-700' :
                  operation.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex justify-between">
                  <span>{operation.data.name}</span>
                  <span className="capitalize">{operation.status}</span>
                </div>
                {operation.error && (
                  <div className="text-xs text-red-600 mt-1">
                    {operation.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### **Example 8: Conditional Junction Creation**

```typescript
// components/SmartEntityCreator.tsx
import { useState } from 'react';
import { useContextualCreate } from '@/lib/junction-orchestration';

interface SmartEntityCreatorProps {
  entityType: 'process' | 'rule' | 'workflow';
  context: {
    nodeId?: string;
    processId?: string;
    workflowId?: string;
  };
}

export function SmartEntityCreator({ entityType, context }: SmartEntityCreatorProps) {
  const [createWithJunction, setCreateWithJunction] = useState(true);

  // Determine if junction creation is possible
  const canCreateJunction = () => {
    if (entityType === 'process' && context.nodeId) return true;
    if (entityType === 'rule' && context.processId) return true;
    if (entityType === 'workflow' && context.nodeId) return true;
    return false;
  };

  // Contextual create with junction
  const contextualCreate = useContextualCreate(
    entityType,
    context,
    {
      onSuccess: (result) => {
        console.log('Smart creation completed:', {
          entity: result.entity.data,
          junctionCreated: result.junctionCreated,
          expectedJunction: createWithJunction && canCreateJunction()
        });
      }
    }
  );

  // Regular create without junction
  const regularCreate = useActionMutation({
    action: `${entityType}.create`,
    onSuccess: (data) => {
      console.log('Regular creation completed:', data);
    }
  });

  const handleSubmit = async (formData: any) => {
    if (createWithJunction && canCreateJunction()) {
      // Use contextual create for automatic junction
      await contextualCreate.mutateAsync(formData);
    } else {
      // Use regular create
      await regularCreate.mutateAsync(formData);
    }
  };

  const getJunctionDescription = () => {
    if (entityType === 'process' && context.nodeId) {
      return 'Will create NodeProcess junction';
    }
    if (entityType === 'rule' && context.processId) {
      return 'Will create ProcessRule junction';
    }
    if (entityType === 'workflow' && context.nodeId) {
      return 'Will create NodeWorkflow junction';
    }
    return 'No junction will be created';
  };

  return (
    <div className="space-y-4">
      {canCreateJunction() && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="createJunction"
            checked={createWithJunction}
            onChange={(e) => setCreateWithJunction(e.target.checked)}
          />
          <label htmlFor="createJunction" className="text-sm">
            Create relationship automatically
          </label>
          <span className="text-xs text-gray-500">
            ({getJunctionDescription()})
          </span>
        </div>
      )}

      <AutoForm
        schema={getSchemaForEntityType(entityType)}
        mode="create"
        navigationContext={createWithJunction ? context : undefined}
        enableJunctionCreation={createWithJunction && canCreateJunction()}
        onSubmit={handleSubmit}
        isLoading={
          (createWithJunction ? contextualCreate.isPending : regularCreate.isPending)
        }
      />
    </div>
  );
}

// Helper function to get schema
function getSchemaForEntityType(entityType: string) {
  switch (entityType) {
    case 'process': return PROCESS_SCHEMA;
    case 'rule': return RULE_SCHEMA;
    case 'workflow': return WORKFLOW_SCHEMA;
    default: throw new Error(`Unknown entity type: ${entityType}`);
  }
}
```

### **Example 9: Multi-Step Entity Creation Wizard**

```typescript
// components/ProcessCreationWizard.tsx
import { useState } from 'react';
import { useContextualCreate } from '@/lib/junction-orchestration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  data?: any;
}

export function ProcessCreationWizard({ nodeId }: { nodeId: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<WizardStep[]>([
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Process name and description',
      completed: false
    },
    {
      id: 'rules',
      title: 'Add Rules',
      description: 'Select or create rules for this process',
      completed: false
    },
    {
      id: 'settings',
      title: 'Configuration',
      description: 'Process settings and parameters',
      completed: false
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Review and create the process',
      completed: false
    }
  ]);

  const [processData, setProcessData] = useState<any>({});
  const [selectedRules, setSelectedRules] = useState<string[]>([]);

  // Create process with junction
  const createProcess = useContextualCreate(
    'process',
    { nodeId },
    {
      onSuccess: async (result) => {
        console.log('Process created:', result.entity.data);
        
        // Create ProcessRule junctions for selected rules
        for (const ruleId of selectedRules) {
          await createProcessRule.mutateAsync({
            processId: result.entity.data.id,
            ruleId,
            order: selectedRules.indexOf(ruleId) + 1,
            isActive: true
          });
        }
        
        // Mark final step as completed
        markStepCompleted('review');
      }
    }
  );

  // Create process-rule junctions
  const createProcessRule = useActionMutation({
    action: 'processRules.create'
  });

  const markStepCompleted = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const handleStepSubmit = (stepId: string, data: any) => {
    // Update step data
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, completed: true, data }
        : step
    ));

    // Update process data
    if (stepId === 'basic') {
      setProcessData(prev => ({ ...prev, ...data }));
    } else if (stepId === 'rules') {
      setSelectedRules(data.ruleIds || []);
    } else if (stepId === 'settings') {
      setProcessData(prev => ({ ...prev, settings: data }));
    }

    // Move to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinalCreate = async () => {
    const finalProcessData = {
      ...processData,
      nodeId,
      isActive: true
    };

    await createProcess.mutateAsync(finalProcessData);
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const allPreviousStepsCompleted = steps.slice(0, currentStep).every(step => step.completed);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center space-x-2 ${
              index <= currentStep ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {step.completed ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Circle className="h-6 w-6" />
              )}
              <div>
                <div className="font-medium">{step.title}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 mx-4 text-gray-400" />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <BasicInfoStep 
              onSubmit={(data) => handleStepSubmit('basic', data)}
              initialData={processData}
            />
          )}
          
          {currentStep === 1 && (
            <RuleSelectionStep 
              onSubmit={(data) => handleStepSubmit('rules', data)}
              selectedRules={selectedRules}
            />
          )}
          
          {currentStep === 2 && (
            <SettingsStep 
              onSubmit={(data) => handleStepSubmit('settings', data)}
              initialData={processData.settings}
            />
          )}
          
          {currentStep === 3 && (
            <ReviewStep 
              processData={processData}
              selectedRules={selectedRules}
              onConfirm={handleFinalCreate}
              isCreating={createProcess.isPending}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        {!isLastStep && (
          <Button
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={!allPreviousStepsCompleted}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

// Step components would be implemented separately
function BasicInfoStep({ onSubmit, initialData }: any) {
  // Form for basic process information
  return <div>Basic Info Form</div>;
}

function RuleSelectionStep({ onSubmit, selectedRules }: any) {
  // Rule selection interface
  return <div>Rule Selection</div>;
}

function SettingsStep({ onSubmit, initialData }: any) {
  // Process settings form
  return <div>Settings Form</div>;
}

function ReviewStep({ processData, selectedRules, onConfirm, isCreating }: any) {
  // Review all data before creation
  return (
    <div className="space-y-4">
      <div>Review Content</div>
      <Button onClick={onConfirm} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create Process'}
      </Button>
    </div>
  );
}
```

## 🎯 **Best Practices Summary**

### **1. Always Use Schema-Driven Components**
```typescript
// ✅ Good
<AutoForm schema={PROCESS_SCHEMA} mode="create" />

// ❌ Bad
<form><input name="name" /></form>
```

### **2. Enable Junction Creation Appropriately**
```typescript
// ✅ Good: Enable when context is available
<AutoForm 
  enableJunctionCreation={!!nodeId}
  navigationContext={{ nodeId }}
/>

// ❌ Bad: Always enabled without context
<AutoForm enableJunctionCreation={true} />
```

### **3. Handle Loading and Error States**
```typescript
// ✅ Good: Comprehensive state handling
const { data, isLoading, error } = useActionQuery({...});
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

// ❌ Bad: No loading/error handling
const { data } = useActionQuery({...});
return <div>{data.map(...)}</div>;
```

### **4. Use Appropriate Hooks for Use Cases**
```typescript
// ✅ Good: Use contextual create for junction scenarios
const create = useContextualCreate('process', { nodeId });

// ✅ Good: Use regular mutation for simple operations
const update = useActionMutation({ action: 'process.update' });

// ❌ Bad: Manual junction creation
const createProcess = useActionMutation({ action: 'process.create' });
const createJunction = useActionMutation({ action: 'nodeProcesses.create' });
```

### **5. Provide User Feedback**
```typescript
// ✅ Good: Clear feedback and error handling
const mutation = useActionMutation({
  action: 'process.create',
  onSuccess: () => toast.success('Process created successfully'),
  onError: (error) => toast.error(`Failed to create process: ${error.message}`)
});

// ❌ Bad: Silent operations
const mutation = useActionMutation({ action: 'process.create' });
```

## 🔗 **Related Documentation**

- **[Frontend Components](./01-frontend-components.md)** - Component APIs and props
- **[Junction System](./03-junction-system.md)** - Automatic relationship creation
- **[Data Flow](./04-data-flow.md)** - Complete request/response cycle
- **[Schema System](./06-schema-system.md)** - Resource schema definitions