# Modular Prisma Services

This directory contains a modular approach to Prisma operations, breaking down the previously large `PrismaService` into smaller, focused modules for better maintainability and testing.

## Architecture Overview

The system is composed of several specialized modules:

```
prisma/
├── prisma-service.ts     # Main orchestrator service
├── types.ts             # Shared type definitions
├── model-utils.ts       # Model name conversions and utilities
├── data-cleaner.ts      # Data validation and cleaning
├── branch-resolver.ts   # Branch resolution and context handling
├── query-builder.ts     # Query building utilities
├── junction-handler.ts  # Junction table operations
├── relationship-processor.ts # Relationship payload processing
├── index.ts            # Main export file
└── README.md           # This documentation
```

## Main Components

### 1. PrismaService (prisma-service.ts)
The main orchestrator that coordinates all operations:
- CREATE operations with branch support
- READ operations with branch fallback
- UPDATE operations with Copy-on-Write
- DELETE operations with proper cleanup

### 2. Junction Handler (junction-handler.ts)
Handles junction table operations:
- Junction table detection
- Data transformation using Junction Factory
- Junction record creation
- Junction data extraction

### 3. Branch Resolver (branch-resolver.ts)
Manages branch context and resolution:
- Branch ID resolution
- Branch context validation
- Default branch handling
- Branch existence checks

### 4. Query Builder (query-builder.ts)
Builds complex queries:
- Base where clauses
- Include clauses based on schema
- Branch-specific where clauses
- Exclusion criteria for fallback queries

### 5. Relationship Processor (relationship-processor.ts)
Handles relationship operations:
- Many-to-many relationships
- One-to-many relationships
- One-to-one relationships
- Nested write operations

### 6. Data Cleaner (data-cleaner.ts)
Validates and cleans data:
- Removes undefined values
- Adds audit fields
- Prepares Copy-on-Write data
- Prepares update data

### 7. Model Utils (model-utils.ts)
Utility functions for model operations:
- Model name conversions
- Database key mappings
- Original field name resolution

## Usage Examples

### Basic Usage
```typescript
import { PrismaService } from '@/lib/server/prisma';

// Initialize with Prisma client
const prismaService = new PrismaService(prismaClient);

// Create a resource
const result = await prismaService.create(schema, data, context);

// Find by ID with branch fallback
const item = await prismaService.findById(schema, id, context);

// Find many with branch fallback
const results = await prismaService.findMany(schema, filters, options, context);

// Update with Copy-on-Write support
const updated = await prismaService.update(schema, id, data, context);

// Delete
await prismaService.delete(schema, id, context);
```

### Using Individual Modules
```typescript
import { 
  isJunctionTable, 
  transformJunctionDataForPrisma,
  buildBaseWhere,
  processRelationships 
} from '@/lib/server/prisma';

// Check if table is a junction table
const isJunction = isJunctionTable('NodeProcess');

// Transform junction data
const transformedData = transformJunctionDataForPrisma(data, 'NodeProcess');

// Build query where clause
const whereClause = buildBaseWhere(schema, context, filters);

// Process relationships
const relationshipData = processRelationships(relationships, schemaRelationships);
```

## Key Features

### 1. Branch-Aware Operations
- Automatic branch fallback for read operations
- Copy-on-Write for update operations
- Branch-specific data isolation

### 2. Junction Table Support
- Automatic junction table detection
- Factory-based data transformation
- Support for complex junction relationships

### 3. Relationship Handling
- Standard relationship payload processing
- Support for nested writes
- Junction table attributes

### 4. Type Safety
- Full TypeScript support
- Proper type inference
- Runtime type validation

### 5. Performance Optimizations
- Efficient branch fallback queries
- Optimized include clauses
- Minimal data transformation

## Testing

Each module can be tested independently:

```typescript
// Test individual functions
import { cleanData, addAuditFields } from '@/lib/server/prisma';

// Test the main service
import { PrismaService } from '@/lib/server/prisma';
const service = new PrismaService(mockPrismaClient);
```

## Migration from Old System

If you're migrating from the old monolithic `PrismaService`:

1. Update imports:
   ```typescript
   // Old
   import { PrismaService } from '@/lib/server/action-system/prisma-service';
   
   // New
   import { PrismaService } from '@/lib/server/prisma';
   ```

2. The API remains the same, so no code changes needed for basic usage.

3. If you were using internal methods, those are now available as separate functions:
   ```typescript
   // Old
   prismaService.buildInclude(schema)
   
   // New
   import { buildInclude } from '@/lib/server/prisma';
   buildInclude(schema)
   ```

## Benefits

- **Maintainability**: Smaller, focused modules are easier to maintain
- **Testability**: Each module can be tested independently
- **Reusability**: Individual functions can be reused in other contexts
- **Performance**: Only load what you need
- **Clarity**: Clear separation of concerns
- **Extensibility**: Easy to add new functionality to specific modules 