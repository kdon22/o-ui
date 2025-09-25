/**
 * Enhanced JSON Input - Smart Field Detection
 * 
 * Automatically detects the type of JSON data and renders appropriate UI:
 * - Permission data → Permission Matrix Interface
 * - Regular JSON → Code editor or textarea
 * - Invalid JSON → Error handling
 */

"use client";

import React, { useMemo } from 'react';
import { PermissionMatrixInput } from '@/components/ui/permission-matrix/permission-matrix-input';
import type { FieldInputProps } from '@/lib/resource-system/field-registry';

// ============================================================================
// JSON DATA TYPE DETECTION
// ============================================================================

/**
 * Detect if JSON data represents permissions
 */
function isPermissionData(value: any, field: any): boolean {
  // Check field description for permission template keywords
  if (field?.description?.toLowerCase().includes('permission')) {
    return true;
  }

  // Check if value structure matches permission template format
  if (!value || typeof value !== 'object') {
    return false;
  }

  // Look for permission-like structure
  const hasPermissionStructure = Object.values(value).every(section => {
    if (!section || typeof section !== 'object') return false;
    return Object.values(section).every(actions => Array.isArray(actions));
  });

  return hasPermissionStructure;
}

// ============================================================================
// ENHANCED JSON INPUT COMPONENT
// ============================================================================

export const EnhancedJsonInput: React.FC<FieldInputProps> = (props) => {
  const { value, field } = props;

  // Detect data type and choose appropriate renderer
  const dataType = useMemo(() => {
    if (isPermissionData(value, field)) {
      return 'permissions';
    }
    return 'json';
  }, [value, field]);

  // ============================================================================
  // RENDER APPROPRIATE COMPONENT
  // ============================================================================

  if (dataType === 'permissions') {
    return (
      <PermissionMatrixInput 
        {...props}
        templateId="system-permissions"
      />
    );
  }

  // Fallback to basic JSON textarea for other data types
  return <BasicJsonTextarea {...props} />;
};

// ============================================================================
// BASIC JSON TEXTAREA (Fallback)
// ============================================================================

const BasicJsonTextarea: React.FC<FieldInputProps> = ({
  value = {},
  onChange,
  field,
  error,
  disabled = false,
  className = ''
}) => {
  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return typeof value === 'string' ? value : '';
    }
  }, [value]);

  const handleChange = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      onChange(parsed);
    } catch {
      // If invalid JSON, store as string
      onChange(jsonText);
    }
  };

  return (
    <div className="json-input-wrapper">
      <textarea
        value={jsonString}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={field.placeholder || 'Enter JSON data...'}
        disabled={disabled}
        rows={8}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md resize-vertical font-mono text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
      />
      {field.description && (
        <div className="mt-1 text-xs text-gray-500">
          {field.description}
        </div>
      )}
      {error && (
        <div className="text-red-500 text-sm mt-1">{error}</div>
      )}
    </div>
  );
};
