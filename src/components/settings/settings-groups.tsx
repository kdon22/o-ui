/**
 * Settings Groups - Group Management with Three-Tab Interface
 * Auto-form integration with inline permission matrix editing
 */

'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { AutoTable } from '@/components/auto-generated/table';
import { GROUP_SCHEMA } from '@/features/groups/groups.schema';

export function SettingsGroups() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Groups
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage user groups and role-based permissions
            </p>
          </div>
        </div>
      </div>

      {/* Content - AutoTable handles inline editing with three-tab modal */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          resourceKey="group"
          customTitle="Group Management"
          customSearchPlaceholder="Search groups..."
          buttonVariant="blue"
          schema={GROUP_SCHEMA}
          
          // Enable inline editing with tabs
          inlineEdit={true}
          
          // Custom context menu actions
          contextActions={[
            {
              id: 'clone-permissions',
              label: 'Clone Permissions',
              icon: 'copy',
              type: 'handler',
              handler: 'cloneGroupPermissions'
            },
            {
              id: 'export-permissions', 
              label: 'Export Permissions',
              icon: 'download',
              type: 'handler',
              handler: 'exportGroupPermissions'
            }
          ]}
          
          // Custom field renderers
          customFieldRenderers={{
            // Render permission matrices in table cells as summary badges
            generalPermissions: (value: Record<string, string[]>) => (
              <div className="flex flex-wrap gap-1 max-w-xs">
                {Object.entries(value || {}).map(([resource, actions]) => (
                  actions.length > 0 && (
                    <span 
                      key={resource}
                      className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded text-xs font-medium"
                      title={`${resource}: ${actions.join(', ')}`}
                    >
                      {resource} ({actions.length})
                    </span>
                  )
                ))}
                {Object.keys(value || {}).length === 0 && (
                  <span className="text-gray-400 text-xs">No permissions</span>
                )}
              </div>
            ),
            
            settingPermissions: (value: Record<string, string[]>) => (
              <div className="flex flex-wrap gap-1 max-w-xs">
                {Object.entries(value || {}).map(([resource, actions]) => (
                  actions.length > 0 && (
                    <span 
                      key={resource}
                      className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded text-xs font-medium"
                      title={`${resource}: ${actions.join(', ')}`}
                    >
                      {resource} ({actions.length})
                    </span>
                  )
                ))}
                {Object.keys(value || {}).length === 0 && (
                  <span className="text-gray-400 text-xs">No permissions</span>
                )}
              </div>
            )
          }}
          
          // Summary stats
          summaryConfig={{
            showStats: true,
            customStats: [
              {
                label: 'Total Groups',
                key: 'total',
                icon: 'shield',
                color: 'blue'
              },
              {
                label: 'Active Groups',
                key: 'active',
                filter: { isActive: true },
                icon: 'check-circle',
                color: 'green'
              },
              {
                label: 'Admin Groups',
                key: 'admin',
                filter: { type: 'admin' },
                icon: 'crown',
                color: 'amber'
              }
            ]
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default SettingsGroups;
