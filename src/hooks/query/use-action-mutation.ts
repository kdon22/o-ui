/**
 * Action Mutation Hook - Optimistic updates with cache invalidation
 * 
 * Provides TanStack Mutation integration with ActionClient for writes
 */

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { ActionRequest, ActionResponse } from '@/lib/resource-system/schemas';
import { getActionClient } from '@/lib/action-client';
import { useEnterpriseSession } from '../use-enterprise-action-api';
import { invalidateCacheAfterMutation } from './cache-invalidation';

// ============================================================================
// TYPES
// ============================================================================

export interface ActionMutationOptions<TData = any, TVariables = any> extends Omit<UseMutationOptions<ActionResponse<TData>, Error, TVariables>, 'mutationFn'> {
  invalidateQueries?: string[];
  background?: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Optimistic mutation hook with automatic invalidation
 * 
 * @param action - Action name (e.g., 'node.create', 'process.update')
 * @param options - Mutation options with optimistic update support
 * @returns TanStack Mutation result with enhanced features
 */
export function useActionMutation<TData = any, TVariables = any>(
  action: string,
  options?: ActionMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const { session, branchContext, tenantId } = useEnterpriseSession();
  
  const mutationFn = useCallback(async (variables: TVariables): Promise<ActionResponse<TData>> => {
    // 🔍 DEBUG: Add stack trace to identify duplicate calls
    const stack = new Error().stack;
    const callerInfo = stack?.split('\n').slice(1, 6).join('\n    → ') || 'unknown';
    
    // Navigation context debug (detect in variables or hook options)
    const detectedNavigationContext = (variables as any)?.navigationContext || (options as any)?.navigationContext || null;
    const detectedNodeId = (variables as any)?.nodeId || (options as any)?.nodeId || null;
    const detectedProcessId = (variables as any)?.processId || (options as any)?.processId || null;

    console.log('🔥 [useActionMutation] Mutation function started', {
      action,
      variables,
      detectedNavigationContext,
      detectedNodeId,
      detectedProcessId,
      timestamp: new Date().toISOString(),
      callStack: callerInfo
    });
    
    // Ensure we have valid tenant ID
    const validTenantId = tenantId || session?.user?.tenantId;
    if (!validTenantId || typeof validTenantId !== 'string') {
      // Return error response instead of throwing during SSR
      return {
        success: false,
        error: 'Tenant ID not available - session not loaded yet',
        data: null,
        cached: false,
        executionTime: 0
      } as ActionResponse<TData>;
    }
    
    // Build navigationContext for junction auto-creation
    const navigationContext = {
      ...(detectedNavigationContext || {}),
      ...(detectedNodeId ? { nodeId: detectedNodeId } : {}),
      ...(detectedProcessId ? { processId: detectedProcessId } : {}),
    };

    const request: ActionRequest = {
      action,
      data: variables,
      options: {
        ...(options as any),
        navigationContext: Object.keys(navigationContext).length > 0 ? navigationContext : undefined,
      },
      branchContext: branchContext || undefined
    };

    console.log('🔥 [useActionMutation] Built ActionRequest', {
      action,
      hasData: !!request.data,
      hasNavigationContext: !!(request.options as any)?.navigationContext,
      navigationContext: (request.options as any)?.navigationContext,
      branchId: request.branchContext?.currentBranchId,
      timestamp: new Date().toISOString()
    });

    try {
      const actionClient = getActionClient(validTenantId);
      const result = await actionClient.executeAction(request);
      
      console.log('🔥 [useActionMutation] ActionClient.executeAction completed', {
        action,
        result,
        success: result.success,
        hasData: !!result.data,
        executionTime: result.executionTime,
        cached: result.cached,
        queued: result.queued,
        timestamp: new Date().toISOString()
      });
      
      // ✅ CRITICAL FIX: Check if ActionClient returned an error response
      if (!result.success) {
        const error = new Error(result.error || `Action ${action} failed`);
        console.error('🔥 [useActionMutation] ActionClient returned error response', {
          action,
          error: result.error,
          result,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
      
      console.log('🚀🚀🚀 [useActionMutation] About to return result - this should trigger onSuccess', {
        action,
        resultType: typeof result,
        resultKeys: Object.keys(result),
        timestamp: new Date().toISOString()
      });
      
      return result;
      
    } catch (error) {
      console.error('🔥 [useActionMutation] ActionClient.executeAction failed', {
        action,
        variables,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [action, options, branchContext?.currentBranchId, tenantId, session?.user?.tenantId]);

  // 🔍 DEBUG: Log the mutation options to see what's happening
  console.log('🔧 [useActionMutation] Setting up mutation options', {
    action,
    hasUserOnSuccess: !!options?.onSuccess,
    userOptionsKeys: options ? Object.keys(options) : [],
    timestamp: new Date().toISOString()
  });

  // Store user callbacks before they get overridden
  const userOnSuccess = options?.onSuccess;
  const userOnError = options?.onError;

  const mutationOptions: UseMutationOptions<ActionResponse<TData>, Error, TVariables> = {
    // Merge user options first (excluding callbacks)
    ...options,
    
    // Then override with our implementations
    mutationFn,
    
    // Success handler with automatic cache invalidation
    onSuccess: async (result, variables, context) => {
      console.log('🎉🎉🎉 [useActionMutation] Mutation succeeded, triggering cache invalidation', {
        action,
        variables,
        result,
        resultSuccess: result?.success,
        resultData: result?.data,
        timestamp: new Date().toISOString()
      });

      try {
        // 🚀 **FIXED**: Use the new focused cache invalidation service with forced refetch
        console.log('🔥🔥🔥 [useActionMutation] ABOUT TO CALL invalidateCacheAfterMutation');
        await invalidateCacheAfterMutation(
          queryClient,
          action,
          variables,
          options?.invalidateQueries
        );
        console.log('✅✅✅ [useActionMutation] invalidateCacheAfterMutation COMPLETED');
      } catch (error) {
        console.error('❌❌❌ [useActionMutation] invalidateCacheAfterMutation FAILED:', error);
      }

      // Call user's onSuccess handler if provided
      if (userOnSuccess) {
        console.log('🔄 [useActionMutation] Calling user onSuccess handler');
        userOnSuccess(result, variables, context);
      }
    },
    
    // Error handler
    onError: (error, variables, context) => {
      console.error('❌ [useActionMutation] Mutation failed', {
        action,
        variables,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });

      // Call user's onError handler if provided
      if (userOnError) {
        userOnError(error, variables, context);
      }
    },
  };

  // 🔍 DEBUG: Log final mutation options to see if user options are overriding onSuccess
  console.log('🔧 [useActionMutation] Final mutation options', {
    action,
    hasOnSuccess: !!mutationOptions.onSuccess,
    hasOnError: !!mutationOptions.onError,
    hasMutationFn: !!mutationOptions.mutationFn,
    finalOptionsKeys: Object.keys(mutationOptions),
    timestamp: new Date().toISOString()
  });

  return useMutation(mutationOptions);
}
