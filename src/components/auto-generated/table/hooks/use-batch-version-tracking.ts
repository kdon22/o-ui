/**
 * Batch Version Tracking Hook - Enterprise-Grade Change Management
 * 
 * Features:
 * - Tracks changes locally during table editing
 * - Batches all changes into a single version on navigation/save
 * - Shows "unsaved changes" indicator
 * - Prevents data loss with navigation warnings
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

interface BatchChange {
  entityId: string;
  entityType: string;
  operation: 'create' | 'update' | 'delete';
  beforeData?: any;
  afterData?: any;
  fieldChanges?: Record<string, FieldChange>;
  timestamp: number;
}

interface FieldChange {
  type: 'added' | 'modified' | 'deleted';
  from?: any;
  to?: any;
}

interface BatchVersionState {
  changes: BatchChange[];
  hasUnsavedChanges: boolean;
  lastSavedAt?: number;
  batchId: string;
}

interface UseBatchVersionTrackingProps {
  resourceKey: string;
  tenantId?: string;
  branchId?: string;
  autoSaveInterval?: number; // Optional auto-save (default: disabled)
}

interface UseBatchVersionTrackingReturn {
  // State
  hasUnsavedChanges: boolean;
  changeCount: number;
  lastSavedAt?: number;
  
  // Actions
  trackChange: (change: Omit<BatchChange, 'timestamp'>) => void;
  saveVersion: () => Promise<void>;
  discardChanges: () => void;
  
  // Status
  isSaving: boolean;
  saveError?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useBatchVersionTracking({
  resourceKey,
  tenantId = '',
  branchId = '',
  autoSaveInterval
}: UseBatchVersionTrackingProps): UseBatchVersionTrackingReturn {
  
  const router = useRouter();
  const [batchState, setBatchState] = useState<BatchVersionState>({
    changes: [],
    hasUnsavedChanges: false,
    batchId: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // ============================================================================
  // CHANGE TRACKING
  // ============================================================================

  const trackChange = useCallback((change: Omit<BatchChange, 'timestamp'>) => {
    console.log('📝 [BatchVersionTracking] Tracking change:', {
      entityId: change.entityId,
      operation: change.operation,
      resourceKey,
      timestamp: new Date().toISOString()
    });

    setBatchState(prev => {
      const newChange: BatchChange = {
        ...change,
        timestamp: Date.now()
      };

      // Check if we already have a change for this entity
      const existingIndex = prev.changes.findIndex(c => 
        c.entityId === change.entityId && c.operation === change.operation
      );

      let newChanges: BatchChange[];
      if (existingIndex >= 0) {
        // Update existing change (merge field changes)
        newChanges = [...prev.changes];
        newChanges[existingIndex] = {
          ...newChanges[existingIndex],
          afterData: change.afterData,
          fieldChanges: {
            ...newChanges[existingIndex].fieldChanges,
            ...change.fieldChanges
          },
          timestamp: Date.now()
        };
      } else {
        // Add new change
        newChanges = [...prev.changes, newChange];
      }

      return {
        ...prev,
        changes: newChanges,
        hasUnsavedChanges: true
      };
    });

    // Reset auto-save timer if enabled
    if (autoSaveInterval) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveVersion();
      }, autoSaveInterval);
    }
  }, [resourceKey, autoSaveInterval]);

  // ============================================================================
  // VERSION SAVING
  // ============================================================================

  const saveVersion = useCallback(async () => {
    if (!batchState.hasUnsavedChanges || batchState.changes.length === 0) {
      console.log('📝 [BatchVersionTracking] No changes to save');
      return;
    }

    console.log('💾 [BatchVersionTracking] Saving batch version:', {
      changeCount: batchState.changes.length,
      batchId: batchState.batchId,
      resourceKey,
      timestamp: new Date().toISOString()
    });

    setIsSaving(true);
    setSaveError(undefined);

    try {
      // Create batch version record
      const response = await fetch('/api/workspaces/current/actions/version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'version.createBatch',
          data: {
            batchId: batchState.batchId,
            resourceType: resourceKey,
            changes: batchState.changes,
            tenantId,
            branchId,
            description: `Batch update: ${batchState.changes.length} changes in ${resourceKey}`,
            tags: ['batch', 'table-edit', resourceKey]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Batch version save failed: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(`Batch version save failed: ${result.error}`);
      }

      console.log('✅ [BatchVersionTracking] Batch version saved:', {
        versionId: result.data?.versionId,
        changeCount: batchState.changes.length,
        timestamp: new Date().toISOString()
      });

      // Reset batch state
      setBatchState(prev => ({
        changes: [],
        hasUnsavedChanges: false,
        lastSavedAt: Date.now(),
        batchId: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));

    } catch (error) {
      console.error('❌ [BatchVersionTracking] Failed to save batch version:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save version');
    } finally {
      setIsSaving(false);
    }
  }, [batchState, resourceKey, tenantId, branchId]);

  // ============================================================================
  // DISCARD CHANGES
  // ============================================================================

  const discardChanges = useCallback(() => {
    console.log('🗑️ [BatchVersionTracking] Discarding changes:', {
      changeCount: batchState.changes.length,
      batchId: batchState.batchId
    });

    setBatchState(prev => ({
      changes: [],
      hasUnsavedChanges: false,
      lastSavedAt: prev.lastSavedAt,
      batchId: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));

    setSaveError(undefined);
  }, [batchState.changes.length, batchState.batchId]);

  // ============================================================================
  // NAVIGATION WARNING
  // ============================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (batchState.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [batchState.hasUnsavedChanges]);

  // ============================================================================
  // AUTO-SAVE ON NAVIGATION AWAY
  // ============================================================================

  useEffect(() => {
    const handleRouteChange = () => {
      if (batchState.hasUnsavedChanges) {
        // Auto-save on navigation away
        saveVersion();
      }
    };

    // Note: Next.js 13+ app router doesn't have router events
    // We'll handle this with beforeunload for now
    // In a real implementation, you might use a custom navigation hook

    return () => {
      // Cleanup auto-save timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [batchState.hasUnsavedChanges, saveVersion]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // State
    hasUnsavedChanges: batchState.hasUnsavedChanges,
    changeCount: batchState.changes.length,
    lastSavedAt: batchState.lastSavedAt,
    
    // Actions
    trackChange,
    saveVersion,
    discardChanges,
    
    // Status
    isSaving,
    saveError
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate field changes between before and after data
 */
