/**
 * SSOT Field Registry - Mobile-First Component System
 * 
 * Maps field types to input/display components with responsive design:
 * - Input components for forms and editing
 * - Display components for tables and cards  
 * - Mobile-first responsive rendering
 * - Validation integration
 */

import React from 'react';
import type { FieldType, FieldSchema, ValidationRule } from './schemas';
import { TagFormField } from '@/components/ui/tags/tag-form-field';
import { Badge } from '@/components/ui/badge';
import { useActionQuery } from '@/hooks/use-action-api';
import { 
  PermissionMatrixInput, 
  PermissionMatrixDisplay 
} from '@/components/ui/permission-matrix/permission-matrix-input';
import { EnhancedJsonInput } from '@/components/ui/json-input/enhanced-json-input';

// ============================================================================
// FIELD COMPONENT TYPES
// ============================================================================

export interface FieldInputProps {
  value: any;
  onChange: (value: any) => void;
  field: FieldSchema;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export interface FieldDisplayProps {
  value: any;
  field: FieldSchema;
  className?: string;
  onClick?: () => void;
}

export interface FieldComponent {
  Input: React.ComponentType<FieldInputProps>;
  Display: React.ComponentType<FieldDisplayProps>;
}

// ============================================================================
// BASE FIELD COMPONENTS - Simple implementations
// ============================================================================

// Text Input Component
const TextInput: React.FC<FieldInputProps> = ({ 
  value = '', 
  onChange, 
  field, 
  error, 
  disabled, 
  autoFocus, 
  className = '' 
}) => (
  <div className="field-wrapper">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`
        w-full px-3 py-2 border border-gray-300 rounded-md
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${error ? 'border-red-500' : ''}
        ${className}
      `}
    />
    {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
  </div>
);

// Text Display Component
const TextDisplay: React.FC<FieldDisplayProps> = ({ 
  value, 
  field, 
  className = '', 
  onClick 
}) => (
  <span 
    className={`${field.clickable ? 'cursor-pointer hover:text-blue-600' : ''} ${className}`}
    onClick={onClick}
  >
    {value || '-'}
  </span>
);

// Textarea Input Component
const TextareaInput: React.FC<FieldInputProps> = ({ 
  value = '', 
  onChange, 
  field, 
  error, 
  disabled, 
  autoFocus, 
  className = '' 
}) => (
  <div className="field-wrapper">
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      rows={4}
      className={`
        w-full px-3 py-2 border border-gray-300 rounded-md resize-vertical
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${error ? 'border-red-500' : ''}
        ${className}
      `}
    />
    {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
  </div>
);

// Select Input Component
const SelectInput: React.FC<FieldInputProps> = ({ 
  value = '', 
  onChange, 
  field, 
  error, 
  disabled, 
  className = '' 
}) => {
  const options = field.options?.static || [];
  
  return (
    <div className="field-wrapper">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
      >
        <option value="">{field.placeholder || 'Select...'}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

// Badge Display Component
const BadgeDisplay: React.FC<FieldDisplayProps> = ({ 
  value, 
  field, 
  className = '' 
}) => {
  if (!value) return <span className="text-gray-400">-</span>;
  
  const option = field.options?.static?.find(opt => opt.value === value);
  const label = option?.label || value;
  
  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
      bg-blue-100 text-blue-800 
      ${className}
    `}>
      {label}
    </span>
  );
};

// Switch Input Component
const SwitchInput: React.FC<FieldInputProps> = ({ 
  value = false, 
  onChange, 
  field, 
  error, 
  disabled, 
  className = '' 
}) => (
  <div className="field-wrapper">
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={`
          sr-only peer
          ${className}
        `}
      />
      <div className="
        relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
        peer-focus:ring-blue-300 rounded-full peer 
        peer-checked:after:translate-x-full peer-checked:after:border-white 
        after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
        after:bg-white after:border-gray-300 after:border after:rounded-full 
        after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600
        peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
      "></div>
    </label>
    {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
  </div>
);

// Number Input Component
const NumberInput: React.FC<FieldInputProps> = ({ 
  value = '', 
  onChange, 
  field, 
  error, 
  disabled, 
  autoFocus, 
  className = '' 
}) => (
  <div className="field-wrapper">
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      placeholder={field.placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`
        w-full px-3 py-2 border border-gray-300 rounded-md
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${error ? 'border-red-500' : ''}
        ${className}
      `}
    />
    {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
  </div>
);

// ============================================================================
// TAG COMPONENTS - Universal Tag System Integration
// ============================================================================

const TagInput: React.FC<FieldInputProps> = ({ 
  value = [], 
  onChange, 
  field, 
  error, 
  disabled, 
  className = '' 
}) => {
  return (
    <div className={`field-wrapper ${className}`}>
      <TagFormField
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="space-y-2"
      />
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

const TagDisplay: React.FC<FieldDisplayProps> = ({ value = [], field }) => {
  // Fetch tag details for display
  const { data: tagsResponse } = useActionQuery(
    'tag.list',
    { 
      filters: { 
        id: { in: Array.isArray(value) ? value : [] },
        isActive: true 
      } 
    },
    { enabled: Array.isArray(value) && value.length > 0 }
  );

  const tags = tagsResponse?.data || [];

  if (!tags.length) {
    return <span className="text-muted-foreground text-sm">No tags</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag: any) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="text-xs px-2 py-1 inline-flex items-center gap-1"
          style={{ 
            backgroundColor: `${tag.color}15`,
            borderColor: `${tag.color}40`,
            color: tag.color
          }}
        >
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0" 
            style={{ backgroundColor: tag.color }}
          />
          {tag.name}
        </Badge>
      ))}
    </div>
  );
};

// Enhanced JSON and permission components now imported at top

// Placeholder components for other field types
const ColorInput = TextInput;
const ColorDisplay = TextDisplay;
const IconInput = TextInput;
const IconDisplay = TextDisplay;
const EmailInput = TextInput;
const UrlInput = TextInput;
const LinkDisplay = TextDisplay;
const DateInput = TextInput;
const DateDisplay = TextDisplay;
const AvatarInput = TextInput;
const AvatarDisplay = TextDisplay;
const JsonInput = EnhancedJsonInput;  // ✅ Use enhanced JSON input
const JsonDisplay = TextDisplay;
const RichTextInput = TextareaInput;
const RichTextDisplay = TextDisplay;
const MultiSelectInput = SelectInput;
const BadgeListDisplay = BadgeDisplay;

// ============================================================================
// FIELD COMPONENT REGISTRY
// ============================================================================

export const FIELD_COMPONENTS: Record<FieldType, FieldComponent> = {
  text: { Input: TextInput, Display: TextDisplay },
  textarea: { Input: TextareaInput, Display: TextDisplay },
  select: { Input: SelectInput, Display: BadgeDisplay },
  multiSelect: { Input: MultiSelectInput, Display: BadgeListDisplay },
  tags: { Input: TagInput, Display: TagDisplay },
  switch: { Input: SwitchInput, Display: BadgeDisplay },
  number: { Input: NumberInput, Display: TextDisplay },
  color: { Input: ColorInput, Display: ColorDisplay },
  icon: { Input: IconInput, Display: IconDisplay },
  email: { Input: EmailInput, Display: TextDisplay },
  url: { Input: UrlInput, Display: LinkDisplay },
  date: { Input: DateInput, Display: DateDisplay },
  avatar: { Input: AvatarInput, Display: AvatarDisplay },
  json: { Input: JsonInput, Display: JsonDisplay },
  richText: { Input: RichTextInput, Display: RichTextDisplay },
  'permission-matrix': { Input: PermissionMatrixInput, Display: PermissionMatrixDisplay }
};

// ============================================================================
// FIELD RENDERER COMPONENTS
// ============================================================================

export interface FieldRendererProps extends Omit<FieldInputProps, 'onChange'> {
  mode: 'input' | 'display';
  onChange?: (value: any) => void;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({ 
  mode, 
  field, 
  value, 
  onChange, 
  ...props 
}) => {
  const component = FIELD_COMPONENTS[field.type];
  if (!component) {
    
    return <span className="text-red-500">Unknown field type: {field.type}</span>;
  }
  
  if (mode === 'input') {
    const InputComponent = component.Input;
    return (
      <InputComponent
        field={field}
        value={value}
        onChange={onChange || (() => {})}
        {...props}
      />
    );
  } else {
    const DisplayComponent = component.Display;
    return (
      <DisplayComponent
        field={field}
        value={value}
        {...props}
      />
    );
  }
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateField(value: any, field: FieldSchema): string | null {
  if (!field.validation) return null;
  
  for (const rule of field.validation) {
    const error = validateRule(value, rule);
    if (error) return error;
  }
  
  return null;
}

function validateRule(value: any, rule: ValidationRule): string | null {
  switch (rule.type) {
    case 'required':
      if (value === null || value === undefined || value === '') {
        return rule.message;
      }
      break;
      
    case 'minLength':
      if (typeof value === 'string' && value.length < rule.value) {
        return rule.message;
      }
      break;
      
    case 'maxLength':
      if (typeof value === 'string' && value.length > rule.value) {
        return rule.message;
      }
      break;
      
    case 'pattern':
      if (typeof value === 'string' && !rule.value.test(value)) {
        return rule.message;
      }
      break;
      
    case 'email':
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value === 'string' && !emailPattern.test(value)) {
        return rule.message;
      }
      break;
      
    case 'url':
      try {
        new URL(value);
      } catch {
        return rule.message;
      }
      break;
      
    case 'min':
      if (typeof value === 'number' && value < rule.value) {
        return rule.message;
      }
      break;
      
    case 'max':
      if (typeof value === 'number' && value > rule.value) {
        return rule.message;
      }
      break;
      
    case 'custom':
      if (rule.validator && !rule.validator(value)) {
        return rule.message;
      }
      break;
  }
  
  return null;
}

// ============================================================================
// RESPONSIVE HELPERS
// ============================================================================

export function getFieldDisplayConfig(field: FieldSchema, isMobile: boolean) {
  const config = isMobile ? field.mobile : field.desktop;
  
  return {
    tableWidth: config?.tableWidth ?? 'auto',
    priority: field.mobile?.priority ?? 'medium',
    displayFormat: field.mobile?.displayFormat ?? 'text'
  };
}

export function shouldShowField(field: FieldSchema, isMobile: boolean, priority: 'high' | 'medium' | 'low' = 'low') {
  if (!isMobile) return true;
  
  const fieldPriority = field.mobile?.priority ?? 'medium';
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  
  return priorityOrder[fieldPriority] >= priorityOrder[priority];
}