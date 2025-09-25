/**
 * Queue Operations Hook - Reusable queue management operations
 * 
 * Features:
 * - Individual queue operations (pause, resume, sleep, fail)
 * - Bulk queue operations with confirmation
 * - Loading states and error handling  
 * - Action system integration
 * - TypeScript safety
 */

import { useCallback, useState } from 'react';
import { useActionMutation } from '@/hooks/use-action-api';
import { useConfirmDialog } from '@/components/ui/hooks/useConfirmDialog';
import { confirm } from '@/components/ui/confirm';

export interface QueueOperationOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  skipConfirmation?: boolean;
}

export interface SleepOptions {
  duration?: number; // minutes
  sleepUntil?: Date;
  reason?: string;
}

export interface BulkOperationOptions {
  queueIds: string[];
  reason?: string;
  options?: Record<string, any>;
}

export const useQueueOperations = () => {
  const { showConfirmDialog, modal } = useConfirmDialog();
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(new Set());

  // Individual queue update mutation
  const updateMutation = useActionMutation('queues.update', {
    onSuccess: () => {
      // Success handled by individual operations
    },
    onError: (error) => {
      console.error('Queue operation failed:', error);
    }
  });

  // Bulk queue operations mutation
  const bulkUpdateMutation = useActionMutation('queues.bulkUpdate', {
    onSuccess: () => {
      // Success handled by individual operations
    },
    onError: (error) => {
      console.error('Bulk queue operation failed:', error);
    }
  });

  // Track loading state for specific operation
  const setOperationLoading = useCallback((operationKey: string, loading: boolean) => {
    setLoadingOperations(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(operationKey);
      } else {
        newSet.delete(operationKey);
      }
      return newSet;
    });
  }, []);

  // Check if operation is loading
  const isOperationLoading = useCallback((operationKey: string) => {
    return loadingOperations.has(operationKey);
  }, [loadingOperations]);

  // Individual Queue Operations
  const pauseQueue = useCallback(async (
    queueId: string, 
    reason: string = 'Manual pause',
    options: QueueOperationOptions = {}
  ) => {
    const operationKey = `pause-${queueId}`;
    
    const executeOperation = async () => {
      setOperationLoading(operationKey, true);
      
      try {
        await updateMutation.mutateAsync({
          id: queueId,
          updates: {
            healthStatus: 'WARNING',
            isActive: false
          }
        });
        
        options.onSuccess?.();
      } catch (error) {
        options.onError?.(error);
        throw error;
      } finally {
        setOperationLoading(operationKey, false);
      }
    };

    if (!options.skipConfirmation) {
      showConfirmDialog(
        executeOperation,
        confirm.custom({
          title: 'Pause Queue',
          description: `This will temporarily stop processing for this queue.\n\nReason: ${reason}`,
          variant: 'default',
          confirmLabel: 'Pause Queue'
        })
      );
    } else {
      executeOperation();
    }
  }, [updateMutation, showConfirmDialog, setOperationLoading]);

  const resumeQueue = useCallback(async (
    queueId: string,
    options: QueueOperationOptions = {}
  ) => {
    const operationKey = `resume-${queueId}`;
    setOperationLoading(operationKey, true);
    
    try {
      await updateMutation.mutateAsync({
        id: queueId,
        updates: {
          healthStatus: 'HEALTHY',
          isActive: true
        }
      });
      
      options.onSuccess?.();
    } catch (error) {
      options.onError?.(error);
      throw error;
    } finally {
      setOperationLoading(operationKey, false);
    }
  }, [updateMutation, setOperationLoading]);

  const sleepQueue = useCallback(async (
    queueId: string,
    sleepOptions: SleepOptions,
    options: QueueOperationOptions = {}
  ) => {
    const operationKey = `sleep-${queueId}`;
    
    const executeOperation = async () => {
      setOperationLoading(operationKey, true);
      
      try {
        // Calculate sleep until time
        let sleepUntil: Date;
        if (sleepOptions.sleepUntil) {
          sleepUntil = sleepOptions.sleepUntil;
        } else if (sleepOptions.duration) {
          sleepUntil = new Date(Date.now() + sleepOptions.duration * 60 * 1000);
        } else {
          sleepUntil = new Date(Date.now() + 60 * 60 * 1000); // Default 1 hour
        }

        await updateMutation.mutateAsync({
          id: queueId,
          updates: {
            healthStatus: 'WARNING',
            isActive: false,
            // Note: Assuming sleepUntil field exists in schema
            // sleepUntil: sleepUntil.toISOString(),
            // pauseReason: sleepOptions.reason || 'Scheduled sleep'
          }
        });
        
        options.onSuccess?.();
      } catch (error) {
        options.onError?.(error);
        throw error;
      } finally {
        setOperationLoading(operationKey, false);
      }
    };

    if (!options.skipConfirmation) {
      const duration = sleepOptions.duration || 60;
      showConfirmDialog(
        executeOperation,
        confirm.custom({
          title: 'Sleep Queue',
          description: `This will put the queue to sleep for ${duration} minutes.\n\nReason: ${sleepOptions.reason || 'Scheduled sleep'}`,
          variant: 'default',
          confirmLabel: 'Schedule Sleep'
        })
      );
    } else {
      executeOperation();
    }
  }, [updateMutation, showConfirmDialog, setOperationLoading]);

  const failQueue = useCallback(async (
    queueId: string,
    reason: string = 'Manual stop',
    options: QueueOperationOptions = {}
  ) => {
    const operationKey = `fail-${queueId}`;
    
    const executeOperation = async () => {
      setOperationLoading(operationKey, true);
      
      try {
        await updateMutation.mutateAsync({
          id: queueId,
          updates: {
            healthStatus: 'CRITICAL',
            isActive: false
          }
        });
        
        options.onSuccess?.();
      } catch (error) {
        options.onError?.(error);
        throw error;
      } finally {
        setOperationLoading(operationKey, false);
      }
    };

    if (!options.skipConfirmation) {
      showConfirmDialog(
        executeOperation,
        confirm.custom({
          title: 'Stop Queue',
          description: `⚠️ This will immediately stop queue processing and mark it as failed.\n\nReason: ${reason}\n\nAre you sure you want to continue?`,
          variant: 'destructive',
          confirmLabel: 'Stop Queue'
        })
      );
    } else {
      executeOperation();
    }
  }, [updateMutation, showConfirmDialog, setOperationLoading]);

  // Bulk Operations
  const bulkPauseQueues = useCallback(async (
    options: BulkOperationOptions & { skipConfirmation?: boolean }
  ) => {
    const operationKey = `bulk-pause-${options.queueIds.join(',')}`;
    
    const executeOperation = async () => {
      setOperationLoading(operationKey, true);
      
      try {
        await bulkUpdateMutation.mutateAsync({
          queueIds: options.queueIds,
          operation: 'pause',
          reason: options.reason || 'Bulk pause operation',
          options: options.options || {}
        });
      } catch (error) {
        throw error;
      } finally {
        setOperationLoading(operationKey, false);
      }
    };

    if (!options.skipConfirmation) {
      showConfirmDialog(
        executeOperation,
        confirm.custom({
          title: 'Pause Queues',
          description: `This will pause ${options.queueIds.length} queue${options.queueIds.length !== 1 ? 's' : ''}.\n\nAre you sure you want to continue?`,
          variant: 'default',
          confirmLabel: 'Pause Selected'
        })
      );
    } else {
      executeOperation();
    }
  }, [bulkUpdateMutation, showConfirmDialog, setOperationLoading]);

  const bulkResumeQueues = useCallback(async (
    options: BulkOperationOptions & { skipConfirmation?: boolean }
  ) => {
    const operationKey = `bulk-resume-${options.queueIds.join(',')}`;
    
    const executeOperation = async () => {
      setOperationLoading(operationKey, true);
      
      try {
        await bulkUpdateMutation.mutateAsync({
          queueIds: options.queueIds,
          operation: 'resume',
          reason: options.reason || 'Bulk resume operation',
          options: options.options || {}
        });
      } catch (error) {
        throw error;
      } finally {
        setOperationLoading(operationKey, false);
      }
    };

    if (!options.skipConfirmation) {
      showConfirmDialog(
        executeOperation,
        confirm.custom({
          title: 'Resume Queues',
          description: `This will resume ${options.queueIds.length} queue${options.queueIds.length !== 1 ? 's' : ''}.\n\nAre you sure you want to continue?`,
          variant: 'default',
          confirmLabel: 'Resume Selected'
        })
      );
    } else {
      executeOperation();
    }
  }, [bulkUpdateMutation, showConfirmDialog, setOperationLoading]);

  const bulkFailQueues = useCallback(async (
    options: BulkOperationOptions & { skipConfirmation?: boolean }
  ) => {
    const operationKey = `bulk-fail-${options.queueIds.join(',')}`;
    
    const executeOperation = async () => {
      setOperationLoading(operationKey, true);
      
      try {
        await bulkUpdateMutation.mutateAsync({
          queueIds: options.queueIds,
          operation: 'fail',
          reason: options.reason || 'Bulk fail operation',
          options: options.options || {}
        });
      } catch (error) {
        throw error;
      } finally {
        setOperationLoading(operationKey, false);
      }
    };

    if (!options.skipConfirmation) {
      showConfirmDialog(
        executeOperation,
        confirm.custom({
          title: 'Stop Queues',
          description: `⚠️ This will immediately stop ${options.queueIds.length} queue${options.queueIds.length !== 1 ? 's' : ''} and mark them as failed.\n\nAre you sure you want to continue?`,
          variant: 'destructive',
          confirmLabel: 'Stop Selected'
        })
      );
    } else {
      executeOperation();
    }
  }, [bulkUpdateMutation, showConfirmDialog, setOperationLoading]);

  return {
    // Individual operations
    pauseQueue,
    resumeQueue,
    sleepQueue,
    failQueue,
    
    // Bulk operations
    bulkPauseQueues,
    bulkResumeQueues,
    bulkFailQueues,
    
    // State
    isOperationLoading,
    isAnyOperationLoading: loadingOperations.size > 0,
    
    // Mutation states
    isUpdating: updateMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
    
    // Confirmation modal
    modal
  };
};
