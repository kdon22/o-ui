/**
 * Settings Runtime Notifications - Notification Configuration
 * Auto-table integration with inline editing for runtime notification settings (Server-only)
 */

'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { AutoTable } from '@/components/auto-generated/table';

export function SettingsRuntimeNotifications() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Runtime Notifications
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure real-time system notifications and alerts
            </p>
          </div>
        </div>
      </div>

      {/* Content - AutoTable handles inline editing */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          resourceKey="runtimeNotifications"
          customTitle="Runtime Notification Settings"
          customSearchPlaceholder="Search notification settings..."
        />
      </div>
    </div>
  );
}