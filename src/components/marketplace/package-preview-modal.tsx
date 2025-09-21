/**
 * Package Preview Modal - Interactive Package Exploration
 * 
 * Features:
 * - Live code examples with syntax highlighting
 * - Interactive component demos
 * - Screenshot galleries with zoom
 * - Video previews and tutorials
 * - Dependency visualization
 * - Installation preview
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useActionQuery } from '@/hooks/use-action-api';
import { 
  X, Play, Code, Image, Video, Download, Eye, 
  ChevronLeft, ChevronRight, Maximize2, Copy,
  CheckCircle, AlertCircle, Info, ExternalLink,
  Zap, Database, Workflow, Settings, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/hooks/useToast';
import { 
  MarketplacePackageWithDetails,
  RuleExample,
  WorkflowExample,
  TableExample
} from '@/features/marketplace/types/enhanced';

interface PackagePreviewModalProps {
  packageId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onInstall?: (packageId: string) => void;
}

export function PackagePreviewModal({ 
  packageId, 
  isOpen, 
  onClose, 
  onInstall 
}: PackagePreviewModalProps) {
  const { toast } = useToast();
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedScreenshot, setSelectedScreenshot] = useState(0);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch package details with preview data via action-system (DB-only)
  const { data: packageResponse, isActuallyLoading: isLoading } = useActionQuery<MarketplacePackageWithDetails>(
    'marketplacePackages.read',
    { id: packageId, include: { preview: true } },
    { enabled: !!packageId && isOpen, skipCache: true }
  );
  const packageData = packageResponse?.data as MarketplacePackageWithDetails | undefined;

  const handleCopyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(id);
      toast({
        title: 'Code Copied',
        description: 'Code has been copied to your clipboard.',
      });
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }, [toast]);

  const handleInstall = useCallback(() => {
    if (packageData && onInstall) {
      onInstall(packageData.id);
      onClose();
    }
  }, [packageData, onInstall, onClose]);

  const renderCodeExample = (example: RuleExample) => (
    <Card key={example.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{example.title}</CardTitle>
            <CardDescription>{example.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="capitalize">
              {example.complexity}
            </Badge>
            <Badge variant="secondary">
              {example.language}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm overflow-x-auto border">
            <code className="language-javascript">{example.code}</code>
          </pre>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyCode(example.code, example.id)}
            className="absolute top-2 right-2"
          >
            {copiedCode === example.id ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {example.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {example.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderWorkflowExample = (example: WorkflowExample) => (
    <Card key={example.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{example.title}</CardTitle>
            <CardDescription>{example.description}</CardDescription>
          </div>
          <Badge variant="outline">
            {example.estimatedTime}min
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {example.steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{step.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {step.description}
                </p>
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                {step.type}
              </Badge>
            </div>
          ))}
        </div>
        
        {example.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {example.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderScreenshotGallery = () => {
    if (!packageData?.preview?.screenshots || packageData.preview.screenshots.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-300">No screenshots available</p>
          </div>
        </div>
      );
    }

    const screenshots = packageData.preview.screenshots;

    return (
      <div className="space-y-4">
        {/* Main Screenshot */}
        <div className="relative">
          <img
            src={screenshots[selectedScreenshot]}
            alt={`Screenshot ${selectedScreenshot + 1}`}
            className="w-full h-64 md:h-96 object-cover rounded-lg border cursor-pointer"
            onClick={() => setShowFullscreenImage(true)}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFullscreenImage(true)}
            className="absolute top-2 right-2"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          
          {/* Navigation Arrows */}
          {screenshots.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedScreenshot(Math.max(0, selectedScreenshot - 1))}
                disabled={selectedScreenshot === 0}
                className="absolute left-2 top-1/2 transform -translate-y-1/2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedScreenshot(Math.min(screenshots.length - 1, selectedScreenshot + 1))}
                disabled={selectedScreenshot === screenshots.length - 1}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {screenshots.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {screenshots.map((screenshot, index) => (
              <img
                key={index}
                src={screenshot}
                alt={`Thumbnail ${index + 1}`}
                className={`flex-shrink-0 w-20 h-16 object-cover rounded border-2 cursor-pointer ${
                  index === selectedScreenshot 
                    ? 'border-blue-500' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => setSelectedScreenshot(index)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderVideoPreview = () => {
    if (!packageData?.preview?.videoUrl) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-300">No video preview available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-video rounded-lg overflow-hidden border">
        <iframe
          src={packageData.preview.videoUrl}
          className="w-full h-full"
          allowFullScreen
          title="Package Demo Video"
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">
                  {packageData?.name || 'Package Preview'}
                </DialogTitle>
                {packageData && (
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {packageData.description}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : packageData ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="pb-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
                  <TabsTrigger value="demo">Live Demo</TabsTrigger>
                  <TabsTrigger value="code">Code Examples</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Code className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{packageData.selectedRules.length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Rules</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Workflow className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{packageData.selectedWorkflows.length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Workflows</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Database className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{packageData.selectedTables.length}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Tables</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Download className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold">
                          {packageData.analytics?.totalDownloads?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Downloads</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Use Cases */}
                  {packageData.preview?.useCases && packageData.preview.useCases.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Use Cases</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {packageData.preview.useCases.slice(0, 4).map((useCase) => (
                            <div key={useCase.id} className="p-4 border rounded-lg">
                              <h4 className="font-semibold mb-2">{useCase.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                {useCase.description}
                              </p>
                              <div className="flex items-center justify-between text-xs">
                                <Badge variant="outline" className="capitalize">
                                  {useCase.complexity}
                                </Badge>
                                <span className="text-gray-500">
                                  {useCase.estimatedSetupTime}min setup
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Start */}
                  {packageData.preview?.quickStart && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Start Guide</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <p>{packageData.preview.quickStart}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="screenshots" className="mt-6">
                  {renderScreenshotGallery()}
                </TabsContent>

                <TabsContent value="demo" className="mt-6">
                  {renderVideoPreview()}
                  
                  {packageData.preview?.playgroundUrl && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>Interactive Playground</CardTitle>
                        <CardDescription>
                          Try out this package in a live environment
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button asChild>
                          <a 
                            href={packageData.preview.playgroundUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Playground
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="code" className="mt-6">
                  {packageData.preview?.ruleExamples && packageData.preview.ruleExamples.length > 0 ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Rule Examples</h3>
                        {packageData.preview.ruleExamples.map(renderCodeExample)}
                      </div>
                      
                      {packageData.preview?.workflowExamples && packageData.preview.workflowExamples.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Workflow Examples</h3>
                          {packageData.preview.workflowExamples.map(renderWorkflowExample)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Code className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-300">No code examples available</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Package not found</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    The requested package could not be loaded.
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer Actions */}
          {packageData && (
            <div className="border-t p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">v{packageData.version}</Badge>
                  <Badge variant="secondary">{packageData.licenseType}</Badge>
                  {packageData.licenseType !== 'FREE' && packageData.price && (
                    <div className="font-semibold text-green-600">
                      ${packageData.price}
                      {packageData.subscriptionInterval && (
                        <span className="text-xs text-gray-500">/{packageData.subscriptionInterval}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button onClick={handleInstall} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Download className="h-4 w-4 mr-2" />
                    Install Package
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Modal */}
      {showFullscreenImage && packageData?.preview?.screenshots && (
        <Dialog open={showFullscreenImage} onOpenChange={setShowFullscreenImage}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
            <div className="relative">
              <img
                src={packageData.preview.screenshots[selectedScreenshot]}
                alt={`Screenshot ${selectedScreenshot + 1}`}
                className="w-full h-full object-contain"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFullscreenImage(false)}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
