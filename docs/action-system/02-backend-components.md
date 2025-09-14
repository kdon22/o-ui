# Backend Components - Action System Architecture

## 🎯 **Overview**

This document covers all backend components of the Unified Action System, including the API endpoint, ActionRouter, operation handlers, and database services.

## 🌐 **API Endpoint - Single Entry Point**

### **Location**: `o-ui/src/app/api/workspaces/current/actions/route.ts`

The main API endpoint that handles all action requests from the frontend ActionClient.

### **Endpoint**: `POST /api/workspaces/current/actions`

### **Request Format**
```typescript
interface ActionRequest {
  action: string;                    // e.g., 'process.create', 'node.list'
  data?: Record<string, any>;        // Entity data or query parameters
  options?: QueryOptions;            // Query options (limit, offset, etc.)
  context?: any;                     // Additional context data
  branchContext?: BranchContext;     // Branch and tenant information
}
```

### **Response Format**
```typescript
interface ActionResponse {
  success: boolean;
  data?: any;                        // Response data
  error?: string;                    // Error message (if success: false)
  timestamp: number;                 // Response timestamp
  action?: string;                   // Original action
  executionTime?: number;            // Execution time in ms
  junctions?: Record<string, any[]>; // Junction data (for list operations)
}
```

### **Request Processing Flow**

```typescript
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Extract and validate request data
    const body = await request.json();
    const actionRequest: ActionRequest = {
      action: body.action,
      data: body.data,
      options: body.options,
      context: body.context,
      branchContext: body.branchContext
    };

    // 2. Extract authentication and context
    const session = await getServerSession(authOptions);
    const tenantId = request.headers.get('x-tenant-id') || session?.user?.tenantId;
    const userId = session?.user?.id || 'system';
    
    // 3. Resolve branch context
    let branchId = actionRequest.branchContext?.currentBranchId;
    let defaultBranchId = actionRequest.branchContext?.defaultBranchId;
    
    // Fallback to session or database default
    if (!branchId || !defaultBranchId) {
      const defaultBranch = await prisma.branch.findFirst({
        where: { tenantId, isDefault: true }
      });
      const fallbackBranchId = defaultBranch?.name || 'main';
      branchId = branchId || fallbackBranchId;
      defaultBranchId = defaultBranchId || fallbackBranchId;
    }

    // 4. Create execution context
    const executionContext = {
      userId,
      tenantId,
      branchId,
      defaultBranchId,
      session
    };

    // 5. Route and execute action
    const actionRouter = getActionRouter();
    const result = await actionRouter.executeAction(
      actionRequest,
      executionContext
    );

    // 6. Return standardized response
    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: Date.now(),
      action: actionRequest.action,
      executionTime: Date.now() - startTime,
      junctions: result.junctions
    });

  } catch (error: any) {
    console.error(`[ActionHandler] Action failed: ${error.message}`);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: Date.now(),
      executionTime: Date.now() - startTime
    }, { status: 500 });
  }
}
```

### **Authentication & Authorization**

The API endpoint handles authentication through NextAuth sessions:

```typescript
// Extract session and user context
const session = await getServerSession(authOptions);
const tenantId = request.headers.get('x-tenant-id') || session?.user?.tenantId;
const userId = session?.user?.id || 'system';

// Validate required context
if (!tenantId) {
  return NextResponse.json({
    success: false,
    error: 'Tenant ID is required'
  }, { status: 400 });
}
```

### **Branch Context Resolution**

The API resolves branch context from multiple sources:

1. **Request branchContext**: Explicit branch context in request
2. **Session branchContext**: User's current branch from session
3. **Database fallback**: Default branch from database

```typescript
// Priority order: Request > Session > Database
let branchId = actionRequest.branchContext?.currentBranchId;
if (!branchId && session?.user?.branchContext) {
  branchId = session.user.branchContext.currentBranchId;
}
if (!branchId) {
  const defaultBranch = await prisma.branch.findFirst({
    where: { tenantId, isDefault: true }
  });
  branchId = defaultBranch?.name || 'main';
}
```

