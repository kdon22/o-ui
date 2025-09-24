# Auto-Generated Components - ACTUAL Implementation Guide

## Table of Contents
1. [Components Overview](#components-overview)
2. [AutoTable - Schema-Driven Tables](#autotable---schema-driven-tables)
3. [AutoForm - Schema-Driven Forms](#autoform---schema-driven-forms)
4. [AutoModal - Schema-Driven Modals](#automodal---schema-driven-modals)  
5. [AutoTree - Hierarchical Navigation](#autotree---hierarchical-navigation)
6. [Field System](#field-system)
7. [Component Integration](#component-integration)
8. [File Reference](#file-reference)

---

## Components Overview

The Action System provides **complete UI components** automatically generated from ResourceSchemas. Based on the actual implementation at `src/components/auto-generated/`, one schema definition produces:

- **AutoTable** - Full CRUD table with inline editing, bulk operations, filtering
- **AutoForm** - Validated forms with auto-population and junction creation
- **AutoModal** - CRUD modals with action system integration  
- **AutoTree** - Hierarchical navigation with <50ms performance
- **AutoDataTable** - Airtable-like data management with branch overlay

### **Actual File Structure**

```
src/components/auto-generated/
├── table/                          # AutoTable implementation
│   ├── auto-table.tsx (372 lines)  # Main table component
│   ├── hooks/                      # Table-specific hooks
│   ├── components/                 # Table subcomponents
│   └── types.ts                    # Type definitions
│
├── form/                           # AutoForm implementation
│   ├── auto-form.tsx (765 lines)   # Main form component
│   ├── fields/                     # Field components
│   ├── form-field.tsx              # Individual field wrapper
│   └── form-utils.ts               # Form utilities
│
├── modal/                          # AutoModal implementation
│   ├── auto-modal.tsx (335 lines)  # Main modal component
│   ├── modal-portal.tsx            # Portal implementation
│   └── utils.ts                    # Modal utilities
│
├── tree/                           # AutoTree implementation
│   ├── auto-tree.tsx (743 lines)   # Main tree component
│   ├── tree-node.tsx               # Individual tree node
│   ├── tree-context-menu.tsx       # Context menu
│   └── tree-actions.ts             # Tree action handlers
│
├── datatable/                      # AutoDataTable implementation
│   ├── auto-datatable.tsx          # Airtable-like interface
│   └── column-manager/             # Column management
│
└── index.ts                        # Main exports
```

### **Core Architecture Pattern**

```
ResourceSchema
       ↓
Auto-Generated Component
       ↓
┌─────────────────────────────────────────┐
│           Component Features             │
├─────────────────────────────────────────┤
│ • Schema-driven field rendering         │
│ • Action system integration             │
│ • Optimistic updates & background sync  │
│ • Branch-aware operations               │
│ • Mobile-first responsive design        │
│ • Auto-junction creation                │
│ • Context-aware auto-population         │
│ • Error boundaries & loading states     │
└─────────────────────────────────────────┘
```

---

## AutoTable - Schema-Driven Tables

### **Implementation**
**File**: `src/components/auto-generated/table/auto-table.tsx` (372 lines)

### **Basic Usage (ACTUAL)**

```typescript
import { AutoTable } from '@/components/auto-generated/table/auto-table';

// Complete CRUD table from schema
<AutoTable 
  resourceKey="office"              // Uses OFFICE_SCHEMA
  filters={{ status: 'active' }}   // Optional filters
  onRowClick={(office) => navigateTo(`/offices/${office.id}`)}
  
  // Branch-aware with Copy-on-Write
  navigationContext={{ nodeId: selectedNodeId }}
  
  // Two-level filtering
  level1Filter="status"
  level2Filter="region"
  
  // Custom header actions
  headerActions={[
    { id: 'bulk-delete', label: 'Delete Selected', icon: 'trash' }
  ]}
/>
```

### **Features (ACTUAL IMPLEMENTATION)**

- **Full CRUD Operations** - Create, read, update, delete with optimistic updates
- **Inline Editing** - Direct table cell editing with validation
- **Bulk Operations** - Multi-select with floating bulk actions menu
- **Branch-Aware Operations** - Copy-on-Write with auto-fork on edit
- **Two-Level Filtering** - Resource-level and entity-level filters
- **Junction Management** - Auto-creation and relationship handling
- **Mobile Responsive** - Touch-optimized with horizontal scrolling
- **Change Tracking** - Batch version tracking with unsaved changes indicator
- **Error Boundaries** - Graceful error handling and recovery

### **Hook System (ACTUAL)**
**Files**: `src/components/auto-generated/table/hooks/`

```typescript
// Table state management
const tableState = useTableState({ resource });

// Data fetching with branch overlay
const tableData = useTableData({ 
  resourceKey, 
  filters, 
  navigationContext 
});

// CRUD operations with optimistic updates
const tableMutations = useTableMutations({
  resourceKey,
  onSuccess: () => queryClient.invalidateQueries()
});

// Action handlers (delete, duplicate, bulk operations)
const tableActions = useTableActions({ 
  resourceKey, 
  navigationContext 
});

// Change tracking for batch operations
const changeHistory = useChangeHistory({ resourceKey });

// Version tracking for unsaved changes
const versionTracking = useBatchVersionTracking({ resourceKey });
```

### **Component Architecture**

```typescript
// Main component orchestrates specialized subcomponents
export const AutoTable: React.FC<AutoTableProps> = (props) => {
  // Hook orchestration
  const tableState = useTableState({ resource });
  const tableData = useTableData({ resourceKey, filters, navigationContext });
  const tableMutations = useTableMutations({ resourceKey });
  
  return (
    <div className="auto-table-container">
      <TableHeader 
        title={customTitle || resource.display.title}
        searchPlaceholder={customSearchPlaceholder}
        headerActions={headerActions}
      />
      
      <Level1FilterTabs 
        config={activeFilteringConfig}
        currentFilter={level1Filter}
        onChange={onLevel1FilterChange}
      />
      
      <TableStructure 
        resource={resource}
        data={processedData}
        mutations={tableMutations}
        onRowClick={onRowClick}
      />
      
      <FloatingBulkActions 
        selectedItems={selectedItems}
        onBulkAction={handleBulkAction}
      />
      
      <UnsavedChangesIndicator 
        changes={versionTracking.unsavedChanges}
        onSave={versionTracking.saveChanges}
      />
    </div>
  );
};
```

---

## AutoForm - Schema-Driven Forms

### **Implementation**
**File**: `src/components/auto-generated/form/auto-form.tsx` (765 lines)

### **Basic Usage (ACTUAL)**

```typescript
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { NODE_SCHEMA } from '@/features/nodes/nodes.schema';

// Schema-driven form with auto-population
<AutoForm 
  schema={NODE_SCHEMA}
  mode="create"                     // 'create' | 'edit'
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  
  // Context-aware auto-population
  navigationContext={{ nodeId: selectedNodeId, parentId: parentNodeId }}
  
  // Junction auto-creation
  enableJunctionCreation={true}     // Default: true for create mode
  
  // UI configuration
  compact={false}
  enableAnimations={true}
  enableKeyboardShortcuts={true}
  showCancel={true}
/>
```

### **Features (ACTUAL IMPLEMENTATION)**

- **Schema-Driven Rendering** - Automatic field generation from ResourceSchema
- **Auto-Value Processing** - Context-aware field auto-population
- **Junction Auto-Creation** - Automatic relationship creation on entity creation
- **Validation System** - Zod-based validation with custom rules
- **Tabbed Organization** - Multi-tab forms for complex schemas
- **Mobile-First Design** - Responsive field layouts and touch optimization
- **Error Boundaries** - Graceful error handling with recovery options
- **Keyboard Shortcuts** - Cmd+S to save, Esc to cancel
- **Loading States** - Skeleton loading and submission states

### **Auto-Value System Integration**

```typescript
// Auto-populated fields based on context sources
const generateCompleteDefaultValues = (
  schema: ResourceSchema,
  mode: 'create' | 'edit',
  navigationContext?: NavigationContext,
  componentContext?: { parentData?: any; contextId?: string },
  initialData?: Record<string, any>
): Record<string, any> => {
  const values: Record<string, any> = { ...initialData };

  schema.fields.forEach(field => {
    if (field.autoValue) {
      const { source, fallback, onlyIfAvailable } = field.autoValue;
      
      // Context-aware auto-population
      switch (source) {
        case 'auto.uuid':
          values[field.key] = crypto.randomUUID();
          break;
          
        case 'navigation.nodeId':
          if (navigationContext?.nodeId) {
            values[field.key] = navigationContext.nodeId;
          }
          break;
          
        case 'session.user.tenantId':
          values[field.key] = session?.user?.tenantId;
          break;
          
        case 'navigation.parentId':
          if (onlyIfAvailable && navigationContext?.parentId) {
            values[field.key] = navigationContext.parentId;
          }
          break;
      }
    }
  });

  return values;
};
```

### **Form Field System**
**Files**: `src/components/auto-generated/form/fields/`

```typescript
// Field rendering based on schema type
export const FormField: React.FC<FormFieldProps> = ({ 
  field, 
  register, 
  errors, 
  watch, 
  setValue 
}) => {
  const fieldType = field.type;
  
  switch (fieldType) {
    case 'text':
      return <TextInput {...fieldProps} />;
      
    case 'select':
      return <SelectInput {...fieldProps} options={field.options} />;
      
    case 'tags':
      return <TagsField {...fieldProps} />;
      
    case 'component-selector':
      return <ComponentSelector {...fieldProps} />;
      
    case 'currency':
      return <CurrencyField {...fieldProps} />;
      
    default:
      return <TextInput {...fieldProps} />;
  }
};
```

---

## AutoModal - Schema-Driven Modals

### **Implementation**
**File**: `src/components/auto-generated/modal/auto-modal.tsx` (335 lines)

### **Basic Usage (ACTUAL)**

```typescript
import { AutoModal } from '@/components/auto-generated/modal/auto-modal';
import { NODE_SCHEMA } from '@/features/nodes/nodes.schema';

// Schema-driven modal with action integration
<AutoModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  schema={NODE_SCHEMA}
  
  // Modal configuration
  config={{
    resource: 'node',
    action: 'create',           // 'create' | 'update'
    size: 'lg',                // 'sm' | 'md' | 'lg' | 'xl'
    title: 'Create New Node'   // Optional custom title
  }}
  
  // Context and data
  navigationContext={{ nodeId: selectedNodeId }}
  initialData={editingNode}    // For update mode
  parentData={parentNode}      // For hierarchical creation
  
  // Event handlers
  onSuccess={(data) => {
    console.log('Created:', data);
    setIsModalOpen(false);
  }}
  onError={(error) => {
    console.error('Modal error:', error);
  }}
/>
```

### **Features (ACTUAL IMPLEMENTATION)**

- **Action System Integration** - Uses `useResourceCreate` and `useResourceUpdate` hooks
- **Optimistic Updates** - Instant UI feedback with background sync
- **Navigation Context Resolution** - Auto-detects navigation context from URL/session
- **Modal Portal** - Proper modal rendering outside component tree
- **Responsive Design** - Mobile-optimized modal sizing and interactions
- **Error Handling** - Comprehensive error boundaries and user feedback
- **Auto-Form Integration** - Seamless integration with AutoForm component

### **Modal Configuration System**

```typescript
// Default modal configurations by action type
export const getDefaultModalConfig = (
  resource: string, 
  action: 'create' | 'update'
) => ({
  resource,
  action,
  size: 'lg' as const,
  title: action === 'create' ? `Create ${resource}` : `Update ${resource}`,
  showHeader: true,
  showFooter: false,  // AutoForm provides its own buttons
  closable: true,
  backdrop: true,
  keyboard: true,
  animation: true,
  className: '',
  overlayClassName: ''
});

// Modal size styling
export const getModalStyles = (config: any) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  return {
    modal: `${sizeClasses[config.size]} w-full mx-4`,
    overlay: 'fixed inset-0 bg-black/50 flex items-center justify-center p-4'
  };
};
```

---

## AutoTree - Hierarchical Navigation

### **Implementation**
**File**: `src/components/auto-generated/tree/auto-tree.tsx` (743 lines)

### **Basic Usage (ACTUAL)**

```typescript
import { AutoTree } from '@/components/auto-generated/tree/auto-tree';

// Hierarchical navigation with <50ms performance
<AutoTree
  rootNodeId="root-node-id"
  userRootNodeId={session?.user?.rootNodeId}
  
  // Event handlers
  onNodeSelect={(node) => {
    setSelectedNode(node);
    navigateTo(`/workspace/${node.idShort}`);
  }}
  onNodeExpand={(node) => {
    console.log('Expanded:', node.name);
  }}
  onTreeStatsChange={(stats) => {
    console.log(`${stats.visibleNodes}/${stats.totalNodes} nodes visible`);
  }}
  
  // Data pass-through for parent components
  onNodesDataChange={(nodesData) => {
    setTreeData(nodesData);
  }}
  
  // Styling
  className="h-full"
  maxHeight={600}
/>
```

### **Features (ACTUAL IMPLEMENTATION)**

- **<50ms Performance** - IndexedDB-first with ActionClient integration
- **Branch-Aware Operations** - Copy-on-Write with branch overlay
- **Context Menu Actions** - Add Node/Process/Office, Delete, Duplicate
- **Visual Design System** - Red house root, yellow folders, page icons
- **Connection Lines** - Dotted parent-child connection visualization
- **Keyboard Navigation** - Arrow keys, Enter, Delete shortcuts
- **Mobile Optimization** - Touch-friendly interactions and responsive design
- **URL Routing Integration** - Next.js router integration with proper state management
- **Real-time Updates** - Automatic tree updates on data changes

### **Tree Component System**

```typescript
// Main tree component with hook orchestration
export function AutoTree({ rootNodeId, onNodeSelect, ... }) {
  // State management
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Action system integration
  const { nodes, loading, error } = useNodeData();
  const treeActions = useTreeActions();
  const { resolveNode } = useNodeIdResolver();
  
  // Tree building with performance optimization
  const treeStructure = useMemo(() => {
    return buildTreeFromFlatList(nodes, rootNodeId);
  }, [nodes, rootNodeId]);
  
  // Render optimized tree structure
  return (
    <div className="auto-tree">
      <div className="tree-container">
        {treeStructure.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            isExpanded={expandedNodes.has(node.id)}
            isSelected={selectedNodeId === node.id}
            onToggle={handleToggle}
            onSelect={handleSelect}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>
      
      <TreeContextMenu
        node={contextMenuNode}
        position={contextMenuPosition}
        onAction={handleContextAction}
        onClose={() => setContextMenuNode(null)}
      />
    </div>
  );
}
```

### **Tree Node Component**
**File**: `src/components/auto-generated/tree/tree-node.tsx`

```typescript
export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onContextMenu
}) => {
  return (
    <div
      className={cn(
        "tree-node",
        `tree-node-level-${level}`,
        isSelected && "tree-node-selected",
        node.hasChildren && "tree-node-expandable"
      )}
      style={{ paddingLeft: `${level * 20}px` }}
      onClick={() => onSelect(node)}
      onContextMenu={(e) => onContextMenu(e, node)}
    >
      {node.hasChildren && (
        <button
          className="tree-expand-button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node);
          }}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      )}
      
      <div className="tree-node-icon">
        {getNodeIcon(node)}
      </div>
      
      <span className="tree-node-label">
        {node.name}
      </span>
      
      {node.childCount > 0 && (
        <span className="tree-node-count">
          ({node.childCount})
        </span>
      )}
    </div>
  );
};
```

---

## Field System

### **Field Components**
**Files**: `src/components/auto-generated/form/fields/`

The field system provides specialized input components for different data types:

```typescript
// Component selector for business rules/workflows
export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  value,
  onChange,
  componentType, // 'rules' | 'classes' | 'tables' | 'workflows'
  multiSelect = false,
  showPreview = true
}) => {
  // Schema-driven component selection with live preview
};

// Currency field with formatting
export const CurrencyField: React.FC<CurrencyFieldProps> = ({
  value,
  onChange,
  currency = 'USD',
  locale = 'en-US'
}) => {
  // Formatted currency input with validation
};

// Tags field with autocomplete
export const TagsField: React.FC<TagsFieldProps> = ({
  value,
  onChange,
  suggestions = [],
  allowCustom = true
}) => {
  // Tag management with autocomplete and validation
};
```

### **Field Type Registry (ACTUAL)**
Based on `src/lib/resource-system/schemas.ts`:

```typescript
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
  'component-selector': { input: 'ComponentSelectorInput', display: 'ComponentSelectorDisplay' },
  currency: { input: 'CurrencyInput', display: 'CurrencyDisplay' }
} as const;
```

---

## Component Integration

### **Usage in Pages**

```typescript
// Complete workspace page with auto-generated components
import { AutoTree } from '@/components/auto-generated/tree/auto-tree';
import { AutoTable } from '@/components/auto-generated/table/auto-table';
import { AutoModal } from '@/components/auto-generated/modal/auto-modal';

export default function WorkspacePage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  return (
    <div className="workspace-layout">
      {/* Left sidebar: Hierarchical navigation */}
      <aside className="w-64 border-r">
        <AutoTree
          rootNodeId={rootNodeId}
          onNodeSelect={setSelectedNode}
          onContextMenu={(node, action) => {
            if (action === 'add-child') {
              setIsCreateModalOpen(true);
            }
          }}
        />
      </aside>
      
      {/* Main content: Table view */}
      <main className="flex-1">
        <AutoTable
          resourceKey="process"
          navigationContext={{ nodeId: selectedNode?.id }}
          filters={{ status: 'active' }}
          onRowClick={(process) => {
            navigateTo(`/processes/${process.idShort}`);
          }}
        />
      </main>
      
      {/* Modal: Create operations */}
      <AutoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        schema={NODE_SCHEMA}
        config={{
          resource: 'node',
          action: 'create'
        }}
        navigationContext={{ nodeId: selectedNode?.id }}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          // Tree and table auto-refresh via action system
        }}
      />
    </div>
  );
}
```

### **Hook Integration Patterns**

```typescript
// Components use standardized hooks from the action system
import { 
  useActionQuery,           // Data fetching
  useResourceCreate,        // Create operations  
  useResourceUpdate,        // Update operations
  useResourceDelete,        // Delete operations
  useOptimisticMutation    // Optimistic updates
} from '@/hooks/use-action-api';

// Branch context integration
import { useBranchContext } from '@/lib/session';

// Navigation context integration  
import { useAutoNavigationContext } from '@/lib/resource-system/navigation-context';
```

---

## File Reference

### **Core Component Files**
- `src/components/auto-generated/table/auto-table.tsx` - AutoTable component (372 lines)
- `src/components/auto-generated/form/auto-form.tsx` - AutoForm component (765 lines)
- `src/components/auto-generated/modal/auto-modal.tsx` - AutoModal component (335 lines)
- `src/components/auto-generated/tree/auto-tree.tsx` - AutoTree component (743 lines)

### **Supporting Component Files**
- `src/components/auto-generated/datatable/auto-datatable.tsx` - Airtable-like data management
- `src/components/auto-generated/form/form-field.tsx` - Individual field wrapper
- `src/components/auto-generated/tree/tree-node.tsx` - Individual tree node
- `src/components/auto-generated/tree/tree-context-menu.tsx` - Tree context menu

### **Hook Files**
- `src/components/auto-generated/table/hooks/use-table-data.ts` - Data fetching
- `src/components/auto-generated/table/hooks/use-table-mutations.ts` - CRUD operations
- `src/components/auto-generated/table/hooks/use-table-actions.ts` - Action handlers
- `src/components/auto-generated/table/hooks/use-change-history.ts` - Change tracking
- `src/components/auto-generated/table/hooks/use-batch-version-tracking.ts` - Version tracking

### **Utility Files**
- `src/components/auto-generated/form/form-utils.ts` - Form processing utilities
- `src/components/auto-generated/modal/utils.ts` - Modal configuration utilities
- `src/components/auto-generated/tree/tree-actions.ts` - Tree action handlers

### **Field Component Files**
- `src/components/auto-generated/form/fields/component-selector.tsx` - Component selection
- `src/components/auto-generated/form/fields/currency-field.tsx` - Currency formatting
- `src/components/auto-generated/form/fields/tags-field.tsx` - Tag management

### **Style Files**
- `src/components/auto-generated/tree/auto-tree.css` - Tree-specific styles

---

**The Auto-Generated Components system provides enterprise-grade UI components that are automatically generated from ResourceSchemas. The actual implementation includes sophisticated features like branch-aware operations, optimistic updates, context-aware auto-population, and mobile-first design across all components.**