import { useMemo } from 'react';
import type { ResourceSchema } from '@/lib/resource-system/schemas';
import { validateFormData, getValidationSummary } from '@/lib/validation/schema-validation';

/**
 * Hook to validate form data against a resource schema
 * 
 * @param formData - The current form data to validate
 * @param schema - The resource schema to validate against
 * @returns Validation state and summary
 */
export const useFormValidation = (formData: Record<string, any>, schema: ResourceSchema, isCreate: boolean = true) => {
  return useMemo(() => {
    const validation = validateFormData(formData, schema, isCreate);
    const summary = getValidationSummary(formData, schema);

    return {
      isValid: validation.isValid,
      errors: validation.errors,
      summary,
      canSubmit: validation.isValid,
      
      // Helper methods
      hasErrors: summary.fieldsWithErrors > 0,
      hasMissingRequired: summary.missingRequiredFields > 0,
      requiredFieldsComplete: summary.filledRequiredFields === summary.requiredFields,
      
      // Error helpers
      getFieldError: (fieldKey: string) => validation.errors[fieldKey] || null,
      hasFieldError: (fieldKey: string) => !!validation.errors[fieldKey],
      
      // Quick access to key stats
      stats: {
        totalFields: summary.totalFields,
        requiredFields: summary.requiredFields,
        filledRequiredFields: summary.filledRequiredFields,
        missingRequiredFields: summary.missingRequiredFields,
        fieldsWithErrors: summary.fieldsWithErrors
      }
    };
  }, [formData, schema, isCreate]);
};

/**
 * Hook to validate a single field value
 * 
 * @param fieldKey - The key of the field to validate
 * @param value - The current value of the field
 * @param schema - The resource schema containing the field definition
 * @returns Validation state for the specific field
 */
export const useFieldValidation = (fieldKey: string, value: any, schema: ResourceSchema) => {
  return useMemo(() => {
    const field = schema.fields.find(f => f.key === fieldKey);
    if (!field) {
      return { isValid: true, error: null };
    }

    // Create a minimal form data object for validation
    const formData = { [fieldKey]: value };
    const validation = validateFormData(formData, schema);

    return {
      isValid: !validation.errors[fieldKey],
      error: validation.errors[fieldKey] || null,
      field
    };
  }, [fieldKey, value, schema]);
};

export default useFormValidation; 