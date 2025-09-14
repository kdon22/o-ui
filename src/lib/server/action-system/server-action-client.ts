/**
 * Server Action Client - Server-compatible action execution
 *
 * This provides a server-side interface to execute actions without React dependencies.
 * Used by server-side handlers and post-creation hooks.
 */

import { ActionRouterFactory } from '../core/action-router-core';
import type { ExecutionContext } from '../core/types';

export interface ServerActionClient {
  executeAction(action: string, data: any, context: ExecutionContext): Promise<any>;
}

/**
 * Server Action Client Factory
 *
 * Creates server-compatible action clients for use in server-side code
 */
// 🚀 **FIXED: Singleton ActionRouter to prevent Prisma schema inconsistencies during Fast Refresh**
const globalForServerActionClient = globalThis as unknown as {
  actionRouter: any | undefined
}

const getActionRouter = () => {
  if (!globalForServerActionClient.actionRouter) {
    // Import prisma client dynamically to avoid import issues
    const { prisma } = require('@/lib/prisma');
    globalForServerActionClient.actionRouter = ActionRouterFactory.create(prisma);
  }
  return globalForServerActionClient.actionRouter;
}

export class ServerActionClientFactory {
  /**
   * Get or create action router (singleton pattern, same as API route)
   */
  private static getActionRouter() {
    return getActionRouter();
  }

  /**
   * Create a server action client
   */
  static create(context: ExecutionContext): ServerActionClient {
    const actionRouter = this.getActionRouter();

    return {
      async executeAction(action: string, data: any, executionContext: ExecutionContext) {
        console.log('🔧 [ServerActionClient] Executing action:', {
          action,
          data,
          context: executionContext,
          timestamp: new Date().toISOString()
        });

        try {
          const result = await actionRouter.executeAction({
            action,
            data,
            options: {}
          }, executionContext);

          console.log('✅ [ServerActionClient] Action executed successfully:', {
            action,
            result,
            timestamp: new Date().toISOString()
          });

          return result;
        } catch (error) {
          console.error('❌ [ServerActionClient] Action execution failed:', {
            action,
            error: error instanceof Error ? error.message : error,
            timestamp: new Date().toISOString()
          });
          throw error;
        }
      }
    };
  }

  /**
   * Create a simple action executor for specific use cases
   */
  static createSimple(context: ExecutionContext) {
    const client = this.create(context);

    return {
      async execute(action: string, data: any) {
        const result = await client.executeAction(action, data, context);
        return result;
      }
    };
  }

  /**
   * Execute action directly (convenience method)
   */
  static async executeAction(action: string, data: any, context: ExecutionContext): Promise<any> {
    const client = this.create(context);
    return client.executeAction(action, data, context);
  }
}
