/**
 * AutoDataTable - Airtable-like Dynamic Table Component
 * 
 * Features:
 * - Dynamic columns from table schema (JSON)
 * - Inline cell editing with Airtable UX
 * - Branch overlay and Copy-on-Write support
 * - JSON data rendering and editing
 * - Factory-driven column generation
 * - Mobile-first responsive design
 * - Optimistic updates with ActionClient
 */

"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { useSession } from 'next-auth/react';

// UI Components
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
  Button,
  Spinner
} from '@/components/ui';
import { Plus, Filter, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

// Action System
import { useServerOnlyQuery } from '@/hooks/use-server-only-action';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { getActionClient } from '@/lib/action-client';
import { useEnterpriseSession, useEnterpriseActionQuery } from '@/hooks/use-enterprise-action-api';
import type { ActionRequest, ActionResponse } from '@/lib/action-client/types';

// Components
import { ColumnManager } from './column-manager';

// Types
interface AutoDataTableProps {
  tableId: string;                          // DataTable.id
  className?: string;
  onCellEdit?: (rowId: string, column: string, value: any) => void;
  onRowAdd?: () => void;
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
  views?: any[];
  permissions?: any[];
}

interface TableDataRow {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  branchId: string;
  originalTableDataId?: string;
  __optimistic?: boolean; // Flag for optimistic updates
}

// ============================================================================
// COLUMN FACTORY - Dynamic Column Generation
// ============================================================================

const ColumnFactory = {
  /**
   * Generate table columns from schema
   */
  generateColumns(schema: TableSchema): TableColumn[] {
    return schema.columns || [];
  },

  /**
   * Render cell content based on column type
   */
  renderCell(value: any, column: TableColumn, isEditing: boolean, onChange?: (value: any) => void) {
    if (isEditing) {
      return this.renderEditCell(value, column, onChange);
    }
    return this.renderDisplayCell(value, column);
  },

  /**
   * Render display cell (read-only)
   */
  renderDisplayCell(value: any, column: TableColumn) {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }

    switch (column.type) {
      case 'boolean':
        return (
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          )}>
            {value ? 'Yes' : 'No'}
          </span>
        );
      
      case 'select':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {value}
          </span>
        );
      
      case 'multi_select':
        const values = Array.isArray(value) ? value : [value];
        return (
          <div className="flex flex-wrap gap-1">
            {values.map((v, i) => (
              <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {v}
              </span>
            ))}
          </div>
        );
      
      case 'number':
        if (column.format === 'currency') {
          return <span>${Number(value).toLocaleString()}</span>;
        }
        return <span>{Number(value).toLocaleString()}</span>;
      
      case 'date':
        return <span>{new Date(value).toLocaleDateString()}</span>;
      
      default:
        return <span>{String(value)}</span>;
    }
  },

  /**
   * Render edit cell (inline editing)
   */
  renderEditCell(value: any, column: TableColumn, onChange?: (value: any) => void) {
    switch (column.type) {
      case 'boolean':
        return (
          <select
            value={value ? 'true' : 'false'}
            onChange={(e) => onChange?.(e.target.value === 'true')}
            className="w-full px-2 py-1 border rounded text-sm"
            autoFocus
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
            autoFocus
          >
            <option value="">Select...</option>
            {column.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="w-full px-2 py-1 border rounded text-sm"
            autoFocus
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
            autoFocus
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
            autoFocus
          />
        );
    }
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AutoDataTable: React.FC<AutoDataTableProps> = ({
  tableId,
  className,
  onCellEdit,
  onRowAdd
}) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { session: enterpriseSession, branchContext, tenantId } = useEnterpriseSession();
  
  // State
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: string } | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
  
  // ✅ SERVER-ONLY: Pagination and filtering state for large datasets
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState<Record<string, any>>({ tableId });
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Fetch table metadata (schema)
  const { data: tableResult, isLoading: tableLoading, error: tableError } = useEnterpriseActionQuery(
    'tables.read',
    { id: tableId },
    { 
      staleTime: 300000,
      enabled: !!tableId // Only run if tableId exists
    }
  );

  // ✅ SERVER-ONLY: Fetch table data with pagination and server-side operations
  const { data: dataResult, isLoading: dataLoading } = useServerOnlyQuery(
    'tableData.list',
    undefined, // No base data needed
    {
      page: currentPage,
      limit: pageSize,
      filters,
      sort: sortConfig ? {
        field: sortConfig.column,
        order: sortConfig.direction
      } : undefined,
      search: searchQuery,
      searchFields: ['data'], // Search within JSON data
      
      // Performance optimizations for large datasets
      refetchOnMount: false,
      refetchOnWindowFocus: false
    }
  );

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // ✅ OPTIMISTIC UPDATES: Airtable-like instant cell editing with server-only storage
  const updateRowMutation = useMutation({
    mutationFn: async (variables: { id: string; data: Record<string, any> }) => {
      const validTenantId = tenantId || enterpriseSession?.user?.tenantId;
      if (!validTenantId) {
        throw new Error('Tenant ID not available');
      }

      const actionClient = getActionClient(validTenantId, branchContext);
      
      const request: ActionRequest = {
        action: 'tableData.update',
        data: variables,
        options: {
          serverOnly: true,
          skipCache: true
        },
        branchContext: branchContext || undefined
      };
      
      return actionClient.executeAction(request);
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['tableData.list'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['tableData.list']);

      // Optimistically update the cache
      queryClient.setQueryData(['tableData.list'], (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((row: any) => 
            row.id === variables.id 
              ? { ...row, data: variables.data }
              : row
          )
        };
      });

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['tableData.list'], context.previousData);
      }
    },
    onSuccess: () => {
      setEditingCell(null);
      setEditValue(null);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['tableData.list'] });
    }
  });

  const createRowMutation = useMutation({
    mutationFn: async (variables: { tableId: string; data: Record<string, any> }) => {
      const validTenantId = tenantId || enterpriseSession?.user?.tenantId;
      if (!validTenantId) {
        throw new Error('Tenant ID not available');
      }

      const actionClient = getActionClient(validTenantId, branchContext);
      
      const request: ActionRequest = {
        action: 'tableData.create',
        data: variables,
        options: {
          serverOnly: true,
          skipCache: true
        },
        branchContext: branchContext || undefined
      };
      
      return actionClient.executeAction(request);
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tableData.list'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['tableData.list']);

      // Create optimistic row with temporary ID
      const optimisticRow = {
        id: `temp-${Date.now()}`, // Temporary ID
        tableId: variables.tableId,
        data: variables.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __optimistic: true // Flag to identify optimistic updates
      };

      // Optimistically update the cache
      queryClient.setQueryData(['tableData.list'], (old: any) => {
        if (!old?.data) return { data: [optimisticRow], totalCount: 1 };
        
        return {
          ...old,
          data: [...old.data, optimisticRow],
          totalCount: (old.totalCount || 0) + 1
        };
      });

      return { previousData, optimisticRow };
    },
    onError: (err, variables, context) => {
      // Roll back on error
      if (context?.previousData) {
        queryClient.setQueryData(['tableData.list'], context.previousData);
      }
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic row with real server data
      queryClient.setQueryData(['tableData.list'], (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((row: any) => 
            row.id === context?.optimisticRow?.id 
              ? data.data // Replace with real server data
              : row
          )
        };
      });
    },
    onSettled: () => {
      // Ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['tableData.list'] });
    }
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const table = tableResult?.data;
  const tableSchema: TableSchema = table?.config || { columns: [] }; // ✅ config IS the schema
  
  // Debug: Remove after testing
  // console.log('🔍 [AutoDataTable] Table extraction:', { 
  //   tableResult: !!tableResult, 
  //   hasData: !!tableResult?.data, 
  //   table: !!table,
  //   tableId: table?.id,
  //   hasConfig: !!table?.config,
  //   columnsCount: table?.config?.columns?.length 
  // });
  const columns = ColumnFactory.generateColumns(tableSchema);
  const rows: TableDataRow[] = dataResult?.data || [];

  // Handle column changes
  const handleColumnsChange = (newColumns: any[]) => {
    // Trigger refetch to get updated schema
    // The mutation in ColumnManager already updates the server
  };

  // ✅ SERVER-ONLY: No client-side sorting needed - handled by server
  // Data is already sorted by the server based on sortConfig
  const sortedRows = rows;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleCellClick = useCallback((rowId: string, columnName: string, currentValue: any) => {
    setEditingCell({ rowId, column: columnName });
    setEditValue(currentValue);
  }, []);

  const handleCellSave = useCallback(async () => {
    if (!editingCell) return;

    const row = rows.find(r => r.id === editingCell.rowId);
    if (!row) return;

    const updatedData = {
      ...row.data,
      [editingCell.column]: editValue
    };

    await updateRowMutation.mutateAsync({
      id: editingCell.rowId,
      data: updatedData
    });

    onCellEdit?.(editingCell.rowId, editingCell.column, editValue);
  }, [editingCell, editValue, rows, updateRowMutation, onCellEdit]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue(null);
  }, []);

  const handleSort = useCallback((columnName: string) => {
    setSortConfig(prev => {
      if (prev?.column === columnName) {
        if (prev.direction === 'asc') {
          return { column: columnName, direction: 'desc' };
        } else {
          return null; // Remove sort
        }
      }
      return { column: columnName, direction: 'asc' };
    });
  }, []);

  const handleAddRow = useCallback(async () => {
    const emptyData: Record<string, any> = {};
    columns.forEach(col => {
      emptyData[col.name] = col.type === 'boolean' ? false : '';
    });

    await createRowMutation.mutateAsync({
      tableId,
      data: emptyData
    });

    onRowAdd?.();
  }, [columns, tableId, createRowMutation, onRowAdd]);

  // ============================================================================
  // KEYBOARD HANDLERS
  // ============================================================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCellSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCellCancel();
      }
    }
  }, [editingCell, handleCellSave, handleCellCancel]);

  // ============================================================================
  // LOADING STATES
  // ============================================================================

  if (tableLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
        <span className="ml-2 text-sm text-muted-foreground">Loading table...</span>
      </div>
    );
  }

  // Only show "not found" if loading is complete AND no table data
  if (!tableLoading && !table) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="text-sm text-muted-foreground">Table not found</span>
      </div>
    );
  }

  // Show loading if table data hasn't loaded yet
  if (!table) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
        <span className="ml-2 text-sm text-muted-foreground">Loading table...</span>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn("w-full", className)} onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{table.name}</h2>
          {table.description && (
            <p className="text-sm text-muted-foreground">{table.description}</p>
          )}
        </div>
        <Button onClick={handleAddRow} size="sm" disabled={createRowMutation.isPending}>
          <Plus className="w-4 h-4 mr-2" />
          Add Row
        </Button>
      </div>

      {/* Column Management */}
      <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-muted-foreground">Columns:</span>
        </div>
        <ColumnManager
          tableId={tableId}
          columns={columns}
          onColumnsChange={handleColumnsChange}
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.name}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort(column.name)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.name}</span>
                    {column.required && <span className="text-red-500">*</span>}
                    {sortConfig?.column === column.name ? (
                      sortConfig.direction === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-50" />
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => {
              const isInherited = !!row.originalTableDataId;
              const isOptimistic = row.__optimistic === true;
              const isPendingSave = updateRowMutation.isPending && updateRowMutation.variables?.id === row.id;
              
              return (
                <TableRow 
                  key={row.id} 
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    isInherited && "bg-blue-50/30",  // Subtle background for inherited rows
                    isOptimistic && "bg-yellow-50/50 border-l-2 border-l-yellow-400",  // Optimistic updates
                    isPendingSave && "bg-green-50/50 border-l-2 border-l-green-400"   // Saving state
                  )}
                >
                  {columns.map((column) => {
                    const isEditing = editingCell?.rowId === row.id && editingCell?.column === column.name;
                    const value = row.data[column.name];
                    const isCellPending = isPendingSave && editingCell?.rowId === row.id && editingCell?.column === column.name;
                    
                    return (
                      <TableCell
                        key={column.name}
                        className={cn(
                          "cursor-pointer transition-colors relative",
                          isInherited && "text-muted-foreground",  // Dimmed text for inherited
                          isCellPending && "bg-green-100/50"      // Highlight saving cell
                        )}
                        onClick={() => !isEditing && handleCellClick(row.id, column.name, value)}
                      >
                        {ColumnFactory.renderCell(
                          isEditing ? editValue : value,
                          column,
                          isEditing,
                          setEditValue
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isInherited && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-1 py-0.5 rounded">
                          from main
                        </span>
                      )}
                      {isOptimistic && (
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-1 py-0.5 rounded animate-pulse">
                          saving...
                        </span>
                      )}
                      {isPendingSave && (
                        <span className="text-xs text-green-600 bg-green-100 px-1 py-0.5 rounded animate-pulse">
                          syncing...
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {/* Empty State */}
            {sortedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8">
                  <div className="text-muted-foreground">
                    <p className="mb-2">No data yet</p>
                    <Button onClick={handleAddRow} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add your first row
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ SERVER-ONLY: Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {dataResult?.meta?.total || 0} total rows
          </span>
          <span>
            Page {currentPage} of {Math.ceil((dataResult?.meta?.total || 0) / pageSize)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || dataLoading}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            <span className="text-sm">Page</span>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value) || 1;
                const maxPage = Math.ceil((dataResult?.meta?.total || 0) / pageSize);
                setCurrentPage(Math.min(maxPage, Math.max(1, page)));
              }}
              className="w-16 px-2 py-1 text-sm border rounded"
              min={1}
              max={Math.ceil((dataResult?.meta?.total || 0) / pageSize)}
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= Math.ceil((dataResult?.meta?.total || 0) / pageSize) || dataLoading}
          >
            Next
          </Button>
          
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setCurrentPage(1); // Reset to first page
            }}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
          </select>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search table data..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full px-3 py-2 text-sm border rounded-md"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchQuery('');
            setFilters({ tableId });
            setSortConfig(null);
            setCurrentPage(1);
          }}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
};