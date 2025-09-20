/**
 * Enhanced Package Detail Component - Comprehensive Package View
 * 
 * Features:
 * - Interactive package preview with live demos
 * - Comprehensive package information and analytics
 * - Installation management with dependency resolution
 * - Rating and review system with user feedback
 * - Component exploration and code samples
 * - Version history and changelog
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActionMutation } from '@/hooks/use-action-api';
import { 
  ArrowLeft, Star, Download, Users, Tag, Play, Code, 
  Database, Workflow, Settings, Shield, Clock, CheckCircle,
  AlertCircle, ExternalLink, Heart, Share2, Flag, ThumbsUp,
  Eye, Package, Zap, TrendingUp, Award, Globe, Lock,
  ChevronDown, ChevronUp, Copy, FileText, Video, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/hooks/useToast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TextArea } from '@/components/ui/text-area';
import { InstallationPreviewModal } from './installation-preview-modal';
import { InstallationProgressModal } from './installation-progress-modal';
import { 
  MarketplacePackageWithDetails, 
  PackageReview,
  PackageInstallationStatus,
  InstallationRequest,
  RuleExample,
  WorkflowExample,
  TableExample
} from '@/features/marketplace/types/enhanced';

interface PackageDetailProps {
  packageId: string;
  onBack?: () => void;
}

export function PackageDetail({ packageId, onBack }: PackageDetailProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' });
  
  // Installation Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [installationOptions, setInstallationOptions] = useState<any>(null);
  const [showDependencies, setShowDependencies] = useState(false);
  const [previewMode, setPreviewMode] = useState<'code' | 'demo' | 'screenshots'>('screenshots');

  // Fetch package details
  const { data: packageData, isLoading } = useQuery({
    queryKey: ['marketplace-package', packageId],
    queryFn: async (): Promise<MarketplacePackageWithDetails> => {
      const response = await fetch(`/api/marketplace/packages/${packageId}?includeAll=true`);
      if (!response.ok) throw new Error('Failed to fetch package details');
      const result = await response.json();
      return result.data;
    },
  });

  // Fetch package reviews
  const { data: reviews } = useQuery({
    queryKey: ['package-reviews', packageId],
    queryFn: async (): Promise<PackageReview[]> => {
      const response = await fetch(`/api/marketplace/packages/${packageId}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Package installation mutation
  const installPackageMutation = useActionMutation('marketplace.installPackage', {
    ...( { skipCache: true } as any ),
    onSuccess: () => {
      toast({
        title: 'Package Installed',
        description: `${packageData?.name} has been successfully installed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['marketplace-package', packageId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Installation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Review submission mutation
  const submitReviewMutation = useActionMutation('marketplace.submitReview', {
    ...( { skipCache: true } as any ),
    onSuccess: () => {
      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback!',
      });
      setNewReview({ rating: 5, title: '', content: '' });
      queryClient.invalidateQueries({ queryKey: ['package-reviews', packageId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-package', packageId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Submit Review',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleInstall = useCallback(() => {
    if (!packageData) return;
    setShowPreviewModal(true);
  }, [packageData]);

  const handleInstallWithOptions = useCallback((packageId: string, options: any) => {
    setInstallationOptions(options);
    setShowPreviewModal(false);
    setShowProgressModal(true);
  }, []);

  const handleInstallationComplete = useCallback((result: any) => {
    setShowProgressModal(false);
    setInstallationOptions(null);
    
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['marketplace-package', packageId] });
      queryClient.invalidateQueries({ queryKey: ['installed-packages'] });
    }
  }, [packageId, queryClient]);

  const handleSubmitReview = useCallback(() => {
    if (!newReview.title.trim() || !newReview.content.trim()) {
      toast({
        title: 'Review Required',
        description: 'Please provide both a title and content for your review.',
        variant: 'destructive',
      });
      return;
    }
    
    submitReviewMutation.mutate(newReview);
  }, [newReview, submitReviewMutation]);

  const renderStarRating = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const starSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRuleExample = (example: RuleExample) => (
    <Card key={example.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{example.title}</CardTitle>
            <CardDescription>{example.description}</CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {example.complexity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
          <pre className="text-sm overflow-x-auto">
            <code>{example.code}</code>
          </pre>
        </div>
        <div className="flex flex-wrap gap-1">
          {example.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
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
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {example.estimatedTime}min
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {example.steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                {index + 1}
              </div>
              <div>
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {example.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Package not found</h3>
          <p className="text-gray-600 dark:text-gray-300">
            The requested package could not be found.
          </p>
        </div>
      </div>
    );
  }

  const isInstalled = packageData.installationStatus === PackageInstallationStatus.INSTALLED;
  const isInstalling = packageData.installationStatus === PackageInstallationStatus.INSTALLING;
  const hasUpdates = packageData.hasUpdates;

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{packageData.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              by {packageData.authorId} • v{packageData.version}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4 mr-2" />
            Favorite
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="changelog">Changelog</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {packageData.description}
                  </p>
                </CardContent>
              </Card>

              {/* Use Cases */}
              {packageData.preview?.useCases && packageData.preview.useCases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Use Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {packageData.preview.useCases.map((useCase) => (
                        <div key={useCase.id} className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-2">{useCase.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {useCase.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="capitalize">{useCase.complexity}</span>
                            <span>{useCase.estimatedSetupTime}min setup</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dependencies */}
              {packageData.dependencies && packageData.dependencies.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Dependencies</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDependencies(!showDependencies)}
                      >
                        {showDependencies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  {showDependencies && (
                    <CardContent>
                      <div className="space-y-3">
                        {packageData.dependencies.map((dep) => (
                          <div key={dep.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{dep.dependsOn?.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {dep.reason || 'Required dependency'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {dep.versionConstraint && (
                                <Badge variant="outline">{dep.versionConstraint}</Badge>
                              )}
                              {dep.isOptional && (
                                <Badge variant="secondary">Optional</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              {/* Preview Mode Selector */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={previewMode === 'screenshots' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('screenshots')}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Screenshots
                </Button>
                <Button
                  variant={previewMode === 'demo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('demo')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Live Demo
                </Button>
                <Button
                  variant={previewMode === 'code' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('code')}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Code Examples
                </Button>
              </div>

              {/* Preview Content */}
              {previewMode === 'screenshots' && packageData.preview?.screenshots && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packageData.preview.screenshots.map((screenshot, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img
                        src={screenshot}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {previewMode === 'demo' && packageData.preview?.videoUrl && (
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video">
                      <iframe
                        src={packageData.preview.videoUrl}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {previewMode === 'code' && packageData.preview?.ruleExamples && (
                <div className="space-y-4">
                  {packageData.preview.ruleExamples.map(renderRuleExample)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="components" className="space-y-6">
              {/* Component Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packageData.selectedRules.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <Code className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">Rules</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {packageData.selectedRules.length}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Business logic rules included in this package
                      </p>
                    </CardContent>
                  </Card>
                )}

                {packageData.selectedWorkflows.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <Workflow className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-lg">Workflows</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {packageData.selectedWorkflows.length}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Automated workflows and processes
                      </p>
                    </CardContent>
                  </Card>
                )}

                {packageData.selectedTables.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <Database className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-lg">Tables</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600 mb-2">
                        {packageData.selectedTables.length}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Data structures and schemas
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Workflow Examples */}
              {packageData.preview?.workflowExamples && packageData.preview.workflowExamples.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Workflow Examples</h3>
                  <div className="space-y-4">
                    {packageData.preview.workflowExamples.map(renderWorkflowExample)}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              {/* Review Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {packageData.analytics?.averageRating?.toFixed(1) || '0.0'}
                      </div>
                      <div className="flex items-center justify-center mb-1">
                        {renderStarRating(packageData.analytics?.averageRating || 0, 'lg')}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {packageData.analytics?.totalReviews || 0} reviews
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviews?.filter(r => r.rating === rating).length || 0;
                        const total = reviews?.length || 1;
                        const percentage = (count / total) * 100;
                        
                        return (
                          <div key={rating} className="flex items-center space-x-2">
                            <span className="text-sm w-8">{rating}★</span>
                            <Progress value={percentage} className="flex-1" />
                            <span className="text-sm text-gray-600 dark:text-gray-300 w-8">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Write Review */}
              <Card>
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="p-1"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= newReview.rating 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input
                      value={newReview.title}
                      onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                      placeholder="Summarize your experience..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Review</label>
                    <TextArea
                      value={newReview.content}
                      onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                      placeholder="Share your thoughts about this package..."
                      rows={4}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={submitReviewMutation.isPending}
                  >
                    {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </CardContent>
              </Card>

              {/* Reviews List */}
              {reviews && reviews.length > 0 && (
                <div className="space-y-4">
                  {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarImage src={review.user?.avatar} />
                            <AvatarFallback>
                              {review.user?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{review.user?.name || 'Anonymous'}</h4>
                                <div className="flex items-center space-x-2">
                                  {renderStarRating(review.rating, 'sm')}
                                  {review.isVerified && (
                                    <Badge variant="secondary" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            
                            {review.title && (
                              <h5 className="font-medium mb-2">{review.title}</h5>
                            )}
                            
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                              {review.content}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm">
                              <Button variant="ghost" size="sm">
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Helpful ({review.isHelpful})
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Flag className="h-4 w-4 mr-1" />
                                Report
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {reviews.length > 3 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="w-full"
                    >
                      {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="changelog">
              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-2 border-blue-500 pl-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge>v{packageData.version}</Badge>
                        <Badge variant="secondary">Latest</Badge>
                      </div>
                      <h4 className="font-semibold mb-1">Latest Release</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Released on {new Date(packageData.updatedAt).toLocaleDateString()}
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Added new validation rules</li>
                        <li>• Improved performance</li>
                        <li>• Bug fixes and stability improvements</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Installation Card */}
          <Card>
            <CardHeader>
              <CardTitle>Installation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isInstalled ? (
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {isInstalling ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Install Package
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Installed</span>
                  </div>
                  {hasUpdates && (
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Update Available
                    </Button>
                  )}
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              )}
              
              {/* Pricing */}
              {packageData.licenseType !== 'FREE' && packageData.price && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${packageData.price}
                  </div>
                  {packageData.subscriptionInterval && (
                    <div className="text-sm text-gray-500">
                      per {packageData.subscriptionInterval}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Package Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Downloads</span>
                </div>
                <span className="font-semibold">
                  {packageData.analytics?.totalDownloads?.toLocaleString() || '0'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Active Users</span>
                </div>
                <span className="font-semibold">
                  {packageData.analytics?.activeInstallations?.toLocaleString() || '0'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Rating</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold">
                    {packageData.analytics?.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Security Score</span>
                </div>
                <span className="font-semibold">
                  {packageData.analytics?.securityScore || 0}/100
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Package Info */}
          <Card>
            <CardHeader>
              <CardTitle>Package Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span className="font-medium">{packageData.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">License</span>
                <span className="font-medium">{packageData.licenseType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium capitalize">{packageData.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-medium">
                  {new Date(packageData.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Published</span>
                <span className="font-medium">
                  {new Date(packageData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {packageData.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {packageData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>

    {/* Installation Preview Modal */}
    <InstallationPreviewModal
      packageId={showPreviewModal ? packageId : null}
      isOpen={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      onInstall={handleInstallWithOptions}
    />

    {/* Installation Progress Modal */}
    <InstallationProgressModal
      packageId={showProgressModal ? packageId : null}
      packageName={packageData?.name}
      isOpen={showProgressModal}
      onClose={() => setShowProgressModal(false)}
      onComplete={handleInstallationComplete}
      installationOptions={installationOptions}
    />
    </>
  );
}