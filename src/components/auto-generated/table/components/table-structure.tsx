/**
 * Table Structure Component - Table with Headers and Body
 */

import React from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
  Button
} from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown
} from 'lucide-react';
import { ColumnFilter } from '../column-filter';
import { ContextMenu } from '../context-menu';
import { VersionIndicator } from './version-indicator';
import type { ResourceSchema } from '@/lib/resource-system/schemas';

interface TableStructureProps {
  resource: ResourceSchema;
  columns: any[];
  processedEntities: any[];
  sortConfig: { field: string; direction: 'asc' | 'desc' };
  columnFilters: Record<string, string>;
  selectedRows: Set<string>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (id: string, checked: boolean) => void;
  onSort: (field: string) => void;
  onColumnFilter: (field: string, value: string) => void;
  onRowClick?: (entity: any) => void;
  onColumnClick: (entity: any, field: any) => void;
  contextMenuActions: any;
  resourceKey: string;
  onViewHistory?: (entity: any) => void;
}

export const TableStructure: React.FC<TableStructureProps> = ({
  resource,
  columns,
  processedEntities,
  sortConfig,
  columnFilters,
  selectedRows,
  isAllSelected,
  isIndeterminate,
  onSelectAll,
  onSelectRow,
  onSort,
  onColumnFilter,
  onRowClick,
  onColumnClick,
  contextMenuActions,
  resourceKey,
  onViewHistory
}) => {
  return (
    <div className="flex-1 overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {/* Bulk Select Column */}
            {resource.table?.bulkSelect && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
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
                        onClick={() => onSort(column.key)}
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
                      onChange={(value) => onColumnFilter(column.key, value)}
                    />
                  )}
                </div>
              </TableHead>
            ))}
            
            {/* Version Column */}
            <TableHead className="w-32">
              <span className="font-medium text-sm text-gray-900">Version</span>
            </TableHead>
            
            {/* Actions Column */}
            <TableHead className="min-w-20">
              <span className="font-medium text-sm text-gray-900">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
          
          <TableBody>
            {processedEntities.map((entity: any, index: number) => {
              // Generate a unique key that handles inheritance scenarios
              // Priority: entity.id -> originalId + branchId -> fallback to index
              const uniqueKey = entity.id || 
                                (entity.originalId ? `${entity.originalId}-${entity.branchId || ''}` : null) ||
                                (entity.sourceNodeId ? `${entity.sourceNodeId}-${entity.name}-${index}` : null) ||
                                `entity-${index}`;
              
              return (
                <TableRow 
                  key={uniqueKey} 
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
                      onCheckedChange={(checked) => onSelectRow(entity.id, !!checked)}
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
                          onColumnClick(entity, field!);
                        }
                      }}
                    >
                      {column.render(entity)}
                    </TableCell>
                  );
                })}
                
                {/* Version Indicator */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <VersionIndicator
                    entity={entity}
                    onViewHistory={onViewHistory}
                    compact={true}
                  />
                </TableCell>
                
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
              );
            })}
          </TableBody>
        </Table>
        
        {/* Empty state */}
        {processedEntities.length === 0 && (
          <div className="flex h-[200px] items-center justify-center text-gray-500">
            No {resource.databaseKey} found.
          </div>
        )}
      </div>
  );
};