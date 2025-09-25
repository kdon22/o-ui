/**
 * Table Header Component - Search and Actions
 */

import React from 'react';
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';
import { SearchField } from '@/components/ui/search-field';
import type { ResourceSchema } from '@/lib/resource-system/schemas';

interface TableHeaderProps {
  resource: ResourceSchema;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  hasSelectedRows: boolean;
  selectedRowsCount: number;
  enhancedHeaderActions?: React.ReactNode;
  activeFilteringConfig?: any;
  onAdd: () => void;
  createMutationPending?: boolean;
  customTitle?: string; // Allow custom title override
  customSearchPlaceholder?: string; // Allow custom search placeholder
  buttonVariant?: 'blue' | 'black' | 'gray'; // Button color variant
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  resource,
  searchTerm,
  onSearchChange,
  hasSelectedRows,
  selectedRowsCount,
  enhancedHeaderActions,
  activeFilteringConfig,
  onAdd,
  createMutationPending = false,
  customTitle,
  customSearchPlaceholder,
  buttonVariant = 'blue'
}) => {
  // Get button styling based on variant
  const getButtonClass = (variant: 'blue' | 'black' | 'gray') => {
    switch (variant) {
      case 'black':
        return 'flex items-center gap-2 bg-black text-white hover:bg-gray-800 transition-colors shadow-sm';
      case 'gray':
        return 'flex items-center gap-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors shadow-sm';
      case 'blue':
      default:
        return 'flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm';
    }
  };

  return (
    <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{customTitle || resource.display.title}</h2>
          {hasSelectedRows && (
            <span className="text-sm text-gray-500">
              {selectedRowsCount} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchField
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={customSearchPlaceholder || resource.search.placeholder || `Search ${resource.databaseKey}...`}
              className="w-80"
            />
          </div>
          
          {/* Custom header actions or default Add button - positioned right next to search */}
          {enhancedHeaderActions ? (
            enhancedHeaderActions
          ) : (
            /* Only show Add button if not in Level 1 filtering */
            !activeFilteringConfig?.level1 && (
              <Button
                onClick={onAdd}
                className={getButtonClass(buttonVariant)}
                disabled={createMutationPending}
              >
                <Plus className="h-4 w-4" />
                Add {resource.modelName}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};