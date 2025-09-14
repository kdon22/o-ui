# Process Creation with Node Relationships - Action System Guide

This guide demonstrates how to create processes and associate them with nodes using the action system.

## Overview

The action system provides two approaches for creating processes with node relationships:

1. **Sequential approach**: Create process first, then create junction table record
2. **Atomic approach**: Include relationship data in the process creation payload

## 1. Sequential Approach (Recommended)

```typescript
// Step 1: Create the process
const createProcessMutation = useActionMutation('process.create', {
  onSuccess: (result) => {
    if (result.success) {
      // Step 2: Create the junction table record
      createNodeProcessMutation.mutate({
        nodeId: selectedNodeId,
        processId: result.data.id,
        tenantId: result.data.tenantId,
        branchId: result.data.branchId,
        isActive: true,
        status: 'ACTIVE',
        sequence: 0
      });
    }
  }
});

// Junction table creation
const createNodeProcessMutation = useActionMutation('node_processes.create', {
  onSuccess: (result) => {
    if (result.success) {
      console.log('Process linked to node successfully');
    }
  }
});

// Usage
const handleSubmit = (formData) => {
  createProcessMutation.mutate({
    name: formData.name,
    type: formData.type,
    description: formData.description,
    isActive: true
  });
};
```

## 2. Atomic Approach (Single Operation)

```typescript
// Single mutation that handles both process and relationship creation
const createProcessWithRelationshipMutation = useActionMutation('process.create', {
  onSuccess: (result) => {
    if (result.success) {
      console.log('Process created and linked to node');
    }
  }
});

// Usage
const handleSubmit = (formData) => {
  createProcessWithRelationshipMutation.mutate({
    name: formData.name,
    type: formData.type,
    description: formData.description,
    isActive: true,
    // Junction table data will be extracted by the system
    nodeId: selectedNodeId
  });
};
```

## 3. Using Auto-Form Component

```typescript
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema';

function ProcessCreationForm({ nodeId, onSuccess }) {
  const handleSubmit = async (formData) => {
    // Your process creation logic here
    console.log('Creating process with data:', formData);
    
    if (formData.relationshipData) {
      // Handle relationship data
      console.log('Node relationship:', formData.relationshipData);
    }
  };

  return (
    <AutoForm
      schema={PROCESS_SCHEMA}
      mode="create"
      relationshipData={{ nodeId }}
      onSubmit={handleSubmit}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

## 4. Complete Working Example

```typescript
import React, { useState } from 'react';
import { useActionMutation } from '@/hooks/use-action-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROCESS_TYPE_OPTIONS } from '@/features/processes/constants';

interface ProcessCreationFormProps {
  nodeId: string;
  onSuccess?: (process: any) => void;
}

export function ProcessCreationForm({ nodeId, onSuccess }: ProcessCreationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'TICKETING',
    description: ''
  });

  // Create process mutation
  const createProcess = useActionMutation('process.create', {
    onSuccess: (result) => {
      if (result.success) {
        // Create junction table record
        createNodeProcess.mutate({
          nodeId,
          processId: result.data.id,
          tenantId: result.data.tenantId,
          branchId: result.data.branchId,
          isActive: true,
          status: 'ACTIVE',
          sequence: 0
        });
      }
    }
  });

  // Create node-process junction mutation
  const createNodeProcess = useActionMutation('node_processes.create', {
    onSuccess: (result) => {
      if (result.success) {
        onSuccess?.(createProcess.data?.data);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProcess.mutate({
      name: formData.name,
      type: formData.type,
      description: formData.description,
      isActive: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name">Process Name</label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label htmlFor="type">Process Type</label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
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

      <div>
        <label htmlFor="description">Description</label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <Button
        type="submit"
        disabled={createProcess.isPending || createNodeProcess.isPending}
      >
        {createProcess.isPending || createNodeProcess.isPending ? 'Creating...' : 'Create Process'}
      </Button>
    </form>
  );
}
```

## How It Works

### 1. Action System Flow

```
User Input → useActionMutation → ActionClient → ActionRouter → PrismaService → Database
```

### 2. Process Creation Flow

```
1. process.create action triggered
2. PrismaService creates Process record
3. Junction extraction logic detects nodeId
4. NodeProcess record created automatically
5. Both records saved to database
6. Client receives success response
```

### 3. Junction Table Handling

The system automatically detects junction table patterns in the PrismaService:

```typescript
// In PrismaService.create()
const junctionData = extractJunctionData(dataWithAudit, schema);
createData = junctionData.mainData;
junctionRecords = junctionData.junctionRecords;

// Create main entity
const result = await model.create({ data: createData });

// Create junction records
if (junctionRecords.length > 0) {
  for (const junctionRecord of junctionRecords) {
    await createJunctionRecord(this.prisma, junctionRecord, context);
  }
}
```

### 4. Junction Factory Transformation

The JunctionFactory handles the transformation from flat data to Prisma relations:

```typescript
// Input: { nodeId: 'node-123', processId: 'process-456' }
// Output: { 
//   node: { connect: { id: 'node-123' } },
//   process: { connect: { id: 'process-456' } }
// }
```

## Key Points

1. **Use the sequential approach** for better error handling and clearer code flow
2. **Junction tables are first-class entities** with their own actions (e.g., `node_processes.create`)
3. **The system handles branch awareness** automatically
4. **Relationship data is extracted and processed** by the junction handler
5. **All operations are optimistic** - UI updates immediately, syncs in background

## Testing

To test the process creation:

1. Use the provided `ProcessCreationForm` component
2. Pass a valid `nodeId` prop
3. Fill out the form and submit
4. Check the database for both Process and NodeProcess records
5. Verify the records have correct `branchId` and `tenantId`

This approach ensures data consistency and follows the established patterns in the action system. 