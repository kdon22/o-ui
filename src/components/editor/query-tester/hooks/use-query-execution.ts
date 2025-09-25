/**
 * Query Execution Hook - Handles query execution and results
 * Manages execution state, results, and error handling
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { parseSimpleSQL, applyWhereConditions } from '../utils/simple-sql-parser';

interface DataTable {
  id: string;
  name: string;
  tableName?: string;
  description?: string;
  isActive: boolean;
}

interface QueryResult {
  success: boolean;
  data?: Record<string, any>[];
  columns?: any[];
  error?: string;
}

export function useQueryExecution(selectedTable: DataTable | null) {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const { toast } = useToast();

  // Note: Columns are now extracted dynamically from the data rows
  // No need to fetch table metadata separately

  // Fetch selected table details to access configured column names (cached in IndexedDB)
  const { data: tableDetails } = useActionQuery(
    'tables.read',
    { id: selectedTable?.id || '' },
    {
      enabled: !!selectedTable?.id
    }
  );

  // Execute query using the existing tableData.list action (server-only, no IndexedDB caching)
  const { mutate: executeQueryMutation, isPending } = useActionMutation(
    'tableData.list',
    {
      // ✅ Follow datatable pattern: server-only handled by TableData schema (serverOnly: true)
      onSuccess: (result) => {
        if (result?.success) {
          // Extract actual data rows from tableData.list response
          const rawData = result.data || [];
          
          // Transform data to show the actual JSON data content
          let transformedData = rawData.map((row: any) => row.data || {});
          
          // Apply SQL filtering if a query was provided
          if (currentQuery) {
            const parsedQuery = parseSimpleSQL(currentQuery);
            
            // Debug logging
            console.log('🔍 Query Debug:', {
              originalQuery: currentQuery,
              parsedQuery,
              dataBeforeFilter: transformedData.slice(0, 2),
              dataCount: transformedData.length
            });
            
            if (parsedQuery.isValid && parsedQuery.whereConditions.length > 0) {
              // Apply WHERE conditions to filter the data
              const filteredData = applyWhereConditions(transformedData, parsedQuery.whereConditions);
              
              console.log('🔍 Filter Debug:', {
                conditions: parsedQuery.whereConditions,
                originalCount: transformedData.length,
                filteredCount: filteredData.length,
                sampleFilteredData: filteredData.slice(0, 2)
              });
              
              transformedData = filteredData;
            } else if (!parsedQuery.isValid && parsedQuery.error) {
              // Show SQL parsing error
              const errorResult: QueryResult = {
                success: false,
                error: `SQL Error: ${parsedQuery.error}`
              };
              
              setQueryResult(errorResult);
              
              toast({
                title: 'SQL Parsing Error',
                description: parsedQuery.error,
                variant: 'destructive'
              });
              return;
            }
          }
          
          // Extract columns STRICTLY from DataTable.config (IndexedDB metadata)
          let workingRows = transformedData;
          let extractedColumns: { key: string; name?: string; label: string; type?: string }[] = [];
          const configuredColumnsRaw: any[] = Array.isArray(tableDetails?.data?.config?.columns)
            ? tableDetails.data.config.columns
            : [];
          const configuredColumns: { name: string; type?: string }[] = configuredColumnsRaw
            .map((c: any) => ({ name: String(c?.name || '').trim(), type: c?.type || 'text' }))
            .filter((c: any) => !!c.name);

          if (configuredColumns.length > 0) {
            // Project rows to ONLY these configured columns, in order
            workingRows = workingRows.map((row: any) => {
              const remapped: Record<string, any> = {};
              for (const col of configuredColumns) {
                remapped[col.name] = row[col.name] ?? '';
              }
              return remapped;
            });

            extractedColumns = configuredColumns.map(col => ({
              key: col.name,
              name: col.name,
              label: col.name,
              type: col.type || 'text'
            }));
          } else if (workingRows.length > 0) {
            // Safety fallback only if no config present
            const sourceKeys = Object.keys(workingRows[0] || {});
            extractedColumns = sourceKeys.map(key => ({
              key,
              name: key,
              label: key,
              type: 'text'
            }));
          }
          
          // 🎯 CRITICAL FIX: Cache columns for completion system
          if (selectedTable && extractedColumns.length > 0) {
            try {
              // Clear old caches first to prevent stale data
              const { EditorContextService } = require('../../language/editor-context');
              const { unifiedTypeDetectionFactory } = require('@/lib/editor/type-system/type-detection-factory');

              // Clear type detection cache for query variables
              unifiedTypeDetectionFactory.clearCache();

              const ctx = EditorContextService.get();
              if (ctx) {
                // Clear old column cache entries for this table
                const oldCacheKey = `${ctx.tenantId}@${ctx.branchContext.currentBranchId}:${selectedTable.tableName}`;
                EditorContextService.invalidateColumns(oldCacheKey);

                // Cache new columns
                const columnsForCache = extractedColumns.map(col => ({
                  name: col.key,
                  type: col.type || 'text',
                  description: `Column from ${selectedTable.tableName} (from query execution)`
                }));

                EditorContextService.cacheColumns(oldCacheKey, columnsForCache);

                console.log('🎯 [Query Execution] Cached columns for completion:', {
                  tableName: selectedTable.tableName,
                  cacheKey: oldCacheKey,
                  columns: columnsForCache,
                  clearedTypeCache: true
                });
              }
            } catch (error) {
              console.warn('Failed to cache columns for completion:', error);
            }
          }
          
          const successResult: QueryResult = {
            success: true,
            data: workingRows,
            columns: extractedColumns
          };
          
          setQueryResult(successResult);
          // No success toast per UX preference
        } else {
          const errorResult: QueryResult = {
            success: false,
            error: result?.error || 'Query execution failed'
          };
          
          setQueryResult(errorResult);
          
          toast({
            title: 'Query failed',
            description: errorResult.error,
            variant: 'destructive'
          });
        }
      },
      onError: (error: Error) => {
        const errorResult: QueryResult = {
          success: false,
          error: error.message || 'Unknown error occurred'
        };
        
        setQueryResult(errorResult);
        
        toast({
          title: 'Query failed',
          description: errorResult.error,
          variant: 'destructive'
        });
      }
    }
  );

  const executeQuery = async (queryText: string, substitutedQuery?: string) => {
    const finalQuery = substitutedQuery || queryText;
    
    if (!finalQuery.trim()) {
      toast({
        title: 'Query Required',
        description: 'Please enter a query to execute.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedTable) {
      toast({
        title: 'Table Required',
        description: 'Please select a table first.',
        variant: 'destructive'
      });
      return;
    }

    // Check for unsubstituted variables
    const hasUnsubstitutedVariables = /\{\w+\}/.test(finalQuery);
    if (hasUnsubstitutedVariables) {
      toast({
        title: 'Variables Required',
        description: 'Please provide values for all query variables.',
        variant: 'destructive'
      });
      return;
    }

    // Store the current query for filtering
    setCurrentQuery(finalQuery);

    // Execute the query mutation using tableData.list action
    // ✅ Send tableId as data parameter
    executeQueryMutation({
      tableId: selectedTable.id
    } as any);
  };

  const resetQuery = () => {
    setQueryResult(null);
    setCurrentQuery('');
  };

  return {
    queryResult,
    isExecuting: isPending,
    executeQuery,
    resetQuery
  };
}


