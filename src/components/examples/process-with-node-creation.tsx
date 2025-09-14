/**
 * Example: Creating a Process with Node Relationship
 * 
 * This example demonstrates how to create a process and associate it with a node
 * using the action system. It shows two approaches:
 * 1. Create process with relationship data included
 * 2. Create process first, then create junction table record
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActionMutation } from '@/hooks/use-action-api';
import { useToast } from '@/components/ui/hooks/useToast';
import { PROCESS_TYPE_OPTIONS } from '@/features/processes/constants';

interface ProcessWithNodeCreationProps {
  nodeId: string;
  onSuccess?: (process: any) => void;
  onCancel?: () => void;
}

export function ProcessWithNodeCreation({ 
  nodeId, 
  onSuccess, 
  onCancel 
}: ProcessWithNodeCreationProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'TICKETING',
    description: ''
  });
  
  const { toast } = useToast();
  
  // Mutation for creating process
  const createProcessMutation = useActionMutation('process.create', {
    onSuccess: (result) => {
      if (result.success) {
        // After process is created, create the junction table record
        createNodeProcessMutation.mutate({
          nodeId,
          processId: result.data.id,
          isActive: true,
          status: 'ACTIVE',
          sequence: 0
        });
      }
    },
    onError: (error) => {
      console.error('Process creation failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to create process',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for creating node-process junction
  const createNodeProcessMutation = useActionMutation('node_processes.create', {
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Process created and linked to node successfully'
        });
        onSuccess?.(createProcessMutation.data?.data);
      }
    },
    onError: (error) => {
      console.error('Node-Process junction creation failed:', error);
      toast({
        title: 'Warning',
        description: 'Process created but failed to link to node',
        variant: 'destructive'
      });
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Process name is required',
        variant: 'destructive'
      });
      return;
    }
    
    // Create the process first
    createProcessMutation.mutate({
      name: formData.name,
      type: formData.type,
      description: formData.description,
      isActive: true
    });
  };
  
  const isLoading = createProcessMutation.isPending || createNodeProcessMutation.isPending;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Create Process for Node</h2>
        <p className="text-muted-foreground">
          Create a new process and associate it with the selected node
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Process Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter process name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">Process Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select process type" />
            </SelectTrigger>
            <SelectContent>
              {PROCESS_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter process description"
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Process'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Alternative approach: Create process with relationship data included
export function ProcessWithNodeCreationAlternative({ 
  nodeId, 
  onSuccess, 
  onCancel 
}: ProcessWithNodeCreationProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'TICKETING',
    description: ''
  });
  
  const { toast } = useToast();
  
  // Single mutation that handles both process creation and relationship
  const createProcessWithRelationshipMutation = useActionMutation('process.create', {
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Process created and linked to node successfully'
        });
        onSuccess?.(result.data);
      }
    },
    onError: (error) => {
      console.error('Process creation failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to create process',
        variant: 'destructive'
      });
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Process name is required',
        variant: 'destructive'
      });
      return;
    }
    
    // Create process with relationship data included
    createProcessWithRelationshipMutation.mutate({
      name: formData.name,
      type: formData.type,
      description: formData.description,
      isActive: true,
      // Include relationship data to create junction table record
      nodeId, // This will be handled by the junction extraction logic
      relationshipData: {
        nodeId,
        isActive: true,
        status: 'ACTIVE',
        sequence: 0
      }
    });
  };
  
  const isLoading = createProcessWithRelationshipMutation.isPending;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Create Process for Node (Alternative)</h2>
        <p className="text-muted-foreground">
          Create a new process and associate it with the selected node in one operation
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Process Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter process name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">Process Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select process type" />
            </SelectTrigger>
            <SelectContent>
              {PROCESS_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter process description"
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Process'}
          </Button>
        </div>
      </form>
    </div>
  );
} 