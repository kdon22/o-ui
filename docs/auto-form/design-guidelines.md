# Design Guidelines

This guide covers best practices for creating beautiful, usable forms using the Auto-Form system.

## 🎯 Design Principles

The Auto-Form system is built on these core design principles:

### 1. **Clarity First**
- Clear labels and descriptions
- Obvious visual hierarchy
- Predictable interactions
- Helpful error messages

### 2. **Mobile-First**
- Touch-friendly interface
- Responsive layouts
- Readable text sizes
- Thumb-accessible controls

### 3. **Accessibility**
- Keyboard navigation
- Screen reader support
- High contrast ratios
- Focus management

### 4. **Performance**
- Fast loading times
- Smooth interactions
- Minimal layout shifts
- Progressive enhancement

## 📱 Layout & Visual Design

### Form Width Guidelines
```typescript
form: {
  width: 'sm'    // ~512px  - Login, simple settings, quick forms
  width: 'md'    // ~672px  - Contact forms, user profiles, standard forms  
  width: 'lg'    // ~896px  - Product forms, complex data entry
  width: 'xl'    // ~1152px - Admin panels, detailed configurations
  width: 'full'  // 100%    - Dashboard forms, full-page editing
}
```

### Field Layout Patterns
```typescript
// Pattern 1: Full-width for important fields
{
  key: 'title',
  form: { row: 1, width: 'full', order: 1 }  // Gets user's full attention
}

// Pattern 2: Related fields grouped together
{
  key: 'firstName',
  form: { row: 2, width: 'half', order: 1 }  // Logical pairing
},
{
  key: 'lastName', 
  form: { row: 2, width: 'half', order: 2 }  // with lastName
}

// Pattern 3: Primary/secondary field pairing
{
  key: 'email',
  form: { row: 3, width: '3quarters', order: 1 }  // Primary focus
},
{
  key: 'isVerified',
  type: 'switch',
  form: { row: 3, width: 'quarter', order: 2 }    // Secondary toggle
}
```

### Visual Hierarchy
```typescript
// Hierarchy through field ordering and sizing:

// 1. Most Important: Full width, early rows
{ key: 'companyName', form: { row: 1, width: 'full' } }

// 2. Important: Large fields, middle sections  
{ key: 'contactEmail', form: { row: 2, width: 'lg' } }

// 3. Supporting: Medium fields, paired together
{ key: 'phone', form: { row: 3, width: 'half' } }
{ key: 'website', form: { row: 3, width: 'half' } }

// 4. Optional/Meta: Small fields, later rows
{ key: 'tags', form: { row: 4, width: 'sm' } }
{ key: 'isPublic', type: 'switch', form: { row: 4, width: 'xs' } }
```

## 🎨 Content Design

### Label Guidelines
```typescript
// Good: Clear, specific labels
label: 'Email Address'          // vs 'Email'
label: 'Company Website'        // vs 'Website' 
label: 'Project Start Date'     // vs 'Date'
label: 'Monthly Budget (USD)'   // vs 'Budget'

// Good: Action-oriented labels
label: 'Send Welcome Email'     // vs 'Welcome Email'
label: 'Make Profile Public'    // vs 'Public Profile'
label: 'Require Two-Factor Auth' // vs 'Two-Factor'
```

### Placeholder Guidelines
```typescript
// Good: Show expected format
placeholder: 'name@example.com'
placeholder: '(555) 123-4567'
placeholder: 'https://company.com'
placeholder: 'Enter product name'

// Good: Provide helpful examples
placeholder: 'e.g., iPhone 15 Pro Max'
placeholder: 'Marketing, Sales, Support'
placeholder: 'Brief description of your company'

// Avoid: Generic or unhelpful
placeholder: 'Enter value'      // Not helpful
placeholder: 'Required field'   // States the obvious
placeholder: 'Type here'        // Doesn't add value
```

