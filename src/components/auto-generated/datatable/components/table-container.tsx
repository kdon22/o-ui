/**
 * Table Container - Main wrapper component with data fetching and state management
 * Extracted from auto-datatable.tsx to reduce size and improve maintainability
 */

"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { useSession } from 'next-auth/react';
import { useDebouncedCallback } from 'use-debounce';

// UI Components
import { Button, Spinner } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';

// Action System
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { useActionClientContext } from '@/lib/session';
import { useQueryClient } from '@tanstack/react-query';

// Components
import { TableHeader } from './table-header';
import { TableBody } from './table-body';

// Types
import {
  AutoDataTableProps,
  TableSchema,
  TableDataRow,
  EditingCell,
  SortConfig,
  TableState
} from '../types';

export const TableContainer: React.FC<AutoDataTableProps> = ({
  tableId,
  className,
  onCellEdit,
  onRowAdd,
  onRowDelete,
  onSchemaChange
}) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { tenantId, branchContext, isReady } = useActionClientContext();
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [tableState, setTableState] = useState<TableState>({
    isLoading: false,
    error: null,
    selectedRowIds: new Set<string>(),
    sortConfig: null,
    editingCell: null,
    editingRow: null,
    rowChanges: {}
  });

  // Refs for keyboard navigation
  const tableRef = useRef<HTMLTableElement>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Fetch table metadata
  const { data: tableResult, isLoading: tableLoading } = useEnterpriseActionQuery(
    'tables.read',
    { id: tableId },
    { 
      staleTime: 300000,
      enabled: !!tableId
    }
  );

  // Fetch table data (server-only, no IndexedDB caching)
  const { data: dataResult, isLoading: dataLoading } = useActionQuery(
    'tableData.list',
    { tableId },
    {
      enabled: !!tableId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      // ✅ Server-only options handled by TableData schema (serverOnly: true)
      skipCache: true
    }
  );

  // ============================================================================
  // DERIVED DATA
  // ============================================================================

  const table = tableResult?.data;
  const schema: TableSchema = useMemo(() => {
    try {
      return table?.config?.schema || { columns: [] };
    } catch {
      return { columns: [] };
    }
  }, [table?.config?.schema]);

  const columns = schema.columns;
  const rawRows: TableDataRow[] = dataResult?.data || [];

  // Sort rows
  const rows = useMemo(() => {
    if (!tableState.sortConfig) return rawRows;
    
    return [...rawRows].sort((a, b) => {
      const aVal = a.data[tableState.sortConfig!.column];
      const bVal = b.data[tableState.sortConfig!.column];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : 1;
      return tableState.sortConfig!.direction === 'desc' ? -comparison : comparison;
    });
  }, [rawRows, tableState.sortConfig]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // Update row mutation (action-system)
  const updateRowMutation = useActionMutation('tableData.update', {
    onError: (error: Error) => {
      console.error('❌ Table row update failed:', error);
    }
  });

  // Delete row mutation (action-system). Let family invalidation handle refetch.
  const deleteRowMutation = useActionMutation('tableData.delete', {
    onError: (error: Error) => {
      console.error('❌ Table row delete failed:', error);
    }
  });

  // Create row mutation (action-system)
  const createRowMutation = useActionMutation('tableData.create', {
    onSuccess: () => {
      onRowAdd?.();
    },
    onError: (error: Error) => {
      console.error('❌ Table row create failed:', error);
    }
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleSort = useCallback((column: string, direction: 'asc' | 'desc' | null) => {
    setTableState(prev => ({
      ...prev,
      sortConfig: direction ? { column, direction } : null
    }));
  }, []);

  const handleCellEdit = useCallback((rowId: string, column: string) => {
    setTableState(prev => ({
      ...prev,
      editingCell: { rowId, column }
    }));
  }, []);

  const handleCellSave = useCallback(async (rowId: string, column: string, value: any) => {
    try {
      const row = rows.find(r => r.id === rowId);
      if (!row) return;

      const updatedData = { ...row.data, [column]: value };
      
      await updateRowMutation.mutateAsync({
        id: rowId,
        data: updatedData
      });

      onCellEdit?.(rowId, column, value);
      
      // Clear editing state
      setTableState(prev => ({
        ...prev,
        editingCell: null
      }));
    } catch (error) {
      console.error('Failed to save cell:', error);
    }
  }, [rows, updateRowMutation, onCellEdit]);

  const handleRowSelect = useCallback((rowId: string, selected: boolean) => {
    setTableState(prev => {
      const newSelectedIds = new Set(prev.selectedRowIds);
      if (selected) {
        newSelectedIds.add(rowId);
      } else {
        newSelectedIds.delete(rowId);
      }
      return { ...prev, selectedRowIds: newSelectedIds };
    });
  }, []);

  const handleAddRow = useCallback(async () => {
    try {
      const emptyRowData: Record<string, any> = {};
      columns.forEach(col => {
        emptyRowData[col.name] = col.type === 'boolean' ? false : '';
      });

      await createRowMutation.mutateAsync({
        tableId,
        data: emptyRowData
      });
    } catch (error) {
      console.error('Failed to add row:', error);
    }
  }, [columns, tableId, createRowMutation]);

  const handleBulkDelete = useCallback(async () => {
    try {
      const rowsToDelete = Array.from(tableState.selectedRowIds);
      await Promise.all(rowsToDelete.map(rowId => deleteRowMutation.mutateAsync({ id: rowId })));
      
      setTableState(prev => ({ ...prev, selectedRowIds: new Set() }));
      onRowDelete?.(rowsToDelete);
    } catch (error) {
      console.error('Failed to delete rows:', error);
    }
  }, [tableState.selectedRowIds, deleteRowMutation, onRowDelete]);

  const clearSelection = useCallback(() => {
    setTableState(prev => ({ ...prev, selectedRowIds: new Set() }));
  }, []);

  const handleSchemaChange = useCallback((newSchema: TableSchema) => {
    onSchemaChange?.(newSchema);
  }, [onSchemaChange]);

  // ============================================================================
  // LOADING STATES
  // ============================================================================

  if (tableLoading || dataLoading) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className={cn('text-center text-gray-500 py-8', className)}>
        Table not found
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn('bg-white border rounded-lg shadow-sm overflow-hidden', className)}>
      <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
        <table
          ref={tableRef}
          className="w-full bg-white"
          style={{ borderCollapse: 'separate', borderSpacing: 0 }}
        >
          {/* Header */}
          <TableHeader
            schema={schema}
            sortConfig={tableState.sortConfig}
            onSort={handleSort}
            onSchemaChange={handleSchemaChange}
          />

          {/* Body */}
          <TableBody
            rows={rows}
            schema={schema}
            editingCell={tableState.editingCell}
            selectedRowIds={tableState.selectedRowIds}
            rowChanges={tableState.rowChanges}
            onCellEdit={handleCellEdit}
            onCellSave={handleCellSave}
            onRowSelect={handleRowSelect}
          />

          {/* Add Row Footer */}
          <tbody>
            <tr className="hover:bg-gray-50">
              <td 
                colSpan={columns.length + 3}
                className="px-3 py-2 border-r border-gray-200 cursor-pointer"
                style={{ borderBottom: '1px solid #e5e7eb' }}
                onClick={handleAddRow}
              >
                <div className="flex items-center text-gray-500 hover:text-gray-700">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="text-sm">Add row</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t text-sm text-gray-600">
        <span>{rows.length} rows</span>
        <span>{columns.length} columns</span>
      </div>

      {/* Floating toolbar for bulk delete */}
      {tableState.selectedRowIds.size > 0 && (
        <div
          className="fixed bottom-6 right-6 bg-white border shadow-lg rounded-md px-4 py-2 flex items-center gap-3"
          style={{ zIndex: 50 }}
        >
          <span className="text-sm text-gray-700">{tableState.selectedRowIds.size} selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={deleteRowMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>Clear</Button>
        </div>
      )}
    </div>
  );
};
