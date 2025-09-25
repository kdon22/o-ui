/**
 * Queue Status Grid - Professional Operations Display
 * 
 * Displays queue configurations in a clean, scannable grid format optimized
 * for operations teams to quickly identify issues and take action.
 * 
 * Features:
 * - Priority-based color coding (Critical/Standard/Routine)
 * - Real-time status indicators with icons
 * - GDS queue information (system, queue, office)
 * - Quick action buttons (pause, resume, sleep, wake)
 * - SLA and performance metrics
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle,
  PauseCircle,
  XCircle,
  Moon,
  Sun,
  Play,
  Pause,
  AlertTriangle,
  Clock,
  Activity,
  Settings,
  ExternalLink
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Queue {
  id: string;
  name: string;
  config: {
    displayName: string;
    description: string;
    priority: 'critical' | 'standard' | 'routine';
    frequencyMinutes: number;
    gdsSystem?: string;
    gdsQueue?: string;
    gdsOffice?: string;
  };
  type: 'GDS' | 'VIRTUAL';
  status: 'active' | 'paused' | 'sleeping' | 'failed';
  sleepUntil?: string;
  pauseReason?: string;
  slaTargetMinutes?: number;
  concurrencyLimit?: number;
  capacityLimit?: number;
}

interface QueueMessage {
  id: string;
  type: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  queueId?: string;
}

interface QueueStatusGridProps {
  queues: Queue[];
  messages: QueueMessage[];
  selectedPriority: string | null;
  selectedQueues: string[];
  onQueueSelection: (queueId: string, checked: boolean) => void;
  onRefresh: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QueueStatusGrid({ 
  queues, 
  messages, 
  selectedPriority,
  selectedQueues,
  onQueueSelection,
  onRefresh 
}: QueueStatusGridProps) {

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'sleeping':
        return <Moon className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'standard':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'routine':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCardBorderColor = (priority: string, status: string) => {
    if (status === 'failed') return 'border-l-4 border-l-red-500';
    
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-l-red-300';
      case 'standard':
        return 'border-l-4 border-l-amber-300';
      case 'routine':
        return 'border-l-4 border-l-green-300';
      default:
        return 'border-l-4 border-l-gray-300';
    }
  };

  const getActiveJobsCount = (queueId: string) => {
    return messages.filter(m => 
      m.queueId === queueId && 
      (m.status === 'queued' || m.status === 'in_progress')
    ).length;
  };

  const formatFrequency = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days}d`;
    }
  };

  const formatSleepUntil = (sleepUntil?: string) => {
    if (!sleepUntil) return null;
    
    const wakeTime = new Date(sleepUntil);
    const now = new Date();
    const diffMs = wakeTime.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours <= 0) return 'Wake now';
    if (diffHours === 1) return 'Wake in 1h';
    if (diffHours < 24) return `Wake in ${diffHours}h`;
    
    const diffDays = Math.ceil(diffHours / 24);
    return `Wake in ${diffDays}d`;
  };

  // Group queues by priority for better organization
  const groupedQueues = React.useMemo(() => {
    const groups = {
      critical: queues.filter(q => q.config.priority === 'critical'),
      standard: queues.filter(q => q.config.priority === 'standard'),
      routine: queues.filter(q => q.config.priority === 'routine')
    };

    // Sort each group by status (failed first, then active, paused, sleeping)
    Object.keys(groups).forEach(key => {
      groups[key as keyof typeof groups].sort((a, b) => {
        const statusOrder = { failed: 0, active: 1, paused: 2, sleeping: 3 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      });
    });

    return groups;
  }, [queues]);

  const displayQueues = selectedPriority 
    ? groupedQueues[selectedPriority as keyof typeof groupedQueues] 
    : [...groupedQueues.critical, ...groupedQueues.standard, ...groupedQueues.routine];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Queue Status
          {selectedPriority && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({selectedPriority} priority)
            </span>
          )}
        </h2>
        <div className="text-sm text-gray-500">
          {displayQueues.length} queue{displayQueues.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {displayQueues.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No queues match the current filter</p>
            </div>
          </div>
        ) : (
          displayQueues.map((queue) => {
            const activeJobs = getActiveJobsCount(queue.id);
            
            return (
              <Card 
                key={queue.id} 
                className={`${getCardBorderColor(queue.config.priority, queue.status)} hover:shadow-md transition-shadow`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Checkbox 
                          checked={selectedQueues.includes(queue.id)}
                          onCheckedChange={(checked) => onQueueSelection(queue.id, checked as boolean)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        {getStatusIcon(queue.status)}
                        <CardTitle className="text-base font-medium truncate">
                          {queue.config.displayName}
                        </CardTitle>
                        <Badge className={`text-xs ${getPriorityBadgeColor(queue.config.priority)}`}>
                          {queue.config.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {queue.config.description}
                      </div>
                      
                      {/* Queue Details */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatFrequency(queue.config.frequencyMinutes)}</span>
                        </div>
                        
                        {queue.type === 'GDS' && queue.config.gdsQueue && (
                          <div className="flex items-center space-x-1">
                            <ExternalLink className="h-3 w-3" />
                            <span>
                              {queue.config.gdsSystem?.toUpperCase()} {queue.config.gdsQueue}
                              {queue.config.gdsOffice && ` (${queue.config.gdsOffice})`}
                            </span>
                          </div>
                        )}
                        
                        {activeJobs > 0 && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Activity className="h-3 w-3" />
                            <span>{activeJobs} active</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* Status-specific actions */}
                      {queue.status === 'paused' && (
                        <Button size="sm" variant="outline" className="h-8 px-2">
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                      )}
                      
                      {queue.status === 'active' && (
                        <Button size="sm" variant="outline" className="h-8 px-2">
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      
                      {queue.status === 'sleeping' && (
                        <Button size="sm" variant="outline" className="h-8 px-2">
                          <Sun className="h-3 w-3 mr-1" />
                          Wake
                        </Button>
                      )}
                      
                      {queue.status === 'failed' && (
                        <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 border-red-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Diagnose
                        </Button>
                      )}

                      <Button size="sm" variant="ghost" className="h-8 px-2">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Status-specific information */}
                {(queue.status === 'failed' && queue.pauseReason) && (
                  <CardContent className="pt-0">
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-800">
                          <div className="font-medium mb-1">Queue Failed</div>
                          <div>{queue.pauseReason}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}

                {(queue.status === 'paused' && queue.pauseReason) && (
                  <CardContent className="pt-0">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex items-start space-x-2">
                        <PauseCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <div className="font-medium mb-1">Queue Paused</div>
                          <div>{queue.pauseReason}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}

                {queue.status === 'sleeping' && queue.sleepUntil && (
                  <CardContent className="pt-0">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Moon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-blue-800 font-medium">
                            Queue Sleeping
                          </span>
                        </div>
                        <div className="text-sm text-blue-600">
                          {formatSleepUntil(queue.sleepUntil)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

