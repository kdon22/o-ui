/**
 * Schema-Driven Junction Resolver
 * 
 * BULLETPROOF ENTERPRISE SOLUTION for junction table handling.
 * Uses existing ResourceSchema relationship definitions to automatically:
 * - Resolve foreign key filters to junction queries
 * - Handle multi-hop relationships (Node → Process → Rule)
 * - Build correct Prisma where clauses
 * - Support branching and optimization
 * - Zero manual mapping - everything from schemas
 */

import type { ResourceSchema, RelationshipConfig, ManyToManyRelationship } from './schemas';
import { getResourceByActionPrefix, getAllResourceSchemas } from './resource-registry';

// ============================================================================
// TYPES
// ============================================================================

export interface JunctionResolution {
  relationshipName: string;
  junctionTable: string;
  localField: string;
  relatedField: string;
  query: any;
}

export interface MultiHopPath {
  steps: Array<{
    fromEntity: string;
    toEntity: string;
    relationship: RelationshipConfig;
    relationshipName: string;
  }>;
  totalHops: number;
}

// ============================================================================
// SCHEMA-DRIVEN JUNCTION RESOLVER
// ============================================================================

export class SchemaJunctionResolver {
  
  /**
   * Auto-resolve foreign key filters to junction queries using ResourceSchema definitions
   */
  static resolveJunctionFilters(
    schema: ResourceSchema,
    filters: Record<string, any>
  ): { where: any; resolved: string[] } {
    
    const where = { ...filters };
    const resolved: string[] = [];
    
    if (!schema.relationships) {
      return { where, resolved };
    }
    
    // Check each filter to see if it maps to a relationship
    Object.keys(filters).forEach(filterKey => {
      const resolution = this.findRelationshipForFilter(schema, filterKey, filters);
      
      if (resolution) {
        // Build junction query from schema definition
        where[resolution.relationshipName] = resolution.query;
        delete where[filterKey];
        resolved.push(filterKey);
        
        console.log(`🔄 [SchemaJunctionResolver] Resolved ${filterKey}:`, {
          schema: schema.modelName,
          filterKey,
          relationshipName: resolution.relationshipName,
          junctionTable: resolution.junctionTable,
          query: resolution.query
        });
      }
    });
    
    return { where, resolved };
  }
  
