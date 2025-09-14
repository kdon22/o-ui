/**
 * Junction Relationship Service
 * 
 * Provides utilities for discovering and managing relationships between resources
 * through junction tables using the new auto-discovery system.
 */

import { getUnifiedResourceRegistry, getAllResourceSchemas } from './unified-resource-registry';

export class JunctionRelationshipService {
  /**
   * Discovers relationships between two resource types using auto-discovery
   * @param resourceTypeA First resource type
   * @param resourceTypeB Second resource type
   * @returns Array of junction table names that connect these resource types
   */
  static discoverRelationships(resourceTypeA: string, resourceTypeB: string): string[] {
    const registry = getUnifiedResourceRegistry();
    const allSchemas = getAllResourceSchemas();
    const junctionTables: string[] = [];
    
    // Scan all schemas for many-to-many relationships between these types
    allSchemas.forEach(schema => {
      if (schema.relationships) {
        Object.entries(schema.relationships).forEach(([relationName, rel]) => {
          if (rel.type === 'many-to-many' && rel.junction?.tableName) {
            // Check if this relationship connects our two resource types
            if ((schema.databaseKey === resourceTypeA && rel.relatedEntity === resourceTypeB) ||
                (schema.databaseKey === resourceTypeB && rel.relatedEntity === resourceTypeA)) {
              junctionTables.push(rel.junction.tableName);
            }
          }
        });
      }
    });
    
    return [...new Set(junctionTables)]; // Remove duplicates
  }

  /**
   * Checks if a table name is a junction table using auto-discovery
   * @param tableName The table name to check
   * @returns True if it's a junction table, false otherwise
   */
  static isJunctionTable(tableName: string): boolean {
    const registry = getUnifiedResourceRegistry();
    return registry.isJunctionTable(tableName);
  }

  /**
   * Gets all junction tables using auto-discovery
   * @returns Array of all junction table names
   */
  static getAllJunctionTables(): string[] {
    const registry = getUnifiedResourceRegistry();
    return registry.getAllJunctionTables();
  }
}