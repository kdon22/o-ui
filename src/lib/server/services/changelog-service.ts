/**
 * Enhanced ChangeLog Service - Complete Change Tracking
 * 
 * Tracks all entity operations with rich metadata for:
 * - Change viewing modal
 * - Audit trails
 * - Conflict detection
 * - Rollback operations
 * - Activity timelines
 */

import { prisma } from '@/lib/prisma';
import { versionService, type VersionContext, type FieldChange } from './version-service';
import type { ChangeType } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ChangeLogContext extends VersionContext {
  operationType: string; // 'entity_create', 'entity_update', 'entity_delete', 'merge', 'rollback'
  batchId?: string; // For grouping related changes
  parentChangeId?: string; // For change chains
  tags?: string[]; // For categorizing changes
  description?: string; // Human-readable description
}

export interface LogChangeRequest {
  entityType: string;
  entityId: string;
  originalEntityId?: string;
  changeType: ChangeType;
  beforeData?: any;
  afterData?: any;
  fieldChanges?: Record<string, FieldChange>;
  context: ChangeLogContext;
  mergeEventId?: string;
  rollbackEventId?: string;
  hasConflict?: boolean;
  conflictFields?: string[];
  conflictResolution?: any;
}

export interface ChangeTimeline {
  entityType: string;
  entityId: string;
  changes: ChangeTimelineItem[];
  totalChanges: number;
  branches: string[];
  contributors: string[];
}

export interface ChangeTimelineItem {
  id: string;
  operationType: string;
  changeType: ChangeType;
  description?: string;
  fieldChanges?: Record<string, FieldChange>;
  userId: string;
  userName?: string;
  branchId?: string;
  branchName?: string;
  timestamp: Date;
  versionId: string;
  versionSHA: string;
  hasConflict: boolean;
  conflictFields: string[];
  mergeEventId?: string;
  batchId?: string;
  tags: string[];
  relatedChanges?: string[]; // IDs of related changes
}

export interface ActivitySummary {
  totalChanges: number;
  changesByType: Record<ChangeType, number>;
  changesByUser: Record<string, number>;
  changesByBranch: Record<string, number>;
  recentActivity: ChangeTimelineItem[];
  conflictCount: number;
  rollbackCount: number;
}

// ============================================================================
// CHANGELOG SERVICE
// ============================================================================

export class ChangeLogService {
  
