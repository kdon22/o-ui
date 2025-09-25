'use client';

import React from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';

// ============================================================================
// MATRIX FIELD TYPES
// ============================================================================

export interface MatrixSection {
  id: string;
  label: string;
  resources: Array<{
    key: string;
    label: string;
    description?: string;
  }>;
  actions: Array<{
    key: string;
    label: string;
    description?: string;
  }>;
}

export interface MatrixFieldConfig {
  sections: MatrixSection[];
  layout?: 'tabs' | 'accordion' | 'stacked';
  showHeaders?: boolean;
  compact?: boolean;
}

export interface MatrixFieldProps {
  value: Record<string, string[]>; // e.g., { "users": ["view", "create"], "groups": ["view"] }
  onChange: (value: Record<string, string[]>) => void;
  config: MatrixFieldConfig;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// MATRIX FIELD COMPONENT
// ============================================================================

export const MatrixField: React.FC<MatrixFieldProps> = ({
  value = {},
  onChange,
  config,
  placeholder,
  disabled = false,
  className
}) => {
  // Handle checkbox changes
  const handleCheckboxChange = (resourceKey: string, actionKey: string, checked: boolean) => {
    const currentPermissions = value[resourceKey] || [];
    
    let updatedPermissions: string[];
    if (checked) {
      // Add permission if not already present
      updatedPermissions = currentPermissions.includes(actionKey) 
        ? currentPermissions 
        : [...currentPermissions, actionKey];
    } else {
      // Remove permission
      updatedPermissions = currentPermissions.filter(p => p !== actionKey);
    }
    
    onChange({
      ...value,
      [resourceKey]: updatedPermissions
    });
  };

  // Check if a permission is selected
  const isChecked = (resourceKey: string, actionKey: string): boolean => {
    return (value[resourceKey] || []).includes(actionKey);
  };

  // Render a single matrix section
  const renderMatrixSection = (section: MatrixSection) => (
    <div key={section.id} className="space-y-4">
      {config.showHeaders !== false && (
        <div className="border-b pb-2">
          <h3 className="text-sm font-medium text-gray-900">{section.label}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
              </th>
              {section.actions.map((action) => (
                <th 
                  key={action.key} 
                  className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  title={action.description}
                >
                  {action.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {section.resources.map((resource) => (
              <tr key={resource.key} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm font-medium text-gray-900" title={resource.description}>
                  {resource.label}
                </td>
                {section.actions.map((action) => (
                  <td key={action.key} className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked(resource.key, action.key)}
                      onChange={(e) => handleCheckboxChange(resource.key, action.key, e.target.checked)}
                      disabled={disabled}
                      className={cn(
                        "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render based on layout
  if (config.layout === 'tabs' && config.sections.length > 1) {
    return (
      <div className={cn("w-full", className)}>
        <Tabs defaultValue={config.sections[0]?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {config.sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id} className="text-xs">
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {config.sections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-4">
              {renderMatrixSection(section)}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }

  // Default stacked layout
  return (
    <div className={cn("space-y-6", className)}>
      {config.sections.map((section) => renderMatrixSection(section))}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS FOR SCHEMA INTEGRATION
// ============================================================================

/**
 * Create a permission matrix configuration from schema data
 */
export const createPermissionMatrixConfig = (sections: Array<{
  id: string;
  label: string;
  resources: string[] | Array<{key: string; label: string}>;
  actions: string[] | Array<{key: string; label: string}>;
}>): MatrixFieldConfig => ({
  sections: sections.map(section => ({
    id: section.id,
    label: section.label,
    resources: Array.isArray(section.resources) 
      ? section.resources.map(r => typeof r === 'string' ? { key: r.toLowerCase(), label: r } : r)
      : [],
    actions: Array.isArray(section.actions)
      ? section.actions.map(a => typeof a === 'string' ? { key: a.toLowerCase(), label: a } : a)
      : []
  })),
  layout: 'tabs',
  showHeaders: true,
  compact: false
});

/**
 * Extract default values from matrix configuration
 */
export const getMatrixDefaultValues = (config: MatrixFieldConfig): Record<string, string[]> => {
  const defaultValues: Record<string, string[]> = {};
  
  config.sections.forEach(section => {
    section.resources.forEach(resource => {
      defaultValues[resource.key] = [];
    });
  });
  
  return defaultValues;
};
