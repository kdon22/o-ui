/**
 * Settings Users - User Management
 * Auto-table integration with inline editing for user administration
 */

'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { AutoTable } from '@/components/auto-generated/table';

export function SettingsUsers() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Users
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage user accounts and access permissions
            </p>
          </div>
        </div>
      </div>

      {/* Content - AutoTable handles inline editing */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          resourceKey="user"
          customTitle="User Management"
          customSearchPlaceholder="Search users..."
        />
      </div>
    </div>
  );
}
