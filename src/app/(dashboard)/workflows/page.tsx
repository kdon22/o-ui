/**
 * Workflows Page - Auto-Generated Table Implementation
 * 
 * Uses the SSOT action system with AutoTable component for:
 * - Branch-aware data fetching 
 * - Full CRUD operations
 * - Tenant/branch scoping with workflow.list action
 * - Mobile-first responsive design
 * - Inline forms and bulk actions
 */

'use client';

import { AutoTable } from '@/components/auto-generated/table';
import { HeaderActions } from '@/components/auto-generated/table/header-actions';
import { useRouter } from 'next/navigation';
import { Plus, Upload } from 'lucide-react';

export default function WorkflowsPage() {
  const router = useRouter();

  // Handle row clicks to navigate to workflow builder
  const handleRowClick = (workflow: any) => {
    router.push(`/workflows/builder?id=${workflow.id}`);
  };

  // Header actions function that creates proper React components
  const headerActions = (handleAdd: () => void) => {
    return (
      <HeaderActions
        actions={[
          {
            label: 'Create Workflow',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => router.push('/workflows/builder'),
            variant: 'primary'
          },
          {
            label: 'Import',
            icon: <Upload className="w-4 h-4" />,
            onClick: () => console.log('Import workflows'),
            variant: 'secondary'
          }
        ]}
      />
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Page Header */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Workflows</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and organize your business workflow processes
            </p>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 px-6 py-6">
        <AutoTable
          resourceKey="workflow"
          onRowClick={handleRowClick}
          headerActions={headerActions}
          customTitle=""
          customSearchPlaceholder="Search workflows..."
          className="workflows-table"
        />
      </div>
    </div>
  );
}