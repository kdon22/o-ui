/**
 * Enhanced Workflow Toolbar - Complete Gateway Integration
 * 
 * Enhanced toolbar with gateway tools, demo workflows, and professional UX.
 * Provides quick access to all gateway features and visual feedback.
 */

'use client';

import { useState } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Download, 
  Upload, 
  Zap, 
  Route, 
  Sparkles,
  ChevronDown,
  Info,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import { GatewayToolbar } from './gateway-toolbar';
import { DEMO_GATEWAY_WORKFLOW, QUICK_DEMOS } from './demo-gateway-workflow';
import type { VisualWorkflow, Position } from '../../types/workflow-builder';

interface EnhancedWorkflowToolbarProps {
  workflow?: VisualWorkflow;
  isExecuting?: boolean;
  onExecuteWorkflow?: () => void;
  onStopExecution?: () => void;
  onSaveWorkflow?: () => void;
  onLoadWorkflow?: (workflow: VisualWorkflow) => void;
  onCreateGateway?: (type: 'parallel-gateway' | 'exclusive-gateway', position: Position) => string;
  onReset?: () => void;
  className?: string;
}

export function EnhancedWorkflowToolbar({
  workflow,
  isExecuting = false,
  onExecuteWorkflow,
  onStopExecution,
  onSaveWorkflow,
  onLoadWorkflow,
  onCreateGateway,
  onReset,
  className
}: EnhancedWorkflowToolbarProps) {
  
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showGatewayTools, setShowGatewayTools] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleExecute = () => {
    if (isExecuting) {
      onStopExecution?.();
    } else {
      setExecutionStatus('running');
      onExecuteWorkflow?.();
    }
  };

  const handleLoadDemo = (demoKey: string) => {
    const demo = QUICK_DEMOS[demoKey as keyof typeof QUICK_DEMOS];
    if (demo && onLoadWorkflow) {
      onLoadWorkflow(demo);
      setShowDemoMenu(false);
    }
  };

  const handleCreateGateway = (type: 'parallel-gateway' | 'exclusive-gateway', position: Position) => {
    return onCreateGateway?.(type, position) || '';
  };

  const handleReset = () => {
    setExecutionStatus('idle');
    onReset?.();
  };

  // ============================================================================
  // STATUS INDICATORS
  // ============================================================================

  const getExecutionStatusColor = () => {
    switch (executionStatus) {
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getWorkflowStats = () => {
    if (!workflow) return { nodes: 0, connections: 0, gateways: 0 };
    
    const gatewayCount = workflow.nodes.filter(n => 
      n.type === 'parallel-gateway' || n.type === 'exclusive-gateway'
    ).length;
    
    return {
      nodes: workflow.nodes.length,
      connections: workflow.connections.length,
      gateways: gatewayCount
    };
  };

  const stats = getWorkflowStats();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700",
      className
    )}>
      
      {/* Left Section - Main Actions */}
      <div className="flex items-center gap-3">
        
        {/* Execution Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExecute}
            disabled={!workflow || workflow.nodes.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
              isExecuting
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
            )}
          >
            {isExecuting ? (
              <>
                <Square size={16} />
                Stop
              </>
            ) : (
              <>
                <Play size={16} />
                Execute
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reset Workflow"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Gateway Tools Toggle */}
        <button
          onClick={() => setShowGatewayTools(!showGatewayTools)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
            showGatewayTools 
              ? "bg-purple-100 text-purple-700 border border-purple-200" 
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          )}
        >
          <Route size={16} />
          Gateway Tools
          <ChevronDown 
            size={14} 
            className={cn(
              "transition-transform duration-200",
              showGatewayTools && "rotate-180"
            )} 
          />
        </button>

        {/* Demo Workflows */}
        <div className="relative">
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Sparkles size={16} />
            Demos
            <ChevronDown 
              size={14} 
              className={cn(
                "transition-transform duration-200",
                showDemoMenu && "rotate-180"
              )} 
            />
          </button>

          {/* Demo Menu */}
          {showDemoMenu && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Demo Workflows</h3>
                <p className="text-xs text-gray-500 mt-1">Click to load example workflows</p>
              </div>
              
              <div className="p-2">
                <button
                  onClick={() => handleLoadDemo('your-use-case')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div className="font-medium text-sm">Your Use Case</div>
                  <div className="text-xs text-gray-500">Level2 → Parallel → UTR + Level3</div>
                </button>
                
                <button
                  onClick={() => handleLoadDemo('data-processing')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div className="font-medium text-sm">Data Processing</div>
                  <div className="text-xs text-gray-500">Transform, Enrich, Index in parallel</div>
                </button>
                
                <button
                  onClick={() => handleLoadDemo('api-integration')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div className="font-medium text-sm">API Integration</div>
                  <div className="text-xs text-gray-500">Auth → Parallel data fetching</div>
                </button>
                
                <button
                  onClick={() => handleLoadDemo('notification-system')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <div className="font-medium text-sm">Notification System</div>
                  <div className="text-xs text-gray-500">Event → Email + SMS + Dashboard</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Section - Status & Stats */}
      <div className="flex items-center gap-4">
        
        {/* Execution Status */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
          getExecutionStatusColor()
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            executionStatus === 'running' && "animate-pulse bg-blue-500",
            executionStatus === 'completed' && "bg-green-500",
            executionStatus === 'error' && "bg-red-500",
            executionStatus === 'idle' && "bg-gray-400"
          )} />
          {executionStatus === 'running' && 'Executing'}
          {executionStatus === 'completed' && 'Completed'}
          {executionStatus === 'error' && 'Error'}
          {executionStatus === 'idle' && 'Ready'}
        </div>

        {/* Workflow Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{stats.nodes} nodes</span>
          <span>{stats.connections} connections</span>
          {stats.gateways > 0 && (
            <span className="text-purple-600 font-medium">
              {stats.gateways} gateway{stats.gateways !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Right Section - File Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSaveWorkflow}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Save Workflow"
        >
          <Download size={16} />
        </button>
        
        <button
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Load Workflow"
        >
          <Upload size={16} />
        </button>

        <button
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Documentation"
        >
          <BookOpen size={16} />
        </button>

        <button
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Help"
        >
          <Info size={16} />
        </button>
      </div>

      {/* Gateway Tools Panel (Collapsible) */}
      {showGatewayTools && (
        <div className="absolute top-full left-4 mt-2 z-50">
          <GatewayToolbar 
            onCreateGateway={handleCreateGateway}
            className="shadow-lg border border-gray-200 dark:border-gray-700"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXECUTION STATUS INDICATOR
// ============================================================================

export function ExecutionStatusIndicator({ 
  status, 
  progress 
}: { 
  status: 'idle' | 'running' | 'completed' | 'error';
  progress?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-3 h-3 rounded-full flex items-center justify-center",
        status === 'running' && "bg-blue-500 animate-pulse",
        status === 'completed' && "bg-green-500",
        status === 'error' && "bg-red-500",
        status === 'idle' && "bg-gray-400"
      )}>
        {status === 'running' && progress !== undefined && (
          <div 
            className="w-2 h-2 bg-white rounded-full opacity-80"
            style={{ 
              transform: `scale(${progress / 100})`,
              transition: 'transform 0.3s ease-in-out'
            }}
          />
        )}
      </div>
      
      <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
        {status}
        {status === 'running' && progress !== undefined && ` (${Math.round(progress)}%)`}
      </span>
    </div>
  );
}
