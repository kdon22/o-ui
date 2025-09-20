/**
 * CellRenderer - Handles cell display and editing logic
 * 
 * Extracts cell rendering from AutoDataTable:
 * - Display mode for different data types
 * - Edit mode with appropriate input controls
 * - Type-specific formatting and validation
 * - Keyboard navigation support
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { ExternalLink, Mail } from 'lucide-react';
import type { TableColumn, CellValue } from '../types';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

const parseCurrency = (value: string): number => {
  // Remove currency symbols and parse
  const cleaned = value.replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const containsHTML = (text: string): boolean => {
  return /<[^>]*>/.test(text);
};

const sanitizeHTML = (html: string): string => {
  // Only allow safe HTML tags
  const allowedTags = ['b', 'i', 'strong', 'em', 'a', 'span', 'br'];
  const allowedRegex = new RegExp(`</?(?:${allowedTags.join('|')})(?:\\s[^>]*)?/?>`, 'gi');
  
  // Remove any tags not in the allowed list
  return html.replace(/<[^>]*>/g, (tag) => {
    return allowedRegex.test(tag) ? tag : '';
  });
};

export interface CellRendererProps {
  value: CellValue;
  column: TableColumn;
  isEditing: boolean;
  rowId: string;
  
  // Event handlers
  onValueChange: (rowId: string, columnName: string, newValue: any) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  
  // Input refs for focus management
  editInputRef?: React.RefObject<HTMLInputElement>;
  editSelectRef?: React.RefObject<HTMLSelectElement>;
}

export const CellRenderer: React.FC<CellRendererProps> = ({
  value,
  column,
  isEditing,
  rowId,
  onValueChange,
  onKeyDown,
  editInputRef,
  editSelectRef,
}) => {
  // ============================================================================
  // EDIT MODE RENDERING
  // ============================================================================

  if (isEditing) {
    const [validationError, setValidationError] = useState<string>('');

    switch (column.type) {
      case 'email':
        return (
          <div className="relative">
            <input
              ref={editInputRef}
              type="email"
              value={String(value || '')}
              onChange={(e) => {
                const emailValue = e.target.value;
                const isValid = !emailValue || validateEmail(emailValue);
                setValidationError(isValid ? '' : 'Invalid email address');
                onValueChange(rowId, column.name, emailValue);
              }}
              className={cn(
                "w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 rounded",
                validationError ? "focus:ring-red-500 text-red-600" : "focus:ring-blue-500"
              )}
              onKeyDown={onKeyDown}
              autoFocus
              placeholder="name@example.com"
            />
            {validationError && (
              <span className="absolute -bottom-4 left-0 text-xs text-red-500">{validationError}</span>
            )}
          </div>
        );

      case 'currency':
        return (
          <input
            ref={editInputRef}
            type="text"
            value={String(value || '')}
            onChange={(e) => {
              // Allow user to type freely, we'll format on blur
              onValueChange(rowId, column.name, e.target.value);
            }}
            onBlur={(e) => {
              // Format as currency when user leaves field
              const numValue = parseCurrency(e.target.value);
              onValueChange(rowId, column.name, numValue);
            }}
            className="w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            onKeyDown={onKeyDown}
            autoFocus
            placeholder="$0.00"
          />
        );

      case 'bool':
        return (
          <select
            ref={editSelectRef}
            value={value ? 'true' : 'false'}
            onChange={(e) => onValueChange(rowId, column.name, e.target.value === 'true')}
            className="w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            onKeyDown={onKeyDown}
            autoFocus
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      
      case 'int':
        return (
          <input
            ref={editInputRef}
            type="number"
            value={String(value || '')}
            onChange={(e) => onValueChange(rowId, column.name, Number(e.target.value))}
            className="w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            onKeyDown={onKeyDown}
            autoFocus
          />
        );
      
      case 'date':
        return (
          <input
            ref={editInputRef}
            type="date"
            value={String(value || '')}
            onChange={(e) => onValueChange(rowId, column.name, e.target.value)}
            className="w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            onKeyDown={onKeyDown}
            autoFocus
          />
        );
      
      case 'list':
        // For now, treat list as text input (could be enhanced later for multi-select)
        return (
          <input
            ref={editInputRef}
            type="text"
            value={Array.isArray(value) ? value.join(', ') : String(value || '')}
            onChange={(e) => {
              // Convert comma-separated string to array
              const arrayValue = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
              onValueChange(rowId, column.name, arrayValue);
            }}
            className="w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            onKeyDown={onKeyDown}
            autoFocus
            placeholder="item1, item2, item3"
          />
        );
      
      default: // 'str' - supports HTML
        return (
          <input
            ref={editInputRef}
            type="text"
            value={String(value || '')}
            onChange={(e) => onValueChange(rowId, column.name, e.target.value)}
            className="w-full h-8 px-2 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            onKeyDown={onKeyDown}
            autoFocus
            placeholder="Text or <b>bold</b> <i>italic</i>"
          />
        );
    }
  }

  // ============================================================================
  // DISPLAY MODE RENDERING
  // ============================================================================

  // Handle empty/null values → render blank cell (no placeholder)
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (column.type) {
    case 'email':
      const emailStr = String(value);
      const isValidEmailDisplay = validateEmail(emailStr);
      
      return (
        <div className="flex items-center gap-2">
          <a 
            href={`mailto:${emailStr}`}
            className={cn(
              "text-blue-600 hover:text-blue-800 underline",
              !isValidEmailDisplay && "text-red-500"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {emailStr}
          </a>
          {isValidEmailDisplay && <Mail className="w-3 h-3 text-gray-400" />}
        </div>
      );

    case 'currency':
      return (
        <span className="font-mono text-green-600 font-medium">
          {formatCurrency(Number(value) || 0)}
        </span>
      );

    case 'bool':
      return (
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
          value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {value ? 'true' : 'false'}
        </span>
      );
    
    case 'int':
      return <span className="font-mono">{Number(value).toLocaleString()}</span>;
    
    case 'date':
      try {
        return <span>{new Date(value as string).toLocaleDateString()}</span>;
      } catch {
        return <span className="text-red-500">Invalid date</span>;
      }
    
    case 'list':
      return (
        <span className="text-sm">
          {Array.isArray(value) ? value.join(', ') : String(value)}
        </span>
      );
    
    default: // 'str' - supports HTML rendering
      const textValue = String(value);
      
      if (containsHTML(textValue)) {
        // Render as HTML with sanitization
        return (
          <span 
            className="text-sm"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHTML(textValue) 
            }}
          />
        );
      } else {
        // Plain text
        return <span>{textValue}</span>;
      }
  }
};

// ============================================================================
// ENHANCED CELL RENDERER WITH MORE FEATURES
// ============================================================================

export interface EnhancedCellRendererProps extends CellRendererProps {
  // Additional props for enhanced features
  isRequired?: boolean;
  isValidationError?: boolean;
  validationMessage?: string;
  placeholder?: string;
  maxLength?: number;
  format?: 'currency' | 'percentage' | 'decimal' | 'phone' | 'email';
}

export const EnhancedCellRenderer: React.FC<EnhancedCellRendererProps> = ({
  value,
  column,
  isEditing,
  rowId,
  onValueChange,
  onKeyDown,
  editInputRef,
  editSelectRef,
  isRequired = false,
  isValidationError = false,
  validationMessage,
  placeholder,
  maxLength,
  format,
}) => {
  // For now, use the basic renderer
  // TODO: Implement enhanced features like validation, formatting, etc.
  return (
    <CellRenderer
      value={value}
      column={column}
      isEditing={isEditing}
      rowId={rowId}
      onValueChange={onValueChange}
      onKeyDown={onKeyDown}
      editInputRef={editInputRef}
      editSelectRef={editSelectRef}
    />
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get appropriate placeholder text for column type
 */
