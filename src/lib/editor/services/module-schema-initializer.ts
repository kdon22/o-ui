/**
 * Module Schema Initializer
 * 
 * Populates IndexedDB with module schemas for interface completion
 * Runs during workspace bootstrap alongside node initialization
 */

import { getActionClient } from '@/lib/action-client';
import type { UnifiedSchema } from '../schemas/types';

export class ModuleSchemaInitializer {
  private static initialized = false;

  /**
   * Initialize module schemas in IndexedDB
   * Called during workspace bootstrap
   */
  static async initialize(tenantId: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 [ModuleSchemaInitializer] Initializing module schemas...');

    try {
      const actionClient = getActionClient(tenantId);
      
      // Import all module schemas
      const { ALL_MODULE_SCHEMAS } = await import('../schemas/modules');
      
      console.log(`📦 [ModuleSchemaInitializer] Loading ${ALL_MODULE_SCHEMAS.length} module schemas`);

      // Store each method as individual row in IndexedDB
      const promises = ALL_MODULE_SCHEMAS.map(async (schema: UnifiedSchema) => {
        const moduleSchemaRecord = {
          id: schema.id,                    // 'http-get', 'http-post', etc.
          module: schema.module,            // 'http', 'math', 'json'
          name: schema.name,                // 'get', 'post', 'add'
          type: schema.type,                // 'method'
          returnInterface: schema.returnInterface, // 'HttpResponse', null
          returnObject: schema.returnObject,       // Interface definition
          parameters: schema.parameters,           // Method parameters
          description: schema.description,         // Method description
          examples: schema.examples,               // Usage examples
          category: schema.category                // 'http', 'math', etc.
        };

        await actionClient.indexedDB.set('moduleSchemas', moduleSchemaRecord);
      });

      await Promise.all(promises);

      console.log('✅ [ModuleSchemaInitializer] Module schemas initialized successfully');
      this.initialized = true;

    } catch (error) {
      console.error('❌ [ModuleSchemaInitializer] Failed to initialize module schemas:', error);
      throw error;
    }
  }

  /**
   * Get module methods for completion (e.g., http. -> get, post, delete)
   */
  static async getModuleMethods(tenantId: string, moduleName: string): Promise<any[]> {
    try {
      const actionClient = getActionClient(tenantId);
      
      // Query IndexedDB: Find all methods for this module
      const methods = await actionClient.indexedDB
        .where('moduleSchemas', 'module')
        .equals(moduleName)
        .toArray();

      return methods || [];
    } catch (error) {
      console.error(`[ModuleSchemaInitializer] Error getting methods for module ${moduleName}:`, error);
      return [];
    }
  }

  /**
   * Get return interface for a specific module method
   */
  static async getMethodReturnInterface(tenantId: string, module: string, method: string): Promise<string | null> {
    try {
      const actionClient = getActionClient(tenantId);
      const methodId = `${module}-${method}`;
      
      const methodSchema = await actionClient.indexedDB.get('moduleSchemas', methodId);
      return methodSchema?.returnInterface || null;
    } catch (error) {
      console.error(`[ModuleSchemaInitializer] Error getting return interface for ${module}.${method}:`, error);
      return null;
    }
  }

  /**
   * Reset initialization state (for testing)
   */
  static reset(): void {
    this.initialized = false;
  }
}
