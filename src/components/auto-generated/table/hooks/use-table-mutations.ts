/**
 * Table Mutations Hook - Manages CRUD operations for auto-table
 * 
 * Features:
 * - Create, update, delete mutations with optimistic updates
 * - Action system integration
 * - Standardized error handling and logging
 */

import { useActionMutation } from '@/hooks/use-action-api';
import { useQueryClient } from '@tanstack/react-query';

interface UseTableMutationsProps {
  resourceKey: string;
  onSuccess?: () => void;
  nodeId?: string; // For inheritance cache invalidation
  onBatchChange?: (change: {
    entityId: string;
    entityType: string;
    operation: 'create' | 'update' | 'delete';
    beforeData?: any;
    afterData?: any;
    fieldChanges?: Record<string, any>;
  }) => void;
}

interface TableMutationsResult {
  createMutation: any;
  updateMutation: any;
  deleteMutation: any;
}

export const useTableMutations = ({ 
  resourceKey, 
  onSuccess,
  nodeId,
  onBatchChange
}: UseTableMutationsProps): TableMutationsResult => {
  
  const queryClient = useQueryClient();
  
  console.log('🔥 [TableMutations] Hook initialized', {
    resourceKey,
    nodeId,
    hasOnSuccess: !!onSuccess,
    timestamp: new Date().toISOString()
  });
  
  // Create mutation with optimistic updates
  const createMutation = useActionMutation(`${resourceKey}.create`, {
    onSuccess: async (data) => {
      console.log('🔥 [TableMutations] Create mutation succeeded', {
        resourceKey,
        data,
        timestamp: new Date().toISOString()
      });
      
      // Safe inheritance cache invalidation for process creation
      if (resourceKey === 'process' && nodeId && data?.data?.id) {
        console.log('🔄 [TableMutations] Safely invalidating inheritance cache for process creation', {
          processId: data.data.id,
          nodeId,
          resourceKey,
          timestamp: new Date().toISOString()
        });
        
        try {
          // Invalidate React Query cache for immediate UI updates
          // Note: TanStack Query + action-system now handles inheritance cache automatically
          queryClient.invalidateQueries({
            queryKey: ['nodeInheritance', nodeId],
            exact: false
          });
          
          console.log('✅ [TableMutations] Inheritance cache invalidation completed', {
            processId: data.data.id,
            nodeId,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          console.error('❌ [TableMutations] Inheritance cache invalidation failed:', error);
        }
      }
      
      // 🏆 ENTERPRISE: Track change for batch versioning
      if (onBatchChange && data?.data) {
        onBatchChange({
          entityId: data.data.id,
          entityType: resourceKey,
          operation: 'create',
          afterData: data.data
        });
      }
      
      onSuccess?.();
    },
    onError: (error) => {
      console.error('🔥 [TableMutations] Create mutation failed', {
        resourceKey,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Update mutation with optimistic updates
  const updateMutation = useActionMutation(`${resourceKey}.update`, {
    onSuccess: (data) => {
      console.log('🔥 [TableMutations] Update mutation succeeded', {
        resourceKey,
        data,
        timestamp: new Date().toISOString()
      });
      
      // 🏆 ENTERPRISE: Track change for batch versioning
      if (onBatchChange && data?.data) {
        onBatchChange({
          entityId: data.data.id,
          entityType: resourceKey,
          operation: 'update',
          afterData: data.data
          // Note: beforeData would need to be captured before mutation
        });
      }
      
      onSuccess?.();
    },
    onError: (error) => {
      console.error('🔥 [TableMutations] Update mutation failed', {
        resourceKey,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Delete mutation with optimistic updates
  const deleteMutation = useActionMutation(`${resourceKey}.delete`, {
    onSuccess: (data) => {
      console.log('🔥 [TableMutations] Delete mutation succeeded', {
        resourceKey,
        data,
        timestamp: new Date().toISOString()
      });
      
      // 🏆 ENTERPRISE: Track change for batch versioning
      if (onBatchChange && data?.entityId) {
        onBatchChange({
          entityId: data.entityId,
          entityType: resourceKey,
          operation: 'delete'
          // Note: beforeData would need to be captured before mutation
        });
      }
    },
    onError: (error) => {
      console.error('🔥 [TableMutations] Delete mutation failed', {
        resourceKey,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation
  };
}; 