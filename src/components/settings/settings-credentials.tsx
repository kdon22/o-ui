/**
 * Settings Credentials - API Credentials Management  
 * Auto-table integration with inline editing for credential administration
 */

'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { AutoTable } from '@/components/auto-generated/table';

export function SettingsCredentials() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Credentials
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage API credentials and connections
            </p>
          </div>
        </div>
      </div>

      {/* Content - AutoTable handles inline editing */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          resourceKey="credential"
          customTitle="API Credentials"
          customSearchPlaceholder="Search credentials..."
        />
      </div>
    </div>
  );
}