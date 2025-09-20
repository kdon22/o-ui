/**
 * Table Cell - Individual table cell component with inline editing
 * Extracted from auto-datatable.tsx for better maintainability
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/generalUtils';

// UI Components
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

// Types
import { TableCellProps, TableColumn } from '../types';

interface ExtendedTableCellProps extends TableCellProps {
  onEdit: () => void;
}

export const TableCell: React.FC<ExtendedTableCellProps> = ({
  value,
  column,
  isEditing,
  onChange,
  onSave,
  onCancel,
  onEdit
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Sync local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing) {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleClick = () => {
    if (!isEditing) {
      onEdit();
    }
  };

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
  };

  const handleSave = () => {
    onChange(localValue);
    onSave();
  };

  const handleCancel = () => {
    setLocalValue(value); // Reset to original value
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      // Let the parent handle tab navigation
      handleSave();
    }
  };

  const handleBlur = () => {
    // Save on blur (when user clicks away)
    if (isEditing) {
      handleSave();
    }
  };

  // ============================================================================
  // CELL RENDERERS
  // ============================================================================

  const renderEditingCell = () => {
    switch (column.type) {
      case 'text':
        return (
          <Input
            ref={inputRef}
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full h-8 text-sm border-blue-500"
            autoFocus
          />
        );

      case 'number':
        return (
          <Input
            ref={inputRef}
            type="number"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value ? parseFloat(e.target.value) : null)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full h-8 text-sm border-blue-500"
            autoFocus
          />
        );

      case 'select':
        return (
          <Select
            value={localValue || ''}
            onValueChange={handleChange}
            onOpenChange={(open) => {
              if (!open) handleSave(); // Save when dropdown closes
            }}
          >
            <SelectTrigger className="w-full h-8 text-sm border-blue-500">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                <span className="text-gray-400">None</span>
              </SelectItem>
              {(column.options || []).map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi_select':
        // For now, treat as text - could be enhanced later
        return (
          <Input
            ref={inputRef}
            value={Array.isArray(localValue) ? localValue.join(', ') : localValue || ''}
            onChange={(e) => handleChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full h-8 text-sm border-blue-500"
            placeholder="Tag1, Tag2, ..."
            autoFocus
          />
        );

      case 'date':
        return (
          <Input
            ref={inputRef}
            type="date"
            value={localValue ? new Date(localValue).toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full h-8 text-sm border-blue-500"
            autoFocus
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center h-8">
            <input
              type="checkbox"
              checked={!!localValue}
              onChange={(e) => {
                handleChange(e.target.checked);
                // Auto-save boolean changes
                setTimeout(() => handleSave(), 0);
              }}
              className="w-4 h-4 text-blue-600 rounded"
              autoFocus
            />
          </div>
        );

      default:
        return (
          <Input
            ref={inputRef}
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full h-8 text-sm border-blue-500"
            autoFocus
          />
        );
    }
  };

  const renderDisplayCell = () => {
    switch (column.type) {
      case 'boolean':
        return (
          <div className="flex items-center h-8">
            <input
              type="checkbox"
              checked={!!value}
              onChange={() => {}} // Read-only in display mode
              disabled
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>
        );

      case 'multi_select':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          );
        }
        return null;

      case 'date':
        if (value) {
          try {
            return new Date(value).toLocaleDateString();
          } catch {
            return value;
          }
        }
        return null;

      case 'number':
        if (value !== null && value !== undefined && value !== '') {
          return typeof value === 'number' ? value.toLocaleString() : value;
        }
        return null;

      default:
        return value || null;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <td
      className={cn(
        "px-3 py-2 border-r border-gray-200 cursor-pointer",
        isEditing && "bg-blue-50/50"
      )}
      style={{ 
        borderBottom: '1px solid #e5e7eb',
        minWidth: 150,
        maxWidth: 300
      }}
      onClick={handleClick}
    >
      <div className="min-h-[32px] flex items-center">
        {isEditing ? renderEditingCell() : renderDisplayCell()}
      </div>
    </td>
  );
};
