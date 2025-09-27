# Validation

The Auto-Form system provides comprehensive validation with real-time feedback, helpful error messages, and seamless integration with form submission.

## 🎯 Validation Overview

The validation system includes:
- **Real-time Validation** - Validate as users type
- **Built-in Rules** - Common validation patterns ready to use
- **Custom Messages** - Clear, helpful error messages
- **Visual Feedback** - Clear error states and styling
- **Submission Blocking** - Prevents invalid form submission

## 📋 Validation Rules

### Required Fields
```typescript
{
  key: 'email',
  type: 'email',
  required: true,  // Simple required field
  validation: [
    { type: 'required', message: 'Email address is required' }
  ]
}
```

### String Length Validation
```typescript
{
  key: 'username',
  type: 'text',
  validation: [
    { type: 'required', message: 'Username is required' },
    { type: 'minLength', value: 3, message: 'Username must be at least 3 characters' },
    { type: 'maxLength', value: 20, message: 'Username cannot exceed 20 characters' }
  ]
}
```

### Number Range Validation
```typescript
{
  key: 'age',
  type: 'number',
  validation: [
    { type: 'required', message: 'Age is required' },
    { type: 'min', value: 18, message: 'Must be at least 18 years old' },
    { type: 'max', value: 120, message: 'Please enter a valid age' }
  ]
}
```

### Email Validation
```typescript
{
  key: 'email',
  type: 'email',
  validation: [
    { type: 'required', message: 'Email is required' },
    { type: 'email', message: 'Please enter a valid email address' }
  ]
}
```

### URL Validation
```typescript
{
  key: 'website',
  type: 'url',
  validation: [
    { type: 'url', message: 'Please enter a valid website URL' }
  ]
}
```

### Pattern Validation (Regex)
```typescript
{
  key: 'phoneNumber',
  type: 'text',
  placeholder: '(555) 123-4567',
  validation: [
    { 
      type: 'pattern', 
      value: /^\(\d{3}\) \d{3}-\d{4}$/, 
      message: 'Phone number must be in format (555) 123-4567' 
    }
  ]
},
{
  key: 'zipCode',
  type: 'text',
  validation: [
    { 
      type: 'pattern', 
      value: /^\d{5}(-\d{4})?$/, 
      message: 'Enter 5-digit ZIP code or ZIP+4 format' 
    }
  ]
}
```

## 🔧 Validation Rule Types

### Complete Rule Reference
```typescript
type ValidationRule = 
  | { type: 'required', message: string }
  | { type: 'minLength', value: number, message: string }
  | { type: 'maxLength', value: number, message: string }
  | { type: 'min', value: number, message: string }
  | { type: 'max', value: number, message: string }
  | { type: 'email', message: string }
  | { type: 'url', message: string }
  | { type: 'pattern', value: RegExp, message: string }
  | { type: 'custom', validator: (value: any) => boolean, message: string };
```

### Custom Validation
```typescript
{
  key: 'confirmPassword',
  type: 'text',
  validation: [
    { type: 'required', message: 'Please confirm your password' },
    {
      type: 'custom',
      validator: (value: string, formData: any) => {
        return value === formData.password;
      },
      message: 'Passwords do not match'
    }
  ]
}
```

## 🎨 Real-World Validation Examples

### User Registration Form
```typescript
fields: [
  {
    key: 'username',
    type: 'text',
    required: true,
    validation: [
      { type: 'required', message: 'Username is required' },
      { type: 'minLength', value: 3, message: 'Username too short' },
      { type: 'maxLength', value: 20, message: 'Username too long' },
      { 
        type: 'pattern', 
        value: /^[a-zA-Z0-9_]+$/, 
        message: 'Only letters, numbers, and underscores allowed' 
      }
    ]
  },
  {
    key: 'email',
    type: 'email',
    required: true,
    validation: [
      { type: 'required', message: 'Email address is required' },
      { type: 'email', message: 'Please enter a valid email address' }
    ]
  },
  {
    key: 'password',
    type: 'text',
    required: true,
    validation: [
      { type: 'required', message: 'Password is required' },
      { type: 'minLength', value: 8, message: 'Password must be at least 8 characters' },
      {
        type: 'pattern',
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        message: 'Password must include uppercase, lowercase, number, and special character'
      }
    ]
  },
  {
    key: 'confirmPassword',
    type: 'text',
    required: true,
    validation: [
      { type: 'required', message: 'Please confirm your password' },
      {
        type: 'custom',
        validator: (value: string, formData: any) => value === formData.password,
        message: 'Passwords do not match'
      }
    ]
  }
]
```

### Product Form Validation
```typescript
fields: [
  {
    key: 'name',
    type: 'text',
    validation: [
      { type: 'required', message: 'Product name is required' },
      { type: 'minLength', value: 2, message: 'Name too short' },
      { type: 'maxLength', value: 100, message: 'Name too long' }
    ]
  },
  {
    key: 'price',
    type: 'currency',
    validation: [
      { type: 'required', message: 'Price is required' },
      { type: 'min', value: 0.01, message: 'Price must be greater than $0' },
      { type: 'max', value: 999999, message: 'Price too high' }
    ]
  },
  {
    key: 'weight',
    type: 'number',
    validation: [
      { type: 'min', value: 0, message: 'Weight cannot be negative' },
      { type: 'max', value: 1000, message: 'Weight limit exceeded' }
    ]
  },
  {
    key: 'sku',
    type: 'text',
    validation: [
      { type: 'required', message: 'SKU is required' },
      {
        type: 'pattern',
        value: /^[A-Z]{2}-\d{4}$/,
        message: 'SKU must be in format AB-1234'
      }
    ]
  }
]
```

