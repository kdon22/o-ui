/**
 * UI Hooks Types
 * 
 * Type definitions for UI hooks.
 */

import { ReactNode } from 'react';

export interface UseConfirmDialogOptions {
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
  blurBackground?: boolean;
  isConfirming?: boolean;
  icon?: ReactNode;
}

export interface UseConfirmDialogReturn {
  open: (id?: string) => void;
  close: () => void;
  selectedId: string | null;
} 