/**
 * SSOT Action Handler Endpoint
 * 
 * Central endpoint that handles all resource actions from the ActionClient.
 * Routes actions to appropriate resource handlers based on action mappings.
 * Supports branch-aware operations, authentication, and standardized responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ActionRequest, ActionResponse } from '@/lib/resource-system/schemas';
import { ActionRouterFactory } from '@/lib/server/action-system';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getResourceByActionPrefix } from '@/lib/resource-system/resource-registry';

// Use shared Prisma client for consistency
import { prisma } from '@/lib/prisma';

// 🚀 **FIXED: Singleton ActionRouter to prevent Prisma schema inconsistencies during Fast Refresh**
const globalForActionRouter = globalThis as unknown as {
  actionRouter: any | undefined
}

const getActionRouter = () => {
  if (!globalForActionRouter.actionRouter) {
    // Creating singleton ActionRouter instance
    globalForActionRouter.actionRouter = ActionRouterFactory.create(prisma);
  }
  return globalForActionRouter.actionRouter;
}

/**
 * Check if an action requires branch context based on the resource schema
 */
function checkIfActionRequiresBranchContext(action: string): boolean {
  try {
    // Extract resource type from action (e.g., 'packageInstallations.list' -> 'packageInstallations')
    const resourceType = action.split('.')[0];
    const schema = getResourceByActionPrefix(resourceType);
    
    // If schema has notHasBranchContext: true, then it doesn't require branch context
    return !schema?.notHasBranchContext;
  } catch (error) {
    // If we can't determine the schema, assume branch context is required for safety
    console.warn(`Could not determine branch context requirement for action: ${action}`, error);
    return true;
  }
}

// In development, always reuse the same instance
if (process.env.NODE_ENV !== 'production') {
  // Keep singleton in global scope to persist across Fast Refresh
  // This prevents schema inconsistencies during Hot Module Reloading
}

/**
 * POST /api/workspaces/current/actions
 * 
 * Handles all resource actions from the ActionClient:
 * - CRUD operations (create, read, update, delete)
 * - Custom actions defined in resource schemas
 * - Branch-aware operations with Copy-on-Write
 * - Bulk operations and tree operations
 */
