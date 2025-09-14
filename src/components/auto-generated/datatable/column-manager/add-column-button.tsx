/**
 * Add Column Button - Airtable-like column addition
 * 
 * Features:
 * - + Add Column button in header
 * - Quick type selection dropdown
 * - Inline column creation
 */

"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { 
  Plus,
  Type, 
  Hash, 
  Calendar, 
  ToggleLeft, 
  List
} from 'lucide-react';
import { ColumnTypeEditor } from './column-type-editor';
import { FieldTypePicker } from './field-type-picker';

interface TableColumn {
  name: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'boolean';
  required?: boolean;
  options?: string[];
  format?: string;
  description?: string;
}

interface AddColumnButtonProps {
  onAddColumn: (column: TableColumn) => void;
  disabled?: boolean;
}

const QUICK_COLUMN_TYPES = [
  {
    value: 'text',
    label: 'Single line text',
    icon: Type
  },
  {
    value: 'number',
    label: 'Number',
    icon: Hash
  },
  {
    value: 'select',
    label: 'Single select',
    icon: List
  },
  {
    value: 'date',
    label: 'Date',
    icon: Calendar
  },
  {
    value: 'boolean',
    label: 'Checkbox',
    icon: ToggleLeft
  }
];

export const AddColumnButton: React.FC<AddColumnButtonProps> = ({
  onAddColumn,
  disabled = false
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TableColumn['type']>('text');

  // Convert whitespace-separated words to camelCase
  const toCamelFromSpaces = (input: string): string => {
    const parts = input.trim().split(/\s+/);
    if (parts.length === 0) return '';
    return parts
      .map((w, i) => {
        const lower = w.toLowerCase();
        return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join('');
  };

  const handleQuickAdd = (type: TableColumn['type']) => {
    // Open the editor so the user can set BOTH name and type in one screen
    setSelectedType(type);
    setIsEditorOpen(true);
  };

  const handleCustomAdd = () => {
    setIsEditorOpen(true);
  };

  const handleSaveCustomColumn = (column: TableColumn) => {
    onAddColumn(column);
    setIsEditorOpen(false);
  };

  return (
    <>
      <th 
        className="px-3 py-2 border-r border-gray-200 min-w-[80px]"
        style={{ borderBottom: '1px solid #e5e7eb' }}
      >
        {/* Big + button that opens an inline picker (Airtable-like) */}
        <FieldTypePicker
          open={isPickerOpen}
          onOpenChange={(open) => setIsPickerOpen(open)}
          onSelect={(type) => {
            setSelectedType(type);
            setIsPickerOpen(false);
            setIsEditorOpen(true);
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label="Add field"
            className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            onClick={() => setIsPickerOpen(true)}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </FieldTypePicker>
      </th>

      {/* Custom Column Editor */}
      <ColumnTypeEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        column={{
          // Preselect the chosen type; leave name empty for user input
          name: '',
          type: selectedType,
          required: false,
          options: selectedType === 'select' || selectedType === 'multi_select' ? ['Option 1'] : [],
          description: ''
        }}
        onSave={handleSaveCustomColumn}
      />
    </>
  );
};
