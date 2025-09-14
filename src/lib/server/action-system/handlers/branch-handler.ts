/**
 * Branch Handler - Specialized Operations
 * 
 * Handles branch-specific operations that go beyond basic CRUD:
 * - Branch switching (session management)
 * - Branch comparison and diff generation
 * - Branch merging with conflict resolution
 * - Branch status and activity tracking
 */

import type { ActionResult, ExecutionContext } from '../core/types';
import { PrismaService } from '../../prisma/prisma-service';
import { getResourceByActionPrefix } from '../utils/action-parser';
import { rollbackService } from '../services/rollback-service';
import type { 
  Branch, 
  BranchDiff, 
  BranchStatus, 
  BranchActivity, 
  MergeResult 
} from '@/lib/branching/types';

export class BranchHandler {
  constructor(private prismaService: PrismaService) {}

  async handle(
    resourceType: string,
    operation: string,
    data: any,
    options: any,
    context: ExecutionContext
  ): Promise<ActionResult> {
    console.log('[BranchHandler] Handling branch operation:', {
      resourceType,
      operation,
      data,
      timestamp: new Date().toISOString()
    });

    switch (operation) {
      case 'switch':
        return this.handleBranchSwitch(data, context);
      case 'compare':
        return this.handleBranchCompare(data, context);
      case 'merge':
        return this.handleBranchMerge(data, context);
      case 'getMergePreview':
        return this.handleGetMergePreview(data, context);
      case 'getStatus':
        return this.handleGetBranchStatus(data, context);
      case 'getActivity':
        return this.handleGetBranchActivity(data, context);
      case 'setDefault':
        return this.handleSetDefault(data, context);
      case 'rollback':
        return this.handleRollback(data, context);
      case 'getRollbackable':
        return this.handleGetRollbackable(data, context);
      default:
        throw new Error(`Unsupported branch operation: ${operation}`);
    }
  }

  // ============================================================================
  // BRANCH SWITCHING
  // ============================================================================

  private async handleBranchSwitch(
    data: { branchId: string },
    context: ExecutionContext
  ): Promise<ActionResult> {
    const { branchId } = data;
    
    console.log('[BranchHandler] Processing branch switch:', {
      targetBranchId: branchId,
      currentBranchId: context.branchId,
      tenantId: context.tenantId,
      userId: context.userId
    });

    // Validate that the branch exists and user has access
    const branchSchema = getResourceByActionPrefix('branches');
    if (!branchSchema) {
      throw new Error('Branch schema not found');
    }

    const prismaContext = {
      tenantId: context.tenantId,
      branchId: context.defaultBranchId, // Use default branch for branch lookup
      defaultBranchId: context.defaultBranchId,
      userId: context.userId
    };

    const targetBranch = await this.prismaService.findById(
      branchSchema, 
      branchId, 
      prismaContext
    );

    if (!targetBranch) {
      throw new Error(`Branch not found or not accessible: ${branchId}`);
    }

    // Note: Actual session update happens in the API route handler
    // This handler just validates the branch switch is possible
    return {
      data: {
        branchId: targetBranch.id,
        branchName: targetBranch.name,
        switchedAt: new Date().toISOString(),
        message: 'Branch switch validated - session will be updated'
      },
      meta: {
        branchId: targetBranch.id,
        cached: false,
        operation: 'switch'
      }
    };
  }

  // ============================================================================
  // BRANCH COMPARISON
  // ============================================================================

  private async handleBranchCompare(
    data: { sourceBranchId: string; targetBranchId: string },
    context: ExecutionContext
  ): Promise<ActionResult> {
    const { sourceBranchId, targetBranchId } = data;
    
    console.log('[BranchHandler] Comparing branches:', {
      sourceBranchId,
      targetBranchId,
      tenantId: context.tenantId
    });

    // TODO: Implement comprehensive branch comparison
    // For now, return a mock diff structure
    const mockDiff: BranchDiff = {
      sourceBranch: { id: sourceBranchId, name: 'Source Branch' } as Branch,
      targetBranch: { id: targetBranchId, name: 'Target Branch' } as Branch,
      summary: {
        totalChanges: 0,
        added: 0,
        modified: 0,
        deleted: 0,
        conflicts: 0
      },
      entities: [],
      conflicts: []
    };

    return {
      data: mockDiff,
      meta: {
        branchId: context.branchId,
        cached: true,
        ttl: 60000, // Cache for 1 minute
        operation: 'compare'
      }
    };
  }

