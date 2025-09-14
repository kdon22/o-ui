# Server Integration

This document covers the server-side integration of the Action System, including API endpoints, routing, handlers, and backend architecture.

## Overview

The Action System backend is built around:
- **Single API Endpoint**: All actions route through `/api/workspaces/current/actions`
- **ActionRouter**: Intelligent routing to appropriate handlers
- **PrismaService**: Branch-aware database operations with Copy-on-Write
- **Modular Handlers**: Separate handlers for each action type
- **Branch Context**: Git-like versioning with workspace isolation

## API Endpoint Structure

### Single Endpoint Design
```typescript
// /api/workspaces/current/actions/route.ts
POST /api/workspaces/current/actions

// Request Format
{
  "actionType": "NODE_READ" | "PROCESS_CREATE" | "RULE_UPDATE" | etc.,
  "payload": { /* action-specific data */ },
  "context": {
    "branchName": "feature-branch",
    "tenantId": "tenant-123"
  }
}

// Response Format
{
  "success": true,
  "data": { /* action result */ },
  "cached": false,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Request Context
Every request includes:
```typescript
interface ActionContext {
  branchName: string;        // Git-like branch for workspace isolation
  tenantId: string;         // Multi-tenant isolation
  userId?: string;          // User context for permissions
  workspaceId?: string;     // Workspace scope
}
```

## ActionRouter Architecture

### Router Implementation
```typescript
// lib/server/action-system/action-router.ts
export class ActionRouter {
  private handlers = new Map<string, ActionHandler>();
  private prismaService: PrismaService;

  async routeAction(request: ActionRequest): Promise<ActionResponse> {
    const { actionType, payload, context } = request;
    
    // Get appropriate handler
    const handler = this.handlers.get(actionType);
    if (!handler) {
      throw new ActionError(`Unknown action type: ${actionType}`);
    }

    // Execute with context
    return await handler.execute(payload, context);
  }
}
```

### Handler Registration
```typescript
// Handlers are auto-registered from ResourceRegistry
const router = new ActionRouter(prismaService);

// Auto-registration from schemas
Object.entries(resourceRegistry.resources).forEach(([key, schema]) => {
  schema.actions.forEach(action => {
    const handler = createHandler(action.type, schema);
    router.registerHandler(action.type, handler);
  });
});
```

## Action Handlers

### Base Handler Pattern
```typescript
// lib/server/action-system/handlers/base-handler.ts
export abstract class BaseActionHandler {
  constructor(
    protected prismaService: PrismaService,
    protected resourceSchema: ResourceSchema
  ) {}

  abstract execute(payload: any, context: ActionContext): Promise<any>;

  protected async validatePermissions(context: ActionContext): Promise<void> {
    // Permission validation logic
  }

  protected async auditLog(action: string, context: ActionContext): Promise<void> {
    // Audit logging
  }
}
```

### Create Handler
```typescript
// lib/server/action-system/handlers/create-handler.ts
export class CreateHandler extends BaseActionHandler {
  async execute(payload: CreatePayload, context: ActionContext): Promise<any> {
    await this.validatePermissions(context);
    
    // Generate ID and prepare data
    const id = generateId();
    const data = {
      ...payload.data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create in database with branch context
    const result = await this.prismaService.create(
      this.resourceSchema.table,
      data,
      context
    );

    await this.auditLog('CREATE', context);
    return result;
  }
}
```

### Update Handler (Copy-on-Write)
```typescript
// lib/server/action-system/handlers/update-handler.ts
export class UpdateHandler extends BaseActionHandler {
  async execute(payload: UpdatePayload, context: ActionContext): Promise<any> {
    const { id, data } = payload;
    
    // Copy-on-Write: Create branch-specific copy if needed
    const result = await this.prismaService.updateWithCoW(
      this.resourceSchema.table,
      id,
      data,
      context
    );

    return result;
  }
}
```

### Read Handler (Branch Fallback)
```typescript
// lib/server/action-system/handlers/read-handler.ts
export class ReadHandler extends BaseActionHandler {
  async execute(payload: ReadPayload, context: ActionContext): Promise<any> {
    const { filters, includes } = payload;
    
    // Try branch-specific read first, fallback to main
    const result = await this.prismaService.readWithFallback(
      this.resourceSchema.table,
      { ...filters, includes },
      context
    );

    return result;
  }
}
```

## PrismaService Integration

### Branch-Aware Operations
```typescript
// lib/server/action-system/prisma-service.ts
export class PrismaService {
  constructor(private prisma: PrismaClient) {}

