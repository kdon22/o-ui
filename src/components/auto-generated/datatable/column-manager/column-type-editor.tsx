/**
 * Column Type Editor Modal - Enhanced with Smart Defaults and Better UX
 * 
 * Features:
 * - Field name editing with validation
 * - Field type selection with icons (using shared types)
 * - Type-specific options (select options, formatting, etc.)
 * - Field description
 * - Smart defaults based on column type
 * - Better UX with focused form flow
 */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  TextArea
} from '@/components/ui';
import { Plus, X } from 'lucide-react';

// Use shared types and constants
import {
  TableColumn,
  ColumnFieldType,
  FIELD_TYPES,
  getColumnIcon
} from '../types';

interface ColumnTypeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  column: TableColumn | null;
  onSave: (column: TableColumn) => void;
}

// Using shared FIELD_TYPES from types module - no duplicate definitions needed

export const ColumnTypeEditor: React.FC<ColumnTypeEditorProps> = ({
  isOpen,
  onClose,
  column,
  onSave
}) => {
  // Enhanced state management with validation
  const [formData, setFormData] = useState<TableColumn>({
    name: '',
    type: 'text',
    required: false,
    options: [],
    description: '',
    richText: false
  });

  const [newOption, setNewOption] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form validation
  const validateForm = useMemo(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Field name is required';
    }
    
    if ((formData.type === 'select' || formData.type === 'multi_select') && 
        (!formData.options || formData.options.length === 0)) {
      newErrors.options = 'At least one option is required for select fields';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const isFormValid = validateForm;

  // Initialize form when column changes
  useEffect(() => {
    if (column) {
      setFormData({
        name: column.name || '',
        type: column.type || 'text',
        required: column.required || false,
        options: column.options || [],
        description: column.description || '',
        richText: column.richText || false
      });
    } else {
      setFormData({
        name: '',
        type: 'text',
        required: false,
        options: [],
        description: '',
        richText: false
      });
    }
  }, [column]);

  // Enhanced UX: Use shared field types and better icon handling
  const selectedFieldType = FIELD_TYPES.find(t => t.value === formData.type);
  const Icon = selectedFieldType?.icon || getColumnIcon(formData.type);
  const isNewField = !column || !(column.name && String(column.name).trim().length > 0);

  // Convert whitespace-separated words to camelCase; leave other characters intact
  const toCamelFromSpaces = (input: string): string => {
    const parts = input.trim().split(/\s+/);
    if (parts.length === 0) return '';
    return parts
      .map((w, i) => {
        const lower = w.toLowerCase();
        return i === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join('');
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    const hasSpace = /\s/.test(formData.name);
    const sanitizedName = hasSpace ? toCamelFromSpaces(formData.name) : formData.name.trim();
    const payload = { ...formData, name: sanitizedName };
    onSave(payload);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), newOption.trim()]
    }));
    setNewOption('');
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  const isSelectType = formData.type === 'select' || formData.type === 'multi_select';
  const isTextType = formData.type === 'text';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {isNewField ? 'Add field' : 'Edit field'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Field Name */}
          <div className="space-y-2">
            <Label htmlFor="field-name">Name</Label>
            <Input
              id="field-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Field name"
              className="w-full"
            />
          </div>

          {/* Field Type */}
          <div className="space-y-2">
            <Label>Field type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                type: value as TableColumn['type'],
                options: value === 'select' || value === 'multi_select' ? prev.options : []
              }))}
            >
              <SelectTrigger>
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
              <p className="text-sm text-gray-500">{selectedFieldType.description}</p>
            )}
          </div>

          {/* Select Options */}
          {isSelectType && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {formData.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(formData.options || [])];
                        newOptions[index] = e.target.value;
                        setFormData(prev => ({ ...prev, options: newOptions }));
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Rich Text for Text Fields */}
          {isTextType && (
            <div className="space-y-2">
              <Label>Formatting</Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.richText}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, richText: checked }))}
                  />
                  <span className="text-sm">Enable rich text formatting</span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Toggle description field visibility
                const hasDescription = formData.description !== undefined;
                if (!hasDescription) {
                  setFormData(prev => ({ ...prev, description: '' }));
                }
              }}
              className="p-0 h-auto text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add description
            </Button>
            
            {formData.description !== undefined && (
              <TextArea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this field..."
                className="min-h-[60px]"
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
