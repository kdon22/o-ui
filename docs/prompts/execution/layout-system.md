# Layout System

Complete guide to the Monaco-based layout system that powers the Prompt Execution System's form rendering.

## 🎨 **Overview**

The layout system uses JSON structures created by the Monaco prompt editor to define the visual arrangement and behavior of form components. This enables non-technical users to design complex interactive forms through a drag-and-drop interface.

## 📋 **Layout Structure**

### **Root Layout Object**

```typescript
interface PromptLayout {
  items: PromptLayoutItem[];
  canvasWidth: number;
  canvasHeight: number;
}
```

**Example:**
```json
{
  "items": [...],
  "canvasWidth": 800,
  "canvasHeight": 600
}
```

### **Layout Item Structure**

```typescript
interface PromptLayoutItem {
  x: number;          // X position (pixels from left)
  y: number;          // Y position (pixels from top)
  id: string;         // Unique component identifier
  type: ComponentType; // Component type
  label?: string;     // Optional display label
  config: ComponentConfig; // Component-specific configuration
}
```

## 🔧 **Component Types**

### **1. Text Input (`text-input`)**

**Purpose:** Single-line text entry fields

**Config Schema:**
```typescript
interface TextInputConfig {
  componentId: string;      // Form field ID (required)
  label?: string;           // Field label
  placeholder?: string;     // Input placeholder text
  width?: number;           // Width in pixels (default: 200)
  height?: number;          // Height in pixels (default: 40)
  required?: boolean;       // Is field required (default: false)
  isDisabled?: boolean;     // Is field disabled (default: false)
  textColor?: string;       // Text color (hex)
  backgroundColor?: string; // Background color (hex)
  borderColor?: string;     // Border color (hex)
}
```

**Example:**
```json
{
  "x": 50,
  "y": 100,
  "id": "comp_customer_name",
  "type": "text-input",
  "config": {
    "componentId": "customerName",
    "label": "Customer Name",
    "placeholder": "Enter full name",
    "width": 300,
    "height": 40,
    "required": true,
    "textColor": "#374151",
    "backgroundColor": "#ffffff",
    "borderColor": "#d1d5db"
  }
}
```

### **2. Select Dropdown (`select`)**

**Purpose:** Dropdown menus with predefined options

**Config Schema:**
```typescript
interface SelectConfig {
  componentId: string;
  label?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  required?: boolean;
  isDisabled?: boolean;
  options: Array<{
    label: string;          // Display text
    value: string;          // Form value
    isDefault?: boolean;    // Pre-selected option
  }>;
  borderColor?: string;
  backgroundColor?: string;
}
```

**Example:**
```json
{
  "x": 50,
  "y": 200,
  "id": "comp_vehicle_type",
  "type": "select",
  "config": {
    "componentId": "vehicleType",
    "label": "Vehicle Type",
    "placeholder": "Select vehicle type",
    "width": 250,
    "height": 40,
    "required": true,
    "options": [
      {"label": "Sedan", "value": "sedan", "isDefault": false},
      {"label": "SUV", "value": "suv", "isDefault": true},
      {"label": "Truck", "value": "truck", "isDefault": false},
      {"label": "Coupe", "value": "coupe", "isDefault": false}
    ]
  }
}
```

### **3. Checkbox (`checkbox`)**

**Purpose:** Boolean toggle inputs

**Config Schema:**
```typescript
interface CheckboxConfig {
  componentId: string;
  label?: string;
  checkboxSize?: 'sm' | 'md' | 'lg';  // Size variant
  color?: string;                      // Checkbox color (hex)
  isDisabled?: boolean;
}
```

**Example:**
```json
{
  "x": 50,
  "y": 300,
  "id": "comp_has_license",
  "type": "checkbox",
  "config": {
    "componentId": "hasLicense",
    "label": "Valid Driver's License",
    "checkboxSize": "md",
    "color": "#10b981"
  }
}
```

### **4. Radio Button (`radio`)**

**Purpose:** Single-choice selection from grouped options

**Config Schema:**
```typescript
interface RadioConfig {
  componentId: string;  // Must follow pattern: groupName_optionValue
  label?: string;       // Option label
  color?: string;       // Radio button color (hex)
  isDisabled?: boolean;
}
```

**Grouping Logic:**
Radio buttons are automatically grouped by the prefix before the first underscore:
- `contactMethod_email` → Group: `contactMethod`
- `contactMethod_phone` → Group: `contactMethod`
- `contactMethod_mail` → Group: `contactMethod`

**Example:**
```json
[
  {
    "x": 50,
    "y": 400,
    "id": "comp_contact_email",
    "type": "radio",
    "config": {
      "componentId": "contactMethod_email",
      "label": "Email",
      "color": "#3b82f6"
    }
  },
  {
    "x": 150,
    "y": 400,
    "id": "comp_contact_phone",
    "type": "radio",
    "config": {
      "componentId": "contactMethod_phone",
      "label": "Phone",
      "color": "#3b82f6"
    }
  }
]
```

