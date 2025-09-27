# Form Layout

The Auto-Form system uses a flexible grid-based layout system that automatically adapts to different screen sizes and creates beautiful, organized forms.

## 🎯 Layout System Overview

The layout system is based on:
- **12-column CSS Grid** for precise control
- **Row-based organization** for logical grouping
- **Mobile-first responsive design** that scales up
- **Semantic width classes** for intuitive sizing

## 📐 Grid System

### Basic Grid Structure

```typescript
form: {
  row: 1,        // Which row (1, 2, 3, ...)
  width: 'half', // How much space to take
  order: 1       // Order within the row (1, 2, 3, ...)
}
```

### Width Options

```typescript
type FieldWidth = 
  | 'xs'        // 2/12 cols - Very narrow (checkbox, small number)
  | 'sm'        // 3/12 cols - Narrow (zip code, state)
  | 'md'        // 4/12 cols - Medium (phone, short text)
  | 'lg'        // 6/12 cols - Large (email, longer text)
  | 'xl'        // 8/12 cols - Extra large (description)
  | 'full'      // 12/12 cols - Full width (textarea, title)
  | 'half'      // 6/12 cols - Half width (two per row)
  | 'third'     // 4/12 cols - One third (three per row)
  | 'quarter'   // 3/12 cols - One quarter (four per row)
  | '3quarters' // 9/12 cols - Three quarters (with quarter)
```

## 🏗️ Row-Based Layout

### Single Field Per Row
```typescript
fields: [
  {
    key: 'title',
    type: 'text',
    form: { row: 1, width: 'full', order: 1 }
  },
  {
    key: 'description', 
    type: 'textarea',
    form: { row: 2, width: 'full', order: 1 }
  }
]
```

### Two Fields Per Row
```typescript
fields: [
  {
    key: 'firstName',
    type: 'text',
    form: { row: 1, width: 'half', order: 1 }  // Left side
  },
  {
    key: 'lastName',
    type: 'text', 
    form: { row: 1, width: 'half', order: 2 }  // Right side
  }
]
```

### Three Fields Per Row
```typescript
fields: [
  {
    key: 'city',
    type: 'text',
    form: { row: 1, width: 'third', order: 1 }
  },
  {
    key: 'state',
    type: 'select',
    form: { row: 1, width: 'third', order: 2 }
  },
  {
    key: 'zipCode',
    type: 'text',
    form: { row: 1, width: 'third', order: 3 }
  }
]
```

### Mixed Width Layout
```typescript
fields: [
  {
    key: 'email',
    type: 'email',
    form: { row: 1, width: '3quarters', order: 1 }  // 75% width
  },
  {
    key: 'isVerified',
    type: 'switch',
    form: { row: 1, width: 'quarter', order: 2 }    // 25% width
  }
]
```

## 📱 Responsive Behavior

### Mobile-First Design

The system automatically adapts to screen sizes:

```css
/* Mobile (default) */
All fields: full width (12/12 cols)

/* Tablet and up (md: 768px+) */
Fields use their specified width
```

### Desktop vs Mobile

```typescript
// This configuration:
{
  key: 'firstName',
  form: { row: 1, width: 'half', order: 1 }
}

// Results in:
// Mobile: Full width (easier to tap and type)
// Desktop: Half width (efficient use of space)
```

## 🎨 Layout Patterns

### Contact Form Layout
```typescript
fields: [
  // Row 1: Full width name field
  {
    key: 'fullName',
    type: 'text',
    form: { row: 1, width: 'full', order: 1 }
  },
  
  // Row 2: Email and phone side by side
  {
    key: 'email',
    type: 'email',
    form: { row: 2, width: 'half', order: 1 }
  },
  {
    key: 'phone',
    type: 'text',
    form: { row: 2, width: 'half', order: 2 }
  },
  
  // Row 3: Address
  {
    key: 'address',
    type: 'text',
    form: { row: 3, width: 'full', order: 1 }
  },
  
  // Row 4: City, State, Zip
  {
    key: 'city',
    type: 'text',
    form: { row: 4, width: 'half', order: 1 }
  },
  {
    key: 'state',
    type: 'select',
    form: { row: 4, width: 'quarter', order: 2 }
  },
  {
    key: 'zipCode',
    type: 'text',
    form: { row: 4, width: 'quarter', order: 3 }
  },
  
  // Row 5: Notes
  {
    key: 'notes',
    type: 'textarea',
    form: { row: 5, width: 'full', order: 1 }
  }
]
```

---

*Next: [Validation](./validation.md) - Learn about field validation and error handling*