## 🎯 **ActionRouter - Request Orchestration**

### **Location**: `o-ui/src/lib/server/action-system/core/action-router-core.ts`

The ActionRouter is the central orchestrator that parses actions and routes them to appropriate handlers.

### **Core Responsibilities**
- Parse action strings (e.g., 'process.create' → { resourceType: 'process', operation: 'create' })
- Validate resource schemas exist
- Route to appropriate operation handlers
- Provide action metadata and validation

### **Action Parsing**

```typescript
// Parse action string into components
function parseAction(action: string): ParsedAction | null {
  const parts = action.split('.');
  if (parts.length !== 2) return null;
  
  return {
    resourceType: parts[0],  // e.g., 'process'
    operation: parts[1]      // e.g., 'create'
  };
}

// Example usage
const parsed = parseAction('process.create');
// Result: { resourceType: 'process', operation: 'create' }
```

### **Execution Flow**

```typescript
export class ActionRouterCore {
  async executeAction(
    request: ActionRequest,
    context: ExecutionContext
  ): Promise<ActionResult> {
    
    // 1. Parse action to get resource type and operation
    const parsedAction = parseAction(request.action);
    if (!parsedAction) {
      throw new Error(`Invalid action format: ${request.action}`);
    }

    // 2. Get resource schema
    const schema = getResourceSchema(parsedAction.resourceType);
    if (!schema) {
      throw new Error(`Resource not found: ${parsedAction.resourceType}`);
    }

    // 3. Get appropriate handler
    const handler = this.handlerFactory.getHandler(parsedAction.operation);
    if (!handler) {
      throw new Error(`Unsupported operation: ${parsedAction.operation}`);
    }

    // 4. Execute the handler
    const result = await handler.execute(
      parsedAction,
      request.data,
      request.options,
      context,
      schema
    );

    return result;
  }
}
```

### **Supported Operations**

The ActionRouter supports these standard operations:

- **create**: Create new entities
- **read**: Read single entities by ID
- **update**: Update existing entities
- **delete**: Delete entities
- **list**: List entities with filtering and pagination

### **Handler Factory**

```typescript
export class ActionHandlerFactory {
  private handlers: Map<string, ActionHandler>;

  constructor(prismaService: PrismaService) {
    this.handlers = new Map([
      ['create', new CreateHandler(prismaService)],
      ['read', new ReadHandler(prismaService)],
      ['update', new UpdateHandler(prismaService)],
      ['delete', new DeleteHandler(prismaService)],
      ['list', new ListHandler(prismaService)]
    ]);
  }

  getHandler(operation: string): ActionHandler | undefined {
    return this.handlers.get(operation);
  }

  getSupportedOperations(): string[] {
    return Array.from(this.handlers.keys());
  }
}
```

## 🔧 **Operation Handlers**

### **Base Handler Interface**

```typescript
interface ActionHandler {
  execute(
    parsedAction: ParsedAction,
    data: any,
    options: any,
    context: ExecutionContext,
    schema: ResourceSchema
  ): Promise<ActionResult>;
}
```

### **CreateHandler - Entity Creation**

**Location**: `o-ui/src/lib/server/action-system/handlers/create-handler.ts`

Handles entity creation with branch-aware operations and junction support.

```typescript
export class CreateHandler {
  async execute(
    parsedAction: ParsedAction,
    data: any,
    options: any,
    context: ExecutionContext,
    schema: ResourceSchema
  ): Promise<ActionResult> {
    
    // 1. Validate and clean input data
    const cleanData = this.validateAndCleanData(data, schema);
    
    // 2. Add context fields
    const entityData = {
      ...cleanData,
      id: generateId(),
      tenantId: context.tenantId,
      branchId: context.branchId,
      createdBy: context.userId,
      updatedBy: context.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 3. Create entity using PrismaService
    const result = await this.prismaService.create(
      schema.modelName,
      entityData,
      {
        tenantId: context.tenantId,
        branchId: context.branchId,
        defaultBranchId: context.defaultBranchId
      }
    );

    // 4. Handle junction creation (if needed)
    // Note: Junction creation is handled by frontend contextual system
    // Backend focuses on individual entity operations

    return {
      success: true,
      data: result,
      timestamp: Date.now()
    };
  }
}
```

