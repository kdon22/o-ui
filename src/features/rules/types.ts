/**
 * Rule Types - Complete Type Definitions
 * 
 * Comprehensive type definitions for:
 * - Rule entities and operations
 * - Branching and versioning
 * - Execution and monitoring
 * - Python integration
 * - Documentation system
 * - API responses
 */

// ============================================================================
// CORE RULE TYPES
// ============================================================================

export interface Rule {
  // Core identity
  id: string;
  idShort: string;
  name: string;
  description?: string;

  // Rule configuration
  type: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR';
  pythonName?: string;
  sourceCode?: string;     // Business rules in natural language
  pythonCode?: string;     // Generated Python code
  runOrder?: number;
  executionMode: 'SYNC' | 'ASYNC';
  requirements?: string;

  // Rule features
  frontEndRule?: boolean;
  queueRule?: boolean;
  requesterName?: string;

  // Utility function specific fields
  parameters?: any;        // Array of UtilityParameter objects for UTILITY type rules
  returnType?: string;     // Return type for UTILITY functions

  // Branching fields
  tenantId: string;
  branchId: string;
  originalRuleId?: string;

  // Status and lifecycle
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;

  // Cache and optimization
  _cached?: boolean;
  _optimistic?: boolean;
}

export type CreateRule = Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'version' | '_cached' | '_optimistic'>;
export type UpdateRule = Partial<Omit<Rule, 'id' | 'createdAt' | 'tenantId' | '_cached' | '_optimistic'>>;

// ============================================================================
// RULE QUERY TYPES
// ============================================================================

export interface RuleQuery {
  tenantId: string;
  branchId?: string;
  type?: 'BUSINESS' | 'UTILITY' | 'GLOBAL_VAR';
  isActive?: boolean;
  executionMode?: 'SYNC' | 'ASYNC';
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'type' | 'runOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface RuleListQuery extends RuleQuery {
  includeInactive?: boolean;
  includeGlobalVars?: boolean;
  includeCode?: boolean;
}

// ============================================================================
// RULE OPERATIONS
// ============================================================================

export interface RuleOperations {
  // Standard CRUD
  create: {
    data: CreateRule;
    branchId?: string;
  };
  
  update: {
    id: string;
    data: UpdateRule;
    branchId?: string;
  };
  
  delete: {
    id: string;
    branchId?: string;
    softDelete?: boolean;
  };

  // Rule-specific operations
  execute: {
    id: string;
    input?: Record<string, any>;
    mode?: 'SYNC' | 'ASYNC';
    context?: Record<string, any>;
  };

  validateCode: {
    id: string;
    sourceCode?: string;
    pythonCode: string;
    pythonName?: string;
  };

  duplicate: {
    id: string;
    newName: string;
    branchId?: string;
  };

  // Branching operations
  branchFrom: {
    id: string;
    sourceBranchId: string;
    targetBranchId: string;
  };

  mergeTo: {
    id: string;
    sourceBranchId: string;
    targetBranchId: string;
  };

  viewHistory: {
    id: string;
    branchId?: string;
    limit?: number;
  };

  compareBranches: {
    id: string;
    sourceBranchId: string;
    targetBranchId: string;
  };

  switchBranch: {
    id: string;
    branchId: string;
  };

  // Documentation operations
  updateDocumentation: {
    id: string;
    vendor: 'AMADEUS' | 'SABRE' | 'TRAVELPORT';
    documentation: Record<string, any>;
  };

  // Global variable operations
  updateGlobalVar: {
    id: string;
    type: 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON';
    value: any;
    condition?: string;
    returnType?: string;
  };
}

// ============================================================================
// RULE RELATIONSHIPS
// ============================================================================

export interface RuleRelationships {
  // Process relationships
  processes?: Array<{
    id: string;
    name: string;
    type: string;
    order: number;
    isActive: boolean;
  }>;

  // Global variable relationship
  globalVariable?: {
    type: 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON';
    value: any;
    condition: string;
    returnType?: string;
  };

  // Documentation relationships
  documentation?: {
    amadeus?: Record<string, any>;
    sabre?: Record<string, any>;
    travelport?: Record<string, any>;
  };

  // Prompts relationships
  prompts?: Array<{
    id: string;
    name: string;
    content: string;
    layout?: Record<string, any>;
    isPublic: boolean;
    executionMode: 'INTERACTIVE' | 'AUTOMATED' | 'READ_ONLY';
  }>;

  // Execution history
  executions?: Array<{
    id: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    input?: Record<string, any>;
    output?: Record<string, any>;
    error?: string;
  }>;

  // Tag relationships
  tags?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
}

// ============================================================================
// RULE EXECUTION TYPES
// ============================================================================

