/**
 * Process Library Demo - Showcases the compact, grouped process display
 * 
 * Demonstrates:
 * - 100+ processes in compact rows
 * - Collapsible type groups with chevrons
 * - UTR processes auto-expanded (most used)
 * - Search functionality
 * - Drag and drop capability
 */

'use client';

import React from 'react';
import { ProcessLibraryPanel } from './process-library-panel';
import type { Process } from '@/features/processes/types';

// ============================================================================
// SAMPLE DATA - 100+ Processes across all types
// ============================================================================

const SAMPLE_PROCESSES: Process[] = [
  // UTR Processes (Most used - will be auto-expanded)
  {
    id: 'utr-001',
    name: 'UTR Data Validation',
    description: 'Validates incoming UTR data structure and format',
    type: 'UTR',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'utr-002',
    name: 'UTR Field Extraction',
    description: 'Extracts key fields from UTR for processing',
    type: 'UTR',
    tenantId: 'demo-tenant',
    branchId: 'main', 
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'utr-003',
    name: 'UTR Passenger Processing',
    description: 'Process passenger information from UTR',
    type: 'UTR',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'utr-004',
    name: 'UTR Air Segment Analysis',
    description: 'Analyze air segments within UTR data',
    type: 'UTR',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'utr-005',
    name: 'UTR Hotel Segment Processing',
    description: 'Process hotel segments from UTR',
    type: 'UTR',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Scheduled Processes
  {
    id: 'sched-001',
    name: 'Daily Data Backup',
    description: 'Scheduled backup of all system data',
    type: 'SCHEDULED',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sched-002',
    name: 'Weekly Report Generation',
    description: 'Generate weekly performance reports',
    type: 'SCHEDULED',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sched-003',
    name: 'Monthly Data Cleanup',
    description: 'Clean up old data and logs',
    type: 'SCHEDULED',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Ticketing Processes
  {
    id: 'tick-001',
    name: 'Ticket Issuance Validation',
    description: 'Validate ticket issuance requests',
    type: 'TICKETING',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tick-002',
    name: 'E-Ticket Generation',
    description: 'Generate electronic tickets',
    type: 'TICKETING',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tick-003',
    name: 'Ticket Void Processing',
    description: 'Process ticket void requests',
    type: 'TICKETING',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tick-004',
    name: 'Ticket Exchange Handler',
    description: 'Handle ticket exchange operations',
    type: 'TICKETING',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Pre-Queue Processes
  {
    id: 'pre-001',
    name: 'Queue Entry Validation',
    description: 'Validate requests before queue entry',
    type: 'PRE_QUEUE',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pre-002',
    name: 'Priority Assignment',
    description: 'Assign priority levels to queue entries',
    type: 'PRE_QUEUE',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Post-Queue Processes
  {
    id: 'post-001',
    name: 'Queue Result Processing',
    description: 'Process results after queue completion',
    type: 'POST_QUEUE',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'post-002',
    name: 'Error Handling and Retry',
    description: 'Handle errors and retry failed operations',
    type: 'POST_QUEUE',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Virtual Payment Processes
  {
    id: 'vpay-001',
    name: 'Virtual Card Authorization',
    description: 'Authorize virtual payment cards',
    type: 'VIRTUAL_PAY',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'vpay-002',
    name: 'Payment Settlement',
    description: 'Settle virtual payment transactions',
    type: 'VIRTUAL_PAY',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Fare Check Processes
  {
    id: 'fare-001',
    name: 'Fare Rule Validation',
    description: 'Validate fare rules against bookings',
    type: 'FARE_CHECK',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'fare-002',
    name: 'Fare Calculation Engine',
    description: 'Calculate fares based on rules and segments',
    type: 'FARE_CHECK',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Seat Check Processes
  {
    id: 'seat-001',
    name: 'Seat Availability Check',
    description: 'Check seat availability for segments',
    type: 'SEAT_CHECK',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'seat-002',
    name: 'Seat Assignment Processor',
    description: 'Assign seats based on preferences',
    type: 'SEAT_CHECK',
    tenantId: 'demo-tenant',
    branchId: 'main',
    isActive: true,
    version: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Add more processes to reach 100+ (duplicating with variations)
const generateMoreProcesses = (): Process[] => {
  const additionalProcesses: Process[] = [];
  const baseProcesses = SAMPLE_PROCESSES.slice(0, 10); // Take first 10 as base
  
  // Generate variations to reach 100+ total
  for (let i = 0; i < 90; i++) {
    const baseProcess = baseProcesses[i % baseProcesses.length];
    const variation = Math.floor(i / 10) + 1;
    
    additionalProcesses.push({
      ...baseProcess,
      id: `${baseProcess.id}-var-${variation}-${i}`,
      name: `${baseProcess.name} (Variant ${variation})`,
      description: `${baseProcess.description} - Variation ${variation}`,
      version: variation
    });
  }
  
  return additionalProcesses;
};

const ALL_SAMPLE_PROCESSES = [...SAMPLE_PROCESSES, ...generateMoreProcesses()];

// ============================================================================
// DEMO COMPONENT
// ============================================================================

export function ProcessLibraryDemo() {
  
  const handleProcessSelect = (process: Process) => {
    console.log('Demo: Process selected:', process);
    alert(`Selected: ${process.name}\nType: ${process.type}\nVersion: ${process.version}`);
  };

  const handleProcessDrag = (process: Process) => {
    console.log('Demo: Process drag started:', process);
  };

  return (
    <div className="h-screen bg-gray-100">
      <div className="container mx-auto p-6 h-full">
        {/* Demo Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Process Library Demo
          </h1>
          <p className="text-gray-600">
            📊 {ALL_SAMPLE_PROCESSES.length} processes • 8 categories • Compact rows • UTR auto-expanded
          </p>
        </div>

        {/* Process Library Panel */}
        <div className="bg-white rounded-lg shadow-sm h-full max-h-[calc(100vh-200px)]">
          <ProcessLibraryPanel
            processes={ALL_SAMPLE_PROCESSES}
            onProcessSelect={handleProcessSelect}
            onProcessDrag={handleProcessDrag}
            searchPlaceholder="Search 100+ processes..."
          />
        </div>

        {/* Demo Instructions */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>
            ✨ <strong>Features:</strong> Collapsible groups • UTR auto-expanded • Search • Compact rows • Drag support
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProcessLibraryDemo;