### **ReadHandler - Single Entity Retrieval**

**Location**: `o-ui/src/lib/server/action-system/handlers/read-handler.ts`

Handles reading single entities with branch fallback logic.

```typescript
export class ReadHandler {
  async execute(
    parsedAction: ParsedAction,
    data: any,
    options: any,
    context: ExecutionContext,
    schema: ResourceSchema
  ): Promise<ActionResult> {
    
    const { id } = data;
    if (!id) {
      throw new Error('ID is required for read operations');
    }

    // Read with branch fallback
    const result = await this.prismaService.findById(
      schema.modelName,
      id,
      {
        tenantId: context.tenantId,
        branchId: context.branchId,
        defaultBranchId: context.defaultBranchId
      }
    );

    if (!result) {
      throw new Error(`${schema.modelName} not found with ID: ${id}`);
    }

    return {
      success: true,
      data: result,
      timestamp: Date.now()
    };
  }
}
```

### **ListHandler - Entity Listing with Junctions**

**Location**: `o-ui/src/lib/server/action-system/handlers/list-handler.ts`

Handles entity listing with filtering, pagination, and junction data extraction.

```typescript
export class ListHandler {
  async execute(
    parsedAction: ParsedAction,
    data: any,
    options: QueryOptions,
    context: ExecutionContext,
    schema: ResourceSchema
  ): Promise<ActionResult> {
    
    // 1. Build query with filters and branch context
    const queryOptions = {
      ...options,
      tenantId: context.tenantId,
      branchId: context.branchId,
      defaultBranchId: context.defaultBranchId
    };

    // 2. Execute query with branch fallback
    const results = await this.prismaService.findMany(
      schema.modelName,
      data,
      queryOptions
    );

    // 3. Extract junction data from relationships
    const junctions = this.extractJunctionData(schema, results);

    return {
      success: true,
      data: results,
      junctions,
      timestamp: Date.now()
    };
  }

  private extractJunctionData(schema: ResourceSchema, items: any[]): Record<string, any[]> {
    const junctions: Record<string, any[]> = {};
    
    // Extract junction records from relationship fields
    if (schema.relationships) {
      Object.entries(schema.relationships).forEach(([relationName, config]) => {
        if (config.type === 'many-to-many' && config.junction) {
          const junctionData: any[] = [];
          
          items.forEach(item => {
            const relationData = item[relationName];
            if (Array.isArray(relationData)) {
              junctionData.push(...relationData);
            }
          });
          
          if (junctionData.length > 0) {
            junctions[config.junction.tableName] = junctionData;
          }
        }
      });
    }
    
    return junctions;
  }
}
```

### **UpdateHandler - Entity Updates with Copy-on-Write**

**Location**: `o-ui/src/lib/server/action-system/handlers/update-handler.ts`

Handles entity updates with branch-aware copy-on-write semantics.

