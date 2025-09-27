# Real-World Examples

This page provides complete, copy-pasteable examples of common form patterns using the Auto-Form system.

## 🏢 User Registration Form

A complete user registration form with validation and conditional fields.

```typescript
// src/features/auth/registration.schema.ts
import type { ResourceSchema } from '@/lib/resource-system/schemas';

export const REGISTRATION_SCHEMA: ResourceSchema = {
  databaseKey: 'users',
  modelName: 'User',
  actionPrefix: 'users',
  
  display: {
    title: 'User Registration',
    description: 'Create your account',
    icon: 'UserPlus'
  },
  
  form: {
    width: 'md',
    layout: 'compact',
    showDescriptions: true,
    submitButtonText: 'Create Account',
    cancelButtonText: 'Back to Login'
  },
  
  fields: [
    {
      key: 'id',
      label: 'User ID',
      type: 'text' as const,
      autoValue: { source: 'auto.uuid' as const },
      form: { row: 1, width: 'full', order: 1 }
    },
    
    // Personal Information
    {
      key: 'firstName',
      label: 'First Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter your first name',
      form: { row: 2, width: 'half', order: 1 },
      validation: [
        { type: 'required', message: 'First name is required' },
        { type: 'minLength', value: 2, message: 'First name too short' },
        { type: 'maxLength', value: 50, message: 'First name too long' }
      ]
    },
    {
      key: 'lastName',
      label: 'Last Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter your last name',
      form: { row: 2, width: 'half', order: 2 },
      validation: [
        { type: 'required', message: 'Last name is required' },
        { type: 'minLength', value: 2, message: 'Last name too short' },
        { type: 'maxLength', value: 50, message: 'Last name too long' }
      ]
    },
    
    // Contact Information
    {
      key: 'email',
      label: 'Email Address',
      type: 'email' as const,
      required: true,
      placeholder: 'name@example.com',
      description: 'We\'ll use this to send you account updates',
      form: { row: 3, width: 'full', order: 1 },
      validation: [
        { type: 'required', message: 'Email address is required' },
        { type: 'email', message: 'Please enter a valid email address' }
      ]
    },
    {
      key: 'phone',
      label: 'Phone Number',
      type: 'text' as const,
      placeholder: '(555) 123-4567',
      description: 'Optional - for account recovery',
      form: { row: 4, width: 'half', order: 1 },
      validation: [
        {
          type: 'pattern',
          value: /^\(\d{3}\) \d{3}-\d{4}$/,
          message: 'Phone format: (555) 123-4567'
        }
      ]
    },
    
    // Account Information
    {
      key: 'username',
      label: 'Username',
      type: 'text' as const,
      required: true,
      placeholder: 'Choose a unique username',
      form: { row: 4, width: 'half', order: 2 },
      validation: [
        { type: 'required', message: 'Username is required' },
        { type: 'minLength', value: 3, message: 'Username must be at least 3 characters' },
        { type: 'maxLength', value: 20, message: 'Username cannot exceed 20 characters' },
        {
          type: 'pattern',
          value: /^[a-zA-Z0-9_]+$/,
          message: 'Username can only contain letters, numbers, and underscores'
        }
      ]
    },
    {
      key: 'password',
      label: 'Password',
      type: 'text' as const, // In real app, use password input
      required: true,
      placeholder: 'Create a strong password',
      form: { row: 5, width: 'half', order: 1 },
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
      label: 'Confirm Password',
      type: 'text' as const,
      required: true,
      placeholder: 'Re-enter your password',
      form: { row: 5, width: 'half', order: 2 },
      validation: [
        { type: 'required', message: 'Please confirm your password' },
        {
          type: 'custom',
          validator: (value: string, formData: any) => value === formData.password,
          message: 'Passwords do not match'
        }
      ]
    },
    
    // Preferences
    {
      key: 'role',
      label: 'Account Type',
      type: 'select' as const,
      required: true,
      defaultValue: 'USER',
      form: { row: 6, width: 'half', order: 1 },
      options: {
        static: [
          { value: 'USER', label: 'Regular User' },
          { value: 'BUSINESS', label: 'Business Account' },
          { value: 'DEVELOPER', label: 'Developer Account' }
        ],
        searchable: false
      }
    },
    {
      key: 'newsletter',
      label: 'Subscribe to Newsletter',
      type: 'switch' as const,
      defaultValue: true,
      description: 'Receive product updates and tips',
      form: { row: 6, width: 'half', order: 2 }
    },
    
    // System fields
    {
      key: 'tenantId',
      label: 'Tenant ID',
      type: 'text' as const,
      autoValue: { source: 'session.user.tenantId' as const }
    },
    {
      key: 'createdAt',
      label: 'Created At',
      type: 'text' as const,
      autoValue: { source: 'auto.timestamp' as const }
    }
  ],
  
  search: {
    fields: ['firstName', 'lastName', 'email', 'username'],
    placeholder: 'Search users...',
    fuzzy: true
  },
  
  actions: {
    create: true,
    update: true,
    delete: false,
    duplicate: false,
    bulk: false,
    optimistic: true
  },
  
  mobile: {
    cardFormat: 'simple' as const,
    primaryField: 'firstName',
    secondaryFields: ['email'],
    showSearch: true,
    showFilters: false
  },
  
  desktop: {
    sortField: 'createdAt',
    sortOrder: 'desc' as const,
    editableField: 'firstName',
    rowActions: true,
    bulkActions: false
  },
  
  indexedDBKey: (record: any) => record.id
};
```

