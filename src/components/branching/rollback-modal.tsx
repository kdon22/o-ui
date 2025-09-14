'use client';

/**
 * Rollback Modal - Comprehensive Rollback Interface
 * 
 * Features:
 * - Commit selection with merge history
 * - Entity-level selective rollback
 * - Multiple rollback strategies
 * - Preview of affected changes
 * - Rollback confirmation and execution
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TextArea } from '@/components/ui/text-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Undo2, 
  GitCommit, 
  Clock, 
  User, 
  FileText, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useActionMutation } from '@/hooks/use-action-api';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface RollbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName: string;
}

interface MergeEvent {
  id: string;
  sha: string;
  message: string;
  sourceBranchId: string;
  authorName: string;
  createdAt: string;
  affectedEntities: AffectedEntity[];
  canRevert: boolean;
  blockers?: string[];
}

interface AffectedEntity {
  entityType: string;
  entityId: string;
  changeType: 'ADDED' | 'MODIFIED' | 'DELETED';
  entityName?: string;
  conflictResolution?: string;
}

type RollbackStrategy = 
  | 'CREATE_REVERT_COMMIT'      // Git-style: create new commit that undoes changes
  | 'DIRECT_ROLLBACK'           // Direct: actually delete/modify existing data
  | 'SELECTIVE_REVERT'          // Only revert specific entities
  | 'RESTORE_TO_POINT';         // Restore branch to specific point in time

interface RollbackStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

const CommitSelectionStep: React.FC<{
  mergeEvents: MergeEvent[];
  selectedCommit: string | null;
  onCommitSelect: (commitId: string) => void;
}> = ({ mergeEvents, selectedCommit, onCommitSelect }) => {
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <GitCommit className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Select Commit to Rollback</h3>
      </div>
      
      <ScrollArea className="h-64 border rounded-lg">
        <div className="p-4 space-y-3">
          {mergeEvents.map((event) => (
            <div key={event.id} className="border rounded-lg overflow-hidden">
              {/* Commit Header */}
              <div 
                className={`p-3 cursor-pointer transition-colors ${
                  selectedCommit === event.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onCommitSelect(event.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedCommit === event.id 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-muted-foreground'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{event.message}</span>
                      <Badge variant="outline" className="text-xs">
                        {event.sha.substring(0, 7)}
                      </Badge>
                      {!event.canRevert && (
                        <Badge variant="destructive" className="text-xs">
                          Cannot Revert
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {event.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {event.affectedEntities.length} changes
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCommit(
                        expandedCommit === event.id ? null : event.id
                      );
                    }}
                  >
                    {expandedCommit === event.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Blockers */}
                {event.blockers && event.blockers.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <div className="flex items-center gap-1 text-red-600 mb-1">
                      <XCircle className="h-3 w-3" />
                      Cannot rollback:
                    </div>
                    <ul className="text-red-600 ml-4">
                      {event.blockers.map((blocker, idx) => (
                        <li key={idx}>• {blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Expanded Details */}
              {expandedCommit === event.id && (
                <div className="border-t bg-muted/20 p-3">
                  <h4 className="font-medium text-sm mb-2">Affected Entities:</h4>
                  <div className="space-y-1">
                    {event.affectedEntities.map((entity, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <Badge 
                          variant={
                            entity.changeType === 'ADDED' ? 'default' :
                            entity.changeType === 'MODIFIED' ? 'secondary' : 
                            'destructive'
                          }
                          className="text-xs"
                        >
                          {entity.changeType}
                        </Badge>
                        <span className="text-muted-foreground">{entity.entityType}</span>
                        <span>{entity.entityName || entity.entityId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {mergeEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <GitCommit className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No rollbackable commits found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const StrategySelectionStep: React.FC<{
  strategy: RollbackStrategy;
  onStrategyChange: (strategy: RollbackStrategy) => void;
  selectedCommit: MergeEvent | null;
}> = ({ strategy, onStrategyChange, selectedCommit }) => {
  const strategies = [
    {
      value: 'CREATE_REVERT_COMMIT' as RollbackStrategy,
      label: 'Create Revert Commit',
      description: 'Git-style: Create a new commit that undoes the changes (recommended)',
      icon: GitCommit,
      recommended: true
    },
    {
      value: 'SELECTIVE_REVERT' as RollbackStrategy,
      label: 'Selective Revert',
      description: 'Only revert specific entities from the commit',
      icon: CheckCircle,
      recommended: false
    },
    {
      value: 'DIRECT_ROLLBACK' as RollbackStrategy,
      label: 'Direct Rollback',
      description: 'Directly delete/modify existing data (destructive)',
      icon: Database,
      recommended: false
    },
    {
      value: 'RESTORE_TO_POINT' as RollbackStrategy,
      label: 'Restore to Point',
      description: 'Restore branch to state before this commit',
      icon: Undo2,
      recommended: false
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Undo2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Choose Rollback Strategy</h3>
      </div>
      
      <RadioGroup value={strategy} onValueChange={onStrategyChange}>
        <div className="space-y-3">
          {strategies.map((strategyOption) => {
            const Icon = strategyOption.icon;
            return (
              <div key={strategyOption.value} className="flex items-start space-x-3">
                <RadioGroupItem 
                  value={strategyOption.value} 
                  id={strategyOption.value}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={strategyOption.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{strategyOption.label}</span>
                    {strategyOption.recommended && (
                      <Badge variant="default" className="text-xs">Recommended</Badge>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {strategyOption.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </RadioGroup>
      
      {selectedCommit && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This will affect <strong>{selectedCommit.affectedEntities.length} entities</strong> from 
            commit <code>{selectedCommit.sha.substring(0, 7)}</code> by {selectedCommit.authorName}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

const SelectiveRevertStep: React.FC<{
  selectedCommit: MergeEvent | null;
  selectedEntities: string[];
  onEntityToggle: (entityId: string) => void;
}> = ({ selectedCommit, selectedEntities, onEntityToggle }) => {
  const [selectAll, setSelectAll] = useState(false);
  
  const handleSelectAll = () => {
    if (!selectedCommit) return;
    
    if (selectAll) {
      // Deselect all
      selectedEntities.forEach(entityId => onEntityToggle(entityId));
    } else {
      // Select all
      selectedCommit.affectedEntities.forEach(entity => {
        if (!selectedEntities.includes(entity.entityId)) {
          onEntityToggle(entity.entityId);
        }
      });
    }
    setSelectAll(!selectAll);
  };

  if (!selectedCommit) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a commit first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Select Entities to Revert</h3>
        </div>
        
        <Button variant="outline" size="sm" onClick={handleSelectAll}>
          {selectAll ? 'Deselect All' : 'Select All'}
        </Button>
      </div>
      
      <ScrollArea className="h-64 border rounded-lg">
        <div className="p-4 space-y-3">
          {selectedCommit.affectedEntities.map((entity) => (
            <div key={entity.entityId} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
              <Checkbox
                id={entity.entityId}
                checked={selectedEntities.includes(entity.entityId)}
                onCheckedChange={() => onEntityToggle(entity.entityId)}
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant={
                      entity.changeType === 'ADDED' ? 'default' :
                      entity.changeType === 'MODIFIED' ? 'secondary' : 
                      'destructive'
                    }
                    className="text-xs"
                  >
                    {entity.changeType}
                  </Badge>
                  <span className="font-medium">{entity.entityName || entity.entityId}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {entity.entityType} • ID: {entity.entityId}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Selected <strong>{selectedEntities.length}</strong> of{' '}
          <strong>{selectedCommit.affectedEntities.length}</strong> entities will be reverted.
        </AlertDescription>
      </Alert>
    </div>
  );
};

const ConfirmationStep: React.FC<{
  selectedCommit: MergeEvent | null;
  strategy: RollbackStrategy;
  selectedEntities: string[];
  reason: string;
  onReasonChange: (reason: string) => void;
}> = ({ selectedCommit, strategy, selectedEntities, reason, onReasonChange }) => {
  if (!selectedCommit) return null;

  const isSelective = strategy === 'SELECTIVE_REVERT';
  const affectedCount = isSelective ? selectedEntities.length : selectedCommit.affectedEntities.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <h3 className="font-semibold">Confirm Rollback</h3>
      </div>
      
      {/* Summary */}
      <div className="p-4 bg-muted/50 rounded-lg border">
        <h4 className="font-medium mb-2">Rollback Summary:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commit:</span>
            <span className="font-mono">{selectedCommit.sha.substring(0, 7)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Strategy:</span>
            <span>{strategy.replace(/_/g, ' ').toLowerCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entities affected:</span>
            <span>{affectedCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Author:</span>
            <span>{selectedCommit.authorName}</span>
          </div>
        </div>
      </div>
      
      {/* Reason */}
      <div>
        <Label htmlFor="rollback-reason" className="text-sm font-medium">
          Rollback Reason (Optional)
        </Label>
        <TextArea
          id="rollback-reason"
          placeholder="Explain why you're rolling back this commit..."
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="mt-2"
          rows={3}
        />
      </div>
      
      {/* Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> This action cannot be undone. 
          {strategy === 'DIRECT_ROLLBACK' && (
            <span className="text-red-600"> Direct rollback will permanently modify your data.</span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RollbackModal: React.FC<RollbackModalProps> = ({
  open,
  onOpenChange,
  branchId,
  branchName
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mergeEvents, setMergeEvents] = useState<MergeEvent[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<RollbackStrategy>('CREATE_REVERT_COMMIT');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mutations
  const getRollbackableMutation = useActionMutation('rollback.list');
  const rollbackMutation = useActionMutation('rollback.merge');
  const selectiveRevertMutation = useActionMutation('rollback.selective');

  // Steps configuration
  const steps: RollbackStep[] = [
    {
      id: 'select-commit',
      title: 'Select Commit',
      description: 'Choose which commit to rollback',
      component: CommitSelectionStep
    },
    {
      id: 'select-strategy',
      title: 'Rollback Strategy',
      description: 'Choose how to perform the rollback',
      component: StrategySelectionStep
    },
    ...(strategy === 'SELECTIVE_REVERT' ? [{
      id: 'select-entities',
      title: 'Select Entities',
      description: 'Choose which entities to revert',
      component: SelectiveRevertStep
    }] : []),
    {
      id: 'confirm',
      title: 'Confirm',
      description: 'Review and confirm the rollback',
      component: ConfirmationStep
    }
  ];

  // Load rollbackable merges when modal opens
  useEffect(() => {
    if (open && branchId) {
      loadRollbackableMerges();
    }
  }, [open, branchId]);

  const loadRollbackableMerges = async () => {
    try {
      setIsLoading(true);
      const result = await getRollbackableMutation.mutateAsync({ 
        branchId, 
        limit: 20 
      });
      
      if (result.success) {
        setMergeEvents(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load rollbackable merges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCommitData = useMemo(() => {
    return mergeEvents.find(event => event.id === selectedCommit) || null;
  }, [mergeEvents, selectedCommit]);

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedCommit !== null;
      case 1: return strategy !== null;
      case 2: return strategy !== 'SELECTIVE_REVERT' || selectedEntities.length > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEntityToggle = (entityId: string) => {
    setSelectedEntities(prev => 
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const handleRollback = async () => {
    if (!selectedCommit) return;

    try {
      setIsLoading(true);
      
      let result;
      if (strategy === 'SELECTIVE_REVERT') {
        result = await selectiveRevertMutation.mutateAsync({
          mergeEventId: selectedCommit,
          selectedEntities,
          strategy,
          message: reason || `Selective revert of ${selectedEntities.length} entities`
        });
      } else {
        result = await rollbackMutation.mutateAsync({
          mergeEventId: selectedCommit,
          strategy,
          message: reason || `Rollback commit ${selectedCommitData?.sha.substring(0, 7)}`
        });
      }
      
      if (result.success) {
        onOpenChange(false);
        // Reset state
        setCurrentStep(0);
        setSelectedCommit(null);
        setStrategy('CREATE_REVERT_COMMIT');
        setSelectedEntities([]);
        setReason('');
      }
    } catch (error) {
      console.error('Rollback failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const StepComponent = step.component;
    
    switch (step.id) {
      case 'select-commit':
        return (
          <StepComponent
            mergeEvents={mergeEvents}
            selectedCommit={selectedCommit}
            onCommitSelect={setSelectedCommit}
          />
        );
      case 'select-strategy':
        return (
          <StepComponent
            strategy={strategy}
            onStrategyChange={setStrategy}
            selectedCommit={selectedCommitData}
          />
        );
      case 'select-entities':
        return (
          <StepComponent
            selectedCommit={selectedCommitData}
            selectedEntities={selectedEntities}
            onEntityToggle={handleEntityToggle}
          />
        );
      case 'confirm':
        return (
          <StepComponent
            selectedCommit={selectedCommitData}
            strategy={strategy}
            selectedEntities={selectedEntities}
            reason={reason}
            onReasonChange={setReason}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            Rollback Branch: {branchName}
          </DialogTitle>
          <DialogDescription>
            Rollback commits and restore your branch to a previous state
          </DialogDescription>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex items-center gap-2 py-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
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
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : (
            renderStepContent()
          )}
        </div>

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
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleRollback}
                disabled={!canProceed() || isLoading}
                variant="destructive"
              >
                {isLoading ? 'Rolling back...' : 'Confirm Rollback'}
              </Button>
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

export default RollbackModal;