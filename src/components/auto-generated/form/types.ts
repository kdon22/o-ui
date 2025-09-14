import type { ResourceSchema, FieldSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormRow {
  rowNumber: number;
  fields: FieldSchema[];
}

export interface FormTab {
  key: string;
  label: string;
  fields: FieldSchema[];
}

export interface AutoFormProps {
  schema: ResourceSchema;
  mode: 'create' | 'edit';
  initialData?: Record<string, any>;
  parentData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
  enableAnimations?: boolean;
  enableKeyboardShortcuts?: boolean;
  onError?: (error: Error) => void;
  showCancel?: boolean;
}

export interface InlineFormProps {
  resource: ResourceSchema;
  entity?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  parentData?: Record<string, any>;
} 