/**
 * Unsaved Changes Modal - Handles workflow close with unsaved changes
 * 
 * Provides Save/Discard/Continue editing options when user tries to close
 * workflow with unsaved changes. Shows validation errors if save is not possible.
 */

'use client';

import { useState } from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Trash2, X, AlertCircle } from 'lucide-react';
import type { ValidationError } from '../../utils/workflow-validator';

interface UnsavedChangesModalProps {
  /** Whether the modal is open */
  open: boolean;
  
  /** Called when modal should close */
  onOpenChange: (open: boolean) => void;
  
  /** Whether the workflow can be saved (no validation errors) */
  canSave: boolean;
  
  /** Validation errors preventing save */
  validationErrors: ValidationError[];
  
  /** Called when user chooses to save */
  onSave: () => Promise<void> | void;
  
  /** Called when user chooses to discard changes */
  onDiscard: () => void;
  
  /** Called when user chooses to continue editing */
  onContinueEditing: () => void;

  /** Workflow name for display */
  workflowName: string;
}

export function UnsavedChangesModal({
  open,
  onOpenChange,
  canSave,
  validationErrors,
  onSave,
  onDiscard,
  onContinueEditing,
  workflowName
}: UnsavedChangesModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!canSave) return;
    
    setIsSaving(true);
    try {
      await onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    onDiscard();
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    onContinueEditing();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Unsaved Changes
          </AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes to <strong>"{workflowName}"</strong>. 
            What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Show validation errors if save is not possible */}
        {!canSave && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {validationErrors.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fix these issues to save:
                </p>
                {validationErrors.map((error) => (
                  <Alert key={error.id} variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {error.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </>
            ) : (
              <Alert variant="default" className="py-2">
                <AlertDescription className="text-sm">
                  Save from here is temporarily unavailable. Please save manually in the editor if needed.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <AlertDialogFooter className="flex gap-2 sm:gap-0">
          {/* Continue Editing - Secondary */}
          <AlertDialogCancel 
            onClick={handleContinueEditing}
            className="flex items-center gap-2"
          >
            <X size={16} />
            Continue Editing
          </AlertDialogCancel>

          {/* Discard Changes - Destructive */}
          <Button
            variant="destructive"
            onClick={handleDiscard}
            className="flex items-center gap-2"
          >
            <Trash2 size={16} />
            Discard Changes
          </Button>

          {/* Save Changes - Primary (if possible) */}
          {canSave && (
            <AlertDialogAction
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for managing unsaved changes modal state
 */
export function useUnsavedChangesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const showModal = (onProceed: () => void) => {
    setPendingAction(() => onProceed);
    setIsOpen(true);
  };

  const handleDiscard = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setIsOpen(false);
  };

  const handleContinueEditing = () => {
    setPendingAction(null);
    setIsOpen(false);
  };

  return {
    isOpen,
    setIsOpen,
    showModal,
    handleDiscard,
    handleContinueEditing
  };
}