  // ============================================================================
  // BRANCH MERGING
  // ============================================================================

  private async handleBranchMerge(
    data: { 
      sourceBranchId: string; 
      targetBranchId: string;
      title?: string;
      description?: string;
      conflictResolutions?: Record<string, any>;
    },
    context: ExecutionContext
  ): Promise<ActionResult> {
    const { sourceBranchId, targetBranchId, title, description } = data;
    
    console.log('[BranchHandler] Merging branches:', {
      sourceBranchId,
      targetBranchId,
      title,
      tenantId: context.tenantId
    });

    // TODO: Implement comprehensive branch merging
    // For now, return a mock merge result
    const mockMergeResult: MergeResult = {
      success: true,
      mergeId: `merge-${Date.now()}`,
      mergedEntities: [],
      conflicts: []
    };

    return {
      data: mockMergeResult,
      meta: {
        branchId: context.branchId,
        cached: false,
        operation: 'merge'
      }
    };
  }

  // ============================================================================
  // MERGE PREVIEW
  // ============================================================================

  private async handleGetMergePreview(
    data: { 
      sourceBranchId: string; 
      targetBranchId: string;
    },
    context: ExecutionContext
  ): Promise<ActionResult> {
    const { sourceBranchId, targetBranchId } = data;
    
    console.log('[BranchHandler] Getting merge preview:', {
      sourceBranchId,
      targetBranchId,
      tenantId: context.tenantId
    });

    try {
      // Get all entities from source branch that are different from target branch
      const sourceEntities = await this.getBranchEntities(sourceBranchId, context.tenantId);
      const targetEntities = await this.getBranchEntities(targetBranchId, context.tenantId);
      
      console.log('🔍 [BranchHandler] MERGE PREVIEW DEBUG - Branch entity counts:', {
        sourceBranchId,
        targetBranchId,
        sourceCount: sourceEntities.length,
        targetCount: targetEntities.length,
        sourceEntities: sourceEntities.map(e => ({ id: e.id, name: e.name, type: e.entityType, branchId: e.branchId })),
        targetEntities: targetEntities.map(e => ({ id: e.id, name: e.name, type: e.entityType, branchId: e.branchId }))
      });

      // Calculate differences
      const changes = this.calculateBranchDifferences(sourceEntities, targetEntities);
      
      const addedCount = changes.filter(c => c.changeType === 'ADDED').length;
      const modifiedCount = changes.filter(c => c.changeType === 'MODIFIED').length;
      const deletedCount = changes.filter(c => c.changeType === 'DELETED').length;
      const conflictCount = changes.filter(c => c.hasConflict).length;

      const preview = {
        sourceBranchId,
        targetBranchId,
        addedCount,
        modifiedCount,
        deletedCount,
        conflictCount,
        canAutoMerge: conflictCount === 0,
        conflicts: changes.filter(c => c.hasConflict),
        changes
      };

      console.log('[BranchHandler] Merge preview calculated:', {
        addedCount,
        modifiedCount,
        deletedCount,
        conflictCount,
        totalChanges: changes.length
      });

      return {
        data: preview,
        meta: {
          branchId: context.branchId,
          cached: false, // Don't cache since branch data changes frequently
          operation: 'getMergePreview'
        }
      };
    } catch (error) {
      console.error('[BranchHandler] Error calculating merge preview:', error);
      
      // Fallback to basic preview on error
      return {
        data: {
          sourceBranchId,
          targetBranchId,
          addedCount: 0,
          modifiedCount: 0,
          deletedCount: 0,
          conflictCount: 0,
          canAutoMerge: true,
          conflicts: [],
          changes: []
        },
        meta: {
          branchId: context.branchId,
          cached: false,
          operation: 'getMergePreview'
        }
      };
    }
  }

