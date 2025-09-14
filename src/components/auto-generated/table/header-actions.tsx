/**
 * Header Actions Component - Customizable actions for table headers
 * 
 * Features:
 * - Attach and Add actions with custom handlers
 * - Consistent styling with demo page
 * - Gradient buttons with shadows
 * - Icon support
 * - Integration with AutoTable's handleAdd functionality
 * 
 * Usage Example:
 * ```tsx
 * import { AutoTable, createAutoTableHeaderActions } from '@/components/auto-generated/table';
 * 
 * // Method 1: Use as a function that receives handleAdd
 * <AutoTable
 *   resourceKey="office"
 *   headerActions={(handleAdd) => {
 *     const { AttachAndAddActions } = createAutoTableHeaderActions(handleAdd);
 *     return (
 *       <AttachAndAddActions
 *         onAttach={() => console.log('Attach clicked')}
 *         addLabel="Add Office"
 *       />
 *     );
 *   }}
 * />
 * 
 * // Method 2: Use default behavior (recommended for simple cases)
 * <AutoTable
 *   resourceKey="office"
 *   // No headerActions prop - uses default Add button with handleAdd
 * />
 * ```
 */

"use client";

import React from 'react';
import { Button, SplitButton } from '@/components/ui';
import { Plus, Link } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';

