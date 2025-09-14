/**
 * AutoDataTable - Clean Airtable-like Interface
 * 
 * Features:
 * - Clean, minimal UI like Airtable
 * - Direct column addition (no separate editor)
 * - Excel-like grid lines
 * - Tab key saves and moves to next cell
 * - Inline editing with smooth UX
 */

"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { useSession } from 'next-auth/react';
import { useDebouncedCallback } from 'use-debounce';

// UI Components
import { 
  Button,
  Spinner,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { Plus, MoreHorizontal, Trash2, Type, Hash, Calendar, ToggleLeft } from 'lucide-react';

// Column Management Components
import { ColumnHeader, AddColumnButton } from './column-manager';

// Action System
import { useServerOnlyQuery } from '@/hooks/use-server-only-action';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { getActionClient } from '@/lib/action-client';
import { useEnterpriseSession, useEnterpriseActionQuery } from '@/hooks/use-enterprise-action-api';
import type { ActionRequest, ActionResponse } from '@/lib/action-client/types';

// Types
interface AutoDataTableProps {
  tableId: string;
  className?: string;
}

interface TableColumn {
  name: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'boolean';
  required?: boolean;
  options?: string[];
  format?: string;
}

interface TableSchema {
  columns: TableColumn[];
}

interface TableDataRow {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  branchId: string;
  originalTableDataId?: string;
  __optimistic?: boolean;
}

// Column type icons
const COLUMN_TYPE_ICONS = {
  text: Type,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
  select: MoreHorizontal,
  multi_select: MoreHorizontal
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AutoDataTable: React.FC<AutoDataTableProps> = ({
  tableId,
  className
}) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { session: enterpriseSession, branchContext, tenantId } = useEnterpriseSession();
  
  // State
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: string } | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [rowChanges, setRowChanges] = useState<Record<string, Record<string, any>>>({});
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  
  // Refs for keyboard navigation
  const tableRef = useRef<HTMLTableElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const editSelectRef = useRef<HTMLSelectElement>(null);

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

  // Fetch table data
  const { data: dataResult, isLoading: dataLoading } = useServerOnlyQuery(
    'tableData.list',
    undefined,
    {
      page: 1,
      limit: 1000, // Load all for Airtable-like experience
      filters: { tableId },
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // Debounced row save - saves 2 seconds after user stops editing
  const debouncedSaveRow = useDebouncedCallback(
    async (rowId: string, updatedData: Record<string, any>) => {
      try {
        console.log('💾 Auto-saving row data...', { rowId, updatedData });
        await updateRowMutation.mutateAsync({
          id: rowId,
          data: updatedData
        });
        console.log('✅ Row auto-save completed');
        
        // Clear the changes for this row after successful save
        setRowChanges(prev => {
          const newChanges = { ...prev };
          delete newChanges[rowId];
          return newChanges;
        });
      } catch (error) {
        console.error('❌ Row auto-save failed:', error);
      }
    },
    2000 // 2 second debounce
  );

  // Update row data mutation
  const updateRowMutation = useMutation({
    mutationFn: async (variables: { id: string; data: Record<string, any> }) => {
      const validTenantId = tenantId || enterpriseSession?.user?.tenantId;
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
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData.list'] });
    }
  });

  // Delete row mutation (single)
  const deleteRowMutation = useMutation({
    mutationFn: async (variables: { id: string }) => {
      const validTenantId = tenantId || enterpriseSession?.user?.tenantId;
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData.list'] });
    }
  });

  // Add new row
  const createRowMutation = useMutation({
    mutationFn: async (variables: { tableId: string; data: Record<string, any> }) => {
      const validTenantId = tenantId || enterpriseSession?.user?.tenantId;
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
        branchId: branchContext?.currentBranchId || 'main',
        __optimistic: true
      } as any;

      queryClient.setQueryData(['tableData.list'], (old: any) => {
        if (!old) return { data: [optimisticRow] };
        return { ...old, data: [...(old.data || []), optimisticRow] };
      });

      // Immediately place cursor in first cell if any columns exist
      if (columns.length > 0) {
        // Defer to next tick so the optimistic row is rendered first
        setTimeout(() => {
          setEditingRow(tempId);
          setEditingCell({ rowId: tempId, column: columns[0].name });
        }, 0);
      }

      return { previous, tempId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['tableData.list'], ctx.previous);
      }
      if (ctx?.tempId && editingRow === ctx.tempId) {
        setEditingRow(null);
        setEditingCell(null);
      }
    },
    onSuccess: (result, _vars, ctx) => {
      // Try to map editing state to the real ID once server returns
      const realId = (result as any)?.data?.id || (result as any)?.id;
      if (realId && ctx?.tempId && editingRow === ctx.tempId) {
        setEditingRow(realId);
        if (columns.length > 0) setEditingCell({ rowId: realId, column: columns[0].name });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData.list'] });
    }
  });

  // Import the shared type mapping functions
  const { mapColumnTypeToPrimitive, mapPrimitiveToUiType } = require('@/lib/data-tables/table-initializer');

  // Update table schema (columns)
  const updateTableSchemaMutation = useMutation({
    mutationFn: async (variables: { columns: TableColumn[] }) => {
      const validTenantId = tenantId || enterpriseSession?.user?.tenantId;
      if (!validTenantId) throw new Error('Tenant ID not available');

      const actionClient = getActionClient(validTenantId, branchContext);

      // Get current table config
      const table = tableResult?.data;

      // Convert UI types to unified primitive types before saving
      const columnsWithPrimitiveTypes = variables.columns.map(column => ({
        ...column,
        type: mapColumnTypeToPrimitive(column.type)
      }));

      const updatedConfig = {
        ...table?.config,
        columns: columnsWithPrimitiveTypes
      };

      return actionClient.executeAction({
        action: 'tables.update',
        data: {
          id: tableId,
          name: table?.name,           // Include existing name
          tableName: table?.tableName, // Include existing tableName
          config: updatedConfig
        },
        options: { serverOnly: true, skipCache: true },
        branchContext: branchContext || undefined
      });
    },
    onMutate: async (variables) => {
      // Cancel in-flight reads for table schema
      await queryClient.cancelQueries({ queryKey: ['tables.read'] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<any>(['tables.read']);

      // Optimistically update the cache with new columns
      queryClient.setQueryData(['tables.read'], (old: any) => {
        if (!old?.data) return old;
        const currentTable = old.data;
        const nextConfig = { ...(currentTable.config || {}), columns: variables.columns };
        return { ...old, data: { ...currentTable, config: nextConfig } };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      // Rollback to previous cache state
      if (ctx?.previous) {
        queryClient.setQueryData(['tables.read'], ctx.previous);
      }
    },
    onSettled: () => {
      // Ensure server truth wins after request settles
      queryClient.invalidateQueries({ queryKey: ['tables.read'] });
    }
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const table = tableResult?.data;
  const tableSchema: TableSchema = table?.config || { columns: [] };
  const rawColumns = (tableSchema.columns || []) as any[];
  const columns: TableColumn[] = useMemo(() => {
    return rawColumns.map((col: any) => {
      const primitiveType = String(col.type || 'str');
      // Heuristic: if stored as 'str' but has options, treat as single-select
      const uiType = primitiveType === 'str' && Array.isArray(col.options) && col.options.length > 0
        ? 'select'
        : mapPrimitiveToUiType(primitiveType);
      return { ...col, type: uiType } as TableColumn;
    });
  }, [rawColumns]);
  const baseRows: TableDataRow[] = dataResult?.data || [];
  
  // Merge base rows with pending changes for display
  const rows = useMemo(() => {
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
  }, [baseRows, rowChanges]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCellClick = useCallback((rowId: string, columnName: string, currentValue: any) => {
    setEditingCell({ rowId, column: columnName });
    setEditingRow(rowId);
  }, []);

  const handleCellValueChange = useCallback((rowId: string, columnName: string, newValue: any) => {
    // Update local row changes
    setRowChanges(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [columnName]: newValue
      }
    }));

    // Get the current row data with any existing changes
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    const updatedData = {
      ...row.data,
      [columnName]: newValue
    };

    // Trigger debounced save
    debouncedSaveRow(rowId, updatedData);
  }, [rows, debouncedSaveRow]);

  const handleRowExit = useCallback(async (rowId: string) => {
    // Save immediately when leaving the row
    const changes = rowChanges[rowId];
    if (changes && Object.keys(changes).length > 0) {
      const row = baseRows.find(r => r.id === rowId);
      if (row) {
        const updatedData = { ...row.data, ...changes };
        try {
          await updateRowMutation.mutateAsync({
            id: rowId,
            data: updatedData
          });
          // Clear changes after successful save
          setRowChanges(prev => {
            const newChanges = { ...prev };
            delete newChanges[rowId];
            return newChanges;
          });
        } catch (error) {
          console.error('Failed to save row on exit:', error);
        }
      }
    }
    
    setEditingRow(null);
    setEditingCell(null);
  }, [rowChanges, baseRows, updateRowMutation]);

  const handleCellCancel = useCallback(() => {
    if (editingCell) {
      // Revert changes for this cell
      setRowChanges(prev => {
        const newChanges = { ...prev };
        if (newChanges[editingCell.rowId]) {
          delete newChanges[editingCell.rowId][editingCell.column];
          if (Object.keys(newChanges[editingCell.rowId]).length === 0) {
            delete newChanges[editingCell.rowId];
          }
        }
        return newChanges;
      });
    }
    setEditingCell(null);
  }, [editingCell]);

  const handleAddRow = useCallback(async () => {
    const emptyData: Record<string, any> = {};
    columns.forEach(col => {
      emptyData[col.name] = col.type === 'boolean' ? false : '';
    });

    // Use mutate (not mutateAsync) so onMutate can set focus immediately
    createRowMutation.mutate({
      tableId,
      data: emptyData
    });
  }, [columns, tableId, createRowMutation]);

  const handleAddColumn = useCallback(async (column: TableColumn) => {
    const updatedColumns = [...columns, column];
    await updateTableSchemaMutation.mutateAsync({ columns: updatedColumns });
  }, [columns, updateTableSchemaMutation]);

  const handleUpdateColumn = useCallback(async (columnIndex: number, updatedColumn: TableColumn) => {
    const updatedColumns = columns.map((col, index) => 
      index === columnIndex ? updatedColumn : col
    );
    await updateTableSchemaMutation.mutateAsync({ columns: updatedColumns });
  }, [columns, updateTableSchemaMutation]);

  const handleDeleteColumn = useCallback(async (columnIndex: number) => {
    const updatedColumns = columns.filter((_, index) => index !== columnIndex);
    await updateTableSchemaMutation.mutateAsync({ columns: updatedColumns });
  }, [columns, updateTableSchemaMutation]);

  // Convert whitespace-separated words to camelCase; leaves non-space separators intact
  const toCamelFromSpaces = (input: string): string => {
    const parts = String(input).trim().split(/\s+/);
    if (parts.length === 0) return '';
    return parts
      .map((w, i) => {
        const lower = w.toLowerCase();
        return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join('');
  };

  const handleDuplicateColumn = useCallback(async (columnIndex: number) => {
    const columnToDuplicate = columns[columnIndex];
    const duplicatedColumn = {
      ...columnToDuplicate,
      // Ensure no spaces: convert spaced names to camelCase, append -copy
      name: `${(/\s/.test(String(columnToDuplicate.name)) 
        ? toCamelFromSpaces(String(columnToDuplicate.name)) 
        : String(columnToDuplicate.name))}-copy`
    };
    const updatedColumns = [
      ...columns.slice(0, columnIndex + 1),
      duplicatedColumn,
      ...columns.slice(columnIndex + 1)
    ];
    await updateTableSchemaMutation.mutateAsync({ columns: updatedColumns });
  }, [columns, updateTableSchemaMutation]);

  const handleInsertColumn = useCallback(async (columnIndex: number, position: 'left' | 'right') => {
    const newColumn: TableColumn = {
      // Default to camelCase for dot access in code
      name: 'newField',
      type: 'text',
      required: false
    };
    
    const insertIndex = position === 'left' ? columnIndex : columnIndex + 1;
    const updatedColumns = [
      ...columns.slice(0, insertIndex),
      newColumn,
      ...columns.slice(insertIndex)
    ];
    await updateTableSchemaMutation.mutateAsync({ columns: updatedColumns });
  }, [columns, updateTableSchemaMutation]);

  const handleSort = useCallback((columnName: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig(direction ? { column: columnName, direction } : null);
  }, []);

  // ============================================================================
  // KEYBOARD HANDLERS - Tab and Enter support
  // ============================================================================

  const findNextCell = useCallback((currentRowId: string, currentColumn: string, direction: 'next' | 'prev' = 'next') => {
    const currentRowIndex = rows.findIndex(r => r.id === currentRowId);
    const currentColIndex = columns.findIndex(c => c.name === currentColumn);
    
    if (direction === 'next') {
      // Next column in same row
      if (currentColIndex < columns.length - 1) {
        return { rowId: currentRowId, column: columns[currentColIndex + 1].name };
      }
      // First column in next row
      if (currentRowIndex < rows.length - 1) {
        return { rowId: rows[currentRowIndex + 1].id, column: columns[0].name };
      }
    } else {
      // Previous column in same row
      if (currentColIndex > 0) {
        return { rowId: currentRowId, column: columns[currentColIndex - 1].name };
      }
      // Last column in previous row
      if (currentRowIndex > 0) {
        return { rowId: rows[currentRowIndex - 1].id, column: columns[columns.length - 1].name };
      }
    }
    
    return null;
  }, [rows, columns]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!editingCell) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next row, same column
      const currentRowIndex = rows.findIndex(r => r.id === editingCell.rowId);
      if (currentRowIndex < rows.length - 1) {
        const nextRow = rows[currentRowIndex + 1];
        handleCellClick(nextRow.id, editingCell.column, nextRow.data[editingCell.column]);
      } else {
        // Exit editing if at last row
        setEditingCell(null);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      // Move to next/previous cell
      const nextCell = findNextCell(editingCell.rowId, editingCell.column, e.shiftKey ? 'prev' : 'next');
      if (nextCell) {
        // Check if we're moving to a different row
        if (nextCell.rowId !== editingCell.rowId) {
          // Save current row before moving to next row
          handleRowExit(editingCell.rowId);
        }
        
        setTimeout(() => {
          const row = rows.find(r => r.id === nextCell.rowId);
          if (row) {
            handleCellClick(nextCell.rowId, nextCell.column, row.data[nextCell.column]);
          }
        }, 50);
      } else {
        // No next cell, exit editing
        handleRowExit(editingCell.rowId);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCellCancel();
    }
  }, [editingCell, findNextCell, rows, handleCellClick, handleRowExit, handleCellCancel]);

  // Focus edit input when editing starts (only when the editing cell changes)
  useEffect(() => {
    if (editingCell) {
      const column = columns.find(c => c.name === editingCell.column);
      if (column?.type === 'boolean') {
        editSelectRef.current?.focus();
      } else {
        editInputRef.current?.focus();
        // Select only on first focus to avoid re-selecting on each keystroke
        // which caused single-character overwrite behavior
        editInputRef.current?.select();
      }
    }
    // Intentionally exclude rows from deps to prevent re-select on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingCell, columns]);

  // Handle clicks outside table to save current row
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingRow && tableRef.current && !tableRef.current.contains(event.target as Node)) {
        handleRowExit(editingRow);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingRow, handleRowExit]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderCell = (value: any, column: TableColumn, isEditing: boolean, rowId: string) => {
    if (isEditing) {
      switch (column.type) {
        case 'boolean':
          return (
            <select
              ref={editSelectRef}
              value={value ? 'true' : 'false'}
              onChange={(e) => handleCellValueChange(rowId, column.name, e.target.value === 'true')}
              className="w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
              onKeyDown={handleKeyDown}
              autoFocus
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          );
        
        case 'number':
          return (
            <input
              ref={editInputRef}
              type="number"
              value={value || ''}
              onChange={(e) => handleCellValueChange(rowId, column.name, Number(e.target.value))}
              className="w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
              onKeyDown={handleKeyDown}
              autoFocus
            />
          );
        
        case 'date':
          return (
            <input
              ref={editInputRef}
              type="date"
              value={value || ''}
              onChange={(e) => handleCellValueChange(rowId, column.name, e.target.value)}
              className="w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
              onKeyDown={handleKeyDown}
              autoFocus
            />
          );
        
        default:
          return (
            <input
              ref={editInputRef}
              type="text"
              value={value || ''}
              onChange={(e) => handleCellValueChange(rowId, column.name, e.target.value)}
              className="w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
              onKeyDown={handleKeyDown}
              autoFocus
            />
          );
      }
    }

    // Display mode
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">—</span>;
    }

    switch (column.type) {
      case 'boolean':
        return (
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
            value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          )}>
            {value ? 'Yes' : 'No'}
          </span>
        );
      
      case 'number':
        return <span className="font-mono">{Number(value).toLocaleString()}</span>;
      
      case 'date':
        return <span>{new Date(value).toLocaleDateString()}</span>;
      
      default:
        return <span>{String(value)}</span>;
    }
  };

  // ==========================================================================
  // ROW SELECTION HANDLERS
  // ==========================================================================
  const isAllSelected = useMemo(() => {
    const rowIds = baseRows.map(r => r.id);
    return rowIds.length > 0 && rowIds.every(id => selectedRowIds.has(id));
  }, [baseRows, selectedRowIds]);

  const toggleSelectAll = useCallback(() => {
    const next = new Set<string>();
    if (!isAllSelected) {
      baseRows.forEach(r => next.add(r.id));
    }
    setSelectedRowIds(next);
  }, [isAllSelected, baseRows]);

  const toggleSelectRow = useCallback((rowId: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId); else next.add(rowId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedRowIds(new Set()), []);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedRowIds);
    if (ids.length === 0) return;

    // Optimistically remove all selected
    await queryClient.cancelQueries({ queryKey: ['tableData.list'] });
    const previousData = queryClient.getQueryData(['tableData.list']);
    queryClient.setQueryData(['tableData.list'], (old: any) => {
      if (!old?.data) return old;
      return { ...old, data: old.data.filter((row: any) => !selectedRowIds.has(row.id)) };
    });

    try {
      // Execute deletes sequentially to keep server happy; can be parallel if supported
      for (const id of ids) {
        // eslint-disable-next-line no-await-in-loop
        await deleteRowMutation.mutateAsync({ id });
      }
      clearSelection();
    } catch (err) {
      // rollback on error
      if (previousData) {
        queryClient.setQueryData(['tableData.list'], previousData);
      }
    } finally {
      queryClient.invalidateQueries({ queryKey: ['tableData.list'] });
    }
  }, [selectedRowIds, deleteRowMutation, queryClient, clearSelection]);

  // ============================================================================
  // LOADING STATES
  // ============================================================================

  if (tableLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
        <span className="ml-2 text-sm text-gray-600">Loading table...</span>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="text-sm text-gray-600">Table not found</span>
      </div>
    );
  }

  // ============================================================================
  // RENDER - Clean Airtable-like Interface
  // ============================================================================

  return (
    <div className={cn("w-full bg-white", className)}>
      {/* Clean Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{table.name}</h1>
          {table.description && (
            <p className="text-sm text-gray-500 mt-1">{table.description}</p>
          )}
        </div>
      </div>

      {/* Table Container with Excel-like grid */}
      <div className="overflow-auto">
        <table 
          ref={tableRef}
          className="w-full border-collapse"
          style={{ 
            borderSpacing: 0,
            // Excel-like grid lines
            border: '1px solid #e5e7eb'
          }}
        >
          {/* Header */}
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {/* Row number column */}
              <th className="px-3 py-2 border-r border-gray-200 text-left text-xs font-medium text-gray-500" style={{ borderBottom: '1px solid #e5e7eb' }}>#</th>
              {/* Select all checkbox */}
              <th className="px-3 py-2 border-r border-gray-200 text-left text-xs font-medium text-gray-500" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              {columns.map((column, columnIndex) => (
                <ColumnHeader
                  key={column.name}
                  column={column}
                  sortDirection={sortConfig?.column === column.name ? sortConfig.direction : null}
                  onSort={(direction) => handleSort(column.name, direction)}
                  onColumnUpdate={(updatedColumn) => handleUpdateColumn(columnIndex, updatedColumn)}
                  onColumnDelete={() => handleDeleteColumn(columnIndex)}
                  onColumnDuplicate={() => handleDuplicateColumn(columnIndex)}
                  onInsertColumn={(position) => handleInsertColumn(columnIndex, position)}
                />
              ))}
              
              {/* Add Column Button */}
              <AddColumnButton
                onAddColumn={handleAddColumn}
                disabled={updateTableSchemaMutation.isPending}
              />
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {rows.map((row, rowIndex) => {
              const isInherited = !!row.originalTableDataId;
              const isOptimistic = row.__optimistic === true;
              const hasChanges = (row as any).__hasChanges === true;
              const isEditingThisRow = editingRow === row.id;
              
              return (
                <tr 
                  key={row.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    isInherited && "bg-blue-50/30",
                    isOptimistic && "bg-yellow-50",
                    hasChanges && "bg-orange-50/50",
                    isEditingThisRow && "bg-blue-50/50"
                  )}
                  onMouseLeave={() => {
                    // Save row when mouse leaves if we're editing this row
                    if (isEditingThisRow && !editingCell) {
                      handleRowExit(row.id);
                    }
                  }}
                >
                  {/* Row number */}
                  <td
                    className="px-3 py-2 border-r border-gray-200 text-xs text-gray-500"
                    style={{ borderBottom: '1px solid #e5e7eb', width: 40 }}
                  >
                    {rowIndex + 1}
                  </td>
                  {/* Row select */}
                  <td
                    className="px-3 py-2 border-r border-gray-200"
                    style={{ borderBottom: '1px solid #e5e7eb', width: 40 }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRowIds.has(row.id)}
                      onChange={() => toggleSelectRow(row.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  {columns.map((column, colIndex) => {
                    const isEditing = editingCell?.rowId === row.id && editingCell?.column === column.name;
                    const value = row.data[column.name];
                    
                    return (
                      <td
                        key={column.name}
                        className={cn(
                          "px-3 py-2 border-r border-gray-200 cursor-pointer transition-colors",
                          isEditing && "bg-blue-100 ring-1 ring-blue-500",
                          !isEditing && isEditingThisRow && "bg-blue-50",
                          !isEditing && !isEditingThisRow && "hover:bg-gray-100"
                        )}
                        style={{ 
                          borderBottom: '1px solid #e5e7eb',
                          minHeight: '40px'
                        }}
                        onClick={() => !isEditing && handleCellClick(row.id, column.name, value)}
                      >
                        {renderCell(
                          value,
                          column,
                          isEditing,
                          row.id
                        )}
                      </td>
                    );
                  })}
                  
                  {/* Status cell */}
                  <td 
                    className="px-3 py-2 border-r border-gray-200"
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <div className="flex items-center gap-1">
                      {isInherited && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                          inherited
                        </span>
                      )}
                      {hasChanges && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                          unsaved
                        </span>
                      )}
                      {isOptimistic && (
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">
                          saving...
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {/* Add Row */}
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
      {selectedRowIds.size > 0 && (
        <div
          className="fixed bottom-6 right-6 bg-white border shadow-lg rounded-md px-4 py-2 flex items-center gap-3"
          style={{ zIndex: 50 }}
        >
          <span className="text-sm text-gray-700">{selectedRowIds.size} selected</span>
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