  /**
   * Get all entities from a specific branch with enhanced change tracking
   */
  private async getBranchEntities(branchId: string, tenantId: string) {
    const entities = [];
    
    // Get all entity types that have branch context
    const entityTypes = ['Node', 'Process', 'Rule', 'Workflow', 'Office'];
    
    console.log('🔍 [BranchHandler] getBranchEntities called (GOLD STANDARD):', {
      branchId,
      tenantId,
      entityTypes
    });
    
    for (const entityType of entityTypes) {
      try {
        console.log(`🔍 [BranchHandler] Querying ${entityType} entities for branch ${branchId}`);
        
        // Map entity types to correct Prisma model names
        const modelName = entityType.toLowerCase();
        const originalIdField = `original${entityType}Id`;
        
        console.log(`🔍 [BranchHandler] Querying model: ${modelName}, originalIdField: ${originalIdField}`);
        
        // 🏆 GOLD STANDARD: Get entities with their latest version info
        const records = await this.prismaService.prisma[modelName].findMany({
          where: {
            tenantId,
            branchId
          },
          select: {
            id: true,
            name: true,
            updatedAt: true,
            version: true,
            [originalIdField]: true,
            createdAt: true,
            createdById: true,
            updatedById: true
          }
        });
        
        console.log(`🔍 [BranchHandler] Found ${records.length} ${entityType} entities:`, records);
        
        // 🏆 GOLD STANDARD: Get version history for each entity
        for (const record of records) {
          const versions = await this.prismaService.prisma.version.findMany({
            where: {
              entityType,
              entityId: record.id,
              branchId,
              tenantId
            },
            orderBy: { createdAt: 'desc' },
            take: 1, // Get latest version
            select: {
              id: true,
              sha: true,
              changeType: true,
              createdAt: true,
              message: true
            }
          });
          
          // 🏆 GOLD STANDARD: Get change logs for detailed change info
          const changeLogs = await this.prismaService.prisma.changeLog.findMany({
            where: {
              entityType,
              entityId: record.id,
              branchId,
              tenantId
            },
            orderBy: { timestamp: 'desc' },
            take: 5, // Get recent changes
            select: {
              id: true,
              changeType: true,
              timestamp: true,
              operationType: true,
              fieldChanges: true
            }
          });
          
          entities.push({
            ...record,
            entityType,
            originalId: record[`original${entityType}Id`],
            // 🏆 GOLD STANDARD: Enhanced change tracking data
            latestVersion: versions[0] || null,
            recentChanges: changeLogs,
            hasChanges: changeLogs.length > 0,
            changeCount: changeLogs.length
          });
        }
      } catch (error) {
        console.error(`🚨 [BranchHandler] Error querying ${entityType} (model: ${entityType.toLowerCase()}):`, {
          error: error.message,
          stack: error.stack,
          branchId,
          tenantId
        });
        // Continue with other entity types
      }
    }
    
    console.log('🔍 [BranchHandler] Total entities found (GOLD STANDARD):', {
      totalEntities: entities.length,
      entitiesWithChanges: entities.filter(e => e.hasChanges).length,
      totalChanges: entities.reduce((sum, e) => sum + e.changeCount, 0)
    });
    
    return entities;
  }

