/**
 * Filter Tab Bar V2 - Enhanced with Inheritance Tooltips
 * 
 * Clean replacement with hover tooltips showing inheritance context.
 * Designed for the hybrid inheritance system.
 */

"use client";

import React, { useMemo, useCallback } from 'react';
import { Filter, ArrowUp, Dot } from 'lucide-react';
import { TabBar } from '@/components/ui/tab-bar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// INTERFACES
// ============================================================================

export interface FilterTabBarProps {
  data: any[];
  filteringConfig?: {
    level2?: {
      groupBy?: string;
      filterField?: string;
      title?: string;
      showAll?: boolean;
    };
  };
  currentFilter: string;
  onFilterChange: (value: string) => void;
  className?: string;
  /** Enhanced data with inheritance metadata */
  showInheritanceInfo?: boolean;
  /** Process names data with inheritance info (used instead of extracting from data) */
  processNames?: Array<{ 
    id: string; 
    name: string; 
    count: number; 
    type: string; 
    sourceNodeId?: string;
    inheritanceLevel?: number;
    isInherited?: boolean;
  }>;
}

interface ProcessTabData {
  key: string;
  label: string;
  value: string;
  count: number;
  inheritanceInfo?: {
    isInherited: boolean;
    sourceNodeName?: string;
    inheritanceLevel?: number;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FilterTabBar: React.FC<FilterTabBarProps> = ({
  data,
  filteringConfig,
  currentFilter,
  onFilterChange,
  className,
  showInheritanceInfo = true,
  processNames
}) => {
  
  // Debug logging with stack trace to identify caller
  console.log('🔥 [FilterTabBarV2] Component render:', {
    dataLength: data?.length || 0,
    hasFilteringConfig: !!filteringConfig,
    currentFilter,
    showInheritanceInfo,
    dataHash: data ? JSON.stringify(data.map(d => d.id)).slice(0, 100) : 'no-data',
    actualDataIds: data?.map(d => ({ id: d.id, name: d.name })) || [],
    filteringConfigLevel2: filteringConfig?.level2,
    callerStack: new Error().stack?.split('\n').slice(1, 4).join(' -> '),
    timestamp: new Date().toISOString()
  });

  // Generate Level 2 tabs with inheritance metadata
  const level2Tabs = useMemo(() => {
    console.log('🔥 [FilterTabBarV2] useMemo recalculating tabs:', {
      dataLength: data?.length || 0,
      dataIds: data?.map(d => d.id) || [],
      timestamp: new Date().toISOString()
    });
    
    const level2Config = filteringConfig?.level2;
    if (!level2Config) return [];

    // Use processNames data directly if available (for process filter tabs)
    if (processNames && processNames.length > 0) {
      console.log('🔍 [FilterTabBarV2] Using processNames data directly:', {
        processNamesCount: processNames.length,
        sampleProcessNames: processNames.slice(0, 2)
      });
      
      const processTabsData: ProcessTabData[] = processNames.map((process) => ({
        key: process.id,
        label: process.name,
        value: process.id,
        count: process.count,
        inheritanceInfo: showInheritanceInfo ? {
          isInherited: process.isInherited || false,
          sourceNodeName: process.sourceNodeId, // TODO: Map to node name if needed
          inheritanceLevel: process.inheritanceLevel || 0
        } : undefined
      }));

      console.log('🔍 [FilterTabBarV2] Generated process tabs from processNames:', {
        processTabsData: processTabsData.map(p => ({
          label: p.label,
          count: p.count,
          isInherited: p.inheritanceInfo?.isInherited,
          inheritanceLevel: p.inheritanceInfo?.inheritanceLevel
        }))
      });

      // Convert to TabBar format with enhanced rendering
      const tabs = processTabsData.map((processTab) => ({
        key: processTab.key,
        label: processTab.label,
        icon: Filter,
        count: processTab.count,
        // Custom render function for inheritance indicators
        customRender: showInheritanceInfo ? (
          <ProcessTabWithTooltip processTab={processTab} />
        ) : undefined
      }));

      // Add "All" tab if configured
      if (level2Config.showAll) {
        return [
          { key: 'all', label: 'All', icon: Filter, count: data.length },
          ...tabs
        ];
      }

      return tabs;
    }
    
    // Fallback to extracting from data (original logic)
    if (!data.length) return [];

    const groupField = level2Config.groupBy || level2Config.filterField;
    const displayField = level2Config.filterField;
    
    if (!groupField) return [];
    
    console.log('🔍 [FilterTabBarV2] Tab generation (fallback from data):', {
      groupField,
      displayField,
      dataLength: data.length,
      sampleData: data.slice(0, 2)
    });
    
    // Get unique values with inheritance metadata
    const uniqueValues = Array.from(new Set(
      data.map((item: any) => item[groupField]).filter(Boolean)
    ));

    const processTabsData: ProcessTabData[] = uniqueValues.map((value: string, index: number) => {
      // Find the first item with this groupField value to get metadata
      const sampleItem = data.find((item: any) => item[groupField] === value);
      const displayValue = displayField ? (sampleItem?.[displayField] || value) : value;
      const itemCount = data.filter((item: any) => item[groupField] === value).length;
      
      // Extract inheritance info if available
      const inheritanceInfo = showInheritanceInfo && sampleItem ? {
        isInherited: sampleItem.isInherited || false,
        sourceNodeName: sampleItem.sourceNodeName,
        inheritanceLevel: sampleItem.inheritanceLevel || 0
      } : undefined;

      return {
        key: value || `unique-value-${index}`, // Ensure unique key even for falsy values
        label: displayValue,
        value: value,
        count: itemCount,
        inheritanceInfo
      };
    });

    console.log('🔍 [FilterTabBarV2] Generated process tabs:', {
      uniqueValues,
      processTabsData: processTabsData.map(p => ({
        label: p.label,
        count: p.count,
        isInherited: p.inheritanceInfo?.isInherited,
        inheritanceLevel: p.inheritanceInfo?.inheritanceLevel
      }))
    });

    // Convert to TabBar format with enhanced rendering
    const tabs = processTabsData.map((processTab, index) => ({
      key: processTab.key || `process-tab-${index}`, // Ensure unique key
      label: processTab.label,
      icon: Filter,
      count: processTab.count,
      // Custom render function for inheritance indicators
      customRender: showInheritanceInfo ? (
        <ProcessTabWithTooltip processTab={processTab} />
      ) : undefined
    }));

    // Add "All" tab if configured
    if (level2Config.showAll) {
      return [
        { key: 'all', label: 'All', icon: Filter, count: data.length },
        ...tabs
      ];
    }

    return tabs;
  }, [data, filteringConfig?.level2, showInheritanceInfo, processNames]);

  // Handle filter changes
  const handleFilterChange = useCallback((value: string) => {
    console.log('🔍 [FilterTabBarV2] Filter change:', {
      newValue: value,
      currentFilter
    });
    
    onFilterChange(value);
  }, [onFilterChange, currentFilter]);

  // Render minimal bar with just "All" when configured but no specific tabs yet
  if (level2Tabs.length === 0) {
    console.log('⚠️ [FilterTabBarV2] No tabs to render; falling back to All when allowed');
    if (filteringConfig?.level2?.showAll) {
      return (
        <TooltipProvider>
          <div className={`px-6 py-4 border-b border-gray-200 bg-gray-50/30 ${className || ''}`}>
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {filteringConfig?.level2?.title || 'Filter'}
              </h3>
            </div>
            <TabBar
              tabs={[{ key: 'all', label: 'All', icon: Filter, count: data?.length || 0 }]}
              activeTab={currentFilter}
              onTabChange={handleFilterChange}
              variant="pills"
              theme="blue"
              size="sm"
              showIcons={false}
              showCounts={true}
              animate={true}
              className="w-full"
            />
          </div>
        </TooltipProvider>
      );
    }
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`px-6 py-4 border-b border-gray-200 bg-gray-50/30 ${className || ''}`}>
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {filteringConfig?.level2?.title || 'Filter'}
          </h3>
        </div>
        <TabBar
          tabs={level2Tabs}
          activeTab={currentFilter}
          onTabChange={handleFilterChange}
          variant="pills"
          theme="blue"
          size="sm"
          showIcons={false}
          showCounts={true}
          animate={true}
          className="w-full"
        />
      </div>
    </TooltipProvider>
  );
};

// ============================================================================
// PROCESS TAB WITH TOOLTIP
// ============================================================================

const ProcessTabWithTooltip: React.FC<{ processTab: ProcessTabData }> = ({ processTab }) => {
  const { label, count, inheritanceInfo } = processTab;
  
  if (!inheritanceInfo) {
    return (
      <span className="flex items-center gap-2">
        {label}
        {count > 0 && (
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
            {count}
          </span>
        )}
      </span>
    );
  }

  const tooltipContent = inheritanceInfo.isInherited 
    ? `Inherited from: ${inheritanceInfo.sourceNodeName || 'Parent Node'} (${inheritanceInfo.inheritanceLevel} level${inheritanceInfo.inheritanceLevel !== 1 ? 's' : ''} up)`
    : "Defined directly on this node";

  const inheritanceIndicator = inheritanceInfo.isInherited ? (
    <ArrowUp className="w-3 h-3 text-blue-500" />
  ) : (
    <Dot className="w-3 h-3 text-green-500" />
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-2 cursor-help">
          {inheritanceIndicator}
          <span className={inheritanceInfo.isInherited ? 'text-blue-700' : 'text-gray-900'}>
            {label}
          </span>
          {count > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              inheritanceInfo.isInherited 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {count}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <div className="font-medium">{label}</div>
          <div className="text-gray-500">{tooltipContent}</div>
          <div className="text-gray-400 text-xs mt-1">{count} rule{count !== 1 ? 's' : ''}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default FilterTabBar;