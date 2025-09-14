# 🎯 Adding New Interfaces - Advanced Patterns

## 🚀 **Quick Reference**

### **Basic Interface Addition (2 Minutes)**
1. **Define interface** in module file
2. **Add to collection** at bottom of file
3. **Reference in schemas** with `returnInterface`
4. **Register with service** in `loadModuleInterfaces()`

### **Complete Example**
```typescript
// 1. Define interface
export const CRYPTO_HASH_INTERFACE = {
  name: 'CryptoHash',
  properties: [
    { name: 'hash', type: 'string', description: 'Generated hash value' },
    { name: 'algorithm', type: 'string', description: 'Hash algorithm used' },
    { name: 'length', type: 'number', description: 'Hash length in bytes' }
  ]
}

// 2. Add to collection
export const CRYPTO_MODULE_INTERFACES = {
  CryptoHash: CRYPTO_HASH_INTERFACE
}

// 3. Reference in schema
{
  id: 'crypto-sha256',
  returnInterface: 'CryptoHash'
}

// 4. Register in service (add to loadModuleInterfaces)
const { CRYPTO_MODULE_INTERFACES } = await import('../schemas/modules/crypto.module.ts')
```

## 📋 **Advanced Interface Patterns**

### **Pattern 1: Nested Object Properties**

#### **Complex Response with Nested Data**
```typescript
export const USER_PROFILE_INTERFACE = {
  name: 'UserProfile',
  properties: [
    { name: 'id', type: 'string', description: 'User unique identifier' },
    { name: 'name', type: 'string', description: 'Full name' },
    { name: 'email', type: 'string', description: 'Email address' },
    { name: 'preferences', type: 'object', description: 'User preferences object' },
    { name: 'metadata', type: 'object', description: 'Additional user metadata' },
    { name: 'lastLogin', type: 'string', nullable: true, description: 'Last login timestamp' }
  ]
}
```

#### **API Response with Pagination**
```typescript
export const PAGINATED_RESPONSE_INTERFACE = {
  name: 'PaginatedResponse',
  properties: [
    { name: 'data', type: 'array', description: 'Array of result items' },
    { name: 'pagination', type: 'object', description: 'Pagination information' },
    { name: 'total', type: 'number', description: 'Total number of items' },
    { name: 'page', type: 'number', description: 'Current page number' },
    { name: 'pageSize', type: 'number', description: 'Items per page' },
    { name: 'hasNext', type: 'boolean', description: 'Whether next page exists' },
    { name: 'hasPrev', type: 'boolean', description: 'Whether previous page exists' }
  ]
}
```

### **Pattern 2: Error Handling Interfaces**

#### **Standard Error Response**
```typescript
export const ERROR_RESPONSE_INTERFACE = {
  name: 'ErrorResponse',
  properties: [
    { name: 'error', type: 'boolean', description: 'Always true for error responses' },
    { name: 'message', type: 'string', description: 'Human-readable error message' },
    { name: 'code', type: 'string', description: 'Error code for programmatic handling' },
    { name: 'details', type: 'object', nullable: true, description: 'Additional error details' },
    { name: 'timestamp', type: 'number', description: 'When error occurred' }
  ]
}
```

#### **Validation Error Response**
```typescript
export const VALIDATION_ERROR_INTERFACE = {
  name: 'ValidationError',
  properties: [
    { name: 'error', type: 'boolean', description: 'Always true for errors' },
    { name: 'message', type: 'string', description: 'Overall validation error message' },
    { name: 'fields', type: 'object', description: 'Field-specific validation errors' },
    { name: 'fieldCount', type: 'number', description: 'Number of fields with errors' }
  ]
}
```

### **Pattern 3: Processing Result Interfaces**

#### **File Processing Result**
```typescript
export const FILE_PROCESS_RESULT_INTERFACE = {
  name: 'FileProcessResult',
  properties: [
    { name: 'success', type: 'boolean', description: 'Whether processing succeeded' },
    { name: 'filename', type: 'string', description: 'Original filename' },
    { name: 'size', type: 'number', description: 'File size in bytes' },
    { name: 'processedSize', type: 'number', description: 'Processed size in bytes' },
    { name: 'format', type: 'string', description: 'File format detected' },
    { name: 'duration', type: 'number', description: 'Processing time in milliseconds' },
    { name: 'output', type: 'string', nullable: true, description: 'Processed file path or content' },
    { name: 'warnings', type: 'array', description: 'Array of warning messages' }
  ]
}
```

#### **Data Transformation Result**
```typescript
export const TRANSFORM_RESULT_INTERFACE = {
  name: 'TransformResult',
  properties: [
    { name: 'input', type: 'any', description: 'Original input data' },
    { name: 'output', type: 'any', description: 'Transformed output data' },
    { name: 'transformations', type: 'array', description: 'List of transformations applied' },
    { name: 'skipped', type: 'number', description: 'Number of items skipped' },
    { name: 'processed', type: 'number', description: 'Number of items processed' },
    { name: 'errors', type: 'array', description: 'Array of transformation errors' }
  ]
}
```

## 🔗 **Multiple Interfaces per Module**

