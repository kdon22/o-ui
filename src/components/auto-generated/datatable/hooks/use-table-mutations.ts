/**
 * useTableMutations - Centralized mutation logic for table operations
 * 
 * Extracts all mutation logic from AutoDataTable:
 * - Row operations (create, update, delete, bulk delete)
 * - Schema operations (update columns)
 * - Optimistic updates with rollback
 * - Debounced auto-save
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import { useSession } from 'next-auth/react';
import { getActionClient } from '@/lib/action-client';
import { queryKeys } from '@/hooks/query/query-keys';
import { useReadyBranchContext } from '@/components/providers/branch-context-provider';
import type { TableColumn, TableDataRow } from '../types';

export interface TableMutationOptions {
  tableId: string;
  onRowCreated?: (newRowId: string) => void;
  onRowUpdated?: (rowId: string) => void;
  onRowDeleted?: (rowId: string) => void;
  onSchemaUpdated?: () => void;
}

export interface TableMutationActions {
  // Row mutations
  updateRow: (rowId: string, data: Record<string, any>) => Promise<void>;
  createRow: (data: Record<string, any>) => void;
  deleteRow: (rowId: string) => Promise<void>;
  bulkDeleteRows: (rowIds: string[]) => Promise<void>;
  
  // Schema mutations
  updateTableSchema: (columns: TableColumn[]) => Promise<void>;
  
  // Auto-save
  debouncedSaveRow: (rowId: string, data: Record<string, any>) => void;
  
  // Mutation states
  isUpdating: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  isBulkDeleting: boolean;
  isUpdatingSchema: boolean;
}

export function useTableMutations(options: TableMutationOptions): TableMutationActions {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const branchContext = useReadyBranchContext();
  
  const { tableId, onRowCreated, onRowUpdated, onRowDeleted, onSchemaUpdated } = options;
  
  // Extract tenant and branch context
  const tenantId = session?.user?.tenantId;

  // ============================================================================
  // UPDATE ROW MUTATION
  // ============================================================================
  
  const updateRowMutation = useMutation({
    mutationFn: async (variables: { id: string; data: Record<string, any> }) => {
      const validTenantId = tenantId || session?.user?.tenantId;
      if (!validTenantId) throw new Error('Tenant ID not available');

      const actionClient = getActionClient(validTenantId, branchContext);
      
      return actionClient.executeAction({
        action: 'tableData.update',
        data: variables,
        options: { serverOnly: true, skipCache: true },
        branchContext: branchContext || undefined
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['tableData.list'] });
      const previousData = queryClient.getQueryData(['tableData.list']);

      // Optimistic update
      queryClient.setQueryData(['tableData.list'], (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((row: any) => 
            row.id === variables.id 
              ? { ...row, data: variables.data, __optimistic: true }
              : row
          )
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      console.error('Row update failed:', err);
      if (context?.previousData) {
        queryClient.setQueryData(['tableData.list'], context.previousData);
      }
    },
    onSuccess: (data, variables) => {
      console.log('Row update successful:', variables.id);
      onRowUpdated?.(variables.id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData.list'] });
    }
  });

  // ============================================================================
  // CREATE ROW MUTATION
  // ============================================================================
  
  const createRowMutation = useMutation({
    mutationFn: async (variables: { tableId: string; data: Record<string, any> }) => {
      const validTenantId = tenantId || session?.user?.tenantId;
      if (!validTenantId) throw new Error('Tenant ID not available');

      const actionClient = getActionClient(validTenantId, branchContext);
      
      return actionClient.executeAction({
        action: 'tableData.create',
        data: variables,
        options: { serverOnly: true, skipCache: true },
        branchContext: branchContext || undefined
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['tableData.list'] });
      const previous = queryClient.getQueryData<any>(['tableData.list']);

      // Create optimistic temp row
      const tempId = `temp-${Date.now()}`;
      const optimisticRow: TableDataRow = {
        id: tempId,
        data: variables.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        branchId: 'main', // Branch handling by action-system
        __optimistic: true
      } as any;

      queryClient.setQueryData(['tableData.list'], (old: any) => {
        if (!old) return { data: [optimisticRow] };
        return { ...old, data: [...(old.data || []), optimisticRow] };
      });

      return { previous, tempId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['tableData.list'], ctx.previous);
      }
    },
    onSuccess: (result, _vars, ctx) => {
      // Extract the real ID from server response
      const realId = (result as any)?.data?.id || (result as any)?.id;
      if (realId) {
        onRowCreated?.(realId);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData.list'] });
    }
  });

  // ============================================================================
  // DELETE ROW MUTATION
  // ============================================================================
  
  const deleteRowMutation = useMutation({
    mutationFn: async (variables: { id: string }) => {
      const validTenantId = tenantId || session?.user?.tenantId;
      if (!validTenantId) throw new Error('Tenant ID not available');

      const actionClient = getActionClient(validTenantId, branchContext);

      return actionClient.executeAction({
        action: 'tableData.delete',
        data: variables,
        options: { serverOnly: true, skipCache: true },
        branchContext: branchContext || undefined
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['tableData.list'] });
      const previousData = queryClient.getQueryData(['tableData.list']);

      // Optimistically remove row
      queryClient.setQueryData(['tableData.list'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((row: any) => row.id !== variables.id)
        };
      });

      return { previousData };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousData) {
        queryClient.setQueryData(['tableData.list'], ctx.previousData);
      }
    },
    onSuccess: (_, variables) => {
      onRowDeleted?.(variables.id);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData.list'] });
    }
  });

  // ============================================================================
  // UPDATE SCHEMA MUTATION
  // ============================================================================
  
  const updateTableSchemaMutation = useMutation({
    mutationFn: async (variables: { columns: TableColumn[]; tableName?: string; name?: string }) => {
      const validTenantId = tenantId || session?.user?.tenantId;
      if (!validTenantId) throw new Error('Tenant ID not available');

      const actionClient = getActionClient(validTenantId, branchContext);

      // Build update payload
      const updatedConfig = {
        columns: variables.columns
      };

      return actionClient.executeAction({
        action: 'tables.update',
        data: {
          id: tableId,
          name: variables.name,
          tableName: variables.tableName,
          config: updatedConfig
        },
        options: { serverOnly: true, skipCache: true },
        branchContext: branchContext || undefined
      });
    },
    onMutate: async (variables) => {
      // ✅ FIXED: Use the same query key format as useActionQuery
      const queryKey = queryKeys.actionData('tables.read', { id: tableId }, branchContext?.currentBranchId);
      
      // Cancel in-flight reads
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<any>(queryKey);

      // Optimistically update schema
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.data) return old;
        const currentTable = old.data;
        const nextConfig = { ...(currentTable.config || {}), columns: variables.columns };
        return { ...old, data: { ...currentTable, config: nextConfig } };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        // ✅ FIXED: Use the same query key format as useActionQuery
        const queryKey = queryKeys.actionData('tables.read', { id: tableId }, branchContext?.currentBranchId);
        queryClient.setQueryData(queryKey, ctx.previous);
      }
    },
    onSuccess: () => {
      onSchemaUpdated?.();
    },
    onSettled: () => {
      // ✅ FIXED: Use the same query key format as useActionQuery
      const queryKey = queryKeys.actionData('tables.read', { id: tableId }, branchContext?.currentBranchId);
      queryClient.invalidateQueries({ queryKey });
    }
  });

  // ============================================================================
  // DEBOUNCED AUTO-SAVE
  // ============================================================================
  
  const debouncedSaveRow = useDebouncedCallback(
    async (rowId: string, updatedData: Record<string, any>) => {
      try {
        console.log('💾 Auto-saving row data...', { rowId, updatedData });
        await updateRowMutation.mutateAsync({
          id: rowId,
          data: updatedData
        });
        console.log('✅ Row auto-save completed');
      } catch (error) {
        console.error('❌ Row auto-save failed:', error);
      }
    },
    2000 // 2 second debounce
  );

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================
  
  const bulkDeleteRows = async (rowIds: string[]): Promise<void> => {
    if (rowIds.length === 0) return;

    // Optimistically remove all selected rows
    await queryClient.cancelQueries({ queryKey: ['tableData.list'] });
    const previousData = queryClient.getQueryData(['tableData.list']);
    
    const selectedSet = new Set(rowIds);
    queryClient.setQueryData(['tableData.list'], (old: any) => {
      if (!old?.data) return old;
      return { ...old, data: old.data.filter((row: any) => !selectedSet.has(row.id)) };
    });

    try {
      // Execute deletes sequentially
      for (const id of rowIds) {
        // eslint-disable-next-line no-await-in-loop
        await deleteRowMutation.mutateAsync({ id });
      }
      
      // Notify about bulk deletion
      rowIds.forEach(id => onRowDeleted?.(id));
    } catch (err) {
      // Rollback on error
      if (previousData) {
        queryClient.setQueryData(['tableData.list'], previousData);
      }
      throw err;
    } finally {
      queryClient.invalidateQueries({ queryKey: ['tableData.list'] });
    }
  };

  // ============================================================================
  // RETURN API
  // ============================================================================
  
  return {
    // Row operations
    updateRow: updateRowMutation.mutateAsync,
    createRow: createRowMutation.mutate,
    deleteRow: deleteRowMutation.mutateAsync,
    bulkDeleteRows,
    
    // Schema operations
    updateTableSchema: updateTableSchemaMutation.mutateAsync,
    
    // Auto-save
    debouncedSaveRow,
    
    // Loading states
    isUpdating: updateRowMutation.isPending,
    isCreating: createRowMutation.isPending,
    isDeleting: deleteRowMutation.isPending,
    isBulkDeleting: false, // TODO: Track bulk delete state
    isUpdatingSchema: updateTableSchemaMutation.isPending,
  };
}
