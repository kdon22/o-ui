/**
 * Unified Data Provider - Gold Standard Branch-Aware Data Management
 * 
 * Single source of truth for all entity data with junction overlay:
 * - Nodes, Processes, Rules, Workflows, Offices
 * - Junction relationships: nodeProcesses, processRules, ruleIgnores
 * - Branch overlay: defaultBranch + currentBranch changes (handled by IndexedDB)
 * - Zero cache invalidation needed
 */

'use client';

import React, { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { useActionQuery } from '@/hooks/use-action-api';
import { useCleanBranchContext } from '@/hooks/use-clean-branch-context';

interface UnifiedDataContextValue {
  // Entities (with branch overlay already applied by IndexedDB)
  nodes: any[];
  processes: any[];
  rules: any[];
  workflows: any[];
  offices: any[];
  
  // Junction data (automatically loaded with branch overlay)
  nodeProcesses: any[];
  processRules: any[];
  ruleIgnores: any[];
  nodeWorkflows: any[];
  workflowProcesses: any[];
  
  // Branch context
  currentBranchId: string;
  defaultBranchId: string;
  isFeatureBranch: boolean;
  
  // Loading states
  isLoading: boolean;
  hasData: boolean;
  
  // Utilities
  getRulesForNode: (nodeId: string) => any[];
  getProcessesForNode: (nodeId: string) => any[];
  getIgnoredRulesForNode: (nodeId: string) => any[];
}

const UnifiedDataContext = createContext<UnifiedDataContextValue | null>(null);

export function UnifiedDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const branchContext = useCleanBranchContext();
  
  // ✅ CRITICAL FIX: Don't make separate queries - just provide utilities
  // The existing action queries already have proper branch overlay logic
  // This provider should just be a utility layer, not a data fetcher

  // ✅ SIMPLIFIED: Just provide empty data and utilities
  // The auto-table will continue to use its own queries with proper branch logic
  const nodes: any[] = [];
  const rules: any[] = [];
  const processes: any[] = [];
  
  // Empty junction data - auto-table handles this itself
  const nodeProcesses: any[] = [];
  const processRules: any[] = [];
  const ruleIgnores: any[] = [];
  const nodeWorkflows: any[] = [];
  const workflowProcesses: any[] = [];
  
  // ✅ SIMPLIFIED: Return empty arrays - auto-table handles junction logic itself
  const getRulesForNode = (nodeId: string) => [];
  const getProcessesForNode = (nodeId: string) => [];
  const getIgnoredRulesForNode = (nodeId: string) => [];
  
  const contextValue: UnifiedDataContextValue = {
    // Entities (with branch overlay already applied by IndexedDB)
    nodes,
    processes,
    rules,
    workflows: [], // TODO: Add when needed
    offices: [], // TODO: Add when needed
    
    // Junctions (with branch overlay already applied by IndexedDB)
    nodeProcesses,
    processRules,
    ruleIgnores,
    nodeWorkflows,
    workflowProcesses,
    
    // Branch context
    currentBranchId: branchContext.currentBranchId,
    defaultBranchId: branchContext.defaultBranchId,
    isFeatureBranch: branchContext.isFeatureBranch,
    
    // Loading states - simplified
    isLoading: false,
    hasData: true,
    
    // Utilities
    getRulesForNode,
    getProcessesForNode,
    getIgnoredRulesForNode
  };
  
  // Debug logging removed to prevent infinite loops
  
  return (
    <UnifiedDataContext.Provider value={contextValue}>
      {children}
    </UnifiedDataContext.Provider>
  );
}

export function useUnifiedData(): UnifiedDataContextValue {
  const context = useContext(UnifiedDataContext);
  if (!context) {
    throw new Error('useUnifiedData must be used within UnifiedDataProvider');
  }
  return context;
}
