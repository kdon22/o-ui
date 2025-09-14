/**
 * Change History Hook - Provides change history functionality for auto-table
 * 
 * Features:
 * - Change history modal state management
 * - Custom handler for viewHistory context menu action
 * - Integration with existing auto-table context menu system
 */

import { useState, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ChangeHistoryModalState {
  isOpen: boolean;
  entityId: string;
  entityType: string;
  entityName: string;
}

interface UseChangeHistoryProps {
  resourceKey: string;
  tenantId?: string;
  branchId?: string;
}

interface UseChangeHistoryReturn {
  // Modal state
  changeHistoryModal: ChangeHistoryModalState;
  
  // Modal actions
  openChangeHistory: (entity: any, entityType?: string) => void;
  closeChangeHistory: () => void;
  
  // Custom handler for context menu
  customHandlers: Record<string, (entity: any) => void>;
  
  // Modal component props
  modalProps: {
    isOpen: boolean;
    onClose: () => void;
    entityId: string;
    entityType: string;
    entityName: string;
    tenantId: string;
    branchId: string;
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useChangeHistory({
  resourceKey,
  tenantId = '',
  branchId = ''
}: UseChangeHistoryProps): UseChangeHistoryReturn {
  
  // Modal state
  const [changeHistoryModal, setChangeHistoryModal] = useState<ChangeHistoryModalState>({
    isOpen: false,
    entityId: '',
    entityType: '',
    entityName: ''
  });

  // Open change history modal
  const openChangeHistory = useCallback((entity: any, entityType?: string) => {
    console.log('🔍 [ChangeHistory] Opening change history for:', {
      entityId: entity.id,
      entityName: entity.name,
      entityType: entityType || resourceKey,
      tenantId,
      branchId
    });

    setChangeHistoryModal({
      isOpen: true,
      entityId: entity.id,
      entityType: entityType || getEntityTypeFromResourceKey(resourceKey),
      entityName: entity.name || entity.id
    });
  }, [resourceKey, tenantId, branchId]);

  // Close change history modal
  const closeChangeHistory = useCallback(() => {
    console.log('🔍 [ChangeHistory] Closing change history modal');
    setChangeHistoryModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Custom handlers for context menu actions
  const customHandlers = useMemo(() => ({
    viewHistory: (entity: any) => {
      console.log('🔍 [ChangeHistory] viewHistory action triggered for:', entity.id);
      openChangeHistory(entity);
    }
  }), [openChangeHistory]);

  // Modal component props
  const modalProps = useMemo(() => ({
    isOpen: changeHistoryModal.isOpen,
    onClose: closeChangeHistory,
    entityId: changeHistoryModal.entityId,
    entityType: changeHistoryModal.entityType,
    entityName: changeHistoryModal.entityName,
    tenantId,
    branchId
  }), [changeHistoryModal, closeChangeHistory, tenantId, branchId]);

  return {
    changeHistoryModal,
    openChangeHistory,
    closeChangeHistory,
    customHandlers,
    modalProps
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert resource key to entity type for API calls
 */
function getEntityTypeFromResourceKey(resourceKey: string): string {
  // Convert plural resource keys to singular entity types
  const entityTypeMap: Record<string, string> = {
    'rules': 'Rule',
    'processes': 'Process', 
    'nodes': 'Node',
    'offices': 'Office',
    'workflows': 'Workflow',
    'credentials': 'Credential',
    'tags': 'Tag',
    'classes': 'Class'
  };

  return entityTypeMap[resourceKey] || capitalizeFirst(resourceKey.replace(/s$/, ''));
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
