'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  // Runtime bindings per component (e.g., tables)
  bindings?: Record<string, any>;
}

export const PromptRenderer: React.FC<PromptRendererProps> = ({
  layout,
  data = {},
  onChange,
  readOnly = false,
  className,
  fixedWidth,
  bindings = {}
}) => {
  // State management with stable initial value
  const [formData, setFormData] = useState<Record<string, any>>(() => ({ ...data }));

  // Initialize defaults for select/radio (isDefault) if not already set
  React.useEffect(() => {
    const defaults: Record<string, any> = {};
    layout.items?.forEach(item => {
      const id = item.config?.componentId || item.id;
      if (!id) return;
      if (formData[id] !== undefined && formData[id] !== null && formData[id] !== '') return;
      if ((item.type === 'select' || item.type === 'radio') && Array.isArray(item.config?.options)) {
        const def = item.config.options.find(o => o.isDefault)?.value;
        if (def !== undefined && def !== null && def !== '') {
          defaults[id] = def;
        }
      }
    });
    if (Object.keys(defaults).length) {
      setFormData(prev => ({ ...prev, ...defaults }));
      if (onChange) {
        const dataWithValidation = {
          ...formData,
          ...defaults,
          __validation: validation
        };
        setTimeout(() => onChange(dataWithValidation), 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.items]);

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
          ...{ [id]: value },
          __validation: validation
        };
        onChange(dataWithValidation);
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

      case 'radio': {
        const groupName = id; // store selected value under componentId key
        const selectedValue = formData[groupName] ?? config.options?.find(o => o.isDefault)?.value ?? '';
        const layoutDirection = config.labelPosition === 'top' || config.labelPosition === 'bottom' ? 'column' : 'row';
        const isLabelLeft = config.labelPosition === 'left';

        return (
          <div key={item.id} style={baseStyle}>
            <div
              className={cn('flex gap-2 items-center')}
              style={{ flexDirection: layoutDirection as React.CSSProperties['flexDirection'], width: config.width ? `${config.width}px` : undefined }}
            >
              {config.label && (config.labelPosition === 'top' || config.labelPosition === 'left') && (
                <Label className="text-sm" style={{ color: config.textColor }}>{config.label}</Label>
              )}
              <RadioGroup
                value={String(selectedValue)}
                defaultValue={String(config.options?.find(o => o.isDefault)?.value ?? '')}
                onValueChange={(val) => handleFieldChange(groupName, val)}
                disabled={readOnly || config.isDisabled}
                className={cn(isLabelLeft && 'ml-2')}
                aria-label={config.label || 'Options'}
              >
                <div className={cn('gap-4', config.orientation === 'vertical' || !config.orientation ? 'flex flex-col' : 'flex items-center') }>
                  {config.options?.map(opt => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem id={`${groupName}_${opt.value}`} value={opt.value} />
                      <Label htmlFor={`${groupName}_${opt.value}`} className="text-sm">{opt.label}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
              {config.label && (config.labelPosition === 'right' || config.labelPosition === 'bottom') && (
                <Label className="text-sm" style={{ color: config.textColor }}>{config.label}</Label>
              )}
            </div>
            {hasError && (
              <p className="text-xs text-red-500 mt-1">{hasError}</p>
            )}
          </div>
        );
      }

      case 'divider': {
        const widthPx = config.width ? `${config.width}px` : '200px';
        const thickness = typeof config.thickness === 'number' ? config.thickness : 1;
        const style = config.style || 'solid';
        const color = config.color || '#e5e7eb';
        return (
          <div key={item.id} style={baseStyle}>
            <div
              style={{
                width: widthPx,
                borderTopStyle: style as React.CSSProperties['borderTopStyle'],
                borderTopWidth: thickness,
                borderTopColor: color
              }}
            />
          </div>
        );
      }

      case 'table': {
        const tableBinding = bindings?.[id] || {};
        const rows: any[] = Array.isArray(tableBinding?.rows) ? tableBinding.rows : [];
        const selection = tableBinding?.selection || { mode: 'none' };
        const mode: 'none' | 'single' | 'multi' = selection?.mode || 'none';
        const preselected: number[] = Array.isArray(selection?.preselected) ? selection.preselected : [];

        // Initialize selected rows from preselected if no current value
        const current = value;
        const initialSelected = current !== undefined ? current : (mode === 'single' ? (preselected[0] ?? null) : preselected);
        if (current === undefined && (preselected.length > 0 || mode !== 'none')) {
          setFormData(prev => ({ ...prev, [id]: initialSelected }));
          if (onChange) {
            const dataWithValidation = {
              ...formData,
              [id]: initialSelected,
              __validation: validation
            } as any;
            setTimeout(() => onChange(dataWithValidation), 0);
          }
        }

        const handleSelect = (rowIndex: number) => {
          if (readOnly || mode === 'none') return;
          setFormData(prev => {
            if (mode === 'single') {
              return { ...prev, [id]: rowIndex };
            }
            const currentSel: number[] = Array.isArray(prev[id]) ? (prev[id] as number[]) : [];
            const exists = currentSel.includes(rowIndex);
            const nextSel = exists ? currentSel.filter(i => i !== rowIndex) : [...currentSel, rowIndex];
            return { ...prev, [id]: nextSel };
          });
        };

        const selectedSingle: number | null = typeof value === 'number' ? value : (mode === 'single' ? null : null);
        const selectedMulti: number[] = Array.isArray(value) ? (value as number[]) : [];

        const columns = Array.isArray((config as any)?.columns) ? (config as any).columns : [];
        const columnCount = columns.length || (rows[0]?.length || 0);

        return (
          <div key={item.id} style={{ ...baseStyle }}>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {mode !== 'none' && <th className="px-2 py-1 w-8"></th>}
                    {columns.length > 0
                      ? columns.map((col: any, idx: number) => (
                          <th key={idx} className="px-3 py-1 text-left font-medium text-gray-700">
                            {col?.label ?? `Col ${idx + 1}`}
                          </th>
                        ))
                      : Array.from({ length: columnCount }).map((_, idx) => (
                          <th key={idx} className="px-3 py-1 text-left font-medium text-gray-700">
                            {`Col ${idx + 1}`}
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any[], rIdx: number) => {
                    const isSelected = mode === 'single'
                      ? selectedSingle === rIdx
                      : selectedMulti.includes(rIdx);
                    return (
                      <tr key={rIdx} className={cn(isSelected && 'bg-blue-50')}>
                        {mode !== 'none' && (
                          <td className="px-2 py-1 align-top">
                            {mode === 'single' ? (
                              <input
                                type="radio"
                                name={id}
                                checked={isSelected}
                                onChange={() => handleSelect(rIdx)}
                                disabled={readOnly}
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelect(rIdx)}
                                disabled={readOnly}
                              />
                            )}
                          </td>
                        )}
                        {(columns.length ? columns.map((_: any, cIdx: number) => cIdx) : r.map((_: any, cIdx: number) => cIdx))
                          .map((cIdx: number) => (
                            <td key={cIdx} className="px-3 py-1 align-top">
                              {Array.isArray(r) ? r[cIdx] : String(r)}
                            </td>
                          ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {hasError && (
              <div className="text-xs text-red-600 mt-1">{hasError}</div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  }, [formData, validation, readOnly, handleFieldChange, handleRadioChange, bindings, onChange]);

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