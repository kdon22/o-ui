'use client';

/**
 * PR Dashboard - Beautiful, Modern Pull Request Interface
 * 
 * Features:
 * - Adaptive UI based on PR mode (Optional/Required/Disabled)
 * - Smart filtering and search
 * - Beautiful animations and transitions
 * - Quick actions and bulk operations
 * - Real-time status updates
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitPullRequest, 
  Plus, 
  Search, 
  Filter, 
  Zap,
  GitMerge,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/drop-down-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';

import type { PullRequest, PullRequestStatus, PRMode } from '@/features/pull-requests/pull-requests.schema';
import { useBranchContext } from '@/lib/branching/branch-provider';

// ============================================================================
// TYPES
// ============================================================================

interface PRDashboardProps {
  className?: string;
}

type PRFilter = 'all' | 'open' | 'draft' | 'approved' | 'merged' | 'mine';

// ============================================================================
// PR CARD COMPONENT
// ============================================================================

interface PRCardProps {
  pr: PullRequest;
  onView: (pr: PullRequest) => void;
  onMerge: (pr: PullRequest) => void;
  onClose: (pr: PullRequest) => void;
}

const PRCard: React.FC<PRCardProps> = ({ pr, onView, onMerge, onClose }) => {
  const getStatusColor = (status: PullRequestStatus) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'OPEN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CHANGES_REQUESTED': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MERGED': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CLOSED': return 'bg-red-100 text-red-700 border-red-200';
      case 'CONFLICTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: PullRequestStatus) => {
    switch (status) {
      case 'DRAFT': return Clock;
      case 'OPEN': return GitPullRequest;
      case 'APPROVED': return CheckCircle;
      case 'CHANGES_REQUESTED': return AlertTriangle;
      case 'MERGED': return GitMerge;
      case 'CLOSED': return AlertTriangle;
      case 'CONFLICTED': return AlertTriangle;
      default: return GitPullRequest;
    }
  };

  const StatusIcon = getStatusIcon(pr.status);
  const canMerge = pr.status === 'APPROVED' && !pr.hasConflicts;
  const reviewsCount = pr.reviews.length;
  const commentsCount = pr.comments.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* PR Title and Status */}
              <div className="flex items-center gap-3 mb-2">
                <Badge className={`${getStatusColor(pr.status)} font-medium`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {pr.status.replace('_', ' ')}
                </Badge>
                
                {pr.isDraft && (
                  <Badge variant="outline" className="text-xs">
                    Draft
                  </Badge>
                )}
                
                {pr.hasConflicts && (
                  <Badge variant="destructive" className="text-xs">
                    Conflicts
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors cursor-pointer"
                  onClick={() => onView(pr)}>
                {pr.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {pr.description || 'No description provided'}
              </p>
              
              {/* Branch Info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{pr.sourceBranchName}</span>
                <span>→</span>
                <span className="font-medium">{pr.targetBranchName}</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(pr)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              {canMerge && (
                <Button
                  size="sm"
                  onClick={() => onMerge(pr)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <GitMerge className="w-4 h-4 mr-2" />
                  Merge
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(pr)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {pr.status === 'OPEN' && (
                    <DropdownMenuItem onClick={() => onClose(pr)}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Close PR
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Author and Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">
                  {pr.authorName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-sm">
                <span className="font-medium">{pr.authorName}</span>
                <span className="text-muted-foreground ml-2">
                  opened {formatDistanceToNow(new Date(pr.createdAt))} ago
                </span>
              </div>
            </div>
            
            {/* Review and Comment Counts */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {reviewsCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{reviewsCount}</span>
                </div>
              )}
              
              {commentsCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{commentsCount}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Approval Progress */}
          {pr.approvalsRequired > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Approvals: {pr.approvalsReceived}/{pr.approvalsRequired}
                </span>
                <div className="w-24 bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(pr.approvalsReceived / pr.approvalsRequired) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ============================================================================
// QUICK ACTIONS BAR
// ============================================================================

interface QuickActionsProps {
  prMode: PRMode;
  onCreatePR: () => void;
  onDirectMerge: () => void;
  onSettings: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  prMode, 
  onCreatePR, 
  onDirectMerge, 
  onSettings 
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Button 
          onClick={onCreatePR}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Pull Request
        </Button>
        
        {(prMode === 'OPTIONAL' || prMode === 'DISABLED') && (
          <Button 
            variant="outline" 
            onClick={onDirectMerge}
            className="border-dashed hover:border-solid"
          >
            <Zap className="w-4 h-4 mr-2" />
            Quick Merge
          </Button>
        )}
        
        {prMode === 'DISABLED' && (
          <Badge variant="secondary" className="ml-2">
            PR Workflow Disabled
          </Badge>
        )}
        
        {prMode === 'OPTIONAL' && (
          <Badge variant="outline" className="ml-2">
            PR Optional
          </Badge>
        )}
        
        {prMode === 'REQUIRED' && (
          <Badge variant="default" className="ml-2">
            PR Required
          </Badge>
        )}
      </div>
      
      <Button variant="ghost" size="sm" onClick={onSettings}>
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export const PRDashboard: React.FC<PRDashboardProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<PRFilter>('all');
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [prMode, setPRMode] = useState<PRMode>('OPTIONAL');
  
  const branchContext = useBranchContext();
  
  // Filter and search PRs
  const filteredPRs = useMemo(() => {
    let filtered = pullRequests;
    
    // Apply status filter
    switch (activeFilter) {
      case 'open':
        filtered = filtered.filter(pr => pr.status === 'OPEN');
        break;
      case 'draft':
        filtered = filtered.filter(pr => pr.isDraft);
        break;
      case 'approved':
        filtered = filtered.filter(pr => pr.status === 'APPROVED');
        break;
      case 'merged':
        filtered = filtered.filter(pr => pr.status === 'MERGED');
        break;
      case 'mine':
        filtered = filtered.filter(pr => pr.authorId === branchContext?.currentUserId);
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pr => 
        pr.title.toLowerCase().includes(query) ||
        pr.description?.toLowerCase().includes(query) ||
        pr.authorName.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [pullRequests, activeFilter, searchQuery, branchContext?.currentUserId]);
  
  // Get filter counts
  const filterCounts = useMemo(() => {
    return {
      all: pullRequests.length,
      open: pullRequests.filter(pr => pr.status === 'OPEN').length,
      draft: pullRequests.filter(pr => pr.isDraft).length,
      approved: pullRequests.filter(pr => pr.status === 'APPROVED').length,
      merged: pullRequests.filter(pr => pr.status === 'MERGED').length,
      mine: pullRequests.filter(pr => pr.authorId === branchContext?.currentUserId).length,
    };
  }, [pullRequests, branchContext?.currentUserId]);
  
  // Handlers
  const handleCreatePR = () => {
    console.log('Create PR');
    // TODO: Open create PR modal
  };
  
  const handleDirectMerge = () => {
    console.log('Direct merge');
    // TODO: Open direct merge modal
  };
  
  const handleSettings = () => {
    console.log('PR Settings');
    // TODO: Open PR settings modal
  };
  
  const handleViewPR = (pr: PullRequest) => {
    console.log('View PR:', pr.id);
    // TODO: Open PR detail view
  };
  
  const handleMergePR = (pr: PullRequest) => {
    console.log('Merge PR:', pr.id);
    // TODO: Open merge confirmation
  };
  
  const handleClosePR = (pr: PullRequest) => {
    console.log('Close PR:', pr.id);
    // TODO: Close PR with reason
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Actions */}
      <QuickActions
        prMode={prMode}
        onCreatePR={handleCreatePR}
        onDirectMerge={handleDirectMerge}
        onSettings={handleSettings}
      />
      
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pull requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>
      
      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as PRFilter)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All
            <Badge variant="secondary" className="text-xs">
              {filterCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="open" className="flex items-center gap-2">
            Open
            <Badge variant="secondary" className="text-xs">
              {filterCounts.open}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-2">
            Draft
            <Badge variant="secondary" className="text-xs">
              {filterCounts.draft}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            Approved
            <Badge variant="secondary" className="text-xs">
              {filterCounts.approved}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="merged" className="flex items-center gap-2">
            Merged
            <Badge variant="secondary" className="text-xs">
              {filterCounts.merged}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex items-center gap-2">
            Mine
            <Badge variant="secondary" className="text-xs">
              {filterCounts.mine}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeFilter} className="mt-6">
          {/* PR List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredPRs.map((pr) => (
                <PRCard
                  key={pr.id}
                  pr={pr}
                  onView={handleViewPR}
                  onMerge={handleMergePR}
                  onClose={handleClosePR}
                />
              ))}
            </AnimatePresence>
            
            {filteredPRs.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <GitPullRequest className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No pull requests found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first pull request to get started'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreatePR}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Pull Request
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PRDashboard;
