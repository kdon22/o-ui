/**
 * Auto-Modal Component - Schema-driven modal with action system integration
 * 
 * Features:
 * - Schema-driven form generation
 * - Action system integration for CRUD operations
 * - Optimistic updates with background sync
 * - Mobile-first responsive design
 * - Validation and error handling
 * - Parent-child relationships for hierarchical creates
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useResourceCreate, useResourceUpdate } from '@/hooks/use-action-api';
import { AutoForm } from '../form/auto-form';
import { ModalPortal } from './modal-portal';
import { 
  getModalStyles, 
  getDefaultModalConfig, 
  getModalTitle
} from './utils';
import type { AutoModalProps } from './types';
import { useAutoNavigationContext } from '@/lib/resource-system/navigation-context';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AutoModal: React.FC<AutoModalProps> = ({
  isOpen,
  onClose,
  config: userConfig,
  schema,
  initialData,
  parentData,
  navigationContext,
  onSuccess,
  onError,
  className,
  overlayClassName
}) => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  const config = { 
    ...getDefaultModalConfig(userConfig.resource, userConfig.action as 'create' | 'update'), 
    ...userConfig,
    // Auto-hide footer when using AutoForm (it has its own buttons)
    showFooter: false,
    showCancel: false,
    showSubmit: false
  };

  const styles = getModalStyles(config);
  const modalTitle = getModalTitle(schema, config.action as 'create' | 'update', parentData);

  // ============================================================================
  // MUTATIONS
  // ============================================================================
  // Resolve a reliable navigation context: use provided one if it has values;
  // otherwise fall back to auto-detected context (URL/session aware)
  const autoNav = useAutoNavigationContext();
  const effectiveNavigationContext = React.useMemo(() => {
    const clean = (obj: any) => Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== undefined && v !== null));
    const providedRaw = navigationContext || {};
    const provided = { ...providedRaw } as any;
    // Fallback: if nodeId missing but selectedId present, treat selectedId as nodeId for context
    if (!provided.nodeId && provided.selectedId) {
      provided.nodeId = provided.selectedId;
    }
    const cleanedProvided = clean(provided);
    if (Object.keys(cleanedProvided).length > 0) return cleanedProvided;
    const autoDerived = { ...autoNav } as any;
    if (!autoDerived?.nodeId && autoDerived?.selectedId) autoDerived.nodeId = autoDerived.selectedId;
    return clean(autoDerived || {});
  }, [navigationContext, autoNav]);

  console.log('🔥 [AutoModal] Creating mutation for resource:', {
    resource: config.resource,
    action: config.action,
    timestamp: new Date().toISOString()
  });
  
  const createMutation = useResourceCreate(config.resource, {
    navigationContext: effectiveNavigationContext,
    onSuccess: (data) => {
      console.log('🎉 [AutoModal] Create SUCCESS callback triggered!', {
        resource: config.resource,
        data,
        timestamp: new Date().toISOString()
      });
      
      onSuccess?.(data);
      
      // CRITICAL FIX: Force immediate portal cleanup before closing
      const portalElement = document.getElementById('modal-portal');
      if (portalElement) {
        portalElement.style.pointerEvents = 'none';
      }
      
      console.log('🎉 [AutoModal] About to close modal', {
        resource: config.resource,
        timestamp: new Date().toISOString()
      });
      
      onClose();
    },
    onError: (error) => {
      console.error('❌ [AutoModal] Create ERROR callback triggered!', {
        resource: config.resource,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
      
      onError?.(error);
      setIsSubmitting(false);
    }
  });

  const updateMutation = useResourceUpdate(config.resource, {
    onSuccess: (data) => {
      onSuccess?.(data);
      // CRITICAL FIX: Force immediate portal cleanup before closing
      const portalElement = document.getElementById('modal-portal');
      if (portalElement) {
        portalElement.style.pointerEvents = 'none';
      }
      onClose();
    },
    onError: (error) => {
      onError?.(error);
      setIsSubmitting(false);
    }
  });

  // ============================================================================
  // FORM HANDLING
  // ============================================================================
  const handleSubmit = useCallback(async (formData: any) => {
    console.log('🔥 [AutoModal] handleSubmit called', {
      action: config.action,
      formData,
      initialData,
      parentData,
      parentDataId: parentData?.id,
      formDataParentId: formData.parentId,
      timestamp: new Date().toISOString()
    });
    
    setIsSubmitting(true);
    setFormErrors({});

    try {
      if (config.action === 'create') {
        // Augment variables with navigation context ONLY if the field exists on the schema
        // Prevents passing unknown fields (e.g., parentId on Process) to the API
        const schemaFieldKeys = new Set<string>((schema?.fields || []).map((f: any) => f.key));
        const augmentedFormData: any = { ...formData };
        if (navigationContext?.nodeId && schemaFieldKeys.has('nodeId')) {
          augmentedFormData.nodeId = navigationContext.nodeId;
        }
        if (navigationContext?.parentId && schemaFieldKeys.has('parentId')) {
          augmentedFormData.parentId = navigationContext.parentId;
        }
        if ((navigationContext as any)?.processId && schemaFieldKeys.has('processId')) {
          augmentedFormData.processId = (navigationContext as any).processId;
        }

        console.log('🚀 [AutoModal] Calling createMutation.mutateAsync', {
          resource: config.resource,
          formData,
          augmentedKeys: Object.keys(augmentedFormData || {}),
          navigationContext,
          timestamp: new Date().toISOString()
        });
        
        const result = await createMutation.mutateAsync(augmentedFormData);
        
        console.log('✅ [AutoModal] createMutation.mutateAsync completed', {
          resource: config.resource,
          result,
          timestamp: new Date().toISOString()
        });
        
      } else {
        await updateMutation.mutateAsync({
          id: initialData?.id,
          ...formData
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle validation errors
      if (error && typeof error === 'object' && 'fieldErrors' in error) {
        setFormErrors(error.fieldErrors as Record<string, string>);
      }
      
      setIsSubmitting(false);
    }
  }, [config.action, createMutation, updateMutation, initialData, parentData]);

  const handleCancel = useCallback(() => {
    if (!isSubmitting) {
      // CRITICAL FIX: Force immediate portal cleanup before closing
      const portalElement = document.getElementById('modal-portal');
      if (portalElement) {
        portalElement.style.pointerEvents = 'none';
      }
      onClose();
    }
  }, [isSubmitting, onClose]);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useEffect(() => {
    if (isOpen) {
      setFormErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // ============================================================================
  // KEYBOARD HANDLING
  // ============================================================================
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !config.preventClose) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, config.preventClose, handleCancel]);

  // ============================================================================
  // RENDER
  // ============================================================================
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div 
        className={`${styles.overlay} ${overlayClassName || ''}`}
        onClick={config.preventClose ? undefined : handleCancel}
      >
        <div 
          className={`${styles.container} ${className || ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {config.showHeader && (
            <div className={styles.header}>
              <h2 className="text-lg font-semibold text-gray-900">
                {modalTitle}
              </h2>
              {!config.preventClose && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={styles.content}>
            <AutoForm
              schema={schema}
              mode={config.action === 'update' ? 'edit' : 'create'} // Map update -> edit
              initialData={initialData}
              parentData={parentData}
              navigationContext={effectiveNavigationContext}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
              compact={true} // Use compact mode in modals
            />
          </div>

          {/* Footer - Hidden when using AutoForm (it has its own buttons) */}
        </div>
      </div>
    </ModalPortal>
  );
};

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

interface CreateModalProps extends Omit<AutoModalProps, 'config'> {
  resource: string; // Should be actionPrefix from schema
  parentData?: any;
  blur?: boolean; // Optional blur override
}

export const CreateModal: React.FC<CreateModalProps> = ({ resource, blur, ...props }) => {
  const config = getDefaultModalConfig(resource, 'create');
  if (blur !== undefined) {
    config.blur = blur;
  }
  return <AutoModal {...props} config={config} />;
};

interface UpdateModalProps extends Omit<AutoModalProps, 'config'> {
  resource: string; // Should be actionPrefix from schema
  initialData: any;
  blur?: boolean; // Optional blur override
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ resource, initialData, blur, ...props }) => {
  const config = getDefaultModalConfig(resource, 'update');
  if (blur !== undefined) {
    config.blur = blur;
  }
  return <AutoModal {...props} config={config} initialData={initialData} />;
}; 