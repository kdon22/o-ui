/**
 * Action System Core Types
 * 
 * Shared types for the server-side action routing system
 */

import type { 
  ActionRequest, 
  ActionResponse, 
  BranchContext, 
  ResourceSchema 
} from '@/lib/resource-system/schemas';

export interface ExecutionContext {
  userId: string;
  tenantId: string;
  branchId: string;
  defaultBranchId: string; // Add defaultBranchId to context
  branchContext?: BranchContext;
  session?: any;
}

export interface ActionResult {
  data: any;
  junctions?: Record<string, any[]>; // Junction table data
  meta?: {
    totalCount?: number;
    page?: number;
    limit?: number;
    cached?: boolean;
    branchId?: string;
    copyOnWrite?: boolean;
    bulkCount?: number;
    junctionTablesLoaded?: number; // Number of junction tables loaded
  };
}

export interface ParsedAction {
  resourceType: string;
  operation: string;
}

export interface HandlerContext {
  resourceType: string;
  data: any;
  options: any;
  context: ExecutionContext;
  schema: ResourceSchema;
}

// Re-export commonly used types
export type { 
  ActionRequest, 
  ActionResponse, 
  BranchContext, 
  ResourceSchema 
} from '@/lib/resource-system/schemas'; 