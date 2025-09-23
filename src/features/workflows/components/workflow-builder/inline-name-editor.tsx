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
}

export function InlineNameEditor({
  name,
  isEditing,
  onSave,
  onCancel,
  onStartEdit,
  placeholder = 'Enter workflow name...',
  className = ''
}: InlineNameEditorProps) {
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset edit value when name changes externally
  useEffect(() => {
    setEditValue(name);
  }, [name]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== name) {
      onSave(trimmedValue);
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

  const handleBlur = () => {
    // Small delay to allow clicking save button
    setTimeout(() => {
      if (document.activeElement?.getAttribute('data-save-button') !== 'true') {
        handleSave();
      }
    }, 100);
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="h-8 text-lg font-semibold bg-white dark:bg-gray-800"
          style={{ minWidth: '200px', maxWidth: '400px' }}
        />
        <button
          data-save-button="true"
          onClick={handleSave}
          className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
          title="Save name"
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
