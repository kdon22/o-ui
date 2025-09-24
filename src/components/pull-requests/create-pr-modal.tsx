'use client';

/**
 * Create PR Modal - Beautiful PR Creation Interface
 * 
 * Features:
 * - Smart branch selection with change preview
 * - Impact analysis and risk assessment
 * - Smart reviewer suggestions
 * - Optional vs Required PR modes
 * - Direct merge bypass option
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextArea } from '@/components/ui/text-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  GitPullRequest, 
  GitBranch, 
  ArrowRight,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  Brain,
  Clock,
  FileText,
  BarChart3,
  Shield
} from 'lucide-react';

import { formatDistanceToNow } from 'date-fns';
import type { 
  PullRequest, 
  SmartReviewerSuggestion, 
  ImpactAnalysis,
  PRMode,
  MergeStrategy 
} from '@/features/pull-requests/pull-requests.schema';
import { useBranchContext } from '@/lib/session';
import { useActionMutation } from '@/hooks/use-action-api';

// ============================================================================
// TYPES
// ============================================================================

interface CreatePRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceBranchId?: string;
  sourceBranchName?: string;
  targetBranchId?: string;
  targetBranchName?: string;
  prMode?: PRMode;
}

interface Branch {
  id: string;
  name: string;
  isDefault: boolean;
  changeCount?: number;
  lastActivityAt?: string;
}

interface ChangePreview {
  addedCount: number;
  modifiedCount: number;
  deletedCount: number;
  filesChanged: number;
  hasConflicts: boolean;
  conflicts: string[];
}

// ============================================================================
// SMART REVIEWER CARD
// ============================================================================

interface SmartReviewerCardProps {
  suggestion: SmartReviewerSuggestion;
  isSelected: boolean;
  onToggle: (userId: string) => void;
}

const SmartReviewerCard: React.FC<SmartReviewerCardProps> = ({ 
  suggestion, 
  isSelected, 
  onToggle 
}) => {
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'RULE_EXPERTISE': return Brain;
      case 'NODE_KNOWLEDGE': return Target;
      case 'PROCESS_OWNER': return Users;
      case 'PREVIOUS_COLLABORATOR': return Clock;
      case 'CODE_OWNER': return Shield;
      case 'AVAILABILITY': return CheckCircle;
      case 'WORKLOAD_BALANCE': return BarChart3;
      default: return Users;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'RULE_EXPERTISE': return 'Rules Expert';
      case 'NODE_KNOWLEDGE': return 'Node Expert';
      case 'PROCESS_OWNER': return 'Process Owner';
      case 'PREVIOUS_COLLABORATOR': return 'Collaborator';
      case 'CODE_OWNER': return 'Code Owner';
      case 'AVAILABILITY': return 'Available';
      case 'WORKLOAD_BALANCE': return 'Balanced Load';
      default: return reason;
    }
  };

  const confidenceColor = suggestion.confidence > 0.8 ? 'text-green-600' : 
                          suggestion.confidence > 0.6 ? 'text-blue-600' : 
                          'text-orange-600';

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-muted hover:border-blue-300 hover:bg-muted/50'
      }`}
      onClick={() => onToggle(suggestion.userId)}
    >
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={isSelected}
          onChange={() => onToggle(suggestion.userId)}
          className="mt-1"
        />
        
        <Avatar className="w-10 h-10">
          <AvatarFallback>
            {suggestion.userName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{suggestion.userName}</span>
            <Badge variant="outline" className={`text-xs ${confidenceColor}`}>
              {Math.round(suggestion.confidence * 100)}% match
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-2">
            {suggestion.reasons.slice(0, 3).map((reason) => {
              const Icon = getReasonIcon(reason);
              return (
                <Badge key={reason} variant="secondary" className="text-xs">
                  <Icon className="w-3 h-3 mr-1" />
                  {getReasonLabel(reason)}
                </Badge>
              );
            })}
            {suggestion.reasons.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{suggestion.reasons.length - 3} more
              </Badge>
            )}
          </div>
          
          {/* Expertise Bars */}
          <div className="space-y-1">
            {Object.entries(suggestion.expertise)
              .filter(([_, level]) => level > 0)
              .slice(0, 2)
              .map(([skill, level]) => (
                <div key={skill} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-muted-foreground capitalize">
                    {skill.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(level / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground">{level}/10</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// IMPACT ANALYSIS DISPLAY
// ============================================================================

interface ImpactAnalysisDisplayProps {
  analysis: ImpactAnalysis;
}

const ImpactAnalysisDisplay: React.FC<ImpactAnalysisDisplayProps> = ({ analysis }) => {
  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-600 bg-green-100 border-green-200';
    if (score <= 6) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 3) return 'Low Risk';
    if (score <= 6) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="space-y-4">
      {/* Risk Score */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRiskColor(analysis.riskScore)}`}>
            {analysis.riskScore}
          </div>
          <div>
            <h4 className="font-medium">Risk Assessment</h4>
            <p className="text-sm text-muted-foreground">
              {getRiskLabel(analysis.riskScore)} - Based on impact analysis
            </p>
          </div>
        </div>
        <Badge className={getRiskColor(analysis.riskScore)}>
          {getRiskLabel(analysis.riskScore)}
        </Badge>
      </div>

      {/* Change Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-600">+{analysis.changeMetrics.linesAdded}</div>
          <div className="text-xs text-muted-foreground">Lines Added</div>
        </div>
        <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-2xl font-bold text-red-600">-{analysis.changeMetrics.linesDeleted}</div>
          <div className="text-xs text-muted-foreground">Lines Deleted</div>
        </div>
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{analysis.changeMetrics.linesModified}</div>
          <div className="text-xs text-muted-foreground">Lines Modified</div>
        </div>
        <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{analysis.changeMetrics.filesChanged}</div>
          <div className="text-xs text-muted-foreground">Files Changed</div>
        </div>
      </div>

      {/* Affected Entities */}
      <div className="space-y-3">
        <h4 className="font-medium">Affected Components</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(analysis.affectedEntities).map(([type, entities]) => (
            entities.length > 0 && (
              <div key={type} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{type}</span>
                  <Badge variant="secondary">{entities.length}</Badge>
                </div>
                <div className="space-y-1">
                  {entities.slice(0, 3).map((entity) => (
                    <div key={entity} className="text-sm text-muted-foreground truncate">
                      {entity}
                    </div>
                  ))}
                  {entities.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{entities.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Business Impact Warnings */}
      {(analysis.businessImpact.customerFacing || 
        analysis.businessImpact.financialImpact !== 'NONE' || 
        analysis.businessImpact.complianceRelevant) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>High Impact Change:</strong> This PR affects{' '}
            {analysis.businessImpact.customerFacing && 'customer-facing functionality, '}
            {analysis.businessImpact.financialImpact !== 'NONE' && `${analysis.businessImpact.financialImpact.toLowerCase()} financial impact, `}
            {analysis.businessImpact.complianceRelevant && 'compliance-relevant processes, '}
            requiring careful review.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CreatePRModal: React.FC<CreatePRModalProps> = ({
  open,
  onOpenChange,
  sourceBranchId: initialSourceBranchId,
  sourceBranchName: initialSourceBranchName,
  targetBranchId: initialTargetBranchId,
  targetBranchName: initialTargetBranchName,
  prMode = 'OPTIONAL'
}) => {
  console.log('🔥 [CreatePRModal] Rendered with props', {
    open,
    initialSourceBranchId,
    initialSourceBranchName,
    initialTargetBranchId,
    initialTargetBranchName,
    prMode
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [sourceBranchId, setSourceBranchId] = useState(initialSourceBranchId || '');
  const [targetBranchId, setTargetBranchId] = useState(initialTargetBranchId || '');
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>('MERGE_COMMIT');
  const [autoMerge, setAutoMerge] = useState(false);
  
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [changePreview, setChangePreview] = useState<ChangePreview | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
  const [smartReviewers, setSmartReviewers] = useState<SmartReviewerSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const branchContext = useBranchContext();
  
  // Mutations
  const createPRMutation = useActionMutation('pullRequests.create');
  const getChangePreviewMutation = useActionMutation('branches.getChangePreview');
  const getSmartReviewersMutation = useActionMutation('pullRequests.getSmartReviewers');
  const directMergeMutation = useActionMutation('branches.merge');

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadBranches();
      if (sourceBranchId && targetBranchId) {
        loadChangePreview();
        loadSmartReviewers();
      }
    }
  }, [open, sourceBranchId, targetBranchId]);

  const loadBranches = async () => {
    // TODO: Load available branches
    setAvailableBranches([
      { id: 'main', name: 'main', isDefault: true, changeCount: 0 },
      { id: 'development', name: 'development', isDefault: false, changeCount: 5 },
      { id: 'feature-123', name: 'feature/new-rules', isDefault: false, changeCount: 3 },
    ]);
  };

  const loadChangePreview = async () => {
    if (!sourceBranchId || !targetBranchId) return;
    
    try {
      setIsLoading(true);
      // TODO: Load actual change preview
      setChangePreview({
        addedCount: 15,
        modifiedCount: 8,
        deletedCount: 2,
        filesChanged: 6,
        hasConflicts: false,
        conflicts: []
      });
      
      // TODO: Load impact analysis
      setImpactAnalysis({
        riskScore: 4,
        affectedEntities: {
          rules: ['CustomerValidation', 'AgeVerification'],
          processes: ['OnboardingProcess'],
          nodes: ['CustomerNode'],
          workflows: []
        },
        changeMetrics: {
          linesAdded: 15,
          linesDeleted: 2,
          linesModified: 8,
          filesChanged: 6
        },
        businessImpact: {
          criticalProcesses: ['OnboardingProcess'],
          customerFacing: true,
          financialImpact: 'LOW',
          complianceRelevant: false
        },
        technicalMetrics: {
          testCoverage: 85,
          performanceImpact: 'NEUTRAL',
          securityRelevant: false
        }
      });
    } catch (error) {
      console.error('Failed to load change preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSmartReviewers = async () => {
    try {
      // TODO: Load smart reviewer suggestions
      setSmartReviewers([
        {
          userId: 'user1',
          userName: 'Sarah Johnson',
          confidence: 0.92,
          reasons: ['RULE_EXPERTISE', 'PREVIOUS_COLLABORATOR', 'AVAILABILITY'],
          expertise: {
            businessRules: 9,
            processDesign: 7,
            nodeHierarchy: 6,
            compliance: 8
          }
        },
        {
          userId: 'user2',
          userName: 'Mike Chen',
          confidence: 0.78,
          reasons: ['NODE_KNOWLEDGE', 'CODE_OWNER'],
          expertise: {
            businessRules: 6,
            processDesign: 8,
            nodeHierarchy: 9,
            compliance: 5
          }
        }
      ]);
    } catch (error) {
      console.error('Failed to load smart reviewers:', error);
    }
  };

  const sourceBranch = availableBranches.find(b => b.id === sourceBranchId);
  const targetBranch = availableBranches.find(b => b.id === targetBranchId);

  const canProceed = () => {
    switch (currentStep) {
      case 0: return sourceBranchId && targetBranchId && title.trim();
      case 1: return true; // Reviewers are optional
      case 2: return true; // Final review
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReviewerToggle = (userId: string) => {
    setSelectedReviewers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreatePR = async () => {
    console.log('🔥 [CreatePRModal] handleCreatePR called', {
      title,
      description,
      sourceBranchId,
      targetBranchId,
      isDraft,
      selectedReviewers,
      mergeStrategy,
      autoMerge
    });
    
    try {
      setIsLoading(true);
      
      const result = await createPRMutation.mutateAsync({
        title,
        description,
        sourceBranchId,
        targetBranchId,
        isDraft,
        reviewers: selectedReviewers,
        mergeStrategy,
        autoMergeEnabled: autoMerge
      });
      
      console.log('🔥 [CreatePRModal] PR creation result', result);
      
      if (result.success) {
        onOpenChange(false);
        // Reset form
        setCurrentStep(0);
        setTitle('');
        setDescription('');
        setSelectedReviewers([]);
      }
    } catch (error) {
      console.error('🔥 [CreatePRModal] Failed to create PR:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectMerge = async () => {
    try {
      setIsLoading(true);
      
      const result = await directMergeMutation.mutateAsync({
        sourceBranchId,
        targetBranchId,
        message: title || `Merge ${sourceBranch?.name} into ${targetBranch?.name}`,
        strategy: mergeStrategy
      });
      
      if (result.success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Direct merge failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { title: 'Basic Info', description: 'Branch selection and PR details' },
    { title: 'Reviewers', description: 'Select reviewers and settings' },
    { title: 'Review', description: 'Review and create PR' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Create Pull Request
          </DialogTitle>
          <DialogDescription>
            Create a pull request to merge your changes with review and approval
          </DialogDescription>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex items-center gap-2 py-4">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className={`flex items-center gap-2 ${
                index === currentStep ? 'text-blue-600' : 
                index < currentStep ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === currentStep ? 'bg-blue-100 border-2 border-blue-600' :
                  index < currentStep ? 'bg-green-100 border-2 border-green-600' :
                  'bg-muted border-2 border-muted-foreground'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        <ScrollArea className="flex-1 py-4">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Branch Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="space-y-2">
                    <Label>Source Branch (merge from)</Label>
                    <Select value={sourceBranchId} onValueChange={setSourceBranchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-4 w-4" />
                              <span>{branch.name}</span>
                              {branch.changeCount && branch.changeCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {branch.changeCount} changes
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="space-y-2">
                    <Label>Target Branch (merge into)</Label>
                    <Select value={targetBranchId} onValueChange={setTargetBranchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranches.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-4 w-4" />
                              <span>{branch.name}</span>
                              {branch.isDefault && (
                                <Badge variant="outline" className="text-xs">default</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* PR Details */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Pull Request Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief description of your changes"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <TextArea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed description of what changed and why..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="draft"
                      checked={isDraft}
                      onCheckedChange={setIsDraft}
                    />
                    <Label htmlFor="draft" className="text-sm">
                      Create as draft (not ready for review)
                    </Label>
                  </div>
                </div>

                {/* Change Preview */}
                {changePreview && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-medium mb-3">Change Preview</h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">+{changePreview.addedCount}</div>
                        <div className="text-muted-foreground">Added</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{changePreview.modifiedCount}</div>
                        <div className="text-muted-foreground">Modified</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">-{changePreview.deletedCount}</div>
                        <div className="text-muted-foreground">Deleted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{changePreview.filesChanged}</div>
                        <div className="text-muted-foreground">Files</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Smart Reviewer Suggestions */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Smart Reviewer Suggestions</h3>
                    <Badge variant="secondary" className="text-xs">AI Powered</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {smartReviewers.map((suggestion) => (
                      <SmartReviewerCard
                        key={suggestion.userId}
                        suggestion={suggestion}
                        isSelected={selectedReviewers.includes(suggestion.userId)}
                        onToggle={handleReviewerToggle}
                      />
                    ))}
                  </div>
                </div>

                {/* Merge Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Merge Settings</h4>
                  
                  <div>
                    <Label>Merge Strategy</Label>
                    <RadioGroup value={mergeStrategy} onValueChange={setMergeStrategy} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MERGE_COMMIT" id="merge-commit" />
                        <Label htmlFor="merge-commit">Create merge commit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="SQUASH" id="squash" />
                        <Label htmlFor="squash">Squash and merge</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="REBASE" id="rebase" />
                        <Label htmlFor="rebase">Rebase and merge</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-merge"
                      checked={autoMerge}
                      onCheckedChange={setAutoMerge}
                    />
                    <Label htmlFor="auto-merge" className="text-sm">
                      Enable auto-merge when approved
                    </Label>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* PR Summary */}
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <h4 className="font-medium mb-3">Pull Request Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Title:</span>
                      <span className="font-medium">{title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source → Target:</span>
                      <span>{sourceBranch?.name} → {targetBranch?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reviewers:</span>
                      <span>{selectedReviewers.length} selected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{isDraft ? 'Draft PR' : 'Ready for Review'}</span>
                    </div>
                  </div>
                </div>

                {/* Impact Analysis */}
                {impactAnalysis && (
                  <div>
                    <h4 className="font-medium mb-3">Impact Analysis</h4>
                    <ImpactAnalysisDisplay analysis={impactAnalysis} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading}
            >
              Back
            </Button>
            
            {currentStep < 2 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
              >
                Next
              </Button>
            ) : (
              <div className="flex gap-2">
                {(prMode === 'OPTIONAL' || prMode === 'DISABLED') && (
                  <Button
                    variant="outline"
                    onClick={handleDirectMerge}
                    disabled={isLoading}
                    className="border-dashed"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Direct Merge
                  </Button>
                )}
                
                <Button
                  onClick={handleCreatePR}
                  disabled={!canProceed() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Creating...' : 'Create Pull Request'}
                </Button>
              </div>
            )}
          </div>
          
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePRModal;