### Description Guidelines
```typescript
// Good: Helpful context and guidance
description: 'This email will receive all system notifications'
description: 'Choose a unique username (3-20 characters, letters and numbers only)'
description: 'Your profile will be visible to other team members'
description: 'This cannot be changed after creation'

// Good: Explain impact or benefits
description: 'Enabling this will improve search ranking'
description: 'We\'ll use this to calculate shipping costs'
description: 'This helps customers find your products'

// Avoid: Restating the obvious
description: 'Enter your email address'     // Label already says this
description: 'This field is required'       // Visual cues show this
description: 'Choose from the dropdown'     // Interface is self-evident
```

### Error Message Guidelines
```typescript
// Good: Specific, actionable messages
validation: [
  { type: 'required', message: 'We need your email to send you updates' },
  { type: 'email', message: 'Please enter a valid email like name@example.com' },
  { type: 'minLength', value: 8, message: 'Password must be at least 8 characters long' }
]

// Good: Explain why and how to fix
message: 'Username is taken - try adding numbers or your company name'
message: 'This email domain is not allowed - please use a business email'
message: 'File size too large - please choose an image under 5MB'

// Avoid: Vague or technical messages  
message: 'Invalid input'        // Doesn't explain what's wrong
message: 'Validation failed'    // Too technical
message: 'Error occurred'       // Not helpful
```

## 🎛️ Field Selection & Configuration

### Choose the Right Field Type
```typescript
// Contact Information
{ type: 'text' }      // Names, titles, short text
{ type: 'email' }     // Email addresses (with validation)
{ type: 'url' }       // Website URLs (with validation)
{ type: 'textarea' }  // Addresses, long descriptions

// Numeric Data
{ type: 'number' }    // Quantities, ages, scores
{ type: 'currency' }  // Prices, salaries, costs

// Choices
{ type: 'select' }    // Categories, statuses, assignments
{ type: 'switch' }    // Boolean settings, toggles

// Dates & Advanced
{ type: 'date' }      // Deadlines, birthdays, events
{ type: 'tags' }      // Skills, categories, keywords
{ type: 'json' }      // Configuration objects
```

### Select Field Design
```typescript
// Use searchable for long lists
{
  key: 'userId',
  type: 'select',
  options: {
    dynamic: { resource: 'users' }  // Could be 100+ users
    // searchable: true by default - good for long lists
  }
}

// Disable search for short lists
{
  key: 'priority',
  type: 'select',
  options: {
    static: [
      { value: 'LOW', label: 'Low Priority' },
      { value: 'HIGH', label: 'High Priority' }
    ],
    searchable: false  // Only 2 options, search not needed
  }
}

// Add icons for visual clarity
{
  key: 'status',
  options: {
    static: [
      { value: 'ACTIVE', label: 'Active', icon: 'CheckCircle' },
      { value: 'INACTIVE', label: 'Inactive', icon: 'XCircle' },
      { value: 'PENDING', label: 'Pending', icon: 'Clock' }
    ]
  }
}
```

## 📋 Form Organization Patterns

### Contact Form Pattern
```typescript
// Logical flow: Personal → Contact → Additional
fields: [
  // Row 1: Full name (most important)
  { key: 'fullName', form: { row: 1, width: 'full' } },
  
  // Row 2: Primary contact methods
  { key: 'email', form: { row: 2, width: 'half' } },
  { key: 'phone', form: { row: 2, width: 'half' } },
  
  // Row 3: Optional/additional info
  { key: 'company', form: { row: 3, width: 'half' } },
  { key: 'jobTitle', form: { row: 3, width: 'half' } },
  
  // Row 4: Message/notes (full width for writing space)
  { key: 'message', type: 'textarea', form: { row: 4, width: 'full' } }
]
```

### Product Form Pattern
```typescript
// Flow: Identity → Classification → Pricing → Details
fields: [
  // Product identity
  { key: 'name', form: { row: 1, width: 'full' } },
  { key: 'description', type: 'textarea', form: { row: 2, width: 'full' } },
  
  // Classification
  { key: 'categoryId', form: { row: 3, width: 'half' } },
  { key: 'status', form: { row: 3, width: 'half' } },
  
  // Pricing (related data together)
  { key: 'price', form: { row: 4, width: 'third' } },
  { key: 'cost', form: { row: 4, width: 'third' } },
  { key: 'margin', form: { row: 4, width: 'third' } },
  
  // Additional details
  { key: 'tags', form: { row: 5, width: 'full' } }
]
```