```typescript
export class UpdateHandler {
  async execute(
    parsedAction: ParsedAction,
    data: any,
    options: any,
    context: ExecutionContext,
    schema: ResourceSchema
  ): Promise<ActionResult> {
    
    const { id, ...updateData } = data;
    if (!id) {
      throw new Error('ID is required for update operations');
    }

    // 1. Find existing entity
    const existingEntity = await this.prismaService.findById(
      schema.modelName,
      id,
      {
        tenantId: context.tenantId,
        branchId: context.branchId,
        defaultBranchId: context.defaultBranchId
      }
    );

    if (!existingEntity) {
      throw new Error(`${schema.modelName} not found with ID: ${id}`);
    }

    // 2. Determine update strategy
    const isCurrentBranch = existingEntity.branchId === context.branchId;
    
    let result;
    if (isCurrentBranch) {
      // In-place update
      result = await this.prismaService.update(
        schema.modelName,
        id,
        {
          ...updateData,
          updatedBy: context.userId,
          updatedAt: new Date().toISOString()
        },
        {
          tenantId: context.tenantId,
          branchId: context.branchId,
          defaultBranchId: context.defaultBranchId
        }
      );
    } else {
      // Copy-on-write: Create new version on current branch
      const newEntityData = {
        ...existingEntity,
        ...updateData,
        id: generateId(),
        branchId: context.branchId,
        originalId: existingEntity.id,
        updatedBy: context.userId,
        updatedAt: new Date().toISOString(),
        version: (existingEntity.version || 0) + 1
      };

      result = await this.prismaService.create(
        schema.modelName,
        newEntityData,
        {
          tenantId: context.tenantId,
          branchId: context.branchId,
          defaultBranchId: context.defaultBranchId
        }
      );
    }

    return {
      success: true,
      data: result,
      timestamp: Date.now()
    };
  }
}
```

### **DeleteHandler - Entity Deletion**

**Location**: `o-ui/src/lib/server/action-system/handlers/delete-handler.ts`

Handles entity deletion with branch-aware operations.

```typescript
export class DeleteHandler {
  async execute(
    parsedAction: ParsedAction,
    data: any,
    options: any,
    context: ExecutionContext,
    schema: ResourceSchema
  ): Promise<ActionResult> {
    
    const { id } = data;
    if (!id) {
      throw new Error('ID is required for delete operations');
    }

    // Delete entity with branch context
    const result = await this.prismaService.delete(
      schema.modelName,
      id,
      {
        tenantId: context.tenantId,
        branchId: context.branchId,
        defaultBranchId: context.defaultBranchId
      }
    );

    return {
      success: true,
      data: result,
      timestamp: Date.now()
    };
  }
}
```

## 🗄️ **PrismaService - Database Operations**

### **Location**: `o-ui/src/lib/server/prisma/prisma-service.ts`

The PrismaService handles all database operations with branch-aware context and tenant isolation.

### **Core Features**
- **Branch Fallback**: Reads from current branch, falls back to default branch
- **Copy-on-Write**: Creates new versions when updating inherited entities
- **Tenant Isolation**: All operations scoped to tenant
- **Transaction Support**: Atomic operations for complex updates

### **Branch-Aware Read Operations**

```typescript
export class PrismaService {
  async findById(
    modelName: string,
    id: string,
    context: BranchContext
  ): Promise<any | null> {
    
    const model = this.getModel(modelName);
    
    // 1. Try current branch first
    let result = await model.findFirst({
      where: {
        id,
        tenantId: context.tenantId,
        branchId: context.branchId
      }
    });

    // 2. Fallback to default branch if not found and different branch
    if (!result && context.branchId !== context.defaultBranchId) {
      result = await model.findFirst({
        where: {
          id,
          tenantId: context.tenantId,
          branchId: context.defaultBranchId
        }
      });
    }

    return result;
  }

  async findMany(
    modelName: string,
    filters: any,
    options: QueryOptions & BranchContext
  ): Promise<any[]> {
    
    const model = this.getModel(modelName);
    
    // Build where clause with branch context
    const where = {
      ...filters,
      tenantId: options.tenantId,
      OR: [
        { branchId: options.branchId },
        ...(options.branchId !== options.defaultBranchId 
          ? [{ branchId: options.defaultBranchId }] 
          : []
        )
      ]
    };

    const results = await model.findMany({
      where,
      take: options.limit,
      skip: options.offset,
      orderBy: options.orderBy ? { [options.orderBy]: options.direction || 'asc' } : undefined
    });

    // Remove duplicates (current branch takes precedence)
    return this.deduplicateByOriginalId(results);
  }
}
```

### **Branch-Aware Write Operations**

