/**
 * Queue Action Panel - Operational Control Interface
 * 
 * Provides quick action controls for queue management operations.
 * Designed for operations teams to efficiently manage multiple queues.
 * 
 * Features:
 * - Bulk queue operations (pause all, resume all, etc.)
 * - Emergency controls (stop all critical, drain queues)
 * - Quick queue creation and configuration
 * - System-wide alerts and notifications
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useActionMutation } from '@/hooks/use-action-api';
import {
  Play,
  Pause,
  Square,
  AlertTriangle,
  Plus,
  Settings,
  RefreshCw,
  Zap,
  Shield,
  Clock,
  Activity,
  Users,
  Database,
  Bell,
  MessageSquare,
  XCircle
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface QueueConfig {
  id: string;
  name: string;
  config: {
    displayName: string;
    priority: 'critical' | 'standard' | 'routine';
  };
  status: 'active' | 'paused' | 'sleeping' | 'failed';
}

interface QueueActionPanelProps {
  queues: QueueConfig[];
  selectedQueues: string[];
  onSelectAllByStatus: (status: string) => void;
  onSelectAllByPriority: (priority: string) => void;
  onSelectAllByOffice: (office: string) => void;
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  onRefresh: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QueueActionPanel({ 
  queues, 
  selectedQueues,
  onSelectAllByStatus,
  onSelectAllByPriority,
  onSelectAllByOffice,
  onSelectAllVisible,
  onClearSelection,
  onRefresh 
}: QueueActionPanelProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Mutation for bulk queue operations
  const bulkOperationMutation = useActionMutation('queues.bulkUpdate', {
    onSuccess: () => {
      setIsProcessing(null);
      onRefresh();
    },
    onError: (error) => {
      console.error('Bulk operation failed:', error);
      setIsProcessing(null);
    }
  });

  // Calculate actionable queue counts
  const actionableQueues = React.useMemo(() => {
    const critical = queues.filter(q => q.config.priority === 'critical');
    const standard = queues.filter(q => q.config.priority === 'standard');
    const routine = queues.filter(q => q.config.priority === 'routine');

    return {
      pausable: queues.filter(q => q.status === 'active').length,
      resumable: queues.filter(q => q.status === 'paused').length,
      failed: queues.filter(q => q.status === 'failed').length,
      sleeping: queues.filter(q => q.status === 'sleeping').length,
      critical: {
        active: critical.filter(q => q.status === 'active').length,
        failed: critical.filter(q => q.status === 'failed').length,
        total: critical.length
      },
      standard: {
        active: standard.filter(q => q.status === 'active').length,
        total: standard.length
      },
      routine: {
        active: routine.filter(q => q.status === 'active').length,
        total: routine.length
      }
    };
  }, [queues]);

  const handleBulkAction = async (action: string) => {
    setIsProcessing(action);
    
    // Determine which queues to target and what operation to perform
    let targetQueues: string[] = [];
    let operation: 'pause' | 'resume' | 'stop' | 'wake' | 'diagnose' = 'pause';
    
    switch (action) {
      case 'emergency-stop':
        targetQueues = queues
          .filter(q => q.config.priority === 'critical' && q.status === 'active')
          .map(q => q.id);
        operation = 'stop';
        break;
      case 'pause-all':
        targetQueues = queues
          .filter(q => q.status === 'active')
          .map(q => q.id);
        operation = 'pause';
        break;
      case 'resume-all':
        targetQueues = queues
          .filter(q => q.status === 'paused')
          .map(q => q.id);
        operation = 'resume';
        break;
      case 'wake-sleeping':
        targetQueues = queues
          .filter(q => q.status === 'sleeping')
          .map(q => q.id);
        operation = 'wake';
        break;
      case 'diagnose-failed':
        targetQueues = queues
          .filter(q => q.status === 'failed')
          .map(q => q.id);
        operation = 'diagnose';
        break;
      default:
        console.warn(`Unknown bulk action: ${action}`);
        setIsProcessing(null);
        return;
    }
    
    if (targetQueues.length === 0) {
      console.log(`No queues found for bulk action: ${action}`);
      setIsProcessing(null);
      return;
    }
    
    try {
      // Execute the bulk operation using the action system
      await bulkOperationMutation.mutateAsync({
        queueIds: targetQueues,
        operation,
        reason: `Bulk ${operation} operation`
      });
    } catch (error) {
      console.error(`Bulk ${action} operation failed:`, error);
      // Error is handled by the mutation's onError callback
    }
  };

  const isActionDisabled = (action: string, count: number) => {
    return isProcessing !== null || count === 0;
  };

  return (
    <div className="space-y-4">
      {/* Emergency Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center text-red-700">
            <Shield className="h-4 w-4 mr-2" />
            Emergency Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full text-xs"
            disabled={isActionDisabled('emergency-stop', actionableQueues.critical.active)}
            onClick={() => handleBulkAction('emergency-stop')}
          >
            {isProcessing === 'emergency-stop' ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Stopping Critical...
              </>
            ) : (
              <>
                <Square className="h-3 w-3 mr-2" />
                Stop All Critical ({actionableQueues.critical.active})
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs border-red-300 text-red-700 hover:bg-red-50"
            disabled={isActionDisabled('pause-all', actionableQueues.pausable)}
            onClick={() => handleBulkAction('pause-all')}
          >
            {isProcessing === 'pause-all' ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Pausing All...
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-2" />
                Pause All Active ({actionableQueues.pausable})
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Activity className="h-4 w-4 mr-2 text-blue-500" />
            Bulk Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            disabled={isActionDisabled('resume-all', actionableQueues.resumable)}
            onClick={() => handleBulkAction('resume-all')}
          >
            {isProcessing === 'resume-all' ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Resuming...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-2" />
                Resume All Paused ({actionableQueues.resumable})
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            disabled={isActionDisabled('wake-sleeping', actionableQueues.sleeping)}
            onClick={() => handleBulkAction('wake-sleeping')}
          >
            {isProcessing === 'wake-sleeping' ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Waking...
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-2" />
                Wake Sleeping ({actionableQueues.sleeping})
              </>
            )}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            disabled={isActionDisabled('diagnose-failed', actionableQueues.failed)}
            onClick={() => handleBulkAction('diagnose-failed')}
          >
            {isProcessing === 'diagnose-failed' ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Diagnosing...
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-2" />
                Diagnose Failed ({actionableQueues.failed})
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Smart Selection Shortcuts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-purple-500" />
            Quick Selection
            {selectedQueues.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                {selectedQueues.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => onSelectAllByStatus('active')}
            >
              Active ({actionableQueues.pausable})
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => onSelectAllByStatus('failed')}
            >
              Failed ({actionableQueues.failed})
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => onSelectAllByPriority('critical')}
            >
              Critical ({actionableQueues.critical.total})
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => onSelectAllByPriority('standard')}
            >
              Standard ({actionableQueues.standard.total})
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={onSelectAllVisible}
          >
            <Activity className="h-3 w-3 mr-2" />
            Select All Visible
          </Button>
          
          {selectedQueues.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onClearSelection}
            >
              <XCircle className="h-3 w-3 mr-2" />
              Clear Selection ({selectedQueues.length})
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Queue Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Database className="h-4 w-4 mr-2 text-green-500" />
            Queue Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => console.log('Create new queue')}
          >
            <Plus className="h-3 w-3 mr-2" />
            Create New Queue
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => console.log('Import queue config')}
          >
            <Database className="h-3 w-3 mr-2" />
            Import Configuration
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => console.log('Global settings')}
          >
            <Settings className="h-3 w-3 mr-2" />
            Global Settings
          </Button>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Users className="h-4 w-4 mr-2 text-purple-500" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-red-50 p-2 rounded">
              <div className="font-medium text-red-800">Critical</div>
              <div className="text-red-600">
                {actionableQueues.critical.active}/{actionableQueues.critical.total} active
              </div>
            </div>
            
            <div className="bg-amber-50 p-2 rounded">
              <div className="font-medium text-amber-800">Standard</div>
              <div className="text-amber-600">
                {actionableQueues.standard.active}/{actionableQueues.standard.total} active
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-2 rounded text-xs">
            <div className="font-medium text-green-800">Routine</div>
            <div className="text-green-600">
              {actionableQueues.routine.active}/{actionableQueues.routine.total} active
            </div>
          </div>

          {actionableQueues.failed > 0 && (
            <div className="bg-red-100 border border-red-300 p-2 rounded text-xs">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="font-medium text-red-800">
                  {actionableQueues.failed} queue{actionableQueues.failed !== 1 ? 's' : ''} failed
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Bell className="h-4 w-4 mr-2 text-orange-500" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs space-y-2">
            {actionableQueues.failed > 0 && (
              <div className="flex items-start space-x-2 p-2 bg-red-50 rounded">
                <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-red-800">Queue Failures Detected</div>
                  <div className="text-red-600">{actionableQueues.failed} queues need attention</div>
                  <div className="text-red-500 text-xs mt-1">Just now</div>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
              <Clock className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-blue-800">Scheduled Maintenance</div>
                <div className="text-blue-600">System maintenance window starts in 2h</div>
                <div className="text-blue-500 text-xs mt-1">2 minutes ago</div>
              </div>
            </div>

            <div className="flex items-start space-x-2 p-2 bg-green-50 rounded">
              <Activity className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-green-800">High Throughput</div>
                <div className="text-green-600">Processing 15% above normal capacity</div>
                <div className="text-green-500 text-xs mt-1">5 minutes ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={() => console.log('View logs')}
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Logs
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={onRefresh}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
