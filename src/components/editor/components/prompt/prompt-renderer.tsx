'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PromptLayout, PromptLayoutItem, PromptFormData, FormValidation } from './types';

// Simple utility function for conditional classes
const cn = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface PromptRendererProps {
  layout: PromptLayout;
  data?: Record<string, any>;
  onChange?: (data: PromptFormData) => void;
  readOnly?: boolean;
  className?: string;
  fixedWidth?: number; // For consistent width across multiple prompts
}

export const PromptRenderer: React.FC<PromptRendererProps> = ({
  layout,
  data = {},
  onChange,
  readOnly = false,
  className,
  fixedWidth
}) => {
  // State management with stable initial value
  const [formData, setFormData] = useState<Record<string, any>>(() => ({ ...data }));

  // Memoized radio groups mapping
  const radioGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    
    layout.items?.forEach(item => {
      if (item.type === 'radio' && item.config?.componentId) {
        const groupName = item.config.componentId.split('_')[0];
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(item.config.componentId);
      }
    });
    
    return groups;
  }, [layout.items]);

  // Form validation
  const validation = useMemo((): FormValidation => {
    const missingRequired: string[] = [];
    const errors: Record<string, string> = {};

    layout.items?.forEach(item => {
      const id = item.config?.componentId;
      if (!id) return;

      const isRequired = item.config.required;
      const value = formData[id];

      if (isRequired && (value === undefined || value === null || value === '')) {
        missingRequired.push(id);
        errors[id] = `${item.config.label || item.label || 'Field'} is required`;
      }
    });

    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      errors
    };
  }, [layout.items, formData]);

  // Handle field changes with debounced callback
  const handleFieldChange = useCallback((id: string, value: any) => {
    if (readOnly) return;

    setFormData(prev => {
      const newData = { ...prev, [id]: value };
      
      // Notify parent with validation included
      if (onChange) {
        const dataWithValidation = {
          ...newData,
          __validation: validation
        };
        // Use setTimeout to prevent render loops
        setTimeout(() => onChange(dataWithValidation), 0);
      }
      
      return newData;
    });
  }, [readOnly, onChange, validation]);

  // Handle radio group changes
  const handleRadioChange = useCallback((groupName: string, value: string) => {
    if (readOnly) return;
    handleFieldChange(groupName, value);
  }, [readOnly, handleFieldChange]);

  // Render individual component items
  const renderComponent = useCallback((item: PromptLayoutItem) => {
    const { type, config, x, y, id: itemId } = item;
    const id = config.componentId || itemId;
    const value = formData[id];
    const hasError = validation.errors[id];
    
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
    };

    switch (type) {
      case 'label':
        return (
          <Label
            key={item.id}
            style={{
              ...baseStyle,
              color: config.textColor || '#374151',
              fontSize: config.fontSize ? `${config.fontSize}px` : '14px',
              fontWeight: 500,
              lineHeight: '20px',
              userSelect: 'none'
            }}
            className={cn(
              config.required && 'after:content-["*"] after:ml-0.5 after:text-red-500'
            )}
          >
            {config.label || item.label}
          </Label>
        );

      case 'text-input':
        return (
          <div key={item.id} style={baseStyle}>
            <Input
              type="text"
              id={id}
              value={value || ''}
              onChange={(e) => handleFieldChange(id, e.target.value)}
              placeholder={config.placeholder}
              disabled={readOnly || config.isDisabled}
              required={config.required}
              className={cn(
                'transition-colors duration-200',
                hasError && 'border-red-500 focus-visible:ring-red-500',
                config.isDisabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                width: config.width ? `${config.width}px` : '250px',
                height: config.height ? `${config.height}px` : '40px',
                backgroundColor: config.backgroundColor,
                color: config.textColor,
                borderColor: hasError ? '#ef4444' : config.borderColor
              }}
            />
            {hasError && (
              <p className="text-xs text-red-500 mt-1">{hasError}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={item.id} style={baseStyle}>
            <div style={{ width: config.width ? `${config.width}px` : '200px' }}>
              <Select
                value={value || ''}
                disabled={readOnly || config.isDisabled}
                onValueChange={(val) => handleFieldChange(id, val)}
              >
                <SelectTrigger
                  className={cn(
                    'transition-colors duration-200',
                    hasError && 'border-red-500 focus:ring-red-500',
                    config.isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                  style={{
                    height: config.height ? `${config.height}px` : '40px',
                    backgroundColor: config.backgroundColor,
                    color: config.textColor,
                    borderColor: hasError ? '#ef4444' : config.borderColor
                  }}
                >
                  <SelectValue placeholder={config.placeholder || "Select an option"} />
                </SelectTrigger>
                <SelectContent>
                  {config.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasError && (
                <p className="text-xs text-red-500 mt-1">{hasError}</p>
              )}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={item.id} style={baseStyle}>
            <div
              className="flex items-center space-x-2"
              style={{
                width: config.width ? `${config.width}px` : '200px',
                height: config.height ? `${config.height}px` : '24px'
              }}
            >
              <Checkbox
                id={id}
                checked={value === true}
                onCheckedChange={(checked) => handleFieldChange(id, Boolean(checked))}
                disabled={readOnly || config.isDisabled}
                className={cn(
                  'transition-colors duration-200',
                  hasError && 'border-red-500',
                  config.checkboxSize === 'sm' && 'h-3 w-3',
                  config.checkboxSize === 'md' && 'h-4 w-4',
                  config.checkboxSize === 'lg' && 'h-5 w-5',
                  !config.checkboxSize && 'h-4 w-4',
                  config.isDisabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  borderColor: hasError ? '#ef4444' : config.color
                }}
              />
              {config.label && (
                <Label
                  htmlFor={id}
                  className={cn(
                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                    hasError && 'text-red-500'
                  )}
                >
                  {config.label}
                </Label>
              )}
            </div>
            {hasError && (
              <p className="text-xs text-red-500 mt-1">{hasError}</p>
            )}
          </div>
        );

      case 'radio':
        const groupName = id.split('_')[0];
        const isSelected = formData[groupName] === id;
        
        return (
          <div key={item.id} style={baseStyle}>
            <button
              type="button"
              onClick={() => !readOnly && !config.isDisabled && handleRadioChange(groupName, id)}
              disabled={readOnly || config.isDisabled}
              className={cn(
                'relative h-4 w-4 rounded-full border-2 transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white',
                hasError && 'border-red-500'
              )}
              style={{
                borderColor: hasError ? '#ef4444' : (isSelected ? config.color || '#2563eb' : '#d1d5db')
              }}
            >
              {isSelected && (
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
            </button>
            {hasError && (
              <p className="text-xs text-red-500 mt-1 absolute top-6">{hasError}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  }, [formData, validation, readOnly, handleFieldChange, handleRadioChange]);

  // Use explicit canvas size from layout (exact sizing)
  const canvasWidth = Math.max(layout.canvasWidth || 800, 200);
  const canvasHeight = Math.max(layout.canvasHeight || 600, 200);

  // Empty state
  if (!layout.items?.length) {
    return (
      <div className={cn('flex items-center justify-center p-8 border border-gray-200 rounded-lg bg-gray-50', className)}>
        <p className="text-gray-500 text-sm">No components to display</p>
      </div>
    );
  }

  return (
    <div className={cn('relative bg-white border border-gray-200 rounded-lg overflow-hidden', className)}>
      <div
        className="relative"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`
        }}
      >
        {layout.items.map(renderComponent)}
      </div>
    </div>
  );
}; 