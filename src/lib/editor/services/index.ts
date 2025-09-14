/**
 * 🚀 Service Exports - User Utility Schema System
 * 
 * Clean exports for all user utility schema services
 * Enables clean imports: import { UserUtilitySchemaGenerator } from '@/lib/editor/services'
 */

// 🚀 User Utility Schema Services
export { UserUtilitySchemaGenerator } from './user-utility-schema-generator'
export { UserUtilitySchemaRegistry, userUtilityRegistry } from './user-utility-registry'

// Export types for external usage
export type { UserUtilitySchemaRegistry as IUserUtilitySchemaRegistry } from './user-utility-registry'

/**
 * 🎯 Usage Examples:
 * 
 * // Import services
 * import { userUtilityRegistry, UserUtilitySchemaGenerator } from '@/lib/editor/services'
 * 
 * // Get user utility schemas for IntelliSense
 * const schemas = await userUtilityRegistry.getAllUserSchemas(tenantId)
 * 
 * // Generate schema from parameters
 * const generator = new UserUtilitySchemaGenerator()
 * const schema = generator.generateSchema(functionName, parameters, returnType, description)
 */