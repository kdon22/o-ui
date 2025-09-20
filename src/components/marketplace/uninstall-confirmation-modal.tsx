/**
 * Uninstall Confirmation Modal - Safe Package Removal
 * 
 * Features:
 * - Impact preview showing what will be removed
 * - Dependency checking and warnings
 * - Uninstall options and customization
 * - Progress tracking during removal
 * - Rollback capabilities on failure
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActionMutation } from '@/hooks/use-action-api';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TextArea } from '@/components/ui/text-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/hooks/useToast';
import { 
  Trash2, AlertTriangle, Package, Code, Database, 
  Workflow, FileText, ExternalLink, RefreshCw,
  CheckCircle, XCircle, Clock, Zap
} from 'lucide-react';

interface UninstallConfirmationModalProps {
  packageId: string | null;
  packageName?: string;
  isOpen: boolean;
  onClose: () => void;
  onUninstall?: (result: UninstallResult) => void;
  branchId?: string;
}

interface UninstallOptions {
  removeComponents: boolean;
  removeConfiguration: boolean;
  force: boolean;
  reason: string;
}

interface UninstallResult {
  success: boolean;
  message?: string;
  removedComponents?: Array<{
    id: string;
    type: 'rule' | 'class' | 'table' | 'workflow';
    name: string;
    status: 'removed' | 'failed' | 'skipped';
    reason?: string;
  }>;
  warnings?: string[];
  dependentPackages?: Array<{
    packageId: string;
    name: string;
    affectedComponents: string[];
  }>;
  error?: {
    type: 'validation' | 'permission' | 'dependency' | 'component' | 'unknown';
    message: string;
    details?: string;
    recoveryActions?: string[];
  };
}

export function UninstallConfirmationModal({ 
  packageId, 
  packageName,
  isOpen, 
  onClose, 
  onUninstall,
  branchId = 'main'
}: UninstallConfirmationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // UI State
  const [step, setStep] = useState<'confirm' | 'progress' | 'result'>('confirm');
  const [uninstallOptions, setUninstallOptions] = useState<UninstallOptions>({
    removeComponents: true,
    removeConfiguration: true,
    force: false,
    reason: ''
  });

  // Uninstall mutation via action-system
  const uninstallMutation = useActionMutation('marketplace.uninstallPackage', {
    ...( { skipCache: true } as any ),
    onMutate: () => {
      setStep('progress');
    },
    onSuccess: (result: any) => {
      setStep('result');
      
      if (result?.success) {
        toast({
          title: 'Package Uninstalled',
          description: `${packageName || 'Package'} has been successfully removed.`,
        });
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['installed-packages'] });
        queryClient.invalidateQueries({ queryKey: ['marketplace-package', packageId] });
      }
      
      onUninstall?.(result as any);
    },
    onError: (error: Error) => {
      setStep('result');
      toast({
        title: 'Uninstallation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUninstall = useCallback(() => {
    if (!packageId) return;
    uninstallMutation.mutate({
      packageId,
      ...uninstallOptions,
      branchId
    } as any);
  }, [uninstallMutation, uninstallOptions, packageId, branchId]);

  const handleClose = useCallback(() => {
    if (step !== 'progress') {
      setStep('confirm');
      setUninstallOptions({
        removeComponents: true,
        removeConfiguration: true,
        force: false,
        reason: ''
      });
      onClose();
    }
  }, [step, onClose]);

  const handleRetry = useCallback(() => {
    setStep('confirm');
  }, []);

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'rule': return Code;
      case 'class': return FileText;
      case 'table': return Database;
      case 'workflow': return Workflow;
      default: return Package;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <span>
              {step === 'confirm' && 'Uninstall Package'}
              {step === 'progress' && 'Uninstalling...'}
              {step === 'result' && (uninstallMutation.data?.success ? 'Uninstall Complete' : 'Uninstall Failed')}
            </span>
          </DialogTitle>
          <DialogDescription>
            {step === 'confirm' && `Remove ${packageName || 'this package'} and its components from your workspace`}
            {step === 'progress' && 'Please wait while the package is being removed...'}
            {step === 'result' && (uninstallMutation.data?.success ? 'The package has been successfully removed' : 'The uninstallation process encountered an error')}
          </DialogDescription>
        </DialogHeader>

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <div className="space-y-6">
            {/* Warning */}
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-red-800 dark:text-red-200">
                    Warning: This action cannot be undone
                  </h3>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Uninstalling this package will remove all associated components and configurations. 
                  Make sure you have backups if needed.
                </p>
              </CardContent>
            </Card>

            {/* Uninstall Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Uninstall Options</CardTitle>
                <CardDescription>
                  Choose what to remove during uninstallation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remove-components"
                    checked={uninstallOptions.removeComponents}
                    onCheckedChange={(checked) => 
                      setUninstallOptions(prev => ({ ...prev, removeComponents: checked as boolean }))
                    }
                  />
                  <Label htmlFor="remove-components" className="flex-1">
                    <div>
                      <div className="font-medium">Remove Components</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        Delete all cloned rules, workflows, tables, and classes
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remove-config"
                    checked={uninstallOptions.removeConfiguration}
                    onCheckedChange={(checked) => 
                      setUninstallOptions(prev => ({ ...prev, removeConfiguration: checked as boolean }))
                    }
                  />
                  <Label htmlFor="remove-config" className="flex-1">
                    <div>
                      <div className="font-medium">Remove Configuration</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        Delete package settings and customizations
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="force-removal"
                    checked={uninstallOptions.force}
                    onCheckedChange={(checked) => 
                      setUninstallOptions(prev => ({ ...prev, force: checked as boolean }))
                    }
                  />
                  <Label htmlFor="force-removal" className="flex-1">
                    <div>
                      <div className="font-medium text-red-700 dark:text-red-300">Force Removal</div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        Remove even if other packages depend on this one (not recommended)
                      </div>
                    </div>
                  </Label>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Uninstallation (Optional)</Label>
                  <TextArea
                    id="reason"
                    placeholder="Why are you uninstalling this package?"
                    value={uninstallOptions.reason}
                    onChange={(e) => 
                      setUninstallOptions(prev => ({ ...prev, reason: e.target.value }))
                    }
                    className="h-20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Step */}
        {step === 'progress' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                <div>
                  <h3 className="font-medium">Removing Package</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Please wait while components are being removed...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && uninstallMutation.data && (
          <div className="space-y-6">
            {uninstallMutation.data.success ? (
              <Card className="border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-800 dark:text-green-200">
                      Uninstallation Successful
                    </h3>
                  </div>
                  
                  <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                    {uninstallMutation.data.message}
                  </p>

                  {uninstallMutation.data.removedComponents && uninstallMutation.data.removedComponents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Removed Components:</h4>
                      <div className="space-y-1">
                        {uninstallMutation.data.removedComponents.map((component, index) => {
                          const Icon = getComponentIcon(component.type);
                          return (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <Icon className="h-3 w-3" />
                              <span>{component.name}</span>
                              <Badge variant={component.status === 'removed' ? 'default' : 'destructive'} className="text-xs">
                                {component.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
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
                      Uninstallation Failed
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-red-700 dark:text-red-300">
                      {uninstallMutation.data.error?.message}
                    </div>
                    
                    {uninstallMutation.data.error?.details && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {uninstallMutation.data.error.details}
                      </div>
                    )}
                    
                    {uninstallMutation.data.error?.recoveryActions && uninstallMutation.data.error.recoveryActions.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                          Suggested Actions:
                        </div>
                        <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                          {uninstallMutation.data.error.recoveryActions.map((action, index) => (
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
            {uninstallMutation.data.warnings && uninstallMutation.data.warnings.length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Warnings
                    </h4>
                  </div>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {uninstallMutation.data.warnings.map((warning, index) => (
                      <li key={index} className="flex items-center space-x-1">
                        <span>•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Dependent Packages */}
            {uninstallMutation.data.dependentPackages && uninstallMutation.data.dependentPackages.length > 0 && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Dependent Packages
                    </h4>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    {uninstallMutation.data.dependentPackages.map((dep, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{dep.name}</span>
                        <Badge variant="outline">{dep.affectedComponents.length} components</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'confirm' && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleUninstall}
                disabled={uninstallMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Uninstall Package
              </Button>
            </div>
          )}
          
          {step === 'progress' && (
            <Button variant="outline" disabled>
              <Clock className="h-4 w-4 mr-2" />
              Uninstalling...
            </Button>
          )}
          
          {step === 'result' && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {!uninstallMutation.data?.success && (
                <Button onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
