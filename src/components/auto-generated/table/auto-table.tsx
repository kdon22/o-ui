/**
 * Auto-Table Component - Gold Standard Clean Version
 * 
 * Features:
 * - Uses unified data provider with branch overlay
 * - Junction-aware rendering with zero complexity
 * - No cache invalidation issues
 * - Preserves data during branch switches
 * - Clean, maintainable code
 */

"use client";

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { useSession } from 'next-auth/react';

// Resource System
import { RESOURCE_REGISTRY } from '@/lib/resource-system/resource-registry';
import { useActionQuery } from '@/hooks/use-action-api';
import { useAutoNavigationContext } from '@/lib/resource-system/navigation-context';

// Note: Reverted to original action query approach to preserve branch overlay logic

// Extracted Hooks
import {
  useTableMutations,
  useTableData,
  useTableActions,
  useTableState
} from './hooks';
import { useChangeHistory } from './hooks/use-change-history';
import { useBatchVersionTracking, calculateFieldChanges } from './hooks/use-batch-version-tracking';

// Extracted Components
import {
  TableHeader,
  Level1FilterTabs,
  TableStructure,
  LoadingStates,
  InlineForm,
  FilterTabBar,
  FloatingBulkActions
} from './components';

// Types
import type { AutoTableProps } from './types';

// Change History Modal
import { ChangeHistoryModal } from '@/components/branching/change-history-modal';

