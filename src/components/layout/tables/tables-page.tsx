'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { WorkspaceSidebar } from '@/components/auto-generated/workspace';
import { AutoDataTable } from '@/components/auto-generated/datatable';
import { 
  Button,
  Badge
} from '@/components/ui';
import { 
  Table,
  Plus,
  Database,
  Folder
} from 'lucide-react';

interface TablesPageProps {
  className?: string;
}

export const TablesPage: React.FC<TablesPageProps> = ({
  className
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>();

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Left Sidebar - Workspace */}
      <div className="w-80 border-r border-border bg-muted/10 flex flex-col">
        <WorkspaceSidebar
          selectedTableId={selectedTableId}
          onTableSelect={setSelectedTableId}
          className="h-full"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTableId ? (
          // Show selected table
          <AutoDataTable
            tableId={selectedTableId}
            className="h-full"
          />
        ) : (
          // Empty state - no table selected
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Database className="w-10 h-10 text-muted-foreground" />
              </div>
              
              <h2 className="text-2xl font-semibold mb-3">
                Welcome to Tables
              </h2>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Create and manage your custom data tables. Organize them into categories 
                and build powerful workflows with your business data.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Folder className="w-4 h-4" />
                  <span>Create categories to organize your tables</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Table className="w-4 h-4" />
                  <span>Build custom tables with any field types</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Database className="w-4 h-4" />
                  <span>Edit data inline like a spreadsheet</span>
                </div>
              </div>
              
              <div className="mt-8 text-sm text-muted-foreground">
                Select a table from the sidebar to get started, or create your first category.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
