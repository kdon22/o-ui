/**
 * SSOT Schema System - Core Interfaces
 * 
 * Single Source of Truth schema definitions that drive:
 * - Database operations
 * - API endpoints  
 * - Frontend forms and tables
 * - Mobile/desktop layouts
 * - Field validation
 * - Type safety
 */

// ============================================================================
// VALIDATION SYSTEM
// ============================================================================

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'url' | 'min' | 'max' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean | Promise<boolean>;
}

// ============================================================================
// ROW ACTIONS SYSTEM
// ============================================================================

export interface RowActionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value?: string | string[] | number | number[] | boolean;
}

export interface RowActionMutation {
  action: string;  // e.g., 'queues.update'
  payload: Record<string, any>;
  confirmMessage?: string;
}

export interface RowActionDialog {
  component: string;  // Component name to render
  title: string;
  action: string;     // Action to call after dialog
  props?: Record<string, any>;
}

export interface RowActionConfig {
  key: string;
  label: string;
  icon?: string;  // Lucide icon name
  variant?: 'default' | 'destructive' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  actionType: 'mutation' | 'dialog' | 'navigation' | 'custom';
  
  // Conditional visibility
  condition?: RowActionCondition;
  
  // For mutation actions
  mutation?: RowActionMutation;
  
  // For dialog actions  
  dialog?: RowActionDialog;
  
  // For navigation actions
  navigation?: {
    path: string;
    target?: '_self' | '_blank';
  };
  
  // For custom actions - handled by parent component
  customHandler?: string; // Key to match with customHandlers prop
  
  // Permissions
  permission?: string;
  
  // Tooltip
  tooltip?: string;
  
  // Loading state
  loadingText?: string;
}

// ============================================================================
// FIELD TYPES AND CONFIGURATION
// ============================================================================

export const FIELD_TYPES = {
  text: { input: 'TextInput', display: 'TextDisplay' },
  textarea: { input: 'TextareaInput', display: 'TextDisplay' },
  select: { input: 'SelectInput', display: 'BadgeDisplay' },
  multiSelect: { input: 'MultiSelectInput', display: 'BadgeListDisplay' },
  tags: { input: 'TagInput', display: 'TagDisplay' },
  switch: { input: 'SwitchInput', display: 'BadgeDisplay' },
  number: { input: 'NumberInput', display: 'TextDisplay' },
  color: { input: 'ColorInput', display: 'ColorDisplay' },
  icon: { input: 'IconInput', display: 'IconDisplay' },
  email: { input: 'EmailInput', display: 'TextDisplay' },
  url: { input: 'UrlInput', display: 'LinkDisplay' },
  date: { input: 'DateInput', display: 'DateDisplay' },
  avatar: { input: 'AvatarInput', display: 'AvatarDisplay' },
  json: { input: 'JsonInput', display: 'JsonDisplay' },
  richText: { input: 'RichTextInput', display: 'RichTextDisplay' },
  // Additional field types for modal utils compatibility
  tel: { input: 'TextInput', display: 'TextDisplay' },
  password: { input: 'PasswordInput', display: 'TextDisplay' },
  range: { input: 'RangeInput', display: 'TextDisplay' },
  checkbox: { input: 'CheckboxInput', display: 'BadgeDisplay' },
  multiselect: { input: 'MultiSelectInput', display: 'BadgeListDisplay' },
  datetime: { input: 'DateTimeInput', display: 'DateDisplay' },
  time: { input: 'TimeInput', display: 'TextDisplay' },
  file: { input: 'FileInput', display: 'FileDisplay' },
  image: { input: 'ImageInput', display: 'ImageDisplay' },
  code: { input: 'CodeInput', display: 'CodeDisplay' },
  // Marketplace-specific field types
  'component-selector': { input: 'ComponentSelectorInput', display: 'ComponentSelectorDisplay' },
  currency: { input: 'CurrencyInput', display: 'CurrencyDisplay' },
  // Permission management field types
  'permission-matrix': { input: 'PermissionMatrixInput', display: 'PermissionMatrixDisplay' },
  // Generic matrix field type (replaces permission-matrix for flexibility)
  matrix: { input: 'MatrixInput', display: 'MatrixDisplay' }
} as const;

export type FieldType = keyof typeof FIELD_TYPES;

// ============================================================================
// FIELD SCHEMA - SIMPLIFIED AND CLEAR
// ============================================================================

export interface FieldFormConfig {
  row: number;
  width: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'half' | 'third' | 'quarter' | '3quarters';
  order?: number;
  showInForm?: boolean;
  mobile?: {
    row?: number;
    width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'half' | 'third' | 'quarter' | '3quarters' | 'hidden';
  };
}