### Settings Form Pattern
```typescript
// Flow: Main setting → Related toggles → Advanced options
fields: [
  // Primary setting
  { key: 'siteName', form: { row: 1, width: '3quarters' } },
  { key: 'isEnabled', type: 'switch', form: { row: 1, width: 'quarter' } },
  
  // Related options (grouped together)
  { key: 'emailNotifs', type: 'switch', form: { row: 2, width: 'third' } },
  { key: 'smsNotifs', type: 'switch', form: { row: 2, width: 'third' } },
  { key: 'pushNotifs', type: 'switch', form: { row: 2, width: 'third' } },
  
  // Advanced configuration
  { key: 'config', type: 'json', tab: 'advanced' }
]
```

## 📱 Mobile Design Considerations

### Touch-Friendly Design
```typescript
// The system automatically optimizes for mobile:
// - All fields become full-width on mobile
// - Touch targets are 44px minimum
// - Proper spacing between elements
// - Appropriate input types trigger correct keyboards

// You should consider:
form: {
  layout: 'compact'  // Better for mobile screens
}

// Group related fields to minimize scrolling
{ key: 'firstName', form: { row: 1, width: 'half' } },
{ key: 'lastName', form: { row: 1, width: 'half' } }
// Becomes two full-width fields on mobile
```

### Mobile-Specific Considerations
```typescript
// Good for mobile
{ type: 'email' }     // Shows email keyboard
{ type: 'number' }    // Shows numeric keypad
{ type: 'url' }       // Shows URL keyboard with .com key

// Consider alternatives for mobile
{ type: 'date' }      // Good: Native date picker
{ type: 'select' }    // Good: Native dropdowns
{ type: 'switch' }    // Good: Large touch target

// Be careful with
{ type: 'textarea' }  // Ensure adequate height
{ type: 'tags' }      // May need special mobile handling
```

## ♿ Accessibility Guidelines

### Built-in Accessibility Features
The Auto-Form system automatically provides:
- Proper ARIA labels and descriptions
- Keyboard navigation (Tab, Shift+Tab, Enter, Escape)
- Focus management and visual indicators
- Screen reader announcements
- High contrast mode support

### Additional Considerations
```typescript
// Good: Descriptive labels
label: 'Email Address'           // Screen readers announce this
label: 'Password (8+ characters)' // Include requirements in label

// Good: Helpful descriptions
description: 'Used for account recovery and notifications'

// Good: Clear error messages
validation: [
  { type: 'required', message: 'Email address is required to create your account' }
]
```

## 🎨 Visual Design Best Practices

### Color Usage
```typescript
// The system automatically provides appropriate colors:
// - Blue for actions and links
// - Green for success states
// - Red for errors and validation
// - Gray for disabled states
// - Proper contrast ratios for accessibility

// You don't need to specify colors, but can customize:
className: "custom-form-styling"  // Add custom CSS if needed
```

### Typography Hierarchy
```typescript
// Automatic typography hierarchy:
// Form title: Large, bold
// Field labels: Medium, semibold  
// Field descriptions: Small, regular
// Error messages: Small, red
// Placeholder text: Medium, muted
```

### Spacing and Layout
```typescript
// Good: Consistent spacing through form configuration
form: {
  layout: 'compact'    // Tighter spacing for simple forms
  // or
  layout: 'spacious'   // More breathing room for complex forms
}

// Good: Logical grouping
// Related fields in same row
{ form: { row: 2, width: 'half', order: 1 } },
{ form: { row: 2, width: 'half', order: 2 } },

// Unrelated fields in different rows  
{ form: { row: 3, width: 'full', order: 1 } }
```

## 📊 User Experience Patterns