  async readWithFallback(
    table: string,
    query: any,
    context: ActionContext
  ): Promise<any> {
    // 1. Try branch-specific read
    const branchResult = await this.readFromBranch(table, query, context);
    if (branchResult.length > 0) {
      return branchResult;
    }

    // 2. Fallback to main branch
    const mainContext = { ...context, branchName: 'main' };
    return await this.readFromBranch(table, query, mainContext);
  }

  async updateWithCoW(
    table: string,
    id: string,
    data: any,
    context: ActionContext
  ): Promise<any> {
    // Copy-on-Write logic
    const exists = await this.existsInBranch(table, id, context);
    
    if (!exists) {
      // Create branch-specific copy
      const original = await this.readFromMain(table, id);
      const branchCopy = {
        ...original,
        ...data,
        branchName: context.branchName,
        originalId: id,
        updatedAt: new Date()
      };
      
      return await this.create(table, branchCopy, context);
    }

    // Update existing branch version
    return await this.update(table, id, data, context);
  }
}
```

### Junction Table Handling
```typescript
// Special handling for many-to-many relationships
async handleJunctionOperation(
  operation: 'connect' | 'disconnect',
  resourceType: string,
  resourceId: string,
  relatedType: string,
  relatedIds: string[],
  context: ActionContext
): Promise<void> {
  const junctionTable = `${resourceType}_${relatedType}`;
  
  if (operation === 'connect') {
    const connections = relatedIds.map(relatedId => ({
      [`${resourceType}Id`]: resourceId,
      [`${relatedType}Id`]: relatedId,
      branchName: context.branchName,
      createdAt: new Date()
    }));
    
    await this.prisma[junctionTable].createMany({
      data: connections,
      skipDuplicates: true
    });
  } else {
    await this.prisma[junctionTable].deleteMany({
      where: {
        [`${resourceType}Id`]: resourceId,
        [`${relatedType}Id`]: { in: relatedIds },
        branchName: context.branchName
      }
    });
  }
}
```

## Custom Handlers

### Creating Custom Handlers
```typescript
// lib/server/action-system/handlers/custom-node-handler.ts
export class CustomNodeHandler extends BaseActionHandler {
  async execute(payload: any, context: ActionContext): Promise<any> {
    // Custom business logic for nodes
    const nodeData = payload.data;
    
    // Validate node hierarchy
    await this.validateNodeHierarchy(nodeData, context);
    
    // Create node with custom processing
    const result = await this.prismaService.create(
      'Node',
      {
        ...nodeData,
        status: 'active',
        processedAt: new Date()
      },
      context
    );

    // Trigger dependent operations
    await this.updateRelatedProcesses(result.id, context);
    
    return result;
  }

  private async validateNodeHierarchy(nodeData: any, context: ActionContext): Promise<void> {
    // Custom validation logic
  }

