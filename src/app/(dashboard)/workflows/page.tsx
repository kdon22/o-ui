/**
 * Workflows List Page - Main Workflow Management
 * 
 * Lists all workflows with CRUD operations using your existing action system.
 * Integrates with branch-aware data fetching and auto-generated components.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Play, 
  Edit, 
  Trash2, 
  Copy, 
  Download,
  Upload,
  GitBranch,
  Clock,
  Users,
  Activity
} from 'lucide-react';
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { useCleanBranchContext } from '@/hooks/use-clean-branch-context';
import type { Workflow } from '@/features/workflows/workflows.schema';

export default function WorkflowsPage() {
  const router = useRouter();
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);

  // Branch context for version control
  const branchContext = useCleanBranchContext();

  // ============================================================================
  // DATA FETCHING - Uses your existing action system with branch awareness
  // ============================================================================

  const {
    data: workflowsResponse,
    isLoading,
    error,
    refetch
  } = useActionQuery({
    action: 'workflow.list',
    params: {},
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const workflows = workflowsResponse?.data as Workflow[] || [];

  // Delete mutation
  const deleteWorkflowMutation = useActionMutation({
    action: 'workflow.delete',
    onSuccess: () => {
      refetch();
      setSelectedWorkflows([]);
    }
  });

  // Duplicate mutation
  const duplicateWorkflowMutation = useActionMutation({
    action: 'workflow.create',
    onSuccess: () => {
      refetch();
    }
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCreateNew = () => {
    router.push('/workflows/builder');
  };

  const handleEditWorkflow = (workflowId: string) => {
    router.push(`/workflows/builder?id=${workflowId}`);
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      await deleteWorkflowMutation.mutateAsync({ workflowId });
    }
  };

  const handleDuplicateWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    const duplicateData = {
      ...workflow,
      name: `${workflow.name} (Copy)`,
      isActive: false,
      deploymentStatus: 'DRAFT' as const
    };
    delete (duplicateData as any).id;
    delete (duplicateData as any).createdAt;
    delete (duplicateData as any).updatedAt;
    delete (duplicateData as any).version;

    await duplicateWorkflowMutation.mutateAsync(duplicateData);
  };

  const handleExecuteWorkflow = (workflowId: string) => {
    // TODO: Implement workflow execution
    console.log('Executing workflow:', workflowId);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getStatusBadge = (workflow: Workflow) => {
    const status = workflow.deploymentStatus || 'DRAFT';
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      DEPLOYED: 'bg-green-100 text-green-800', 
      DEPRECATED: 'bg-orange-100 text-orange-800',
      ARCHIVED: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={colors[status] || colors.DRAFT}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (workflow: Workflow) => {
    const type = workflow.workflowType || 'SEQUENTIAL';
    const colors = {
      SEQUENTIAL: 'bg-blue-100 text-blue-800',
      PARALLEL: 'bg-purple-100 text-purple-800',
      CONDITIONAL: 'bg-yellow-100 text-yellow-800',
      LOOP: 'bg-indigo-100 text-indigo-800',
      EVENT_DRIVEN: 'bg-pink-100 text-pink-800',
      SCHEDULED: 'bg-cyan-100 text-cyan-800',
      HYBRID: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge variant="outline" className={colors[type] || colors.SEQUENTIAL}>
        {type}
      </Badge>
    );
  };

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Workflows</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="container mx-auto px-6 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workflows</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Design, manage, and execute your business workflows
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Branch indicator - connected to your branching system */}
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <GitBranch size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {branchContext.currentBranchId} branch
              {branchContext.isFeatureBranch && <span className="text-xs"> (feature)</span>}
            </span>
          </div>

          <Button variant="outline" size="sm">
            <Upload size={16} className="mr-2" />
            Import
          </Button>
          
          <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={16} className="mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflows.filter(w => w.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflows.filter(w => w.deploymentStatus === 'DRAFT').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deployed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflows.filter(w => w.deploymentStatus === 'DEPLOYED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first workflow to get started with process automation.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus size={16} className="mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  
                  {/* Left: Workflow info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {workflow.name}
                      </h3>
                      {getStatusBadge(workflow)}
                      {getTypeBadge(workflow)}
                      {!workflow.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    
                    {workflow.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {workflow.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>Version {workflow.version}</span>
                      <span>Created {new Date(workflow.createdAt).toLocaleDateString()}</span>
                      <span>Updated {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 ml-6">
                    {workflow.isActive && workflow.deploymentStatus === 'DEPLOYED' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleExecuteWorkflow(workflow.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play size={14} className="mr-1" />
                        Execute
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditWorkflow(workflow.id)}
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDuplicateWorkflow(workflow.id)}
                    >
                      <Copy size={14} className="mr-1" />
                      Duplicate
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
    </div>
  );
}
