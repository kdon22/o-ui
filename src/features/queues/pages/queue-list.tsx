/**
 * Queue List Page - AutoTable-driven queue management
 * 
 * Features:
 * - Schema-driven AutoTable with row actions
 * - Individual queue controls (pause/resume/sleep/stop)
 * - Real-time status monitoring
 * - Bulk operations toolbar
 * - Mobile-responsive design
 * - Clean, focused implementation
 */

'use client';

import React from 'react';
import { AutoTable } from '@/components/auto-generated/table/auto-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle, PauseCircle, XCircle } from 'lucide-react';

interface QueueListPageProps {
  selectedPriority?: string | null;
  className?: string;
}

export const QueueListPage: React.FC<QueueListPageProps> = ({
  selectedPriority,
  className
}) => {

  // Build filters for AutoTable
  const filters = React.useMemo(() => {
    const baseFilters: Record<string, any> = {};
    
    // Apply priority filter if selected
    if (selectedPriority && selectedPriority !== 'all') {
      // Map priority to queue type
      const priorityMapping: Record<string, string[]> = {
        'critical': ['CRITICAL'],
        'standard': ['STANDARD'],
        'routine': ['ROUTINE']
      };
      
      if (priorityMapping[selectedPriority]) {
        baseFilters.queueType = priorityMapping[selectedPriority];
      }
    }
    
    return baseFilters;
  }, [selectedPriority]);

  // Custom queue status badge renderer for header
  const getStatusBadge = (status: string, count?: number) => {
    const statusConfig = {
      'HEALTHY': { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      'WARNING': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: PauseCircle },
      'CRITICAL': { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
      'OFFLINE': { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: AlertTriangle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OFFLINE;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status} {count !== undefined && `(${count})`}
      </Badge>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Queue Management
            {selectedPriority && selectedPriority !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)} Priority
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AutoTable
            resourceKey="queues"
            filters={filters}
            onRowClick={(queue) => {
              // Navigate to queue detail page or show details
              console.log('Queue clicked:', queue);
            }}
            customTitle={selectedPriority ? `${selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)} Priority Queues` : undefined}
            customSearchPlaceholder="Search queues by name, type, or office..."
            buttonVariant="blue"
            // Enable level1 filtering for queue types
            level1Filter={selectedPriority === 'critical' ? 'CRITICAL' : 
                         selectedPriority === 'standard' ? 'STANDARD' : 
                         selectedPriority === 'routine' ? 'ROUTINE' : 'all'}
            filteringConfig={{
              level1: {
                key: 'queueType',
                label: 'Queue Type',
                options: [
                  { value: 'all', label: 'All Types', count: 0 },
                  { value: 'CRITICAL', label: 'Critical', count: 0 },
                  { value: 'STANDARD', label: 'Standard', count: 0 },
                  { value: 'ROUTINE', label: 'Routine', count: 0 },
                  { value: 'VENDOR', label: 'Vendor', count: 0 },
                  { value: 'INTERNAL', label: 'Internal', count: 0 }
                ]
              },
              level2: {
                key: 'healthStatus',
                label: 'Health Status',
                options: [
                  { value: 'all', label: 'All Status', count: 0 },
                  { value: 'HEALTHY', label: 'Healthy', count: 0 },
                  { value: 'WARNING', label: 'Warning', count: 0 },
                  { value: 'CRITICAL', label: 'Critical', count: 0 },
                  { value: 'OFFLINE', label: 'Offline', count: 0 }
                ]
              }
            }}
            className="min-h-[400px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};