export interface FieldTableConfig {
  width: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  showInTable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  mobile?: {
    width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | 'hidden';
  };
}

export interface FieldOptions {
  static?: Array<{label: string; value: string; icon?: string}>;
  dynamic?: {
    resource: string;
    valueField: string;
    labelField: string;
    displayField?: string;
    filter?: (item: any) => boolean;
  };
  // Component selector options
  componentType?: 'rules' | 'classes' | 'tables' | 'workflows';
  multiSelect?: boolean;
  showPreview?: boolean;
}

// Context sources for auto-population
export type ContextSource = 
  | 'session.user.tenantId'
  | 'session.user.branchContext.currentBranchId'
  | 'session.user.branchContext.defaultBranchId'
  | 'session.user.id'
  | 'session.context.originalId'
  | 'navigation.nodeId'
  | 'navigation.parentId'
  | 'navigation.selectedId'
  | 'component.parentData'
  | 'component.contextId'
  | 'auto.timestamp'
  | 'auto.uuid'
  | 'auto.nodeShortId'
  | 'auto.ruleShortId'
  | 'auto.hierarchyPath'
  | 'auto.hierarchyAncestors'
  | 'self.id';

// Auto-value configuration
export interface AutoValueConfig {
  source: ContextSource;
  fallback?: any;
  transform?: (value: any) => any;
  required?: boolean;
  
  // 🔥 NEW: Conditional auto-population
  onlyIfAvailable?: boolean; // Only apply auto-value if context value exists and is not empty
  condition?: (value: any) => boolean; // Custom condition for applying auto-value
}

// Enhanced FieldSchema with context auto-population
export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  
  // Schema-driven field handling (SSOT for cleaners)
  // transient: UI-only/navigation helper – never persisted
  // computed: server-computed – always stripped on write
  // stripOn: fine-grained control per operation
  transient?: boolean;
  computed?: boolean;
  stripOn?: { create?: boolean; update?: boolean };
  
  // 🔥 NEW: Auto-population from context
  autoValue?: AutoValueConfig;
  
  // 🔥 NEW: Static default value
  defaultValue?: any;
  
  placeholder?: string;
  description?: string;
  tab?: string;
  clickable?: boolean; // NEW: Makes this column clickable to enter edit mode
  clickAction?: {
    type: 'edit' | 'navigate';
    url?: string; // URL pattern for navigation (e.g., "/rules/{idShort}")
    target?: '_self' | '_blank'; // Optional: how to open the URL
  };
  form?: FieldFormConfig;
  table?: FieldTableConfig;
  validation?: ValidationRule[];
  options?: FieldOptions;
  
  // Template-based field configuration (for matrix, complex components)
  template?: string; // Template identifier (e.g., 'permission-matrix', 'feature-grid')
  config?: Record<string, any>; // Template-specific configuration object
  
  // Mobile and Desktop specific configurations
  mobile?: {
    priority?: 'high' | 'medium' | 'low';
    displayFormat?: string;
    showInTable?: boolean;
    tableWidth?: string | number;
  };
  desktop?: {
    showInTable?: boolean;
    tableWidth?: string | number;
  };
}

// ============================================================================
// TABLE CONFIGURATION
// ============================================================================

export interface BulkSelectOption {
  id: string;
  label: string;
  icon: string;
  description?: string;
  handler: string;
  className?: string;
  confirmMessage?: string;
}

export interface ContextMenuItem {
  id: string;
  label?: string; // Optional for separators
  icon?: string;
  action?: string; // Optional for separators
  actionType?: 'inline-edit' | 'modal' | 'api' | 'handler';
  className?: string;
  confirmMessage?: string;
  separator?: boolean;
  
  // Context requirements
  contextRequirements?: {
    nodeId?: boolean;
    parentId?: boolean;
    branchId?: boolean;
    customContext?: string[];
  };
  
  // Conditional display
  conditions?: {
    field?: string;
    operator?: 'equals' | 'not-equals' | 'contains';
    value?: any;
    permission?: string;
  };
  
  // Action parameters
  parameters?: {
    endpoint?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    payloadMapping?: Record<string, string>;
    [key: string]: any;
  };
}

export interface TableConfig {
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  bulkSelect?: boolean;
  columnFilter?: boolean;
  sortableColumns?: boolean;
  bulkSelectOptions?: BulkSelectOption[];
  contextMenu?: ContextMenuItem[];
}

// ============================================================================
// UNIFIED RELATIONSHIP SYSTEM - ENHANCED SCHEMA-DRIVEN RELATIONSHIPS
// ============================================================================

