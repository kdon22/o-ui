/**
 * Settings Workflows - Workflow Management
 * Auto-table integration with link to workflow builder
 */

'use client';

import React from 'react';
import { Workflow, ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AutoTable } from '@/components/auto-generated/table';
import { HeaderActions } from '@/components/auto-generated/table/header-actions';
import { useRouter } from 'next/navigation';

export function SettingsWorkflows() {
  const router = useRouter();

  const handleOpenBuilder = () => {
    // Navigate to workflow builder in full page
    router.push('/workflows/builder');
  };

  // Handle row clicks to navigate to workflow builder for editing
  const handleRowClick = (workflow: any) => {
    router.push(`/workflows/builder?id=${workflow.id}`);
  };

  // Header actions function that customizes the Add button to open workflow builder
  const headerActions = (handleAdd: () => void) => {
    return (
      <HeaderActions
        actions={[
          {
            label: 'Create Workflow',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => router.push('/workflows/builder'),
            variant: 'primary'
          }
        ]}
      />
    );
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
      
      {/* Content - AutoTable with workflow builder integration */}
      <div className="flex-1 overflow-hidden">
        <AutoTable
          resourceKey="workflow"
          onRowClick={handleRowClick}
          headerActions={headerActions}
          customTitle="Workflow Management"
          customSearchPlaceholder="Search workflows..."
          buttonVariant="black"
        />
      </div>
    </div>
  );
}