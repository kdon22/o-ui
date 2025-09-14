/**
 * Auto-Table Component - Schema-driven table with inline forms
 * 
 * Features:
 * - Modern, clean styling
 * - Inline add/edit forms that slide down
 * - Field positioning system (1-3 fields per row)
 * - Auto-generated from ResourceSchema
 * - Mobile-first responsive design
 * - Optimistic updates with action system integration
 * - Bulk select with actions
 * - Column filtering and sorting
 * - Animated floating bulk actions menu
 */

"use client";

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils/generalUtils';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { SearchField } from '@/components/ui/search-field';
import { FieldRenderer } from '@/lib/resource-system/field-registry';
import { RESOURCE_REGISTRY } from '@/lib/resource-system/resource-registry';
import type { FieldSchema } from '@/lib/resource-system/schemas';
import { useActionMutation } from '@/hooks/use-action-api';
import { useActionQuery } from '@/hooks/use-action-api';
// import { useJunctionRelationships } from '@/lib/resource-system/junction-relationship-service'; // TODO: Fix this import
import { useSession } from 'next-auth/react';


// Import extracted components
import { FloatingBulkActions } from './floating-bulk-actions';
import { InlineForm } from './inline-form';
import { ContextMenu } from './context-menu';
import { ColumnFilter } from './column-filter';
import { FilterTabBar } from './filter-tab-bar';

// Import extracted hooks
import {
  useAutoTableJunctionRelationships,
  useTableMutations,
  useTableData,
  useTableActions,
  useTableState
} from './hooks';

// Import navigation context helper
import { useAutoNavigationContext } from '@/lib/resource-system/navigation-context';

import type { AutoTableProps, SortConfig, TableColumn } from './types';

// ============================================================================
// MAIN AUTO-TABLE COMPONENT
// ============================================================================

