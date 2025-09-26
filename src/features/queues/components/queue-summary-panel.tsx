/**
 * Queue Summary Panel - Compact metrics display
 * 
 * Displays key queue metrics in a compact horizontal layout:
 * - Queue type statistics (Vendor/Internal)
 * - Status counts (Monitoring, Failed, Sleeping)
 * - PNR counts and health indicators
 * - Can be used on main dashboard or queue pages
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/generalUtils';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  PauseCircle, 
  FileText,
  TrendingUp
} from 'lucide-react';

interface QueueSummaryData {
  queueType: string;
  monitoring: number;
  failed: number;
  sleeping: number;
  pnrsOnQueue: number;
}

interface QueueSummaryPanelProps {
  data: QueueSummaryData[];
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export function QueueSummaryPanel({ 
  data, 
  className,
  showTitle = false,
  compact = false 
}: QueueSummaryPanelProps) {
  const totalQueues = data.reduce((sum, d) => sum + d.monitoring + d.failed + d.sleeping, 0);
  const totalFailed = data.reduce((sum, d) => sum + d.failed, 0);
  const totalPNRs = data.reduce((sum, d) => sum + d.pnrsOnQueue, 0);

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
    <Card className={cn("", className)}>
      {showTitle && (
        <div className="px-4 py-2 border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Queue Overview</h3>
            <Badge variant="outline" className="text-xs">
              {totalQueues} Total Queues
            </Badge>
          </div>
        </div>
      )}
      
      <CardContent className={cn("p-3", compact && "p-2")}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {data.map((queueData) => (
            <div key={queueData.queueType} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className={cn(
                  "font-medium text-gray-900",
                  compact ? "text-sm" : "text-base"
                )}>
                  {queueData.queueType}
                </h4>
                {queueData.pnrsOnQueue > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {queueData.pnrsOnQueue} PNRs
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {/* Monitoring */}
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md",
                  getStatusColor('monitoring'),
                  compact ? "text-xs" : "text-sm"
                )}>
                  {getStatusIcon('monitoring')}
                  <span className="font-medium">{queueData.monitoring}</span>
                  <span className="text-gray-600">Monitoring</span>
                </div>

                {/* Failed */}
                {queueData.failed > 0 && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md",
                    getStatusColor('failed'),
                    compact ? "text-xs" : "text-sm"
                  )}>
                    {getStatusIcon('failed')}
                    <span className="font-medium">{queueData.failed}</span>
                    <span className="text-gray-600">Failed</span>
                  </div>
                )}

                {/* Sleeping */}
                {queueData.sleeping > 0 && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md",
                    getStatusColor('sleeping'),
                    compact ? "text-xs" : "text-sm"
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

        {/* Overall Health Indicator */}
        {!compact && totalQueues > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center gap-1",
                totalFailed === 0 ? "text-green-600" : totalFailed > 5 ? "text-red-600" : "text-amber-600"
              )}>
                {totalFailed === 0 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {totalFailed === 0 ? 'All Systems Operational' : `${totalFailed} Queues Need Attention`}
                </span>
              </div>
            </div>
            
            {totalPNRs > 0 && (
              <div className="flex items-center gap-1 text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span>{totalPNRs} PNRs in processing</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Sample data shape for reference
export const sampleQueueData: QueueSummaryData[] = [
  {
    queueType: "Vendor Queues",
    monitoring: 23,
    failed: 2,
    sleeping: 0,
    pnrsOnQueue: 0
  },
  {
    queueType: "Virtual Queues", 
    monitoring: 41,
    failed: 65,
    sleeping: 0,
    pnrsOnQueue: 0
  }
];