export function calculateFieldChanges(beforeData: any, afterData: any): Record<string, FieldChange> {
  const changes: Record<string, FieldChange> = {};
  
  if (!beforeData && afterData) {
    // New entity - all fields are added
    Object.keys(afterData).forEach(key => {
      if (afterData[key] !== undefined) {
        changes[key] = { type: 'added', to: afterData[key] };
      }
    });
    return changes;
  }
  
  if (beforeData && !afterData) {
    // Deleted entity - all fields are deleted
    Object.keys(beforeData).forEach(key => {
      changes[key] = { type: 'deleted', from: beforeData[key] };
    });
    return changes;
  }
  
  if (beforeData && afterData) {
    // Updated entity - compare fields
    const allKeys = new Set([...Object.keys(beforeData), ...Object.keys(afterData)]);
    
    allKeys.forEach(key => {
      const beforeValue = beforeData[key];
      const afterValue = afterData[key];
      
      if (beforeValue === undefined && afterValue !== undefined) {
        changes[key] = { type: 'added', to: afterValue };
      } else if (beforeValue !== undefined && afterValue === undefined) {
        changes[key] = { type: 'deleted', from: beforeValue };
      } else if (beforeValue !== afterValue) {
        changes[key] = { type: 'modified', from: beforeValue, to: afterValue };
      }
    });
  }
  
  return changes;
}