export const AutoTable: React.FC<AutoTableProps> = ({
  resourceKey,
  filters = {},
  onRowClick,
  className,
  level1Filter = 'all',
  level2Filter = 'all',
  onLevel1FilterChange,
  onLevel2FilterChange,
  filteringConfig,
  headerActions,
  enhancedData,
  processTypes,
  processNames,
  navigationContext
}) => {
  const { data: session } = useSession();
  
  // Auto-generate navigation context if not provided
  const autoNavigationContext = useAutoNavigationContext();
  const effectiveNavigationContext = navigationContext || autoNavigationContext;
  
  // Get resource schema
  const resource = RESOURCE_REGISTRY.find(r => r.actionPrefix === resourceKey);
  if (!resource) {
    throw new Error(`Resource not found: ${resourceKey}`);
  }

  // Get active filtering configuration (override or resource's own)
  const activeFilteringConfig = filteringConfig || resource.filtering;

  // ============================================================================
  // TABLE STATE MANAGEMENT
  // ============================================================================
  
  const {
    searchTerm,
    setSearchTerm,
    showInlineForm,
    editingEntity,
    formMode,
    sortConfig,
    columnFilters,
    selectedRows,
    internalLevel2Filter,
    handleLevel2FilterChange: internalHandleLevel2FilterChange,
    formState,
    tableState
  } = useTableState({ resource });

  // ============================================================================
  // JUNCTION RELATIONSHIP DISCOVERY
  // ============================================================================
  
  const {
    parentContext,
    junctionRelationships,
    junctionMutationMap,
    createJunctionRelationships
  } = useAutoTableJunctionRelationships({
    filters,
    resourceKey,
    session
  });

  // Temporary fix for hasRelationships property
  const hasDirectRelationship = Array.isArray(junctionRelationships) 
    ? junctionRelationships.length > 0 
    : (junctionRelationships as any)?.hasRelationships || false;

  // ============================================================================
  // DATA FETCHING - Use action system directly
  // ============================================================================
  
  // Only pass filters to API if there's a direct relationship or no parent context
  const apiFilters = useMemo(() => {
    // If no parent context, pass all filters
    if (!parentContext.hasParent) {
      return filters;
    }
    
    // If there are discovered relationships, we can use the parent filter
    if (hasDirectRelationship) {
      return filters;
    }
    
    // If no direct relationship found, don't pass parent filters to avoid API errors
    // This handles multi-hop relationships like node -> process -> rule
    const parentFilterKeys = Object.keys(filters).filter(key => key.endsWith('Id'));
    const filteredFilters = { ...filters };
    
    parentFilterKeys.forEach(key => {
      delete filteredFilters[key];
    });
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [AutoTable] Filtered out parent filters for multi-hop relationship:', {
        resourceKey,
        parentContext,
        originalFilters: filters,
        filteredFilters,
        hasDirectRelationship: hasDirectRelationship
      });
    }
    
    return filteredFilters;
  }, [filters, parentContext, hasDirectRelationship, resourceKey]);

  const { data: dataResult, isLoading, error } = useActionQuery(
    `${resourceKey}.list`,
    {
      filters: apiFilters,
      options: {
        limit: 1000,
        sort: { field: 'sortOrder', direction: 'asc' }
      }
    },
    {
      staleTime: 300000, // 5 minutes
      fallbackToCache: true
    }
  );

  // Extract data from result - use enhanced data when provided
  const data = enhancedData || dataResult?.data || [];

  // ============================================================================
  // LEVEL 2 FILTERING - SCHEMA-DRIVEN TAB GENERATION
  // ============================================================================
  
  // Level 2 filtering is now handled by FilterTabBar component

  // Use external level2Filter if provided, otherwise use internal state
  const currentLevel2Filter = level2Filter !== 'all' ? level2Filter : internalLevel2Filter;

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔥 [AutoTable] Data selection:', {
      resourceKey,
      hasEnhancedData: !!enhancedData,
      enhancedDataCount: enhancedData?.length,
      regularDataCount: dataResult?.data?.length,
      finalDataCount: data.length,
      level1Filter,
      level2Filter: currentLevel2Filter,
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle Level 2 filter changes
  const handleLevel2FilterChange = useCallback((value: string) => {
    if (onLevel2FilterChange) {
      onLevel2FilterChange(value);
    } else {
      internalHandleLevel2FilterChange(value);
    }
  }, [onLevel2FilterChange, internalHandleLevel2FilterChange]);

  // ============================================================================
  // ACTION SYSTEM INTEGRATION - Optimistic Updates
  // ============================================================================

  const { createMutation, updateMutation, deleteMutation } = useTableMutations({
    resourceKey,
    onSuccess: () => {
      formState.setShowInlineForm(false);
      formState.setEditingEntity(null);
    }
  });

  // ============================================================================
  // DATA FILTERING AND SORTING
  // ============================================================================

  const { processedEntities, columns } = useTableData({
    data,
    resource,
    searchTerm,
    columnFilters,
    sortConfig,
    level1Filter,
    level2Filter: currentLevel2Filter,
    filteringConfig
  });

  // ============================================================================
  // TABLE ACTIONS & EVENT HANDLERS
  // ============================================================================

  const {
    handleSort,
    handleColumnFilter,
    handleSelectAll,
    handleSelectRow,
    handleBulkAction,
    handleAdd,
    handleEdit,
    handleDelete,
    handleDuplicate,
    handleFormSubmit,
    handleFormCancel,
    handleColumnClick,
    contextMenuActions,
    hasSelectedRows,
    isAllSelected,
    isIndeterminate
  } = useTableActions({
    resource,
    resourceKey,
    formRef: { current: null }, // Not used with portal approach
    mutations: { createMutation, updateMutation, deleteMutation },
    junctionRelationships: { createJunctionRelationships: () => Promise.resolve() },
    formState,
    tableState,
    processedEntities,
    navigationContext: effectiveNavigationContext
  });

  // ============================================================================
  // ENHANCED HEADER ACTIONS - Pass handleAdd to custom header actions
  // ============================================================================
  
  const enhancedHeaderActions = useMemo(() => {
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔥 [AutoTable] Creating enhanced header actions', {
        resourceKey,
        hasHeaderActions: !!headerActions,
        headerActionsType: typeof headerActions,
        timestamp: new Date().toISOString()
      });
    }
    
    if (typeof headerActions === 'function') {
      const result = headerActions(handleAdd);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 [AutoTable] Header actions function called', {
          resourceKey,
          result: !!result,
          timestamp: new Date().toISOString()
        });
      }
      return result;
    }
    return headerActions;
  }, [headerActions, handleAdd, resourceKey]);


  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("bg-white border border-gray-200 rounded-lg p-6 flex flex-col flex-1 min-h-0", className)}>
        <div className="flex h-[200px] items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return (
      <div className={cn("bg-white border border-gray-200 rounded-lg p-6 flex flex-col flex-1 min-h-0", className)}>
        <div className="flex h-[200px] items-center justify-center text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {errorMessage}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER MAIN COMPONENT
  // ============================================================================



  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col transition-transform duration-300 ease-in-out",
      showInlineForm && "transform translate-x-full opacity-0",
      className
    )}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">{resource.display.title}</h2>
            {hasSelectedRows && (
              <span className="text-sm text-gray-500">
                {selectedRows.size} selected
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchField
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={resource.search.placeholder || `Search ${resource.databaseKey}...`}
                className="w-80"
              />
            </div>
            
            {/* Custom header actions or default Add button */}
            {enhancedHeaderActions ? (
              enhancedHeaderActions
            ) : (
              /* Only show Add button if not in Level 1 filtering */
              !activeFilteringConfig?.level1 && (
                <Button
                  onClick={handleAdd}
                  className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                  disabled={createMutation.isPending}
                >
                  <Plus className="h-4 w-4" />
                  Add {resource.modelName}
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Level 1 Filter Tabs (Schema-driven) */}
      {activeFilteringConfig?.level1 && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/30">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeFilteringConfig.level1.title || 'Process Types'}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* All Tab */}
            {activeFilteringConfig.level1.showAll && (
              <button
                onClick={() => onLevel1FilterChange?.('all')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  level1Filter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                All
              </button>
            )}
            {/* Process Type Tabs */}
            {activeFilteringConfig.level1.tabs?.map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => onLevel1FilterChange?.(tab.value)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  level1Filter === tab.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title={tab.description}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level 2 Filter Tabs (Schema-driven) */}
      <FilterTabBar
        data={enhancedData || data}
        filteringConfig={activeFilteringConfig}
        currentFilter={currentLevel2Filter}
        onFilterChange={handleLevel2FilterChange}
        showInheritanceInfo={true}
      />

      {/* Inline Form - Now renders via portal at top level */}
      {showInlineForm && (
        <InlineForm
          resource={resource}
          entity={editingEntity}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          mode={formMode}
          parentData={parentContext.hasParent ? { [`${parentContext.parentResourceType}Id`]: parentContext.parentId } : undefined}
          navigationContext={(() => {
            const navContext = parentContext.hasParent ? { 
              nodeId: parentContext.parentResourceType === 'node' ? parentContext.parentId : undefined,
              parentId: parentContext.parentResourceType === 'node' ? parentContext.parentId : undefined,
              selectedId: parentContext.parentId 
            } : undefined;
            
            // Debug logging for development
            if (process.env.NODE_ENV === 'development') {
              console.log('🔥 [AutoTable] Navigation context created', {
                resourceKey,
                parentContext,
                navContext,
                timestamp: new Date().toISOString()
              });
            }
            
            return navContext;
          })()}
        />
      )}
      
      {/* Debug: Form State */}
      {process.env.NODE_ENV === 'development' && showInlineForm && (
        <>
          {(() => {
            console.log('🔥 [AutoTable] Form state debug', {
              resourceKey,
              showInlineForm,
              formMode,
              editingEntity: editingEntity?.id || 'null',
              timestamp: new Date().toISOString()
            });
            return null;
          })()}
        </>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Bulk Select Column */}
              {resource.table?.bulkSelect && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    data-indeterminate={isIndeterminate}
                    className={isIndeterminate ? "data-[indeterminate=true]:bg-primary data-[indeterminate=true]:border-primary" : ""}
                  />
                </TableHead>
              )}
              
              {/* Data Columns */}
              {columns.map((column) => (
                <TableHead key={column.key} className={`min-w-${column.width}`}>
                  <div className="flex flex-col gap-2">
                    {/* Column Header with Sort */}
                    <div className="flex items-center gap-2">
                      {column.sortable && resource.table?.sortableColumns ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(column.key)}
                          className="h-auto p-0 font-medium text-left"
                        >
                          {column.header}
                          {sortConfig.field === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4 ml-1" />
                            ) : (
                              <ArrowDown className="h-4 w-4 ml-1" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
                          )}
                        </Button>
                      ) : (
                        <span className="font-medium text-sm text-gray-900">{column.header}</span>
                      )}
                    </div>
                    
                    {/* Column Filter */}
                    {column.filterable && resource.table?.columnFilter && (
                      <ColumnFilter
                        column={column}
                        value={columnFilters[column.key] || ''}
                        onChange={(value) => handleColumnFilter(column.key, value)}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
              
              {/* Actions Column */}
              <TableHead className="min-w-20">
                <span className="font-medium text-sm text-gray-900">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
            
            <TableBody>
              {processedEntities.map((entity: any) => (
                <TableRow 
                  key={entity.id} 
                  className={cn(
                    "cursor-pointer hover:bg-gray-50",
                    entity.__optimistic && "opacity-75 bg-blue-50",
                    selectedRows.has(entity.id) && "bg-blue-50",
                    // Add visual styling for enhanced rules
                    entity.textColor === 'blue' && "text-blue-600",
                    entity.textColor === 'red' && "text-red-600",
                    entity.displayClass === 'inherited' && "bg-blue-50/20",
                    entity.displayClass === 'ignored' && "bg-red-50/20"
                  )}
                  onClick={() => onRowClick?.(entity)}
                >
                  {/* Bulk Select */}
                  {resource.table?.bulkSelect && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.has(entity.id)}
                        onCheckedChange={(checked) => handleSelectRow(entity.id, !!checked)}
                        aria-label={`Select ${entity.name || entity.id}`}
                      />
                    </TableCell>
                  )}
                  
                  {/* Data Columns */}
                  {columns.map((column) => {
                    const field = resource.fields.find(f => f.key === column.key);
                    const isClickable = field?.clickable || false;
                    
                    return (
                      <TableCell 
                        key={column.key}
                        className={cn(
                          isClickable && "cursor-pointer hover:bg-blue-50",
                          // Add red color for ignored rules (highest priority)
                          entity.textColor === 'red' && "text-red-600 bg-red-50/20",
                          entity.displayClass === 'ignored' && "text-red-600 bg-red-50/20",
                          entity.isIgnored && "text-red-600 bg-red-50/20",
                          // Add blue color for inherited rules (lower priority)
                          entity.textColor === 'blue' && !entity.isIgnored && entity.displayClass !== 'ignored' && "text-blue-600",
                          entity.displayClass === 'inherited' && !entity.isIgnored && "text-blue-600"
                        )}
                        onClick={(e) => {
                          if (isClickable) {
                            e.stopPropagation();
                            handleColumnClick(entity, field!);
                          }
                        }}
                      >
                        {column.render(entity)}
                      </TableCell>
                    );
                  })}
                  
                  {/* Actions */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <ContextMenu
                      entity={entity}
                      resource={resource}
                      resourceKey={resourceKey}
                      {...contextMenuActions}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Empty state */}
          {processedEntities.length === 0 && (
            <div className="flex h-[200px] items-center justify-center text-gray-500">
              No {resource.databaseKey} found.
            </div>
          )}
        </div>

        {/* Floating Bulk Actions */}
        {resource.table?.bulkSelect && (
          <FloatingBulkActions
            resource={resource}
            selectedCount={selectedRows.size}
            onAction={handleBulkAction}
            isVisible={hasSelectedRows}
          />
        )}
    </div>
  );
};

export default AutoTable; 