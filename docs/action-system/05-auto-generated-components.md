# Auto-Generated Components

## Table of Contents
1. [Components Overview](#components-overview)
2. [AutoTable - Schema-Driven Tables](#autotable---schema-driven-tables)
3. [AutoForm - Schema-Driven Forms](#autoform---schema-driven-forms)
4. [AutoModal - Schema-Driven Modals](#automodal---schema-driven-modals)
5. [AutoTree - Hierarchical Navigation](#autotree---hierarchical-navigation)
6. [Field System](#field-system)
7. [Mobile-First Design](#mobile-first-design)
8. [Integration Patterns](#integration-patterns)
9. [Customization](#customization)
10. [Best Practices](#best-practices)

---

## Components Overview

The Action System automatically generates **complete UI components** from ResourceSchemas. One schema definition produces:

- **AutoTable** - Full CRUD table with inline editing
- **AutoForm** - Validated forms with mobile optimization
- **AutoModal** - CRUD modals with action integration  
- **AutoTree** - Hierarchical navigation with <50ms performance
- **Field Components** - Type-specific input components

### **Schema → Components Flow**

```
ResourceSchema
       ↓
┌─────────────────────────────────────────┐
│           Auto-Generation               │
├─────────────────────────────────────────┤
│ • Tables with CRUD operations           │
│ • Forms with validation                 │  
│ • Modals with optimistic updates        │
│ • Trees with instant navigation         │
│ • Fields with mobile optimization       │
└─────────────────────────────────────────┘
```

### **Core Benefits**

✅ **Zero Boilerplate** - Complete UI from schema  
✅ **Consistent UX** - Uniform behavior across features  
✅ **Mobile-First** - Responsive by design  
✅ **Performance** - Optimized with action system  
✅ **Type-Safe** - Full TypeScript support  
✅ **Extensible** - Easy to customize and extend  

---

## AutoTable - Schema-Driven Tables

### **Basic Usage**

```typescript
import { AutoTable } from '@/components/auto-generated/table/auto-table';

// Complete CRUD table from schema
<AutoTable 
  resourceKey="offices"           // Uses OFFICE_SCHEMA
  filters={{ status: 'active' }} // Optional filters
  onRowClick={(office) => navigateTo(`/offices/${office.id}`)}
/>
```

### **Features**

- **Full CRUD Operations** - Create, read, update, delete with optimistic updates
- **Inline Editing** - Edit rows directly in table with slide-down forms
- **Bulk Operations** - Multi-select with floating bulk actions menu
- **Filtering** - Column filters and two-level filter tabs
- **Sorting** - Click headers to sort columns  
- **Search** - Global search across visible columns
- **Mobile Responsive** - Touch-optimized with horizontal scrolling
- **Performance** - Virtual scrolling for large datasets

### **Advanced Configuration**

```typescript
<AutoTable 
  resourceKey="offices"
  
  // Two-level filtering
  level1Filter="status"
  level2Filter="region"  
  onLevel1FilterChange={(value) => setStatusFilter(value)}
  onLevel2FilterChange={(value) => setRegionFilter(value)}
  
  // Custom filtering logic
  filteringConfig={{
    level1: {
      field: 'status',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    level2: {
      field: 'region',  
      options: [
        { value: 'all', label: 'All Regions' },
        { value: 'north', label: 'North' },
        { value: 'south', label: 'South' }
      ]
    }
  }}
  
  // Custom header actions
  headerActions={(handleAdd) => (
    <div className="flex gap-2">
      <Button onClick={handleAdd} variant="primary">
        Add Office
      </Button>
      <Button onClick={handleImport} variant="outline">
        Import CSV
      </Button>
    </div>
  )}
  
  // Navigation context for actions
  navigationContext={{
    nodeId: currentNode?.id,
    branchId: currentBranch?.id,
    tenantId: session?.user?.tenantId
  }}
/>
```

### **Inline Editing**

AutoTable provides smooth inline editing with slide-down forms:

```typescript
// Schema configuration drives inline editing
const OFFICE_SCHEMA = {
  fields: [
    {
      key: 'name',
      mobile: { priority: 'high' },    // Shows in inline form
      desktop: { showInTable: true }   // Shows as table column
    },
    {
      key: 'description', 
      mobile: { priority: 'medium' },  // Shows in expanded inline form
      desktop: { showInTable: false }  // Hidden from table (too long)
    }
  ]
};

// Inline editing automatically available:
// - Click row to expand inline form
// - Edit fields with validation
// - Save with optimistic updates
// - Cancel to revert changes
```

### **Bulk Operations**

```typescript
// Floating bulk actions menu appears when items selected
<AutoTable 
  resourceKey="offices"
  // Bulk operations configured in schema actions:
  // actions: {
  //   bulkDelete: true,
  //   bulkUpdate: true,
  //   custom: [{ id: 'bulkArchive', label: 'Archive Selected' }]
  // }
/>

// Users can:
// - Select multiple rows with checkboxes
// - Floating action menu appears
// - Bulk delete, update, or custom actions
// - Progress indicators for batch operations
```

---

## AutoForm - Schema-Driven Forms

### **Basic Usage**

```typescript
import { AutoForm } from '@/components/auto-generated/form/auto-form';

const OfficeForm = ({ office, onSave, onCancel }) => {
  return (
    <AutoForm
      schema={OFFICE_SCHEMA}
      mode={office ? 'edit' : 'create'}
      initialData={office}
      onSubmit={onSave}
      onCancel={onCancel}
    />
  );
};
```

### **Features**

- **Schema-Driven Fields** - All fields generated from schema definition
- **Mobile-First Layout** - Responsive field positioning (1-3 fields per row)
- **Real-Time Validation** - Zod validation with instant feedback
- **Auto-Population** - Context-aware field population
- **Tab Organization** - Fields organized into logical tabs
- **Animations** - Smooth field entrance animations
- **Auto-Save** - Draft functionality with local storage
- **Keyboard Shortcuts** - Cmd+S to save, Esc to cancel

### **Form Configuration**

```typescript
<AutoForm
  schema={OFFICE_SCHEMA}
  mode="create"
  
  // Context-aware auto-population
  navigationContext={{
    nodeId: 'node123',      // Auto-populates nodeId field
    parentId: 'parent456'   // Auto-populates parentId field
  }}
  
  // Parent data for relationships
  parentData={{
    nodeId: currentNode.id,
    tenantId: session.user.tenantId
  }}
  
  // Form behavior
  compact={true}                    // Compact spacing for modals
  enableAnimations={true}           // Field entrance animations
  enableKeyboardShortcuts={true}    // Cmd+S, Esc shortcuts
  
  onSubmit={async (data) => {
    await createOffice(data);       // Optimistic update
  }}
  
  onError={(error) => {
    toast.error('Validation failed');
  }}
/>
```

### **Field Auto-Value System**

Forms automatically populate fields based on context:

```typescript
// Schema with auto-value configuration
{
  key: 'id',
  autoValue: { source: 'auto.uuid' }         // Generates UUID
},
{
  key: 'slug', 
  autoValue: { 
    source: 'auto.slug', 
    dependency: 'name'                        // Generates from name field
  }
},
{
  key: 'nodeId',
  autoValue: { source: 'context.nodeId' }    // From navigation context
},
{
  key: 'createdBy',
  autoValue: { source: 'session.userId' }    // From user session
}

// Form automatically populates these fields without user input
```

### **Tab Organization**

Fields are automatically organized into tabs based on priority and type:

```typescript
// Schema drives tab organization
const OFFICE_SCHEMA = {
  fields: [
    { key: 'name', mobile: { priority: 'high' } },      // "Basic Info" tab
    { key: 'address', mobile: { priority: 'high' } },   // "Basic Info" tab  
    { key: 'config', mobile: { priority: 'low' } },     // "Advanced" tab
    { key: 'notes', mobile: { priority: 'medium' } }    // "Details" tab
  ]
};

// AutoForm automatically creates tabs:
// - "Basic Info" (high priority fields)
// - "Details" (medium priority fields)  
// - "Advanced" (low priority fields)
```

### **Mobile-First Field Layout**

Fields are positioned based on mobile configuration:

```typescript
// 1-3 fields per row based on mobile priority and type
{
  key: 'name',
  type: 'text',
  mobile: { priority: 'high' }        // Full width on mobile
},
{
  key: 'status',  
  type: 'select',
  mobile: { priority: 'high' }        // Shares row on desktop
},
{
  key: 'isActive',
  type: 'switch', 
  mobile: { priority: 'medium' }      // Small field, shares row
}

// AutoForm layout algorithm:
// - High priority text fields: full width
// - High priority select fields: half width  
// - Medium/low priority fields: third width
// - Always responsive and touch-friendly
```

---

## AutoModal - Schema-Driven Modals

### **Basic Usage**

```typescript
import { AutoModal } from '@/components/auto-generated/modal/auto-modal';

const [modalState, setModalState] = useState({
  isOpen: false,
  action: 'create',
  data: null
});

<AutoModal
  isOpen={modalState.isOpen}
  onClose={() => setModalState({ isOpen: false })}
  
  config={{
    resource: 'office',
    action: modalState.action,    // 'create' | 'update' | 'delete'
    width: 'lg',                 // 'sm' | 'md' | 'lg' | 'xl'
    blur: true                   // Backdrop blur effect
  }}
  
  schema={OFFICE_SCHEMA}
  initialData={modalState.data}
  
  onSuccess={(result) => {
    console.log('Operation completed:', result);
    setModalState({ isOpen: false });
  }}
  
  onError={(error) => {
    toast.error(`Operation failed: ${error.message}`);
  }}
/>
```

### **Features**

- **Complete CRUD Operations** - Create, update, delete with optimistic updates
- **Schema-Driven Forms** - Uses AutoForm internally
- **Responsive Design** - Mobile-first with touch-optimized interactions
- **Action Integration** - Seamless integration with action system
- **Validation** - Real-time validation with error display
- **Loading States** - Proper loading and disabled states
- **Keyboard Navigation** - Tab navigation and keyboard shortcuts
- **Blur Effects** - Beautiful backdrop blur (optional)

### **Modal Configuration**

```typescript
const config: AutoModalConfig = {
  resource: 'office',
  action: 'create',
  
  // Size and appearance
  width: 'lg',                    // Modal width
  height: 'auto',                 // Modal height  
  blur: true,                     // Backdrop blur
  
  // Header and footer
  showHeader: true,               // Show modal header
  showFooter: false,              // Hide footer (AutoForm has buttons)
  
  // Behavior
  preventClose: false,            // Allow clicking outside to close
  
  // Button labels
  submitLabel: 'Create Office',
  cancelLabel: 'Cancel'
};
```

### **Action-Specific Modals**

```typescript
// Create Modal
<AutoModal
  config={{ resource: 'office', action: 'create' }}
  schema={OFFICE_SCHEMA}
  parentData={{ nodeId: currentNode.id }}    // For hierarchical creates
/>

// Update Modal  
<AutoModal
  config={{ resource: 'office', action: 'update' }}
  schema={OFFICE_SCHEMA}
  initialData={selectedOffice}               // Pre-populate form
/>

// Delete Confirmation Modal
<AutoModal
  config={{ resource: 'office', action: 'delete' }}
  schema={OFFICE_SCHEMA}
  initialData={selectedOffice}
  // Shows confirmation dialog with office name
/>
```

---

## AutoTree - Hierarchical Navigation

### **Basic Usage**

```typescript
import { AutoTree } from '@/components/auto-generated/tree/auto-tree';

<AutoTree
  resourceKey="nodes"             // Uses NODE_SCHEMA
  rootId={null}                   // Start from root nodes
  onNodeSelect={(node) => {
    setSelectedNode(node);
    navigateTo(`/nodes/${node.id}`);
  }}
  onNodeExpand={(node) => {
    console.log('Expanded:', node.name);
  }}
/>
```

### **Features**

- **<50ms Performance** - Cache-first loading with IndexedDB
- **Visual Hierarchy** - Dotted connection lines and proper indentation
- **Icon System** - Red house (root), yellow folders (nodes), page icons (leaves)
- **Context Menu** - Right-click for Add/Edit/Delete actions
- **Drag & Drop** - Reorder nodes within hierarchy
- **Search** - Filter tree nodes with instant search
- **Keyboard Navigation** - Arrow keys, Enter to select, Space to expand
- **URL Integration** - Sync with Next.js routing

### **Advanced Configuration**

```typescript
<AutoTree
  resourceKey="nodes"
  rootId={rootNode?.id}
  
  // Performance options
  maxDepth={10}                   // Limit tree depth
  lazyLoading={true}              // Load children on demand
  cachePreference="indexeddb"     // Prefer cache over server
  
  // Visual customization
  showIcons={true}                // Show hierarchy icons
  showConnections={true}          // Show dotted lines
  indentSize={20}                 // Indent pixels per level
  
  // Interaction
  allowDragDrop={true}            // Enable reordering
  multiSelect={false}             // Single selection
  
  // Context menu actions
  contextMenuActions={[
    'add-child',
    'edit',
    'delete',
    'duplicate'
  ]}
  
  // Event handlers
  onNodeSelect={(node) => navigateToNode(node)}
  onNodeExpand={(node) => preloadChildren(node)}
  onNodeMove={(node, newParent) => moveNode(node, newParent)}
  onContextAction={(action, node) => handleContextAction(action, node)}
/>
```

### **Tree Node Structure**

```typescript
interface TreeNodeData {
  // Core identity
  id: string;
  idShort: string;
  name: string;
  
  // Hierarchy
  parentId?: string | null;
  level: number;
  path: string;                   // JSON path array
  sortOrder: number;
  
  // UI state
  isExpanded?: boolean;
  isLoading?: boolean;
  hasChildren?: boolean;
  childCount: number;
  
  // Visual indicators
  type: 'NODE' | 'CUSTOMER';      // Affects icon display
  isActive: boolean;
  icon?: React.ReactNode;
  
  // Metadata
  description?: string;
  metadata?: Record<string, any>;
}
```

---

## Field System

### **Field Registry**

The system includes a comprehensive field registry for all input types:

```typescript
// src/lib/resource-system/field-registry.tsx
export const FIELD_REGISTRY = {
  text: TextInput,
  textarea: TextAreaInput,
  email: EmailInput,
  number: NumberInput,
  select: SelectInput,
  multiselect: MultiSelectInput,
  switch: SwitchInput,
  date: DateInput,
  richText: RichTextEditor,
  json: JsonEditor,
  // ... all field types
};
```

### **Field Component Structure**

```typescript
interface FieldComponentProps {
  field: FieldSchema;             // Schema field definition
  value: any;                     // Current field value
  onChange: (value: any) => void; // Value change handler
  error?: string;                 // Validation error
  disabled?: boolean;             // Disabled state
  
  // Context
  tenantId: string;               // For dynamic options
  branchId?: string;              // For branch-aware operations
}
```

### **Custom Field Types**

```typescript
// Add custom field type
const CustomColorPicker = ({ field, value, onChange, error }) => {
  return (
    <div className="custom-color-picker">
      <Label>{field.label}</Label>
      <ColorPickerComponent
        value={value}
        onChange={onChange}
        error={error}
      />
      {field.helpText && <HelpText>{field.helpText}</HelpText>}
    </div>
  );
};

// Register custom field type
FIELD_REGISTRY['colorPicker'] = CustomColorPicker;

// Use in schema
{
  key: 'brandColor',
  label: 'Brand Color',
  type: 'colorPicker',           // Uses custom component
  defaultValue: '#3B82F6'
}
```

### **Dynamic Options**

Fields can load options dynamically from other resources:

```typescript
{
  key: 'officeId',
  label: 'Office',
  type: 'select',
  options: {
    dynamic: {
      resource: 'office',         // Load from office resource
      valueField: 'id',           // Use id as option value
      labelField: 'name',         // Use name as option label
      filter: (office) => office.isActive,  // Only active offices
      sort: 'name'                // Sort by name
    }
  }
}

// AutoForm automatically loads office list and populates select options
```

---

## Mobile-First Design

### **Responsive Breakpoints**

All components are designed mobile-first with these breakpoints:

```typescript
const breakpoints = {
  mobile: '0px - 768px',      // Touch-optimized
  tablet: '768px - 1024px',   // Hybrid interactions
  desktop: '1024px+',         // Mouse & keyboard
};
```

### **Mobile Optimizations**

**AutoTable Mobile:**
- Horizontal scroll for wide tables
- Touch-friendly row selection
- Swipe actions for quick operations
- Condensed view with priority fields only

**AutoForm Mobile:**
- Single column layout
- Large touch targets (44px minimum)
- Native mobile inputs (date, number, etc.)
- Sticky form buttons at bottom

**AutoModal Mobile:**
- Full-screen modals on small screens
- Swipe gestures to dismiss
- Keyboard-aware positioning

**AutoTree Mobile:**
- Touch-friendly expand/collapse
- Momentum scrolling
- Long-press for context menu

### **Field Priority System**

```typescript
// Mobile field priorities control visibility and layout
mobile: {
  priority: 'high',    // Always show, full width
  priority: 'medium',  // Show in expanded view, condensed
  priority: 'low',     // Hidden on mobile, desktop only
  
  displayFormat: 'text',    // Standard text display
  displayFormat: 'badge',   // Compact badge display
  displayFormat: 'pill',    // Small pill display  
  displayFormat: 'hidden',  // Hidden on mobile
  
  condensed: true     // Use smaller spacing and fonts
}
```

---

## Integration Patterns

### **Page-Level Integration**

```typescript
// Complete CRUD page with auto-generated components
const OfficePage = () => {
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: 'create',
    data: null
  });

  return (
    <div className="office-page">
      {/* Main data table */}
      <AutoTable
        resourceKey="offices"
        onRowClick={setSelectedOffice}
        headerActions={(handleAdd) => (
          <Button onClick={handleAdd}>Add Office</Button>
        )}
      />

      {/* CRUD Modal */}
      <AutoModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false })}
        config={{
          resource: 'office',
          action: modalState.action
        }}
        schema={OFFICE_SCHEMA}
        initialData={modalState.data}
        onSuccess={() => {
          setModalState({ isOpen: false });
          // Table automatically refreshes via action system
        }}
      />
    </div>
  );
};
```

### **Navigation Integration**

```typescript
// Hierarchical navigation with auto-generated components
const NavigationSidebar = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  
  return (
    <div className="navigation-sidebar">
      {/* Tree navigation */}
      <AutoTree
        resourceKey="nodes"
        onNodeSelect={(node) => {
          setSelectedNode(node);
          router.push(`/nodes/${node.idShort}`);
        }}
      />
      
      {/* Node details */}
      {selectedNode && (
        <div className="node-details">
          <h3>{selectedNode.name}</h3>
          
          {/* Related processes table */}
          <AutoTable
            resourceKey="processes"
            filters={{ nodeId: selectedNode.id }}
            compact={true}
          />
        </div>
      )}
    </div>
  );
};
```

### **Form Wizard Integration**

```typescript
// Multi-step form using multiple AutoForms
const OfficeWizard = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({});
  
  return (
    <div className="office-wizard">
      {step === 1 && (
        <AutoForm
          schema={{
            ...OFFICE_SCHEMA,
            fields: OFFICE_SCHEMA.fields.filter(f => 
              f.mobile.priority === 'high'
            )
          }}
          mode="create"
          initialData={data}
          onSubmit={(stepData) => {
            setData({ ...data, ...stepData });
            setStep(2);
          }}
        />
      )}
      
      {step === 2 && (
        <AutoForm
          schema={{
            ...OFFICE_SCHEMA,
            fields: OFFICE_SCHEMA.fields.filter(f => 
              f.mobile.priority === 'medium'
            )
          }}
          mode="create"
          initialData={data}
          onSubmit={async (stepData) => {
            const finalData = { ...data, ...stepData };
            await createOffice(finalData);
            onComplete();
          }}
        />
      )}
    </div>
  );
};
```

---

## Customization

### **Schema-Level Customization**

```typescript
// Customize component behavior through schema
const OFFICE_SCHEMA = {
  // Component-specific configurations
  table: {
    defaultSort: { field: 'name', direction: 'asc' },
    pagination: { defaultPageSize: 50 },
    bulkActions: ['delete', 'archive'],
    inlineEditing: true
  },
  
  form: {
    layout: 'tabs',              // 'tabs' | 'sections' | 'single'
    submitLabel: 'Save Office',
    showRequiredIndicator: true,
    autoSave: true
  },
  
  modal: {
    size: 'lg',
    backdrop: 'blur',
    preventClose: false
  }
};
```

### **Component-Level Customization**

```typescript
// Custom component slots and overrides
<AutoTable
  resourceKey="offices"
  
  // Custom cell renderers
  cellRenderers={{
    status: (value, row) => (
      <StatusBadge status={value} active={row.isActive} />
    ),
    actions: (value, row) => (
      <ActionButtons row={row} onEdit={handleEdit} onDelete={handleDelete} />
    )
  }}
  
  // Custom row styling
  rowClassName={(row) => 
    row.isActive ? 'row-active' : 'row-inactive'
  }
  
  // Custom empty state
  emptyState={() => (
    <EmptyState
      title="No offices found"
      description="Create your first office to get started"
      action={<Button onClick={handleCreate}>Add Office</Button>}
    />
  )}
/>
```

### **Theme Customization**

```typescript
// Custom theme for components
const theme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
  },
  
  components: {
    table: {
      headerBg: '#F9FAFB',
      borderColor: '#E5E7EB',
      hoverBg: '#F3F4F6'
    },
    form: {
      fieldSpacing: '1rem',
      labelColor: '#374151'
    },
    modal: {
      overlay: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '0.75rem'
    }
  }
};

// Apply theme
<ThemeProvider theme={theme}>
  <AutoTable resourceKey="offices" />
</ThemeProvider>
```

---

## Best Practices

### **1. Schema Design**

```typescript
// ✅ Good: Complete field configuration
{
  key: 'name',
  label: 'Office Name',
  type: 'text',
  required: true,
  placeholder: 'Enter office name',
  validation: [
    { type: 'required', message: 'Name is required' },
    { type: 'minLength', value: 2, message: 'Name too short' }
  ],
  mobile: { priority: 'high', displayFormat: 'text' },
  desktop: { showInTable: true, tableWidth: 'lg', sortable: true }
}

// ❌ Bad: Minimal field configuration
{
  key: 'name',
  type: 'text'
  // Missing: validation, mobile config, desktop config
}
```

### **2. Component Usage**

```typescript
// ✅ Good: Proper component integration
<AutoTable
  resourceKey="offices"
  filters={{ status: 'active' }}
  onRowClick={handleRowClick}
  navigationContext={{
    nodeId: currentNode?.id,
    tenantId: session?.user?.tenantId
  }}
/>

// ❌ Bad: Missing context and handlers
<AutoTable resourceKey="offices" />
// Missing: event handlers, context, filters
```

### **3. Performance Optimization**

```typescript
// ✅ Good: Smart component rendering
const OfficeManager = () => {
  // Memoize expensive computations
  const filteredConfig = useMemo(() => ({
    ...baseConfig,
    filters: { status: activeFilter }
  }), [activeFilter]);
  
  // Avoid re-rendering on every change
  const handleRowClick = useCallback((row) => {
    navigate(`/offices/${row.id}`);
  }, [navigate]);
  
  return (
    <AutoTable
      resourceKey="offices"
      config={filteredConfig}
      onRowClick={handleRowClick}
    />
  );
};

// ❌ Bad: Unnecessary re-renders
const OfficeManager = () => {
  return (
    <AutoTable
      resourceKey="offices"
      config={{ filters: { status: activeFilter } }}  // New object every render
      onRowClick={(row) => navigate(`/offices/${row.id}`)}  // New function every render
    />
  );
};
```

### **4. Error Handling**

```typescript
// ✅ Good: Comprehensive error handling
<AutoModal
  isOpen={modalState.isOpen}
  config={{ resource: 'office', action: 'create' }}
  schema={OFFICE_SCHEMA}
  
  onSuccess={(result) => {
    toast.success('Office created successfully');
    handleModalClose();
  }}
  
  onError={(error) => {
    if (error.type === 'validation') {
      toast.error('Please check the form for errors');
    } else if (error.type === 'network') {
      toast.error('Network error - please try again');
    } else {
      toast.error('An unexpected error occurred');
    }
  }}
/>

// ❌ Bad: No error handling
<AutoModal
  isOpen={modalState.isOpen}
  config={{ resource: 'office', action: 'create' }}
  schema={OFFICE_SCHEMA}
  // Missing: error handling, success handling
/>
```

### **5. Accessibility**

```typescript
// ✅ Good: Proper accessibility attributes
<AutoTable
  resourceKey="offices"
  aria-label="Office management table"
  role="table"
  
  // Keyboard navigation
  onKeyDown={(event) => {
    if (event.key === 'Enter' && selectedRow) {
      handleRowActivate(selectedRow);
    }
  }}
  
  // Screen reader support
  screenReaderAnnouncements={{
    rowSelected: (row) => `Selected office: ${row.name}`,
    actionCompleted: (action) => `${action} completed successfully`
  }}
/>

// Components automatically include:
// - ARIA labels and roles
// - Keyboard navigation
// - Focus management
// - Screen reader support
```

---

## Next Steps

- **[Creating New Resources](./06-creating-new-resources.md)** - Add new features with auto-generated components
- **[Server Integration](./07-server-integration.md)** - Backend API and routing
- **[Performance Optimization](./08-performance-optimization.md)** - Advanced performance techniques

Auto-generated components provide a **complete UI solution** with zero boilerplate. Master the schema system to build features at incredible speed. 