/**
 * Text Cell Editor - Editor for text/string values
 * 
 * Features:
 * - Simple text input
 * - Multiline support (textarea)
 * - Character limit validation
 * - Auto-resize for multiline
 */

"use client";

import React, { useState, useEffect } from 'react';

// UI Components
import { Input, TextArea } from '@/components/ui';

// Components
import { BaseCellEditor } from './base-cell-editor';

// Utils
import { validateCellValue } from '../utils/cell-utils';

// Types
import { TextCellEditorProps } from '../types';

export const TextCellEditor: React.FC<TextCellEditorProps> = ({
  value,
  column,
  onChange,
  onSave,
  onCancel,
  placeholder,
  maxLength,
  multiline = false,
  autoFocus = true,
  className
}) => {
  const [localValue, setLocalValue] = useState<string>(value || '');
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
      {multiline ? (
        <TextArea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || `Enter ${column.name.toLowerCase()}...`}
          maxLength={maxLength}
          className="w-full h-full border-none outline-none resize-none p-2 text-sm"
          rows={2}
        />
      ) : (
        <Input
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || `Enter ${column.name.toLowerCase()}...`}
          maxLength={maxLength}
          className="w-full h-full border-none outline-none p-2 text-sm bg-transparent"
        />
      )}
    </BaseCellEditor>
  );
};
