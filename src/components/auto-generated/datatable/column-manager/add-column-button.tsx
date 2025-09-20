/**
 * Add Column Button - Airtable-style inline column creation
 * Single-click inline editing experience without modals
 */

"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Components
import { InlineColumnEditor } from './inline-column-editor';

// Types
import { TableColumn } from '../types';

interface AddColumnButtonProps {
  onAddColumn: (column: TableColumn) => void;
  existingColumns: TableColumn[];
  disabled?: boolean;
}

export const AddColumnButton: React.FC<AddColumnButtonProps> = ({
  onAddColumn,
  existingColumns,
  disabled = false
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSaveColumn = (column: TableColumn) => {
    onAddColumn(column);
    setIsEditorOpen(false);
  };

  return (
    <div className="relative z-[100]">
      {/* Airtable-style + button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label="Add field"
        className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        onClick={() => setIsEditorOpen(true)}
      >
        <Plus className="w-5 h-5" />
      </Button>

      {/* Inline Column Editor */}
      <InlineColumnEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveColumn}
        existingColumns={existingColumns}
        position="right"
        triggerRef={buttonRef}
      />
    </div>
  );
};
