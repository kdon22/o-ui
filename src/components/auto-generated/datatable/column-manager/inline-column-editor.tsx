/**
 * Inline Column Editor - Airtable-style inline column creation
 * Replaces modal approach with seamless inline editing experience
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Check, Type } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';

// Types
import { TableColumn, FIELD_TYPES, COLUMN_TYPE_ICONS } from '../types';

interface InlineColumnEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (column: TableColumn) => void;
  column?: Partial<TableColumn>;
  position?: 'right' | 'left';
  existingColumns?: TableColumn[];
  triggerRef?: React.RefObject<HTMLElement>;
}

export const InlineColumnEditor: React.FC<InlineColumnEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  column,
  position = 'right',
  existingColumns = [],
  triggerRef
}) => {
  // State
  const [formData, setFormData] = useState<TableColumn>({
    name: '',
    type: 'str',
    required: false,
    options: [],
    description: '',
    width: 140
  });

  const [newOption, setNewOption] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [editorPosition, setEditorPosition] = useState({ top: 0, left: 0 });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when column changes
  useEffect(() => {
    if (column) {
      setFormData({
        name: column.name || `Column ${existingColumns.length + 1}`,
        type: column.type || 'str',
        required: column.required || false,
        options: column.options || [],
        description: column.description || '',
        width: column.width ?? (existingColumns[existingColumns.length - 1]?.width ?? 140)
      });
    } else {
      setFormData({
        name: `Column ${existingColumns.length + 1}`,
        type: 'str',
        required: false,
        options: [],
        description: '',
        width: existingColumns[existingColumns.length - 1]?.width ?? 140
      });
    }
    setErrors({});
  }, [column, existingColumns.length]);

  // Position calculation
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setEditorPosition({
        top: rect.bottom + 8, // 8px gap below the button
        left: position === 'right' ? rect.left : rect.right - 320 // 320px is min-width
      });
    }
  }, [isOpen, triggerRef, position]);

  // Focus management
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on Select dropdown portaled elements
      const isSelectDropdownClick = target && (
        (target as Element).closest?.('[data-radix-popper-content-wrapper]') ||
        (target as Element).closest?.('[data-radix-select-content]') ||
        (target as Element).closest?.('[data-radix-select-trigger]')
      );
      
      if (containerRef.current && !containerRef.current.contains(target) && !isSelectDropdownClick) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Field name is required';
    }
    
    if (formData.type === 'list' && 
        (!formData.options || formData.options.length === 0)) {
      newErrors.options = 'At least one option is required for list fields';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      type: 'str', 
      required: false,
      options: [],
      description: ''
    });
    setErrors({});
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const addOption = () => {
    if (newOption.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...(prev.options || []), newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  // Get field type info
  const selectedFieldType = FIELD_TYPES.find(t => t.value === formData.type);
  const Icon = selectedFieldType?.icon || COLUMN_TYPE_ICONS[formData.type] || Type;
  const isSelectType = formData.type === 'list';

  if (!isOpen) return null;

  const editorContent = (
    <div 
      ref={containerRef}
      className={cn(
        "fixed bg-white border border-gray-200 shadow-xl rounded-lg p-4 min-w-[320px] max-w-[400px]",
        "z-[9999]", // Very high z-index to appear above everything
        "transform-gpu" // Hardware acceleration for better performance
      )}
      style={{
        top: editorPosition.top,
        left: editorPosition.left,
        willChange: 'transform' // Optimize for animations
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="font-medium text-sm">Add field</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Field Name */}
      <div className="space-y-2 mb-4">
        <Label htmlFor="field-name" className="text-xs font-medium text-gray-600">
          Name
        </Label>
        <Input
          ref={nameInputRef}
          id="field-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Field name"
          className={cn("h-8 text-sm", errors.name && "border-red-500")}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Field Type */}
      <div className="space-y-2 mb-4">
        <Label className="text-xs font-medium text-gray-600">Type</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            type: value as TableColumn['type'],
            options: value === 'list' ? prev.options : []
          }))}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((fieldType) => {
              const FieldIcon = fieldType.icon;
              return (
                <SelectItem key={fieldType.value} value={fieldType.value}>
                  <div className="flex items-center gap-2">
                    <FieldIcon className="w-4 h-4" />
                    <span>{fieldType.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {selectedFieldType && (
          <p className="text-xs text-gray-500">{selectedFieldType.description}</p>
        )}
      </div>

      {/* Select Options */}
      {isSelectType && (
        <div className="space-y-2 mb-4">
          <Label className="text-xs font-medium text-gray-600">Options</Label>
          
          {/* Existing options */}
          <div className="space-y-1">
            {formData.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {option}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => removeOption(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add new option */}
          <div className="flex gap-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Add option"
              className="h-8 text-sm flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  addOption();
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={addOption}
              disabled={!newOption.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {errors.options && (
            <p className="text-xs text-red-500">{errors.options}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-8 px-3 text-sm"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          className="h-8 px-3 text-sm bg-black hover:bg-black/90 text-white"
          disabled={!formData.name.trim()}
        >
          <Check className="w-4 h-4 mr-1" />
          Create field
        </Button>
      </div>
    </div>
  );

  // Use portal to render outside the table structure
  return typeof document !== 'undefined' 
    ? createPortal(editorContent, document.body)
    : null;
};
