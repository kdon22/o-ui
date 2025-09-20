/**
 * Select Cell Editor - Editor for single/multi-select values
 * 
 * Features:
 * - Dropdown selection
 * - Multi-select support
 * - Custom value support
 * - Searchable options
 * - Tag display for multi-select
 */

"use client";

import React, { useState, useEffect } from 'react';

// UI Components
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Input,
  Badge
} from '@/components/ui';
import { X, Plus } from 'lucide-react';

// Components
import { BaseCellEditor } from './base-cell-editor';

// Utils
import { validateCellValue } from '../utils/cell-utils';

// Types
import { SelectCellEditorProps, MultiSelectCellEditorProps } from '../types';

// ============================================================================
// SINGLE SELECT EDITOR
// ============================================================================

export const SelectCellEditor: React.FC<SelectCellEditorProps> = ({
  value,
  column,
  onChange,
  onSave,
  onCancel,
  options,
  allowCustomValues = false,
  searchable = false,
  autoFocus = true,
  className
}) => {
  const [localValue, setLocalValue] = useState<string>(value || '');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const availableOptions = options || column.options || [];
  const filteredOptions = searchable 
    ? availableOptions.filter(opt => 
        opt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableOptions;

  // ============================================================================
  // VALIDATION
  // ============================================================================

  useEffect(() => {
    const validation = validateCellValue(localValue, column);
    setIsValid(validation.isValid);
    setError(validation.error || '');
  }, [localValue, column]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleSave = () => {
    if (isValid) {
      onSave();
    }
  };

  const handleCancel = () => {
    setLocalValue(value || '');
    onCancel();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isCustomMode && allowCustomValues) {
    return (
      <BaseCellEditor
        value={localValue}
        column={column}
        onChange={onChange}
        onSave={handleSave}
        onCancel={handleCancel}
        isValid={isValid}
        error={error}
        autoFocus={autoFocus}
        className={className}
      >
        <div className="flex items-center w-full">
          <Input
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Enter custom value..."
            className="flex-1 border-none outline-none p-2 text-sm bg-transparent"
          />
          <button
            onClick={() => setIsCustomMode(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </BaseCellEditor>
    );
  }

  return (
    <BaseCellEditor
      value={localValue}
      column={column}
      onChange={onChange}
      onSave={handleSave}
      onCancel={handleCancel}
      isValid={isValid}
      error={error}
      autoFocus={autoFocus}
      className={className}
    >
      <Select
        value={localValue}
        onValueChange={handleChange}
        onOpenChange={(open) => {
          if (!open) {
            // Auto-save when dropdown closes
            handleSave();
          }
        }}
      >
        <SelectTrigger className="w-full h-full border-none outline-none bg-transparent">
          <SelectValue placeholder="Select an option..." />
        </SelectTrigger>
        <SelectContent>
          {searchable && (
            <div className="p-2">
              <Input
                placeholder="Search options..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
          )}
          
          <SelectItem value="">
            <span className="text-gray-400">None</span>
          </SelectItem>
          
          {filteredOptions.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
          
          {allowCustomValues && (
            <div className="border-t mt-1 pt-1">
              <button
                onClick={() => setIsCustomMode(true)}
                className="w-full px-2 py-1 text-sm text-left text-blue-600 hover:bg-blue-50 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add custom value
              </button>
            </div>
          )}
        </SelectContent>
      </Select>
    </BaseCellEditor>
  );
};

// ============================================================================
// MULTI-SELECT EDITOR
// ============================================================================

export const MultiSelectCellEditor: React.FC<MultiSelectCellEditorProps> = ({
  value,
  column,
  onChange,
  onSave,
  onCancel,
  options,
  maxSelections,
  allowCustomValues = false,
  autoFocus = true,
  className
}) => {
  const [localValue, setLocalValue] = useState<string[]>(
    Array.isArray(value) ? value : []
  );
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>('');
  const [newOption, setNewOption] = useState('');

  const availableOptions = options || column.options || [];

  // ============================================================================
  // VALIDATION
  // ============================================================================

  useEffect(() => {
    let validation = validateCellValue(localValue, column);
    
    // Check max selections
    if (validation.isValid && maxSelections && localValue.length > maxSelections) {
      validation = { 
        isValid: false, 
        error: `Maximum ${maxSelections} selections allowed` 
      };
    }
    
    setIsValid(validation.isValid);
    setError(validation.error || '');
  }, [localValue, column, maxSelections]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleToggleOption = (option: string) => {
    const newValue = localValue.includes(option)
      ? localValue.filter(v => v !== option)
      : [...localValue, option];
    
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleRemoveOption = (option: string) => {
    const newValue = localValue.filter(v => v !== option);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleAddCustomOption = () => {
    if (newOption.trim() && !localValue.includes(newOption.trim())) {
      const newValue = [...localValue, newOption.trim()];
      setLocalValue(newValue);
      onChange(newValue);
      setNewOption('');
    }
  };

  const handleSave = () => {
    if (isValid) {
      onSave();
    }
  };

  const handleCancel = () => {
    const originalValue = Array.isArray(value) ? value : [];
    setLocalValue(originalValue);
    onCancel();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <BaseCellEditor
      value={localValue}
      column={column}
      onChange={onChange}
      onSave={handleSave}
      onCancel={handleCancel}
      isValid={isValid}
      error={error}
      autoFocus={autoFocus}
      className={className}
    >
      <div className="w-full p-2 space-y-2">
        {/* Selected values */}
        {localValue.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {localValue.map(selectedValue => (
              <Badge
                key={selectedValue}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                {selectedValue}
                <button
                  onClick={() => handleRemoveOption(selectedValue)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Available options */}
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {availableOptions.map(option => (
            <label
              key={option}
              className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
            >
              <input
                type="checkbox"
                checked={localValue.includes(option)}
                onChange={() => handleToggleOption(option)}
                className="rounded"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>

        {/* Add custom option */}
        {allowCustomValues && (
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Add custom option..."
              className="flex-1 h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomOption();
                }
              }}
            />
            <button
              onClick={handleAddCustomOption}
              disabled={!newOption.trim()}
              className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </BaseCellEditor>
  );
};
