import { useConfirmDialog } from './hooks/useConfirmDialog';
import { ConfirmModal } from './confirm-modal';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
  blurBackground?: boolean;
  isConfirming?: boolean;
  icon?: ReactNode;
  children: (props: {
    open: (id?: string) => void;
    close: () => void;
    selectedId: string | null;
  }) => ReactNode;
}

export function ConfirmDialog({
  onConfirm,
  title,
  description,
  confirmLabel,
  variant,
  blurBackground,
  isConfirming,
  icon,
  children,
}: ConfirmDialogProps) {
  const {
    isOpen,
    open,
    close,
    confirm,
    title: dialogTitle,
    description: dialogDescription,
    confirmLabel: dialogConfirmLabel,
    variant: dialogVariant,
    selectedId,
    blurBackground: dialogBlurBackground,
    isConfirming: dialogIsConfirming,
    icon: dialogIcon,
  } = useConfirmDialog({
    onConfirm,
    title,
    description,
    confirmLabel,
    variant,
    blurBackground,
    isConfirming,
    icon,
  });

  return (
    <>
      {children({ open, close, selectedId })}
      <ConfirmModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={dialogTitle}
        description={dialogDescription}
        onConfirm={confirm}
        variant={dialogVariant}
        confirmLabel={dialogConfirmLabel}
        blurBackground={dialogBlurBackground}
        isConfirming={dialogIsConfirming}
        icon={dialogIcon}
      />
    </>
  );
} 