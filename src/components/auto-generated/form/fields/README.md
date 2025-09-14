# Component Selector - Modern Implementation

A clean, modern component selector designed to handle thousands of components with excellent UX and performance.

**File**: `component-selector.tsx`
**Handles**: Up to 10,000+ components efficiently
**Features**: Search, filters, sorting, pagination, bulk operations

## Key Features

### 🔍 **Advanced Search**
- Search across name, description, type, and source code
- Real-time filtering with instant results
- Clear search functionality

### 🏷️ **Smart Filtering**
- Filter by component type (auto-detected from data)
- "All Types" option for easy reset
- Visual filter indicators

### 📊 **Flexible Sorting**
- Sort by name, type, created date, or updated date
- Ascending/descending options
- Persistent sort preferences during session

### ⚡ **Performance Optimizations**
- Pagination (50 items per page)
- High-limit API fetching (5000 items)
- Memoized filtering and sorting
- Efficient re-rendering with React.memo patterns

### 🎯 **Bulk Operations**
- Select All (filtered results)
- Select Page/Visible items
- Clear All selections
- Smart bulk action buttons

### 📱 **Mobile-Responsive Design**
- Touch-friendly interface
- Responsive layout that works on all screen sizes
- Optimized for mobile interactions

## Usage Examples

### Basic Usage
```tsx
import { ComponentSelector } from '@/components/auto-generated/form/fields/component-selector'

<ComponentSelector
  componentType="rules"
  value={selectedRules}
  onChange={setSelectedRules}
  multiSelect={true}
/>
```

### Advanced Configuration
```tsx
<ComponentSelector
  componentType="workflows"
  value={selectedWorkflows}
  onChange={setSelectedWorkflows}
  multiSelect={true}
  showPreview={true}
  enableSearch={true}
  enableFilters={true}
  maxHeight="500px"
  pageSize={25}
  className="my-custom-class"
/>
```

### Single Select Mode
```tsx
<ComponentSelector
  componentType="tables"
  value={selectedTable ? [selectedTable] : []}
  onChange={(value) => setSelectedTable(value[0] || null)}
  multiSelect={false}
/>
```

## Props Reference

### ComponentSelectorProps
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string[]` | `[]` | Selected component IDs |
| `onChange` | `(value: string[]) => void` | - | Selection change handler |
| `componentType` | `ComponentType` | - | Type of components to show ('rules', 'classes', 'tables', 'workflows') |
| `multiSelect` | `boolean` | `true` | Allow multiple selections |
| `className` | `string` | - | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable all interactions |

## Performance Guidelines

### Capacity
- ✅ Handles up to 10,000+ components efficiently
- ✅ Pagination keeps DOM lightweight (50 items per page)
- ✅ Memoized filtering prevents unnecessary re-renders
- ✅ Smart search across multiple fields

### Performance Tips

1. **API Optimization**: The component fetches with a high limit (5000). For even larger datasets, consider server-side search/filtering.

2. **Search Strategy**: Search is performed client-side across name, description, type, and source code for instant results.

3. **Memory Usage**: Pagination keeps memory usage low while still providing excellent search and filter capabilities.

4. **Lazy Loading**: For extremely large datasets (50,000+), consider implementing server-side pagination with the API.

## Accessibility Features

- ✅ Full keyboard navigation support
- ✅ Screen reader compatible
- ✅ ARIA labels and descriptions
- ✅ Focus management
- ✅ High contrast support

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Architecture

### Clean, Modern Design
- **No Legacy Code**: Built from scratch with modern React patterns
- **Focused API**: Only essential props, no deprecated options
- **Performance First**: Optimized for large datasets from the ground up
- **Type Safe**: Full TypeScript support with proper component typing

### Component Configuration
The component uses a centralized configuration object for all component types:

```tsx
const COMPONENT_CONFIG = {
  rules: { icon: Code, label: 'Business Rules', actionPrefix: 'rule' },
  classes: { icon: Package, label: 'Classes', actionPrefix: 'class' },
  tables: { icon: Database, label: 'Data Tables', actionPrefix: 'tables' },
  workflows: { icon: Workflow, label: 'Workflows', actionPrefix: 'workflow' }
} as const
```

This ensures consistency and makes adding new component types straightforward.
