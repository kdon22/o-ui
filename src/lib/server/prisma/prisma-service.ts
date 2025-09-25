/**
 * Prisma Service - Slim Orchestrator
 * 
 * This service acts as a lightweight coordinator that delegates operations to
 * focused, specialized services. It maintains the same API interface while
 * internally organizing code into maintainable, single-responsibility services.
 * 
 * Architecture:
 * - CreateOperationsService: Handles all CREATE operations
 * - QueryOperationsService: Handles findById and findMany operations  
 * - UpdateOperationsService: Handles UPDATE and updateMany operations
 * - DeleteOperationsService: Handles DELETE operations
 * - NodeHierarchyService: Specialized Node hierarchy calculations
 * - ChangeTrackingService: Version history and audit trails
 */

import type { ResourceSchema } from '@/lib/resource-system/schemas';
import type { 
  PrismaServiceContext,
  QueryFilters,
  QueryOptions,
  QueryResult 
} from './core/types';

// Import focused operation services
import { CreateOperationsService } from './operations/create-operations';
import { QueryOperationsService } from './operations/query-operations';
import { UpdateOperationsService } from './operations/update-operations';
import { DeleteOperationsService } from './operations/delete-operations';
import { ChangeTrackingService } from './specialized/change-tracking-service';

import type { PrismaClient } from '@prisma/client';

/**
 * Slim Orchestrator PrismaService
 * 
 * Coordinates between focused services to provide a unified API.
 * Each operation is delegated to the appropriate specialized service.
 */
export class PrismaService {
  private createOps: CreateOperationsService;
  private queryOps: QueryOperationsService;
  private updateOps: UpdateOperationsService;
  private deleteOps: DeleteOperationsService;
  private changeTracker: ChangeTrackingService;

  constructor(prismaClient: PrismaClient) {
    console.log('🏗️ [PrismaService] Initializing slim orchestrator with focused services');
    
    // Initialize all specialized services
    this.createOps = new CreateOperationsService(prismaClient);
    this.queryOps = new QueryOperationsService(prismaClient);
    this.updateOps = new UpdateOperationsService(prismaClient);
    this.deleteOps = new DeleteOperationsService(prismaClient);
    this.changeTracker = new ChangeTrackingService();
    
    console.log('✅ [PrismaService] All focused services initialized successfully');
  }

  /**
   * CREATE - Delegate to CreateOperationsService
   */
  async create(data: any, schema: ResourceSchema, context: PrismaServiceContext): Promise<any> {
    console.log('🎯 [PrismaService] Delegating CREATE to CreateOperationsService');
    return await this.createOps.create(data, schema, context);
  }

  /**
   * FIND BY ID - Delegate to QueryOperationsService
   */
  async findById(
    schema: ResourceSchema,
    id: string,
    context: PrismaServiceContext
  ): Promise<any | null> {
    console.log('🎯 [PrismaService] Delegating FIND_BY_ID to QueryOperationsService');
    return await this.queryOps.findById(schema, id, context);
  }

  /**
   * FIND MANY - Delegate to QueryOperationsService
   */
  async findMany(
    schema: ResourceSchema | any,
    filters: QueryFilters = {},
    options: QueryOptions = {},
    context: PrismaServiceContext
  ): Promise<QueryResult<any>> {
    console.log('🎯 [PrismaService] Delegating FIND_MANY to QueryOperationsService');
    return await this.queryOps.findMany(schema, filters, options, context);
  }

  /**
   * UPDATE - Delegate to UpdateOperationsService
   */
  async update(
    schema: ResourceSchema,
    id: string,
    data: any,
    context: PrismaServiceContext
  ): Promise<any> {
    console.log('🎯 [PrismaService] Delegating UPDATE to UpdateOperationsService');
    return await this.updateOps.update(schema, id, data, context);
  }

  /**
   * UPDATE MANY - Delegate to UpdateOperationsService
   */
  async updateMany(
    schema: ResourceSchema,
    where: any,
    data: any,
    context: PrismaServiceContext
  ): Promise<{ count: number }> {
    console.log('🎯 [PrismaService] Delegating UPDATE_MANY to UpdateOperationsService');
    return await this.updateOps.updateMany(schema, where, data, context);
  }

  /**
   * DELETE - Delegate to DeleteOperationsService
   */
  async delete(
    schema: ResourceSchema,
    id: string,
    context: PrismaServiceContext
  ): Promise<void> {
    console.log('🎯 [PrismaService] Delegating DELETE to DeleteOperationsService');
    return await this.deleteOps.delete(schema, id, context);
  }

  /**
   * TRACK ENTITY CHANGE - Delegate to ChangeTrackingService
   * 
   * This method is used by the operation services for version history tracking.
   */
  async trackEntityChange(
    afterData: any,
    beforeData: any,
    changeType: any,
    schema: ResourceSchema,
    context: any,
    operationType: string
  ): Promise<void> {
    console.log('🎯 [PrismaService] Delegating TRACK_CHANGE to ChangeTrackingService');
    return await this.changeTracker.trackEntityChange(
      afterData, 
      beforeData, 
      changeType, 
      schema, 
      context, 
      operationType
    );
  }
}