## 🛍️ E-commerce Product Form

A product form with conditional fields, pricing, and inventory management.

```typescript
// src/features/products/product.schema.ts
export const PRODUCT_SCHEMA: ResourceSchema = {
  databaseKey: 'products',
  modelName: 'Product',
  actionPrefix: 'products',
  
  display: {
    title: 'Products',
    description: 'Manage your product catalog',
    icon: 'Package'
  },
  
  form: {
    width: 'lg',
    layout: 'spacious',
    showDescriptions: true
  },
  
  fields: [
    {
      key: 'id',
      label: 'Product ID',
      type: 'text' as const,
      autoValue: { source: 'auto.uuid' as const }
    },
    
    // Basic Information
    {
      key: 'name',
      label: 'Product Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter product name',
      form: { row: 1, width: 'full', order: 1 },
      validation: [
        { type: 'required', message: 'Product name is required' },
        { type: 'minLength', value: 3, message: 'Product name too short' },
        { type: 'maxLength', value: 100, message: 'Product name too long' }
      ]
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Detailed product description...',
      description: 'This will be shown to customers',
      form: { row: 2, width: 'full', order: 1 },
      validation: [
        { type: 'maxLength', value: 2000, message: 'Description too long' }
      ]
    },
    
    // Categorization
    {
      key: 'categoryId',
      label: 'Category',
      type: 'select' as const,
      required: true,
      form: { row: 3, width: 'half', order: 1 },
      options: {
        dynamic: {
          resource: 'categories',
          valueField: 'id',
          labelField: 'name'
        }
      },
      validation: [
        { type: 'required', message: 'Please select a category' }
      ]
    },
    {
      key: 'subcategoryId',
      label: 'Subcategory',
      type: 'select' as const,
      form: { row: 3, width: 'half', order: 2 },
      options: {
        dynamic: {
          resource: 'subcategories',
          valueField: 'id',
          labelField: 'name'
        },
        conditional: [
          {
            watchField: 'categoryId',
            apiFilters: { categoryId: '{value}' }
          }
        ]
      }
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'tags' as const,
      placeholder: 'Add product tags...',
      description: 'Help customers find this product',
      form: { row: 4, width: 'full', order: 1 }
    },
    
    // Pricing
    {
      key: 'price',
      label: 'Sale Price',
      type: 'currency' as const,
      required: true,
      form: { row: 5, width: 'third', order: 1 },
      validation: [
        { type: 'required', message: 'Sale price is required' },
        { type: 'min', value: 0.01, message: 'Price must be greater than $0.00' }
      ]
    },
    {
      key: 'cost',
      label: 'Cost',
      type: 'currency' as const,
      placeholder: 'Your cost',
      description: 'Internal cost (not shown to customers)',
      form: { row: 5, width: 'third', order: 2 },
      validation: [
        { type: 'min', value: 0, message: 'Cost cannot be negative' }
      ]
    },
    {
      key: 'compareAtPrice',
      label: 'Compare At Price',
      type: 'currency' as const,
      placeholder: 'Original price',
      description: 'Show as strikethrough for discounts',
      form: { row: 5, width: 'third', order: 3 },
      validation: [
        {
          type: 'custom',
          validator: (value: number, formData: any) => {
            if (!value) return true; // Optional field
            return value > formData.price;
          },
          message: 'Compare at price should be higher than sale price'
        }
      ]
    },
    
    // Inventory
    {
      key: 'trackInventory',
      label: 'Track Inventory',
      type: 'switch' as const,
      defaultValue: true,
      description: 'Monitor stock levels',
      form: { row: 6, width: 'third', order: 1 }
    },
    {
      key: 'stockQuantity',
      label: 'Stock Quantity',
      type: 'number' as const,
      defaultValue: 0,
      form: { row: 6, width: 'third', order: 2 },
      validation: [
        {
          type: 'custom',
          validator: (value: number, formData: any) => {
            if (!formData.trackInventory) return true; // Not required if not tracking
            return value >= 0;
          },
          message: 'Stock quantity cannot be negative'
        }
      ]
    },
    {
      key: 'lowStockThreshold',
      label: 'Low Stock Alert',
      type: 'number' as const,
      defaultValue: 5,
      description: 'Alert when stock falls below this number',
      form: { row: 6, width: 'third', order: 3 },
      validation: [
        { type: 'min', value: 0, message: 'Threshold cannot be negative' }
      ]
    },
    
    // Physical Properties
    {
      key: 'requiresShipping',
      label: 'Requires Shipping',
      type: 'switch' as const,
      defaultValue: true,
      form: { row: 7, width: 'quarter', order: 1 }
    },
    {
      key: 'weight',
      label: 'Weight (lbs)',
      type: 'number' as const,
      placeholder: '0.0',
      form: { row: 7, width: 'quarter', order: 2 },
      validation: [
        {
          type: 'custom',
          validator: (value: number, formData: any) => {
            if (!formData.requiresShipping) return true;
            return value > 0;
          },
          message: 'Weight is required for shipped items'
        }
      ]
    },
    {
      key: 'length',
      label: 'Length (in)',
      type: 'number' as const,
      form: { row: 7, width: 'quarter', order: 3 }
    },
    {
      key: 'width',
      label: 'Width (in)',
      type: 'number' as const,
      form: { row: 7, width: 'quarter', order: 4 }
    },
    
    // Status
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      required: true,
      defaultValue: 'DRAFT',
      form: { row: 8, width: 'half', order: 1 },
      options: {
        static: [
          { value: 'DRAFT', label: 'Draft', icon: 'Edit' },
          { value: 'ACTIVE', label: 'Active', icon: 'Eye' },
          { value: 'ARCHIVED', label: 'Archived', icon: 'Archive' }
        ],
        searchable: false
      }
    },
    {
      key: 'featured',
      label: 'Featured Product',
      type: 'switch' as const,
      defaultValue: false,
      description: 'Show in featured products section',
      form: { row: 8, width: 'half', order: 2 }
    },
    
    // SEO
    {
      key: 'seoTitle',
      label: 'SEO Title',
      type: 'text' as const,
      placeholder: 'Page title for search engines',
      form: { row: 9, width: 'full', order: 1 },
      validation: [
        { type: 'maxLength', value: 70, message: 'SEO title should be under 70 characters' }
      ]
    },
    {
      key: 'seoDescription',
      label: 'SEO Description',
      type: 'textarea' as const,
      placeholder: 'Meta description for search results...',
      form: { row: 10, width: 'full', order: 1 },
      validation: [
        { type: 'maxLength', value: 160, message: 'SEO description should be under 160 characters' }
      ]
    },
    
    // System fields
    {
      key: 'sku',
      label: 'SKU',
      type: 'text' as const,
      autoValue: { source: 'auto.uuid' as const }, // In real app, use SKU generator
      validation: [
        { type: 'required', message: 'SKU is required' }
      ]
    },
    {
      key: 'tenantId',
      type: 'text' as const,
      autoValue: { source: 'session.user.tenantId' as const }
    }
  ],
  
  // Additional schema configuration...
  search: {
    fields: ['name', 'description', 'sku', 'tags'],
    placeholder: 'Search products...',
    fuzzy: true
  },
  
  filtering: {
    level1: {
      title: 'Status',
      filterField: 'status',
      tabs: [
        { id: 'all', label: 'All', value: 'all' },
        { id: 'active', label: 'Active', value: 'ACTIVE', icon: 'Eye' },
        { id: 'draft', label: 'Draft', value: 'DRAFT', icon: 'Edit' },
        { id: 'archived', label: 'Archived', value: 'ARCHIVED', icon: 'Archive' }
      ],
      showAll: true,
      defaultTab: 'all'
    }
  },
  
  actions: {
    create: true,
    update: true,
    delete: true,
    duplicate: true,
    bulk: true,
    optimistic: true
  },
  
  mobile: {
    cardFormat: 'detailed' as const,
    primaryField: 'name',
    secondaryFields: ['price', 'status', 'stockQuantity'],
    showSearch: true,
    showFilters: true
  },
  
  desktop: {
    sortField: 'name',
    sortOrder: 'asc' as const,
    editableField: 'name',
    rowActions: true,
    bulkActions: true
  },
  
  indexedDBKey: (record: any) => record.id
};
```

