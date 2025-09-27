/**
 * Demo Gateway Workflow - Showcases Parallel Execution
 * 
 * Example workflow demonstrating the gateway system with your use case:
 * level2 process → success → Parallel Gateway → UTR Processing + Level3 Processing
 */

import { nanoid } from 'nanoid/non-secure';
import type { VisualWorkflow } from '../../types/workflow-builder';

export const DEMO_GATEWAY_WORKFLOW: VisualWorkflow = {
  id: nanoid(),
  name: 'Demo Parallel Execution Workflow',
  description: 'Demonstrates parallel execution using gateways after successful level2 processing',
  
  nodes: [
    // Start Node
    {
      id: 'start-node',
      type: 'start',
      position: { x: 50, y: 200 },
      size: { width: 60, height: 60 },
      label: 'Start',
      trigger: { type: 'manual' }
    },
    
    // Level 2 Process
    {
      id: 'level2-process',
      type: 'process',
      position: { x: 180, y: 170 },
      size: { width: 140, height: 80 },
      label: 'Level 2 Process',
      processId: 'level2-process-id',
      processName: 'Level 2 Processing',
      
    },
    
    // Parallel Gateway (Auto-created when connecting multiple processes)
    {
      id: 'parallel-gateway-1',
      type: 'parallel-gateway',
      position: { x: 400, y: 185 },
      size: { width: 60, height: 60 },
      label: 'Parallel',
      executionMode: 'all', // Wait for all parallel processes to complete
      maxConcurrent: 2 // UTR + Level3 simultaneously
    },
    
    // UTR Processing 
    {
      id: 'utr-processing',
      type: 'process',
      position: { x: 550, y: 100 },
      size: { width: 140, height: 80 },
      label: 'UTR Processing',
      processId: 'utr-process-id',
      processName: 'UTR Data Processing',
      
    },
    
    // Level 3 Processing
    {
      id: 'level3-processing',
      type: 'process',
      position: { x: 550, y: 260 },
      size: { width: 140, height: 80 },
      label: 'Level 3 Processing',
      processId: 'level3-process-id',
      processName: 'Level 3 Advanced Processing',
      
    },
    
    // Merge Gateway (Combines parallel results)
    {
      id: 'merge-gateway-1',
      type: 'parallel-gateway',
      position: { x: 780, y: 185 },
      size: { width: 60, height: 60 },
      label: 'Merge',
      executionMode: 'all', // Wait for both UTR and Level3 to complete
      maxConcurrent: undefined
    },
    
    // Final Processing
    {
      id: 'final-process',
      type: 'process',
      position: { x: 920, y: 170 },
      size: { width: 140, height: 80 },
      label: 'Final Processing',
      processId: 'final-process-id',
      processName: 'Combine Results',
      
    },
    
    // End Node
    {
      id: 'end-node',
      type: 'end',
      position: { x: 1150, y: 200 },
      size: { width: 60, height: 60 },
      label: 'End',
      action: { type: 'success', message: 'Workflow completed successfully' }
    }
  ],
  
  connections: [
    // Start → Level2
    {
      id: 'conn-start-level2',
      sourceNodeId: 'start-node',
      targetNodeId: 'level2-process',
      label: 'initialize'
    },
    
    // Level2 → Parallel Gateway (Success path)
    {
      id: 'conn-level2-gateway',
      sourceNodeId: 'level2-process',
      targetNodeId: 'parallel-gateway-1',
      sourcePort: 'success',
      targetPort: 'input',
      label: 'on success'
    },
    
    // Parallel Gateway → UTR Processing
    {
      id: 'conn-gateway-utr',
      sourceNodeId: 'parallel-gateway-1',
      targetNodeId: 'utr-processing',
      sourcePort: 'out-0',
      targetPort: 'input',
      label: 'branch A'
    },
    
    // Parallel Gateway → Level3 Processing  
    {
      id: 'conn-gateway-level3',
      sourceNodeId: 'parallel-gateway-1',
      targetNodeId: 'level3-processing',
      sourcePort: 'out-1',
      targetPort: 'input',
      label: 'branch B'
    },
    
    // UTR → Merge Gateway
    {
      id: 'conn-utr-merge',
      sourceNodeId: 'utr-processing',
      targetNodeId: 'merge-gateway-1',
      sourcePort: 'success',
      targetPort: 'input',
      label: 'UTR complete'
    },
    
    // Level3 → Merge Gateway
    {
      id: 'conn-level3-merge',
      sourceNodeId: 'level3-processing',
      targetNodeId: 'merge-gateway-1',
      sourcePort: 'success', 
      targetPort: 'input',
      label: 'Level3 complete'
    },
    
    // Merge Gateway → Final Processing
    {
      id: 'conn-merge-final',
      sourceNodeId: 'merge-gateway-1',
      targetNodeId: 'final-process',
      sourcePort: 'output',
      targetPort: 'input',
      label: 'all complete'
    },
    
    // Final → End
    {
      id: 'conn-final-end',
      sourceNodeId: 'final-process',
      targetNodeId: 'end-node',
      sourcePort: 'success',
      label: 'finished'
    }
  ],
  
  viewport: { x: 0, y: 0, zoom: 1 },
  
  layout: {
    gridSize: 20,
    snapToGrid: true,
    showGrid: true
  },
  
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  }
};