export interface BaseRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'computed';
  relatedEntity: string;
  description?: string;
  eager?: boolean; // Load automatically with parent
  
  // Performance and caching
  cacheStrategy?: 'memory' | 'indexeddb' | 'hybrid' | 'none';
  preload?: boolean;
  
  // Prisma include handling
  excludeFromPrismaInclude?: boolean; // Exclude from automatic Prisma include generation
  
  // Business rules and validation
  validation?: {
    beforeCreate?: string[];
    afterCreate?: string[];
    beforeUpdate?: string[];
    afterUpdate?: string[];
    beforeDelete?: string[];
    afterDelete?: string[];
  };
  
  // Enterprise features
  cascadeDelete?: boolean;
  cascadeUpdate?: boolean;
  auditTrail?: boolean;
  permissions?: RelationshipPermissions;
}

export interface OneToOneRelationship extends BaseRelationship {
  type: 'one-to-one';
  foreignKey: string; // Field on this entity or related entity
  owner?: boolean; // True if this entity owns the relationship
}

export interface OneToManyRelationship extends BaseRelationship {
  type: 'one-to-many';
  foreignKey: string; // Field on related entity pointing back
  orderBy?: string;
}

export interface ManyToManyRelationship extends BaseRelationship {
  type: 'many-to-many';
  junction: {
    tableName: string;
    field: string; // Field pointing to this entity
    relatedField: string; // Field pointing to related entity
    attributes?: Record<string, JunctionAttributeConfig>;
    constraints?: JunctionConstraint[];
    indexes?: JunctionIndex[];
  };
}

export interface ComputedRelationship extends BaseRelationship {
  type: 'computed';
  computation: {
    include: string[];  // ['processes.rules']
    exclude?: string[]; // ['ruleIgnores']
    orderBy?: string[]; // ['processes.order', 'processRules.order']
    filters?: Record<string, any>;
  };
}

export interface JunctionAttributeConfig {
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  required?: boolean;
  default?: any;
  validation?: ValidationRule[];
}

export interface JunctionConstraint {
  type: 'unique' | 'check' | 'foreign_key';
  fields: string[];
  condition?: string;
}

export interface JunctionIndex {
  fields: string[];
  unique?: boolean;
  name?: string;
}

export interface RelationshipPermissions {
  create?: string;
  read?: string;
  update?: string;
  delete?: string;
}

export type RelationshipConfig = OneToOneRelationship | OneToManyRelationship | ManyToManyRelationship | ComputedRelationship;

// ============================================================================
// ACTION SYSTEM
// ============================================================================

export interface CustomAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  description?: string;
  handler?: string; // Handler function name (optional for server-only actions)
  serverOnly?: boolean; // Forces action to use server-only execution (SSOT pattern)
  confirmation?: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  };
}

export interface ActionsConfig {
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  duplicate?: boolean;
  bulk?: boolean;
  // Control optimistic updates - if false, operations go server-first
  optimistic?: boolean;
  
  // Force all operations to use server-only execution (SSOT pattern)
  serverOnly?: boolean;
  
  custom?: CustomAction[];
}

// ============================================================================
// DISPLAY AND UI CONFIGURATION
// ============================================================================

export interface DisplayConfig {
  title: string;
  description: string;
  icon?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  color?: string;
}

export interface SearchConfig {
  fields: string[];
  placeholder?: string;
  mobileFilters?: boolean;
  fuzzy?: boolean;
}

// ============================================================================
// FILTERING SYSTEM
// ============================================================================

export interface FilterTabConfig {
  id: string;
  label: string;
  value: string;
  description?: string;
  icon?: string;
  count?: number;
}

export interface Level1FilterConfig {
  title: string;
  filterField: string; // Field to filter on (e.g., 'processType')
  tabs: FilterTabConfig[];
  showAll?: boolean; // Show "All" tab
  defaultTab?: string; // Default tab ID
  addButton?: {
    label: string;
    action: string; // Action to trigger (e.g., 'create')
    icon?: string;
  };
}

export interface Level2FilterConfig {
  title: string;
  filterField: string; // Field to filter on (e.g., 'processName')
  groupBy: string; // Field to group by (e.g., 'processId')
  showAll?: boolean; // Show "All" tab
  emptyStateMessage?: string; // Message when no items in a group
}

export interface FilteringConfig {
  level1?: Level1FilterConfig; // Resource-specific filtering (e.g., process types)
  level2?: Level2FilterConfig; // Generic entity filtering (e.g., process names)
}

