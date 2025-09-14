/**
 * Rollback Service - Full Transaction Rollback
 * 
 * Provides complete rollback capability for merge operations using the existing
 * action system infrastructure. Restores entities to their pre-merge state.
 */

import { prisma } from '@/lib/prisma';
import type { ActionResponse } from '@/lib/resource-system/schemas';
import type { ExecutionContext } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface RollbackRequest {
  mergeEventId: string;
  reason?: string;
}

interface RollbackSnapshot {
  entities: Record<string, any[]>;     // Entity type -> array of entities
  junctions: Record<string, any[]>;    // Junction type -> array of junction records
  metadata: {
    branchStates: any[];
    mergeTimestamp: string;
    affectedEntityTypes: string[];
  };
}

interface RollbackResult {
  success: boolean;
  mergeEventId: string;
  restoredEntities: number;
  restoredJunctions: number;
  error?: string;
  rollbackTimestamp: string;
}

// ============================================================================
// ROLLBACK SERVICE
// ============================================================================

export class RollbackService {
  
  /**
   * Execute full rollback of a merge operation
   */
  async rollbackMerge(
    request: RollbackRequest,
    context: ExecutionContext
  ): Promise<ActionResponse<RollbackResult>> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 [Rollback] Starting rollback operation:', {
        mergeEventId: request.mergeEventId,
        reason: request.reason,
        userId: context.userId,
        tenantId: context.tenantId,
        timestamp: new Date().toISOString()
      });

      // 1. Fetch merge event with rollback snapshot
      const mergeEvent = await prisma.mergeEvent.findUnique({
        where: { 
          id: request.mergeEventId,
          tenantId: context.tenantId // Ensure tenant isolation
        },
        select: {
          id: true,
          sha: true,
          sourceBranchId: true,
          targetBranchId: true,
          rollbackSnapshot: true,
          isRolledBack: true,
          createdAt: true,
          affectedEntities: true
        }
      });

      if (!mergeEvent) {
        return {
          success: false,
          error: 'Merge event not found',
          timestamp: Date.now(),
          action: 'rollback.merge'
        };
      }

      if (mergeEvent.isRolledBack) {
        return {
          success: false,
          error: 'Merge has already been rolled back',
          timestamp: Date.now(),
          action: 'rollback.merge'
        };
      }

      if (!mergeEvent.rollbackSnapshot) {
        return {
          success: false,
          error: 'No rollback snapshot available for this merge',
          timestamp: Date.now(),
          action: 'rollback.merge'
        };
      }

      // 2. Parse rollback snapshot
      const snapshot = mergeEvent.rollbackSnapshot as RollbackSnapshot;
      
      console.log('📸 [Rollback] Rollback snapshot loaded:', {
        entityTypes: Object.keys(snapshot.entities),
        junctionTypes: Object.keys(snapshot.junctions),
        totalEntities: Object.values(snapshot.entities).reduce((sum, arr) => sum + arr.length, 0),
        totalJunctions: Object.values(snapshot.junctions).reduce((sum, arr) => sum + arr.length, 0)
      });

      // 3. Execute rollback in transaction
      const result = await prisma.$transaction(async (tx) => {
        let restoredEntities = 0;
        let restoredJunctions = 0;

        // Restore entities
        for (const [entityType, entities] of Object.entries(snapshot.entities)) {
          for (const entity of entities) {
            try {
              // Use dynamic model access
              const model = (tx as any)[this.getModelName(entityType)];
              
              if (model) {
                await model.upsert({
                  where: { id: entity.id },
                  update: entity,
                  create: entity
                });
                restoredEntities++;
              }
            } catch (error) {
              console.error(`Failed to restore ${entityType} entity:`, error);
            }
          }
        }

        // Restore junction tables
        for (const [junctionType, junctions] of Object.entries(snapshot.junctions)) {
          for (const junction of junctions) {
            try {
              const model = (tx as any)[this.getModelName(junctionType)];
              
              if (model) {
                await model.upsert({
                  where: { id: junction.id },
                  update: junction,
                  create: junction
                });
                restoredJunctions++;
              }
            } catch (error) {
              console.error(`Failed to restore ${junctionType} junction:`, error);
            }
          }
        }

        // Mark merge as rolled back
        await tx.mergeEvent.update({
          where: { id: request.mergeEventId },
          data: {
            isRolledBack: true,
            rolledBackAt: new Date(),
            rolledBackById: context.userId,
            rollbackReason: request.reason
          }
        });

        return { restoredEntities, restoredJunctions };
      });

      const rollbackResult: RollbackResult = {
        success: true,
        mergeEventId: request.mergeEventId,
        restoredEntities: result.restoredEntities,
        restoredJunctions: result.restoredJunctions,
        rollbackTimestamp: new Date().toISOString()
      };

      console.log('✅ [Rollback] Rollback completed successfully:', {
        ...rollbackResult,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        data: rollbackResult,
        timestamp: Date.now(),
        action: 'rollback.merge'
      };

    } catch (error) {
      console.error('❌ [Rollback] Rollback failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown rollback error',
        timestamp: Date.now(),
        action: 'rollback.merge'
      };
    }
  }

  /**
   * Get recent merge events that can be rolled back
   */
  async getRollbackableMerges(
    branchId: string,
    context: ExecutionContext,
    limit = 10
  ): Promise<ActionResponse<any[]>> {
    try {
      const mergeEvents = await prisma.mergeEvent.findMany({
        where: {
          targetBranchId: branchId,
          tenantId: context.tenantId,
          isRolledBack: false,
          rollbackSnapshot: { not: null }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          sha: true,
          message: true,
          sourceBranchId: true,
          authorName: true,
          createdAt: true,
          affectedEntities: true
        }
      });

      return {
        success: true,
        data: mergeEvents,
        timestamp: Date.now(),
        action: 'rollback.list'
      };

    } catch (error) {
      console.error('❌ [Rollback] Failed to fetch rollbackable merges:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rollbackable merges',
        timestamp: Date.now(),
        action: 'rollback.list'
      };
    }
  }

  /**
   * Create rollback snapshot before merge
   * This should be called before executing a merge operation
   */
  async createRollbackSnapshot(
    sourceBranchId: string,
    targetBranchId: string,
    context: ExecutionContext
  ): Promise<RollbackSnapshot> {
    console.log('📸 [Rollback] Creating rollback snapshot:', {
      sourceBranchId,
      targetBranchId,
      tenantId: context.tenantId
    });

    // Get all entities in target branch before merge
    const entities: Record<string, any[]> = {};
    const junctions: Record<string, any[]> = {};

    // Entity types to snapshot
    const entityTypes = ['node', 'rule', 'process', 'workflow', 'office', 'setting'];
    
    for (const entityType of entityTypes) {
      try {
        const model = (prisma as any)[this.getModelName(entityType)];
        if (model) {
          const records = await model.findMany({
            where: {
              tenantId: context.tenantId,
              branchId: targetBranchId
            }
          });
          entities[entityType] = records;
        }
      } catch (error) {
        console.warn(`Failed to snapshot ${entityType}:`, error);
        entities[entityType] = [];
      }
    }

    // Junction types to snapshot
    const junctionTypes = ['nodeProcess', 'processRule', 'ruleIgnore', 'customerWorkflow'];
    
    for (const junctionType of junctionTypes) {
      try {
        const model = (prisma as any)[this.getModelName(junctionType)];
        if (model) {
          const records = await model.findMany({
            where: {
              tenantId: context.tenantId,
              branchId: targetBranchId
            }
          });
          junctions[junctionType] = records;
        }
      } catch (error) {
        console.warn(`Failed to snapshot ${junctionType}:`, error);
        junctions[junctionType] = [];
      }
    }

    const snapshot: RollbackSnapshot = {
      entities,
      junctions,
      metadata: {
        branchStates: [], // Could include branch metadata if needed
        mergeTimestamp: new Date().toISOString(),
        affectedEntityTypes: [...entityTypes, ...junctionTypes]
      }
    };

    console.log('📸 [Rollback] Snapshot created:', {
      entityTypes: Object.keys(entities),
      junctionTypes: Object.keys(junctions),
      totalEntities: Object.values(entities).reduce((sum, arr) => sum + arr.length, 0),
      totalJunctions: Object.values(junctions).reduce((sum, arr) => sum + arr.length, 0)
    });

    return snapshot;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private getModelName(entityType: string): string {
    // Convert entity type to Prisma model name
    const modelMap: Record<string, string> = {
      'node': 'node',
      'rule': 'rule',
      'process': 'process',
      'workflow': 'workflow',
      'office': 'office',
      'setting': 'setting',
      'nodeProcess': 'nodeProcess',
      'processRule': 'processRule',
      'ruleIgnore': 'ruleIgnore',
      'customerWorkflow': 'customerWorkflow'
    };

    return modelMap[entityType] || entityType;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const rollbackService = new RollbackService();