## 🏢 Company Settings Form

A settings form with tabs, conditional sections, and complex configurations.

```typescript
// src/features/settings/company.schema.ts
export const COMPANY_SETTINGS_SCHEMA: ResourceSchema = {
  databaseKey: 'companySettings',
  modelName: 'CompanySettings',
  actionPrefix: 'companySettings',
  notHasBranchContext: true, // Company-wide settings
  
  display: {
    title: 'Company Settings',
    description: 'Manage company-wide configuration',
    icon: 'Building'
  },
  
  form: {
    width: 'xl',
    layout: 'spacious',
    showDescriptions: true
  },
  
  fields: [
    // GENERAL TAB
    {
      key: 'companyName',
      label: 'Company Name',
      type: 'text' as const,
      required: true,
      tab: 'general',
      form: { row: 1, width: 'full', order: 1 },
      validation: [
        { type: 'required', message: 'Company name is required' }
      ]
    },
    {
      key: 'website',
      label: 'Website',
      type: 'url' as const,
      tab: 'general',
      placeholder: 'https://example.com',
      form: { row: 2, width: 'half', order: 1 },
      validation: [
        { type: 'url', message: 'Please enter a valid website URL' }
      ]
    },
    {
      key: 'industry',
      label: 'Industry',
      type: 'select' as const,
      tab: 'general',
      form: { row: 2, width: 'half', order: 2 },
      options: {
        static: [
          { value: 'TECH', label: 'Technology' },
          { value: 'RETAIL', label: 'Retail' },
          { value: 'HEALTHCARE', label: 'Healthcare' },
          { value: 'FINANCE', label: 'Financial Services' },
          { value: 'MANUFACTURING', label: 'Manufacturing' },
          { value: 'OTHER', label: 'Other' }
        ]
      }
    },
    {
      key: 'description',
      label: 'Company Description',
      type: 'textarea' as const,
      tab: 'general',
      placeholder: 'Brief description of your company...',
      form: { row: 3, width: 'full', order: 1 }
    },
    
    // CONTACT TAB
    {
      key: 'contactEmail',
      label: 'Main Contact Email',
      type: 'email' as const,
      required: true,
      tab: 'contact',
      form: { row: 1, width: 'half', order: 1 },
      validation: [
        { type: 'required', message: 'Contact email is required' },
        { type: 'email', message: 'Please enter a valid email' }
      ]
    },
    {
      key: 'contactPhone',
      label: 'Main Phone',
      type: 'text' as const,
      tab: 'contact',
      form: { row: 1, width: 'half', order: 2 },
      validation: [
        {
          type: 'pattern',
          value: /^\+?[\d\s\-\(\)]{10,}$/,
          message: 'Please enter a valid phone number'
        }
      ]
    },
    {
      key: 'address',
      label: 'Street Address',
      type: 'textarea' as const,
      tab: 'contact',
      form: { row: 2, width: 'full', order: 1 }
    },
    {
      key: 'city',
      label: 'City',
      type: 'text' as const,
      tab: 'contact',
      form: { row: 3, width: 'third', order: 1 }
    },
    {
      key: 'state',
      label: 'State/Province',
      type: 'text' as const,
      tab: 'contact',
      form: { row: 3, width: 'third', order: 2 }
    },
    {
      key: 'postalCode',
      label: 'Postal Code',
      type: 'text' as const,
      tab: 'contact',
      form: { row: 3, width: 'third', order: 3 }
    },
    {
      key: 'country',
      label: 'Country',
      type: 'select' as const,
      tab: 'contact',
      form: { row: 4, width: 'half', order: 1 },
      options: {
        dynamic: {
          resource: 'countries',
          valueField: 'code',
          labelField: 'name'
        }
      }
    },
    {
      key: 'timezone',
      label: 'Default Timezone',
      type: 'select' as const,
      tab: 'contact',
      form: { row: 4, width: 'half', order: 2 },
      options: {
        dynamic: {
          resource: 'timezones',
          valueField: 'value',
          labelField: 'label'
        }
      }
    },
    
    // BRANDING TAB
    {
      key: 'primaryColor',
      label: 'Primary Brand Color',
      type: 'text' as const, // In real app, use color picker
      tab: 'branding',
      placeholder: '#007bff',
      form: { row: 1, width: 'quarter', order: 1 },
      validation: [
        {
          type: 'pattern',
          value: /^#[0-9A-F]{6}$/i,
          message: 'Color must be in hex format (#123ABC)'
        }
      ]
    },
    {
      key: 'secondaryColor',
      label: 'Secondary Color',
      type: 'text' as const,
      tab: 'branding',
      placeholder: '#6c757d',
      form: { row: 1, width: 'quarter', order: 2 },
      validation: [
        {
          type: 'pattern',
          value: /^#[0-9A-F]{6}$/i,
          message: 'Color must be in hex format (#123ABC)'
        }
      ]
    },
    {
      key: 'logoUrl',
      label: 'Logo URL',
      type: 'url' as const,
      tab: 'branding',
      placeholder: 'https://example.com/logo.png',
      form: { row: 1, width: 'half', order: 3 }
    },
    {
      key: 'faviconUrl',
      label: 'Favicon URL',
      type: 'url' as const,
      tab: 'branding',
      placeholder: 'https://example.com/favicon.ico',
      form: { row: 2, width: 'half', order: 1 }
    },
    {
      key: 'customCss',
      label: 'Custom CSS',
      type: 'textarea' as const,
      tab: 'branding',
      placeholder: '/* Custom styles */\n.custom-class {\n  color: #333;\n}',
      description: 'Advanced: Custom CSS for additional styling',
      form: { row: 3, width: 'full', order: 1 }
    },
    
    // NOTIFICATIONS TAB
    {
      key: 'emailNotifications',
      label: 'Email Notifications',
      type: 'switch' as const,
      defaultValue: true,
      tab: 'notifications',
      form: { row: 1, width: 'third', order: 1 }
    },
    {
      key: 'smsNotifications',
      label: 'SMS Notifications',
      type: 'switch' as const,
      defaultValue: false,
      tab: 'notifications',
      form: { row: 1, width: 'third', order: 2 }
    },
    {
      key: 'slackNotifications',
      label: 'Slack Integration',
      type: 'switch' as const,
      defaultValue: false,
      tab: 'notifications',
      form: { row: 1, width: 'third', order: 3 }
    },
    {
      key: 'notificationEmail',
      label: 'Notification Email',
      type: 'email' as const,
      tab: 'notifications',
      description: 'Where to send system notifications',
      form: { row: 2, width: 'half', order: 1 },
      validation: [
        {
          type: 'custom',
          validator: (value: string, formData: any) => {
            if (formData.emailNotifications && !value) return false;
            return true;
          },
          message: 'Notification email required when email notifications enabled'
        }
      ]
    },
    {
      key: 'slackWebhookUrl',
      label: 'Slack Webhook URL',
      type: 'url' as const,
      tab: 'notifications',
      form: { row: 2, width: 'half', order: 2 },
      validation: [
        {
          type: 'custom',
          validator: (value: string, formData: any) => {
            if (formData.slackNotifications && !value) return false;
            return true;
          },
          message: 'Slack webhook required when Slack notifications enabled'
        }
      ]
    },
    
    // SECURITY TAB
    {
      key: 'requireTwoFactor',
      label: 'Require Two-Factor Authentication',
      type: 'switch' as const,
      defaultValue: false,
      tab: 'security',
      description: 'Require 2FA for all users',
      form: { row: 1, width: 'half', order: 1 }
    },
    {
      key: 'passwordMinLength',
      label: 'Minimum Password Length',
      type: 'number' as const,
      defaultValue: 8,
      tab: 'security',
      form: { row: 1, width: 'quarter', order: 2 },
      validation: [
        { type: 'min', value: 6, message: 'Minimum length should be at least 6' },
        { type: 'max', value: 128, message: 'Maximum length is 128 characters' }
      ]
    },
    {
      key: 'sessionTimeout',
      label: 'Session Timeout (minutes)',
      type: 'number' as const,
      defaultValue: 60,
      tab: 'security',
      form: { row: 1, width: 'quarter', order: 3 },
      validation: [
        { type: 'min', value: 5, message: 'Session timeout minimum is 5 minutes' },
        { type: 'max', value: 480, message: 'Session timeout maximum is 8 hours' }
      ]
    },
    {
      key: 'allowedDomains',
      label: 'Allowed Email Domains',
      type: 'tags' as const,
      tab: 'security',
      placeholder: 'example.com, company.org',
      description: 'Restrict user registration to these domains (leave empty for any)',
      form: { row: 2, width: 'full', order: 1 }
    },
    
    // System fields
    {
      key: 'id',
      type: 'text' as const,
      autoValue: { source: 'auto.uuid' as const }
    },
    {
      key: 'tenantId',
      type: 'text' as const,
      autoValue: { source: 'session.user.tenantId' as const }
    },
    {
      key: 'updatedAt',
      type: 'text' as const,
      autoValue: { source: 'auto.timestamp' as const }
    }
  ],
  
  // Tab configuration (derived from field tabs)
  // The system automatically creates tabs based on field.tab values
  
  search: {
    fields: ['companyName'],
    placeholder: 'Search settings...',
    fuzzy: false
  },
  
  actions: {
    create: false, // Usually only one company settings record
    update: true,
    delete: false,
    duplicate: false,
    bulk: false,
    optimistic: true
  },
  
  mobile: {
    cardFormat: 'compact' as const,
    primaryField: 'companyName',
    secondaryFields: [],
    showSearch: false,
    showFilters: false
  },
  
  desktop: {
    sortField: 'companyName',
    sortOrder: 'asc' as const,
    editableField: 'companyName',
    rowActions: false,
    bulkActions: false
  },
  
  indexedDBKey: (record: any) => record.id
};
```