// ============================================================================
// DEMO WORKFLOW VARIATIONS
// ============================================================================

/**
 * Creates a dynamic demo workflow based on user requirements
 */
export function createCustomGatewayDemo(config: {
  sourceProcess: string;
  parallelProcesses: string[];
  executionMode: 'all' | 'first' | 'any';
}): VisualWorkflow {
  
  const workflow: VisualWorkflow = {
    id: nanoid(),
    name: `Custom Parallel Workflow - ${config.sourceProcess}`,
    description: `Parallel execution of ${config.parallelProcesses.join(', ')} after ${config.sourceProcess}`,
    nodes: [],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    layout: { gridSize: 20, snapToGrid: true, showGrid: true },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    }
  };

  let xPos = 50;
  const yCenter = 200;

  // Start node
  workflow.nodes.push({
    id: 'start',
    type: 'start',
    position: { x: xPos, y: yCenter },
    size: { width: 60, height: 60 },
    label: 'Start',
    trigger: { type: 'manual' }
  });
  xPos += 150;

  // Source process
  const sourceNodeId = `source-${nanoid()}`;
  workflow.nodes.push({
    id: sourceNodeId,
    type: 'process',
    position: { x: xPos, y: yCenter - 25 },
    size: { width: 140, height: 80 },
    label: config.sourceProcess,
    processId: `${config.sourceProcess.toLowerCase()}-id`,
    processName: config.sourceProcess,
    
  });
  xPos += 200;

  // Parallel gateway
  const gatewayId = `gateway-${nanoid()}`;
  workflow.nodes.push({
    id: gatewayId,
    type: 'parallel-gateway',
    position: { x: xPos, y: yCenter - 15 },
    size: { width: 60, height: 60 },
    label: 'Parallel',
    executionMode: config.executionMode,
    maxConcurrent: config.parallelProcesses.length
  });
  xPos += 150;

  // Parallel processes
  const processNodeIds: string[] = [];
  config.parallelProcesses.forEach((processName, index) => {
    const processId = `process-${nanoid()}`;
    const yOffset = (index - (config.parallelProcesses.length - 1) / 2) * 120;
    
    workflow.nodes.push({
      id: processId,
      type: 'process',
      position: { x: xPos, y: yCenter + yOffset - 25 },
      size: { width: 140, height: 80 },
      label: processName,
      processId: `${processName.toLowerCase()}-id`,
      processName: processName,
      
    });
    
    processNodeIds.push(processId);
  });
  xPos += 200;

  // End node
  workflow.nodes.push({
    id: 'end',
    type: 'end',
    position: { x: xPos, y: yCenter },
    size: { width: 60, height: 60 },
    label: 'End',
    action: { type: 'success' }
  });

  // Create connections
  workflow.connections = [
    // Start → Source
    {
      id: nanoid(),
      sourceNodeId: 'start',
      targetNodeId: sourceNodeId
    },
    // Source → Gateway
    {
      id: nanoid(),
      sourceNodeId: sourceNodeId,
      targetNodeId: gatewayId,
      sourcePort: 'success',
      label: 'on success'
    },
    // Gateway → Parallel processes
    ...processNodeIds.map((processId, index) => ({
      id: nanoid(),
      sourceNodeId: gatewayId,
      targetNodeId: processId,
      sourcePort: `out-${index}`,
      label: `branch ${index + 1}`
    })),
    // Processes → End (simplified, in reality you'd have merge logic)
    ...processNodeIds.map(processId => ({
      id: nanoid(),
      sourceNodeId: processId,
      targetNodeId: 'end',
      sourcePort: 'success'
    }))
  ];

  return workflow;
}

// ============================================================================
// QUICK DEMO TEMPLATES
// ============================================================================

export const QUICK_DEMOS = {
  'your-use-case': DEMO_GATEWAY_WORKFLOW,
  
  'data-processing': createCustomGatewayDemo({
    sourceProcess: 'Data Validation',
    parallelProcesses: ['Transform Data', 'Enrich Data', 'Index Data'],
    executionMode: 'all'
  }),
  
  'api-integration': createCustomGatewayDemo({
    sourceProcess: 'Auth Check',
    parallelProcesses: ['Fetch User Data', 'Fetch Permissions', 'Log Activity'],
    executionMode: 'first'
  }),
  
  'notification-system': createCustomGatewayDemo({
    sourceProcess: 'Event Triggered',
    parallelProcesses: ['Send Email', 'Send SMS', 'Update Dashboard'],
    executionMode: 'any'
  })
};
