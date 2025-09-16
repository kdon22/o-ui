/**
 * Shared types for Prisma services
 */

export interface PrismaServiceContext {
  tenantId: string;
  branchId: string;
  defaultBranchId: string;
  userId: string;
}

export interface QueryFilters {
  [key: string]: any;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: any;
}

export interface JunctionData {
  mainData: any;
  junctionRecords: any[];
}

export interface JunctionRecord {
  modelName: string;
  [key: string]: any;
}

export interface QueryResult<T> {
  items: T[];
  totalCount: number;
} 