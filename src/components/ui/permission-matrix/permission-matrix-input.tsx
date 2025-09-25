/**
 * Permission Matrix Input - Factory-Driven Checkbox Matrix
 * 
 * Renders a beautiful permission matrix using configurable templates.
 * Supports the interface shown in the user's screenshot:
 * - Tabbed sections (General Rights, Setting Rights)
 * - Resource vs Actions checkbox grid
 * - Select all functionality
 * - Clean, professional styling
 */

"use client";

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Settings, CheckSquare, Square, Info } from 'lucide-react';
import { getPermissionTemplate, type PermissionTemplateId } from '@/lib/resource-system/permission-templates';
import type { FieldInputProps } from '@/lib/resource-system/field-registry';

// ============================================================================
// PERMISSION MATRIX INTERFACES
// ============================================================================

interface PermissionMatrixData {
  general?: Record<string, string[]>;
  settings?: Record<string, string[]>;
  [sectionId: string]: Record<string, string[]> | undefined;
}

export interface PermissionMatrixInputProps extends FieldInputProps {
  templateId?: PermissionTemplateId;
}

// ============================================================================
// PERMISSION MATRIX INPUT COMPONENT
// ============================================================================

export const PermissionMatrixInput: React.FC<PermissionMatrixInputProps> = ({
  value = {},
  onChange,
  field,
  error,
  disabled = false,
  className = '',
  templateId = 'system-permissions' // Default to system permissions template
}) => {
  const template = useMemo(() => getPermissionTemplate(templateId), [templateId]);
  const [activeTab, setActiveTab] = useState(template.sections[0]?.id || '');

  // Ensure value is an object with correct structure
  const permissions: PermissionMatrixData = useMemo(() => {
    if (!value || typeof value !== 'object') {
      // Initialize empty permissions structure based on template
      const emptyPermissions: PermissionMatrixData = {};
      template.sections.forEach(section => {
        emptyPermissions[section.id] = {};
      });
      return emptyPermissions;
    }
    return value;
  }, [value, template]);

  // ============================================================================
  // PERMISSION STATE MANAGEMENT
  // ============================================================================

  const updatePermissions = (sectionId: string, resourceId: string, actionId: string, checked: boolean) => {
    const newPermissions = { ...permissions };
    
    if (!newPermissions[sectionId]) {
      newPermissions[sectionId] = {};
    }

    if (!newPermissions[sectionId][resourceId]) {
      newPermissions[sectionId][resourceId] = [];
    }

    const currentActions = [...(newPermissions[sectionId][resourceId] || [])];
    
    if (checked) {
      if (!currentActions.includes(actionId)) {
        currentActions.push(actionId);
      }
    } else {
      const index = currentActions.indexOf(actionId);
      if (index > -1) {
        currentActions.splice(index, 1);
      }
    }

    newPermissions[sectionId][resourceId] = currentActions;
    onChange(newPermissions);
  };

  const selectAllForResource = (sectionId: string, resourceId: string, checked: boolean) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return;

    const newPermissions = { ...permissions };
    if (!newPermissions[sectionId]) {
      newPermissions[sectionId] = {};
    }

    if (checked) {
      newPermissions[sectionId][resourceId] = section.actions.map(a => a.id);
    } else {
      newPermissions[sectionId][resourceId] = [];
    }

    onChange(newPermissions);
  };

  const selectAllForSection = (sectionId: string, checked: boolean) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return;

    const newPermissions = { ...permissions };
    if (!newPermissions[sectionId]) {
      newPermissions[sectionId] = {};
    }

    section.resources.forEach(resource => {
      if (checked) {
        newPermissions[sectionId][resource.id] = section.actions.map(a => a.id);
      } else {
        newPermissions[sectionId][resource.id] = [];
      }
    });

    onChange(newPermissions);
  };

  // ============================================================================
  // PERMISSION STATE HELPERS
  // ============================================================================

  const isPermissionChecked = (sectionId: string, resourceId: string, actionId: string): boolean => {
    return permissions[sectionId]?.[resourceId]?.includes(actionId) || false;
  };

  const isResourceFullySelected = (sectionId: string, resourceId: string): boolean => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return false;

    const resourcePermissions = permissions[sectionId]?.[resourceId] || [];
    return section.actions.every(action => resourcePermissions.includes(action.id));
  };

  const isResourcePartiallySelected = (sectionId: string, resourceId: string): boolean => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return false;

    const resourcePermissions = permissions[sectionId]?.[resourceId] || [];
    return resourcePermissions.length > 0 && resourcePermissions.length < section.actions.length;
  };

  const isSectionFullySelected = (sectionId: string): boolean => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return false;

    return section.resources.every(resource => isResourceFullySelected(sectionId, resource.id));
  };

  const isSectionPartiallySelected = (sectionId: string): boolean => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return false;

    return section.resources.some(resource => {
      const resourcePermissions = permissions[sectionId]?.[resource.id] || [];
      return resourcePermissions.length > 0;
    }) && !isSectionFullySelected(sectionId);
  };

  // ============================================================================
  // RENDER SECTION CONTENT
  // ============================================================================

  const renderSectionMatrix = (section: any) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {section.id === 'general' ? <Shield className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
            <CardTitle className="text-lg">{section.label}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => selectAllForSection(section.id, !isSectionFullySelected(section.id))}
              disabled={disabled}
            >
              {isSectionFullySelected(section.id) ? (
                <>
                  <Square className="h-3 w-3 mr-1" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Select All
                </>
              )}
            </Button>
            <Badge variant="secondary">
              {section.resources.reduce((count: number, resource: any) => {
                const resourcePermissions = permissions[section.id]?.[resource.id] || [];
                return count + resourcePermissions.length;
              }, 0)} permissions
            </Badge>
          </div>
        </div>
        {section.description && (
          <CardDescription className="flex items-center gap-2">
            <Info className="h-3 w-3" />
            {section.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-900 bg-gray-50">
                  Resource
                </th>
                {section.actions.map((action: any) => (
                  <th key={action.id} className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50 min-w-[80px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className={action.dangerous ? 'text-red-600' : ''}>{action.label}</span>
                      {action.dangerous && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          Dangerous
                        </Badge>
                      )}
                    </div>
                  </th>
                ))}
                <th className="text-center py-3 px-4 font-medium text-gray-900 bg-gray-50">
                  All
                </th>
              </tr>
            </thead>
            <tbody>
              {section.resources.map((resource: any) => (
                <tr key={resource.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{resource.label}</span>
                      {resource.description && (
                        <span className="text-sm text-gray-500">{resource.description}</span>
                      )}
                    </div>
                  </td>
                  {section.actions.map((action: any) => (
                    <td key={`${resource.id}-${action.id}`} className="text-center py-3 px-4">
                      <Checkbox
                        checked={isPermissionChecked(section.id, resource.id, action.id)}
                        onCheckedChange={(checked: boolean) =>
                          updatePermissions(section.id, resource.id, action.id, checked)
                        }
                        disabled={disabled}
                        aria-label={`${resource.label} - ${action.label}`}
                      />
                    </td>
                  ))}
                  <td className="text-center py-3 px-4">
                    <Checkbox
                      checked={isResourceFullySelected(section.id, resource.id)}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = isResourcePartiallySelected(section.id, resource.id);
                        }
                      }}
                      onCheckedChange={(checked: boolean) =>
                        selectAllForResource(section.id, resource.id, checked)
                      }
                      disabled={disabled}
                      aria-label={`Select all permissions for ${resource.label}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={`permission-matrix-input ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {template.sections.map(section => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="flex items-center gap-2"
            >
              {section.id === 'general' ? <Shield className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
              {section.label}
              {isSectionPartiallySelected(section.id) && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                  Partial
                </Badge>
              )}
              {isSectionFullySelected(section.id) && (
                <Badge variant="default" className="ml-1 px-1 py-0 text-xs">
                  Full
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {template.sections.map(section => (
          <TabsContent key={section.id} value={section.id} className="mt-4">
            {renderSectionMatrix(section)}
          </TabsContent>
        ))}
      </Tabs>

      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <Info className="h-3 w-3" />
          {error}
        </div>
      )}

      {/* Debug info (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <pre className="mt-2 overflow-auto">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

// ============================================================================
// PERMISSION MATRIX DISPLAY COMPONENT
// ============================================================================

export interface PermissionMatrixDisplayProps {
  value: any;
  field: any;
  className?: string;
}

export const PermissionMatrixDisplay: React.FC<PermissionMatrixDisplayProps> = ({
  value,
  className = ''
}) => {
  const permissions: PermissionMatrixData = value || {};
  
  const totalPermissions = Object.values(permissions).reduce((total, section) => {
    if (!section || typeof section !== 'object') return total;
    return total + Object.values(section).reduce((sectionTotal, actions) => {
      return sectionTotal + (Array.isArray(actions) ? actions.length : 0);
    }, 0);
  }, 0);

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {totalPermissions > 0 ? (
        <>
          {Object.entries(permissions).map(([sectionId, section]) => {
            if (!section || typeof section !== 'object') return null;
            
            const sectionPermissionCount = Object.values(section).reduce((count, actions) => {
              return count + (Array.isArray(actions) ? actions.length : 0);
            }, 0);

            if (sectionPermissionCount === 0) return null;

            return (
              <Badge
                key={sectionId}
                variant={sectionId === 'general' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {sectionId === 'general' ? (
                  <Shield className="h-3 w-3 mr-1" />
                ) : (
                  <Settings className="h-3 w-3 mr-1" />
                )}
                {sectionId} ({sectionPermissionCount})
              </Badge>
            );
          })}
          <Badge variant="outline" className="text-xs">
            Total: {totalPermissions}
          </Badge>
        </>
      ) : (
        <span className="text-gray-400 text-sm">No permissions set</span>
      )}
    </div>
  );
};
