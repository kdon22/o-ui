/**
 * Installation Preview Modal - Smart Installation Preview
 * 
 * Shows users exactly what will be installed before confirming:
 * - Package details and components
 * - Dependencies and conflicts
 * - Estimated time and size
 * - Customization options
 * - Installation warnings
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/hooks/useToast';
import { 
  Package, Download, Clock, HardDrive, AlertTriangle, 
  CheckCircle, XCircle, Settings, Code, Database, 
  Workflow, FileText, Zap, Shield, Info, ExternalLink,
  ChevronRight, ChevronDown
} from 'lucide-react';

interface InstallationPreview {
  packageInfo: {
    name: string;
    version: string;
    description: string;
    licenseType: string;
    price?: number;
  };
  components: {
    rules: Array<{ id: string; name: string; description?: string }>;
    classes: Array<{ id: string; name: string; description?: string }>;
    tables: Array<{ id: string; name: string; description?: string }>;
    workflows: Array<{ id: string; name: string; description?: string }>;
  };
  dependencies: Array<{ packageId: string; name: string; version: string; required: boolean }>;
  conflicts: Array<{ packageId: string; name: string; reason: string; severity: 'warning' | 'error' }>;
  estimatedTime: number;
  estimatedSize: number;
  requiresSubscription: boolean;
  warnings: string[];
}

interface InstallationPreviewModalProps {
  packageId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall: (packageId: string, options: InstallationOptions) => void;
  branchId?: string;
}

interface InstallationOptions {
  acceptDependencies: boolean;
  installOptionalDependencies: boolean;
  overrideConflicts: boolean;
  configuration: Record<string, any>;
  customComponentNames: Record<string, string>;
  installationNotes: string;
}

export function InstallationPreviewModal({ 
  packageId, 
  isOpen, 
  onClose, 
  onInstall,
  branchId = 'main'
}: InstallationPreviewModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    components: true,
    dependencies: false,
    conflicts: false
  });
  
  // Installation Options
  const [installationOptions, setInstallationOptions] = useState<InstallationOptions>({
    acceptDependencies: true,
    installOptionalDependencies: false,
    overrideConflicts: false,
    configuration: {},
    customComponentNames: {},
    installationNotes: ''
  });

  // Fetch installation preview
  const previewMutation = useMutation({
    mutationKey: ['installation-preview', packageId, branchId],
    mutationFn: async (): Promise<InstallationPreview> => {
      if (!packageId) throw new Error('No package ID provided');
      
      const response = await fetch(`/api/marketplace/packages/${packageId}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewOnly: true,
          branchId,
          ...installationOptions
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch installation preview');
      }
      
      const result = await response.json();
      return result.preview;
    },
    onError: (error: Error) => {
      toast({
        title: 'Preview Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const { data: preview, isLoading, error } = previewMutation;

  // Trigger preview when modal opens
  React.useEffect(() => {
    if (isOpen && packageId) {
      previewMutation.mutate();
    }
  }, [isOpen, packageId, branchId, previewMutation]);

  const handleInstall = useCallback(() => {
    if (packageId && preview) {
      onInstall(packageId, installationOptions);
      onClose();
    }
  }, [packageId, installationOptions, onInstall, onClose]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const updateCustomName = useCallback((componentId: string, customName: string) => {
    setInstallationOptions(prev => ({
      ...prev,
      customComponentNames: {
        ...prev.customComponentNames,
        [componentId]: customName
      }
    }));
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'rules': return Code;
      case 'classes': return FileText;
      case 'tables': return Database;
      case 'workflows': return Workflow;
      default: return Package;
    }
  };

  const renderComponentSection = (
    type: keyof InstallationPreview['components'], 
    title: string, 
    components: Array<{ id: string; name: string; description?: string }>
  ) => {
    if (!components.length) return null;
    
    const Icon = getComponentIcon(type);
    
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-blue-600" />
          <h4 className="font-medium">{title}</h4>
          <Badge variant="secondary">{components.length}</Badge>
        </div>
        <div className="space-y-2 pl-6">
          {components.map((component) => (
            <div key={component.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <div className="font-medium text-sm">{component.name}</div>
                {component.description && (
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {component.description}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Custom name..."
                  value={installationOptions.customComponentNames[component.id] || ''}
                  onChange={(e) => updateCustomName(component.id, e.target.value)}
                  className="w-32 h-8 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span>Installation Preview</span>
          </DialogTitle>
          <DialogDescription>
            Review what will be installed and customize the installation options
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading preview...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <div className="font-medium text-red-800 dark:text-red-200">Preview Failed</div>
              <div className="text-sm text-red-600 dark:text-red-300">{error.message}</div>
            </div>
          </div>
        )}

        {preview && (
          <div className="space-y-6 overflow-y-auto max-h-[60vh]">
            {/* Package Overview */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{preview.packageInfo.name}</CardTitle>
                    <CardDescription>v{preview.packageInfo.version}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={preview.packageInfo.licenseType === 'FREE' ? 'default' : 'secondary'}>
                      {preview.packageInfo.licenseType}
                    </Badge>
                    {preview.packageInfo.price && (
                      <Badge variant="outline">${preview.packageInfo.price}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {preview.packageInfo.description}
                </p>
                
                {/* Installation Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Estimated Time</div>
                      <div className="font-medium">{formatTime(preview.estimatedTime)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Size</div>
                      <div className="font-medium">{formatSize(preview.estimatedSize)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Components</div>
                      <div className="font-medium">
                        {Object.values(preview.components).reduce((sum, arr) => sum + arr.length, 0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-xs text-gray-500">Dependencies</div>
                      <div className="font-medium">{preview.dependencies.length}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <CardTitle className="text-sm">Installation Warnings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {preview.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center space-x-2">
                        <Info className="h-3 w-3" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Components</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Components */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Components to Install</CardTitle>
                    <CardDescription>
                      These components will be cloned to your workspace
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderComponentSection('rules', 'Business Rules', preview.components.rules)}
                    {renderComponentSection('classes', 'Classes', preview.components.classes)}
                    {renderComponentSection('tables', 'Data Tables', preview.components.tables)}
                    {renderComponentSection('workflows', 'Workflows', preview.components.workflows)}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dependencies" className="space-y-4">
                {/* Dependencies */}
                {preview.dependencies.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Dependencies</CardTitle>
                      <CardDescription>
                        These packages will be installed automatically
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {preview.dependencies.map((dep) => (
                          <div key={dep.packageId} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium text-sm">{dep.name}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-300">v{dep.version}</div>
                            </div>
                            <Badge variant={dep.required ? 'default' : 'secondary'}>
                              {dep.required ? 'Required' : 'Optional'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Conflicts */}
                {preview.conflicts.length > 0 && (
                  <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="text-base text-red-800 dark:text-red-200">
                        Conflicts Detected
                      </CardTitle>
                      <CardDescription>
                        These issues may prevent installation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {preview.conflicts.map((conflict, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border border-red-200 dark:border-red-800 rounded">
                            <div>
                              <div className="font-medium text-sm">{conflict.name}</div>
                              <div className="text-xs text-red-600 dark:text-red-300">{conflict.reason}</div>
                            </div>
                            <Badge variant={conflict.severity === 'error' ? 'destructive' : 'secondary'}>
                              {conflict.severity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                {/* Installation Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Installation Options</CardTitle>
                    <CardDescription>
                      Customize how the package will be installed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="accept-deps">Install Dependencies</Label>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          Automatically install required dependencies
                        </div>
                      </div>
                      <Switch
                        id="accept-deps"
                        checked={installationOptions.acceptDependencies}
                        onCheckedChange={(checked) => 
                          setInstallationOptions(prev => ({ ...prev, acceptDependencies: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="optional-deps">Install Optional Dependencies</Label>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          Also install optional dependencies
                        </div>
                      </div>
                      <Switch
                        id="optional-deps"
                        checked={installationOptions.installOptionalDependencies}
                        onCheckedChange={(checked) => 
                          setInstallationOptions(prev => ({ ...prev, installOptionalDependencies: checked }))
                        }
                      />
                    </div>

                    {preview.conflicts.some(c => c.severity === 'error') && (
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="override-conflicts">Override Conflicts</Label>
                          <div className="text-xs text-red-600 dark:text-red-300">
                            Force installation despite conflicts (not recommended)
                          </div>
                        </div>
                        <Switch
                          id="override-conflicts"
                          checked={installationOptions.overrideConflicts}
                          onCheckedChange={(checked) => 
                            setInstallationOptions(prev => ({ ...prev, overrideConflicts: checked }))
                          }
                        />
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="notes">Installation Notes</Label>
                      <Input
                        id="notes"
                        placeholder="Add notes about this installation..."
                        value={installationOptions.installationNotes}
                        onChange={(e) => 
                          setInstallationOptions(prev => ({ ...prev, installationNotes: e.target.value }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleInstall} 
            disabled={isLoading || !!error || !preview}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Install Package
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