  /**
   * Log a change with complete tracking
   */
  async logChange(request: LogChangeRequest): Promise<string> {
    const startTime = Date.now();
    
    try {
      console.log('📝 [ChangeLogService] Logging change:', {
        entityType: request.entityType,
        entityId: request.entityId,
        changeType: request.changeType,
        operationType: request.context.operationType,
        tenantId: request.context.tenantId,
        branchId: request.context.branchId,
        timestamp: new Date().toISOString()
      });

      // Create version snapshot first
      const versionId = await versionService.createVersion({
        entityType: request.entityType,
        entityId: request.entityId,
        originalEntityId: request.originalEntityId,
        changeType: request.changeType,
        changeData: request.afterData || request.beforeData,
        fieldChanges: request.fieldChanges,
        beforeData: request.beforeData,
        afterData: request.afterData,
        context: request.context,
        mergeEventId: request.mergeEventId,
        isConflicted: request.hasConflict,
        conflictData: request.conflictResolution
      });

      // Create change log entry
      const changeLog = await prisma.changeLog.create({
        data: {
          operationType: request.context.operationType,
          entityType: request.entityType,
          entityId: request.entityId,
          originalEntityId: request.originalEntityId,
          changeType: request.changeType,
          versionId,
          beforeData: request.beforeData,
          afterData: request.afterData,
          fieldChanges: request.fieldChanges || {},
          branchId: request.context.branchId,
          tenantId: request.context.tenantId,
          userId: request.context.userId,
          sessionId: request.context.sessionId,
          requestId: request.context.requestId,
          parentChangeId: request.context.parentChangeId,
          mergeEventId: request.mergeEventId,
          rollbackEventId: request.rollbackEventId,
          batchId: request.context.batchId,
          reason: request.context.reason,
          description: request.context.description,
          tags: request.context.tags || [],
          hasConflict: request.hasConflict || false,
          conflictFields: request.conflictFields || [],
          conflictResolution: request.conflictResolution
        }
      });

      const executionTime = Date.now() - startTime;
      
      console.log('✅ [ChangeLogService] Change logged successfully:', {
        changeLogId: changeLog.id,
        versionId,
        entityType: request.entityType,
        entityId: request.entityId,
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      });

      return changeLog.id;
      
    } catch (error) {
      console.error('❌ [ChangeLogService] Failed to log change:', {
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
   * Get complete timeline for an entity
   */
  async getEntityTimeline(
    entityType: string,
    entityId: string,
    tenantId: string,
    options?: {
      branchId?: string;
      limit?: number;
      includeLineage?: boolean;
      includeRelated?: boolean;
    }
  ): Promise<ChangeTimeline> {
    
    console.log('📚 [ChangeLogService] Getting entity timeline:', {
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
          { entityId }, // Direct entity changes
        ]
      };

      // Include lineage changes if requested
      if (options?.includeLineage) {
        whereClause.OR.push({ originalEntityId: entityId });
      }

      // Filter by branch if specified
      if (options?.branchId) {
        whereClause.branchId = options.branchId;
      }

      // Get changes with related data
      const changes = await prisma.changeLog.findMany({
        where: whereClause,
        include: {
          version: {
            select: { id: true, sha: true }
          },
          user: {
            select: { id: true, name: true, email: true }
          },
          branch: {
            select: { id: true, name: true }
          },
          mergeEvent: {
            select: { id: true, message: true }
          },
          childChanges: options?.includeRelated ? {
            select: { id: true }
          } : false
        },
        orderBy: { timestamp: 'desc' },
        take: options?.limit || 100
      });

      // Transform to timeline items
      const timelineItems: ChangeTimelineItem[] = changes.map(change => ({
        id: change.id,
        operationType: change.operationType,
        changeType: change.changeType,
        description: change.description || undefined,
        fieldChanges: change.fieldChanges as Record<string, FieldChange> || undefined,
        userId: change.userId,
        userName: change.user.name || change.user.email,
        branchId: change.branchId || undefined,
        branchName: change.branch?.name,
        timestamp: change.timestamp,
        versionId: change.versionId,
        versionSHA: change.version.sha,
        hasConflict: change.hasConflict,
        conflictFields: change.conflictFields,
        mergeEventId: change.mergeEventId || undefined,
        batchId: change.batchId || undefined,
        tags: change.tags,
        relatedChanges: options?.includeRelated ? 
          change.childChanges?.map(c => c.id) : undefined
      }));

      // Extract unique branches and contributors
      const branches = [...new Set(changes.map(c => c.branchId).filter(Boolean))];
      const contributors = [...new Set(changes.map(c => c.userId))];

      const timeline: ChangeTimeline = {
        entityType,
        entityId,
        changes: timelineItems,
        totalChanges: timelineItems.length,
        branches,
        contributors
      };

      console.log('✅ [ChangeLogService] Timeline retrieved:', {
        entityType,
        entityId,
        changesFound: timelineItems.length,
        branches: branches.length,
        contributors: contributors.length,
        timestamp: new Date().toISOString()
      });

      return timeline;
      
    } catch (error) {
      console.error('❌ [ChangeLogService] Failed to get timeline:', {
        entityType,
        entityId,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Get activity summary for a branch or tenant
   */
  async getActivitySummary(
    tenantId: string,
    options?: {
      branchId?: string;
      entityType?: string;
      userId?: string;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    }
  ): Promise<ActivitySummary> {
    
    console.log('📊 [ChangeLogService] Getting activity summary:', {
      tenantId,
      options,
      timestamp: new Date().toISOString()
    });

    try {
      // Build where clause
      const whereClause: any = { tenantId };
      
      if (options?.branchId) whereClause.branchId = options.branchId;
      if (options?.entityType) whereClause.entityType = options.entityType;
      if (options?.userId) whereClause.userId = options.userId;
      if (options?.fromDate || options?.toDate) {
        whereClause.timestamp = {};
        if (options.fromDate) whereClause.timestamp.gte = options.fromDate;
        if (options.toDate) whereClause.timestamp.lte = options.toDate;
      }

      // Get all matching changes
      const changes = await prisma.changeLog.findMany({
        where: whereClause,
        include: {
          version: { select: { sha: true } },
          user: { select: { name: true, email: true } },
          branch: { select: { name: true } }
        },
        orderBy: { timestamp: 'desc' },
        take: options?.limit || 1000
      });

      // Calculate statistics
      const changesByType: Record<ChangeType, number> = {
        CREATE: 0,
        UPDATE: 0,
        DELETE: 0,
        MERGE: 0,
        ROLLBACK: 0,
        BRANCH_COPY: 0
      };

      const changesByUser: Record<string, number> = {};
      const changesByBranch: Record<string, number> = {};
      let conflictCount = 0;
      let rollbackCount = 0;

      changes.forEach(change => {
        // Count by type
        changesByType[change.changeType]++;
        
        // Count by user
        const userName = change.user.name || change.user.email;
        changesByUser[userName] = (changesByUser[userName] || 0) + 1;
        
        // Count by branch
        if (change.branchId && change.branch) {
          changesByBranch[change.branch.name] = (changesByBranch[change.branch.name] || 0) + 1;
        }
        
        // Count conflicts and rollbacks
        if (change.hasConflict) conflictCount++;
        if (change.changeType === 'ROLLBACK') rollbackCount++;
      });

      // Get recent activity (last 10 changes)
      const recentActivity: ChangeTimelineItem[] = changes.slice(0, 10).map(change => ({
        id: change.id,
        operationType: change.operationType,
        changeType: change.changeType,
        description: change.description || undefined,
        fieldChanges: change.fieldChanges as Record<string, FieldChange> || undefined,
        userId: change.userId,
        userName: change.user.name || change.user.email,
        branchId: change.branchId || undefined,
        branchName: change.branch?.name,
        timestamp: change.timestamp,
        versionId: change.versionId,
        versionSHA: change.version.sha,
        hasConflict: change.hasConflict,
        conflictFields: change.conflictFields,
        mergeEventId: change.mergeEventId || undefined,
        batchId: change.batchId || undefined,
        tags: change.tags
      }));

      const summary: ActivitySummary = {
        totalChanges: changes.length,
        changesByType,
        changesByUser,
        changesByBranch,
        recentActivity,
        conflictCount,
        rollbackCount
      };

      console.log('✅ [ChangeLogService] Activity summary generated:', {
        totalChanges: summary.totalChanges,
        conflictCount: summary.conflictCount,
        rollbackCount: summary.rollbackCount,
        timestamp: new Date().toISOString()
      });

      return summary;
      
    } catch (error) {
      console.error('❌ [ChangeLogService] Failed to get activity summary:', {
        tenantId,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Get related changes (same batch, session, or merge)
   */
  async getRelatedChanges(changeId: string, tenantId: string): Promise<ChangeTimelineItem[]> {
    const change = await prisma.changeLog.findUnique({
      where: { id: changeId },
      select: { 
        batchId: true, 
        sessionId: true, 
        mergeEventId: true,
        requestId: true 
      }
    });

    if (!change) return [];

    const whereClause: any = {
      tenantId,
      id: { not: changeId }, // Exclude the original change
      OR: []
    };

    // Find changes with same batch, session, merge, or request
    if (change.batchId) whereClause.OR.push({ batchId: change.batchId });
    if (change.sessionId) whereClause.OR.push({ sessionId: change.sessionId });
    if (change.mergeEventId) whereClause.OR.push({ mergeEventId: change.mergeEventId });
    if (change.requestId) whereClause.OR.push({ requestId: change.requestId });

    if (whereClause.OR.length === 0) return [];

    const relatedChanges = await prisma.changeLog.findMany({
      where: whereClause,
      include: {
        version: { select: { sha: true } },
        user: { select: { name: true, email: true } },
        branch: { select: { name: true } }
      },
      orderBy: { timestamp: 'asc' }
    });

    return relatedChanges.map(change => ({
      id: change.id,
      operationType: change.operationType,
      changeType: change.changeType,
      description: change.description || undefined,
      fieldChanges: change.fieldChanges as Record<string, FieldChange> || undefined,
      userId: change.userId,
      userName: change.user.name || change.user.email,
      branchId: change.branchId || undefined,
      branchName: change.branch?.name,
      timestamp: change.timestamp,
      versionId: change.versionId,
      versionSHA: change.version.sha,
      hasConflict: change.hasConflict,
      conflictFields: change.conflictFields,
      mergeEventId: change.mergeEventId || undefined,
      batchId: change.batchId || undefined,
      tags: change.tags
    }));
  }

  /**
   * Create a batch ID for grouping related changes
   */
  generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const changeLogService = new ChangeLogService();
