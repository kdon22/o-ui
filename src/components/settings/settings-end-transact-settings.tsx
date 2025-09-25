/**
 * Settings End Transact Settings - Transaction Configuration
 * Auto-table integration with inline editing for end transact settings (Server-only)
 */

'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { AutoTable } from '@/components/auto-generated/table';

export function SettingsEndTransactSettings() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
            <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              End Transact Settings
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure transaction completion and finalization
            </p>
          </div>
        </div>
      </div>

      {/* Content - AutoTable handles inline editing */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          resourceKey="endTransactSettings"
          customTitle="Transaction Completion Settings"
          customSearchPlaceholder="Search transaction settings..."
        />
      </div>
    </div>
  );
}