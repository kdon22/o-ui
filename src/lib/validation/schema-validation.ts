import { z } from 'zod';
import type { ResourceSchema, FieldSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// VALIDATION SCHEMA BUILDER
// ============================================================================

export const createValidationSchema = (fields: FieldSchema[]) => {
  const schemaFields: Record<string, any> = {};

  fields.forEach((field) => {
    let fieldSchema: any;

    // Start with appropriate base type
    switch (field.type) {
      case 'number':
      case 'currency':
        fieldSchema = z.coerce.number().nullable();
        break;
      case 'email':
        fieldSchema = z.string();
        break;
      case 'url':
        fieldSchema = z.string();
        break;
      case 'date':
        fieldSchema = z.string().datetime();
        break;
      case 'switch':
        fieldSchema = z.boolean();
        break;
      case 'tags':
      case 'multiSelect':
      case 'component-selector':
        fieldSchema = z.array(z.string()).default([]);
        break;
      default:
        fieldSchema = z.string();
    }

    // Apply custom validation rules from field schema
    if (field.validation) {
      field.validation.forEach((rule) => {
        switch (rule.type) {
          case 'minLength':
            fieldSchema = fieldSchema.min(rule.value, rule.message);
            break;
          case 'maxLength':
            fieldSchema = fieldSchema.max(rule.value, rule.message);
            break;
          case 'pattern':
            // Only validate pattern if field has content (unless required)
            fieldSchema = fieldSchema.refine((val: string) => {
              // If empty, it's valid (unless required, handled separately)
              if (!val || val.trim() === '') return true;
              // If has content, validate pattern
              return new RegExp(rule.value).test(val);
            }, rule.message);
            break;
          case 'email':
            fieldSchema = fieldSchema.email(rule.message);
            break;
          case 'url':
            fieldSchema = fieldSchema.url(rule.message);
            break;
        }
      });
    }

    // Apply default type validations if no custom validation exists
    // Only validate email/url format if the field has content
    if (!field.validation || !field.validation.some(rule => rule.type === 'email')) {
      if (field.type === 'email') {
        fieldSchema = fieldSchema.refine((val: string) => {
          // If empty, it's valid (unless required, handled separately)
          if (!val || val.trim() === '') return true;
          // If has content, validate email format
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        }, 'Please enter a valid email address');
      }
    }

    if (!field.validation || !field.validation.some(rule => rule.type === 'url')) {
      if (field.type === 'url') {
        fieldSchema = fieldSchema.refine((val: string) => {
          // If empty, it's valid (unless required, handled separately)
          if (!val || val.trim() === '') return true;
          // If has content, validate URL format
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        }, 'Please enter a valid URL');
      }
    }

    // Handle nullable fields
    if (field.nullable) {
      fieldSchema = fieldSchema.nullable();
    }

    // Handle required fields - use the same logic as isFieldFilled
    if (field.required) {
      fieldSchema = fieldSchema.refine((val: any) => {
        return isFieldFilled(field, val);
      }, {
        message: `${field.label} is required`
      });
    } else {
      // Make optional if not required
      fieldSchema = fieldSchema.optional();
    }

    schemaFields[field.key] = fieldSchema;
  });

  return z.object(schemaFields);
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateFormData = (data: Record<string, any>, schema: ResourceSchema, isCreate: boolean = true) => {
  const formFields = schema.fields.filter(field => 
    field.key !== 'id' && 
    field.key !== 'createdAt' && 
    field.key !== 'updatedAt' &&
    field.mobile?.displayFormat !== 'hidden' &&
    !(isCreate && field.excludeFromCreate) &&
    !(!isCreate && field.excludeFromUpdate) &&
    // Exclude auto-value fields from validation since they're populated automatically
    !field.autoValue
  );

  const validationSchema = createValidationSchema(formFields);
  
  try {
    const result = validationSchema.safeParse(data);
    
    return {
      isValid: result.success,
      errors: result.success ? {} : result.error.flatten().fieldErrors,
      data: result.success ? result.data : null
    };
  } catch (error) {
    return {
      isValid: false,
      errors: { general: ['Validation failed'] },
      data: null
    };
  }
};

// ============================================================================
// FIELD VALIDATION UTILITIES
// ============================================================================

export const isFieldFilled = (field: FieldSchema, value: any): boolean => {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return false;
  }

  // Handle different field types
  if (field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'url' || field.type === 'select') {
    // Convert to string and check if it has meaningful content
    const stringValue = String(value).trim();
    return stringValue.length > 0;
  } else if (field.type === 'number' || field.type === 'currency') {
    // For numbers and currency, check if it's a valid number (including 0)
    const numValue = Number(value);
    return !isNaN(numValue) && isFinite(numValue);
  } else if (field.type === 'switch') {
    // Boolean fields are always considered "filled" since they have a default state
    return true;
  } else if (field.type === 'date') {
    // For date fields, check if it's a valid date string
    const stringValue = String(value).trim();
    return stringValue.length > 0;
  } else if (field.type === 'tags' || field.type === 'multiSelect' || field.type === 'component-selector') {
    // For array fields, check if it's an array with at least one item
    return Array.isArray(value) && value.length > 0;
  } else {
    // For other types, convert to string and check for content
    const stringValue = String(value).trim();
    return stringValue.length > 0;
  }
};

export const getValidationSummary = (data: Record<string, any>, schema: ResourceSchema) => {
  const formFields = schema.fields.filter(field => 
    field.key !== 'id' && 
    field.key !== 'createdAt' && 
    field.key !== 'updatedAt' &&
    field.mobile?.displayFormat !== 'hidden' &&
    // Exclude auto-value fields from validation summary since they're populated automatically
    !field.autoValue
  );

  const requiredFields = formFields.filter(f => f.required);
  const filledRequiredFields = requiredFields.filter(f => isFieldFilled(f, data[f.key]));
  const missingRequiredFields = requiredFields.filter(f => !isFieldFilled(f, data[f.key]));

  const validation = validateFormData(data, schema);

  return {
    totalFields: formFields.length,
    requiredFields: requiredFields.length,
    filledRequiredFields: filledRequiredFields.length,
    missingRequiredFields: missingRequiredFields.length,
    fieldsWithErrors: Object.keys(validation.errors).length,
    canSubmit: validation.isValid,
    isValid: validation.isValid,
    errors: validation.errors,
    missingFields: missingRequiredFields.map(f => ({ key: f.key, label: f.label })),
    requiredFieldsStatus: requiredFields.map(f => ({
      key: f.key,
      label: f.label,
      type: f.type,
      value: data[f.key],
      filled: isFieldFilled(f, data[f.key]),
      hasError: !!validation.errors[f.key]
    }))
  };
};

// ============================================================================
// FORM VALIDATION HOOK
// ============================================================================

export const useFormValidation = (schema: ResourceSchema, formData: Record<string, any>) => {
  const validation = validateFormData(formData, schema);
  const summary = getValidationSummary(formData, schema);

  return {
    isValid: validation.isValid,
    errors: validation.errors,
    summary,
    canSubmit: validation.isValid
  };
}; 