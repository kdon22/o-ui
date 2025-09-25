/**
 * Settings Hit Settings - Hit Configuration
 * Auto-table integration with inline editing for hit settings (Server-only)
 */

'use client';

import React from 'react';
import { Target } from 'lucide-react';
import { AutoTable } from '@/components/auto-generated/table';

export function SettingsHitSettings() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
            <Target className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Hit Settings
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure system hit detection and processing
            </p>
          </div>
        </div>
      </div>

      {/* Content - AutoTable handles inline editing */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          resourceKey="hitSettings"
          customTitle="Hit Detection Settings"
          customSearchPlaceholder="Search hit settings..."
          buttonVariant="black"
        />
      </div>
    </div>
  );
}