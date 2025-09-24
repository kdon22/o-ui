/**
 * Process Types
 * 
 * TypeScript interfaces and types for process management including:
 * - Core entity types
 * - Mutation types (create, update)
 * - Query types
 * - Form types
 * - Relationship types
 */

import type { ProcessType } from '@prisma/client';

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================
export type Process = {
  id: string;
  name: string;
  description?: string;
  type: ProcessType;
  tenantId: string;
  branchId: string;
  originalProcessId?: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
};

// ============================================================================
// MUTATION TYPES
// ============================================================================
export interface CreateProcessInput {
  name: string;
  description?: string;
  type: ProcessType;
  tenantId: string;
  branchId: string;
  originalProcessId?: string;
  isActive: boolean;
  createdById?: string;
  updatedById?: string;
  
  // Relationship data
  relationships?: {
    nodes?: {
      connect?: Array<{ id: string; [key: string]: any }>;
    };
    rules?: {
      connect?: Array<{ id: string; order?: number; isActive?: boolean; [key: string]: any }>;
    };
  };
}

export interface UpdateProcessInput {
  name?: string;
  description?: string;
  type?: ProcessType;
  branchId?: string;
  originalProcessId?: string;
  isActive?: boolean;
  updatedById?: string;
  
  // Relationship updates
  relationships?: {
    nodes?: {
      connect?: Array<{ id: string; [key: string]: any }>;
      disconnect?: Array<{ id: string }>;
    };
    rules?: {
      connect?: Array<{ id: string; order?: number; isActive?: boolean; [key: string]: any }>;
      disconnect?: Array<{ id: string }>;
      update?: Array<{ id: string; order?: number; isActive?: boolean; [key: string]: any }>;
    };
  };
}

// Legacy types for backward compatibility
export type CreateProcess = Omit<Process, 'id' | 'createdAt' | 'updatedAt' | 'version'>;
export type UpdateProcess = Partial<Omit<Process, 'id' | 'createdAt' | 'tenantId'>>;

// ============================================================================
// QUERY TYPES
// ============================================================================
export interface ProcessQuery {
  tenantId: string;
  branchId?: string;
  type?: ProcessType;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'type' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProcessListQuery extends ProcessQuery {
  includeInactive?: boolean;
}

// ============================================================================
// FORM TYPES - SIMPLIFIED FOR 4-FIELD FORM
// ============================================================================
export interface ProcessFormData {
  name: string;
  type: ProcessType;
  description?: string;
  isActive: boolean;
}

// ============================================================================
// RELATIONSHIP TYPES (for future use)
// ============================================================================
export interface ProcessWithRelations extends Process {
  nodes?: any[];
  rules?: any[];
  workflows?: any[];
  executions?: any[];
}

// ============================================================================
// ACTION TYPES
// ============================================================================
export interface ProcessAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  processId?: string;
  data?: Partial<Process>;
  timestamp: Date;
  userId?: string;
} 