'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

export type TagEntityType = 'rule' | 'class' | 'office' | 'node' | 'process' | 'workflow';

export interface TagModalState {
  isOpen: boolean;
  entityType: TagEntityType | null;
  entityId: string | null;
  selectedTagIds: string[];
}

export interface TagContextValue {
  modalState: TagModalState;
  openTagModal: (entityType: TagEntityType, entityId: string, selectedTagIds?: string[]) => void;
  closeTagModal: () => void;
  updateSelectedTags: (tagIds: string[]) => void;
  isTagModalOpen: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TagContext = createContext<TagContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function TagProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // ============================================================================
  // STATE
  // ============================================================================
  const [modalState, setModalState] = useState<TagModalState>({
    isOpen: false,
    entityType: null,
    entityId: null,
    selectedTagIds: []
  });

  // ============================================================================
  // ENTITY DETECTION FROM URL
  // ============================================================================
  const detectCurrentEntity = useCallback((): { type: TagEntityType; id: string } | null => {
    // Rule detail: /rules/[id] or /rules/[idShort]
    if (pathname.startsWith('/rules/')) {
      const segments = pathname.split('/');
      const ruleId = segments[2];
      if (ruleId && ruleId !== 'new') {
        return { type: 'rule', id: ruleId };
      }
    }
    
    // Class detail: /classes/[id]
    if (pathname.startsWith('/classes/')) {
      const segments = pathname.split('/');
      const classId = segments[2];
      if (classId && classId !== 'new') {
        return { type: 'class', id: classId };
      }
    }
    
    // Office detail: /offices/[id]
    if (pathname.startsWith('/offices/')) {
      const segments = pathname.split('/');
      const officeId = segments[2];
      if (officeId && officeId !== 'new') {
        return { type: 'office', id: officeId };
      }
    }
    
    // Node detail: /nodes/[id]
    if (pathname.startsWith('/nodes/')) {
      const segments = pathname.split('/');
      const nodeId = segments[2];
      if (nodeId && nodeId !== 'new') {
        return { type: 'node', id: nodeId };
      }
    }
    
    // Process detail: /processes/[id]
    if (pathname.startsWith('/processes/')) {
      const segments = pathname.split('/');
      const processId = segments[2];
      if (processId && processId !== 'new') {
        return { type: 'process', id: processId };
      }
    }
    
    // Workflow detail: /workflows/[id]
    if (pathname.startsWith('/workflows/')) {
      const segments = pathname.split('/');
      const workflowId = segments[2];
      if (workflowId && workflowId !== 'new') {
        return { type: 'workflow', id: workflowId };
      }
    }
    
    return null;
  }, [pathname]);

  // ============================================================================
  // MODAL ACTIONS
  // ============================================================================
  const openTagModal = useCallback((
    entityType: TagEntityType, 
    entityId: string, 
    selectedTagIds: string[] = []
  ) => {
    setModalState({
      isOpen: true,
      entityType,
      entityId,
      selectedTagIds
    });
  }, []);

  const closeTagModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const updateSelectedTags = useCallback((tagIds: string[]) => {
    setModalState(prev => ({
      ...prev,
      selectedTagIds: tagIds
    }));
  }, []);

  // ============================================================================
  // GLOBAL KEYBOARD SHORTCUT: Ctrl+Cmd+T
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Cmd+T to open tag modal for current entity
      if (event.ctrlKey && event.metaKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        
        // If modal is already open, close it
        if (modalState.isOpen) {
          closeTagModal();
          return;
        }
        
        // Detect current entity and open modal
        const currentEntity = detectCurrentEntity();
        if (currentEntity) {
          openTagModal(currentEntity.type, currentEntity.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalState.isOpen, detectCurrentEntity, openTagModal, closeTagModal]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  const value: TagContextValue = {
    modalState,
    openTagModal,
    closeTagModal,
    updateSelectedTags,
    isTagModalOpen: modalState.isOpen
  };

  return (
    <TagContext.Provider value={value}>
      {children}
    </TagContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useTagContext(): TagContextValue {
  const context = useContext(TagContext);
  if (context === undefined) {
    throw new Error('useTagContext must be used within a TagProvider');
  }
  return context;
}

// ============================================================================
// CONVENIENCE HOOK FOR CURRENT ENTITY
// ============================================================================

export function useCurrentEntityTags() {
  const { openTagModal } = useTagContext();
  const pathname = usePathname();
  
  const openCurrentEntityTagModal = useCallback((selectedTagIds: string[] = []) => {
    // Same entity detection logic, but simpler for direct use
    if (pathname.startsWith('/rules/')) {
      const ruleId = pathname.split('/')[2];
      if (ruleId && ruleId !== 'new') {
        openTagModal('rule', ruleId, selectedTagIds);
      }
    }
    // Add other entity types as needed
  }, [pathname, openTagModal]);
  
  return { openCurrentEntityTagModal };
} 