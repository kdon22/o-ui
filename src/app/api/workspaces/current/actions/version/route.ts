/**
 * Version API Route - Handle version history and operations
 * 
 * Endpoints:
 * - POST /api/workspaces/current/actions/version - Version operations (getHistory, rollback, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { versionService } from '@/lib/server/services/version-service';
import { changeLogService } from '@/lib/server/services/changelog-service';
import type { ActionResponse } from '@/lib/resource-system/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log('🔍 [Version API] Request received:', {
      action,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : []
    });

    switch (action) {
      case 'version.getHistory': {
        const { entityType, entityId, tenantId, branchId, includeLineage } = data;
        
        console.log('🔍 [Version API] Getting history for:', {
          entityType,
          entityId,
          tenantId,
          branchId
        });

        const history = await versionService.getEntityHistory(
          entityType,
          entityId,
          tenantId,
          {
            branchId,
            includeLineage,
            limit: 50 // Limit to recent 50 versions
          }
        );

        console.log('🔍 [Version API] History retrieved:', {
          historyCount: history.versions.length,
          firstItem: history.versions[0] ? {
            id: history.versions[0].id,
            changeType: history.versions[0].changeType,
            createdAt: history.versions[0].createdAt
          } : null
        });

        const response: ActionResponse = {
          success: true,
          data: {
            history,
            entityType,
            entityId
          },
          timestamp: Date.now(),
          action: 'version.getHistory'
        };
        return NextResponse.json(response);
      }

      case 'version.rollback': {
        const { entityType, entityId, targetVersionSha, tenantId, branchId, reason } = data;
        
        console.log('🔄 [Version API] Rolling back to version:', {
          entityType,
          entityId,
          targetVersionSha,
          tenantId,
          branchId,
          reason
        });

        const rollbackResult = await versionService.rollbackToVersion(
          entityType,
          entityId,
          targetVersionSha,
          {
            tenantId,
            branchId,
            userId: 'system', // TODO: Get from session
            reason
          }
        );

        console.log('✅ [Version API] Rollback completed:', {
          rollbackVersionId: rollbackResult.id,
          rollbackSha: rollbackResult.sha,
          entityType,
          entityId
        });

        const response: ActionResponse = {
          success: true,
          data: {
            rollbackVersionId: rollbackResult.id,
            rollbackSha: rollbackResult.sha,
            restoredData: rollbackResult.restoredData,
            message: `Successfully rolled back to version ${targetVersionSha.substring(0, 8)}`
          },
          timestamp: Date.now(),
          action: 'version.rollback'
        };
        return NextResponse.json(response);
      }

      case 'version.compare': {
        console.warn('🚨 [Version API] Compare not implemented yet');
        const errorResponse: ActionResponse = {
          success: false,
          error: 'Version comparison not implemented yet',
          timestamp: Date.now(),
          action: 'version.compare'
        };
        return NextResponse.json(errorResponse, { status: 501 });
      }

      case 'version.createBatch': {
        const { batchId, resourceType, changes, tenantId, branchId, description, tags } = data;
        
        console.log('📝 [Version API] Creating batch version:', {
          batchId,
          resourceType,
          changeCount: changes?.length,
          tenantId,
          branchId
        });

        // Create a single batch version record for all changes
        const batchVersionResult = await versionService.createBatchVersion(
          batchId,
          resourceType,
          changes,
          {
            tenantId,
            branchId,
            userId: 'system', // TODO: Get from session
            description,
            tags
          }
        );

        console.log('✅ [Version API] Batch version created:', {
          versionId: batchVersionResult.id,
          sha: batchVersionResult.sha,
          changeCount: changes?.length
        });

        const response: ActionResponse = {
          success: true,
          data: {
            versionId: batchVersionResult.id,
            sha: batchVersionResult.sha,
            changeCount: changes?.length
          },
          timestamp: Date.now(),
          action: 'version.createBatch'
        };
        return NextResponse.json(response);
      }

      case 'version.bulkRollback': {
        const { rollbackRequests, tenantId, branchId, reason } = data;
        
        console.log('🔄 [Version API] Starting bulk rollback:', {
          requestCount: rollbackRequests?.length,
          tenantId,
          branchId,
          reason
        });

        const bulkResult = await versionService.bulkRollback(
          rollbackRequests,
          {
            tenantId,
            branchId,
            userId: 'system', // TODO: Get from session
            reason
          }
        );

        console.log('✅ [Version API] Bulk rollback completed:', {
          total: bulkResult.summary.total,
          successful: bulkResult.summary.successful,
          failed: bulkResult.summary.failed
        });

        const response: ActionResponse = {
          success: true,
          data: bulkResult,
          timestamp: Date.now(),
          action: 'version.bulkRollback'
        };
        return NextResponse.json(response);
      }

      case 'version.bulkCreateVersions': {
        const { versionRequests, tenantId, branchId, message, reason } = data;
        
        console.log('📦 [Version API] Starting bulk version creation:', {
          requestCount: versionRequests?.length,
          tenantId,
          branchId,
          message
        });

        const bulkResult = await versionService.bulkCreateVersions(
          versionRequests,
          {
            tenantId,
            branchId,
            userId: 'system', // TODO: Get from session
            message,
            reason
          }
        );

        console.log('✅ [Version API] Bulk version creation completed:', {
          total: bulkResult.summary.total,
          successful: bulkResult.summary.successful,
          failed: bulkResult.summary.failed
        });

        const response: ActionResponse = {
          success: true,
          data: bulkResult,
          timestamp: Date.now(),
          action: 'version.bulkCreateVersions'
        };
        return NextResponse.json(response);
      }

      case 'changeLog.create': {
        const { 
          operationType, 
          entityType, 
          entityId, 
          changeType, 
          beforeData, 
          afterData, 
          fieldChanges, 
          branchId, 
          tenantId, 
          userId, 
          sessionId, 
          requestId, 
          reason, 
          description, 
          tags 
        } = data;
        
        console.log('📝 [Version API] Creating change log:', {
          operationType,
          entityType,
          entityId,
          changeType,
          tenantId,
          branchId
        });

        const changeLogResult = await changeLogService.logChange({
          entityType,
          entityId,
          changeType,
          beforeData,
          afterData,
          fieldChanges,
          context: {
            tenantId,
            branchId,
            userId: userId || 'system', // TODO: Get from session
            sessionId,
            requestId,
            operationType,
            reason,
            message: description,
            tags
          }
        });

        console.log('✅ [Version API] Change log created:', {
          changeLogId: changeLogResult,
          entityType,
          entityId
        });

        const response: ActionResponse = {
          success: true,
          data: {
            changeLogId: changeLogResult,
            versionId: changeLogResult, // ChangeLogService returns the changeLogId
            message: 'Change logged successfully'
          },
          timestamp: Date.now(),
          action: 'changeLog.create'
        };
        return NextResponse.json(response);
      }

      default:
        console.warn('🚨 [Version API] Unknown action:', action);
        const errorResponse: ActionResponse = {
          success: false,
          error: 'Unknown version action',
          timestamp: Date.now(),
          action: action || 'unknown'
        };
        return NextResponse.json(errorResponse, { status: 400 });
    }
  } catch (error) {
    console.error('🚨 [Version API] Error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });

    const errorResponse: ActionResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Version operation failed',
      timestamp: Date.now(),
      action: 'version.error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle other HTTP methods
export async function GET() {
  const errorResponse: ActionResponse = {
    success: false,
    error: 'Method not allowed',
    timestamp: Date.now(),
    action: 'version.get'
  };
  return NextResponse.json(errorResponse, { status: 405 });
}

export async function PUT() {
  const errorResponse: ActionResponse = {
    success: false,
    error: 'Method not allowed',
    timestamp: Date.now(),
    action: 'version.put'
  };
  return NextResponse.json(errorResponse, { status: 405 });
}

export async function DELETE() {
  const errorResponse: ActionResponse = {
    success: false,
    error: 'Method not allowed',
    timestamp: Date.now(),
    action: 'version.delete'
  };
  return NextResponse.json(errorResponse, { status: 405 });
}
