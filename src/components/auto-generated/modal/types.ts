/**
 * Auto-Modal Types - Schema-driven modal component types
 * 
 * Defines the interfaces for auto-generated modal components
 * that work with the action system and resource schemas.
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';

// ============================================================================
// MODAL CONFIGURATION
// ============================================================================

export interface AutoModalConfig {
  resource: string;
  action: 'create' | 'update' | 'delete';
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  height?: 'auto' | 'sm' | 'md' | 'lg' | 'xl';
  showHeader?: boolean;
  showFooter?: boolean;
  showCancel?: boolean;
  showSubmit?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  preventClose?: boolean;
  blur?: boolean; // Backdrop blur effect - defaults to true
}

// ============================================================================
// MODAL PROPS
// ============================================================================

export interface AutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoModalConfig;
  schema: ResourceSchema; // Pass schema directly
  
  // For create/update operations
  initialData?: any;
  parentData?: any; // For hierarchical creates (e.g., parent node)
  
  // Context for auto-population
  navigationContext?: { nodeId?: string; parentId?: string; selectedId?: string };
  
  // Event handlers
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  
  // Additional props
  className?: string;
  overlayClassName?: string;
}

// ============================================================================
// FORM PROPS
// ============================================================================

export interface AutoFormProps {
  schema: ResourceSchema;
  action: 'create' | 'update';
  initialData?: any;
  parentData?: any;
  
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  
  isLoading?: boolean;
  errors?: Record<string, string>;
  className?: string;
}

// ============================================================================
// FIELD PROPS
// ============================================================================

export interface AutoFieldProps {
  field: any; // From ResourceSchema field definition
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// MODAL CONTEXT
// ============================================================================

export interface ModalContext {
  schema: ResourceSchema;
  action: 'create' | 'update' | 'delete';
  isLoading: boolean;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  setLoading: (loading: boolean) => void;
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

export interface ModalActionHandlers {
  handleSubmit: (data: any) => Promise<void>;
  handleCancel: () => void;
  handleClose: () => void;
  validateForm: (data: any) => Record<string, string>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ModalAction = 'create' | 'update' | 'delete';

export interface ModalDimensions {
  width: string;
  height: string;
  maxWidth: string;
  maxHeight: string;
}

export interface ModalStyles {
  overlay: string;
  container: string;
  header: string;
  content: string;
  footer: string;
} 