export const getPlaceholderForColumn = (column: TableColumn): string => {
  switch (column.type) {
    case 'str':
      return 'Enter text...';
    case 'int':
      return '0';
    case 'bool':
      return 'true/false';
    case 'date':
      return 'YYYY-MM-DD';
    case 'list':
      return 'item1, item2, item3';
    default:
      return 'Enter value...';
  }
};

/**
 * Validate cell value based on column type and constraints
 */
export const validateCellValue = (
  value: CellValue,
  column: TableColumn
): { isValid: boolean; message?: string } => {
  // Required field validation
  if (column.required && (value === null || value === undefined || value === '')) {
    return { isValid: false, message: `${column.name} is required` };
  }

  // Type-specific validation
  switch (column.type) {
    case 'email':
      if (value && typeof value === 'string' && !validateEmail(value)) {
        return { isValid: false, message: 'Must be a valid email address' };
      }
      break;
      
    case 'currency':
      if (value !== null && value !== undefined && value !== '') {
        const num = typeof value === 'string' ? parseCurrency(value) : Number(value);
        if (isNaN(num)) {
          return { isValid: false, message: 'Must be a valid currency amount' };
        }
      }
      break;
      
    case 'int':
      if (value !== null && value !== undefined && value !== '' && isNaN(Number(value))) {
        return { isValid: false, message: 'Must be a valid number' };
      }
      break;
      
    case 'date':
      if (value && typeof value === 'string') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { isValid: false, message: 'Must be a valid date' };
        }
      }
      break;
      
    case 'list':
      // Lists are always valid for now
      break;
      
    case 'bool':
      if (value !== null && value !== undefined && typeof value !== 'boolean') {
        return { isValid: false, message: 'Must be true or false' };
      }
      break;
      
    default: // 'str'
      // String validation - check for malicious HTML
      if (value && typeof value === 'string' && containsHTML(value)) {
        const sanitized = sanitizeHTML(value);
        if (sanitized !== value) {
          return { isValid: false, message: 'Contains unsafe HTML tags' };
        }
      }
      break;
  }

  return { isValid: true };
};

/**
 * Format cell value for display
 */
export const formatCellValue = (
  value: CellValue,
  column: TableColumn,
  format?: string
): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  switch (column.type) {
    case 'int':
      const num = Number(value);
      if (format === 'currency') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(num);
      }
      if (format === 'percentage') {
        return `${(num * 100).toFixed(2)}%`;
      }
      return num.toLocaleString();
    
    case 'date':
      if (typeof value === 'string') {
        try {
          const date = new Date(value);
          return date.toLocaleDateString();
        } catch {
          return String(value);
        }
      }
      return String(value);
    
    case 'list':
      return Array.isArray(value) ? value.join(', ') : String(value);
    
    case 'bool':
      return value ? 'true' : 'false';
    
    default:
      return String(value);
  }
};
