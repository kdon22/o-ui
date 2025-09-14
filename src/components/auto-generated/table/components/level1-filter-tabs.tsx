/**
 * Level 1 Filter Tabs Component - Process Types
 */

import React from 'react';

interface Level1FilterTabsProps {
  activeFilteringConfig: any;
  level1Filter: string;
  onLevel1FilterChange?: (value: string) => void;
}

export const Level1FilterTabs: React.FC<Level1FilterTabsProps> = ({
  activeFilteringConfig,
  level1Filter,
  onLevel1FilterChange
}) => {
  if (!activeFilteringConfig?.level1) {
    return null;
  }

  return (
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
  );
};