  /**
   * Calculate differences between source and target branch entities (GOLD STANDARD)
   */
  private calculateBranchDifferences(sourceEntities: any[], targetEntities: any[]) {
    const changes = [];
    
    console.log('🔍 [BranchHandler] calculateBranchDifferences called (GOLD STANDARD):', {
      sourceCount: sourceEntities.length,
      targetCount: targetEntities.length,
      sourceWithChanges: sourceEntities.filter(e => e.hasChanges).length,
      targetWithChanges: targetEntities.filter(e => e.hasChanges).length
    });
    
    // Create maps for faster lookup using lineage-based keys
    const targetMap = new Map();
    targetEntities.forEach(entity => {
      const key = entity.originalId || entity.id;
      targetMap.set(key, entity);
    });
    
    const sourceMap = new Map();
    sourceEntities.forEach(entity => {
      const key = entity.originalId || entity.id;
      sourceMap.set(key, entity);
    });
    
    console.log('🔍 [BranchHandler] Created lookup maps (GOLD STANDARD):', {
      targetMapSize: targetMap.size,
      sourceMapSize: sourceMap.size,
      targetKeys: Array.from(targetMap.keys()),
      sourceKeys: Array.from(sourceMap.keys())
    });
    
    // 🏆 GOLD STANDARD: Find added and modified entities using enhanced change tracking
    sourceEntities.forEach(sourceEntity => {
      const key = sourceEntity.originalId || sourceEntity.id;
      const targetEntity = targetMap.get(key);
      
      if (!targetEntity) {
        // Entity exists in source but not in target = ADDED
        changes.push({
          type: 'ADDED',
          entityType: sourceEntity.entityType,
          entityId: sourceEntity.id,
          entityName: sourceEntity.name,
          // 🏆 GOLD STANDARD: Enhanced change data
          latestVersion: sourceEntity.latestVersion,
          recentChanges: sourceEntity.recentChanges,
          changeCount: sourceEntity.changeCount,
          lastModified: sourceEntity.updatedAt,
          createdBy: sourceEntity.createdById,
          updatedBy: sourceEntity.updatedById
        });
      } else if (sourceEntity.updatedAt > targetEntity.updatedAt) {
        // Entity exists in both but source is newer = MODIFIED
        changes.push({
          type: 'MODIFIED',
          entityType: sourceEntity.entityType,
          entityId: sourceEntity.id,
          entityName: sourceEntity.name,
          // 🏆 GOLD STANDARD: Enhanced change comparison
          sourceVersion: sourceEntity.latestVersion,
          targetVersion: targetEntity.latestVersion,
          sourceChanges: sourceEntity.recentChanges,
          targetChanges: targetEntity.recentChanges,
          changeCount: sourceEntity.changeCount,
          lastModified: sourceEntity.updatedAt,
          previousModified: targetEntity.updatedAt,
          updatedBy: sourceEntity.updatedById
        });
      }
    });
    
    // 🏆 GOLD STANDARD: Find deleted entities (in target but not in source)
    targetEntities.forEach(targetEntity => {
      const key = targetEntity.originalId || targetEntity.id;
      const sourceEntity = sourceMap.get(key);
      
      if (!sourceEntity) {
        // Entity exists in target but not in source = DELETED
        changes.push({
          type: 'DELETED',
          entityType: targetEntity.entityType,
          entityId: targetEntity.id,
          entityName: targetEntity.name,
          // 🏆 GOLD STANDARD: Enhanced deletion tracking
          latestVersion: targetEntity.latestVersion,
          recentChanges: targetEntity.recentChanges,
          changeCount: targetEntity.changeCount,
          lastModified: targetEntity.updatedAt,
          deletedFrom: 'source'
        });
      }
    });
    
    console.log('🔍 [BranchHandler] Final changes calculated:', {
      totalChanges: changes.length,
      changes: changes.map(c => ({ 
        entityId: c.entityId, 
        entityType: c.entityType, 
        entityName: c.entityName, 
        changeType: c.changeType 
      }))
    });
    
    return changes;
  }

  // ============================================================================
  // BRANCH STATUS
  // ============================================================================

