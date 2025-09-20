/**
 * Number Cell Editor - Editor for numeric values
 * 
 * Features:
 * - Number input with validation
 * - Min/max value constraints
 * - Decimal place formatting
 * - Step increment support
 * - Thousands separator option
 */

"use client";

import React, { useState, useEffect } from 'react';

// UI Components
import { Input } from '@/components/ui';

// Components
import { BaseCellEditor } from './base-cell-editor';

// Utils
import { validateCellValue } from '../utils/cell-utils';

// Types
import { NumberCellEditorProps } from '../types';

export const NumberCellEditor: React.FC<NumberCellEditorProps> = ({
  value,
  column,
  onChange,
  onSave,
  onCancel,
  min,
  max,
  step = 1,
  decimalPlaces,
  thousandsSeparator = false,
  autoFocus = true,
  className
}) => {
  const [localValue, setLocalValue] = useState<string>(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  });
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>('');

  // ============================================================================
  // VALIDATION & PARSING
  // ============================================================================

  const parseNumber = (input: string): number | null => {
    if (!input || input.trim() === '') return null;
    
    // Remove thousands separators for parsing
    const cleanInput = thousandsSeparator 
      ? input.replace(/,/g, '') 
      : input;
    
    const num = parseFloat(cleanInput);
    return isNaN(num) ? null : num;
  };

  const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return '';
    
    let formatted = num.toString();
    
    // Apply decimal places
    if (decimalPlaces !== undefined) {
      formatted = num.toFixed(decimalPlaces);
    }
    
    // Apply thousands separator
    if (thousandsSeparator && Math.abs(num) >= 1000) {
      formatted = num.toLocaleString();
    }
    
    return formatted;
  };

  useEffect(() => {
    const numericValue = parseNumber(localValue);
    
    // Validate the parsed number
    let validation = validateCellValue(numericValue, column);
    
    // Additional number-specific validation
    if (validation.isValid && numericValue !== null) {
      if (min !== undefined && numericValue < min) {
        validation = { isValid: false, error: `Value must be at least ${min}` };
      } else if (max !== undefined && numericValue > max) {
        validation = { isValid: false, error: `Value must be at most ${max}` };
      }
    }
    
    setIsValid(validation.isValid);
    setError(validation.error || '');
  }, [localValue, column, min, max]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    
    const numericValue = parseNumber(newValue);
    onChange(numericValue);
  };

  const handleBlur = () => {
    // Format the number on blur for better UX
    const numericValue = parseNumber(localValue);
    if (numericValue !== null) {
      const formatted = formatNumber(numericValue);
      setLocalValue(formatted);
    }
  };

  const handleSave = () => {
    if (isValid) {
      onSave();
    }
  };

  const handleCancel = () => {
    const originalValue = value === null || value === undefined ? '' : String(value);
    setLocalValue(originalValue);
    onCancel();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (event.keyCode === 65 && event.ctrlKey === true) ||
        (event.keyCode === 67 && event.ctrlKey === true) ||
        (event.keyCode === 86 && event.ctrlKey === true) ||
        (event.keyCode === 88 && event.ctrlKey === true) ||
        // Allow: home, end, left, right, down, up
        (event.keyCode >= 35 && event.keyCode <= 40)) {
      return;
    }
    
    // Ensure that it is a number or decimal point and stop the keypress
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && 
        (event.keyCode < 96 || event.keyCode > 105) && 
        event.keyCode !== 190 && event.keyCode !== 110) {
      event.preventDefault();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <BaseCellEditor
      value={parseNumber(localValue)}
      column={column}
      onChange={onChange}
      onSave={handleSave}
      onCancel={handleCancel}
      isValid={isValid}
      error={error}
      autoFocus={autoFocus}
      className={className}
    >
      <Input
        type="text" // Use text to allow custom formatting
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={`Enter ${column.name.toLowerCase()}...`}
        min={min}
        max={max}
        step={step}
        className="w-full h-full border-none outline-none p-2 text-sm bg-transparent text-right"
      />
    </BaseCellEditor>
  );
};