export interface MobileConfig {
  cardFormat: 'compact' | 'detailed' | 'custom';
  primaryField: string;
  secondaryFields: string[];
  showSearch: boolean;
  showFilters: boolean;
  fabPosition: 'bottom-right' | 'bottom-center' | 'bottom-left';
  swipeActions?: CustomAction[];
}

export interface DesktopConfig {
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  editableField?: string;
  rowActions?: boolean;
  bulkActions?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
}

// ============================================================================
// TREE CONFIGURATION (for hierarchical data)
// ============================================================================

export interface TreeConfig {
  parentField: string;
  childrenField?: string;
  hierarchyFields?: string[]; // e.g., ['path', 'level', 'sortOrder']
  rootValue?: any; // Value that indicates root level
  expandable?: boolean;
  defaultExpanded?: boolean;
  maxDepth?: number;
  contextMenu?: string[]; // Action IDs for context menu
  badges?: string[]; // Relationship counts to show as badges
}

// ============================================================================
// PERMISSIONS SYSTEM
// ============================================================================

export interface PermissionsConfig {
  create?: string | string[];
  update?: string | string[];
  delete?: string | string[];
  view?: string | string[];
  custom?: Record<string, string | string[]>;
}

// ============================================================================
// FORM CONFIGURATION
// ============================================================================

export interface FormConfig {
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  layout?: 'default' | 'compact' | 'spacious';
  showDescriptions?: boolean;
  showRequiredIndicators?: boolean;
  submitButtonText?: string;
  cancelButtonText?: string;
  className?: string;
}

// ============================================================================
// MAIN RESOURCE SCHEMA
// ============================================================================

export interface ResourceSchema {
  // Resource identity - BULLETPROOF 3-FIELD DESIGN
  databaseKey: string;      // IndexedDB store + API endpoints
  modelName: string;        // Prisma model access
  actionPrefix: string;     // Action naming
  
  // Context configuration
  notHasTenantContext?: boolean; // Disable tenant filtering (for global resources)
  notHasBranchContext?: boolean; // Disable branch filtering (for non-versioned resources)
  notHasAuditFields?: boolean;   // Disable audit fields (for models without updatedBy/version)
  
  // Server-only configuration for large datasets
  serverOnly?: boolean;          // Forces all operations to use server-only execution (SSOT pattern)
  cacheStrategy?: 'indexeddb' | 'memory' | 'server-only'; // Caching strategy
  
  // UI Display
  display: DisplayConfig;
  
  // Mobile-first field configuration
  fields: FieldSchema[];
  
  // Relationship definitions
  relationships?: Record<string, RelationshipConfig>;
  
  // Tree configuration (for hierarchical data like nodes)
  tree?: TreeConfig;
  
  // Search and filtering
  search: SearchConfig;
  
  // Two-level filtering configuration
  filtering?: FilteringConfig;
  
  // Actions configuration
  actions: ActionsConfig;
  
  // Row-level actions (for table rows)
  rowActions?: RowActionConfig[];
  
  // Mobile-first layout
  mobile: MobileConfig;
  
  // Desktop table configuration  
  desktop: DesktopConfig;
  
  // Table configuration
  table?: TableConfig;
  
  // Permissions
  permissions?: PermissionsConfig;
  
  // Form configuration
  form?: FormConfig;
  
  // Hooks for custom logic
  hooks?: {
    beforeCreate?: string;
    afterCreate?: string;
    beforeUpdate?: string;
    afterUpdate?: string;
    beforeDelete?: string;
    afterDelete?: string;
  };
  
  // IndexedDB key configuration
  indexedDBKey?: ((record: any) => string) | null;
}

// ============================================================================
// QUERY AND MUTATION OPTIONS
// ============================================================================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
  filters?: Record<string, any>;
  include?: string[]; // Relationships to include
  search?: string;
  
  serverOnly?: boolean; // Force server-only operation
}

export interface MutationContext extends BranchContext {
  branchId?: string; // Legacy field for backward compatibility
  timestamp: number;
}

export interface BranchContext {
  currentBranchId: string;
  defaultBranchId: string;
  tenantId: string;
  userId: string;
}

// ============================================================================
// ACTION SYSTEM TYPES
// ============================================================================

export type ActionType = 'create' | 'update' | 'delete' | 'list' | 'get' | 'custom';

export interface ActionRequest {
  action: string; // e.g., 'node.create', 'process.list'
  data?: any;
  options?: QueryOptions;
  context?: MutationContext;
  branchContext?: BranchContext;
}

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  junctions?: Record<string, any[]>; // Junction table data from server
  error?: string;
  timestamp: number;
  action: string;
  cached?: boolean;
  executionTime?: number;
  queued?: boolean;
  fallback?: boolean; // ✅ Added for graceful fallback responses
} 