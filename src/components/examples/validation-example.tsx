/**
 * Example component showing how to use the validation system
 * This demonstrates how to validate form data and protect buttons
 */

import React, { useState } from 'react';
import { useFormValidation } from '@/hooks/use-form-validation';
import { PROCESS_SCHEMA } from '@/features/processes/processes.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save, Lock } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';

export const ValidationExample: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    tenantId: 'default',
    branchId: 'main'
  });

  // Use the validation hook
  const validation = useFormValidation(formData, PROCESS_SCHEMA);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = () => {
    if (validation.canSubmit) {
      // Your submission logic here
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">Validation Example</h2>
        <p className="text-sm text-muted-foreground">
          This shows how to use the validation system outside of auto-form
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">
            Name *
            {validation.hasFieldError('name') && (
              <span className="text-red-500 ml-1">
                <AlertCircle className="h-3 w-3 inline" />
              </span>
            )}
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter process name..."
            className={cn(
              validation.hasFieldError('name') && "border-red-500"
            )}
          />
          {validation.getFieldError('name') && (
            <p className="text-xs text-red-500 mt-1">
              {Array.isArray(validation.getFieldError('name')) 
                ? validation.getFieldError('name')!.join(', ')
                : validation.getFieldError('name')
              }
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Type *</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-md",
              validation.hasFieldError('type') && "border-red-500"
            )}
          >
            <option value="">Select type...</option>
            <option value="manual">Manual</option>
            <option value="automated">Automated</option>
            <option value="hybrid">Hybrid</option>
          </select>
          {validation.getFieldError('type') && (
            <p className="text-xs text-red-500 mt-1">
              {Array.isArray(validation.getFieldError('type')) 
                ? validation.getFieldError('type')!.join(', ')
                : validation.getFieldError('type')
              }
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter description..."
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
          />
        </div>
      </div>

      {/* Validation Summary */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-2">Validation Status</h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Form Valid:</span>
            <span className={validation.isValid ? 'text-green-600' : 'text-red-600'}>
              {validation.isValid ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Required Fields:</span>
            <span className={validation.requiredFieldsComplete ? 'text-green-600' : 'text-red-600'}>
              {validation.stats.filledRequiredFields} / {validation.stats.requiredFields}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Errors:</span>
            <span className={validation.hasErrors ? 'text-red-600' : 'text-green-600'}>
              {validation.stats.fieldsWithErrors}
            </span>
          </div>
        </div>
      </div>

      {/* Missing Required Fields Warning */}
      {validation.hasMissingRequired && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Missing Required Fields:
            </span>
          </div>
          <ul className="text-sm text-yellow-700">
            {validation.summary.missingFields.map(field => (
              <li key={field.key}>• {field.label}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors Summary */}
      {validation.hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              Validation Errors:
            </span>
          </div>
          <ul className="text-sm text-red-700">
            {Object.entries(validation.errors).map(([key, errorArray]) => {
              const field = PROCESS_SCHEMA.fields.find(f => f.key === key);
              const errorMessage = Array.isArray(errorArray) ? errorArray.join(', ') : errorArray;
              return (
                <li key={key}>• {field?.label || key}: {errorMessage}</li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Protected Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!validation.canSubmit}
          className={cn(
            "relative",
            !validation.canSubmit && "opacity-50 cursor-not-allowed"
          )}
          title={
            !validation.isValid
              ? validation.hasMissingRequired
                ? `Missing required fields: ${validation.summary.missingFields.map(f => f.label).join(', ')}`
                : `${validation.stats.fieldsWithErrors} validation errors need to be fixed`
              : undefined
          }
        >
          {validation.canSubmit ? (
            <Save className="h-4 w-4 mr-2" />
          ) : (
            <Lock className="h-4 w-4 mr-2" />
          )}
          {validation.canSubmit ? 'Submit' : 'Cannot Submit'}
        </Button>
      </div>

      {/* Debug Info */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-600">Debug Info</summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify({ formData, validation }, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default ValidationExample;