/**
 * Queue Dashboard - Priority-based summary statistics
 * 
 * Features:
 * - Priority zone cards (Critical, Standard, Routine)
 * - Real-time status counts
 * - Interactive priority filtering
 * - Color-coded status indicators
 * - Responsive grid layout
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/generalUtils';

interface QueueStats {
  total: number;
  active: number;
  failed: number;
  paused: number;
  warning: number;
  offline: number;
}

interface QueueDashboardProps {
  queues: any[];
  selectedPriority: string | null;
  onPriorityChange: (priority: string | null) => void;
  className?: string;
}

export const QueueDashboard: React.FC<QueueDashboardProps> = ({
  queues,
  selectedPriority,
  onPriorityChange,
  className
}) => {

  // Calculate summary metrics by priority
  const summaryStats = React.useMemo(() => {
    const critical = queues.filter(q => q.queueType === 'CRITICAL');
    const standard = queues.filter(q => q.queueType === 'STANDARD');
    const routine = queues.filter(q => q.queueType === 'ROUTINE');

    const calculateStats = (queues: any[]): QueueStats => ({
      total: queues.length,
      active: queues.filter(q => q.healthStatus === 'HEALTHY').length,
      failed: queues.filter(q => q.healthStatus === 'CRITICAL').length,
      paused: queues.filter(q => q.healthStatus === 'WARNING').length,
      warning: queues.filter(q => q.healthStatus === 'WARNING').length,
      offline: queues.filter(q => q.healthStatus === 'OFFLINE').length
    });

    return {
      critical: calculateStats(critical),
      standard: calculateStats(standard),
      routine: calculateStats(routine)
    };
  }, [queues]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'standard': return 'bg-amber-50 border-amber-200'; 
      case 'routine': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'standard': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'routine': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const priorities = [
    {
      key: 'critical',
      title: 'Critical Operations',
      subtitle: '0-15 min',
      stats: summaryStats.critical,
      textColor: 'text-red-800'
    },
    {
      key: 'standard', 
      title: 'Standard Operations',
      subtitle: '16-60 min',
      stats: summaryStats.standard,
      textColor: 'text-amber-800'
    },
    {
      key: 'routine',
      title: 'Routine Operations', 
      subtitle: '61+ min',
      stats: summaryStats.routine,
      textColor: 'text-green-800'
    }
  ];

  return (
    <div className={cn("bg-white border-b border-gray-200 px-6 py-4", className)}>
      <div className="grid grid-cols-3 gap-6">
        {priorities.map((priority) => (
          <div 
            key={priority.key}
            className={cn(
              "p-4 rounded-lg border-2 cursor-pointer transition-all",
              selectedPriority === priority.key 
                ? `border-${priority.key === 'critical' ? 'red' : priority.key === 'standard' ? 'amber' : 'green'}-400 bg-${priority.key === 'critical' ? 'red' : priority.key === 'standard' ? 'amber' : 'green'}-50`
                : getPriorityColor(priority.key)
            )}
            onClick={() => onPriorityChange(selectedPriority === priority.key ? null : priority.key)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={cn("font-semibold", priority.textColor)}>
                {priority.title}
              </h3>
              <Badge className={getPriorityBadgeColor(priority.key)}>
                {priority.subtitle}
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-gray-900">
                  {priority.stats.total}
                </div>
                <div className="text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-green-600">
                  {priority.stats.active}
                </div>
                <div className="text-gray-500">Healthy</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-red-600">
                  {priority.stats.failed}
                </div>
                <div className="text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-yellow-600">
                  {priority.stats.paused}
                </div>
                <div className="text-gray-500">Warning</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};