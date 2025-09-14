'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { 
  Button,
  Badge
} from '@/components/ui';
import { 
  ChevronRight,
  ChevronDown,
  Table,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { TableItem } from './table-item';

interface Category {
  id: string;
  name: string;
  icon?: string;
  position: number;
  __inherited?: boolean;
}

interface Table {
  id: string;
  name: string;
  categoryId?: string;
  __inherited?: boolean;
}

interface CategoryFolderProps {
  category: Category;
  tables: Table[];
  recordCounts: Record<string, number>;
  selectedTableId?: string;
  onTableSelect?: (tableId: string) => void;
  onCreateTable?: () => void;
  onToggleStar?: (tableId: string) => void;
  starredTableIds?: Set<string>;
  className?: string;
}

export const CategoryFolder: React.FC<CategoryFolderProps> = ({
  category,
  tables,
  recordCounts,
  selectedTableId,
  onTableSelect,
  onCreateTable,
  onToggleStar,
  starredTableIds,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalRecords = tables.reduce((sum, table) => 
    sum + (recordCounts[table.id] || 0), 0
  );

  return (
    <div className={cn("mb-2", className)}>
      {/* Category Header */}
      <div className="flex items-center group">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 justify-start px-2 py-1 h-8"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 mr-1" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-1" />
          )}
          
          <span className="mr-2 text-base">
            {category.icon || '📁'}
          </span>
          
          <span className="font-medium text-sm">
            {category.name}
          </span>
          
          {category.__inherited && (
            <Badge variant="secondary" className="ml-2 text-xs">
              from main
            </Badge>
          )}
          
          <div className="flex-1" />
          
          {tables.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {tables.length} {tables.length === 1 ? 'table' : 'tables'}
            </Badge>
          )}
        </Button>

        {/* Add Table Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateTable}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tables List */}
      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {tables.map(table => (
            <TableItem
              key={table.id}
              table={table}
              recordCount={recordCounts[table.id] || 0}
              isSelected={selectedTableId === table.id}
              onSelect={() => onTableSelect?.(table.id)}
              isStarred={starredTableIds?.has(table.id) || false}
              onToggleStar={() => onToggleStar?.(table.id)}
            />
          ))}
          
          {/* Add Table in Category */}
          {tables.length === 0 ? (
            <div className="py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateTable}
                className="text-muted-foreground hover:text-foreground text-xs h-7"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add first table
              </Button>
            </div>
          ) : (
            <div className="py-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateTable}
                className="text-muted-foreground hover:text-foreground text-xs h-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add table
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
