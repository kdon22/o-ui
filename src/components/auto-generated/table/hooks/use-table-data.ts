/**
 * Table Data Hook - Processes and filters table data
 * 
 * Features:
 * - Level 1 and Level 2 filtering
 * - Search filtering
 * - Column filtering
 * - Sorting logic
 * - Column generation from resource schema
 */

import { useMemo } from 'react';
import { FieldRenderer } from '@/lib/resource-system/field-registry';
import type { SortConfig } from '../types';

interface UseTableDataProps {
  data: any[];
  resource: any;
  searchTerm: string;
  columnFilters: Record<string, string>;
  sortConfig: SortConfig;
  level1Filter: string;
  level2Filter: string;
  filteringConfig?: any;
}

interface TableDataResult {
  processedEntities: any[];
  columns: any[];
}

export const useTableData = ({
  data,
  resource,
  searchTerm,
  columnFilters,
  sortConfig,
  level1Filter,
  level2Filter,
  filteringConfig
}: UseTableDataProps): TableDataResult => {
  
  // Get active filtering configuration
  const activeFilteringConfig = filteringConfig || resource.filtering;

  // Filter and sort entities
  const processedEntities = useMemo(() => {
    let filtered = data;
    
    // Debug: Log initial filtering state
    console.log('🔍 [useTableData] Starting data processing:', {
      totalDataCount: data.length,
      level1Filter,
      level2Filter,
      hasLevel1Config: !!activeFilteringConfig?.level1,
      hasLevel2Config: !!activeFilteringConfig?.level2,
      activeFilteringConfig
    });
    
    // Apply Level 1 filtering (resource-specific)
    if (activeFilteringConfig?.level1 && level1Filter !== 'all') {
      const level1Config = activeFilteringConfig.level1;
      console.log('🔍 [useTableData] Applying Level 1 filtering:', {
        level1Filter,
        filterField: level1Config.filterField
      });
      filtered = filtered.filter((entity: any) =>
        entity[level1Config.filterField] === level1Filter
      );
      console.log('🔍 [useTableData] Level 1 filtering complete:', {
        totalAfterFilter: filtered.length
      });
    } else {
      console.log('🔍 [useTableData] Skipping Level 1 filtering:', {
        hasLevel1Config: !!activeFilteringConfig?.level1,
        level1Filter,
        reason: !activeFilteringConfig?.level1 ? 'No level1 config' : 'Filter is "all"'
      });
    }

    // Apply Level 2 filtering (entity-specific)
    if (activeFilteringConfig?.level2 && level2Filter !== 'all') {
      const level2Config = activeFilteringConfig.level2;
      const groupField = level2Config.groupBy || level2Config.filterField;
      const displayField = level2Config.filterField;
      
      // Debug: Log filtering details
      console.log('🔍 [useTableData] Applying Level 2 filtering:', {
        level2Filter,
        groupField,
        displayField,
        totalBeforeFilter: filtered.length,
        sampleData: filtered.slice(0, 2).map(entity => ({
          id: entity.id,
          name: entity.name,
          [groupField]: entity[groupField],
          [displayField]: entity[displayField]
        }))
      });
      
      filtered = filtered.filter((entity: any) => {
        const entityGroupValue = entity[groupField];
        const entityDisplayValue = entity[displayField];
        
        // Filter by the stable ID (groupField), not the display name
        const matches = entityGroupValue === level2Filter;
        
        // Debug: Log individual entity filtering
        console.log('🔍 [useTableData] Filtering entity:', {
          entityId: entity.id,
          entityName: entity.name,
          entityGroupValue,
          entityDisplayValue,
          level2Filter,
          matches
        });
        
        return matches;
      });
      
      // Debug: Log filtering results
      console.log('🔍 [useTableData] Level 2 filtering results:', {
        totalAfterFilter: filtered.length,
        filteredEntities: filtered.map(entity => ({
          id: entity.id,
          name: entity.name,
          [groupField]: entity[groupField],
          [displayField]: entity[displayField]
        }))
      });
    } else {
      console.log('🔍 [useTableData] Skipping Level 2 filtering:', {
        hasLevel2Config: !!activeFilteringConfig?.level2,
        level2Filter,
        reason: !activeFilteringConfig?.level2 ? 'No level2 config' : 'Filter is "all"'
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchFields = resource.search.fields;
      console.log('🔍 [useTableData] Applying search filter:', {
        searchTerm,
        searchFields,
        totalBeforeSearch: filtered.length
      });
      filtered = filtered.filter((entity: any) =>
        searchFields.some((field: string) => 
          entity[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      console.log('🔍 [useTableData] Search filter complete:', {
        totalAfterSearch: filtered.length
      });
    } else {
      console.log('🔍 [useTableData] Skipping search filter:', {
        reason: 'No search term'
      });
    }

    // Apply column filters
    const hasColumnFilters = Object.keys(columnFilters).length > 0;
    if (hasColumnFilters) {
      console.log('🔍 [useTableData] Applying column filters:', {
        columnFilters,
        totalBeforeColumnFilters: filtered.length
      });
      Object.entries(columnFilters).forEach(([field, filterValue]) => {
        if (filterValue) {
          filtered = filtered.filter((entity: any) =>
            entity[field]?.toString().toLowerCase().includes(filterValue.toLowerCase())
          );
        }
      });
      console.log('🔍 [useTableData] Column filters complete:', {
        totalAfterColumnFilters: filtered.length
      });
    } else {
      console.log('🔍 [useTableData] Skipping column filters:', {
        reason: 'No column filters'
      });
    }

    // Apply sorting
    if (sortConfig.field) {
      console.log('🔍 [useTableData] Applying sorting:', {
        sortConfig,
        totalBeforeSorting: filtered.length
      });
      filtered.sort((a: any, b: any) => {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      // Sorting complete
    } else {
      // Skipping sorting - no sort config
    }

    // Final data processing result

    return filtered;
  }, [
    data, 
    searchTerm, 
    columnFilters, 
    sortConfig, 
    resource.search.fields, 
    level1Filter, 
    level2Filter, 
    activeFilteringConfig
  ]);

  // Table columns from resource schema
  const columns = useMemo(() => {
    return resource.fields
      // New rule: only show fields that explicitly define a table{} config
      // The existence of table{} implies inclusion; ignore any showInTable flags
      .filter((field: any) => !!field.table)
      .map((field: any) => ({
        key: field.key,
        header: field.label,
        width: field.table?.width || 'auto',
        sortable: field.table?.sortable !== false,
        filterable: field.table?.filterable !== false,
        render: (entity: any) => {
          return FieldRenderer({
            mode: "display",
            field: field,
            value: entity[field.key]
          });
        }
      }));
  }, [resource.fields]);

  return {
    processedEntities,
    columns
  };
};