  private async handleGetBranchStatus(
    data: { branchId: string },
    context: ExecutionContext
  ): Promise<ActionResult> {
    const { branchId } = data;
    
    console.log('[BranchHandler] Getting branch status:', {
      branchId,
      tenantId: context.tenantId
    });

    // TODO: Implement actual branch status calculation
    // For now, return mock status
    const mockStatus: BranchStatus = {
      branchId,
      isAhead: false,
      isBehind: false,
      aheadCount: 0,
      behindCount: 0,
      hasLocalChanges: false,
      lastSync: new Date()
    };

    return {
      data: mockStatus,
      meta: {
        branchId: context.branchId,
        cached: true,
        ttl: 30000, // Cache for 30 seconds
        operation: 'getStatus'
      }
    };
  }

  // ============================================================================
  // BRANCH ACTIVITY
  // ============================================================================

  private async handleGetBranchActivity(
    data: { branchId: string },
    context: ExecutionContext
  ): Promise<ActionResult> {
    const { branchId } = data;
    
    console.log('[BranchHandler] Getting branch activity:', {
      branchId,
      tenantId: context.tenantId
    });

    // TODO: Implement actual activity tracking
    // For now, return mock activity
    const mockActivity: BranchActivity = {
      branchId,
      recentChanges: [],
      activeUsers: [],
      lastActivity: new Date()
    };

    return {
      data: mockActivity,
      meta: {
        branchId: context.branchId,
        cached: true,
        ttl: 60000, // Cache for 1 minute
        operation: 'getActivity'
      }
    };
  }

  // ============================================================================
  // SET DEFAULT BRANCH
  // ============================================================================

  private async handleSetDefault(
    data: { branchId: string },
    context: ExecutionContext
  ): Promise<ActionResult> {
    const { branchId } = data;
    
    console.log('[BranchHandler] Setting default branch:', {
      branchId,
      tenantId: context.tenantId
    });

    const branchSchema = getResourceByActionPrefix('branches');
    if (!branchSchema) {
      throw new Error('Branch schema not found');
    }

    const prismaContext = {
      tenantId: context.tenantId,
      branchId: context.branchId,
      defaultBranchId: context.defaultBranchId,
      userId: context.userId
    };

    // First, unset current default branch
    await this.prismaService.updateMany(
      branchSchema,
      { isDefault: true },
      { isDefault: false },
      prismaContext
    );

    // Set new default branch
    const updatedBranch = await this.prismaService.update(
      branchSchema,
      branchId,
      { isDefault: true },
      prismaContext
    );

    return {
      data: updatedBranch,
      meta: {
        branchId: context.branchId,
        cached: false,
        operation: 'setDefault'
      }
    };
  }

  // ============================================================================
  // ROLLBACK OPERATIONS
  // ============================================================================

  private async handleRollback(
    data: { mergeEventId: string; reason?: string },
    context: ExecutionContext
  ): Promise<ActionResult> {
    console.log('🔄 [BranchHandler] handleRollback started', {
      mergeEventId: data.mergeEventId,
      reason: data.reason,
      context,
      timestamp: new Date().toISOString()
    });

    try {
      const result = await rollbackService.rollbackMerge(data, context);
      
      return {
        data: result.data,
        meta: {
          branchId: context.branchId,
          cached: false,
          operation: 'rollback'
        }
      };
    } catch (error) {
      console.error('❌ [BranchHandler] Rollback failed:', error);
      throw error;
    }
  }

  private async handleGetRollbackable(
    data: { branchId?: string; limit?: number },
    context: ExecutionContext
  ): Promise<ActionResult> {
    console.log('📋 [BranchHandler] handleGetRollbackable started', {
      branchId: data.branchId || context.branchId,
      limit: data.limit,
      context,
      timestamp: new Date().toISOString()
    });

    try {
      const branchId = data.branchId || context.branchId;
      const result = await rollbackService.getRollbackableMerges(branchId, context, data.limit);
      
      return {
        data: result.data,
        meta: {
          branchId: context.branchId,
          cached: false,
          operation: 'getRollbackable'
        }
      };
    } catch (error) {
      console.error('❌ [BranchHandler] Get rollbackable merges failed:', error);
      throw error;
    }
  }
}
