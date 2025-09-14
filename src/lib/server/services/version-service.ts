/**
 * Version Service - Git-like Commit System for Entity Changes
 * 
 * Creates version snapshots for every entity change, enabling:
 * - Complete change history tracking
 * - Diff generation between versions
 * - Rollback to any previous version
 * - Merge conflict detection
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import type { ChangeType } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface VersionContext {
  tenantId: string;
  userId: string;
  branchId: string;
  sessionId?: string;
  requestId?: string;
  message?: string;
  reason?: string;
}

export interface CreateVersionRequest {
  entityType: string;
  entityId: string;
  originalEntityId?: string;
  changeType: ChangeType;
  changeData: any; // Full entity snapshot
  fieldChanges?: Record<string, FieldChange>;
  beforeData?: any;
  afterData?: any;
  context: VersionContext;
  mergeEventId?: string;
  isConflicted?: boolean;
  conflictData?: any;
}

export interface FieldChange {
  from: any;
  to: any;
  type: 'added' | 'modified' | 'deleted';
}

export interface VersionDiff {
  entityType: string;
  entityId: string;
  fromVersion: string;
  toVersion: string;
  fieldChanges: Record<string, FieldChange>;
  summary: {
    fieldsAdded: number;
    fieldsModified: number;
    fieldsDeleted: number;
  };
}

export interface EntityHistory {
  entityType: string;
  entityId: string;
  originalEntityId?: string;
  versions: VersionHistoryItem[];
  totalVersions: number;
}

export interface VersionHistoryItem {
  id: string;
  sha: string;
  changeType: ChangeType;
  message?: string;
  userId: string;
  userName?: string;
  branchId: string;
  branchName?: string;
  createdAt: Date;
  fieldChanges?: Record<string, FieldChange>;
  isConflicted: boolean;
  mergeEventId?: string;
}

// ============================================================================
// VERSION SERVICE
// ============================================================================

export class VersionService {
  
  /**
   * Create a new version snapshot for an entity change
   */
  async createVersion(request: CreateVersionRequest): Promise<string> {
    const startTime = Date.now();
    
    try {
      console.log('📸 [VersionService] Creating version:', {
        entityType: request.entityType,
        entityId: request.entityId,
        changeType: request.changeType,
        tenantId: request.context.tenantId,
        branchId: request.context.branchId,
        timestamp: new Date().toISOString()
      });

      // Generate unique SHA for this version
      const sha = this.generateVersionSHA(request);
      
      // Get parent versions for lineage tracking
      const parentShas = await this.getParentVersions(
        request.entityType, 
        request.entityId, 
        request.context.branchId,
        request.context.tenantId
      );

      // Create version record
      const version = await prisma.version.create({
        data: {
          sha,
          parentShas,
          entityType: request.entityType,
          entityId: request.entityId,
          changeType: request.changeType,
          changeData: request.changeData, // Use 'changeData' field name from schema
          branchId: request.context.branchId,
          tenantId: request.context.tenantId,
          userId: request.context.userId, // Use 'userId' field name from schema
          message: request.context.message
        }
      });

      const executionTime = Date.now() - startTime;
      
      console.log('✅ [VersionService] Version created successfully:', {
        versionId: version.id,
        sha: version.sha,
        entityType: request.entityType,
        entityId: request.entityId,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      });

      return version.id;
      
    } catch (error) {
      console.error('❌ [VersionService] Failed to create version:', {
        entityType: request.entityType,
        entityId: request.entityId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Create a batch version for multiple changes (Enterprise Feature)
   */
  async createBatchVersion(
    batchId: string,
    resourceType: string,
    changes: any[],
    context: {
      tenantId: string;
      branchId: string;
      userId: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<{ id: string; sha: string }> {
    const startTime = Date.now();
    
    try {
      console.log('📦 [VersionService] Creating batch version:', {
        batchId,
        resourceType,
        changeCount: changes.length,
        tenantId: context.tenantId,
        branchId: context.branchId,
        timestamp: new Date().toISOString()
      });

      // Generate unique SHA for this batch
      const batchData = {
        batchId,
        resourceType,
        changes,
        timestamp: Date.now(),
        context
      };
      const sha = crypto.createHash('sha256')
        .update(JSON.stringify(batchData))
        .digest('hex')
        .substring(0, 12);

      // Create a single version record representing the batch
      const version = await prisma.version.create({
        data: {
          sha,
          parentShas: [], // Batch versions can have multiple parents
          entityType: 'BATCH',
          entityId: batchId,
          changeType: 'UPDATE', // Batch is always an update operation
          changeData: {
            batchId,
            resourceType,
            changes: changes.map(change => ({
              entityId: change.entityId,
              operation: change.operation,
              fieldChanges: change.fieldChanges,
              timestamp: change.timestamp
            })),
            summary: {
              totalChanges: changes.length,
              operations: {
                create: changes.filter(c => c.operation === 'create').length,
                update: changes.filter(c => c.operation === 'update').length,
                delete: changes.filter(c => c.operation === 'delete').length
              }
            }
          },
          branchId: context.branchId,
          tenantId: context.tenantId,
          userId: context.userId,
          message: context.description || `Batch update: ${changes.length} changes in ${resourceType}`
        }
      });

      const executionTime = Date.now() - startTime;
      
      console.log('✅ [VersionService] Batch version created successfully:', {
        versionId: version.id,
        sha: version.sha,
        batchId,
        changeCount: changes.length,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        id: version.id,
        sha: version.sha
      };
      
    } catch (error) {
      console.error('❌ [VersionService] Failed to create batch version:', {
        batchId,
        resourceType,
        changeCount: changes.length,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Rollback entity to a specific version (Enterprise Feature)
   */
  async rollbackToVersion(
    entityType: string,
    entityId: string,
    targetVersionSha: string,
    context: {
      tenantId: string;
      branchId: string;
      userId: string;
      reason?: string;
    }
  ): Promise<{ id: string; sha: string; restoredData: any }> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 [VersionService] Rolling back to version:', {
        entityType,
        entityId,
        targetVersionSha,
        tenantId: context.tenantId,
        branchId: context.branchId,
        timestamp: new Date().toISOString()
      });

      // Find the target version
      const targetVersion = await prisma.version.findFirst({
        where: {
          sha: targetVersionSha,
          entityType,
          entityId,
          tenantId: context.tenantId
        }
      });

      if (!targetVersion) {
        throw new Error(`Target version ${targetVersionSha} not found for entity ${entityId}`);
      }

      // Extract the data to restore from the target version
      const restoredData = targetVersion.changeData;
      
      if (!restoredData) {
        throw new Error(`No data found in target version ${targetVersionSha}`);
      }

      // Create a new version record for the rollback
      const rollbackSha = this.generateVersionSHA({
        entityType,
        entityId,
        changeType: 'UPDATE',
        changeData: restoredData,
        context: {
          ...context,
          message: `Rollback to version ${targetVersionSha}`
        }
      });

      // Get current parent versions
      const parentShas = await this.getParentVersions(
        entityType,
        entityId,
        context.branchId,
        context.tenantId
      );

      // Create the rollback version
      const rollbackVersion = await prisma.version.create({
        data: {
          sha: rollbackSha,
          parentShas: [...parentShas, targetVersionSha], // Include target as parent
          entityType,
          entityId,
          changeType: 'UPDATE',
          changeData: restoredData,
          branchId: context.branchId,
          tenantId: context.tenantId,
          userId: context.userId,
          message: context.reason || `Rollback to version ${targetVersionSha.substring(0, 8)}`
        }
      });

      const executionTime = Date.now() - startTime;
      
      console.log('✅ [VersionService] Rollback completed successfully:', {
        rollbackVersionId: rollbackVersion.id,
        rollbackSha: rollbackVersion.sha,
        targetVersionSha,
        entityType,
        entityId,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        id: rollbackVersion.id,
        sha: rollbackVersion.sha,
        restoredData
      };
      
    } catch (error) {
      console.error('❌ [VersionService] Failed to rollback to version:', {
        entityType,
        entityId,
        targetVersionSha,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Bulk rollback multiple entities to specific versions (Enterprise Feature)
   */
  async bulkRollback(
    rollbackRequests: Array<{
      entityType: string;
      entityId: string;
      targetVersionSha: string;
    }>,
    context: {
      tenantId: string;
      branchId: string;
      userId: string;
      reason?: string;
    }
  ): Promise<{
    successful: Array<{ entityId: string; rollbackVersionId: string; rollbackSha: string }>;
    failed: Array<{ entityId: string; error: string }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 [VersionService] Starting bulk rollback:', {
        requestCount: rollbackRequests.length,
        tenantId: context.tenantId,
        branchId: context.branchId,
        timestamp: new Date().toISOString()
      });

      const successful: Array<{ entityId: string; rollbackVersionId: string; rollbackSha: string }> = [];
      const failed: Array<{ entityId: string; error: string }> = [];

      // Process rollbacks in parallel with controlled concurrency
      const concurrency = 5; // Process 5 at a time to avoid overwhelming the database
      const chunks = [];
      for (let i = 0; i < rollbackRequests.length; i += concurrency) {
        chunks.push(rollbackRequests.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (request) => {
          try {
            const result = await this.rollbackToVersion(
              request.entityType,
              request.entityId,
              request.targetVersionSha,
              context
            );
            
            successful.push({
              entityId: request.entityId,
              rollbackVersionId: result.id,
              rollbackSha: result.sha
            });
          } catch (error) {
            failed.push({
              entityId: request.entityId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        });

        await Promise.all(chunkPromises);
      }

      const executionTime = Date.now() - startTime;
      
      console.log('✅ [VersionService] Bulk rollback completed:', {
        total: rollbackRequests.length,
        successful: successful.length,
        failed: failed.length,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        successful,
        failed,
        summary: {
          total: rollbackRequests.length,
          successful: successful.length,
          failed: failed.length
        }
      };
      
    } catch (error) {
      console.error('❌ [VersionService] Bulk rollback failed:', {
        requestCount: rollbackRequests.length,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Create bulk versions for multiple entities (Enterprise Feature)
   */
  async bulkCreateVersions(
    versionRequests: Array<{
      entityType: string;
      entityId: string;
      changeType: ChangeType;
      changeData: any;
      beforeData?: any;
      afterData?: any;
    }>,
    context: {
      tenantId: string;
      branchId: string;
      userId: string;
      message?: string;
      reason?: string;
    }
  ): Promise<{
    successful: Array<{ entityId: string; versionId: string; sha: string }>;
    failed: Array<{ entityId: string; error: string }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const startTime = Date.now();
    
    try {
      console.log('📦 [VersionService] Starting bulk version creation:', {
        requestCount: versionRequests.length,
        tenantId: context.tenantId,
        branchId: context.branchId,
        timestamp: new Date().toISOString()
      });

      const successful: Array<{ entityId: string; versionId: string; sha: string }> = [];
      const failed: Array<{ entityId: string; error: string }> = [];

      // Process versions in parallel with controlled concurrency
      const concurrency = 10; // Higher concurrency for version creation
      const chunks = [];
      for (let i = 0; i < versionRequests.length; i += concurrency) {
        chunks.push(versionRequests.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (request) => {
          try {
            const versionId = await this.createVersion({
              entityType: request.entityType,
              entityId: request.entityId,
              changeType: request.changeType,
              changeData: request.changeData,
              beforeData: request.beforeData,
              afterData: request.afterData,
              context: {
                tenantId: context.tenantId,
                branchId: context.branchId,
                userId: context.userId,
                message: context.message,
                reason: context.reason
              }
            });

            // Get the SHA from the created version
            const version = await prisma.version.findUnique({
              where: { id: versionId },
              select: { sha: true }
            });
            
            successful.push({
              entityId: request.entityId,
              versionId,
              sha: version?.sha || 'unknown'
            });
          } catch (error) {
            failed.push({
              entityId: request.entityId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        });

        await Promise.all(chunkPromises);
      }

      const executionTime = Date.now() - startTime;
      
      console.log('✅ [VersionService] Bulk version creation completed:', {
        total: versionRequests.length,
        successful: successful.length,
        failed: failed.length,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        successful,
        failed,
        summary: {
          total: versionRequests.length,
          successful: successful.length,
          failed: failed.length
        }
      };
      
    } catch (error) {
      console.error('❌ [VersionService] Bulk version creation failed:', {
        requestCount: versionRequests.length,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Get complete history for an entity
   */
  async getEntityHistory(
    entityType: string, 
    entityId: string, 
    tenantId: string,
    options?: {
      branchId?: string;
      limit?: number;
      includeLineage?: boolean;
    }
  ): Promise<EntityHistory> {
    
    console.log('📚 [VersionService] Getting entity history:', {
      entityType,
      entityId,
      tenantId,
      options,
      timestamp: new Date().toISOString()
    });

    try {
      // Build where clause
      const whereClause: any = {
        tenantId,
        OR: [
          { entityId }, // Direct entity versions
        ]
      };

      // Include lineage versions if requested
      if (options?.includeLineage) {
        whereClause.OR.push({ originalEntityId: entityId });
      }

      // Filter by branch if specified
      if (options?.branchId) {
        whereClause.branchId = options.branchId;
      }

      // Get versions with related data
      const versions = await prisma.version.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          branch: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100
      });

      // Transform to history items
      const historyItems: VersionHistoryItem[] = versions.map(version => ({
        id: version.id,
        sha: version.sha,
        changeType: version.changeType,
        message: version.message || undefined,
        userId: version.userId,
        userName: version.user?.name || version.user?.email || 'Unknown',
        branchId: version.branchId,
        branchName: version.branch?.name || 'Unknown',
        createdAt: version.createdAt,
        fieldChanges: undefined, // Will be implemented when schema is updated
        isConflicted: false, // Will be implemented when schema is updated
        mergeEventId: undefined // Will be implemented when schema is updated
      }));

      // Get original entity ID for lineage (will be implemented when schema is updated)
      const originalEntityId = undefined;

      const history: EntityHistory = {
        entityType,
        entityId,
        originalEntityId,
        versions: historyItems,
        totalVersions: historyItems.length
      };

      console.log('✅ [VersionService] Entity history retrieved:', {
        entityType,
        entityId,
        versionsFound: historyItems.length,
        timestamp: new Date().toISOString()
      });

      return history;
      
    } catch (error) {
      console.error('❌ [VersionService] Failed to get entity history:', {
        entityType,
        entityId,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Generate diff between two versions
   */
  async generateDiff(fromVersionId: string, toVersionId: string): Promise<VersionDiff> {
    console.log('🔍 [VersionService] Generating diff:', {
      fromVersionId,
      toVersionId,
      timestamp: new Date().toISOString()
    });

    try {
      // Get both versions
      const [fromVersion, toVersion] = await Promise.all([
        prisma.version.findUnique({ where: { id: fromVersionId } }),
        prisma.version.findUnique({ where: { id: toVersionId } })
      ]);

      if (!fromVersion || !toVersion) {
        throw new Error('One or both versions not found');
      }

      if (fromVersion.entityType !== toVersion.entityType || 
          fromVersion.entityId !== toVersion.entityId) {
        throw new Error('Versions must be for the same entity');
      }

      // Generate field-level diff
      const fieldChanges = this.calculateFieldChanges(
        fromVersion.changeData as any,
        toVersion.changeData as any
      );

      // Calculate summary
      const summary = {
        fieldsAdded: Object.values(fieldChanges).filter(c => c.type === 'added').length,
        fieldsModified: Object.values(fieldChanges).filter(c => c.type === 'modified').length,
        fieldsDeleted: Object.values(fieldChanges).filter(c => c.type === 'deleted').length
      };

      const diff: VersionDiff = {
        entityType: fromVersion.entityType,
        entityId: fromVersion.entityId,
        fromVersion: fromVersion.sha,
        toVersion: toVersion.sha,
        fieldChanges,
        summary
      };

      console.log('✅ [VersionService] Diff generated:', {
        entityType: diff.entityType,
        entityId: diff.entityId,
        summary: diff.summary,
        timestamp: new Date().toISOString()
      });

      return diff;
      
    } catch (error) {
      console.error('❌ [VersionService] Failed to generate diff:', {
        fromVersionId,
        toVersionId,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Get version by SHA
   */
  async getVersionBySHA(sha: string, tenantId: string) {
    return await prisma.version.findFirst({
      where: { sha, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } }
      }
    });
  }

  /**
   * Get latest version for an entity
   */
  async getLatestVersion(entityType: string, entityId: string, branchId: string, tenantId: string) {
    return await prisma.version.findFirst({
      where: {
        entityType,
        entityId,
        branchId,
        tenantId
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Generate unique SHA for version
   */
  private generateVersionSHA(request: CreateVersionRequest): string {
    const content = JSON.stringify({
      entityType: request.entityType,
      entityId: request.entityId,
      changeType: request.changeType,
      changeData: request.changeData,
      timestamp: Date.now(),
      userId: request.context.userId,
      branchId: request.context.branchId
    });
    
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 40);
  }

  /**
   * Get parent version SHAs for lineage tracking
   */
  private async getParentVersions(
    entityType: string, 
    entityId: string, 
    branchId: string, 
    tenantId: string
  ): Promise<string[]> {
    
    const latestVersion = await this.getLatestVersion(entityType, entityId, branchId, tenantId);
    return latestVersion ? [latestVersion.sha] : [];
  }

  /**
   * Calculate field-level changes between two data objects
   */
  private calculateFieldChanges(fromData: any, toData: any): Record<string, FieldChange> {
    const changes: Record<string, FieldChange> = {};
    
    // Get all unique field names
    const allFields = new Set([
      ...Object.keys(fromData || {}),
      ...Object.keys(toData || {})
    ]);

    for (const field of allFields) {
      const fromValue = fromData?.[field];
      const toValue = toData?.[field];

      if (fromValue === undefined && toValue !== undefined) {
        // Field added
        changes[field] = { from: undefined, to: toValue, type: 'added' };
      } else if (fromValue !== undefined && toValue === undefined) {
        // Field deleted
        changes[field] = { from: fromValue, to: undefined, type: 'deleted' };
      } else if (JSON.stringify(fromValue) !== JSON.stringify(toValue)) {
        // Field modified
        changes[field] = { from: fromValue, to: toValue, type: 'modified' };
      }
    }

    return changes;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const versionService = new VersionService();
