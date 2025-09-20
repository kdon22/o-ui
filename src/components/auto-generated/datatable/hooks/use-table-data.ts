/**
 * useTableData - Manages all table data operations via action-system
 * 
 * Handles table metadata and row data using pure action-system patterns
 * TableData operations are server-only (no IndexedDB caching)
 * Column schema updates target Table.config.columns
 */

import { useMemo, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';

// Action System - Pure Patterns
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
// (no session needed — action-system hooks provide context)

// Types
import type { TableColumn } from '../types';
import type { ActionRequest, ActionResponse } from '@/lib/action-client/types';

export interface TableSchema {
  columns: TableColumn[];
}

export interface TableDataRow {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  branchId: string;
  originalTableDataId?: string;
  __optimistic?: boolean;
  __hasChanges?: boolean;
}

export interface UseTableDataProps {
  tableId: string;
  onRowChanges?: (rowId: string, changes: Record<string, any>) => void;
  onRowChangesClear?: (rowId: string) => void;
}

export interface UseTableDataReturn {
  // Data
  table: any;
  columns: TableColumn[];
  rows: TableDataRow[];
  baseRows: TableDataRow[];
  
  // Loading states
  tableLoading: boolean;
  dataLoading: boolean;
  
  // Row operations
  createRowMutation: ReturnType<typeof useMutation>;
  updateRowMutation: ReturnType<typeof useMutation>;
  deleteRowMutation: ReturnType<typeof useMutation>;
  debouncedSaveRow: (rowId: string, updatedData: Record<string, any>) => void;
  
  // Schema operations
  updateTableSchema: (variables: { columns: TableColumn[] }) => Promise<ActionResponse<any>>;
  
  // Computed data
  mergeRowsWithChanges: (changes: Record<string, Record<string, any>>) => TableDataRow[];
}

export function useTableData({ 
  tableId, 
  onRowChanges, 
  onRowChangesClear 
}: UseTableDataProps): UseTableDataReturn {
  

  // ============================================================================
  // QUERIES - Pure Action System Patterns
  // ============================================================================

  // Fetch table metadata using standard action query (cached in IndexedDB)
  const { data: tableResult, isLoading: tableLoading } = useActionQuery(
    'tables.read',
    { id: tableId },
    { 
      staleTime: 300000,
      enabled: !!tableId
    }
  );

  // Fetch table data using action query with server-only options (NO IndexedDB caching)
  const { data: dataResult, isLoading: dataLoading } = useActionQuery(
    'tableData.list',
    { tableId },
    {
      enabled: !!tableId,
      staleTime: 30000, // 30 seconds
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      // ✅ Server-only options handled by TableData schema (serverOnly: true)
      skipCache: true
    }
  );

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const table = tableResult?.data;
  const tableSchema: TableSchema = table?.config || { columns: [] };
  const rawColumns = (tableSchema.columns || []) as any[];
  
  const columns: TableColumn[] = useMemo(() => {
    return rawColumns.map((col: any) => {
      // Use stored type directly, default to 'str'
      const primitiveType = String(col.type || 'str');
      return { ...col, type: primitiveType } as TableColumn;
    });
  }, [rawColumns]);

  const baseRows: TableDataRow[] = dataResult?.data || [];

  // Function to merge rows with pending changes
  const mergeRowsWithChanges = useCallback((rowChanges: Record<string, Record<string, any>>): TableDataRow[] => {
    return baseRows.map(row => {
      const changes = rowChanges[row.id];
      if (changes) {
        return {
          ...row,
          data: { ...row.data, ...changes },
          __hasChanges: true
        };
      }
      return row;
    });
  }, [baseRows]);

  // ============================================================================
  // MUTATIONS - Server-Only Operations  
  // ============================================================================

  // Base mutations using action-system patterns with server-only options
  const baseMutations = {
    // ✅ Invalidation is handled automatically by useActionMutation via resource-family strategy
    updateRow: useActionMutation('tableData.update', {
      onError: (error) => {
        console.error('❌ Row update failed:', error);
      }
    }),
    
    deleteRow: useActionMutation('tableData.delete', {
      onError: (error) => {
        console.error('❌ Row delete failed:', error);
      }
    }),
    
    createRow: useActionMutation('tableData.create', {
      onError: (error) => {
        console.error('❌ Row create failed:', error);
      }
    }),
    
    updateTableSchema: useActionMutation('tables.update', {
      onError: (error) => {
        console.error('❌ Table schema update failed:', error);
      }
    })
  };

  // Debounced row save - saves 2 seconds after user stops editing
  const debouncedSaveRow = useDebouncedCallback(
    async (rowId: string, updatedData: Record<string, any>) => {
      try {
        console.log('💾 Auto-saving row data...', { rowId, updatedData });
        await baseMutations.updateRow.mutateAsync({
          id: rowId,
          data: updatedData
        });
        console.log('✅ Row auto-save completed');
        
        // Clear the changes for this row after successful save
        onRowChangesClear?.(rowId);
      } catch (error) {
        console.error('❌ Row auto-save failed:', error);
      }
    },
    2000 // 2 second debounce
  );

  // ============================================================================
  // ACTION SYSTEM WRAPPERS - Include required IDs for proper updates
  // ============================================================================
  
  const updateTableSchema = useCallback(async (variables: { columns: TableColumn[] }) => {
    // Get current table data to preserve existing name and tableName
    const currentTable = tableResult?.data;

    return baseMutations.updateTableSchema.mutateAsync({
      id: tableId,                        // ✅ CRITICAL: Include table ID for update
      // Store columns inside the JSON config object
      // Merge with existing config to avoid overwriting other settings
      config: {
        ...(currentTable?.config || {}),
        columns: variables.columns
      },
      name: currentTable?.name,           // Include existing name
      tableName: currentTable?.tableName // Include existing tableName
    });
  }, [baseMutations.updateTableSchema, tableResult, tableId]);

  return {
    // Data
    table,
    columns,
    rows: baseRows, // Return base rows - component will merge with changes
    baseRows,
    
    // Loading states
    tableLoading,
    dataLoading,
    
    // Row operations (pure action system)
    createRowMutation: baseMutations.createRow,
    updateRowMutation: baseMutations.updateRow,
    deleteRowMutation: baseMutations.deleteRow,
    debouncedSaveRow,
    
    // Schema operations (wrapper includes table ID)
    updateTableSchema,
    
    // Utilities
    mergeRowsWithChanges,
  };
}
