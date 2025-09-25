/**
 * Settings Workflows - Workflow Management
 * Auto-table integration with link to workflow builder
 */

'use client';

import React from 'react';
import { Workflow, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutoTable } from '@/components/auto-generated/table';

export function SettingsWorkflows() {
  const handleOpenBuilder = () => {
    // Navigate to workflow builder in full page
    window.location.href = '/workflows/builder';
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
              <Workflow className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Workflows</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Automated business processes</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleOpenBuilder}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Workflow Builder
          </Button>
        </div>
      </div>
      
      {/* Content - AutoTable handles inline editing */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          resourceKey="workflow"
          customTitle="Workflow Management"
          customSearchPlaceholder="Search workflows..."
          buttonVariant="black"
        />
      </div>
    </div>
  );
}