  /**
   * Find relationship configuration that handles a given filter key
   */
  static findRelationshipForFilter(
    schema: ResourceSchema,
    filterKey: string,
    filters: Record<string, any>
  ): JunctionResolution | null {
    
    if (!schema.relationships) return null;
    
    // 🔍 DEBUG: Enhanced logging for workflow debugging
    if (schema.modelName === 'Workflow') {
      console.log(`🔍 [SchemaJunctionResolver] DEBUG Workflow junction resolution:`, {
        modelName: schema.modelName,
        filterKey,
        filterValue: filters[filterKey],
        availableRelationships: Object.keys(schema.relationships),
        relationshipDetails: schema.relationships,
        timestamp: new Date().toISOString()
      });
    }
    
    // Direct relationship lookup
    for (const [relationshipName, relationship] of Object.entries(schema.relationships)) {
      if (relationship.type === 'many-to-many') {
        const m2mRel = relationship as ManyToManyRelationship;
        
        // 🔍 DEBUG: More detailed matching for workflows
        if (schema.modelName === 'Workflow') {
          console.log(`🔍 [SchemaJunctionResolver] Checking relationship: ${relationshipName}`, {
            relationshipName,
            junctionTable: m2mRel.junction.tableName,
            junctionField: m2mRel.junction.field,
            junctionRelatedField: m2mRel.junction.relatedField,
            filterKey,
            filterMatches: [
              `${m2mRel.junction.relatedField}Id`,
              m2mRel.junction.relatedField
            ],
            doesMatch: filterKey === m2mRel.junction.relatedField + 'Id' || filterKey === m2mRel.junction.relatedField,
            timestamp: new Date().toISOString()
          });
        }
        
        // Check if this filter key matches the related field in the junction
        if (filterKey === m2mRel.junction.relatedField + 'Id' || filterKey === m2mRel.junction.relatedField) {
          
          // ✅ FIX: Use the relationship name from the schema, not the junction table name
          // The relationship name (e.g., 'nodes') is what Prisma uses, not the junction table name ('nodeProcesses')
          const prismaFieldName = relationshipName;  // This is the actual Prisma field name
          
          const resolution = {
            relationshipName: prismaFieldName, // ✅ Use the schema relationship name directly  
            junctionTable: m2mRel.junction.tableName,
            localField: m2mRel.junction.field,
            relatedField: m2mRel.junction.relatedField,
            query: {
              some: {
                [m2mRel.junction.relatedField]: filters[filterKey]
              }
            }
          };
          
          // 🔍 DEBUG: Log successful resolution
          console.log(`🔄 [SchemaJunctionResolver] Resolved ${filterKey} for ${schema.modelName}:`, {
            schema: schema.modelName,
            filterKey,
            relationshipName: resolution.relationshipName,
            junctionTable: resolution.junctionTable,
            query: resolution.query,
            filterValue: filters[filterKey],
            timestamp: new Date().toISOString()
          });
          
          return resolution;
        }
      }
    }
    
    // 🔍 DEBUG: Log when no direct relationship found
    if (schema.modelName === 'Workflow') {
      console.log(`🔍 [SchemaJunctionResolver] No direct relationship found for ${schema.modelName}.${filterKey}, trying multi-hop...`, {
        modelName: schema.modelName,
        filterKey,
        availableRelationships: schema.relationships ? Object.keys(schema.relationships) : [],
        timestamp: new Date().toISOString()
      });
    }
    
    // Multi-hop relationship lookup (e.g., Node → Process → Rule)
    const multiHopResolution = this.resolveMultiHopRelationship(schema, filterKey, filters);
    if (multiHopResolution) {
      // 🔍 DEBUG: Log multi-hop resolution
      if (schema.modelName === 'Workflow') {
        console.log(`🔄 [SchemaJunctionResolver] Multi-hop resolved ${filterKey} for ${schema.modelName}:`, {
          resolution: multiHopResolution,
          timestamp: new Date().toISOString()
        });
      }
      return multiHopResolution;
    }
    
    // 🔍 DEBUG: Log when no resolution found
    if (schema.modelName === 'Workflow') {
      console.log(`❌ [SchemaJunctionResolver] No resolution found for ${schema.modelName}.${filterKey}`, {
        modelName: schema.modelName,
        filterKey,
        filterValue: filters[filterKey],
        timestamp: new Date().toISOString()
      });
    }
    
    return null;
  }
  
