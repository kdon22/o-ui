/**
 * Junction Relationships Hook - Simplified
 * 
 * ✅ SIMPLIFIED: Junction relationships are now handled automatically by the 
 * schema-driven junction resolver in the backend. This hook returns empty
 * relationships as they're no longer needed at the component level.
 */

// ✅ REMOVED: Old junction relationship service - replaced by schema-driven system

export interface JunctionRelationshipResult {
  parentContext: {
    hasParent: boolean;
    parentId?: string;
    parentResourceType?: string;  // Fixed: Match usage in auto-table
  };
  junctionRelationships: any[];
  junctionMutationMap: Record<string, any>;
  createJunctionRelationships: () => void;
}

interface JunctionRelationshipParams {
  filters: any;
  resourceKey: string;
  session: any;
}

/**
 * Simplified hook - junction relationships handled by schema resolver
 */
export function useAutoTableJunctionRelationships({
  filters,
  resourceKey,
  session
}: JunctionRelationshipParams): JunctionRelationshipResult {
  
  // ✅ FIX: Derive parent context from filters instead of returning null
  const parentContext = (() => {
    if (!filters || typeof filters !== 'object') {
      return { hasParent: false };
    }

    // Check for common parent ID patterns in filters
    const parentKeys = Object.keys(filters).filter(key => 
      key.endsWith('Id') && filters[key] != null
    );

    if (parentKeys.length === 0) {
      return { hasParent: false };
    }

    // Use the first parent key found (typically nodeId, processId, etc.)
    const parentKey = parentKeys[0];
    const parentId = filters[parentKey];
    const parentResourceType = parentKey.replace('Id', ''); // nodeId -> node

    return {
      hasParent: true,
      parentId,
      parentResourceType  // Fixed: Match interface property name
    };
  })();

  return {
    parentContext,
    junctionRelationships: [],
    junctionMutationMap: {},
    createJunctionRelationships: () => {
      // Junction relationships are now handled automatically by schema-driven resolver
    }
  };
}