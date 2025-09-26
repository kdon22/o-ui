/**
 * Inline Name Editor - Edit workflow name directly in header
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';

interface InlineNameEditorProps {
  name: string;
  isEditing: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
  onStartEdit: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function InlineNameEditor({
  name,
  isEditing,
  onSave,
  onCancel,
  onStartEdit,
  placeholder = 'Enter workflow name...',
  className = '',
  disabled = false
}: InlineNameEditorProps) {
  const [editValue, setEditValue] = useState(name);
  const [isSubmitting, setIsSubmitting] = useState(false);  // Prevent double submission
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset edit value when name changes externally (only when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(name);
      setIsSubmitting(false);  // Reset submission state when not editing
    }
  }, [name, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    // 🛡️ PREVENT DOUBLE SUBMISSION: Check if already submitting
    if (isSubmitting) {
      console.log('🐛 [DEBUG] InlineNameEditor.handleSave blocked - already submitting');
      return;
    }

    const trimmedValue = editValue.trim();
    console.log('🐛 [DEBUG] InlineNameEditor.handleSave called:', { 
      trimmedValue, 
      originalName: name, 
      willSave: trimmedValue && trimmedValue !== name,
      timestamp: new Date().toISOString()
    });

    if (trimmedValue && trimmedValue !== name) {
      setIsSubmitting(true);
      onSave(trimmedValue);
      // Note: isSubmitting will be reset when component unmounts or name changes
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // Removed auto-save on blur - users must explicitly click save button

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-8 text-lg font-semibold bg-white dark:bg-gray-800"
          style={{ minWidth: '200px', maxWidth: '400px' }}
          showSuccessIndicator={false}
        />
        <button
          onClick={handleSave}
          disabled={disabled || !editValue.trim() || editValue === name || isSubmitting}
          className={`p-1 rounded transition-colors ${
            disabled || !editValue.trim() || editValue === name || isSubmitting
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-green-600 hover:text-green-700 hover:bg-green-50'
          }`}
          title={disabled ? "Fix validation errors before saving" : isSubmitting ? "Saving..." : "Save name"}
        >
          <Check size={16} />
        </button>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
          title="Cancel"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onStartEdit}
      className={`text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left ${className}`}
      title="Click to edit name"
    >
      {name || placeholder}
    </button>
  );
}
