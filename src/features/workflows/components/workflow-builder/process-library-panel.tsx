/**
 * Process Library Panel - Compact Grouped Process Display
 * 
 * Features:
 * - Compact rows for 100+ processes
 * - Collapsible groups by process type
 * - UTR processes auto-expanded (most used)
 * - Drag-and-drop support for workflow builder
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Workflow, Search, Grip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/generalUtils';
import type { Process } from '@/features/processes/types';

// ============================================================================
// TYPES
// ============================================================================

interface ProcessGroup {
  type: string;
  label: string;
  processes: Process[];
  isExpanded: boolean;
  count: number;
}

interface ProcessLibraryPanelProps {
  processes: Process[];
  onProcessSelect?: (process: Process) => void;
  onProcessDrag?: (process: Process, event: React.DragEvent) => void;
  searchPlaceholder?: string;
  className?: string;
}

// ============================================================================
// PROCESS TYPE CONFIGURATIONS
// ============================================================================

const PROCESS_TYPE_CONFIG = {
  UTR: {
    label: 'UTR (Universal Travel Record)',
    defaultExpanded: true, // Auto-open UTR as it's most used
    color: 'blue',
    description: 'Core travel record processing'
  },
  SCHEDULED: {
    label: 'Scheduled Tasks',
    defaultExpanded: false,
    color: 'green',
    description: 'Time-based automated processes'
  },
  TICKETING: {
    label: 'Ticketing Operations', 
    defaultExpanded: false,
    color: 'purple',
    description: 'Ticket issuance and management'
  },
  PRE_QUEUE: {
    label: 'Pre-Queue Processing',
    defaultExpanded: false,
    color: 'orange',
    description: 'Processing before queue entry'
  },
  POST_QUEUE: {
    label: 'Post-Queue Processing',
    defaultExpanded: false,
    color: 'pink',
    description: 'Processing after queue completion'
  },
  VIRTUAL_PAY: {
    label: 'Virtual Payment',
    defaultExpanded: false,
    color: 'indigo',
    description: 'Payment processing workflows'
  },
  FARE_CHECK: {
    label: 'Fare Validation',
    defaultExpanded: false,
    color: 'yellow',
    description: 'Fare rules and validation'
  },
  SEAT_CHECK: {
    label: 'Seat Assignment Check',
    defaultExpanded: false,
    color: 'red',
    description: 'Seat availability and assignment'
  }
} as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProcessLibraryPanel({
  processes = [],
  onProcessSelect,
  onProcessDrag,
  searchPlaceholder = "Search processes...",
  className
}: ProcessLibraryPanelProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    // Auto-expand UTR by default
    new Set(['UTR'])
  );

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  // Group processes by type and apply search filter
  const processGroups = useMemo<ProcessGroup[]>(() => {
    // Filter processes by search term
    const filteredProcesses = processes.filter(process => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        process.name.toLowerCase().includes(searchLower) ||
        process.description?.toLowerCase().includes(searchLower) ||
        process.type.toLowerCase().includes(searchLower)
      );
    });

    // Group by process type
    const groupsMap = new Map<string, Process[]>();
    
    filteredProcesses.forEach(process => {
      const type = process.type;
      if (!groupsMap.has(type)) {
        groupsMap.set(type, []);
      }
      groupsMap.get(type)!.push(process);
    });

    // Convert to ProcessGroup array with configuration
    const groups: ProcessGroup[] = [];
    
    // Ensure all configured types are represented (even if empty)
    Object.entries(PROCESS_TYPE_CONFIG).forEach(([type, config]) => {
      const processesForType = groupsMap.get(type) || [];
      groups.push({
        type,
        label: config.label,
        processes: processesForType.sort((a, b) => a.name.localeCompare(b.name)),
        isExpanded: expandedGroups.has(type),
        count: processesForType.length
      });
    });

    // Add any processes with types not in our configuration
    groupsMap.forEach((processes, type) => {
      if (!PROCESS_TYPE_CONFIG[type as keyof typeof PROCESS_TYPE_CONFIG]) {
        groups.push({
          type,
          label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          processes: processes.sort((a, b) => a.name.localeCompare(b.name)),
          isExpanded: expandedGroups.has(type),
          count: processes.length
        });
      }
    });

    return groups.filter(group => group.count > 0); // Only show groups with processes
  }, [processes, searchTerm, expandedGroups]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const toggleGroup = (groupType: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupType)) {
        next.delete(groupType);
      } else {
        next.add(groupType);
      }
      return next;
    });
  };

  const handleProcessClick = (process: Process) => {
    onProcessSelect?.(process);
  };

  const handleProcessDragStart = (process: Process, event: React.DragEvent) => {
    // Create a custom drag image for better visual feedback
    const dragElement = event.currentTarget as HTMLElement;
    const rect = dragElement.getBoundingClientRect();
    
    // Create a cleaner drag image
    const dragImage = dragElement.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(2deg)';
    dragImage.style.opacity = '0.8';
    dragImage.style.backgroundColor = '#3b82f6';
    dragImage.style.color = 'white';
    dragImage.style.borderRadius = '6px';
    dragImage.style.padding = '8px 12px';
    dragImage.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.pointerEvents = 'none';
    
    // Temporarily add to DOM
    document.body.appendChild(dragImage);
    
    // Set the custom drag image
    event.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);
    event.dataTransfer.effectAllowed = 'copy';
    
    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
    
    // Call the parent handler
    onProcessDrag?.(process, event);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderProcessRow = (process: Process) => {
    const config = PROCESS_TYPE_CONFIG[process.type as keyof typeof PROCESS_TYPE_CONFIG];
    
    return (
      <div
        key={process.id}
        className={cn(
          // Compact row styling with drag-friendly CSS
          "group flex items-center gap-2 px-3 py-2 text-sm cursor-grab active:cursor-grabbing",
          "hover:bg-gray-50 border-b border-gray-100 last:border-b-0",
          "select-none will-change-transform", // Prevent text selection and optimize for transforms
          "transition-colors duration-150"
        )}
        onClick={() => handleProcessClick(process)}
        draggable
        onDragStart={(event) => handleProcessDragStart(process, event)}
        onDragEnd={(event) => {
          // Reset cursor on drag end
          event.currentTarget.style.cursor = 'grab';
        }}
        style={{
          // Ensure smooth dragging
          touchAction: 'none',
          userSelect: 'none'
        }}
      >
        {/* Drag Handle */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Grip className="h-3 w-3 text-gray-400" />
        </div>

        {/* Process Icon */}
        <div className="flex-shrink-0">
          <Workflow className="h-4 w-4 text-gray-600" />
        </div>

        {/* Process Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {process.name}
            </span>
            
            {/* Active Status */}
            {!process.isActive && (
              <Badge variant="outline" className="text-xs text-gray-500">
                Inactive
              </Badge>
            )}
          </div>
          
          {/* Description (if available and expanded) */}
          {process.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {process.description}
            </p>
          )}
        </div>

        {/* Version Badge */}
        <div className="flex-shrink-0">
          <Badge variant="secondary" className="text-xs">
            v{process.version}
          </Badge>
        </div>
      </div>
    );
  };

  const renderProcessGroup = (group: ProcessGroup) => {
    const config = PROCESS_TYPE_CONFIG[group.type as keyof typeof PROCESS_TYPE_CONFIG];
    const ChevronIcon = group.isExpanded ? ChevronDown : ChevronRight;

    return (
      <div key={group.type} className="mb-1">
        {/* Group Header */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer",
            "hover:bg-gray-100 transition-colors border-b border-gray-200"
          )}
          onClick={() => toggleGroup(group.type)}
        >
          {/* Chevron */}
          <ChevronIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />

          {/* Group Label */}
          <span className="font-medium text-gray-900 flex-1">
            {group.label}
          </span>

          {/* Process Count Badge */}
          <Badge variant="outline" className="text-xs">
            {group.count}
          </Badge>

          {/* UTR Special Badge */}
          {group.type === 'UTR' && (
            <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
              Most Used
            </Badge>
          )}
        </div>

        {/* Group Processes (Collapsible) */}
        {group.isExpanded && (
          <div className="bg-white">
            {group.processes.map(renderProcessRow)}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER MAIN COMPONENT
  // ============================================================================

  const totalProcesses = processes.length;
  const visibleProcesses = processGroups.reduce((sum, group) => sum + group.count, 0);

  return (
    <div className={cn("h-full flex flex-col bg-white border-r border-gray-200", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Process Library</h2>
          <Badge variant="outline" className="text-xs">
            {visibleProcesses} of {totalProcesses}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Process Groups */}
      <div className="flex-1 overflow-y-auto">
        {processGroups.length > 0 ? (
          processGroups.map(renderProcessGroup)
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No processes found matching your search.' : 'No processes available.'}
          </div>
        )}
      </div>

      {/* Footer (Optional) */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          Drag processes to canvas to add to workflow
        </p>
      </div>
    </div>
  );
}

export default ProcessLibraryPanel;
