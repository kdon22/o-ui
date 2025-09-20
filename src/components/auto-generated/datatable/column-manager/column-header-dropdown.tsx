/**
 * Column Header Dropdown - Airtable-like column menu
 * 
 * Features:
 * - Edit field name and type
 * - Duplicate field
 * - Insert left/right
 * - Sort A→Z, Z→A
 * - Filter by field
 * - Hide/delete field
 */

"use client";

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button
} from '@/components/ui';
import { 
  ChevronDown,
  Edit2,
  Copy,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Filter,
  EyeOff,
  Trash2,
  Info,
  Lock
} from 'lucide-react';

// Types
import type { TableColumn } from '../types';

interface ColumnHeaderDropdownProps {
  column: TableColumn;
  onEditField: () => void;
  onDuplicateField: () => void;
  onInsertLeft: () => void;
  onInsertRight: () => void;
  onSortAsc: () => void;
  onSortDesc: () => void;
  onFilter: () => void;
  onHideField: () => void;
  onDeleteField: () => void;
  onEditDescription: () => void;
  onEditPermissions: () => void;
}

export const ColumnHeaderDropdown: React.FC<ColumnHeaderDropdownProps> = ({
  column,
  onEditField,
  onDuplicateField,
  onInsertLeft,
  onInsertRight,
  onSortAsc,
  onSortDesc,
  onFilter,
  onHideField,
  onDeleteField,
  onEditDescription,
  onEditPermissions
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-70 hover:opacity-100 transition-opacity rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-56">
        {/* Edit Options */}
        <DropdownMenuItem onClick={onEditField}>
          <Edit2 className="w-4 h-4 mr-3" />
          Edit field
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onDuplicateField}>
          <Copy className="w-4 h-4 mr-3" />
          Duplicate field
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Insert Options */}
        <DropdownMenuItem onClick={onInsertLeft}>
          <ArrowLeft className="w-4 h-4 mr-3" />
          Insert left
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onInsertRight}>
          <ArrowRight className="w-4 h-4 mr-3" />
          Insert right
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Field Management */}
        <DropdownMenuItem onClick={onEditDescription}>
          <Info className="w-4 h-4 mr-3" />
          Edit field description
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onEditPermissions}>
          <Lock className="w-4 h-4 mr-3" />
          Edit field permissions
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Sort Options */}
        <DropdownMenuItem onClick={onSortAsc}>
          <ArrowUp className="w-4 h-4 mr-3" />
          Sort A → Z
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onSortDesc}>
          <ArrowDown className="w-4 h-4 mr-3" />
          Sort Z → A
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Filter & Visibility */}
        <DropdownMenuItem onClick={onFilter}>
          <Filter className="w-4 h-4 mr-3" />
          Filter by this field
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onHideField}>
          <EyeOff className="w-4 h-4 mr-3" />
          Hide field
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Delete */}
        <DropdownMenuItem 
          onClick={onDeleteField}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-3" />
          Delete field
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
