# Universal Rule Search System

A comprehensive, tenant and branch-aware search system for rules with keyboard shortcuts, tag filtering, and reusable components.

## Features

- **🔍 Universal Search**: Search across all rule types (global_var, utility, classes) 
- **⌨️ Keyboard Shortcuts**: 
  - `Cmd/Ctrl + K`: Open search
  - `Shift + Alt + G`: Open with global_var tab selected
  - `Shift + Alt + U`: Open with utility tab selected  
  - `Shift + Alt + C`: Open with classes tab selected
- **🏷️ Tag Filtering**: Filter rules by associated tags
- **🌿 Branch Aware**: Automatically scoped to current tenant and branch
- **📱 Mobile Friendly**: Responsive design with touch support
- **♻️ Reusable**: Use anywhere in the application

## Quick Start

The system is already integrated into the app providers and header. Just use `Cmd/Ctrl + K` anywhere in the app to open the search.

## Components

### UniversalRuleSearch
The main search modal component.

```tsx
import { UniversalRuleSearch } from '@/components/search'

<UniversalRuleSearch
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSelectRule={(rule) => {
    
    // Handle rule selection
  }}
  defaultTab="global_var" // Optional: 'all' | 'global_var' | 'utility' | 'classes'
  placeholder="Search global variables..." // Optional
/>
```

### UniversalSearchProvider
Provider component that manages search state globally.

```tsx
import { UniversalSearchProvider } from '@/components/search'

function App() {
  return (
    <UniversalSearchProvider
      defaultOnRuleSelect={(rule) => {
        // Default handler for rule selection
        router.push(`/rules/${rule.id}`)
      }}
    >
      {children}
    </UniversalSearchProvider>
  )
}
```

### SearchTrigger  
A trigger component that opens the search (already used in header).

```tsx
import { SearchTrigger } from '@/components/search'

// Input style (default)
<SearchTrigger 
  placeholder="Search rules..."
  defaultTab="utility"
  className="w-64"
/>

// Button style
<SearchTrigger 
  variant="button"
  defaultTab="classes"
/>
```

## Hooks

### useUniversalSearch
Main hook for controlling search state.

```tsx
import { useUniversalSearch } from '@/components/search'

function MyComponent() {
  const { 
    openSearch, 
    closeSearch, 
    openGlobalVarSearch,
    openUtilitySearch,
    openClassesSearch,
    isOpen 
  } = useUniversalSearch()
  
  return (
    <div>
      <button onClick={() => openSearch({ defaultTab: 'utility' })}>
        Search Utilities
      </button>
      <button onClick={openGlobalVarSearch}>
        Search Global Vars
      </button>
    </div>
  )
}
```

### useRuleTypeSearch  
Convenience hook for specific rule type searches.

```tsx
import { useRuleTypeSearch } from '@/components/search'

function UtilityPanel() {
  const { searchUtilities } = useRuleTypeSearch()
  
  return (
    <button onClick={searchUtilities}>
      Find Utility Functions
    </button>
  )
}
```

### useRuleSelection
Hook for customizing rule selection behavior in specific components.

```tsx
import { useRuleSelection } from '@/components/search'

function RuleEditor({ ruleId }) {
  // Customize what happens when a rule is selected
  useRuleSelection((rule) => {
    // Custom behavior for this component
    insertRuleReference(rule)
  })
  
  return <div>My editor component</div>
}
```

## Usage Examples

### 1. Code Editor Integration
```tsx
import { useRuleSelection } from '@/components/search'

function CodeEditor({ editor }) {
  useRuleSelection((rule) => {
    // Insert rule reference at cursor
    const cursor = editor.getPosition()
    editor.executeEdits('', [{
      range: new Range(cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column),
      text: `${rule.pythonName || rule.name}()`
    }])
  })
  
  return <MonacoEditor />
}
```

### 2. Rule Browser Panel
```tsx
import { SearchTrigger, useRuleTypeSearch } from '@/components/search'

function RuleBrowserPanel() {
  const { searchGlobalVars, searchUtilities, searchClasses } = useRuleTypeSearch()
  
  return (
    <div className="p-4">
      <h3>Browse Rules</h3>
      
      {/* General Search */}
      <SearchTrigger className="mb-4" />
      
      {/* Category Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={searchGlobalVars} className="btn">
          Global Variables
        </button>
        <button onClick={searchUtilities} className="btn">
          Utilities
        </button>
        <button onClick={searchClasses} className="btn">
          Classes
        </button>
      </div>
    </div>
  )
}
```

### 3. Contextual Search in Forms
```tsx
import { useUniversalSearch } from '@/components/search'

function RuleFormField({ onSelectRule }) {
  const { openSearch } = useUniversalSearch()
  
  const handleSearchClick = () => {
    openSearch({
      defaultTab: 'utility',
      placeholder: 'Select a utility function...'
    })
  }
  
  return (
    <div className="relative">
      <input 
        placeholder="Select rule..."
        readOnly
        onClick={handleSearchClick}
        className="cursor-pointer"
      />
      <SearchIcon className="absolute right-2 top-2" />
    </div>
  )
}
```

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open universal search |
| `Shift + Alt + G` | Open search on Global Variables tab |
| `Shift + Alt + U` | Open search on Utility Functions tab |
| `Shift + Alt + C` | Open search on Business Classes tab |
| `Escape` | Close search |
| `↑↓` | Navigate results |
| `Enter` | Select highlighted rule |
| `F` | Toggle tag filters |
| `1-4` | Switch between tabs (All, Global, Utility, Classes) |

## Customization

### Default Rule Selection Behavior
Configure in the provider:

```tsx
<UniversalSearchProvider
  defaultOnRuleSelect={(rule) => {
    // Custom default behavior
    if (rule.type === 'UTILITY') {
      // Open in utility editor
      router.push(`/utilities/${rule.id}`)
    } else {
      // Open in rule editor  
      router.push(`/rules/${rule.id}`)
    }
  }}
>
```

### Search Result Formatting
The search results show:
- Rule name with Python name (if different)
- Description
- Rule type badge
- Associated tags
- Activity status
- Last updated date
- Run order (for business rules)

## Technical Details

- **Data Source**: Uses the action system (`useActionQuery`) with automatic tenant/branch scoping
- **Performance**: Debounced search with 30-second cache
- **Offline**: Falls back to IndexedDB cache when offline
- **Accessibility**: Full keyboard navigation support
- **Mobile**: Touch-optimized with responsive design

## API Integration

The search automatically integrates with:
- **Rule API**: `rule.list` action with filtering
- **Tag API**: `tag.list` action for filter options
- **Branch Context**: Automatic scoping to current branch
- **Tenant Context**: Automatic scoping to current tenant

Search filters support:
- `type`: Rule type filtering
- `search`: Text search across name, description, python name
- `tagIds`: Array of tag IDs for filtering
- `isActive`: Only show active rules

## Performance Considerations

- Search queries are debounced and cached
- Tag list is cached for 5 minutes
- Results limited to 50 rules with pagination support
- Lazy loading of tag filters (only when filter panel is opened)
- Optimized re-renders with useMemo and useCallback