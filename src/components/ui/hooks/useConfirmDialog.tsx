import { useState, useCallback } from 'react';
import { ConfirmModal } from '../confirm-modal';

export interface ConfirmDialogOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
}

/**
 * Gold-standard confirm dialog hook for all entity actions.
 * Usage: const { showConfirmDialog, modal } = useConfirmDialog();
 * Call showConfirmDialog(asyncFn, { title, description, ... }) to show.
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions>({});
  const [isLoading, setIsLoading] = useState(false);
  const [onConfirm, setOnConfirm] = useState<() => Promise<void> | void>(() => {});

  // Show dialog with custom options and confirm handler
  const showConfirmDialog = useCallback(
    (
      onConfirmFn: () => Promise<void> | void,
      opts: ConfirmDialogOptions = {}
    ) => {
      setOnConfirm(() => onConfirmFn);
      setOptions(opts);
      setIsOpen(true);
    },
    []
  );

  const close = useCallback(() => setIsOpen(false), []);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      close();
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm, close]);

  const modal = (
    <ConfirmModal
      open={isOpen}
      onOpenChange={close}
      title={options.title || 'Are you sure?'}
      description={options.description || 'This action cannot be undone.'}
      onConfirm={handleConfirm}
      confirmLabel={options.confirmLabel || 'Confirm'}
      isConfirming={isLoading}
      variant={options.variant || 'destructive'}
    />
  );

  return { showConfirmDialog, modal, close };
} 