export interface RuleExecution {
  id: string;
  ruleId: string;
  processExecId?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  memoryUsage?: number;
  cpuTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleExecutionRequest {
  ruleId: string;
  input?: Record<string, any>;
  context?: Record<string, any>;
  mode?: 'SYNC' | 'ASYNC';
  timeout?: number;
}

export interface RuleExecutionResponse {
  executionId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  output?: Record<string, any>;
  error?: string;
  duration?: number;
  memoryUsage?: number;
  cpuTime?: number;
}

// ============================================================================
// RULE VALIDATION TYPES
// ============================================================================

export interface RuleValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface CodeValidation {
  isValid: boolean;
  syntaxErrors: Array<{
    line: number;
    column: number;
    message: string;
  }>;
  securityIssues: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
  suggestions: Array<{
    line: number;
    column: number;
    message: string;
    fix?: string;
  }>;
}

// ============================================================================
// RULE BRANCHING TYPES
// ============================================================================

export interface RuleBranchInfo {
  currentBranchId: string;
  defaultBranchId: string;
  originalRuleId?: string;
  branchCreatedAt?: Date;
  branchCreatedBy?: string;
  hasUnmergedChanges: boolean;
  conflictsWith: string[];
}

export interface RuleBranchComparison {
  ruleId: string;
  sourceBranchId: string;
  targetBranchId: string;
  differences: Array<{
    field: string;
    sourceValue: any;
    targetValue: any;
    type: 'ADDED' | 'REMOVED' | 'MODIFIED';
  }>;
  conflicts: Array<{
    field: string;
    message: string;
    resolution: 'MANUAL' | 'AUTO_SOURCE' | 'AUTO_TARGET';
  }>;
}

export interface RuleMergeResult {
  success: boolean;
  ruleId: string;
  sourceBranchId: string;
  targetBranchId: string;
  mergedAt: Date;
  mergedBy: string;
  conflicts: Array<{
    field: string;
    resolution: string;
  }>;
}

// ============================================================================
// RULE DOCUMENTATION TYPES
// ============================================================================

export interface RuleDocumentation {
  id: string;
  ruleId: string;
  amadeus?: Record<string, any>;
  sabre?: Record<string, any>;
  travelport?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleDocumentationUpdate {
  vendor: 'AMADEUS' | 'SABRE' | 'TRAVELPORT';
  documentation: Record<string, any>;
}

// ============================================================================
// GLOBAL VARIABLE TYPES
// ============================================================================

export interface GlobalVariable {
  id: string;
  name: string;
  type: 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON';
  value?: any;
  condition: string;
  description?: string;
  returnType?: string;
  ruleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GlobalVariableUpdate {
  type: 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON';
  value: any;
  condition?: string;
  returnType?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface RuleResponse {
  success: boolean;
  data?: Rule;
  error?: string;
  timestamp: number;
  cached?: boolean;
  executionTime?: number;
}

export interface RuleListResponse {
  success: boolean;
  data?: {
    rules: Rule[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
  timestamp: number;
  cached?: boolean;
  executionTime?: number;
}

export interface RuleExecutionListResponse {
  success: boolean;
  data?: {
    executions: RuleExecution[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
  timestamp: number;
  cached?: boolean;
  executionTime?: number;
}

export interface RuleValidationResponse {
  success: boolean;
  data?: RuleValidation;
  error?: string;
  timestamp: number;
}

export interface CodeValidationResponse {
  success: boolean;
  data?: CodeValidation;
  error?: string;
  timestamp: number;
}

export interface RuleBranchResponse {
  success: boolean;
  data?: RuleBranchInfo;
  error?: string;
  timestamp: number;
}

export interface RuleBranchComparisonResponse {
  success: boolean;
  data?: RuleBranchComparison;
  error?: string;
  timestamp: number;
}

export interface RuleMergeResponse {
  success: boolean;
  data?: RuleMergeResult;
  error?: string;
  timestamp: number;
}

// ============================================================================
// PERMISSIONS TYPES
// ============================================================================

export interface RulePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExecute: boolean;
  canBranch: boolean;
  canMerge: boolean;
  canViewHistory: boolean;
  canEditCode: boolean;
  canEditDocumentation: boolean;
  canManagePrompts: boolean;
  canManageGlobalVars: boolean;
  canManageTags: boolean;
}

// ============================================================================
// UI CONFIGURATION TYPES
// ============================================================================

export interface RuleUIConfig {
  listView: {
    defaultColumns: string[];
    compactColumns: string[];
    sortableColumns: string[];
    filterableColumns: string[];
    searchableColumns: string[];
  };
  form: {
    sections: Array<{
      title: string;
      fields: string[];
      collapsible: boolean;
      defaultExpanded: boolean;
    }>;
    fieldConfig?: Record<string, {
      label: string;
      type: string;
      placeholder?: string;
      helpText?: string;
      required: boolean;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
      };
    }>;
  };
  codeEditor: {
    language: string;
    theme: string;
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    autoComplete: boolean;
    syntaxHighlighting: boolean;
  };
  branching: {
    showBranchIndicator: boolean;
    showBranchActions: boolean;
    showHistory: boolean;
    showComparison: boolean;
    enableQuickSwitch: boolean;
    maxHistoryItems: number;
  };
  mobile: {
    priorityFields: string[];
    swipeActions: Array<{
      action: string;
      icon: string;
      color: string;
      position: 'left' | 'right';
    }>;
    compactMode: boolean;
  };
}

// All types are already exported above - no need for duplicate export block 