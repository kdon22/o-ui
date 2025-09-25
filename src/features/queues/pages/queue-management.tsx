/**
 * Travel Queue Management - Main Workspace
 * 
 * Full-page travel operations control center with frequency-based priority zones:
 * - Critical: 0-15 minutes (red zone) - urgent ticketing, payments, emergencies
 * - Standard: 16-60 minutes (amber zone) - seating, upgrades, waitlist management  
 * - Routine: 61+ minutes (green zone) - reporting, maintenance, background tasks
 * 
 * Features:
 * - Real-time queue monitoring with live status updates
 * - GDS queue cleaning operations (Amadeus Q/9, Q/URGENT, etc.)
 * - Virtual scheduled job management (payments, seat assignments)
 * - Professional operations dashboard with actionable insights
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { useConfirmDialog } from '@/components/ui/hooks/useConfirmDialog';
import { confirm } from '@/components/ui/confirm';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  PauseCircle, 
  XCircle,
  Activity,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Moon,
  Sun
} from 'lucide-react';

import { QueueStatusGrid } from '../components/queue-status-grid';
import { OperationalMetrics } from '../components/operational-metrics';
import { QueueActionPanel } from '../components/queue-action-panel';

// ============================================================================
// TYPES
// ============================================================================

interface QueueConfig {
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
  data: Record<string, any>;
  metadata: Record<string, any>;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  scheduledAt?: string;
  processedAt?: string;
  lockedBy?: string;
  lastError?: string;
  queueConfigId?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QueueManagement() {
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  // Add confirmation dialog support
  const { showConfirmDialog, modal } = useConfirmDialog();
  
  // ============================================================================
  // MULTI-SELECT STATE MANAGEMENT
  // ============================================================================
  const [selectedQueues, setSelectedQueues] = useState<string[]>([]);
  const [bulkOperationMode, setBulkOperationMode] = useState(false);
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);

  // ============================================================================
  // BULK ACTION MUTATION
  // ============================================================================
  
  const bulkActionMutation = useActionMutation('queues.bulkUpdate', {
    onSuccess: () => {
      setIsPerformingBulkAction(false);
      handleRefresh();
      clearSelection();
    },
    onError: (error) => {
      console.error('Bulk operation failed:', error);
      setIsPerformingBulkAction(false);
      // Error notification would go here
    }
  });

  // Fetch queue configurations using action system
  const { 
    data: queueConfigsResponse, 
    isLoading: loadingConfigs,
    error: configError,
    refetch: refetchConfigs
  } = useActionQuery<QueueConfig[]>(
    'queues.list',
    undefined, // No data/filters needed for list all
    {
      // Server-only via schema, always fresh data
      refetchInterval: refreshInterval
    }
  );

  // Fetch active queue messages using action system
  const { 
    data: queueMessagesResponse, 
    isLoading: loadingMessages,
    error: messageError,
    refetch: refetchMessages
  } = useActionQuery<QueueMessage[]>(
    'queueEvents.list',
    undefined, // No data/filters needed for list all
    {
      // Server-only via schema, always fresh data
      refetchInterval: refreshInterval
    }
  );

  // ✅ SAFE: Extract array data from ActionResponse with proper fallbacks
  const queueConfigs = React.useMemo(() => {
    // 🔍 DEBUG: Log what we're receiving from the action system
    console.log('🚀 [QueueManagement] queueConfigsResponse:', {
      response: queueConfigsResponse,
      success: queueConfigsResponse?.success,
      dataType: Array.isArray(queueConfigsResponse?.data) ? 'array' : typeof queueConfigsResponse?.data,
      dataLength: Array.isArray(queueConfigsResponse?.data) ? queueConfigsResponse.data.length : 'N/A'
    });

    // Handle ActionResponse structure: { success: boolean, data: T[] }
    if (queueConfigsResponse?.success && Array.isArray(queueConfigsResponse.data)) {
      return queueConfigsResponse.data;
    }
    
    // If no success but we have data as array, still use it
    if (Array.isArray(queueConfigsResponse?.data)) {
      console.warn('🔶 [QueueManagement] Using queue data despite success=false');
      return queueConfigsResponse.data;
    }
    
    return []; // Safe fallback to empty array
  }, [queueConfigsResponse]);

  const queueMessages = React.useMemo(() => {
    // 🔍 DEBUG: Log what we're receiving from the action system
    console.log('🚀 [QueueManagement] queueMessagesResponse:', {
      response: queueMessagesResponse,
      success: queueMessagesResponse?.success,
      dataType: Array.isArray(queueMessagesResponse?.data) ? 'array' : typeof queueMessagesResponse?.data,
      dataLength: Array.isArray(queueMessagesResponse?.data) ? queueMessagesResponse.data.length : 'N/A'
    });

    // Handle ActionResponse structure: { success: boolean, data: T[] }
    if (queueMessagesResponse?.success && Array.isArray(queueMessagesResponse.data)) {
      return queueMessagesResponse.data;
    }
    
    // If no success but we have data as array, still use it
    if (Array.isArray(queueMessagesResponse?.data)) {
      console.warn('🔶 [QueueManagement] Using queue messages despite success=false');
      return queueMessagesResponse.data;
    }
    
    return []; // Safe fallback to empty array
  }, [queueMessagesResponse]);

  // Calculate summary metrics by priority
  const summaryStats = React.useMemo(() => {
    // ✅ SAFE: queueConfigs is guaranteed to be an array here
    const critical = queueConfigs.filter(q => q.config?.priority === 'critical');
    const standard = queueConfigs.filter(q => q.config?.priority === 'standard');
    const routine = queueConfigs.filter(q => q.config?.priority === 'routine');

    return {
      critical: {
        total: critical.length,
        active: critical.filter(q => q.status === 'active').length,
        failed: critical.filter(q => q.status === 'failed').length,
        paused: critical.filter(q => q.status === 'paused').length
      },
      standard: {
        total: standard.length,
        active: standard.filter(q => q.status === 'active').length,
        failed: standard.filter(q => q.status === 'failed').length,
        paused: standard.filter(q => q.status === 'paused').length
      },
      routine: {
        total: routine.length,
        active: routine.filter(q => q.status === 'active').length,
        failed: routine.filter(q => q.status === 'failed').length,
        paused: routine.filter(q => q.status === 'paused').length
      }
    };
  }, [queueConfigs]);

  // Filter queues by selected priority
  const filteredQueues = selectedPriority 
    ? queueConfigs.filter(q => q.config.priority === selectedPriority)
    : queueConfigs;

  const handleRefresh = () => {
    refetchConfigs();
    refetchMessages();
  };

  // ============================================================================
  // MULTI-SELECT HANDLERS
  // ============================================================================
  
  const handleQueueSelection = (queueId: string, checked: boolean) => {
    if (checked) {
      setSelectedQueues(prev => [...prev, queueId]);
    } else {
      setSelectedQueues(prev => prev.filter(id => id !== queueId));
    }
  };

  const selectAllByStatus = (status: string) => {
    const matchingQueues = queueConfigs
      .filter(q => q.status === status)
      .map(q => q.id);
    setSelectedQueues(prev => [...new Set([...prev, ...matchingQueues])]);
    setBulkOperationMode(true);
  };

  const selectAllByPriority = (priority: string) => {
    const matchingQueues = queueConfigs
      .filter(q => q.config.priority === priority)
      .map(q => q.id);
    setSelectedQueues(prev => [...new Set([...prev, ...matchingQueues])]);
    setBulkOperationMode(true);
  };

  const selectAllVisible = () => {
    const visibleQueues = filteredQueues.map(q => q.id);
    setSelectedQueues(prev => [...new Set([...prev, ...visibleQueues])]);
    setBulkOperationMode(true);
  };

  const selectAllByOffice = (office: string) => {
    const matchingQueues = queueConfigs
      .filter(q => q.config.gdsOffice === office)
      .map(q => q.id);
    setSelectedQueues(prev => [...new Set([...prev, ...matchingQueues])]);
    setBulkOperationMode(true);
  };

  const clearSelection = () => {
    setSelectedQueues([]);
    setBulkOperationMode(false);
  };

  const handleBulkAction = async (action: string, options?: any) => {
    if (selectedQueues.length === 0 || isPerformingBulkAction) return;

    // Get action details for confirmation
    const actionDetails = getBulkActionDetails(action, selectedQueues.length);
    
    // Show confirmation dialog for destructive actions
    if (actionDetails.destructive) {
      showConfirmDialog(
        async () => {
          setIsPerformingBulkAction(true);

          try {
            // Map action to the appropriate operation
            const operation = mapActionToOperation(action);
            
            // Execute bulk operation using action system
            await bulkActionMutation.mutateAsync({
              queueIds: selectedQueues,
              operation,
              reason: `Bulk ${action} operation`,
              options: {
                ...options,
                timestamp: new Date().toISOString()
              }
            });

            console.log(`✅ Bulk ${action} completed:`, selectedQueues.length, 'queues');
            
          } catch (error) {
            console.error(`❌ Bulk ${action} failed:`, error);
            
            // Show error message to user
            alert(`Failed to ${action} selected queues. Please try again or check individual queue statuses.`);
          } finally {
            setIsPerformingBulkAction(false);
          }
        },
        confirm.custom({
          title: `${action.charAt(0).toUpperCase() + action.slice(1)} Queues`,
          description: `⚠️ ${actionDetails.confirmMessage}\n\nThis will affect ${selectedQueues.length} queue${selectedQueues.length !== 1 ? 's' : ''}.\n\nAre you sure you want to continue?`,
          variant: 'destructive',
          confirmLabel: action.charAt(0).toUpperCase() + action.slice(1)
        })
      );
      return;
    }

    // Handle non-destructive actions without confirmation
    setIsPerformingBulkAction(true);

    try {
      // Map action to the appropriate operation
      const operation = mapActionToOperation(action);
      
      // Execute bulk operation using action system
      await bulkActionMutation.mutateAsync({
        queueIds: selectedQueues,
        operation,
        reason: `Bulk ${action} operation`,
        options: {
          ...options,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`✅ Bulk ${action} completed:`, selectedQueues.length, 'queues');
      
    } catch (error) {
      console.error(`❌ Bulk ${action} failed:`, error);
      
      // Show error message to user
      alert(`Failed to ${action} selected queues. Please try again or check individual queue statuses.`);
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  const getBulkActionDetails = (action: string, count: number) => {
    const actionMap: Record<string, { confirmMessage: string; destructive: boolean }> = {
      'fail': {
        confirmMessage: 'FAIL SELECTED QUEUES - This will mark queues as failed and stop processing.',
        destructive: true
      },
      'pause': {
        confirmMessage: 'PAUSE SELECTED QUEUES - This will temporarily stop queue processing.',
        destructive: false
      },
      'resume': {
        confirmMessage: 'RESUME SELECTED QUEUES - This will restart paused queue processing.',
        destructive: false
      },
      'sleep': {
        confirmMessage: 'SLEEP SELECTED QUEUES - This will put queues to sleep for the specified duration.',
        destructive: false
      },
      'drain': {
        confirmMessage: 'DRAIN & STOP SELECTED QUEUES - This will process remaining jobs then stop.',
        destructive: true
      }
    };

    return actionMap[action] || { 
      confirmMessage: `${action.toUpperCase()} SELECTED QUEUES`, 
      destructive: false 
    };
  };

  const mapActionToOperation = (action: string): 'pause' | 'resume' | 'stop' | 'wake' | 'fail' | 'drain' => {
    const actionMap: Record<string, 'pause' | 'resume' | 'stop' | 'wake' | 'fail' | 'drain'> = {
      'pause': 'pause',
      'resume': 'resume',
      'fail': 'fail',
      'sleep': 'pause', // Sleep is implemented as pause with wake time
      'drain': 'drain'
    };

    return actionMap[action] || 'pause';
  };

  // ============================================================================
  // KEYBOARD SHORTCUTS FOR OPERATIONAL EFFICIENCY
  // ============================================================================
  
  React.useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'a':
            event.preventDefault();
            selectAllVisible();
            break;
          case 'p':
            event.preventDefault();
            if (selectedQueues.length > 0) {
              handleBulkAction('pause');
            }
            break;
          case 'r':
            event.preventDefault();
            if (selectedQueues.length > 0) {
              handleBulkAction('resume');
            }
            break;
          case 'f':
            event.preventDefault();
            if (selectedQueues.length > 0) {
              handleBulkAction('fail');
            }
            break;
          case 's':
            event.preventDefault();
            if (selectedQueues.length > 0) {
              handleBulkAction('sleep', { duration: '2h' });
            }
            break;
        }
      }
      
      if (event.key === 'Escape') {
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [selectedQueues]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused': return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'sleeping': return <Moon className="h-4 w-4 text-blue-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

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

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================
  if (loadingConfigs || loadingMessages) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">Loading queue management system...</span>
        </div>
      </div>
    );
  }

  // Show errors if any occurred
  if (configError || messageError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="text-center max-w-2xl">
          <div className="text-red-600 text-xl font-semibold mb-2">Failed to Load Queue System</div>
          <p className="text-gray-600 mb-4">
            {configError?.message || messageError?.message || 'An unexpected error occurred.'}
          </p>
          
          {/* 🔍 DEBUG: Show response details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-gray-50 p-4 rounded text-xs mb-4 border">
              <summary className="cursor-pointer font-bold text-gray-700">🔍 Debug Information</summary>
              <div className="mt-2 space-y-2">
                <div className="bg-white p-2 rounded border">
                  <div className="font-semibold text-green-700">Queue Configs Response:</div>
                  <pre className="text-xs overflow-auto max-h-32">
                    {JSON.stringify(queueConfigsResponse, null, 2)}
                  </pre>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="font-semibold text-blue-700">Queue Messages Response:</div>
                  <pre className="text-xs overflow-auto max-h-32">
                    {JSON.stringify(queueMessagesResponse, null, 2)}
                  </pre>
                </div>
                <div className="bg-white p-2 rounded border">
                  <div className="font-semibold text-purple-700">Errors:</div>
                  <div>Config Error: {JSON.stringify(configError, null, 2)}</div>
                  <div>Message Error: {JSON.stringify(messageError, null, 2)}</div>
                </div>
              </div>
            </details>
          )}
          
          <div className="space-x-2">
            <Button 
              onClick={() => {
                refetchConfigs();
                refetchMessages();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              Go to homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Travel Operations Control Center
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              GDS queue management and scheduled travel processing
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>Auto-refresh: {refreshInterval / 1000}s</span>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-3 gap-6">
          {/* Critical Operations */}
          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPriority === 'critical' ? 'border-red-400 bg-red-50' : getPriorityColor('critical')
            }`}
            onClick={() => setSelectedPriority(selectedPriority === 'critical' ? null : 'critical')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-red-800">Critical Operations</h3>
              <Badge className={getPriorityBadgeColor('critical')}>
                0-15 min
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-gray-900">{summaryStats.critical.total}</div>
                <div className="text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-green-600">{summaryStats.critical.active}</div>
                <div className="text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-red-600">{summaryStats.critical.failed}</div>
                <div className="text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-yellow-600">{summaryStats.critical.paused}</div>
                <div className="text-gray-500">Paused</div>
              </div>
            </div>
          </div>

          {/* Standard Operations */}
          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPriority === 'standard' ? 'border-amber-400 bg-amber-50' : getPriorityColor('standard')
            }`}
            onClick={() => setSelectedPriority(selectedPriority === 'standard' ? null : 'standard')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-amber-800">Standard Operations</h3>
              <Badge className={getPriorityBadgeColor('standard')}>
                16-60 min
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-gray-900">{summaryStats.standard.total}</div>
                <div className="text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-green-600">{summaryStats.standard.active}</div>
                <div className="text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-red-600">{summaryStats.standard.failed}</div>
                <div className="text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-yellow-600">{summaryStats.standard.paused}</div>
                <div className="text-gray-500">Paused</div>
              </div>
            </div>
          </div>

          {/* Routine Operations */}
          <div 
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPriority === 'routine' ? 'border-green-400 bg-green-50' : getPriorityColor('routine')
            }`}
            onClick={() => setSelectedPriority(selectedPriority === 'routine' ? null : 'routine')}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-green-800">Routine Operations</h3>
              <Badge className={getPriorityBadgeColor('routine')}>
                61+ min
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-gray-900">{summaryStats.routine.total}</div>
                <div className="text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-green-600">{summaryStats.routine.active}</div>
                <div className="text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-red-600">{summaryStats.routine.failed}</div>
                <div className="text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-yellow-600">{summaryStats.routine.paused}</div>
                <div className="text-gray-500">Paused</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-3 gap-6 p-6">
          {/* Queue Status Grid */}
          <div className="col-span-2">
            <QueueStatusGrid 
              queues={filteredQueues}
              messages={queueMessages}
              selectedPriority={selectedPriority}
              selectedQueues={selectedQueues}
              onQueueSelection={handleQueueSelection}
              onRefresh={handleRefresh}
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Operational Metrics */}
            <OperationalMetrics 
              queues={queueConfigs}
              messages={queueMessages}
            />
            
            <Separator />

            {/* Queue Action Panel */}
            <QueueActionPanel 
              queues={filteredQueues}
              selectedQueues={selectedQueues}
              onSelectAllByStatus={selectAllByStatus}
              onSelectAllByPriority={selectAllByPriority}
              onSelectAllByOffice={selectAllByOffice}
              onSelectAllVisible={selectAllVisible}
              onClearSelection={clearSelection}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Toolbar */}
      {selectedQueues.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="shadow-2xl border-2 border-blue-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedQueues.length} selected
                  </Badge>
                  {isPerformingBulkAction && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 animate-pulse">
                      Processing...
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearSelection}
                    disabled={isPerformingBulkAction}
                    className="h-6 w-6 p-0 hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-8" />
                
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleBulkAction('fail')}
                    disabled={isPerformingBulkAction}
                    className="text-xs"
                  >
                    {isPerformingBulkAction ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    Fail Selected
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('pause')}
                    disabled={isPerformingBulkAction}
                    className="text-xs"
                  >
                    {isPerformingBulkAction ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Pause className="h-3 w-3 mr-1" />
                    )}
                    Pause Selected
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('resume')}
                    disabled={isPerformingBulkAction}
                    className="text-xs"
                  >
                    {isPerformingBulkAction ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3 mr-1" />
                    )}
                    Resume Selected
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('sleep', { duration: '2h' })}
                    disabled={isPerformingBulkAction}
                    className="text-xs"
                  >
                    {isPerformingBulkAction ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Moon className="h-3 w-3 mr-1" />
                    )}
                    Sleep 2h
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('drain')}
                    disabled={isPerformingBulkAction}
                    className="text-xs"
                  >
                    {isPerformingBulkAction ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Drain & Stop
                  </Button>
                </div>
              </div>
              
              {/* Keyboard shortcuts hint */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500 text-center">
                  {isPerformingBulkAction ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Processing bulk operation on {selectedQueues.length} queue{selectedQueues.length !== 1 ? 's' : ''}...</span>
                    </div>
                  ) : (
                    <>
                      Shortcuts: Ctrl+P (Pause) • Ctrl+R (Resume) • Ctrl+F (Fail) • Ctrl+S (Sleep) • Esc (Clear)
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Render confirmation modal */}
      {modal}
    </div>
  );
}
