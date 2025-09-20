/**
 * Boolean Cell Editor - Editor for true/false values
 * 
 * Features:
 * - Checkbox input
 * - Toggle switch variant
 * - Radio button variant
 * - Custom true/false labels
 * - Auto-save on change
 */

"use client";

import React, { useState, useEffect } from 'react';

// UI Components
import { Switch } from '@/components/ui';

// Components
import { BaseCellEditor } from './base-cell-editor';

// Utils
import { validateCellValue } from '../utils/cell-utils';

// Types
import { BooleanCellEditorProps } from '../types';

export const BooleanCellEditor: React.FC<BooleanCellEditorProps> = ({
  value,
  column,
  onChange,
  onSave,
  onCancel,
  trueLabel = 'Yes',
  falseLabel = 'No',
  variant = 'checkbox',
  autoFocus = true,
  className
}) => {
  const [localValue, setLocalValue] = useState<boolean>(Boolean(value));
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>('');

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

  const handleChange = (newValue: boolean) => {
    setLocalValue(newValue);
    onChange(newValue);
    
    // Auto-save boolean changes immediately
    setTimeout(() => {
      if (isValid) {
        onSave();
      }
    }, 0);
  };

  const handleSave = () => {
    if (isValid) {
      onSave();
    }
  };

  const handleCancel = () => {
    setLocalValue(Boolean(value));
    onCancel();
  };

  // ============================================================================
  // RENDER VARIANTS
  // ============================================================================

  const renderCheckbox = () => (
    <div className="flex items-center justify-center w-full h-full">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={localValue}
          onChange={(e) => handleChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          autoFocus={autoFocus}
        />
        <span className="text-sm text-gray-700">
          {localValue ? trueLabel : falseLabel}
        </span>
      </label>
    </div>
  );

  const renderToggle = () => (
    <div className="flex items-center justify-between w-full h-full px-2">
      <span className="text-sm text-gray-700">
        {localValue ? trueLabel : falseLabel}
      </span>
      <Switch
        checked={localValue}
        onCheckedChange={handleChange}
        className="ml-2"
      />
    </div>
  );

  const renderRadio = () => (
    <div className="flex items-center space-x-4 w-full h-full px-2">
      <label className="flex items-center space-x-1 cursor-pointer">
        <input
          type="radio"
          name={`boolean-${column.name}`}
          checked={localValue === true}
          onChange={() => handleChange(true)}
          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          autoFocus={autoFocus}
        />
        <span className="text-sm text-gray-700">{trueLabel}</span>
      </label>
      
      <label className="flex items-center space-x-1 cursor-pointer">
        <input
          type="radio"
          name={`boolean-${column.name}`}
          checked={localValue === false}
          onChange={() => handleChange(false)}
          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">{falseLabel}</span>
      </label>
    </div>
  );

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
      {variant === 'checkbox' && renderCheckbox()}
      {variant === 'toggle' && renderToggle()}
      {variant === 'radio' && renderRadio()}
    </BaseCellEditor>
  );
};