### Progressive Disclosure
```typescript
// Start with essential fields
fields: [
  { key: 'name', required: true, form: { row: 1 } },
  { key: 'email', required: true, form: { row: 2 } }
]

// Advanced fields in later tabs or sections
advancedFields: [
  { key: 'apiKey', tab: 'advanced' },
  { key: 'webhookUrl', tab: 'advanced' }
]
```

### Smart Defaults
```typescript
// Provide sensible defaults
{ key: 'country', defaultValue: 'US' },
{ key: 'currency', defaultValue: 'USD' },
{ key: 'timezone', defaultValue: 'America/New_York' },
{ key: 'notifications', type: 'switch', defaultValue: true }
```

### Radio Button Layout
```typescript
// Use horizontal for 2-3 short options
{
  key: 'type',
  type: 'radio',
  options: {
    static: [
      { value: 'GDS', label: 'GDS' },
      { value: 'VIRTUAL', label: 'Virtual' }
    ],
    layout: 'horizontal' // ✅ Perfect for binary choices
  }
}

// Use vertical (default) for 3+ options or long labels
{
  key: 'plan',
  type: 'radio',
  options: {
    static: [
      { value: 'BASIC', label: 'Basic Plan - $9/month' },
      { value: 'PRO', label: 'Professional Plan - $29/month' },
      { value: 'ENTERPRISE', label: 'Enterprise Plan - $99/month' }
    ],
    layout: 'vertical' // ✅ Better for longer labels (default)
  }
}
```

### Contextual Help
```typescript
// Show help when and where needed
{
  key: 'apiKey',
  label: 'API Key',
  description: 'Generate this in your developer settings',
  placeholder: 'sk_live_...'
}

{
  key: 'webhookUrl', 
  label: 'Webhook URL',
  description: 'We\'ll send POST requests here when events occur',
  placeholder: 'https://yoursite.com/webhook'
}
```

## 🚫 Common Design Mistakes

### Layout Issues
```typescript
// ❌ Too many fields in one row (cramped on mobile)
{ form: { row: 1, width: 'quarter' } },  // 4 fields in one row
{ form: { row: 1, width: 'quarter' } },  // Too cramped
{ form: { row: 1, width: 'quarter' } },
{ form: { row: 1, width: 'quarter' } }

// ✅ Better: 2-3 fields max per row
{ form: { row: 1, width: 'half' } },     // 2 fields
{ form: { row: 1, width: 'half' } }
```

### Content Issues
```typescript
// ❌ Vague labels
label: 'Name'           // Which name? User? Company? Product?
label: 'Date'           // Which date? Start? End? Created?
label: 'Settings'       // What kind of settings?

// ✅ Specific labels
label: 'Company Name'
label: 'Project Start Date'
label: 'Email Notification Settings'
```

### Validation Issues  
```typescript
// ❌ Unhelpful error messages
message: 'Invalid'              // What's invalid?
message: 'Required field'       // User can see it's required
message: 'Format error'         // What format is expected?

// ✅ Clear, actionable messages
message: 'Please enter a valid email address'
message: 'Password must be at least 8 characters'
message: 'Phone number format: (555) 123-4567'
```

## 💡 Design Checklist

### Before Building
- [ ] Sketch the form flow on paper
- [ ] Identify required vs optional fields
- [ ] Group related fields together
- [ ] Consider mobile experience
- [ ] Plan for error states

### During Development
- [ ] Use clear, specific labels
- [ ] Provide helpful descriptions  
- [ ] Set appropriate field types
- [ ] Configure sensible defaults
- [ ] Write clear error messages

### After Building
- [ ] Test on mobile devices
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Verify error message clarity
- [ ] Check loading performance

### Accessibility Review
- [ ] All fields have labels
- [ ] Error messages are clear
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] Color contrast meets standards

Remember: The Auto-Form system handles most design concerns automatically. Focus on content clarity, logical organization, and user needs rather than visual styling details.

---

*This completes the comprehensive Auto-Form documentation. You now have everything needed to create beautiful, performant, accessible forms!*