### **Complete HTTP Module Example**
```typescript
// Multiple related interfaces in one module
export const HTTP_RESPONSE_INTERFACE = {
  name: 'HttpResponse',
  properties: [
    { name: 'statusCode', type: 'number', description: 'HTTP status code' },
    { name: 'headers', type: 'object', description: 'Response headers' },
    { name: 'body', type: 'any', description: 'Response body' }
  ]
}

export const HTTP_ERROR_INTERFACE = {
  name: 'HttpError',
  properties: [
    { name: 'statusCode', type: 'number', description: 'HTTP error status code' },
    { name: 'message', type: 'string', description: 'Error message' },
    { name: 'headers', type: 'object', nullable: true, description: 'Error response headers' }
  ]
}

export const HTTP_REQUEST_CONFIG_INTERFACE = {
  name: 'HttpRequestConfig',
  properties: [
    { name: 'url', type: 'string', description: 'Request URL' },
    { name: 'method', type: 'string', description: 'HTTP method' },
    { name: 'headers', type: 'object', optional: true, description: 'Request headers' },
    { name: 'timeout', type: 'number', optional: true, description: 'Request timeout in ms' }
  ]
}

// Collection with all interfaces
export const HTTP_MODULE_INTERFACES = {
  HttpResponse: HTTP_RESPONSE_INTERFACE,
  HttpError: HTTP_ERROR_INTERFACE,
  HttpRequestConfig: HTTP_REQUEST_CONFIG_INTERFACE
}
```

### **Schema Usage with Multiple Interfaces**
```typescript
export const HTTP_MODULE_SCHEMAS: UnifiedSchema[] = [
  {
    id: 'http-get',
    returnInterface: 'HttpResponse' // ← Success response
  },
  {
    id: 'http-post',
    returnInterface: 'HttpResponse' // ← Success response
  },
  {
    id: 'http-configure',
    returnInterface: 'HttpRequestConfig' // ← Different interface
  }
  // Note: Error handling typically done through exceptions,
  // not return interfaces, but HttpError could be used for
  // wrapped error responses
]
```

## 🎯 **Interface Naming Conventions**

### **Standard Naming Patterns**
```typescript
// ✅ GOOD: Clear, descriptive names
HttpResponse          // What it represents
DateParseResult      // Action + Result
ValidationError      // Type + Purpose
FileProcessResult    // Domain + Action + Result

// ❌ AVOID: Vague or generic names
Response            // Too generic
Result              // Too generic
Data                // Too vague
Object              // Not descriptive
```

### **Consistent Suffixes**
```typescript
// Response interfaces
HttpResponse
ApiResponse
ErrorResponse

// Result interfaces  
ParseResult
ProcessResult
TransformResult

// Error interfaces
ValidationError
NetworkError
ProcessingError

// Config interfaces
RequestConfig
ProcessConfig
ValidationConfig
```

## 🔧 **Interface Property Best Practices**

### **Property Naming**
```typescript
// ✅ GOOD: Clear, consistent property names
{
  name: 'statusCode',     // camelCase
  type: 'number',         // Specific type
  description: 'HTTP status code (200, 404, 500, etc.)' // Detailed description
}

// ❌ AVOID: Unclear or inconsistent names
{
  name: 'code',          // Too generic
  type: 'any',           // Too vague
  description: 'Code'    // Not helpful
}
```

### **Type Specifications**
```typescript
// ✅ SPECIFIC TYPES: Use specific types when possible
{ name: 'count', type: 'number', description: 'Number of items' }
{ name: 'isValid', type: 'boolean', description: 'Whether validation passed' }
{ name: 'items', type: 'array', description: 'Array of result items' }
{ name: 'metadata', type: 'object', description: 'Additional metadata' }

// ✅ GENERIC TYPES: Use 'any' only when truly dynamic
{ name: 'data', type: 'any', description: 'Dynamic response data' }
{ name: 'value', type: 'any', description: 'Value of any type' }
```

### **Nullability and Optionality**
```typescript
// ✅ CLEAR NULLABILITY: Specify when properties can be null
{ 
  name: 'error', 
  type: 'string', 
  nullable: true, 
  description: 'Error message if request failed, null if successful' 
}

// ✅ CLEAR OPTIONALITY: Specify when properties are optional
{ 
  name: 'metadata', 
  type: 'object', 
  optional: true, 
  description: 'Additional metadata (optional)' 
}

// ✅ BOTH: Can be both nullable and optional
{ 
  name: 'result', 
  type: 'any', 
  nullable: true, 
  optional: true, 
  description: 'Processing result (optional, null if not available)' 
}
```

## 📊 **Interface Documentation Standards**

### **Property Descriptions**
```typescript
// ✅ EXCELLENT: Detailed, helpful descriptions
{ 
  name: 'statusCode', 
  type: 'number', 
  description: 'HTTP status code (200=success, 404=not found, 500=server error)' 
}

// ✅ GOOD: Clear and informative
{ 
  name: 'timestamp', 
  type: 'number', 
  description: 'Unix timestamp when response was generated' 
}

// ❌ POOR: Vague or redundant
{ 
  name: 'data', 
  type: 'object', 
  description: 'Data object' // Not helpful!
}
```

### **Interface Documentation Comments**
```typescript
/**
 * HTTP Response Interface
 * 
 * Represents the standardized response from all HTTP operations.
 * Used by: http.get(), http.post(), http.put(), http.delete(), http.patch()
 * 
 * @example
 * const response = http.get("https://api.example.com/users")
 * console.log(response.statusCode) // 200
 * console.log(response.error)      // null (if successful)
 * console.log(response.response)   // { users: [...] }
 */
export const HTTP_RESPONSE_INTERFACE = {
  name: 'HttpResponse',
  properties: [...]
}
```

---

**Next: Read [User Utilities](./05-user-utilities.md) to learn about dynamic interface registration.**
