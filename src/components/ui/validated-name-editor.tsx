/**
 * Validated Name Editor - Reusable component with real-time validation
 * 
 * Uses the name validation hook factory to provide instant feedback
 * on duplicate names and other validation errors.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import type { NameValidationResult } from '@/hooks/use-name-validation';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidatedNameEditorProps {
  /** Current name value */
  name: string;
  /** Whether in edit mode */
  isEditing: boolean;
  /** Save callback - only called if validation passes */
  onSave: (name: string) => void;
  /** Cancel callback */
  onCancel: () => void;
  /** Start edit callback */
  onStartEdit: () => void;
  /** Validation hook function */
  useValidation: (name: string, currentId?: string) => NameValidationResult;
  /** Current entity ID (for update validation) */
  currentEntityId?: string;
  /** Placeholder text */
  placeholder?: string;
  /** CSS classes */
  className?: string;
  /** Whether save is disabled externally */
  disabled?: boolean;
  /** Show suggestions when duplicate found */
  showSuggestions?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ValidatedNameEditor({
  name,
  isEditing,
  onSave,
  onCancel,
  onStartEdit,
  useValidation,
  currentEntityId,
  placeholder = 'Enter name...',
  className = '',
  disabled = false,
  showSuggestions = true
}: ValidatedNameEditorProps) {
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validation = useValidation(editValue, currentEntityId);
  const canSave = validation.isValid && editValue.trim() !== name && !disabled;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Reset edit value when name changes externally (only when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(name);
    }
  }, [name, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    
    if (!trimmedValue) {
      onCancel();
      return;
    }

    if (validation.isValid && trimmedValue !== name) {
      onSave(trimmedValue);
    } else if (!validation.isValid) {
      // Don't save if invalid - let user fix the error
      return;
    } else {
      // No changes made
      onCancel();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setEditValue(suggestion);
    // Don't auto-save, let user confirm
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canSave) {
        handleSave();
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // ============================================================================
  // RENDER - DISPLAY MODE
  // ============================================================================

  if (!isEditing) {
    return (
      <div className={cn("group", className)}>
        <button
          onClick={onStartEdit}
          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-text px-2 py-1 rounded group-hover:bg-gray-50 dark:group-hover:bg-gray-800"
          title="Click to edit name"
        >
          {name || placeholder}
        </button>
      </div>
    );
  }

  // ============================================================================
  // RENDER - EDIT MODE
  // ============================================================================

  return (
    <div className={cn("space-y-2", className)}>
      
      {/* Input Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "h-8 text-lg font-semibold bg-white dark:bg-gray-800",
              validation.error && "border-red-500 focus:border-red-500",
              validation.isValid && !validation.isChecking && "border-green-500",
              "pr-8" // Space for validation icon
            )}
            style={{ minWidth: '200px', maxWidth: '400px' }}
            showSuccessIndicator={false}
          />
          
          {/* Validation Icon */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {validation.isChecking && (
              <Loader2 size={14} className="text-gray-400 animate-spin" />
            )}
            {!validation.isChecking && validation.error && (
              <AlertCircle size={14} className="text-red-500" />
            )}
            {!validation.isChecking && validation.isValid && editValue.trim() !== name && (
              <Check size={14} className="text-green-500" />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <button
          data-save-button="true"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            "p-1 rounded transition-colors",
            canSave
              ? "text-green-600 hover:text-green-700 hover:bg-green-50"
              : "text-gray-400 cursor-not-allowed"
          )}
          title={
            disabled 
              ? "Fix validation errors before saving" 
              : !validation.isValid
              ? "Fix errors to save"
              : canSave 
              ? "Save name" 
              : "No changes to save"
          }
        >
          <Check size={16} />
        </button>
        
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
          title="Cancel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Validation Message */}
      {validation.error && (
        <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle size={12} />
          <span>{validation.error}</span>
        </div>
      )}

      {/* Suggestions (if duplicate found) */}
      {showSuggestions && validation.suggestions && validation.suggestions.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Try these alternatives:
          </div>
          <div className="flex flex-wrap gap-1">
            {validation.suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors"
                title={`Use "${suggestion}"`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Checking State */}
      {validation.isChecking && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Loader2 size={10} className="animate-spin" />
          <span>Checking name availability...</span>
        </div>
      )}
    </div>
  );
}