// Batch Version Tracking
import { UnsavedChangesIndicator } from './components/unsaved-changes-indicator';

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
  customTitle,
  customSearchPlaceholder,
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
  // HOOK ORCHESTRATION
  // ============================================================================
  
  const tableStateHook = useTableState({ resource });
  
  // 🏆 ENTERPRISE: Batch version tracking for navigation-based saves
  const batchVersionTracking = useBatchVersionTracking({
    resourceKey,
    tenantId: session?.user?.tenantId,
    branchId: effectiveNavigationContext?.branchId || 'main',
    // autoSaveInterval: 30000 // Optional: 30 second auto-save
  });
  
  // ✅ REVERT TO ORIGINAL: Use the existing branch-aware action query system
  const { data: dataResult, isLoading, error } = useActionQuery(
    `${resourceKey}.list`,
    {
      filters: filters,
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

  // ✅ REVERT TO ORIGINAL: Use enhanced data or API data
  const data = (Array.isArray(enhancedData) && enhancedData.length > 0)
    ? enhancedData
    : (dataResult?.data || []);

  // 🚨 AGGRESSIVE DEBUG: Track what's causing the disappearing
  console.log('🔥 [AutoTable] RENDER DEBUG:', {
    resourceKey,
    dataLength: data.length,
    isLoading,
    hasDataResult: !!dataResult,
    hasEnhancedData: !!enhancedData && enhancedData.length > 0,
    dataResultLength: dataResult?.data?.length || 0,
    enhancedDataLength: enhancedData?.length || 0,
    queryState: {
      isLoading,
      isFetching: dataResult ? 'unknown' : 'no-dataResult',
      error: !!error
    },
    branchInfo: {
      sessionReady: !!session?.user?.tenantId,
      currentBranchId: session?.user?.currentBranchId,
      defaultBranchId: session?.user?.defaultBranchId
    },
    // 🚨 SHOW ACTUAL DATA TO SEE WHAT'S HAPPENING
    actualDataPreview: data.slice(0, 3).map(item => ({
      id: item?.id,
      name: item?.name,
      branchId: item?.branchId,
      type: item?.type
    })),
    enhancedDataPreview: enhancedData?.slice(0, 3).map(item => ({
      id: item?.id,
      name: item?.name,
      branchId: item?.branchId,
      type: item?.type
    })),
    timestamp: new Date().toISOString()
  });

  // ✅ CRITICAL DEBUG: Log when data becomes empty (causes flashing)
  if (data.length === 0 && !isLoading) {
    console.warn('⚠️ [AutoTable] EMPTY DATA - This causes flashing!', {
      resourceKey,
      dataResult: !!dataResult,
      dataResultData: dataResult?.data,
      enhancedData: enhancedData,
      isLoading,
      filters,
      timestamp: new Date().toISOString()
    });
  }

  // ============================================================================
  // LEVEL 2 FILTERING
  // ============================================================================
  
  // Use external level2Filter if provided, otherwise use internal state
  const currentLevel2Filter = level2Filter !== 'all' ? level2Filter : tableStateHook.internalLevel2Filter;

  // Handle Level 2 filter changes
  const handleLevel2FilterChange = useCallback((value: string) => {
    if (onLevel2FilterChange) {
      onLevel2FilterChange(value);
    } else {
      tableStateHook.handleLevel2FilterChange(value);
    }
  }, [onLevel2FilterChange, tableStateHook.handleLevel2FilterChange]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const mutations = useTableMutations({
    resourceKey,
    onSuccess: () => {
      tableStateHook.formState.setShowInlineForm(false);
      tableStateHook.formState.setEditingEntity(null);
    },
    nodeId: filters?.nodeId, // Pass nodeId for safe inheritance cache invalidation
    onBatchChange: batchVersionTracking.trackChange // 🏆 ENTERPRISE: Connect batch tracking
  });

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  const { processedEntities, columns } = useTableData({
    data,
    resource,
    searchTerm: tableStateHook.searchTerm,
    columnFilters: tableStateHook.columnFilters,
    sortConfig: tableStateHook.sortConfig,
    level1Filter,
    level2Filter: currentLevel2Filter,
    filteringConfig
  });

  // ============================================================================
  // CHANGE HISTORY
  // ============================================================================
  
  const changeHistory = useChangeHistory({
    resourceKey,
    tenantId: effectiveNavigationContext?.tenantId || '',
    branchId: effectiveNavigationContext?.branchId || ''
  });

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const actions = useTableActions({
    resource,
    resourceKey,
    formRef: { current: null }, // Not used with portal approach
    mutations: mutations,
    junctionRelationships: { createJunctionRelationships: () => Promise.resolve() },
    formState: tableStateHook.formState,
    tableState: tableStateHook.tableState,
    processedEntities,
    navigationContext: effectiveNavigationContext,
    // 🏆 GOLD STANDARD: Change history integration
    customHandlers: changeHistory.customHandlers
  });

  // ============================================================================
  // ENHANCED HEADER ACTIONS
  // ============================================================================
  
  const enhancedHeaderActions = useMemo(() => {
    if (typeof headerActions === 'function') {
      return headerActions(actions.handleAdd);
    }
    return headerActions;
  }, [headerActions, actions.handleAdd]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading and error states
  // Do NOT hide enhanced data (e.g., node rule hierarchy) just because the background
  // API query is loading. Only block rendering when we have no enhanced data to show.
  const shouldBlockForLoading = (!enhancedData || (enhancedData as any[]).length === 0) && (isLoading || error);
  if (shouldBlockForLoading) {
    return <LoadingStates isLoading={isLoading} error={error} className={className} />;
  }

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col transition-transform duration-300 ease-in-out",
      tableStateHook.showInlineForm && "transform translate-x-full opacity-0",
      className
    )}>
      {/* Header */}
      <TableHeader
        resource={resource}
        searchTerm={tableStateHook.searchTerm}
        onSearchChange={tableStateHook.setSearchTerm}
        hasSelectedRows={actions.hasSelectedRows}
        selectedRowsCount={tableStateHook.selectedRows.size}
        enhancedHeaderActions={enhancedHeaderActions}
        activeFilteringConfig={activeFilteringConfig}
        onAdd={actions.handleAdd}
        createMutationPending={mutations.createMutation.isPending}
        customTitle={customTitle}
        customSearchPlaceholder={customSearchPlaceholder}
      />

      {/* Level 1 Filter Tabs (Schema-driven) */}
      <Level1FilterTabs
        activeFilteringConfig={activeFilteringConfig}
        level1Filter={level1Filter}
        onLevel1FilterChange={onLevel1FilterChange}
      />

      {/* Level 2 Filter Tabs (Schema-driven) */}
      <FilterTabBar
        data={data}
        filteringConfig={activeFilteringConfig}
        currentFilter={currentLevel2Filter}
        onFilterChange={handleLevel2FilterChange}
        showInheritanceInfo={true}
        processNames={processNames}
      />

      {/* Inline Form - Now renders via portal at top level */}
      {tableStateHook.showInlineForm && (
        <InlineForm
          resource={resource}
          entity={tableStateHook.editingEntity}
          onSubmit={actions.handleFormSubmit}
          onCancel={actions.handleFormCancel}
          mode={tableStateHook.formMode}
          parentData={filters.nodeId ? { nodeId: filters.nodeId } : undefined}
          navigationContext={(() => {
            const navContext = filters.nodeId ? { 
              nodeId: filters.nodeId,
              parentId: filters.nodeId,
              selectedId: filters.nodeId 
            } : undefined;
            
            return navContext;
          })()}
        />
      )}

      {/* Table */}
      <TableStructure
        resource={resource}
        columns={columns}
        processedEntities={processedEntities}
        sortConfig={tableStateHook.sortConfig}
        columnFilters={tableStateHook.columnFilters}
        selectedRows={tableStateHook.selectedRows}
        isAllSelected={actions.isAllSelected}
        isIndeterminate={actions.isIndeterminate}
        onSelectAll={actions.handleSelectAll}
        onSelectRow={actions.handleSelectRow}
        onSort={actions.handleSort}
        onColumnFilter={actions.handleColumnFilter}
        onRowClick={onRowClick}
        onColumnClick={actions.handleColumnClick}
        contextMenuActions={actions.contextMenuActions}
        resourceKey={resourceKey}
        onViewHistory={changeHistory.openChangeHistory}
      />

      {/* Floating Bulk Actions */}
      {resource.table?.bulkSelect && (
        <FloatingBulkActions
          resource={resource}
          selectedCount={tableStateHook.selectedRows.size}
          onAction={actions.handleBulkAction}
          isVisible={actions.hasSelectedRows}
        />
      )}
      
      {/* 🏆 ENTERPRISE: Batch Version Tracking Indicator - DISABLED */}
      {/* 
      <UnsavedChangesIndicator
        hasUnsavedChanges={batchVersionTracking.hasUnsavedChanges}
        changeCount={batchVersionTracking.changeCount}
        lastSavedAt={batchVersionTracking.lastSavedAt}
        isSaving={batchVersionTracking.isSaving}
        saveError={batchVersionTracking.saveError}
        onSave={batchVersionTracking.saveVersion}
        onDiscard={batchVersionTracking.discardChanges}
      />
      */}
      
      {/* 🏆 GOLD STANDARD: Change History Modal */}
      <ChangeHistoryModal {...changeHistory.modalProps} />
    </div>
  );
};

export default AutoTable;