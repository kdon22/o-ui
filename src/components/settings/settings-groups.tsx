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
        />
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default SettingsGroups;
