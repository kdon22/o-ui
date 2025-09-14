/**
 * Table Selection Hook - Manages table selection state
 * Handles loading tables and maintaining selection
 */

'use client';

import { useState, useMemo } from 'react';
import { useEnterpriseActionQuery } from '@/hooks/use-enterprise-action-api';

interface DataTable {
  id: string;
  name: string;
  tableName?: string;
  description?: string;
  isActive: boolean;
  categoryId?: string;
}

export function useTableSelection() {
  const [selectedTableId, setSelectedTableId] = useState<string>('');

  // Fetch available data tables
  const { data: tablesResult, isLoading: tablesLoading } = useEnterpriseActionQuery(
    'tables.list',
    {},
    { 
      staleTime: 300000,
      refetchOnWindowFocus: false
    }
  );

  const availableTables = useMemo(() => {
    return tablesResult?.success ? (tablesResult.data || []) : [];
  }, [tablesResult]);

  const selectedTable = useMemo(() => {
    return availableTables.find(t => t.id === selectedTableId) || null;
  }, [availableTables, selectedTableId]);

  const selectTable = (tableId: string) => {
    setSelectedTableId(tableId);
  };

  return {
    selectedTable,
    selectedTableId,
    availableTables,
    tablesLoading,
    selectTable
  };
}
