import React, { useMemo, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import type { FieldSchema } from '@/lib/resource-system/schemas';
import { useDynamicOptions, type DynamicOption } from './use-dynamic-options';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/text-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { convertToPythonName } from '@/components/editor/utils/python-name-converter'
import { TagField } from '@/components/ui/tags/tag-field';
import { ComponentSelector } from './fields/component-selector';
import { CurrencyField } from './fields/currency-field';
import { TagsField } from './fields/tags-field';
// import { cn } from '@/lib/utils/generalUtils'; // No longer needed

// ============================================================================
// TYPES
// ============================================================================
interface FormFieldProps {
  field: FieldSchema;
  control: any;
  errors: Record<string, any>;
  tenantId: string;
  branchId?: string;
}

// ============================================================================
// FORM FIELD COMPONENT
// ============================================================================
export const FormField: React.FC<FormFieldProps> = ({ 
  field, 
  control, 
  errors, 
  tenantId, 
  branchId 
}) => {
  // Always call useDynamicOptions hook but only use it when field has dynamic options
  // This ensures the hook is called in the same order every time
  const { options: dynamicOptions, loading: optionsLoading, error: optionsError } = useDynamicOptions(field, tenantId, branchId);

  // Determine options to use
  const options = useMemo(() => {


    if (field.options?.static) {
      const staticOptions = field.options.static.map((option: any) => ({
        ...option,
        disabled: option.disabled || false
      }));
      return staticOptions;
    }
    if (field.options?.dynamic) {
      return dynamicOptions;
    }
    return [];
  }, [field.options, dynamicOptions, field.key, field.label, field.type, optionsLoading, optionsError]);

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <Input
                {...formField}
                type={field.type}
                placeholder={field.placeholder}
                className="w-full"
              />
            )}
          />
        );

      case 'textarea':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <TextArea
                {...formField}
                placeholder={field.placeholder}
                className="w-full resize-none"
                rows={3}
              />
            )}
          />
        );

      case 'number':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <Input
                {...formField}
                type="number"
                placeholder={field.placeholder}
                className="w-full"
                onChange={(e) => {
                  const value = e.target.value;
                  // Convert empty string to undefined, otherwise convert to number
                  const numValue = value === '' ? undefined : Number(value);
                  formField.onChange(numValue);
                }}
              />
            )}
          />
        );

      case 'switch':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <Switch
                checked={formField.value}
                onCheckedChange={formField.onChange}
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <Select
                value={formField.value}
                onValueChange={formField.onChange}
                disabled={optionsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}...`} />
                </SelectTrigger>
                <SelectContent>
                  {optionsLoading && (
                    <SelectItem value="" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    </SelectItem>
                  )}
                  {optionsError && (
                    <SelectItem value="" disabled>
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        Error loading options
                      </div>
                    </SelectItem>
                  )}

                  {options.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        );

      case 'date':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <Input
                {...formField}
                type="datetime-local"
                className="w-full"
              />
            )}
          />
        );

      case 'tags':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <TagsField
                value={formField.value || []}
                onChange={formField.onChange}
                placeholder={field.placeholder}
                maxTags={field.validation?.find(v => v.type === 'maxLength')?.value || 10}
              />
            )}
          />
        );

      case 'component-selector':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <ComponentSelector
                value={formField.value || []}
                onChange={formField.onChange}
                componentType={field.options?.componentType || 'rules'}
                multiSelect={field.options?.multiSelect !== false}
                showPreview={field.options?.showPreview !== false}
              />
            )}
          />
        );

      case 'currency':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <CurrencyField
                value={formField.value}
                onChange={formField.onChange}
                placeholder={field.placeholder}
                min={field.validation?.find(v => v.type === 'min')?.value}
                max={field.validation?.find(v => v.type === 'max')?.value}
              />
            )}
          />
        );

      default:
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <Input
                {...formField}
                placeholder={field.placeholder}
                className="w-full"
              />
            )}
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={field.key} className="text-sm font-medium text-gray-900 flex items-center gap-2">
        {field.label}
        {field.required && (
          <span className="text-red-500 text-sm" title="Required field">*</span>
        )}
        {field.required && !errors[field.key] && control._formState.dirtyFields[field.key] && (
          <span className="text-green-600 text-sm" title="Required field completed">✓</span>
        )}
      </Label>
      <div className="relative">
        {renderField()}
      </div>
      {field.description && (
        <p className="text-sm text-gray-500 leading-relaxed">
          {field.description}
        </p>
      )}
      {errors[field.key] && (
        <p className="text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {Array.isArray(errors[field.key]) 
            ? errors[field.key][0] 
            : errors[field.key]?.message || errors[field.key]
          }
        </p>
      )}
    </div>
  );
};

export default FormField; 