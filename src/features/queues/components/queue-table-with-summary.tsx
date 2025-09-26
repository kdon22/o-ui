/**
 * Queue Table with Integrated Summary Header
 * 
 * Combines queue summary metrics directly in the table header
 * to maximize screen real estate and provide immediate context
 */

'use client';

import React from 'react';
import { AutoTable } from '@/components/auto-generated/table/auto-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/generalUtils';
import { 
  Activity, 
  AlertTriangle, 
  PauseCircle, 
  FileText
} from 'lucide-react';

interface QueueSummaryData {
  queueType: string;
  monitoring: number;
  failed: number;
  sleeping: number;
  pnrsOnQueue: number;
}

interface QueueTableWithSummaryProps {
  data: QueueSummaryData[];
  className?: string;
}

export function QueueTableWithSummary({ 
  data, 
  className 
}: QueueTableWithSummaryProps) {
  const getStatusIcon = (type: 'monitoring' | 'failed' | 'sleeping') => {
    switch (type) {
      case 'monitoring':
        return <Activity className="h-3 w-3" />;
      case 'failed':
        return <AlertTriangle className="h-3 w-3" />;
      case 'sleeping':
        return <PauseCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (type: 'monitoring' | 'failed' | 'sleeping') => {
    switch (type) {
      case 'monitoring':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'sleeping':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Integrated Summary Header */}
      <div className="border-b bg-white px-4 py-3">
        {/* Summary Metrics with Borders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {data.map((queueData) => (
            <div 
              key={queueData.queueType} 
              className="border border-gray-200 rounded-lg p-3 bg-gray-50/30"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  {queueData.queueType}
                </h4>
                {queueData.pnrsOnQueue > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {queueData.pnrsOnQueue} PNRs
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Monitoring */}
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs",
                  getStatusColor('monitoring')
                )}>
                  {getStatusIcon('monitoring')}
                  <span className="font-medium">{queueData.monitoring}</span>
                  <span className="text-gray-600">Monitoring</span>
                </div>

                {/* Failed */}
                {queueData.failed > 0 && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs",
                    getStatusColor('failed')
                  )}>
                    {getStatusIcon('failed')}
                    <span className="font-medium">{queueData.failed}</span>
                    <span className="text-gray-600">Failed</span>
                  </div>
                )}

                {/* Sleeping */}
                {queueData.sleeping > 0 && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs",
                    getStatusColor('sleeping')
                  )}>
                    {getStatusIcon('sleeping')}
                    <span className="font-medium">{queueData.sleeping}</span>
                    <span className="text-gray-600">Sleeping</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      <div className="flex-1 overflow-hidden">
        <AutoTable 
          resourceKey="queues"
          className="h-full"
          customSearchPlaceholder="Search queues by name, type, or office..."
        />
      </div>
    </div>
  );
}
