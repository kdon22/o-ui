/**
 * Table State Hook - Manages all table state and form state
 * 
 * Features:
 * - Form state (editing entity, mode, visibility)
 * - Table interaction state (search, sorting, filtering, selection)
 * - Level 2 filtering state
 */

import { useState, useCallback } from 'react';
import type { SortConfig } from '../types';

interface UseTableStateProps {
  resource: any;
}

export const useTableState = ({ resource }: UseTableStateProps) => {
  
  // Form state
  const [searchTerm, setSearchTerm] = useState('');
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  
  // Debugging wrappers for form state setters
  const setShowInlineFormDebug = useCallback((show: boolean) => {
    console.log('🔥 [TableState] setShowInlineForm called', {
      oldValue: showInlineForm,
      newValue: show,
      timestamp: new Date().toISOString()
    });
    setShowInlineForm(show);
  }, [showInlineForm]);
  
  const setEditingEntityDebug = useCallback((entity: any) => {
    console.log('🔥 [TableState] setEditingEntity called', {
      oldValue: editingEntity?.id || 'null',
      newValue: entity?.id || 'null',
      timestamp: new Date().toISOString()
    });
    setEditingEntity(entity);
  }, [editingEntity]);
  
  const setFormModeDebug = useCallback((mode: 'create' | 'edit') => {
    console.log('🔥 [TableState] setFormMode called', {
      oldValue: formMode,
      newValue: mode,
      timestamp: new Date().toISOString()
    });
    setFormMode(mode);
  }, [formMode]);
  
  // Table interaction state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    field: resource.desktop?.sortField || 'name', 
    direction: (resource.desktop?.sortOrder as 'asc' | 'desc') || 'asc' 
  });
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Internal Level 2 filtering (schema-driven)
  const [internalLevel2Filter, setInternalLevel2Filter] = useState<string>('all');

  // Level 2 filter change handler
  const handleLevel2FilterChange = useCallback((value: string) => {
    setInternalLevel2Filter(value);
  }, []);

  return {
    // Form state
    searchTerm,
    setSearchTerm,
    showInlineForm,
    setShowInlineForm: setShowInlineFormDebug,
    editingEntity,
    setEditingEntity: setEditingEntityDebug,
    formMode,
    setFormMode: setFormModeDebug,
    
    // Table state
    sortConfig,
    setSortConfig,
    columnFilters,
    setColumnFilters,
    selectedRows,
    setSelectedRows,
    
    // Level 2 filtering
    internalLevel2Filter,
    handleLevel2FilterChange,
    
    // Grouped state objects for easier passing
    formState: {
      showInlineForm,
      setShowInlineForm: setShowInlineFormDebug,
      editingEntity,
      setEditingEntity: setEditingEntityDebug,
      formMode,
      setFormMode: setFormModeDebug,
    },
    tableState: {
      sortConfig,
      setSortConfig,
      columnFilters,
      setColumnFilters,
      selectedRows,
      setSelectedRows,
    }
  };
}; 