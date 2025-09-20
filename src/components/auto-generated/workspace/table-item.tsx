'use client';

import React from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { 
  Button,
  Badge
} from '@/components/ui';
import { 
  Table,
  MoreHorizontal,
  ExternalLink,
  Star
} from 'lucide-react';
import TableActionsMenu from './table-actions-menu';

interface Table {
  id: string;
  name: string;
  categoryId?: string;
  __inherited?: boolean;
  __synced?: boolean;
}

interface TableItemProps {
  table: Table;
  recordCount: number;
  isSelected?: boolean;
  onSelect?: () => void;
  isStarred?: boolean;
  onToggleStar?: () => void;
  className?: string;
}

export const TableItem: React.FC<TableItemProps> = ({
  table,
  recordCount,
  isSelected,
  onSelect,
  isStarred,
  onToggleStar,
  className
}) => {
  const formatCount = (count: number) => {
    if (count === 0) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}m`;
  };

  return (
    <div className={cn("group", className)}>
      <Button
        variant={isSelected ? "secondary" : "ghost"}
        size="sm"
        onClick={onSelect}
        className={cn(
          "w-full justify-start px-3 py-2 h-8 text-sm",
          isSelected && "bg-accent",
          table.__inherited && "opacity-75"
        )}
      >
        <Table className="w-4 h-4 mr-2 flex-shrink-0" />
        
        <span className="flex-1 text-left truncate">
          {table.name}
        </span>
        
        {/* Record Count */}
        <Badge 
          variant="outline" 
          className="text-xs ml-2 flex-shrink-0"
        >
          {formatCount(recordCount)}
        </Badge>
        
        {/* Branch Indicator */}
        {table.__inherited && (
          <Badge 
            variant="secondary" 
            className="text-xs ml-1 flex-shrink-0"
          >
            inherited
          </Badge>
        )}
        
        {/* Sync Status */}
        {!table.__synced && (
          <div className="w-2 h-2 bg-orange-500 rounded-full ml-2 flex-shrink-0" />
        )}
        
        {/* Star Button */}
        {onToggleStar && (
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 ml-1"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar();
            }}
            title={isStarred ? "Remove from starred" : "Add to starred"}
          >
            <Star 
              className={cn(
                "w-3 h-3",
                isStarred ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
              )} 
            />
          </Button>
        )}
        
        {/* Actions */}
        <TableActionsMenu
          table={table}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 ml-1 flex-shrink-0"
          useSpanTrigger={true}
          onRenamed={() => {}}
          onDuplicated={() => {}}
          onDeleted={() => {}}
        />
      </Button>
    </div>
  );
};
