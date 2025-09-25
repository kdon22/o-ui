/**
 * Permission Matrix Component
 * 
 * Renders a clean table-based permission matrix like the competitor interface
 * with View/Create/Modify/Delete checkboxes for each resource.
 */

'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PermissionMatrixProps {
  value?: Record<string, string[]>; // e.g., { "Users": ["view", "create"], "Groups": ["view"] }
  onChange?: (value: Record<string, string[]>) => void;
  permissions?: Array<{
    resource: string;
    actions: string[]; // ["View", "Create", "Modify", "Delete"]
  }>;
  disabled?: boolean;
  className?: string;
}

export function PermissionMatrix({ 
  value = {}, 
  onChange, 
  permissions = [], 
  disabled = false,
  className = '' 
}: PermissionMatrixProps) {
  
  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    if (!onChange || disabled) return;
    
    const currentPermissions = value[resource] || [];
    const actionKey = action.toLowerCase();
    
    let newPermissions: string[];
    if (checked) {
      newPermissions = [...currentPermissions, actionKey];
    } else {
      newPermissions = currentPermissions.filter(p => p !== actionKey);
    }
    
    onChange({
      ...value,
      [resource]: newPermissions
    });
  };

  const isPermissionChecked = (resource: string, action: string): boolean => {
    const resourcePermissions = value[resource] || [];
    return resourcePermissions.includes(action.toLowerCase());
  };

  if (permissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No permissions configured
      </div>
    );
  }

  return (
    <div className={`permission-matrix ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-5 gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="text-left">Resource</div>
          <div className="text-center">View</div>
          <div className="text-center">Create</div>
          <div className="text-center">Modify</div>
          <div className="text-center">Delete</div>
        </div>
      </div>

      {/* Permission Rows */}
      <div className="border-l border-r border-b border-gray-200 dark:border-gray-700 rounded-b-lg">
        {permissions.map((permission, index) => (
          <div 
            key={permission.resource}
            className={`grid grid-cols-5 gap-4 px-4 py-4 border-gray-200 dark:border-gray-700 ${
              index < permissions.length - 1 ? 'border-b' : ''
            } ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'} hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors`}
          >
            {/* Resource Name */}
            <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
              {permission.resource}
            </div>

            {/* Permission Checkboxes */}
            {permission.actions.map(action => (
              <div key={action} className="flex items-center justify-center">
                <Checkbox
                  id={`${permission.resource}-${action}`}
                  checked={isPermissionChecked(permission.resource, action)}
                  onCheckedChange={(checked) => 
                    handlePermissionChange(permission.resource, action, checked as boolean)
                  }
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label 
                  htmlFor={`${permission.resource}-${action}`}
                  className="sr-only"
                >
                  {action} permission for {permission.resource}
                </Label>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        {Object.keys(value).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(value).map(([resource, actions]) => (
              actions.length > 0 && (
                <span 
                  key={resource}
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium"
                >
                  {resource}: {actions.join(', ')}
                </span>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FORM INTEGRATION COMPONENT
// ============================================================================

interface PermissionMatrixInputProps extends PermissionMatrixProps {
  field?: {
    value: any;
    onChange: (value: any) => void;
  };
  fieldSchema?: {
    options?: {
      permissions?: Array<{
        resource: string;
        actions: string[];
      }>;
    };
  };
}

export function PermissionMatrixInput({ 
  field,
  fieldSchema,
  ...props 
}: PermissionMatrixInputProps) {
  const permissions = fieldSchema?.options?.permissions || props.permissions || [];
  
  return (
    <PermissionMatrix
      {...props}
      value={field?.value || props.value}
      onChange={field?.onChange || props.onChange}
      permissions={permissions}
    />
  );
}

// ============================================================================
// PRESET PERMISSION CONFIGURATIONS
// ============================================================================

export const GENERAL_PERMISSIONS = [
  { resource: 'Users', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Groups', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Categories', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Business Units', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Customers', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Queue Tree', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Default Node', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Processes', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Intersections', actions: ['View', 'Create', 'Modify', 'Delete'] }
];

export const SETTING_PERMISSIONS = [
  { resource: 'System Configuration', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Security Settings', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Email Templates', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Workflow Settings', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Integration Settings', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Backup Configuration', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'Audit Logs', actions: ['View', 'Create', 'Modify', 'Delete'] },
  { resource: 'License Management', actions: ['View', 'Create', 'Modify', 'Delete'] }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getPermissionLabel(action: string): string {
  const labels: Record<string, string> = {
    view: 'View',
    create: 'Create', 
    modify: 'Modify',
    update: 'Modify', // Alias
    delete: 'Delete',
    manage: 'Manage'
  };
  
  return labels[action.toLowerCase()] || action;
}

export function normalizePermissionValue(value: any): Record<string, string[]> {
  if (!value || typeof value !== 'object') return {};
  return value;
}
