/**
 * ProcessPalette - Draggable Process Library
 * 
 * Loads all tenant-scoped processes (current branch + main branch fallback)
 * and allows dragging them onto the workflow canvas to create ProcessNodes.
 * 
 * Pattern: Follows successful prompt-editor ComponentPalette approach
 */

'use client';

import { useMemo } from 'react';
import { useActionQuery } from '@/hooks/use-action-api';
import { cn } from '@/lib/utils/generalUtils';
import { PROCESS_TYPE_LABELS } from '@/features/processes/constants';
import type { Process } from '@/features/processes/types';

// ============================================================================
// DRAG PAYLOAD TYPE
// ============================================================================

interface ProcessDragData {
  type: 'process';
  processId: string;
  processName: string;
  processType: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ProcessPaletteProps {
  className?: string;
}

export function ProcessPalette({ className }: ProcessPaletteProps) {

  // ============================================================================
  // DATA LOADING - USES ACTION SYSTEM FOR BRANCH-AWARE LOADING
  // ============================================================================

  const { 
    data: dataResult, 
    isLoading, 
    error 
  } = useActionQuery(
    'process.list', // String action, not object
    {
      filters: {},
      options: {
        limit: 1000,
        sort: { field: 'name', direction: 'asc' }
      }
    },
    {
      staleTime: 300000, // 5 minutes
      fallbackToCache: true
    }
  );

  // Extract processes from result
  const processes = dataResult?.data || [];

  // ============================================================================
  // PROCESS GROUPING BY TYPE
  // ============================================================================

  const groupedProcesses = useMemo(() => {
    if (!processes?.length) return {};

    const groups: Record<string, Process[]> = {};
    
    processes.forEach((process: Process) => {
      const type = process.type || 'OTHER';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(process);
    });

    // Sort processes within each group by name
    Object.keys(groups).forEach(type => {
      groups[type].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [processes]);

  // ============================================================================
  // DRAG HANDLERS - FOLLOWS COMPONENT PALETTE PATTERN
  // ============================================================================

  const handleDragStart = (event: React.DragEvent, process: Process) => {
    const dragData: ProcessDragData = {
      type: 'process',
      processId: process.id,
      processName: process.name,
      processType: process.type
    };

    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'copy';
  };

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  if (isLoading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4", className)}>
        <div className="text-red-600 text-sm">
          Failed to load processes: {error.message}
        </div>
      </div>
    );
  }

  if (!processes?.length) {
    return (
      <div className={cn("p-4", className)}>
        <div className="text-gray-500 text-sm text-center">
          No processes available
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-gray-200", className)}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Process Library</h3>
        <p className="text-xs text-gray-500 mt-1">
          Drag processes onto canvas
        </p>
      </div>

      {/* Process Groups */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedProcesses).map(([type, typeProcesses]) => (
          <div key={type} className="border-b border-gray-100">
            
            {/* Group Header */}
            <div className="p-3 bg-gray-50">
              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                {PROCESS_TYPE_LABELS[type as keyof typeof PROCESS_TYPE_LABELS] || type}
              </h4>
              <span className="text-xs text-gray-500">
                {typeProcesses.length} processes
              </span>
            </div>

            {/* Process Items */}
            <div className="p-2 space-y-1">
              {typeProcesses.map((process) => (
                <div
                  key={process.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, process)}
                  className={cn(
                    "flex items-center p-2 rounded cursor-move",
                    "bg-white border border-gray-200",
                    "hover:bg-gray-50 hover:border-gray-300",
                    "active:bg-gray-100",
                    "transition-colors duration-150"
                  )}
                  title={`Drag ${process.name} to canvas`}
                >
                  {/* Process Icon */}
                  <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                  </div>

                  {/* Process Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {process.name}
                    </div>
                    {process.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {process.description}
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    process.isActive ? "bg-green-500" : "bg-gray-300"
                  )} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Total: {processes.length} processes
        </div>
      </div>
    </div>
  );
}
