/**
 * Workflow Definition Types
 * 
 * TypeScript interfaces for the workflow JSON structure stored in Workflow.steps
 */

export interface WorkflowDefinition {
  workflow: {
    id: string;
    name: string;
    version: string;
    description?: string;
  };
  nodes: WorkflowNode[];
  execution_settings: ExecutionSettings;
  parallel_groups?: Record<string, ParallelGroup>;
  data_flow?: DataFlow;
  runtime_config?: RuntimeConfig;
}

export interface WorkflowNode {
  id: string;
  type: 'start' | 'end' | 'process' | 'gateway' | 'timer' | 'condition';
  name: string;
  position: { x: number; y: number };
  config: NodeConfig;
  inputs?: NodeInputs;
  outputs: NodeOutputs;
  parallel_group?: string;
}

export interface NodeConfig {
  // Process-specific
  process_id?: string; // UUID from Process table
  timeout_seconds?: number;
  retry_count?: number;
  
  // Start node specific
  trigger?: 'manual' | 'automatic' | 'scheduled' | 'queue_message';
  auto_start?: boolean;
  
  // End node specific
  cleanup?: boolean;
  save_results?: boolean;
  
  // Condition specific
  condition_expression?: string;
  
  // Wait strategy for nodes with multiple inputs
  wait_strategy?: 'all_success' | 'any_success' | 'all_complete';
}

export interface NodeInputs {
  required?: string[]; // Node IDs that must complete successfully
  any_of?: string[]; // At least one of these nodes must complete
  wait_for?: 'all' | 'any' | 'first';
  data_type?: string;
}

export interface NodeOutputs {
  success?: string[]; // Target node IDs on success
  error?: string[]; // Target node IDs on error
  timeout?: string[]; // Target node IDs on timeout
  condition_true?: string[]; // For condition nodes
  condition_false?: string[]; // For condition nodes
}

export interface ExecutionSettings {
  parallel_execution: boolean;
  max_concurrent_nodes: number;
  global_timeout_seconds: number;
  error_strategy: 'stop_on_first_error' | 'stop_on_critical_failure' | 'continue_all';
  retry_strategy: 'node_level' | 'workflow_level' | 'none';
  data_persistence: 'all_states' | 'checkpoints_only' | 'final_only';
}

export interface ParallelGroup {
  nodes: string[];
  execution: 'concurrent' | 'sequential';
  failure_policy: 'stop_all' | 'continue_others';
}

export interface DataFlow {
  input_schema?: {
    type: string;
    required_fields: string[];
  };
  node_data_mapping?: Record<string, {
    input?: string | string[];
    output?: string;
  }>;
}

export interface RuntimeConfig {
  engine_version: string;
  execution_mode: 'sync' | 'async';
  state_tracking?: {
    save_intermediate_results: boolean;
    checkpoint_frequency: 'per_node' | 'per_group' | 'manual';
    recovery_enabled: boolean;
  };
  monitoring?: {
    metrics_enabled: boolean;
    log_level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    capture_timing: boolean;
    health_checks: boolean;
  };
  queue_integration?: {
    result_queue?: string;
    error_queue?: string;
    status_updates: boolean;
  };
}

// Runtime execution state types
export interface WorkflowExecutionState {
  [nodeId: string]: NodeExecutionState;
}

export interface NodeExecutionState {
  status: 'waiting' | 'running' | 'completed' | 'failed' | 'timeout' | 'skipped';
  started_at?: string;
  completed_at?: string;
  input_data?: any;
  output_data?: any;
  error?: string;
  retry_count?: number;
}

// Workflow builder canvas types
export interface CanvasNode extends WorkflowNode {
  selected?: boolean;
  dragging?: boolean;
}

export interface CanvasConnection {
  id: string;
  source: string;
  target: string;
  sourceOutput: keyof NodeOutputs;
  style: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  };
}