export interface HeaderActionProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export interface HeaderActionsProps {
  actions: HeaderActionProps[];
  className?: string;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({ actions, className }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {actions.map((action, index) => (
        <Button
          key={index}
          onClick={() => {
            console.log('🔥 [HeaderActions] Button clicked', {
              label: action.label,
              variant: action.variant,
              disabled: action.disabled,
              timestamp: new Date().toISOString()
            });
            action.onClick();
          }}
          disabled={action.disabled}
          className={cn(
            "flex items-center gap-2 transition-all",
            action.variant === 'primary' || !action.variant
              ? "bg-black text-white hover:bg-gray-800"
              : "bg-white text-slate-600 hover:bg-gray-50 border border-slate-200",
            action.className
          )}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
};

// ============================================================================
// AUTOTABLE INTEGRATION HELPERS
// ============================================================================

/**
 * Creates header actions that integrate with AutoTable's handleAdd functionality
 * This allows you to use custom header actions while maintaining the inline form behavior
 */
export const createAutoTableHeaderActions = (handleAdd: () => void) => {
  console.log('🔥 [HeaderActions] createAutoTableHeaderActions called', {
    handleAddType: typeof handleAdd,
    timestamp: new Date().toISOString()
  });
  
  return {
    AttachAction: ({ onClick, disabled, label = "Attach" }: { 
      onClick: () => void; 
      disabled?: boolean; 
      label?: string; 
    }) => (
      <HeaderActions 
        actions={[{
          label,
          icon: <Link className="w-4 h-4" />,
          onClick,
          variant: "secondary",
          disabled
        }]}
      />
    ),
    AddAction: ({ disabled, label = "Add" }: { 
      disabled?: boolean; 
      label?: string; 
    }) => (
      <HeaderActions 
        actions={[{
          label,
          icon: <Plus className="w-4 h-4" />,
          onClick: () => {
            console.log('🔥 [HeaderActions] AddAction onClick called', {
              label,
              disabled,
              timestamp: new Date().toISOString()
            });
            console.log('🔥 [HeaderActions] About to call handleAdd()', {
              handleAddType: typeof handleAdd,
              timestamp: new Date().toISOString()
            });
            handleAdd();
            console.log('🔥 [HeaderActions] handleAdd() completed', {
              timestamp: new Date().toISOString()
            });
          },
          variant: "primary",
          disabled
        }]}
      />
    ),
    AttachAndAddActions: ({ 
      onAttach, 
      addLabel = "Add",
      attachLabel = "Attach",
      disabled 
    }: { 
      onAttach: () => void; 
      addLabel?: string;
      attachLabel?: string;
      disabled?: boolean;
    }) => (
      <HeaderActions 
        actions={[
          {
            label: attachLabel,
            icon: <Link className="w-4 h-4" />,
            onClick: onAttach,
            variant: "secondary",
            disabled
          },
          {
            label: addLabel,
            icon: <Plus className="w-4 h-4" />,
            onClick: () => {
              console.log('🔥 [HeaderActions] AttachAndAddActions Add onClick called', {
                addLabel,
                disabled,
                timestamp: new Date().toISOString()
              });
              handleAdd();
            },
            variant: "primary",
            disabled
          }
        ]}
      />
    ),
    
    // NEW: Dual split buttons for Process/Rule actions
    AttachAndSplitAddActions: ({ 
      onAttachProcess,
      onAttachRule,
      onAddProcess,
      onAddRule,
      disabled,
      ruleDisabled = false
    }: { 
      onAttachProcess?: () => void;
      onAttachRule?: () => void;
      onAddProcess?: () => void;
      onAddRule?: () => void;
      disabled?: boolean;
      ruleDisabled?: boolean;
    }) => (
      <div className="flex items-center gap-2">
        {/* Attach Split Button */}
        <SplitButton
          primaryAction={{
            label: "Attach Rule",
            icon: <Link className="w-4 h-4" />,
            onClick: onAttachRule || (() => {
              console.log('🔥 [HeaderActions] Attach Rule clicked');
            }),
            disabled: disabled || ruleDisabled
          }}
          secondaryActions={[
            {
              label: "Attach Process",
              icon: <Link className="w-4 h-4" />,
              onClick: onAttachProcess || (() => {
                console.log('🔥 [HeaderActions] Attach Process clicked');
              }),
              disabled
            }
          ]}
          variant="outline"
        />

        {/* Add Split Button */}
        <SplitButton
          primaryAction={{
            label: "Add Rule",
            icon: <Plus className="w-4 h-4" />,
            onClick: onAddRule || (() => {
              console.log('🔥 [HeaderActions] Add Rule clicked');
              handleAdd();
            }),
            disabled: disabled || ruleDisabled
          }}
          secondaryActions={[
            {
              label: "Add Process",
              icon: <Plus className="w-4 h-4" />,
              onClick: onAddProcess || (() => {
                console.log('🔥 [HeaderActions] Add Process clicked');
                handleAdd();
              }),
              disabled
            }
          ]}
          variant="default"
        />
      </div>
    )
  };
};

// Pre-built common actions (legacy - use createAutoTableHeaderActions for AutoTable integration)
export const AttachAction: React.FC<{ onClick: () => void; disabled?: boolean }> = ({ 
  onClick, 
  disabled 
}) => (
  <HeaderActions 
    actions={[{
      label: "Attach",
      icon: <Link className="w-4 h-4" />,
      onClick,
      variant: "secondary",
      disabled
    }]}
  />
);

export const AddAction: React.FC<{ onClick: () => void; disabled?: boolean; label?: string }> = ({ 
  onClick, 
  disabled,
  label = "Add"
}) => (
  <HeaderActions 
    actions={[{
      label,
      icon: <Plus className="w-4 h-4" />,
      onClick,
      variant: "primary",
      disabled
    }]}
  />
);

export const AttachAndAddActions: React.FC<{ 
  onAttach: () => void; 
  onAdd: () => void; 
  addLabel?: string;
  disabled?: boolean;
}> = ({ 
  onAttach, 
  onAdd, 
  addLabel = "Add",
  disabled 
}) => (
  <HeaderActions 
    actions={[
      {
        label: "Attach",
        icon: <Link className="w-4 h-4" />,
        onClick: onAttach,
        variant: "secondary",
        disabled
      },
      {
        label: addLabel,
        icon: <Plus className="w-4 h-4" />,
        onClick: onAdd,
        variant: "primary",
        disabled
      }
    ]}
  />
); 