  /**
   * Resolve multi-hop relationships (e.g., nodeId filter on Rule should go Node → Process → Rule)
   */
  static resolveMultiHopRelationship(
    schema: ResourceSchema,
    filterKey: string,
    filters: Record<string, any>
  ): JunctionResolution | null {
    
    // Extract entity type from filter key (e.g., nodeId → node)
    const entityType = filterKey.replace(/Id$/, '');
    
    // Find path from the filter entity to current schema entity
    const path = this.findRelationshipPath(entityType, schema.actionPrefix);
    
    if (path && path.steps.length > 0) {
      // Build nested query for multi-hop path
      const nestedQuery = this.buildMultiHopQuery(path, filterKey, filters[filterKey]);
      
      if (nestedQuery) {
        // ✅ USE EXACT PRISMA FIELD NAME - NO CONVERSION
        const firstStep = path.steps[0];
        
        // Only handle many-to-many relationships for now
        if (firstStep.relationship.type === 'many-to-many') {
          const m2mRel = firstStep.relationship as ManyToManyRelationship;
          
          return {
            relationshipName: m2mRel.junction.tableName,  // ✅ Use exact tableName
            junctionTable: m2mRel.junction.tableName,
            localField: m2mRel.junction.field,
            relatedField: m2mRel.junction.relatedField,
            query: nestedQuery
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Find relationship path between two entities (e.g., node → rule via node → process → rule)
   */
  static findRelationshipPath(
    fromEntityType: string,
    toEntityType: string,
    maxDepth: number = 3
  ): MultiHopPath | null {
    
    const allSchemas = getAllResourceSchemas();
    const visited = new Set<string>();
    
    // BFS to find shortest path
    const queue: Array<{
      currentEntity: string;
      path: MultiHopPath['steps'];
      depth: number;
    }> = [{ currentEntity: fromEntityType, path: [], depth: 0 }];
    
    while (queue.length > 0) {
      const { currentEntity, path, depth } = queue.shift()!;
      
      if (depth > maxDepth || visited.has(currentEntity)) continue;
      visited.add(currentEntity);
      
      if (currentEntity === toEntityType && path.length > 0) {
        return { steps: path, totalHops: path.length };
      }
      
      // Find schema for current entity
      const currentSchema = allSchemas.find(s => s.actionPrefix === currentEntity);
      if (!currentSchema?.relationships) continue;
      
      // Explore relationships
      for (const [relationshipName, relationship] of Object.entries(currentSchema.relationships)) {
        const nextEntity = relationship.relatedEntity;
        
        if (!visited.has(nextEntity)) {
          queue.push({
            currentEntity: nextEntity,
            path: [...path, {
              fromEntity: currentEntity,
              toEntity: nextEntity,
              relationship,
              relationshipName
            }],
            depth: depth + 1
          });
        }
      }
    }
    
    return null;
  }
  
  /**
   * Build nested query for multi-hop relationships
   */
  static buildMultiHopQuery(
    path: MultiHopPath,
    filterKey: string,
    filterValue: any
  ): any {
    
    // Build nested query from the inside out
    let query: any = {
      some: {
        [filterKey]: filterValue
      }
    };
    
    // Walk backwards through the path to build nested query
    for (let i = path.steps.length - 1; i >= 0; i--) {
      const step = path.steps[i];
      
      if (step.relationship.type === 'many-to-many') {
        const m2mRel = step.relationship as ManyToManyRelationship;
        
        // ✅ USE EXACT PRISMA FIELD NAME - NO CONVERSION
        const prismaFieldName = m2mRel.junction.tableName;
        
        query = {
          some: {
            [prismaFieldName]: query // ✅ Use derived Prisma field name
          }
        };
      } else {
        // Handle one-to-many relationships
        query = {
          some: query
        };
      }
    }
    
    return query;
  }
  
  /**
   * Get all possible foreign key filters for a schema (for optimization)
   */
  static getPossibleFilters(schema: ResourceSchema): string[] {
    const filters: string[] = [];
    
    if (!schema.relationships) return filters;
    
    // Direct relationships
    Object.values(schema.relationships).forEach(relationship => {
      if (relationship.type === 'many-to-many') {
        const m2mRel = relationship as ManyToManyRelationship;
        filters.push(m2mRel.junction.relatedField);
        filters.push(m2mRel.junction.relatedField + 'Id');
      }
    });
    
    // Multi-hop relationships (common entity types)
    const commonEntities = ['node', 'process', 'rule', 'workflow', 'office'];
    commonEntities.forEach(entity => {
      if (entity !== schema.actionPrefix) {
        filters.push(entity + 'Id');
      }
    });
    
    return filters;
  }
  
  /**
   * Debug: Log relationship resolution for a schema
   */
  static debugRelationships(schema: ResourceSchema) {
    console.log(`🔍 [SchemaJunctionResolver] Debug relationships for ${schema.modelName}:`, {
      relationships: schema.relationships,
      possibleFilters: this.getPossibleFilters(schema),
      multiHopPaths: this.findAllMultiHopPaths(schema.actionPrefix)
    });
  }
  
  /**
   * Find all possible multi-hop paths from a given entity
   */
  static findAllMultiHopPaths(fromEntityType: string): Array<{
    toEntity: string;
    path: MultiHopPath;
  }> {
    const allSchemas = getAllResourceSchemas();
    const paths: Array<{ toEntity: string; path: MultiHopPath }> = [];
    
    allSchemas.forEach(schema => {
      if (schema.actionPrefix !== fromEntityType) {
        const path = this.findRelationshipPath(fromEntityType, schema.actionPrefix);
        if (path) {
          paths.push({ toEntity: schema.actionPrefix, path });
        }
      }
    });
    
    return paths;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Resolve junction filters for a schema - main entry point
 */
export function resolveSchemaJunctionFilters(
  schema: ResourceSchema,
  filters: Record<string, any>
): { where: any; resolved: string[] } {
  return SchemaJunctionResolver.resolveJunctionFilters(schema, filters);
}

/**
 * Check if a filter key can be resolved for a schema
 */
export function canResolveFilter(
  schema: ResourceSchema,
  filterKey: string,
  filters: Record<string, any> = {}
): boolean {
  return SchemaJunctionResolver.findRelationshipForFilter(schema, filterKey, filters) !== null;
}

/**
 * Get debug information for schema relationships
 */
export function debugSchemaRelationships(schema: ResourceSchema) {
  return SchemaJunctionResolver.debugRelationships(schema);
} 