export async function POST(request: NextRequest) {
  // POST /api/workspaces/current/actions - Request received
  const startTime = Date.now();
  let actionRequest: ActionRequest | undefined;

  try {
    // 1. Extract request data
    const body = await request.json();
    console.log('🔥 [API] Request body:', {
      body,
      hasAction: !!body.action,
      hasData: !!body.data,
      hasOptions: !!body.options,
      hasContext: !!body.context,
      hasBranchContext: !!body.branchContext,
      timestamp: new Date().toISOString()
    });

    actionRequest = {
      action: body.action,
      data: body.data,
      options: body.options,
      context: body.context,
      branchContext: body.branchContext
    };

    // 2. Validate action request
    if (!actionRequest.action) {
      console.error('🔥 [API] No action provided in request');
      return NextResponse.json({
        success: false,
        error: 'Action is required',
        timestamp: Date.now(),
        action: actionRequest.action
      }, { status: 400 });
    }

    // 3. Extract context
    // Extracting context from request and session
    
    const session = await getServerSession(authOptions);
    
    // 🔒 SECURITY: Tenant ID must ONLY come from authenticated session
    if (!session?.user?.tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required - no valid session found',
        timestamp: Date.now(),
        action: actionRequest.action
      }, { status: 401 });
    }
    
    const tenantId = session.user.tenantId; // Only from session - never from headers
    const userId = session.user.id;

    // IMPORTANT: Branch context must always come from the authenticated session.
    // Never trust client-provided branch identifiers and never fall back to names.
    const sessionBranchContext = session?.user?.branchContext as
      | { currentBranchId: string; defaultBranchId: string }
      | undefined;

    // Prefer request values for immediate operations; fall back to session if not provided
    // This ensures the client's current branch context is respected for queries
    const branchId = actionRequest.branchContext?.currentBranchId ?? sessionBranchContext?.currentBranchId;
    const defaultBranchId = actionRequest.branchContext?.defaultBranchId ?? sessionBranchContext?.defaultBranchId;

    // Check if this action requires branch context
    const requiresBranchContext = checkIfActionRequiresBranchContext(actionRequest.action);
    
    // Enforce presence of branch context only for actions that need it
    if (requiresBranchContext && (!branchId || !defaultBranchId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Branch context is required and must come from the authenticated session.',
          timestamp: Date.now(),
          action: actionRequest.action
        },
        { status: 400 }
      );
    }
    
    console.log('🔥 [API] Extracted context:', {
      tenantId,
      userId,
      branchId,
      defaultBranchId,
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionTenantId: session?.user?.tenantId,
      sessionBranchContext: session?.user?.branchContext,
      timestamp: new Date().toISOString()
    });

    // 4. Route and execute action using ActionRouter
    // Creating ActionRouter and preparing execution context
    const actionRouter = getActionRouter();
    
    const executionContext = {
      userId,
      tenantId,
      branchId: requiresBranchContext ? branchId : undefined,
      defaultBranchId: requiresBranchContext ? defaultBranchId : undefined,
      session
    };
    
    console.log('🔥 [API] Execution context prepared:', {
      executionContext,
      actionRequest,
      timestamp: new Date().toISOString()
    });

    console.log(`🔥 [API] Executing action: ${actionRequest.action}`, {
      action: actionRequest.action,
      tenantId,
      userId,
      branchId,
      data: actionRequest.data,
      options: actionRequest.options,
      timestamp: new Date().toISOString()
    });

    try {
      const result = await actionRouter.executeAction(actionRequest, executionContext);
      
      console.log('🔥 [API] ActionRouter.executeAction completed successfully', {
        action: actionRequest.action,
        result,
        hasData: !!result.data,
        resultMeta: result.meta,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      const response: ActionResponse = {
        success: true,
        data: result.data,
        junctions: result.junctions, // Include junction data from ActionRouter
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
        action: actionRequest.action,
        // @ts-expect-error - meta field needed for client storage helpers
        meta: {
          operation: 'read',
          branchId,
          defaultBranchId
        }
      };

      console.log(`🔥 [API] Action ${actionRequest.action} completed successfully`, {
        response,
        hasJunctions: !!result.junctions,
        junctionTables: result.junctions ? Object.keys(result.junctions) : [],
        junctionCounts: result.junctions ? Object.fromEntries(
          Object.entries(result.junctions).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
        ) : {},
        totalExecutionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(response);
      
    } catch (executionError) {
      console.error('🔥 [API] ActionRouter.executeAction failed', {
        action: actionRequest.action,
        executionContext,
        error: executionError instanceof Error ? executionError.message : executionError,
        stack: executionError instanceof Error ? executionError.stack : undefined,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      
      throw executionError;
    }

  } catch (error) {
    console.error('🔥 [API] POST /api/workspaces/current/actions - Request failed', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
    const errorResponse: ActionResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      executionTime: Date.now() - startTime,
      timestamp: Date.now(),
      action: actionRequest?.action || 'unknown',
      // @ts-expect-error - debug field needed for development debugging
      debug: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        actionRequest: actionRequest ? {
          action: actionRequest.action,
          hasData: !!actionRequest.data,
          hasOptions: !!actionRequest.options,
          hasContext: !!actionRequest.context,
          hasBranchContext: !!actionRequest.branchContext
        } : 'actionRequest not yet assigned'
      } : undefined
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/workspaces/current/actions
 * 
 * Returns metadata about available actions and their configurations
 */
export async function GET(request: NextRequest) {
  try {
    // Return action metadata from ActionRouter
    const actionRouter = getActionRouter();
    const metadata = actionRouter.getActionMetadata();
    
    return NextResponse.json({
      success: true,
      data: metadata,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error(`[ActionHandler] Failed to get action metadata`, {
      error: error.message
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve action metadata',
      timestamp: Date.now()
    }, { status: 500 });
  }
}