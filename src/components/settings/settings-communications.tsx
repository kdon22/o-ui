/**
 * Settings Communications - Communication Configuration
 * Auto-table integration with inline editing for communication settings (Server-only)
 */

'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { AutoTable } from '@/components/auto-generated/table';

export function SettingsCommunications() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Communications
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure email, SMS, and notification channels
            </p>
          </div>
        </div>
      </div>

      {/* Content - AutoTable handles inline editing */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          resourceKey="communication"
          customTitle="Communication Settings"
          customSearchPlaceholder="Search communication settings..."
        />
      </div>
    </div>
  );
}