### **5. Label (`label`)**

**Purpose:** Static text elements and headers

**Config Schema:**
```typescript
interface LabelConfig {
  componentId: string;      // Unique identifier
  label: string;            // Text content (required)
  fontSize?: number;        // Font size in pixels
  textColor?: string;       // Text color (hex)
  fontWeight?: string;      // Font weight (normal, bold, etc.)
  textAlign?: 'left' | 'center' | 'right';
}
```

**Example:**
```json
{
  "x": 50,
  "y": 20,
  "id": "header_label",
  "type": "label",
  "config": {
    "componentId": "form_header",
    "label": "Customer Information Form",
    "fontSize": 24,
    "textColor": "#1f2937",
    "fontWeight": "bold",
    "textAlign": "center"
  }
}
```

## 🎯 **Positioning System**

### **Absolute Positioning**

All components use absolute positioning based on canvas coordinates:

```typescript
// Component positioning
style={{
  position: 'absolute',
  left: `${item.x}px`,
  top: `${item.y}px`,
  width: `${item.config.width || defaultWidth}px`,
  height: `${item.config.height || defaultHeight}px`
}}
```

### **Canvas Dimensions**

The canvas defines the total form area:

```json
{
  "canvasWidth": 800,    // Total form width
  "canvasHeight": 600    // Total form height
}
```

### **Responsive Considerations**

While components use absolute positioning, the renderer includes responsive features:

```typescript
// Canvas scaling for mobile
const scale = Math.min(
  containerWidth / layout.canvasWidth,
  containerHeight / layout.canvasHeight
);

// Apply CSS transform for scaling
transform: `scale(${scale})`
```

## 📝 **Form Data Mapping**

### **Data Structure**

Form data is keyed by `componentId`:

```typescript
interface FormData {
  [componentId: string]: any;
}
```

### **Value Types by Component**

| Component Type | Data Type | Example |
|----------------|-----------|---------|
| `text-input` | `string` | `"John Doe"` |
| `select` | `string` | `"sedan"` |
| `checkbox` | `boolean` | `true` |
| `radio` | `string` | `"email"` (group value) |
| `label` | N/A | Not included in form data |

### **Example Form Data**

```json
{
  "customerName": "John Doe",
  "vehicleType": "suv",
  "hasLicense": true,
  "contactMethod": "email"
}
```

## ✅ **Validation System**

### **Required Field Validation**

Components with `required: true` are automatically validated:

```typescript
const isRequired = item.config.required;
const value = formData[item.config.componentId];
const isEmpty = value === undefined || value === null || value === '';

if (isRequired && isEmpty) {
  errors[componentId] = `${item.config.label || 'Field'} is required`;
}
```

### **Radio Group Validation**

Radio groups are validated as a unit:

```typescript
// Extract group name from componentId
const groupName = componentId.split('_')[0];

// Check if any option in the group is selected
const hasSelection = Object.keys(formData).some(key => 
  key.startsWith(`${groupName}_`) && formData[key]
);
```

## 🎨 **Styling System**

### **Default Styles**

Each component type has default styling:

```typescript
const defaultStyles = {
  'text-input': {
    width: 200,
    height: 40,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    textColor: '#374151'
  },
  'select': {
    width: 200,
    height: 40,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff'
  },
  'checkbox': {
    checkboxSize: 'md',
    color: '#3b82f6'
  },
  'radio': {
    color: '#3b82f6'
  },
  'label': {
    fontSize: 14,
    textColor: '#374151',
    fontWeight: 'normal'
  }
};
```

### **Custom Styling Override**

Component config overrides defaults:

```typescript
const finalStyle = {
  ...defaultStyles[item.type],
  ...item.config
};
```

### **CSS Integration**

Styles are applied via inline styles and CSS classes:

```typescript
// Inline styles for dimensions and colors
style={{
  width: `${config.width}px`,
  height: `${config.height}px`,
  color: config.textColor,
  backgroundColor: config.backgroundColor,
  borderColor: config.borderColor
}}

// CSS classes for component behavior
className={cn(
  'transition-colors duration-200',
  hasError && 'border-red-500',
  config.isDisabled && 'opacity-50 cursor-not-allowed'
)}
```

## 🔄 **Layout Generation**

### **Monaco Editor Integration**

The Monaco prompt editor generates layouts through:

1. **Drag & Drop Interface**: Users drag components onto canvas
2. **Property Panel**: Configure component properties
3. **Real-time Preview**: See form as users will see it
4. **JSON Export**: Generate layout JSON for database storage

### **Programmatic Generation**

You can also create layouts programmatically:

```typescript
const generateBasicForm = (): PromptLayout => {
  return {
    items: [
      {
        x: 50, y: 50,
        id: 'comp_name',
        type: 'text-input',
        config: {
          componentId: 'customerName',
          label: 'Full Name',
          required: true,
          width: 300,
          height: 40
        }
      },
      {
        x: 50, y: 120,
        id: 'comp_email',
        type: 'text-input',
        config: {
          componentId: 'email',
          label: 'Email Address',
          required: true,
          width: 300,
          height: 40
        }
      }
    ],
    canvasWidth: 400,
    canvasHeight: 200
  };
};
```

## 📊 **Complex Layout Examples**

### **Multi-Column Layout**

```json
{
  "items": [
    // Left Column Header
    {
      "x": 50, "y": 20,
      "id": "left_header",
      "type": "label",
      "config": {
        "componentId": "customer_header",
        "label": "Customer Information",
        "fontSize": 18,
        "fontWeight": "bold"
      }
    },
    
    // Left Column Fields
    {
      "x": 50, "y": 60,
      "id": "comp_name",
      "type": "text-input",
      "config": {
        "componentId": "customerName",
        "label": "Full Name",
        "width": 250,
        "required": true
      }
    },
    
    // Right Column Header
    {
      "x": 350, "y": 20,
      "id": "right_header",
      "type": "label",
      "config": {
        "componentId": "vehicle_header",
        "label": "Vehicle Information",
        "fontSize": 18,
        "fontWeight": "bold"
      }
    },
    
    // Right Column Fields
    {
      "x": 350, "y": 60,
      "id": "comp_vehicle",
      "type": "select",
      "config": {
        "componentId": "vehicleType",
        "label": "Vehicle Type",
        "width": 250,
        "options": [
          {"label": "Sedan", "value": "sedan"},
          {"label": "SUV", "value": "suv"}
        ]
      }
    }
  ],
  "canvasWidth": 650,
  "canvasHeight": 200
}
```

### **Complex Form with All Components**

```json
{
  "items": [
    // Form Title
    {
      "x": 200, "y": 20,
      "type": "label",
      "config": {
        "componentId": "title",
        "label": "Insurance Application",
        "fontSize": 24,
        "fontWeight": "bold",
        "textAlign": "center"
      }
    },
    
    // Text Inputs
    {
      "x": 50, "y": 80,
      "type": "text-input",
      "config": {
        "componentId": "customerName",
        "label": "Full Name",
        "required": true,
        "width": 300
      }
    },
    
    // Select Dropdown
    {
      "x": 50, "y": 150,
      "type": "select",
      "config": {
        "componentId": "state",
        "label": "State",
        "required": true,
        "width": 200,
        "options": [
          {"label": "California", "value": "CA"},
          {"label": "Texas", "value": "TX"},
          {"label": "New York", "value": "NY"}
        ]
      }
    },
    
    // Checkboxes
    {
      "x": 300, "y": 155,
      "type": "checkbox",
      "config": {
        "componentId": "hasLicense",
        "label": "Valid License"
      }
    },
    
    // Radio Button Group
    {
      "x": 50, "y": 220,
      "type": "radio",
      "config": {
        "componentId": "contactMethod_email",
        "label": "Email"
      }
    },
    {
      "x": 150, "y": 220,
      "type": "radio",
      "config": {
        "componentId": "contactMethod_phone",
        "label": "Phone"
      }
    }
  ],
  "canvasWidth": 500,
  "canvasHeight": 300
}
```

## 🚀 **Best Practices**

### **1. Component Spacing**

- **Minimum 20px** between components
- **40px** between sections
- **60px** from canvas edges

### **2. Consistent Sizing**

```typescript
const standardSizes = {
  textInput: { width: 300, height: 40 },
  select: { width: 200, height: 40 },
  shortInput: { width: 100, height: 40 },
  wideInput: { width: 400, height: 40 }
};
```

### **3. Logical Grouping**

Group related fields using consistent Y positions:

```json
// Personal Info Section (y: 80-160)
{"y": 80, "componentId": "firstName"},
{"y": 80, "componentId": "lastName"},  // Same row
{"y": 130, "componentId": "email"},

// Address Section (y: 200-280)
{"y": 200, "componentId": "street"},
{"y": 250, "componentId": "city"}
```

### **4. Validation-Friendly Design**

Leave space below inputs for error messages:

```json
{
  "y": 100,
  "config": {
    "height": 40,
    "required": true
  }
  // Next component at y: 160 (60px gap for error text)
}
```

### **5. Mobile Considerations**

- **Maximum canvas width**: 400px for mobile-first
- **Minimum touch targets**: 44px height for mobile
- **Avoid horizontal scrolling**: Keep important fields in left 300px

---

**Next**: Check out [Frontend Components](./frontend-components.md) or [Integration Guide](./integration-guide.md) 