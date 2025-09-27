import React, { useMemo, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import type { FieldSchema } from '@/lib/resource-system/schemas';
import { useSelectOptions } from './use-select-options';
import { SearchableSelect } from './fields/searchable-select';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/text-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle } from 'lucide-react';
import { convertToPythonName } from '@/components/editor/utils/python-name-converter'
import { TagField } from '@/components/ui/tags/tag-field';
import { ComponentSelector } from './fields/component-selector';
import { CurrencyField } from './fields/currency-field';
import { TagsField } from './fields/tags-field';
import { MatrixField, createPermissionMatrixConfig, getMatrixDefaultValues } from './fields/matrix-field';
import { ScheduleBuilder } from './fields/schedule-builder';
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
  // Use SmartSelect system for select and radio fields only 🚀
  const selectResults = field.type === 'select' || field.type === 'radio' 
    ? useSelectOptions(
        field as any, // TODO: Update FieldSchema type to extend SmartSelectOptions
        control, 
        tenantId, 
        branchId
      )
    : { options: [], loading: false, error: null, placeholder: '', searchable: false };
    
  const { options, loading: optionsLoading, error: optionsError, placeholder: smartPlaceholder, searchable: isSmartSearchable } = selectResults;

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

      case 'radio':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => {
              const layout = field.options?.layout || 'vertical';
              const isHorizontal = layout === 'horizontal';
              
              return (
                <RadioGroup
                  value={formField.value || ''}
                  onValueChange={formField.onChange}
                  className={isHorizontal 
                    ? "flex flex-row gap-4 flex-wrap" 
                    : "flex flex-col space-y-2"
                  }
                >
                  {options.map((option) => (
                    <div 
                      key={option.value} 
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem value={option.value} id={`${field.key}-${option.value}`} />
                      <Label 
                        htmlFor={`${field.key}-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              );
            }}
          />
        );

      case 'select':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <SearchableSelect
                value={formField.value || ''}
                onChange={formField.onChange}
                options={options}
                placeholder={smartPlaceholder || field.placeholder || `Select ${field.label.toLowerCase()}...`}
                loading={optionsLoading}
                error={optionsError}
                disabled={false}
                className="w-full"
                searchable={isSmartSearchable}
              />
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

      case 'matrix':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => {
              // Create matrix configuration from field template
              const matrixConfig = field.template && field.config 
                ? createPermissionMatrixConfig(field.config.sections || [])
                : { sections: [], layout: 'tabs' as const, showHeaders: true };
              
              return (
                <MatrixField
                  value={formField.value || {}}
                  onChange={formField.onChange}
                  config={matrixConfig}
                  placeholder={field.placeholder}
                  disabled={false}
                />
              );
            }}
          />
        );

      case 'schedule-builder':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: formField }) => (
              <ScheduleBuilder
                value={formField.value || null}
                onChange={formField.onChange}
                placeholder={field.placeholder}
                disabled={false}
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