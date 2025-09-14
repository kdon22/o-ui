/**
 * Tree Action Handlers - Separated business logic from UI components
 * 
 * This file contains all the action handlers for the tree context menu,
 * keeping the UI components focused on presentation only.
 */

"use client";

import { useCallback, useState } from 'react';
import { useActionCache } from '@/hooks/use-action-api';
import type { TreeNodeData } from './auto-tree';

// ============================================================================
// TYPES
// ============================================================================

interface TreeActionHandlers {
  handleAddNode: (parentNode: TreeNodeData) => void;
  handleAddProcess: (parentNode: TreeNodeData) => void;
  handleRefreshTree: () => void;
  handleShowInheritedSettings: (show: boolean) => void;
  handleShowIgnoredSettings: (show: boolean) => void;
  handleDeleteNode: (node: TreeNodeData) => void;
  
  // Modal states
  isAddNodeModalOpen: boolean;
  isAddProcessModalOpen: boolean;
  selectedParentNode: TreeNodeData | null;
  showInheritedSettings: boolean;
  showIgnoredSettings: boolean;
  
  // Modal control
  closeAddNodeModal: () => void;
  closeAddProcessModal: () => void;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useTreeActions(): TreeActionHandlers {
  // ============================================================================
  // STATE - ALL HOOKS CALLED UNCONDITIONALLY
  // ============================================================================
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [isAddProcessModalOpen, setIsAddProcessModalOpen] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState<TreeNodeData | null>(null);
  const [showInheritedSettings, setShowInheritedSettings] = useState(false);
  const [showIgnoredSettings, setShowIgnoredSettings] = useState(false);

  // ============================================================================
  // ACTION API HOOKS - STABLE HOOK CALLS
  // ============================================================================
  const { invalidateResource } = useActionCache();

  // ============================================================================
  // ACTION HANDLERS - STABLE CALLBACKS
  // ============================================================================
  const handleAddNode = useCallback((parentNode: TreeNodeData) => {
    setSelectedParentNode(parentNode);
    setIsAddNodeModalOpen(true);
  }, []);

  const handleAddProcess = useCallback((parentNode: TreeNodeData) => {
    setSelectedParentNode(parentNode);
    setIsAddProcessModalOpen(true);
  }, []);

  const handleRefreshTree = useCallback(() => {
    invalidateResource('nodes');
    invalidateResource('processes');
    // Tree refreshed
  }, [invalidateResource]);

  const handleDeleteNode = useCallback((node: TreeNodeData) => {
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      // Deleting node
    }
  }, []);

  const handleCloseAddNodeModal = useCallback(() => {
    setIsAddNodeModalOpen(false);
    setSelectedParentNode(null);
  }, []);

  const handleCloseAddProcessModal = useCallback(() => {
    setIsAddProcessModalOpen(false);
    setSelectedParentNode(null);
  }, []);

  const handleShowInheritedSettings = useCallback((show: boolean) => {
    setShowInheritedSettings(show);
  }, []);

  const handleShowIgnoredSettings = useCallback((show: boolean) => {
    setShowIgnoredSettings(show);
  }, []);

  return {
    isAddNodeModalOpen,
    isAddProcessModalOpen,
    selectedParentNode,
    showInheritedSettings,
    showIgnoredSettings,
    handleAddNode,
    handleAddProcess,
    handleRefreshTree,
    handleDeleteNode,
    closeAddNodeModal: handleCloseAddNodeModal,
    closeAddProcessModal: handleCloseAddProcessModal,
    handleShowInheritedSettings,
    handleShowIgnoredSettings,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Maps context menu action IDs to handler functions
 */
export function getActionHandler(
  actionId: string,
  node: TreeNodeData,
  handlers: TreeActionHandlers
): (() => void) | null {
  console.log('🔥 [getActionHandler] Called with', {
    actionId,
    node,
    nodeId: node.id,
    nodeName: node.name,
    hasHandlers: !!handlers,
    timestamp: new Date().toISOString()
  });
  
  switch (actionId) {
    case 'add-node':
      // Returning add-node handler
      return () => handlers.handleAddNode(node);
    case 'add-process':
      // Returning add-process handler
      return () => handlers.handleAddProcess(node);
    case 'refresh-tree':
      // Returning refresh-tree handler
      return () => handlers.handleRefreshTree();
    case 'show-inherited-settings':
      // Returning show-inherited-settings handler
      return () => handlers.handleShowInheritedSettings(!handlers.showInheritedSettings);
    case 'show-ignored-settings':
      return () => handlers.handleShowIgnoredSettings(!handlers.showIgnoredSettings);
    case 'delete':
      return () => handlers.handleDeleteNode(node);
    default:
      console.warn('Unknown action ID:', actionId);
      return null;
  }
}