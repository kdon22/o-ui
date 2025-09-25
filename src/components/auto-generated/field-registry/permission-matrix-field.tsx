/**
 * Permission Matrix Field - Custom Field Integration for Auto-Form
 * 
 * Integrates the PermissionMatrix component into the auto-form system
 * for seamless use with the schema-driven forms.
 */

'use client';

import React from 'react';
import { PermissionMatrixInput } from '@/components/ui/permission-matrix';
import type { FieldSchema } from '@/lib/resource-system/schemas';

interface PermissionMatrixFieldProps {
  field: {
    name: string;
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
  };
  fieldSchema: FieldSchema;
  disabled?: boolean;
  className?: string;
}

export function PermissionMatrixField({
  field,
  fieldSchema,
  disabled = false,
  className = ''
}: PermissionMatrixFieldProps) {
  return (
    <div className={`permission-matrix-field ${className}`}>
      {/* Field Label and Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {fieldSchema.label}
          {fieldSchema.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        {fieldSchema.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {fieldSchema.description}
          </p>
        )}
      </div>

      {/* Permission Matrix Component */}
      <PermissionMatrixInput
        field={field}
        fieldSchema={fieldSchema}
        disabled={disabled}
        className="rounded-lg"
      />

      {/* Validation Error Display */}
      {field.name && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          {/* Error messages would be handled by the form validation system */}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FIELD REGISTRATION - Register with the field system
// ============================================================================

export const PERMISSION_MATRIX_FIELD_CONFIG = {
  type: 'permission-matrix',
  component: PermissionMatrixField,
  displayComponent: ({ value, fieldSchema }: { value: any; fieldSchema: FieldSchema }) => {
    const permissions = fieldSchema.options?.permissions || [];
    const permissionCount = Object.keys(value || {}).length;
    
    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(value || {}).map(([resource, actions]: [string, string[]]) => (
          actions.length > 0 && (
            <span 
              key={resource}
              className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium"
            >
              {resource} ({actions.length})
            </span>
          )
        ))}
        {permissionCount === 0 && (
          <span className="text-gray-400 text-xs italic">No permissions set</span>
        )}
      </div>
    );
  }
};

// Export for external registration
export default PERMISSION_MATRIX_FIELD_CONFIG;
