'use client';

/**
 * Merge Modal - Comprehensive Merge Interface
 * 
 * Features:
 * - Branch selection with change preview
 * - Selective change management (cherry-picking)
 * - Conflict detection and resolution
 * - Multiple merge strategies
 * - Merge preview and confirmation
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GitMerge, 
  GitBranch, 
  Clock, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  Edit,
  Eye,
  Filter,
  ArrowRight,
  GitCommit,
  Zap
} from 'lucide-react';
import { useActionMutation } from '@/hooks/use-action-api';
import { formatDistanceToNow } from 'date-fns';
import { ChangeHistoryModal } from './change-history-modal';
import { useBranchContext } from '@/lib/branching/branch-provider';

// ============================================================================
// TYPES
// ============================================================================

interface MergeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceBranchId?: string;
  sourceBranchName?: string;
  targetBranchId?: string;
  targetBranchName?: string;
}

interface Branch {
  id: string;
  name: string;
  isDefault: boolean;
  changeCount?: number;
  lastActivityAt?: string;
}

interface MergeChange {
  entityId: string;
  entityType: string;
  entityName?: string;
  changeType: 'ADDED' | 'MODIFIED' | 'DELETED';
  conflictType?: 'FIELD_CONFLICT' | 'DELETION_CONFLICT' | 'CREATION_CONFLICT';
  hasConflict: boolean;
  sourceBranchValue?: any;
  targetBranchValue?: any;
  preview?: string;
}

interface MergeConflict {
  entityType: string;
  entityId: string;
  field: string;
  sourceValue: any;
  targetValue: any;
  conflictType: 'FIELD_CONFLICT' | 'DELETION_CONFLICT' | 'CREATION_CONFLICT';
  resolution?: 'SOURCE' | 'TARGET' | 'MANUAL';
  manualValue?: any;
}

type MergeStrategy = 
  | 'AUTO'              // Automatic merge with conflict detection
  | 'FAST_FORWARD'      // Fast-forward merge (when possible)
  | 'THREE_WAY'         // Standard three-way merge
  | 'SQUASH'            // Squash all changes into single commit
  | 'SELECTIVE';        // Cherry-pick selected changes only

type ConflictResolution = 
  | 'ABORT_ON_CONFLICT' // Stop merge if conflicts detected
  | 'MANUAL'            // Require manual resolution
  | 'FAVOR_SOURCE'      // Auto-resolve favoring source branch
  | 'FAVOR_TARGET';     // Auto-resolve favoring target branch

interface MergeStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

const BranchSelectionStep: React.FC<{
  availableBranches: Branch[];
  sourceBranchId: string | null;
  targetBranchId: string | null;
  onSourceBranchChange: (branchId: string) => void;
  onTargetBranchChange: (branchId: string) => void;
  mergePreview: any;
}> = ({ 
  availableBranches, 
  sourceBranchId, 
  targetBranchId, 
  onSourceBranchChange, 
  onTargetBranchChange,
  mergePreview 
}) => {
  const sourceBranch = availableBranches.find(b => b.id === sourceBranchId);
  const targetBranch = availableBranches.find(b => b.id === targetBranchId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <GitMerge className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Select Branches to Merge</h3>
      </div>
      
      {/* Branch Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Source Branch */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Source Branch (merge from)</Label>
          <Select value={sourceBranchId || ''} onValueChange={onSourceBranchChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select source branch" />
            </SelectTrigger>
            <SelectContent>
              {availableBranches
                .filter(branch => branch.id !== targetBranchId)
                .map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      <span>{branch.name}</span>
                      {branch.isDefault && (
                        <Badge variant="outline" className="text-xs">default</Badge>
                      )}
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

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Target Branch */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Target Branch (merge into)</Label>
          <Select value={targetBranchId || ''} onValueChange={onTargetBranchChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select target branch" />
            </SelectTrigger>
            <SelectContent>
              {availableBranches
                .filter(branch => branch.id !== sourceBranchId)
                .map(branch => (
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

      {/* Branch Details */}
      {sourceBranch && targetBranch && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Source: {sourceBranch.name}</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                <span>{sourceBranch.changeCount || 0} changes</span>
              </div>
              {sourceBranch.lastActivityAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Last updated {formatDistanceToNow(new Date(sourceBranch.lastActivityAt), { addSuffix: true })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Target: {targetBranch.name}</h4>
            <div className="space-y-1 text-sm text-green-700">
              <div className="flex items-center gap-2">
                <GitBranch className="h-3 w-3" />
                <span>{targetBranch.isDefault ? 'Default branch' : 'Development branch'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Ready to receive changes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge Preview */}
      {mergePreview && (
        <div className="p-4 bg-muted/50 rounded-lg border">
          <h4 className="font-medium mb-2">Merge Preview</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{mergePreview.addedCount || 0}</div>
              <div className="text-muted-foreground">Added</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{mergePreview.modifiedCount || 0}</div>
              <div className="text-muted-foreground">Modified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{mergePreview.deletedCount || 0}</div>
              <div className="text-muted-foreground">Deleted</div>
            </div>
          </div>
          
          {mergePreview.conflicts && mergePreview.conflicts.length > 0 && (
            <Alert className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{mergePreview.conflicts.length} conflicts detected</strong> that will need resolution.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

const SelectiveChangesStep: React.FC<{
  changes: MergeChange[];
  selectedChanges: string[];
  onChangeToggle: (changeId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}> = ({ changes, selectedChanges, onChangeToggle, onSelectAll, onDeselectAll }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'ADDED' | 'MODIFIED' | 'DELETED' | 'CONFLICTS'>('ALL');
  const [expandedChange, setExpandedChange] = useState<string | null>(null);

  const filteredChanges = useMemo(() => {
    return changes.filter(change => {
      switch (filterType) {
        case 'ADDED': return change.changeType === 'ADDED';
        case 'MODIFIED': return change.changeType === 'MODIFIED';
        case 'DELETED': return change.changeType === 'DELETED';
        case 'CONFLICTS': return change.hasConflict;
        default: return true;
      }
    });
  }, [changes, filterType]);

  const selectedCount = selectedChanges.length;
  const totalCount = changes.length;
  const conflictCount = changes.filter(c => c.hasConflict).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Select Changes to Include</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={onDeselectAll}>
            Deselect All
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b">
        {[
          { key: 'ALL', label: 'All Changes', count: totalCount },
          { key: 'ADDED', label: 'Added', count: changes.filter(c => c.changeType === 'ADDED').length },
          { key: 'MODIFIED', label: 'Modified', count: changes.filter(c => c.changeType === 'MODIFIED').length },
          { key: 'DELETED', label: 'Deleted', count: changes.filter(c => c.changeType === 'DELETED').length },
          { key: 'CONFLICTS', label: 'Conflicts', count: conflictCount }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key as any)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              filterType === tab.key 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Selection Summary */}
      <div className="p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center justify-between text-sm">
          <span>Selected: <strong>{selectedCount}</strong> of <strong>{totalCount}</strong> changes</span>
          {conflictCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {conflictCount} conflicts need resolution
            </Badge>
          )}
        </div>
      </div>

      {/* Changes List */}
      <ScrollArea className="h-64 border rounded-lg">
        <div className="p-4 space-y-2">
          {filteredChanges.map((change) => (
            <div key={change.entityId} className="border rounded-lg overflow-hidden">
              {/* Change Header */}
              <div className="flex items-center gap-3 p-3 hover:bg-muted/50">
                <Checkbox
                  checked={selectedChanges.includes(change.entityId)}
                  onCheckedChange={() => onChangeToggle(change.entityId)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant={
                        change.changeType === 'ADDED' ? 'default' :
                        change.changeType === 'MODIFIED' ? 'secondary' : 
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {change.changeType}
                    </Badge>
                    
                    <span className="font-medium truncate">
                      {change.entityName || change.entityId}
                    </span>
                    
                    <span className="text-xs text-muted-foreground">
                      {change.entityType}
                    </span>
                    
                    {change.hasConflict && (
                      <Badge variant="destructive" className="text-xs">
                        Conflict
                      </Badge>
                    )}
                  </div>
                  
                  {change.preview && (
                    <p className="text-xs text-muted-foreground truncate">
                      {change.preview}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {/* 🏆 GOLD STANDARD: View Changes Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChangeHistoryModal({
                      isOpen: true,
                      entityId: change.entityId,
                      entityType: change.entityType,
                      entityName: change.entityName || change.entityId
                    })}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Changes
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedChange(
                      expandedChange === change.entityId ? null : change.entityId
                    )}
                  >
                    {expandedChange === change.entityId ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Expanded Details */}
              {expandedChange === change.entityId && (
                <div className="border-t bg-muted/20 p-3">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Entity ID:</span> {change.entityId}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {change.entityType}
                    </div>
                    {change.hasConflict && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700">
                        <div className="font-medium">Conflict Details:</div>
                        <div>Type: {change.conflictType}</div>
                        {change.sourceBranchValue && (
                          <div>Source: {JSON.stringify(change.sourceBranchValue)}</div>
                        )}
                        {change.targetBranchValue && (
                          <div>Target: {JSON.stringify(change.targetBranchValue)}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {filteredChanges.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No changes match the current filter</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const MergeStrategyStep: React.FC<{
  strategy: MergeStrategy;
  onStrategyChange: (strategy: MergeStrategy) => void;
  conflictResolution: ConflictResolution;
  onConflictResolutionChange: (resolution: ConflictResolution) => void;
  hasConflicts: boolean;
  canFastForward: boolean;
}> = ({ 
  strategy, 
  onStrategyChange, 
  conflictResolution, 
  onConflictResolutionChange,
  hasConflicts,
  canFastForward 
}) => {
  const strategies = [
    {
      value: 'AUTO' as MergeStrategy,
      label: 'Automatic Merge',
      description: 'Let the system choose the best merge strategy',
      icon: Zap,
      recommended: true,
      disabled: false
    },
    {
      value: 'FAST_FORWARD' as MergeStrategy,
      label: 'Fast-Forward Merge',
      description: 'Simple fast-forward when no divergent changes exist',
      icon: ArrowRight,
      recommended: false,
      disabled: !canFastForward
    },
    {
      value: 'THREE_WAY' as MergeStrategy,
      label: 'Three-Way Merge',
      description: 'Standard merge creating a merge commit',
      icon: GitMerge,
      recommended: false,
      disabled: false
    },
    {
      value: 'SQUASH' as MergeStrategy,
      label: 'Squash Merge',
      description: 'Combine all changes into a single commit',
      icon: GitCommit,
      recommended: false,
      disabled: false
    },
    {
      value: 'SELECTIVE' as MergeStrategy,
      label: 'Selective Merge',
      description: 'Only merge the changes you selected',
      icon: CheckCircle,
      recommended: false,
      disabled: false
    }
  ];

  const resolutionOptions = [
    {
      value: 'MANUAL' as ConflictResolution,
      label: 'Manual Resolution',
      description: 'Resolve conflicts manually (recommended)'
    },
    {
      value: 'ABORT_ON_CONFLICT' as ConflictResolution,
      label: 'Abort on Conflict',
      description: 'Stop merge if any conflicts are detected'
    },
    {
      value: 'FAVOR_SOURCE' as ConflictResolution,
      label: 'Favor Source Branch',
      description: 'Automatically use source branch values for conflicts'
    },
    {
      value: 'FAVOR_TARGET' as ConflictResolution,
      label: 'Favor Target Branch',
      description: 'Automatically use target branch values for conflicts'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <GitMerge className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Choose Merge Strategy</h3>
      </div>
      
      <RadioGroup value={strategy} onValueChange={onStrategyChange}>
        <div className="space-y-3">
          {strategies.map((strategyOption) => {
            const Icon = strategyOption.icon;
            return (
              <div key={strategyOption.value} className={`flex items-start space-x-3 ${
                strategyOption.disabled ? 'opacity-50' : ''
              }`}>
                <RadioGroupItem 
                  value={strategyOption.value} 
                  id={strategyOption.value}
                  className="mt-1"
                  disabled={strategyOption.disabled}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={strategyOption.value}
                    className={`flex items-center gap-2 ${
                      strategyOption.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{strategyOption.label}</span>
                    {strategyOption.recommended && (
                      <Badge variant="default" className="text-xs">Recommended</Badge>
                    )}
                    {strategyOption.disabled && (
                      <Badge variant="secondary" className="text-xs">Not Available</Badge>
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

      {/* Conflict Resolution Strategy */}
      {hasConflicts && (
        <>
          <Separator />
          
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Conflict Resolution Strategy
            </h4>
            
            <RadioGroup value={conflictResolution} onValueChange={onConflictResolutionChange}>
              <div className="space-y-3">
                {resolutionOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem 
                      value={option.value} 
                      id={`resolution-${option.value}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`resolution-${option.value}`}
                        className="cursor-pointer"
                      >
                        <span className="font-medium">{option.label}</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </>
      )}
    </div>
  );
};

const MergeConfirmationStep: React.FC<{
  sourceBranchName: string;
  targetBranchName: string;
  strategy: MergeStrategy;
  selectedChanges: string[];
  totalChanges: number;
  hasConflicts: boolean;
  conflictResolution: ConflictResolution;
  message: string;
  onMessageChange: (message: string) => void;
}> = ({ 
  sourceBranchName, 
  targetBranchName, 
  strategy, 
  selectedChanges, 
  totalChanges,
  hasConflicts,
  conflictResolution,
  message, 
  onMessageChange 
}) => {
  const isSelective = strategy === 'SELECTIVE';
  const affectedCount = isSelective ? selectedChanges.length : totalChanges;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <GitMerge className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold">Confirm Merge</h3>
      </div>
      
      {/* Merge Summary */}
      <div className="p-4 bg-muted/50 rounded-lg border">
        <h4 className="font-medium mb-2">Merge Summary:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Source Branch:</span>
            <span className="font-medium">{sourceBranchName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target Branch:</span>
            <span className="font-medium">{targetBranchName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Strategy:</span>
            <span>{strategy.replace(/_/g, ' ').toLowerCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Changes to merge:</span>
            <span>{affectedCount} of {totalChanges}</span>
          </div>
          {hasConflicts && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conflict resolution:</span>
              <span>{conflictResolution.replace(/_/g, ' ').toLowerCase()}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Commit Message */}
      <div>
        <Label htmlFor="merge-message" className="text-sm font-medium">
          Merge Commit Message
        </Label>
        <TextArea
          id="merge-message"
          placeholder={`Merge ${sourceBranchName} into ${targetBranchName}`}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="mt-2"
          rows={3}
        />
      </div>
      
      {/* Warnings */}
      {hasConflicts && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Conflicts detected:</strong> This merge contains conflicts that will be resolved using the {conflictResolution.replace(/_/g, ' ').toLowerCase()} strategy.
          </AlertDescription>
        </Alert>
      )}
      
      {isSelective && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Selective merge:</strong> Only {selectedChanges.length} of {totalChanges} changes will be merged.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MergeModal: React.FC<MergeModalProps> = ({
  open,
  onOpenChange,
  sourceBranchId: initialSourceBranchId,
  sourceBranchName: initialSourceBranchName,
  targetBranchId: initialTargetBranchId,
  targetBranchName: initialTargetBranchName
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [sourceBranchId, setSourceBranchId] = useState<string | null>(initialSourceBranchId || null);
  const [targetBranchId, setTargetBranchId] = useState<string | null>(initialTargetBranchId || null);
  const [mergePreview, setMergePreview] = useState<any>(null);
  const [changes, setChanges] = useState<MergeChange[]>([]);
  const [selectedChanges, setSelectedChanges] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<MergeStrategy>('AUTO');
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>('MANUAL');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 🏆 GOLD STANDARD: Change history modal state
  const [changeHistoryModal, setChangeHistoryModal] = useState<{
    isOpen: boolean;
    entityId: string;
    entityType: string;
    entityName: string;
  }>({
    isOpen: false,
    entityId: '',
    entityType: '',
    entityName: ''
  });

  // Context
  const branchContext = useBranchContext();
  
  // Mutations
  const getMergePreviewMutation = useActionMutation('branches.getMergePreview');
  const mergeBranchesMutation = useActionMutation('branches.merge');
  const getBranchesMutation = useActionMutation('branches.list');
  
  // Debug mutation state
  console.log('🔍 [MergeModal] Mutation states:', {
    getMergePreviewMutation: {
      isLoading: getMergePreviewMutation.isLoading,
      isError: getMergePreviewMutation.isError,
      error: getMergePreviewMutation.error,
      data: getMergePreviewMutation.data,
      isSuccess: getMergePreviewMutation.isSuccess
    }
  });

  // Steps configuration
  const steps: MergeStep[] = [
    {
      id: 'select-branches',
      title: 'Select Branches',
      description: 'Choose source and target branches',
      component: BranchSelectionStep
    },
    {
      id: 'select-changes',
      title: 'Select Changes',
      description: 'Choose which changes to include',
      component: SelectiveChangesStep
    },
    {
      id: 'merge-strategy',
      title: 'Merge Strategy',
      description: 'Choose how to perform the merge',
      component: MergeStrategyStep
    },
    {
      id: 'confirm',
      title: 'Confirm',
      description: 'Review and confirm the merge',
      component: MergeConfirmationStep
    }
  ];

  // Load branches and preview when modal opens
  useEffect(() => {
    console.log('🔍 [MergeModal] useEffect triggered:', {
      open,
      sourceBranchId,
      targetBranchId,
      willLoadPreview: !!(sourceBranchId && targetBranchId)
    });
    
    if (open) {
      loadBranches();
      if (sourceBranchId && targetBranchId) {
        console.log('🔍 [MergeModal] Calling loadMergePreview');
        loadMergePreview();
      } else {
        console.log('🔍 [MergeModal] Not calling loadMergePreview - missing branch IDs');
      }
    }
  }, [open, sourceBranchId, targetBranchId]);

  const loadBranches = async () => {
    try {
      const result = await getBranchesMutation.mutateAsync({});
      if (result.success) {
        setAvailableBranches(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const loadMergePreview = async () => {
    console.log('🔍 [MergeModal] loadMergePreview called:', {
      sourceBranchId,
      targetBranchId,
      hasSourceBranch: !!sourceBranchId,
      hasTargetBranch: !!targetBranchId
    });
    
    if (!sourceBranchId || !targetBranchId) {
      console.log('🔍 [MergeModal] Early return - missing branch IDs');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔍 [MergeModal] Calling getMergePreviewMutation.mutateAsync');
      
      console.log('🔍 [MergeModal] About to call getMergePreviewMutation with action: branches.getMergePreview');
      console.log('🔍 [MergeModal] Mutation function exists:', typeof getMergePreviewMutation.mutateAsync);
      console.log('🔍 [MergeModal] Mutation state before call:', {
        isLoading: getMergePreviewMutation.isLoading,
        isError: getMergePreviewMutation.isError,
        data: getMergePreviewMutation.data
      });
      
      const result = await getMergePreviewMutation.mutateAsync({
        sourceBranchId,
        targetBranchId
      });
      
      console.log('🔍 [MergeModal] mutateAsync completed successfully');
      
      console.log('🔍 [MergeModal] getMergePreview result:', result);
      console.log('🔍 [MergeModal] Result data details:', {
        success: result.success,
        dataType: typeof result.data,
        dataIsArray: Array.isArray(result.data),
        dataLength: result.data?.length,
        dataKeys: result.data ? Object.keys(result.data) : [],
        firstItem: result.data?.[0]
      });
      
      if (result.success) {
        setMergePreview(result.data);
        
        // Handle both array format and object format
        let changes = [];
        if (Array.isArray(result.data)) {
          // If data is an array, it contains the changes directly
          changes = result.data;
        } else if (result.data?.changes) {
          // If data is an object with changes property
          changes = result.data.changes;
        }
        
        console.log('🔍 [MergeModal] Setting changes:', {
          changesCount: changes.length,
          changes: changes
        });
        
        setChanges(changes);
        setSelectedChanges(changes.map((c: any) => c.entityId));
      }
    } catch (error) {
      console.error('Failed to load merge preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sourceBranch = availableBranches.find(b => b.id === sourceBranchId);
  const targetBranch = availableBranches.find(b => b.id === targetBranchId);
  const hasConflicts = changes.some(c => c.hasConflict);
  const canFastForward = mergePreview?.canAutoMerge && !hasConflicts;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return sourceBranchId && targetBranchId;
      case 1: return selectedChanges.length > 0;
      case 2: return strategy !== null;
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

  const handleChangeToggle = (changeId: string) => {
    setSelectedChanges(prev => 
      prev.includes(changeId)
        ? prev.filter(id => id !== changeId)
        : [...prev, changeId]
    );
  };

  const handleSelectAll = () => {
    setSelectedChanges(changes.map(c => c.entityId));
  };

  const handleDeselectAll = () => {
    setSelectedChanges([]);
  };

  const handleMerge = async () => {
    if (!sourceBranchId || !targetBranchId) return;

    try {
      setIsLoading(true);
      
      const result = await mergeBranchesMutation.mutateAsync({
        sourceBranchId,
        targetBranchId,
        strategy,
        conflictResolution,
        message: message || `Merge ${sourceBranch?.name} into ${targetBranch?.name}`,
        selectedChanges: strategy === 'SELECTIVE' ? selectedChanges : undefined
      });
      
      if (result.success) {
        onOpenChange(false);
        // Reset state
        setCurrentStep(0);
        setSourceBranchId(null);
        setTargetBranchId(null);
        setSelectedChanges([]);
        setStrategy('AUTO');
        setMessage('');
      }
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const StepComponent = step.component;
    
    switch (step.id) {
      case 'select-branches':
        return (
          <StepComponent
            availableBranches={availableBranches}
            sourceBranchId={sourceBranchId}
            targetBranchId={targetBranchId}
            onSourceBranchChange={setSourceBranchId}
            onTargetBranchChange={setTargetBranchId}
            mergePreview={mergePreview}
          />
        );
      case 'select-changes':
        return (
          <StepComponent
            changes={changes}
            selectedChanges={selectedChanges}
            onChangeToggle={handleChangeToggle}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        );
      case 'merge-strategy':
        return (
          <StepComponent
            strategy={strategy}
            onStrategyChange={setStrategy}
            conflictResolution={conflictResolution}
            onConflictResolutionChange={setConflictResolution}
            hasConflicts={hasConflicts}
            canFastForward={canFastForward}
          />
        );
      case 'confirm':
        return (
          <StepComponent
            sourceBranchName={sourceBranch?.name || ''}
            targetBranchName={targetBranch?.name || ''}
            strategy={strategy}
            selectedChanges={selectedChanges}
            totalChanges={changes.length}
            hasConflicts={hasConflicts}
            conflictResolution={conflictResolution}
            message={message}
            onMessageChange={setMessage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Merge Branches
          </DialogTitle>
          <DialogDescription>
            Merge changes from one branch into another with selective control
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
                onClick={handleMerge}
                disabled={!canProceed() || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Merging...' : 'Confirm Merge'}
              </Button>
            )}
          </div>
          
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* 🏆 GOLD STANDARD: Change History Modal */}
      <ChangeHistoryModal
        isOpen={changeHistoryModal.isOpen}
        onClose={() => setChangeHistoryModal(prev => ({ ...prev, isOpen: false }))}
        entityId={changeHistoryModal.entityId}
        entityType={changeHistoryModal.entityType}
        entityName={changeHistoryModal.entityName}
        tenantId={branchContext?.tenantId || ''}
        branchId={sourceBranchId || ''}
      />
    </Dialog>
  );
};

export default MergeModal;
