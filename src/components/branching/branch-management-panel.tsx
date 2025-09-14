'use client';

/**
 * Branch Management Panel - Tabbed Interface with Rollback
 * 
 * Features:
 * - Tabbed interface (Overview, All Branches, History, Settings)
 * - Real-time branch statistics
 * - Quick actions (Switch, Merge, Rollback)
 * - Collaboration indicators
 * - Full rollback capability
 * - Search functionality
 */

import React, { useState, useMemo, useRef } from 'react';
import { GitBranch, Users, Clock, AlertTriangle, Undo2, GitMerge, Search, Plus, BarChart3, History, ChevronUp, ChevronDown, GitPullRequest, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { TabBar } from '@/components/ui/tab-bar';
import { useBranchContext } from '@/lib/branching/branch-provider';
import { useActionMutation, useActionQuery } from '@/hooks/use-action-api';
import { formatDistanceToNow } from 'date-fns';
import type { Branch } from '@/lib/branching/types';
import RollbackModal from './rollback-modal';
import MergeModal from './merge-modal';
import PRDashboard from '../pull-requests/pr-dashboard';
import CreatePRModal from '../pull-requests/create-pr-modal';
import { TextArea } from '@/components/ui/text-area';
import { BRANCH_SCHEMA } from '@/features/branches/branches.schema';

// ============================================================================
// SIMPLE BRANCH FORM (No AutoForm complexity)
// ============================================================================

interface SimpleBranchFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const SimpleBranchForm: React.FC<SimpleBranchFormProps> = ({ onSubmit, onCancel, isLoading }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      isDefault: false,
      isLocked: false
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Branch Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter branch name"
          required
          disabled={isLoading}
        />
      </div>
      
      <div>
        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter branch description"
          rows={3}
          disabled={isLoading}
        />
      </div>
      
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? 'Creating...' : 'Create Branch'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

// ============================================================================
// TYPES
// ============================================================================

interface BranchPanelProps {
  className?: string;
  // Slide-out panel mode
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Branch operation callbacks to prevent accidental closes
  onBranchOperationStart?: () => void;
  onBranchOperationEnd?: () => void;
}

type TabKey = 'branches' | 'pull-requests' | 'history';

const BRANCH_TABS = [
  { key: 'branches' as TabKey, label: 'All Branches', icon: GitBranch },
  { key: 'pull-requests' as TabKey, label: 'Pull Requests', icon: GitPullRequest },
  { key: 'history' as TabKey, label: 'History', icon: History },
];

interface BranchItemProps {
  branch: Branch;
  isCurrent: boolean;
  onSwitch: (branchId: string) => void;
  onMerge: (branchId: string) => void;
  onCreatePR: (branchId: string) => void;
  onRollback?: (branchId: string) => void;
  prMode?: 'DISABLED' | 'OPTIONAL' | 'REQUIRED';
}

// ============================================================================
// BRANCH ITEM COMPONENT
// ============================================================================

const BranchItem: React.FC<BranchItemProps> = ({ 
  branch, 
  isCurrent, 
  onSwitch, 
  onMerge, 
  onCreatePR,
  onRollback,
  prMode = 'OPTIONAL'
}) => {
  const hasChanges = (branch.changeCount || 0) > 0;
  const hasCollaborators = (branch.collaboratorIds?.length || 0) > 0;
  const isLocked = branch.isLocked;

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg border border-transparent hover:border-muted transition-all">
      {/* Branch Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate text-base">{branch.name}</span>
            
            {/* Status Badges */}
            <div className="flex items-center gap-1">
              {branch.isDefault && (
                <Badge variant="outline" className="text-xs">default</Badge>
              )}
              {isCurrent && (
                <Badge variant="default" className="text-xs">current</Badge>
              )}
              {isLocked && (
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">locked</Badge>
              )}
            </div>
          </div>
          
          {/* Activity Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {hasChanges && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {branch.changeCount} changes
              </span>
            )}
            
            {hasCollaborators && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {branch.collaboratorIds?.length} active
              </span>
            )}
            
            {branch.lastActivityAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(branch.lastActivityAt), { addSuffix: true })}
              </span>
            )}
            
            {/* Updated status */}
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Up to date
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isCurrent && !isLocked && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSwitch(branch.id)}
            className="h-8 px-3"
          >
            Switch
          </Button>
        )}
        
        {/* Show PR/Merge buttons based on PR mode */}
        {!branch.isDefault && (
          <>
            {prMode === 'REQUIRED' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreatePR(branch.id)}
                className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <GitPullRequest className="h-3 w-3 mr-1" />
                Create PR
              </Button>
            ) : prMode === 'OPTIONAL' ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCreatePR(branch.id)}
                  className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <GitPullRequest className="h-3 w-3 mr-1" />
                  Create PR
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMerge(branch.id)}
                  className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <GitMerge className="h-3 w-3 mr-1" />
                  Quick Merge
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMerge(branch.id)}
                className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <GitMerge className="h-3 w-3 mr-1" />
                Merge
              </Button>
            )}
          </>
        )}
        
        {/* Show Rollback button for non-default branches */}
        {onRollback && !branch.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRollback(branch.id)}
            className="h-8 px-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Rollback
          </Button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BranchManagementPanel: React.FC<BranchPanelProps> = ({ 
  className, 
  open, 
  onOpenChange,
  onBranchOperationStart,
  onBranchOperationEnd
}) => {
  
  const [activeTab, setActiveTab] = useState<TabKey>('branches');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [rollbackBranch, setRollbackBranch] = useState<{ id: string; name: string } | null>(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeBranch, setMergeBranch] = useState<{ id: string; name: string } | null>(null);
  const [createPRModalOpen, setCreatePRModalOpen] = useState(false);
  const [prBranch, setPRBranch] = useState<{ id: string; name: string } | null>(null);
  const [prMode, setPRMode] = useState<'DISABLED' | 'OPTIONAL' | 'REQUIRED'>('OPTIONAL');
  const [showCreateBranchForm, setShowCreateBranchForm] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const operationRef = useRef(false); // Immediate state tracking

  // ✅ BULLETPROOF: Always sync with external prop, operations control the handler
  React.useEffect(() => {
    setInternalOpen(open || false);
  }, [open]);
  
  const { 
    currentBranch, 
    defaultBranch, 
    availableBranches, 
    switchBranch, 
    createBranch,
    refreshBranches,
    isLoading,
    isSwitching,
    error 
  } = useBranchContext();

  // Simple branch creation mutation - NO operation state management
  const createBranchMutation = useActionMutation('branches.create', {
    onSuccess: () => {
      setShowCreateBranchForm(false);
      refreshBranches();
      refetchBranches();
    },
    onError: () => {
      setShowCreateBranchForm(false);
    }
  });
  
  // Query branches directly from action system for real-time updates
  const { data: actionBranches, refetch: refetchBranches, isLoading: isLoadingActionBranches } = useActionQuery('branches.list', {}, {
    enabled: true,
    staleTime: 30000, // 30 seconds
  });



  const mergeMutation = useActionMutation('branches.merge');
  const rollbackMutation = useActionMutation('branches.rollback');
  const getRollbackableMutation = useActionMutation('branches.getRollbackable');

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Merge branches from session and action system (action system takes priority)
  const allBranches = useMemo(() => {
    if (actionBranches?.data && Array.isArray(actionBranches.data)) {
      return actionBranches.data;
    }
    return availableBranches;
  }, [actionBranches?.data, availableBranches]);

  const stats = useMemo(() => {
    const total = allBranches.length;
    const active = allBranches.filter((b: Branch) => 
      (b.collaboratorIds?.length || 0) > 0 || 
      (b.changeCount || 0) > 0
    ).length;
    const locked = allBranches.filter((b: Branch) => b.isLocked).length;
    
    return { total, active, locked };
  }, [allBranches]);

  const filteredAndSortedBranches = useMemo(() => {
    let filtered = allBranches;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = allBranches.filter((branch: Branch) => 
        branch.name.toLowerCase().includes(query) ||
        branch.description?.toLowerCase().includes(query)
      );
    }
    
    // Sort branches
    return [...filtered].sort((a, b) => {
      // Current branch first
      if (a.id === currentBranch?.id) return -1;
      if (b.id === currentBranch?.id) return 1;
      
      // Default branch second
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      
      // Then by activity
      const aActivity = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bActivity = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      
      return bActivity - aActivity;
    });
  }, [allBranches, currentBranch?.id, searchQuery]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // ✅ BULLETPROOF: Block ALL close requests during operations
  const handlePanelOpenChange = (newOpen: boolean) => {
    // Block ANY close request during operations (both state and ref check)
    if (!newOpen && (operationInProgress || operationRef.current)) {
      return; // Completely ignore close requests during operations
    }
    
    onOpenChange?.(newOpen);
  };

  const handleSwitch = async (branchId: string) => {
    // Set operation flags IMMEDIATELY
    operationRef.current = true;
    setOperationInProgress(true);
    onBranchOperationStart?.();
    
    try {
      await switchBranch({ branchId });
    } catch (err) {
      console.error('Failed to switch branch:', err);
    } finally {
      operationRef.current = false;
      setOperationInProgress(false);
      onBranchOperationEnd?.();
    }
  };

  const handleMerge = (branchId: string) => {
    const branch = allBranches.find(b => b.id === branchId);
    if (branch) {
      setMergeBranch({ id: branchId, name: branch.name });
      setMergeModalOpen(true);
    }
  };

  const handleRollback = (branchId: string) => {
    const branch = allBranches.find(b => b.id === branchId);
    if (branch) {
      setRollbackBranch({ id: branchId, name: branch.name });
      setRollbackModalOpen(true);
    }
  };

  const handleCreatePR = (branchId: string) => {
    const branch = allBranches.find(b => b.id === branchId);
    if (branch) {
      setPRBranch({ id: branchId, name: branch.name });
      setCreatePRModalOpen(true);
    } else {
      console.error('Branch not found for PR creation:', { branchId, availableBranches: allBranches.length });
    }
  };

  const handleCreateBranch = () => {
    setShowCreateBranchForm(!showCreateBranchForm);
  };

  const handleBranchFormSubmit = async (data: any) => {
    // ✅ BULLETPROOF: Set both state and ref immediately
    operationRef.current = true;
    setOperationInProgress(true);
    setInternalOpen(true);
    onBranchOperationStart?.();
    
    try {
      await createBranchMutation.mutateAsync(data);
      
      // ✅ BULLETPROOF: Keep operation active for 2 seconds
      setTimeout(() => {
        operationRef.current = false;
        setOperationInProgress(false);
        onBranchOperationEnd?.();
      }, 2000);
      
    } catch (error) {
      console.error('Branch creation failed:', error);
      operationRef.current = false;
      setOperationInProgress(false);
      onBranchOperationEnd?.();
    }
  };

  // ============================================================================
  // TAB CONTENT COMPONENTS
  // ============================================================================



  const renderBranchesTab = () => (
    <div className="space-y-4">
      {/* Top Bar: Search + Create Branch */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleCreateBranch} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Branch
        </Button>
      </div>

      {/* Inline Create Branch Form */}
      {showCreateBranchForm && (
        <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Create New Branch
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateBranchForm(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div onClick={(e) => e.stopPropagation()}>
            <SimpleBranchForm
              onSubmit={handleBranchFormSubmit}
              onCancel={() => setShowCreateBranchForm(false)}
              isLoading={createBranchMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* Current Branch Card */}
      <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Current Branch
            </h3>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-lg">{currentBranch?.name || 'No Branch'}</span>
                {currentBranch?.isDefault && (
                  <Badge variant="outline" className="text-xs">default</Badge>
                )}
                <Badge variant="default" className="text-xs">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentBranch?.description || 'Main branch for Travel Cast'}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <span>Last updated {currentBranch?.updatedAt ? formatDistanceToNow(new Date(currentBranch.updatedAt), { addSuffix: true }) : '8/16/2025'}</span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Up to date
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Branch Statistics */}
      <div className="border rounded-lg">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium">Branch Statistics</span>
            <span className="text-xs text-muted-foreground">
              {stats.total} total • {stats.active} active • {stats.locked} locked
            </span>
          </div>
          {showStats ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {showStats && (
          <div className="p-4 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground mb-4">Overview of your workspace branches</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-background rounded-lg border">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Branches</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-xl font-bold text-green-600">{stats.active}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-xl font-bold text-orange-600">{stats.locked}</div>
                <div className="text-xs text-muted-foreground">Locked</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Branch List with Rollback */}
      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          All Branches
        </h3>
        
        <div className="space-y-1">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded mb-3">
              {error}
            </div>
          )}
          
          {filteredAndSortedBranches.map((branch) => (
            <BranchItem
              key={branch.id}
              branch={branch}
              isCurrent={branch.id === currentBranch?.id}
              onSwitch={handleSwitch}
              onMerge={handleMerge}
              onCreatePR={handleCreatePR}
              onRollback={handleRollback}
              prMode={prMode}
            />
          ))}
          
          {filteredAndSortedBranches.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No branches match your search' : 'No branches available'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPullRequestsTab = () => (
    <div className="space-y-4">
      <PRDashboard />
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Merge History & Rollbacks</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => currentBranch && handleRollback(currentBranch.id)}
          disabled={!currentBranch}
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Rollback Current Branch
        </Button>
      </div>
      
      <div className="p-4 bg-muted/50 rounded-lg border">
        <h4 className="font-medium mb-2">Quick Actions</h4>
        <div className="grid grid-cols-1 gap-2">
          {allBranches
            .filter(branch => !branch.isDefault)
            .slice(0, 5)
            .map(branch => (
              <div key={branch.id} className="flex items-center justify-between p-2 hover:bg-background rounded border">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{branch.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {branch.changeCount || 0} changes
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRollback(branch.id)}
                  className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  Rollback
                </Button>
              </div>
            ))}
        </div>
        
        {allBranches.filter(b => !b.isDefault).length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No development branches with rollback history</p>
          </div>
        )}
      </div>
      
      <div className="text-center py-6 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm mb-2">Full merge history and advanced rollback options</p>
        <p className="text-xs">Click "Rollback" on any branch to see detailed commit history and selective rollback options</p>
      </div>
    </div>
  );



  const renderTabContent = () => {
    switch (activeTab) {
      case 'branches':
        return renderBranchesTab();
      case 'pull-requests':
        return renderPullRequestsTab();
      case 'history':
        return renderHistoryTab();
      default:
        return renderBranchesTab();
    }
  };



  // ============================================================================
  // RENDER
  // ============================================================================


  // TEMPORARY DEBUG: Skip loading state to test if that's the issue
  if (false && isLoading) {
    
    const loadingContent = (
      <div className="flex items-center gap-2 p-4">
        <GitBranch className="h-4 w-4 animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading branches...</span>
      </div>
    );

    return (
      <>
        <Sheet open={operationInProgress ? internalOpen : open} onOpenChange={handlePanelOpenChange}>
          <SheetContent>
            {loadingContent}
          </SheetContent>
        </Sheet>
        
        {/* Rollback Modal */}
        {rollbackBranch && (
          <RollbackModal
            open={rollbackModalOpen}
            onOpenChange={setRollbackModalOpen}
            branchId={rollbackBranch?.id || ''}
            branchName={rollbackBranch?.name || ''}
          />
        )}
        
        {/* Merge Modal */}
        {mergeBranch && (
          <MergeModal
            open={mergeModalOpen}
            onOpenChange={setMergeModalOpen}
            sourceBranchId={mergeBranch?.id || ''}
            sourceBranchName={mergeBranch?.name || ''}
            targetBranchId={defaultBranch?.id}
            targetBranchName={defaultBranch?.name}
          />
        )}
        
        {/* Create PR Modal */}
        {prBranch && (
          <CreatePRModal
            open={createPRModalOpen}
            onOpenChange={setCreatePRModalOpen}
            sourceBranchId={prBranch?.id || ''}
            sourceBranchName={prBranch?.name || ''}
            targetBranchId={defaultBranch?.id}
            targetBranchName={defaultBranch?.name}
            prMode={prMode}
          />
        )}
      </>
    );
  }



  // Main render - Sheet mode only
  
  return (
    <>
      <Sheet open={internalOpen} onOpenChange={handlePanelOpenChange}>
        <SheetContent className="w-[85vw] min-w-[1200px] max-w-[1600px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Branch Management
            </SheetTitle>
            <p className="text-sm text-muted-foreground text-left">
              Manage your workspace branches and collaborate with your team
            </p>
          </SheetHeader>
          
          <div className="flex-1 flex flex-col mt-6 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex-shrink-0 mb-4">
              <TabBar
                tabs={BRANCH_TABS}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as TabKey)}
                variant="minimal"
                theme="red"
                size="sm"
                showIcons={true}
                showCounts={false}
                animate={true}
                className="w-full"
              />
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {renderTabContent()}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Rollback Modal */}
      {rollbackBranch && (
        <RollbackModal
          open={rollbackModalOpen}
          onOpenChange={setRollbackModalOpen}
          branchId={rollbackBranch?.id || ''}
          branchName={rollbackBranch?.name || ''}
        />
      )}
      
      {/* Merge Modal */}
      {mergeBranch && (
        <MergeModal
          open={mergeModalOpen}
          onOpenChange={setMergeModalOpen}
          sourceBranchId={mergeBranch?.id || ''}
          sourceBranchName={mergeBranch?.name || ''}
          targetBranchId={defaultBranch?.id}
          targetBranchName={defaultBranch?.name}
        />
      )}
      
      {/* Create PR Modal */}
      {prBranch && (
        <CreatePRModal
          open={createPRModalOpen}
          onOpenChange={setCreatePRModalOpen}
          sourceBranchId={prBranch?.id || ''}
          sourceBranchName={prBranch?.name || ''}
          targetBranchId={defaultBranch?.id}
          targetBranchName={defaultBranch?.name}
          prMode={prMode}
        />
      )}
    </>
  );
};

export default BranchManagementPanel;