  private async updateRelatedProcesses(nodeId: string, context: ActionContext): Promise<void> {
    // Custom related operations
  }
}
```

### Handler Registration
```typescript
// Register custom handlers
actionRouter.registerHandler('NODE_CREATE_CUSTOM', new CustomNodeHandler(prismaService, nodeSchema));
```

## Error Handling

### Error Response Format
```typescript
// Standardized error responses
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR" | "NOT_FOUND" | "PERMISSION_DENIED",
    "message": "Human readable error message",
    "details": {
      "field": "fieldName",
      "value": "invalidValue",
      "constraint": "required"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Classes
```typescript
// lib/server/action-system/errors.ts
export class ActionError extends Error {
  constructor(
    message: string,
    public code: string = 'GENERIC_ERROR',
    public details?: any
  ) {
    super(message);
  }
}

export class ValidationError extends ActionError {
  constructor(message: string, field: string, value: any) {
    super(message, 'VALIDATION_ERROR', { field, value });
  }
}

export class PermissionError extends ActionError {
  constructor(message: string = 'Permission denied') {
    super(message, 'PERMISSION_DENIED');
  }
}
```

### Error Middleware
```typescript
// Global error handling in API route
try {
  const result = await actionRouter.routeAction(request);
  return NextResponse.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString()
  });
} catch (error) {
  if (error instanceof ActionError) {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
  
  // Generic error handling
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    },
    timestamp: new Date().toISOString()
  }, { status: 500 });
}
```

## Performance Considerations

### Database Optimization
```typescript
// Optimized queries with proper indexing
const result = await prisma.node.findMany({
  where: {
    branchName: context.branchName,
    status: 'active'
  },
  include: {
    processes: {
      where: { status: 'active' }
    },
    rules: {
      select: { id: true, name: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 50
});
```

### Connection Pooling
```typescript
// Prisma connection configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn'],
  errorFormat: 'pretty'
});

// Connection pool settings in environment
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=20&pool_timeout=20"
```

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
export class CachedPrismaService extends PrismaService {
  constructor(prisma: PrismaClient, private redis: RedisClient) {
    super(prisma);
  }

  async readWithFallback(table: string, query: any, context: ActionContext): Promise<any> {
    const cacheKey = `${table}:${JSON.stringify(query)}:${context.branchName}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to database
    const result = await super.readWithFallback(table, query, context);
    
    // Cache result
    await this.redis.setex(cacheKey, 300, JSON.stringify(result)); // 5min TTL
    
    return result;
  }
}
```

## Monitoring & Logging

### Request Logging
```typescript
// Structured logging for all actions
export class ActionLogger {
  static logRequest(actionType: string, context: ActionContext, duration: number): void {
    console.log(JSON.stringify({
      type: 'action_request',
      actionType,
      branchName: context.branchName,
      tenantId: context.tenantId,
      userId: context.userId,
      duration,
      timestamp: new Date().toISOString()
    }));
  }

  static logError(actionType: string, error: Error, context: ActionContext): void {
    console.error(JSON.stringify({
      type: 'action_error',
      actionType,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    }));
  }
}
```

### Performance Metrics
```typescript
// Performance tracking
export class ActionMetrics {
  static async trackAction<T>(
    actionType: string,
    context: ActionContext,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      ActionLogger.logRequest(actionType, context, duration);
      
      return result;
    } catch (error) {
      ActionLogger.logError(actionType, error, context);
      throw error;
    }
  }
}
```

## Testing Strategy

### Handler Testing
```typescript
// test/handlers/create-handler.test.ts
describe('CreateHandler', () => {
  let handler: CreateHandler;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockPrismaService = createMockPrismaService();
    handler = new CreateHandler(mockPrismaService, nodeSchema);
  });

  it('should create a new resource', async () => {
    const payload = { data: { name: 'Test Node' } };
    const context = { branchName: 'main', tenantId: 'test' };

    const result = await handler.execute(payload, context);

    expect(mockPrismaService.create).toHaveBeenCalledWith(
      'Node',
      expect.objectContaining({ name: 'Test Node' }),
      context
    );
    expect(result.id).toBeDefined();
  });
});
```

### Integration Testing
```typescript
// test/integration/action-router.test.ts
describe('ActionRouter Integration', () => {
  let router: ActionRouter;
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    router = new ActionRouter(new PrismaService(testDb.client));
  });

  it('should handle full CRUD cycle', async () => {
    // Create
    const createResult = await router.routeAction({
      actionType: 'NODE_CREATE',
      payload: { data: { name: 'Test Node' } },
      context: { branchName: 'test', tenantId: 'test' }
    });

    // Read
    const readResult = await router.routeAction({
      actionType: 'NODE_READ',
      payload: { filters: { id: createResult.id } },
      context: { branchName: 'test', tenantId: 'test' }
    });

    expect(readResult.data[0].name).toBe('Test Node');
  });
});
```

## Deployment Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your-jwt-secret"

# Performance
NODE_ENV="production"
MAX_CONNECTIONS="20"
QUERY_TIMEOUT="30000"
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

This server integration provides a robust, scalable backend for the Action System with proper error handling, performance optimization, and monitoring capabilities. 