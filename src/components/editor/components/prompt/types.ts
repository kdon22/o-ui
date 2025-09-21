export interface PromptLayoutItem {
  x: number;
  y: number;
  id: string;
  type: 'label' | 'text-input' | 'select' | 'checkbox' | 'radio' | 'divider' | 'table';
  label?: string;
  config: {
    componentId: string;
    label?: string;
    placeholder?: string;
    width?: number;
    height?: number;
    fontSize?: number;
    textColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    required?: boolean;
    isDisabled?: boolean;
    options?: Array<{
      label: string;
      value: string;
      isDefault?: boolean;
    }>;
    checkboxSize?: 'sm' | 'md' | 'lg';
    color?: string;
    // Radio specific: label positioning relative to options
    labelPosition?: 'left' | 'top' | 'right' | 'bottom';
    // Radio specific: orientation of options
    orientation?: 'vertical' | 'horizontal';
    // Divider specific
    style?: 'solid' | 'dashed' | 'dotted';
    thickness?: number;

    // Table specific (optional; ignored by other components)
    columns?: Array<{ label?: string; width?: number }>;
    selection?: { mode?: 'none' | 'single' | 'multi'; preselected?: number[] };
    showGridLines?: boolean;
    gridLineStyle?: 'solid' | 'dashed' | 'dotted';
  };
}

export interface PromptLayout {
  items: PromptLayoutItem[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface PromptExecutionData {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  inputData?: Record<string, any>;
  responseData?: Record<string, any>;
  executionUrl?: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  prompts: Array<{
    id: string;
    promptName: string;
    layout: any;
    order: number;
  }>;
}

export interface CreateExecutionRequest {
  ruleName: string;
  promptNames: string[] | string; // Can be array or single string
  sessionId?: string;
  // Optional runtime input: supports table data bindings, etc.
  inputData?: Record<string, any>;
}

export interface CreateExecutionResponse {
  execution: {
    id: string;
    status: string;
    executionUrl: string;
    expiresAt?: string;
  };
}

export interface SubmitExecutionRequest {
  responseData: Record<string, any>;
}

export interface FormValidation {
  isValid: boolean;
  missingRequired: string[];
  errors: Record<string, string>;
}

export interface PromptFormData {
  [key: string]: any;
  __validation?: FormValidation;
} 