```typescript
export class PrismaService {
  async create(
    modelName: string,
    data: any,
    context: BranchContext
  ): Promise<any> {
    
    const model = this.getModel(modelName);
    
    const entityData = {
      ...data,
      tenantId: context.tenantId,
      branchId: context.branchId
    };

    return model.create({ data: entityData });
  }

  async update(
    modelName: string,
    id: string,
    data: any,
    context: BranchContext
  ): Promise<any> {
    
    const model = this.getModel(modelName);
    
    return model.update({
      where: {
        id,
        tenantId: context.tenantId,
        branchId: context.branchId
      },
      data
    });
  }

  async delete(
    modelName: string,
    id: string,
    context: BranchContext
  ): Promise<any> {
    
    const model = this.getModel(modelName);
    
    return model.delete({
      where: {
        id,
        tenantId: context.tenantId,
        branchId: context.branchId
      }
    });
  }
}
```

### **Transaction Support**

```typescript
export class PrismaService {
  async executeTransaction<T>(
    operations: (tx: any) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(operations);
  }

  // Example: Complex operation with multiple entities
  async createWithRelationships(
    mainEntity: any,
    relationships: any[],
    context: BranchContext
  ): Promise<any> {
    
    return this.executeTransaction(async (tx) => {
      // Create main entity
      const created = await tx[mainEntity.modelName].create({
        data: {
          ...mainEntity.data,
          tenantId: context.tenantId,
          branchId: context.branchId
        }
      });

      // Create relationships
      for (const rel of relationships) {
        await tx[rel.modelName].create({
          data: {
            ...rel.data,
            [rel.foreignKey]: created.id,
            tenantId: context.tenantId,
            branchId: context.branchId
          }
        });
      }

      return created;
    });
  }
}
```

## 🔄 **Request Flow Summary**

1. **API Endpoint** receives POST request to `/api/workspaces/current/actions`
2. **Authentication** extracts user session and tenant context
3. **Branch Resolution** determines current and default branch IDs
4. **ActionRouter** parses action and routes to appropriate handler
5. **Handler** processes the specific operation (create, read, update, delete, list)
6. **PrismaService** executes database operations with branch context
7. **Response** returns standardized ActionResponse with data and metadata

## 🎯 **Error Handling**

### **Standardized Error Responses**

```typescript
// Validation Error
return NextResponse.json({
  success: false,
  error: 'Validation failed: name is required',
  timestamp: Date.now(),
  action: request.action
}, { status: 400 });

// Not Found Error
return NextResponse.json({
  success: false,
  error: 'Process not found with ID: process-123',
  timestamp: Date.now(),
  action: request.action
}, { status: 404 });

// Server Error
return NextResponse.json({
  success: false,
  error: 'Internal server error',
  timestamp: Date.now(),
  action: request.action
}, { status: 500 });
```

### **Error Categories**

- **400 Bad Request**: Invalid action format, missing required fields
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Entity or resource not found
- **409 Conflict**: Concurrent modification conflicts
- **500 Internal Server Error**: Database errors, system failures

## 🔧 **Configuration & Environment**

### **Environment Variables**

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Logging
LOG_LEVEL="info"
```

### **Prisma Configuration**

```typescript
// Global Prisma client with singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty'
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

## 🎯 **Performance Considerations**

### **Database Optimization**
- Proper indexing on tenant, branch, and entity IDs
- Query optimization for branch fallback operations
- Connection pooling for high concurrency

### **Caching Strategy**
- ActionRouter singleton to prevent re-initialization
- Prisma client reuse across requests
- Schema caching for repeated lookups

### **Monitoring & Logging**
- Execution time tracking for all operations
- Detailed logging for debugging and monitoring
- Error tracking and alerting

## 🔗 **Related Documentation**

- **[Frontend Components](./01-frontend-components.md)** - UI integration with backend
- **[Junction System](./03-junction-system.md)** - Automatic relationship creation
- **[Schema System](./06-schema-system.md)** - Resource schema definitions
- **[Branch System](./07-branch-system.md)** - Workspace branching and CoW