/**
 * Types for Auto-Table Components
 */

import type { ResourceSchema, FieldSchema, FilteringConfig } from '@/lib/resource-system/schemas';

export interface AutoTableProps {
  resourceKey: string;
  filters?: Record<string, any>;
  onRowClick?: (entity: any) => void;
  className?: string;
  // Two-level filtering support
  level1Filter?: string;
  level2Filter?: string;
  onLevel1FilterChange?: (value: string) => void;
  onLevel2FilterChange?: (value: string) => void;
  // Override filtering configuration (for cross-schema filtering)
  filteringConfig?: FilteringConfig;
  // Custom header actions (e.g., Attach, Add with custom handlers)
  headerActions?: React.ReactNode | ((handleAdd: () => void) => React.ReactNode);
  // Enhanced data for rule hierarchy with visual styling
  enhancedData?: any[];
  processTypes?: Array<{ id: string; name: string; count: number }>;
  processNames?: Array<{ id: string; name: string; count: number; type: string }>;
  // Custom title override for the table header
  customTitle?: string;
  // Custom search placeholder override
  customSearchPlaceholder?: string;
  // Button styling variant (for settings tables, etc.)
  buttonVariant?: 'blue' | 'black' | 'gray';
  // Navigation context for context menu actions
  navigationContext?: {
    nodeId?: string | null;
    parentId?: string | null;
    branchId?: string | null;
    tenantId?: string | null;
    userId?: string | null;
    [key: string]: any;
  };
}

export interface InlineFormProps {
  resource: ResourceSchema;
  entity?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  parentData?: Record<string, any>;
  navigationContext?: { nodeId?: string; parentId?: string; selectedId?: string };
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FloatingBulkActionsProps {
  resource: ResourceSchema;
  selectedCount: number;
  onAction: (actionId: string) => void;
  isVisible: boolean;
}

export interface ContextMenuProps {
  entity: any;
  resource: ResourceSchema;
  resourceKey: string;
  onEdit: (entity: any) => void;
  onDelete: (entity: any) => void;
  onDuplicate?: (entity: any) => void;
  customHandlers?: Record<string, (entity: any) => void>;
  contextData?: {
    nodeId?: string | null;
    parentId?: string | null;
    branchId?: string | null;
    tenantId?: string | null;
    userId?: string | null;
    [key: string]: any;
  };
}

export interface ColumnFilterProps {
  column: { key: string; header: string };
  value: string;
  onChange: (value: string) => void;
}

export interface TableColumn {
  key: string;
  header: string;
  width: string;
  sortable: boolean;
  filterable: boolean;
  render: (entity: any) => React.ReactNode;
}

export interface HeaderActionProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export interface HeaderActionsProps {
  actions: HeaderActionProps[];
  className?: string;
} 