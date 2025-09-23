/**
 * Workflow Builder with Process Library - Integration Example
 * 
 * Shows how to integrate the ProcessLibraryPanel with the workflow builder
 * for drag-and-drop process selection
 */

'use client';

import React, { useState, useCallback } from 'react';
import { ProcessLibraryPanel } from './process-library-panel';
import type { Process } from '@/features/processes/types';

interface WorkflowBuilderWithProcessLibraryProps {
  processes: Process[];
  className?: string;
}

export function WorkflowBuilderWithProcessLibrary({
  processes,
  className
}: WorkflowBuilderWithProcessLibraryProps) {
  
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleProcessSelect = useCallback((process: Process) => {
    setSelectedProcess(process);
    console.log('Process selected:', process);
    // TODO: Add to workflow canvas or show process details
  }, []);

  const handleProcessDrag = useCallback((process: Process) => {
    console.log('Process drag started:', process);
    // TODO: Set drag data for workflow canvas drop handling
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`h-full flex ${className || ''}`}>
      {/* Process Library Panel - Left Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ProcessLibraryPanel
          processes={processes}
          onProcessSelect={handleProcessSelect}
          onProcessDrag={handleProcessDrag}
          searchPlaceholder="Search 100+ processes..."
        />
      </div>

      {/* Workflow Canvas - Main Area */}
      <div className="flex-1 p-6 bg-gray-50">
        <div className="h-full bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          {selectedProcess ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selected Process: {selectedProcess.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedProcess.description || 'No description available'}
              </p>
              <p className="text-sm text-gray-500">
                Type: {selectedProcess.type} | Version: {selectedProcess.version}
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <h3 className="text-lg font-semibold mb-2">
                Workflow Canvas
              </h3>
              <p className="mb-4">
                Select or drag processes from the library to build your workflow
              </p>
              <p className="text-sm">
                📊 {processes.length} processes available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowBuilderWithProcessLibrary;
