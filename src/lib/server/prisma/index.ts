/**
 * Prisma Service Module - Clean Interface
 * 
 * Exports the PrismaService and related utilities for server-side operations.
 * Junction handling is now managed by the schema-driven resolver system.
 */

export { PrismaService } from './prisma-service';
export { getModelName, getModelNameFromAny } from './model-utils';
export type { PrismaServiceContext } from './types';

// ✅ REMOVED: Junction handler exports - replaced by schema-driven system

export { 
  buildBaseWhere, 
  buildInclude, 
  buildExclusionCriteria, 
  buildBranchWhere 
} from './query-builder';

export { 
  processRelationships 
} from './relationship-processor';

export { 
  resolveBranchId, 
  resolveBranchContext, 
  branchExists, 
  getDefaultBranch 
} from './branch-resolver'; 