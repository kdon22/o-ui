/**
 * Relationship processing utilities for Prisma operations
 */

/**
 * Process relationship payload and convert to Prisma nested writes
 */
export function processRelationships(
  relationships: Record<string, any>,
  schemaRelationships: Record<string, any>
): Record<string, any> {
  const relationshipData: Record<string, any> = {};

  for (const [relationName, relationPayload] of Object.entries(relationships)) {
    const relationConfig = schemaRelationships[relationName];
    if (!relationConfig) {
      
      continue;
    }

    // Convert relationship payload to Prisma syntax based on relationship type
    if (relationConfig.type === 'many-to-many') {
      relationshipData[relationName] = processManyToManyRelation(relationPayload, relationConfig);
    } else if (relationConfig.type === 'one-to-many') {
      relationshipData[relationName] = processOneToManyRelation(relationPayload, relationConfig);
    } else if (relationConfig.type === 'one-to-one') {
      relationshipData[relationName] = processOneToOneRelation(relationPayload, relationConfig);
    }
  }

  return relationshipData;
}

/**
 * Process many-to-many relationship payload
 */
function processManyToManyRelation(payload: any, config: any): any {
  const result: any = {};

  if (payload.connect && Array.isArray(payload.connect)) {
    // Connect existing records with optional junction attributes
    result.create = payload.connect.map((item: any) => {
      const { id, ...attributes } = item;
      return {
        [config.junction.relatedField]: { connect: { id } },
        ...attributes
      };
    });
  }

  if (payload.disconnect && Array.isArray(payload.disconnect)) {
    // Disconnect records
    result.deleteMany = payload.disconnect.map((id: string) => ({
      [config.junction.relatedField]: id
    }));
  }

  if (payload.update && Array.isArray(payload.update)) {
    // Update junction attributes
    result.updateMany = payload.update.map((item: any) => {
      const { id, ...updates } = item;
      return {
        where: { [config.junction.relatedField]: id },
        data: updates
      };
    });
  }

  if (payload.set && Array.isArray(payload.set)) {
    // Replace all connections
    result.deleteMany = {}; // Clear all existing
    result.create = payload.set.map((item: any) => {
      const { id, ...attributes } = item;
      return {
        [config.junction.relatedField]: { connect: { id } },
        ...attributes
      };
    });
  }

  return result;
}

/**
 * Process one-to-many relationship payload
 */
function processOneToManyRelation(payload: any, config: any): any {
  const result: any = {};

  if (payload.connect && Array.isArray(payload.connect)) {
    result.connect = payload.connect.map((id: string) => ({ id }));
  }

  if (payload.disconnect && Array.isArray(payload.disconnect)) {
    result.disconnect = payload.disconnect.map((id: string) => ({ id }));
  }

  if (payload.create && Array.isArray(payload.create)) {
    result.create = payload.create;
  }

  if (payload.update && Array.isArray(payload.update)) {
    result.update = payload.update.map((item: any) => ({
      where: { id: item.id },
      data: item
    }));
  }

  return result;
}

/**
 * Process one-to-one relationship payload
 */
function processOneToOneRelation(payload: any, config: any): any {
  const result: any = {};

  if (payload.connect && payload.connect.id) {
    result.connect = { id: payload.connect.id };
  }

  if (payload.disconnect) {
    result.disconnect = true;
  }

  if (payload.create) {
    result.create = payload.create;
  }

  if (payload.update) {
    result.update = payload.update;
  }

  return result;
}