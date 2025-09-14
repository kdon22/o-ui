/**
 * Action Router Core - Refactored Orchestrator
 * 
 * Clean, focused orchestration of action routing using modular handlers
 */

import { parseAction, getResourceSchema } from '../utils/action-parser';
import { getActionMetadata } from '../utils/action-metadata';
import { ActionHandlerFactory } from '../handlers';
import { PrismaService } from '../../prisma/prisma-service';
import type { 
  ActionRequest, 
  ExecutionContext, 
  ActionResult,
  ParsedAction 
} from '../core/types';

export class ActionRouterCore {
  private prismaService: PrismaService;
  private handlerFactory: ActionHandlerFactory;

  constructor(prismaClient: any) {
    // ActionRouterCore initialized with Prisma client
    
    if (!prismaClient) {
      throw new Error('ActionRouterCore requires a Prisma client instance. Use ActionRouterFactory.create() for proper initialization.');
    }
    
    // Initialize PrismaService with injected client
    this.prismaService = new PrismaService(prismaClient);
    this.handlerFactory = new ActionHandlerFactory(this.prismaService);
    
    // PrismaService and HandlerFactory initialized successfully
  }

  /**
   * Execute an action by routing it to the appropriate handler
   */
  async executeAction(
    request: ActionRequest,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const { action, data, options } = request;
    
    console.log('🔥 [ActionRouterCore] executeAction started', {
      action,
      data,
      options,
      context,
      timestamp: new Date().toISOString()
    });
    
    try {
      // 1. Parse action to get resource type and operation
      const parsedAction = parseAction(action);
      if (!parsedAction) {
        console.error('🔥 [ActionRouterCore] Invalid action format', {
          action,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Invalid action format: ${action}`);
      }

      console.log('🔥 [ActionRouterCore] Action parsed successfully', {
        action,
        parsedAction,
        timestamp: new Date().toISOString()
      });

      // 2. Get resource schema
      const schema = getResourceSchema(parsedAction.resourceType);
      if (!schema) {
        console.error('🔥 [ActionRouterCore] Resource schema not found', {
          resourceType: parsedAction.resourceType,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Resource not found: ${parsedAction.resourceType}`);
      }

      // 3. Get appropriate handler
      const handler = this.handlerFactory.getHandler(parsedAction.operation, parsedAction.resourceType);
      if (!handler) {
        console.error('🔥 [ActionRouterCore] Handler not found', {
          operation: parsedAction.operation,
          resourceType: parsedAction.resourceType,
          availableHandlers: this.handlerFactory.getSupportedOperations(),
          timestamp: new Date().toISOString()
        });
        throw new Error(`Unsupported operation: ${parsedAction.operation}`);
      }

      // 4. Execute the handler
      console.log('🔥 [ActionRouterCore] Executing handler', {
        resourceType: parsedAction.resourceType,
        operation: parsedAction.operation,
        timestamp: new Date().toISOString()
      });

      const result = await handler.handle(
        parsedAction.resourceType,
        data,
        options,
        context
      );

      console.log('🔥 [ActionRouterCore] Action executed successfully', {
        action,
        result,
        timestamp: new Date().toISOString()
      });

      return result;

    } catch (error) {
      console.error('🔥 [ActionRouterCore] Action execution failed', {
        action,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Get metadata about available actions and their configurations
   */
  getActionMetadata(): any {
    return getActionMetadata();
  }

  /**
   * Check if an action is supported
   */
  isActionSupported(action: string): boolean {
    const parsedAction = parseAction(action);
    if (!parsedAction) return false;

    const schema = getResourceSchema(parsedAction.resourceType);
    const hasHandler = this.handlerFactory.hasHandler(parsedAction.operation);
    
    return !!(schema && hasHandler);
  }
}

// ============================================================================
// ACTION ROUTER FACTORY
// ============================================================================

export class ActionRouterFactory {
  /**
   * Create ActionRouter with Prisma client (production)
   * Prisma client must be provided by the calling code
   */
  static create(prismaClient: any): ActionRouterCore {
    // Creating ActionRouterCore with Prisma client
    
    if (!prismaClient) {
      throw new Error('Prisma client is required for ActionRouter initialization');
    }
    
    const router = new ActionRouterCore(prismaClient);
    // ActionRouterCore created successfully
    return router;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Create ActionRouter instance (requires Prisma client)
 */
export const createActionRouter = ActionRouterFactory.create;