## 🎯 Usage Examples

### Basic Usage
```typescript
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { REGISTRATION_SCHEMA } from './registration.schema';

function RegistrationPage() {
  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      // Handle success (redirect, show message, etc.)
      console.log('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <AutoForm
        schema={REGISTRATION_SCHEMA}
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
```

### Edit Mode Usage
```typescript
function ProductEditPage({ productId }: { productId: string }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing product data
    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      });
  }, [productId]);

  const handleSubmit = async (data: Record<string, any>) => {
    // Update product
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      console.log('Product updated successfully!');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AutoForm
      schema={PRODUCT_SCHEMA}
      mode="edit"
      initialData={product}
      onSubmit={handleSubmit}
      onCancel={() => window.history.back()}
      isLoading={loading}
    />
  );
}
```

### Custom Form Configuration
```typescript
function CustomProductForm() {
  return (
    <AutoForm
      schema={PRODUCT_SCHEMA}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      
      // Customization options
      compact={true}              // More compact layout
      enableAnimations={false}    // Disable animations
      enableKeyboardShortcuts={true} // Ctrl+Enter to submit
      
      // Custom styling
      className="custom-form-styles"
      
      // Loading state
      isLoading={isSubmitting}
    />
  );
}
```

These examples demonstrate the power and flexibility of the Auto-Form system. Each schema defines a complete form with validation, layout, conditional logic, and more - all through simple configuration objects.

---

*Next: [API Integration](./api-integration.md) - Learn about connecting forms to your backend*
