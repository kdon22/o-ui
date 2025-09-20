/**
 * Date Cell Editor - Editor for date/datetime values
 * 
 * Features:
 * - Date picker input
 * - Time support (optional)
 * - Min/max date constraints
 * - Multiple format support
 * - Timezone handling
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
import { DateCellEditorProps } from '../types';

export const DateCellEditor: React.FC<DateCellEditorProps> = ({
  value,
  column,
  onChange,
  onSave,
  onCancel,
  minDate,
  maxDate,
  showTime = false,
  format = 'YYYY-MM-DD',
  autoFocus = true,
  className
}) => {
  // Initialize local value
  const [localValue, setLocalValue] = useState<string>(() => {
    if (!value) return '';
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';
      
      if (showTime) {
        // Format for datetime-local input
        return date.toISOString().slice(0, 16);
      } else {
        // Format for date input (YYYY-MM-DD)
        return date.toISOString().split('T')[0];
      }
    } catch {
      return '';
    }
  });

  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>('');

  // ============================================================================
  // VALIDATION & PARSING
  // ============================================================================

  const parseDate = (input: string): Date | null => {
    if (!input || input.trim() === '') return null;
    
    try {
      const date = new Date(input);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const formatDateForInput = (date: Date): string => {
    if (showTime) {
      return date.toISOString().slice(0, 16);
    } else {
      return date.toISOString().split('T')[0];
    }
  };

  useEffect(() => {
    const dateValue = parseDate(localValue);
    
    // Validate the parsed date
    let validation = validateCellValue(
      dateValue ? dateValue.toISOString() : null, 
      column
    );
    
    // Additional date-specific validation
    if (validation.isValid && dateValue) {
      if (minDate && dateValue < minDate) {
        validation = { 
          isValid: false, 
          error: `Date must be on or after ${formatDateForInput(minDate)}` 
        };
      } else if (maxDate && dateValue > maxDate) {
        validation = { 
          isValid: false, 
          error: `Date must be on or before ${formatDateForInput(maxDate)}` 
        };
      }
    }
    
    setIsValid(validation.isValid);
    setError(validation.error || '');
  }, [localValue, column, minDate, maxDate, showTime]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    
    const dateValue = parseDate(newValue);
    const isoString = dateValue ? dateValue.toISOString() : null;
    onChange(isoString);
  };

  const handleSave = () => {
    if (isValid) {
      onSave();
    }
  };

  const handleCancel = () => {
    // Reset to original value
    if (!value) {
      setLocalValue('');
    } else {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setLocalValue(formatDateForInput(date));
        } else {
          setLocalValue('');
        }
      } catch {
        setLocalValue('');
      }
    }
    onCancel();
  };

  const handleToday = () => {
    const today = new Date();
    const formattedToday = formatDateForInput(today);
    handleChange(formattedToday);
  };

  const handleClear = () => {
    handleChange('');
  };

  // ============================================================================
  // FORMAT CONSTRAINTS
  // ============================================================================

  const getInputConstraints = () => {
    const constraints: any = {};
    
    if (minDate) {
      constraints.min = formatDateForInput(minDate);
    }
    
    if (maxDate) {
      constraints.max = formatDateForInput(maxDate);
    }
    
    return constraints;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <BaseCellEditor
      value={parseDate(localValue)}
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
          type={showTime ? 'datetime-local' : 'date'}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={showTime ? 'Select date and time...' : 'Select date...'}
          className="flex-1 border-none outline-none p-2 text-sm bg-transparent"
          {...getInputConstraints()}
        />
        
        {/* Quick action buttons */}
        <div className="flex items-center space-x-1 px-2">
          {!localValue && (
            <button
              onClick={handleToday}
              className="text-xs text-blue-600 hover:text-blue-800 px-1 py-0.5 rounded hover:bg-blue-50"
              title="Set to today"
            >
              Today
            </button>
          )}
          
          {localValue && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-red-600 px-1 py-0.5 rounded hover:bg-red-50"
              title="Clear date"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </BaseCellEditor>
  );
};
