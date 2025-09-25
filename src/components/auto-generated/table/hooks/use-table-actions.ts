/**
 * Table Actions Hook - Manages all table interaction handlers
 * 
 * Features:
 * - CRUD action handlers (add, edit, delete, duplicate)
 * - Form submission and cancellation logic
 * - Table interaction handlers (sort, filter, select)
 * - Junction relationship creation
 */

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { FieldSchema } from '@/lib/resource-system/schemas';
import type { SortConfig } from '../types';
import { useNavigationContext } from '@/lib/context/navigation-context';
import { useConfirmDialog } from '@/components/ui/hooks/useConfirmDialog';
import { confirm } from '@/components/ui/confirm';

interface UseTableActionsProps {
  resource: any;
  resourceKey: string;
  formRef: React.RefObject<HTMLDivElement>;
  mutations: {
    createMutation: any;
    updateMutation: any;
    deleteMutation: any;
  };
  junctionRelationships: {
    createJunctionRelationships: (entityId: string) => Promise<void>;
  };
  formState: {
    editingEntity: any;
    setEditingEntity: (entity: any) => void;
    formMode: 'create' | 'edit';
    setFormMode: (mode: 'create' | 'edit') => void;
    showInlineForm: boolean;
    setShowInlineForm: (show: boolean) => void;
  };
  tableState: {
    sortConfig: SortConfig;
    setSortConfig: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
    columnFilters: Record<string, string>;
    setColumnFilters: (filters: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    selectedRows: Set<string>;
    setSelectedRows: (rows: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  };
  processedEntities: any[];
  navigationContext?: {
    nodeId?: string | null;
    parentId?: string | null;
    branchId?: string | null;
    tenantId?: string | null;
    userId?: string | null;
    [key: string]: any;
  };
  // 🏆 GOLD STANDARD: Custom handlers for context menu actions
  customHandlers?: Record<string, (entity: any) => void>;
}

export const useTableActions = ({
  resource,
  resourceKey,
  formRef,
  mutations,
  junctionRelationships,
  formState,
  tableState,
  processedEntities,
  navigationContext,
  customHandlers
}: UseTableActionsProps) => {
  
  const router = useRouter();
  const { navigateFromProcess, navigateToCreateRule } = useNavigationContext();
  const { createMutation, updateMutation, deleteMutation } = mutations;
  const { editingEntity, setEditingEntity, formMode, setFormMode, setShowInlineForm } = formState;
  const { sortConfig, setSortConfig, setColumnFilters, selectedRows, setSelectedRows } = tableState;
  
  // Add confirmation dialog support
  const { showConfirmDialog, modal } = useConfirmDialog();

  // Scroll to form helper
  const scrollToForm = useCallback(() => {
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 200);
  }, [formRef]);

  // Table sorting handler
  const handleSort = useCallback((field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, [setSortConfig]);

  // Column filter handler
  const handleColumnFilter = useCallback((field: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setColumnFilters]);

  // Row selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(processedEntities.map((entity: any) => entity.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [processedEntities, setSelectedRows]);

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, [setSelectedRows]);

  // Bulk action handler
  const handleBulkAction = useCallback((actionId: string) => {
    const bulkOption = resource.table?.bulkSelectOptions?.find((opt: any) => opt.id === actionId);
    if (!bulkOption) return;

    const selectedEntities = processedEntities.filter((entity: any) => selectedRows.has(entity.id));
    
    if (bulkOption.confirmMessage) {
      showConfirmDialog(
        () => {
          // Handle different bulk actions
          switch (actionId) {
            case 'delete':
              selectedEntities.forEach((entity: any) => {
                deleteMutation.mutate({ id: entity.id });
              });
              break;
            // Add other bulk actions as needed
          }

          // Clear selection after action
          setSelectedRows(new Set());
        },
        confirm.custom({
          title: `Bulk ${actionId.charAt(0).toUpperCase() + actionId.slice(1)}`,
          description: bulkOption.confirmMessage,
          variant: actionId === 'delete' ? 'destructive' : 'default',
          confirmLabel: actionId.charAt(0).toUpperCase() + actionId.slice(1)
        })
      );
      return;
    }

    // Handle different bulk actions (no confirmation needed)
    switch (actionId) {
      case 'delete':
        selectedEntities.forEach((entity: any) => {
          deleteMutation.mutate({ id: entity.id });
        });
        break;
      // Add other bulk actions as needed
    }

    // Clear selection after action
    setSelectedRows(new Set());
  }, [resource.table?.bulkSelectOptions, processedEntities, selectedRows, deleteMutation, setSelectedRows, showConfirmDialog]);

  // CRUD action handlers
  const handleAdd = useCallback(() => {
    console.log('🔥 [TableActions] handleAdd called', {
      resourceKey,
      timestamp: new Date().toISOString(),
      formState: {
        showInlineForm: formState.showInlineForm,
        editingEntity: formState.editingEntity,
        formMode: formState.formMode
      }
    });
    
    // Special handling for rules - navigate to rules page instead of inline form
    if (resourceKey === 'rule') {
      // Check if we're in a process context from filters or navigationContext
      const processId = navigationContext?.processId || navigationContext?.parentId;
      const processName = navigationContext?.processName;
      
      console.log('🔥 [TableActions] Navigating to rules page for add', {
        resourceKey,
        processId,
        processName,
        navigationContext,
        timestamp: new Date().toISOString()
      });
      
      // Set navigation context if coming from a process
      if (processId) {
        navigateFromProcess(processId, processName);
      }
      
      // Set target context for rule creation
      navigateToCreateRule();
      
      // Include context in the URL so the rules page can derive SSOT nav (nodeId/processId)
      const nodeId = navigationContext?.nodeId || navigationContext?.parentId;
      const qp: string[] = [];
      if (nodeId) qp.push(`nodeId=${encodeURIComponent(String(nodeId))}`);
      if (processId) qp.push(`processId=${encodeURIComponent(String(processId))}`);
      const suffix = qp.length > 0 ? `?${qp.join('&')}` : '';
      router.push(`/rules${suffix}`);
      return;
    }
    
    setEditingEntity(null);
    setFormMode('create');
    setShowInlineForm(true);
    
    console.log('🔥 [TableActions] handleAdd state set', {
      resourceKey,
      timestamp: new Date().toISOString(),
      actions: {
        setEditingEntity: 'null',
        setFormMode: 'create',
        setShowInlineForm: 'true'
      }
    });
    
    scrollToForm();
  }, [setEditingEntity, setFormMode, setShowInlineForm, scrollToForm, resourceKey, formState, router, navigationContext, navigateFromProcess, navigateToCreateRule]);

  const handleEdit = useCallback(async (entity: any) => {
    // Special handling for rules - navigate to rules detail page using idShort
    if (resourceKey === 'rule') {
      console.log('🔥 [TableActions] Navigating to rule detail page for edit', {
        resourceKey,
        entityId: entity.id,
        entityIdShort: entity.idShort,
        timestamp: new Date().toISOString()
      });

      // Prefer idShort when available
      if (entity.idShort) {
        router.push(`/rules/${entity.idShort}`);
        return;
      }

      // Resolve idShort on demand when missing
      try {
        const { ActionClientFactory } = await import('@/lib/action-client');
        const tenantId = navigationContext?.tenantId || 'defaultTenant';
        const actionClient = ActionClientFactory.create(tenantId);
        const res = await actionClient.executeAction({ action: 'rule.read', data: { id: entity.id } });
        const resolvedShort = res?.data?.idShort || null;
        if (resolvedShort) {
          router.push(`/rules/${resolvedShort}`);
        } else {
          console.warn('⚠️ [TableActions] Could not resolve idShort for rule; aborting navigation');
        }
      } catch (e) {
        console.warn('⚠️ [TableActions] Failed to resolve idShort for rule; aborting navigation', {
          entityId: entity.id,
          error: e instanceof Error ? e.message : e
        });
      }
      return;
    }
    
    setEditingEntity(entity);
    setFormMode('edit');
    setShowInlineForm(true);
    scrollToForm();
  }, [setEditingEntity, setFormMode, setShowInlineForm, scrollToForm, resourceKey, router, navigationContext?.tenantId]);

  const handleDelete = useCallback((entity: any, skipConfirmation = false) => {
    // Skip confirmation if already handled by context menu system
    if (!skipConfirmation) {
      showConfirmDialog(
        () => {
          console.log('🔥 [TableActions] Starting delete operation', {
            resourceKey,
            entityId: entity.id,
            skipConfirmation: true, // Now confirmed
            timestamp: new Date().toISOString()
          });
          
          deleteMutation.mutate({ id: entity.id });
        },
        confirm.delete(entity.name || entity.id, resource.modelName || 'item')
      );
      return;
    }
    
    // Direct delete (confirmation already handled)
    console.log('🔥 [TableActions] Starting delete operation', {
      resourceKey,
      entityId: entity.id,
      skipConfirmation,
      timestamp: new Date().toISOString()
    });
    
    deleteMutation.mutate({ id: entity.id });
  }, [resource.modelName, deleteMutation, resourceKey, showConfirmDialog]);

  const handleDuplicate = useCallback((entity: any) => {
    console.log('🔥 [TableActions] Starting duplicate operation', {
      resourceKey,
      entityId: entity.id,
      timestamp: new Date().toISOString()
    });
    
    // Create a copy of the entity without id and audit fields
    const duplicateData = {
      ...entity,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      createdById: undefined,
      updatedById: undefined,
      version: undefined,
      name: `${entity.name} (Copy)`, // Add "Copy" to the name
      originalOfficeId: undefined // Clear original reference for new entity
    };
    
    createMutation.mutate(duplicateData);
  }, [createMutation, resourceKey]);

  // Form submission handler
  const handleFormSubmit = useCallback(async (formData: any) => {
    console.log('🔥 [TableActions] Form submission started', {
      resourceKey,
      formMode,
      formData,
      editingEntity,
      timestamp: new Date().toISOString()
    });
    
    try {
      if (formMode === 'create') {
        console.log('🔥 [TableActions] Calling createMutation.mutateAsync', {
          formData,
          createMutationExists: !!createMutation,
          timestamp: new Date().toISOString()
        });
        
        const result = await createMutation.mutateAsync(formData);
        
        console.log('🔥 [TableActions] createMutation.mutateAsync completed', {
          result,
          hasData: !!result?.data,
          hasId: !!result?.data?.id,
          timestamp: new Date().toISOString()
        });
        
        // Create junction relationships if applicable
        if (result?.data?.id) {
          await junctionRelationships.createJunctionRelationships(result.data.id);
        }
      } else {
        await updateMutation.mutateAsync({ id: editingEntity.id, ...formData });
      }
    } catch (error) {
      console.error('🔥 [TableActions] Form submission failed', {
        resourceKey,
        formMode,
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString()
      });
      
      throw error; // Re-throw to let form handle error state
    }
  }, [formMode, createMutation, updateMutation, editingEntity, resourceKey, junctionRelationships]);

  const handleFormCancel = useCallback(() => {
    setShowInlineForm(false);
    setEditingEntity(null);
  }, [setShowInlineForm, setEditingEntity]);

  // Handle clickable column clicks
  const handleColumnClick = useCallback(async (entity: any, field: FieldSchema) => {
    if (field.clickable) {
      console.log('🔥 [TableActions] Clickable column clicked', {
        resourceKey,
        entityId: entity.id,
        fieldKey: field.key,
        clickAction: field.clickAction,
        timestamp: new Date().toISOString()
      });
      
      // Check if there's a clickAction configuration
      if (field.clickAction?.type === 'navigate' && field.clickAction.url) {
        // Replace URL placeholders with entity values
        let targetUrl = field.clickAction.url;

        // Replace placeholders like {id}, {idShort}, {name}, etc.
        Object.keys(entity).forEach(key => {
          const placeholder = `{${key}}`;
          if (targetUrl.includes(placeholder)) {
            targetUrl = targetUrl.replace(new RegExp(`\\{${key}\\}`, 'g'), String(entity[key] ?? ''));
          }
        });

        // If {idShort} remains unresolved, try to resolve it when possible (rules)
        if (targetUrl.includes('{idShort}') && entity.id && resourceKey === 'rule') {
          try {
            const { ActionClientFactory } = await import('@/lib/action-client');
            const tenantId = navigationContext?.tenantId || 'defaultTenant';
            const actionClient = ActionClientFactory.create(tenantId);
            const res = await actionClient.executeAction({ action: 'rule.read', data: { id: entity.id } });
            const resolvedShort = res?.data?.idShort || null;
            if (resolvedShort) {
              targetUrl = targetUrl.replace(/\{idShort\}/g, String(resolvedShort));
            }
          } catch (e) {
            console.warn('⚠️ [TableActions] Failed to resolve idShort for navigation', {
              entityId: entity.id,
              error: e instanceof Error ? e.message : e
            });
          }
        }

        // Final safety: warn if unresolved placeholders remain
        if (/\{[^}]+\}/.test(targetUrl)) {
          console.warn('⚠️ [TableActions] Unresolved URL placeholder(s) detected', {
            originalUrl: field.clickAction.url,
            attemptedUrl: targetUrl,
            entityId: entity.id,
            resourceKey,
            timestamp: new Date().toISOString()
          });
        }

        console.log('🔥 [TableActions] Navigating to URL', {
          originalUrl: field.clickAction.url,
          resolvedUrl: targetUrl,
          target: field.clickAction.target || '_self',
          timestamp: new Date().toISOString()
        });

        // Navigate to the URL
        if (field.clickAction.target === '_blank') {
          window.open(targetUrl, '_blank');
        } else {
          router.push(targetUrl);
        }
      } else {
        // Default behavior: enter edit mode
        handleEdit(entity);
      }
    }
  }, [resourceKey, handleEdit, router, navigationContext?.tenantId]);

  // Context menu actions for each row
  const contextMenuActions = useMemo(() => ({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    contextData: navigationContext,
    // 🏆 GOLD STANDARD: Custom handlers for change history and other actions
    customHandlers
  }), [handleEdit, handleDelete, handleDuplicate, navigationContext, customHandlers]);

  // Selection state helpers
  const hasSelectedRows = selectedRows.size > 0;
  const isAllSelected = processedEntities.length > 0 && selectedRows.size === processedEntities.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < processedEntities.length;

  return {
    // Table interaction handlers
    handleSort,
    handleColumnFilter,
    handleSelectAll,
    handleSelectRow,
    handleBulkAction,
    
    // CRUD handlers
    handleAdd,
    handleEdit,
    handleDelete,
    handleDuplicate,
    
    // Form handlers
    handleFormSubmit,
    handleFormCancel,
    
    // Column interaction
    handleColumnClick,
    
    // Context menu
    contextMenuActions,
    
    // Selection state
    hasSelectedRows,
    isAllSelected,
    isIndeterminate,
    
    // Confirmation modal
    confirmationModal: modal
  };
};