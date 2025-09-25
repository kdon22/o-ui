/**
 * Confirmation Dialog Presets - Stripe-style API
 * 
 * Clean, action-oriented confirmation dialogs for common operations.
 * Follows industry best practices from companies like Stripe, Linear, and Vercel.
 * 
 * Usage:
 * ```tsx
 * import { confirm } from '@/components/ui/confirm';
 * import { useConfirmDialog } from '@/components/ui/hooks/useConfirmDialog';
 * 
 * const { showConfirmDialog, modal } = useConfirmDialog();
 * 
 * // Delete action
 * const handleDelete = () => {
 *   showConfirmDialog(
 *     () => deleteEntity(id), 
 *     confirm.delete("Office ABC")
 *   );
 * };
 * ```
 */

export interface ConfirmationConfig {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
  confirmLabel: string;
}

// ============================================================================
// CORE CONFIRMATION FACTORY
// ============================================================================

export const confirm = {
  /**
   * Delete confirmation - Red, destructive styling
   */
  delete: (itemName: string, itemType: string = 'item'): ConfirmationConfig => ({
    title: `Delete ${itemType}`,
    description: itemName 
      ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      : `Are you sure you want to delete this ${itemType.toLowerCase()}? This action cannot be undone.`,
    variant: 'destructive',
    confirmLabel: 'Delete'
  }),

  /**
   * Duplicate confirmation - Default styling
   */
  duplicate: (itemName: string, itemType: string = 'item'): ConfirmationConfig => ({
    title: `Duplicate ${itemType}`,
    description: itemName
      ? `Create a copy of "${itemName}"?`
      : `Create a copy of this ${itemType.toLowerCase()}?`,
    variant: 'default',
    confirmLabel: 'Duplicate'
  }),

  /**
   * Archive/Deactivate confirmation - Warning styling
   */
  archive: (itemName: string, itemType: string = 'item'): ConfirmationConfig => ({
    title: `Archive ${itemType}`,
    description: itemName
      ? `Archive "${itemName}"? It will be hidden from active lists but can be restored later.`
      : `Archive this ${itemType.toLowerCase()}? It will be hidden from active lists but can be restored later.`,
    variant: 'default',
    confirmLabel: 'Archive'
  }),

  /**
   * Activate confirmation - Success styling
   */
  activate: (itemName: string, itemType: string = 'item'): ConfirmationConfig => ({
    title: `Activate ${itemType}`,
    description: itemName
      ? `Activate "${itemName}"? It will be available for use immediately.`
      : `Activate this ${itemType.toLowerCase()}? It will be available for use immediately.`,
    variant: 'default',
    confirmLabel: 'Activate'
  }),

  /**
   * Custom confirmation - For specialized use cases
   */
  custom: (config: Partial<ConfirmationConfig> & { title: string }): ConfirmationConfig => ({
    description: 'Are you sure you want to continue?',
    variant: 'default',
    confirmLabel: 'Confirm',
    ...config
  })
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export const confirmBulk = {
  /**
   * Bulk delete confirmation
   */
  delete: (count: number, itemType: string = 'items'): ConfirmationConfig => ({
    title: `Delete ${count} ${itemType}`,
    description: `Are you sure you want to delete ${count} selected ${itemType.toLowerCase()}? This action cannot be undone.`,
    variant: 'destructive',
    confirmLabel: `Delete ${count} ${itemType}`
  }),

  /**
   * Bulk archive confirmation
   */
  archive: (count: number, itemType: string = 'items'): ConfirmationConfig => ({
    title: `Archive ${count} ${itemType}`,
    description: `Archive ${count} selected ${itemType.toLowerCase()}? They will be hidden from active lists but can be restored later.`,
    variant: 'default',
    confirmLabel: `Archive ${count} ${itemType}`
  })
};