### Contact Form Validation
```typescript
fields: [
  {
    key: 'name',
    type: 'text',
    validation: [
      { type: 'required', message: 'Your name is required' },
      { type: 'minLength', value: 2, message: 'Please enter your full name' }
    ]
  },
  {
    key: 'email',
    type: 'email',
    validation: [
      { type: 'required', message: 'Email is required for us to respond' },
      { type: 'email', message: 'Please enter a valid email address' }
    ]
  },
  {
    key: 'phone',
    type: 'text',
    validation: [
      {
        type: 'pattern',
        value: /^[\+]?[1-9][\d]{0,15}$/,
        message: 'Please enter a valid phone number'
      }
    ]
  },
  {
    key: 'message',
    type: 'textarea',
    validation: [
      { type: 'required', message: 'Please tell us how we can help' },
      { type: 'minLength', value: 10, message: 'Please provide more details' },
      { type: 'maxLength', value: 1000, message: 'Message is too long' }
    ]
  }
]
```

## 📞 Cross-Field Validation

### Date Range Validation
```typescript
fields: [
  {
    key: 'startDate',
    type: 'date',
    validation: [
      { type: 'required', message: 'Start date is required' }
    ]
  },
  {
    key: 'endDate',
    type: 'date',
    validation: [
      { type: 'required', message: 'End date is required' },
      {
        type: 'custom',
        validator: (value: string, formData: any) => {
          if (!formData.startDate) return true; // Skip if start date not set
          return new Date(value) >= new Date(formData.startDate);
        },
        message: 'End date must be after start date'
      }
    ]
  }
]
```

### Conditional Required Fields
```typescript
fields: [
  {
    key: 'hasShipping',
    type: 'switch',
    label: 'Requires Shipping'
  },
  {
    key: 'shippingAddress',
    type: 'textarea',
    validation: [
      {
        type: 'custom',
        validator: (value: string, formData: any) => {
          if (formData.hasShipping) {
            return value && value.trim().length > 0;
          }
          return true; // Not required if shipping not selected
        },
        message: 'Shipping address is required when shipping is selected'
      }
    ]
  }
]
```

## 🔄 Validation Timing

### Real-Time Validation
```typescript
// Validation happens:
// 1. onBlur (when field loses focus)
// 2. onChange (after initial blur, validates on every change)
// 3. onSubmit (final validation before submission)
```

### Validation States
```typescript
// Field states:
'pristine'    // Never touched by user
'touched'     // User has interacted with field
'valid'       // Field passes all validation rules
'invalid'     // Field fails one or more validation rules
'pending'     // Async validation in progress (future feature)
```

## 🎨 Error Display

### Error Message Styling
The system automatically displays error messages:
- **Below the field** with red text
- **Field border** turns red for invalid fields
- **Icon indicator** shows validation status
- **Submit button** disabled when form is invalid

### Error Message Best Practices
```typescript
// Good: Clear, helpful messages
validation: [
  { type: 'required', message: 'Email address is required' },
  { type: 'email', message: 'Please enter a valid email like name@example.com' },
  { type: 'minLength', value: 8, message: 'Password must be at least 8 characters long' }
]

// Avoid: Generic or unclear messages
validation: [
  { type: 'required', message: 'Required' },           // ❌ Too generic
  { type: 'email', message: 'Invalid' },               // ❌ Not helpful
  { type: 'minLength', value: 8, message: 'Too short' } // ❌ Doesn't specify requirement
]
```

## 🔧 Validation Integration

### Form Submission
```typescript
const handleSubmit = async (data: Record<string, any>) => {
  // Auto-Form automatically validates before calling this function
  // If validation fails, this function won't be called
  
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Submission failed');
    }
    
    // Handle success
  } catch (error) {
    // Handle server-side errors
    console.error('Submission error:', error);
  }
};
```

### Server-Side Validation
```typescript
// Client-side validation is for UX
// Always validate on the server for security

// Example server validation response:
{
  success: false,
  errors: {
    email: 'Email address is already in use',
    username: 'Username contains prohibited words'
  }
}
```

## 💡 Validation Best Practices

### Message Guidelines
1. **Be Specific**: Explain exactly what's needed
2. **Be Helpful**: Provide examples or format requirements
3. **Be Human**: Use friendly, conversational language
4. **Be Positive**: When possible, tell users what to do, not what they did wrong

### Performance Tips
1. **Debounced Validation**: Avoid validating on every keystroke for expensive rules
2. **Conditional Validation**: Only validate fields that are visible/relevant
3. **Progressive Enhancement**: Start with basic validation, add complexity gradually

### User Experience
1. **Real-time Feedback**: Validate as users complete fields
2. **Clear Visual Cues**: Use color, icons, and positioning consistently
3. **Prevent Errors**: Use input masks, dropdowns, and constraints to guide users
4. **Recovery Path**: Always provide a clear way to fix errors

### Common Patterns
```typescript
// Required with helpful message
{ type: 'required', message: 'We need your email to send you updates' }

// Length with context
{ type: 'minLength', value: 3, message: 'Username must be at least 3 characters' }

// Pattern with example
{ 
  type: 'pattern', 
  value: /^\d{3}-\d{2}-\d{4}$/, 
  message: 'Social Security Number format: 123-45-6789' 
}

// Range with reason
{ type: 'min', value: 18, message: 'Must be 18 or older to register' }
```

---

*Next: [Examples](./examples.md) - See complete real-world examples*
