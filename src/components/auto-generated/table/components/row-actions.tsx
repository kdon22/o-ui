/**
 * Row Actions Component - Schema-driven actions for table rows
 * 
 * Features:
 * - Schema-configured actions (mutation, dialog, navigation, custom)
 * - Conditional visibility based on row data
 * - Icon support with proper variants
 * - Integrated with action system and dialog system
 * - Confirmation dialogs for destructive actions
 * - Loading states and error handling
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useActionMutation } from '@/hooks/use-action-api';
import { useRouter } from 'next/navigation';
import { useConfirmDialog } from '@/components/ui/hooks/useConfirmDialog';
import { confirm } from '@/components/ui/confirm';
import { cn } from '@/lib/utils/generalUtils';
import { 
  Play, Pause, Moon, XCircle, Edit, Trash2, Copy, ExternalLink, 
  MoreHorizontal, Settings, CheckCircle, AlertTriangle, Clock,
  Zap, RefreshCw, Eye, Download, Share, Archive, Star
} from 'lucide-react';
import type { RowActionConfig } from '@/lib/resource-system/schemas';

// Icon mapping for schema-driven icons
const ICON_MAP = {
  Play, Pause, Moon, XCircle, Edit, Trash2, Copy, ExternalLink,
  MoreHorizontal, Settings, CheckCircle, AlertTriangle, Clock,
  Zap, RefreshCw, Eye, Download, Share, Archive, Star
};

interface RowActionsProps {
  /** The data for this row */
  rowData: Record<string, any>;
  /** Row actions configuration from schema */
  rowActions: RowActionConfig[];
  /** Resource key for mutation actions */
  resourceKey: string;
  /** Custom action handlers */
  customHandlers?: Record<string, (rowData: any) => void>;
  /** Dialog component registry */
  dialogComponents?: Record<string, React.ComponentType<any>>;
  /** Compact mode - smaller buttons */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export const RowActions: React.FC<RowActionsProps> = ({
  rowData,
  rowActions,
  resourceKey,
  customHandlers = {},
  dialogComponents = {},
  compact = true,
  className
}) => {
  const router = useRouter();
  const { showConfirmDialog, modal } = useConfirmDialog();
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});

  // Create mutations for common row actions (following Rules of Hooks)
  const updateMutation = useActionMutation(`${resourceKey}.update`, {
    onError: (error: Error) => {
      console.error('Row update action failed:', error);
    }
  });

  const deleteMutation = useActionMutation(`${resourceKey}.delete`, {
    onError: (error: Error) => {
      console.error('Row delete action failed:', error);
    }
  });

  const activateMutation = useActionMutation(`${resourceKey}.activate`, {
    onError: (error: Error) => {
      console.error('Row activate action failed:', error);
    }
  });

  const deactivateMutation = useActionMutation(`${resourceKey}.deactivate`, {
    onError: (error: Error) => {
      console.error('Row deactivate action failed:', error);
    }
  });

  // Map action names to their corresponding mutation hooks
  const mutations: Record<string, any> = {
    [`${resourceKey}.update`]: updateMutation,
    [`${resourceKey}.delete`]: deleteMutation,
    [`${resourceKey}.activate`]: activateMutation,
    [`${resourceKey}.deactivate`]: deactivateMutation,
    'update': updateMutation,
    'delete': deleteMutation, 
    'activate': activateMutation,
    'deactivate': deactivateMutation
  };

  // Check if action should be visible based on condition
  const isActionVisible = (action: RowActionConfig): boolean => {
    if (!action.condition) return true;

    const { field, operator, value } = action.condition;
    const fieldValue = rowData[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);
      case 'exists':
        return fieldValue != null && fieldValue !== '';
      case 'not_exists':
        return fieldValue == null || fieldValue === '';
      default:
        return true;
    }
  };

  // Handle mutation actions
  const handleMutation = async (action: RowActionConfig) => {
    if (!action.mutation) return;

    const { action: actionName, payload, confirmMessage } = action.mutation;
    
    // Try to find a pre-created mutation hook
    const mutation = mutations[actionName] || mutations[`${resourceKey}.${actionName}`];

    if (!mutation) {
      console.error(`Mutation for action ${actionName} not found in predefined mutations`);
      return;
    }

    const executeAction = async () => {
      setLoadingActions(prev => new Set([...prev, action.key]));
      
      try {
        await mutation.mutateAsync({
          id: rowData.id,
          updates: payload
        });
      } catch (error) {
        console.error(`Action ${action.key} failed:`, error);
        // Error will be handled by mutation's onError
      } finally {
        setLoadingActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(action.key);
          return newSet;
        });
      }
    };

    // Show confirmation for destructive actions or explicit confirmation
    if (action.variant === 'destructive' || confirmMessage) {
      showConfirmDialog(
        executeAction,
        confirm.custom({
          title: `${action.label} ${resourceKey}`,
          description: confirmMessage || `Are you sure you want to ${action.label.toLowerCase()} this item?`,
          variant: action.variant === 'destructive' ? 'destructive' : 'default',
          confirmLabel: action.label
        })
      );
    } else {
      executeAction();
    }
  };

  // Handle dialog actions
  const handleDialog = (action: RowActionConfig) => {
    if (!action.dialog) return;
    
    setOpenDialogs(prev => ({ ...prev, [action.key]: true }));
  };

  // Handle navigation actions
  const handleNavigation = (action: RowActionConfig) => {
    if (!action.navigation) return;

    const { path, target } = action.navigation;
    const resolvedPath = path.replace(/\[(\w+)\]/g, (_, field) => rowData[field] || '');

    if (target === '_blank') {
      window.open(resolvedPath, '_blank');
    } else {
      router.push(resolvedPath);
    }
  };

  // Handle custom actions
  const handleCustomAction = (action: RowActionConfig) => {
    if (!action.customHandler) return;
    
    const handler = customHandlers[action.customHandler];
    if (handler) {
      handler(rowData);
    } else {
      console.error(`Custom handler ${action.customHandler} not found`);
    }
  };

  // Get action handler
  const getActionHandler = (action: RowActionConfig) => {
    switch (action.actionType) {
      case 'mutation':
        return () => handleMutation(action);
      case 'dialog':
        return () => handleDialog(action);
      case 'navigation':
        return () => handleNavigation(action);
      case 'custom':
        return () => handleCustomAction(action);
      default:
        return () => console.log(`Action ${action.key} clicked`);
    }
  };

  // Get icon component
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];
    return IconComponent ? <IconComponent className={cn(compact ? "h-3 w-3" : "h-4 w-4")} /> : null;
  };

  // Filter visible actions
  const visibleActions = rowActions.filter(isActionVisible);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn("flex items-center gap-1", className)}>
        {visibleActions.map((action) => {
          const isLoading = loadingActions.has(action.key);
          const icon = getIcon(action.icon);

          return (
            <Button
              key={action.key}
              size={compact ? "sm" : action.size || "md"}
              variant={action.variant || "ghost"}
              onClick={getActionHandler(action)}
              disabled={isLoading}
              title={action.tooltip || action.label}
              className={cn(
                compact && "h-6 px-2",
                "min-w-0" // Prevent button from growing
              )}
            >
              {isLoading ? (
                <RefreshCw className={cn(compact ? "h-3 w-3" : "h-4 w-4", "animate-spin")} />
              ) : (
                icon
              )}
              {!compact && <span className="ml-1">{action.label}</span>}
            </Button>
          );
        })}
      </div>

      {/* Render action dialogs */}
      {visibleActions
        .filter(action => action.actionType === 'dialog' && openDialogs[action.key])
        .map((action) => {
          const DialogComponent = dialogComponents[action.dialog!.component];
          if (!DialogComponent) return null;

          return (
            <DialogComponent
              key={`dialog-${action.key}`}
              open={openDialogs[action.key]}
              onOpenChange={(open: boolean) => 
                setOpenDialogs(prev => ({ ...prev, [action.key]: open }))
              }
              rowData={rowData}
              action={action}
              {...(action.dialog!.props || {})}
            />
          );
        })}

      {/* Confirmation modal */}
      {modal}
    </>
  );
};
