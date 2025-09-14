import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ============================================================================
// TYPES
// ============================================================================
interface TagCreateFormProps {
  newTagName: string;
  newTagDescription: string;
  newTagColor: string;
  onTagNameChange: (value: string) => void;
  onTagDescriptionChange: (value: string) => void;
  onTagColorChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  isCreating?: boolean;
  isAssigning?: boolean;
}

// ============================================================================
// TAG CREATE FORM COMPONENT
// ============================================================================
export function TagCreateForm({
  newTagName,
  newTagDescription,
  newTagColor,
  onTagNameChange,
  onTagDescriptionChange,
  onTagColorChange,
  onSubmit,
  onCancel,
  isCreating = false,
  isAssigning = false
}: TagCreateFormProps) {
  
  const handleSubmit = async () => {
    await onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newTagName.trim()) {
        handleSubmit();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const isDisabled = !newTagName.trim() || isCreating || isAssigning;

  return (
    <div className="border border-gray-200 rounded-md p-3 space-y-2 bg-gray-50">
      {/* Name and Color Row */}
      <div className="flex items-center gap-2">
        {/* Color picker */}
        <div className="flex-shrink-0">
          <Input
            type="color"
            value={newTagColor}
            onChange={(e) => onTagColorChange(e.target.value)}
            className="h-8 w-8 p-0.5 cursor-pointer border-gray-300"
            showSuccessIndicator={false}
            title="Tag color"
          />
        </div>
        
        {/* Tag name */}
        <div className="flex-1">
          <Input
            placeholder="Tag name..."
            value={newTagName}
            onChange={(e) => onTagNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm border-gray-300"
            showSuccessIndicator={false}
            autoFocus
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            onClick={handleSubmit}
            size="sm"
            className="h-8 px-3 text-xs"
            disabled={isDisabled}
          >
            <Check className="w-3 h-3 mr-1" />
            {isCreating || isAssigning ? 'Adding...' : 'Add'}
          </Button>
          
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Description Row */}
      <div>
        <Input
          placeholder="Description (optional)..."
          value={newTagDescription}
          onChange={(e) => onTagDescriptionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-xs text-gray-600 border-gray-300"
          showSuccessIndicator={false}
        />
      </div>
    </div>
  );
}

export default TagCreateForm; 