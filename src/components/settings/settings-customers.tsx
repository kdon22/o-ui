/**
 * Settings Customers - Customer Management
 * Auto-table integration with inline editing for customer administration
 */

'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { AutoTable } from '@/components/auto-generated/table';

export function SettingsCustomers() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Customers
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage customer accounts and profiles
            </p>
          </div>
        </div>
      </div>

      {/* Content - AutoTable handles inline editing */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          resourceKey="user"
          customTitle="Customer Management"
          customSearchPlaceholder="Search customers..."
        />
      </div>
    </div>
  );
}