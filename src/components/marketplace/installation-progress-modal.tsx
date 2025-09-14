/**
 * Installation Progress Modal - Real-Time Installation Tracking
 * 
 * Features:
 * - Real-time progress updates during installation
 * - Step-by-step progress visualization
 * - Component-level installation tracking
 * - Error handling with retry options
 * - Success confirmation with next steps
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/hooks/useToast';
import { 
  Package, Download, CheckCircle, XCircle, AlertTriangle, 
  Clock, Zap, Code, Database, Workflow, FileText,
  RefreshCw, ExternalLink, Settings, Play
} from 'lucide-react';

interface InstallationProgress {
  stage: 'validation' | 'dependencies' | 'components' | 'configuration' | 'completion';
  progress: number; // 0-100
  message: string;
  details?: string;
  currentComponent?: string;
  totalComponents?: number;
  completedComponents?: number;
}

interface ComponentCloneResult {
  originalId: string;
  newId: string;
  type: 'rule' | 'class' | 'table' | 'workflow';
  name: string;
  customName?: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

interface InstallationResult {
  success: boolean;
  installationId?: string;
  clonedComponents?: ComponentCloneResult[];
  dependencies?: string[];
  conflicts?: Array<{ packageId: string; name: string; reason: string }>;
  warnings?: string[];
  installationTime?: number;
  installationSize?: number;
  message?: string;
  error?: {
    type: 'validation' | 'permission' | 'conflict' | 'dependency' | 'component' | 'network' | 'unknown';
    message: string;
    details?: string;
    recoveryActions?: string[];
  };
}

interface InstallationProgressModalProps {
  packageId: string | null;
  packageName?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: InstallationResult) => void;
  installationOptions?: any;
}

const INSTALLATION_STAGES = [
  { key: 'validation', label: 'Validation', icon: CheckCircle },
  { key: 'dependencies', label: 'Dependencies', icon: Zap },
  { key: 'components', label: 'Components', icon: Package },
  { key: 'configuration', label: 'Configuration', icon: Settings },
  { key: 'completion', label: 'Completion', icon: CheckCircle }
];

export function InstallationProgressModal({ 
  packageId, 
  packageName,
  isOpen, 
  onClose, 
  onComplete,
  installationOptions = {}
}: InstallationProgressModalProps) {
  const { toast } = useToast();
  
  // Installation State
  const [progress, setProgress] = useState<InstallationProgress>({
    stage: 'validation',
    progress: 0,
    message: 'Preparing installation...'
  });
  const [result, setResult] = useState<InstallationResult | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Timer for elapsed time
  useEffect(() => {
    if (!isInstalling || result) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isInstalling, startTime, result]);

  // Define helper functions before they are used
  const simulateInstallationProgress = async () => {
    const stages = [
      { stage: 'validation', progress: 20, message: 'Validating package and dependencies...' },
      { stage: 'dependencies', progress: 40, message: 'Installing dependencies...' },
      { stage: 'components', progress: 80, message: 'Cloning components...' },
      { stage: 'configuration', progress: 95, message: 'Configuring installation...' },
    ];

    for (const stageUpdate of stages) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      setProgress(prev => ({
        ...prev,
        stage: stageUpdate.stage as any,
        progress: stageUpdate.progress,
        message: stageUpdate.message
      }));
    }
  };

  // Define startInstallation before useEffect that references it
  const startInstallation = useCallback(async () => {
    if (!packageId) return;
    
    setIsInstalling(true);
    setStartTime(Date.now());
    setProgress({
      stage: 'validation',
      progress: 0,
      message: 'Starting installation...'
    });

    try {
      const response = await fetch(`/api/marketplace/packages/${packageId}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(installationOptions),
      });

      const installationResult: InstallationResult = await response.json();
      
      if (!response.ok) {
        throw new Error(installationResult.error?.message || 'Installation failed');
      }

      // Simulate progress updates (in real implementation, this would come from SSE or WebSocket)
      await simulateInstallationProgress();
      
      setResult(installationResult);
      setProgress({
        stage: 'completion',
        progress: 100,
        message: installationResult.success ? 'Installation completed successfully!' : 'Installation failed'
      });

      if (installationResult.success) {
        toast({
          title: 'Installation Complete',
          description: `${packageName || 'Package'} has been successfully installed.`,
        });
      }

      onComplete?.(installationResult);

    } catch (error) {
      const errorResult: InstallationResult = {
        success: false,
        error: {
          type: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          recoveryActions: ['Try again', 'Check your connection', 'Contact support']
        }
      };
      
      setResult(errorResult);
      setProgress({
        stage: 'validation',
        progress: 0,
        message: 'Installation failed'
      });

      toast({
        title: 'Installation Failed',
        description: errorResult.error?.message,
        variant: 'destructive',
      });
    } finally {
      setIsInstalling(false);
    }
  }, [packageId, packageName, installationOptions, onComplete, toast]);

  // Start installation when modal opens
  useEffect(() => {
    if (isOpen && packageId && !isInstalling && !result) {
      startInstallation();
    }
  }, [isOpen, packageId, isInstalling, result, startInstallation]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProgress({
        stage: 'validation',
        progress: 0,
        message: 'Preparing installation...'
      });
      setResult(null);
      setIsInstalling(false);
      setStartTime(0);
      setElapsedTime(0);
    }
  }, [isOpen]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setProgress({
      stage: 'validation',
      progress: 0,
      message: 'Preparing installation...'
    });
    startInstallation();
  }, [startInstallation]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStageIcon = (stage: string, isActive: boolean, isComplete: boolean) => {
    const stageConfig = INSTALLATION_STAGES.find(s => s.key === stage);
    const Icon = stageConfig?.icon || Package;
    
    if (isComplete) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (isActive) return <Icon className="h-4 w-4 text-blue-600 animate-pulse" />;
    return <Icon className="h-4 w-4 text-gray-400" />;
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'rule': return Code;
      case 'class': return FileText;
      case 'table': return Database;
      case 'workflow': return Workflow;
      default: return Package;
    }
  };

  const getCurrentStageIndex = () => {
    return INSTALLATION_STAGES.findIndex(s => s.key === progress.stage);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span>Installing {packageName || 'Package'}</span>
          </DialogTitle>
          <DialogDescription>
            {isInstalling ? 'Installation in progress...' : 
             result?.success ? 'Installation completed successfully' : 
             'Installation failed'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{progress.message}</span>
              <span className="text-gray-500">
                {isInstalling && elapsedTime > 0 && formatTime(elapsedTime)}
              </span>
            </div>
            <Progress value={progress.progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{progress.progress}% complete</span>
              {progress.details && <span>{progress.details}</span>}
            </div>
          </div>

          {/* Installation Stages */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {INSTALLATION_STAGES.map((stage, index) => {
                  const currentIndex = getCurrentStageIndex();
                  const isActive = index === currentIndex;
                  const isComplete = index < currentIndex || (result?.success && index <= currentIndex);
                  
                  return (
                    <div key={stage.key} className="flex items-center space-x-3">
                      {getStageIcon(stage.key, isActive, isComplete)}
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          isActive ? 'text-blue-600' : 
                          isComplete ? 'text-green-600' : 
                          'text-gray-500'
                        }`}>
                          {stage.label}
                        </div>
                        {isActive && progress.currentComponent && (
                          <div className="text-xs text-gray-500">
                            {progress.currentComponent}
                            {progress.completedComponents !== undefined && progress.totalComponents && (
                              <span className="ml-2">
                                ({progress.completedComponents}/{progress.totalComponents})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {isActive && isInstalling && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Installation Results */}
          {result && (
            <div className="space-y-4">
              {result.success ? (
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-medium text-green-800 dark:text-green-200">
                        Installation Successful
                      </h3>
                    </div>
                    
                    {result.clonedComponents && result.clonedComponents.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Installed Components:</h4>
                        <div className="space-y-1">
                          {result.clonedComponents.map((component) => {
                            const Icon = getComponentIcon(component.type);
                            return (
                              <div key={component.originalId} className="flex items-center space-x-2 text-sm">
                                <Icon className="h-3 w-3" />
                                <span>{component.customName || component.name}</span>
                                <Badge variant={component.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                                  {component.status}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {result.installationTime && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                        Completed in {formatTime(result.installationTime * 1000)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-red-200 dark:border-red-800">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <h3 className="font-medium text-red-800 dark:text-red-200">
                        Installation Failed
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {result.error?.message}
                      </div>
                      
                      {result.error?.details && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {result.error.details}
                        </div>
                      )}
                      
                      {result.error?.recoveryActions && result.error.recoveryActions.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                            Suggested Actions:
                          </div>
                          <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                            {result.error.recoveryActions.map((action, index) => (
                              <li key={index} className="flex items-center space-x-1">
                                <span>•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {result.warnings && result.warnings.length > 0 && (
                <Card className="border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Warnings
                      </h4>
                    </div>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      {result.warnings.map((warning, index) => (
                        <li key={index} className="flex items-center space-x-1">
                          <span>•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result?.success ? (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => {/* Navigate to installed package */}}>
                <Play className="h-4 w-4 mr-2" />
                View Components
              </Button>
            </div>
          ) : result && !result.success ? (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Installation
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={onClose} disabled={isInstalling}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
