/**
 * Node Hierarchy Service - Focused service for calculating Node hierarchy fields
 * 
 * Handles calculation of:
 * - ancestorIds: Array of parent node IDs up the tree
 * - level: Depth in the tree (0 = root)
 * - path: Array of node IDs from root to parent
 * - sortOrder: Position among siblings
 * 
 * This service is responsible for solving the ancestorIds population issue.
 */

import { PrismaClient } from '@prisma/client';
import type { BranchContext } from '@/lib/resource-system/schemas';

interface HierarchyData {
  level: number;
  path: string[];
  ancestorIds: string[];
  sortOrder: number;
}

interface ParentNode {
  id: string;
  level?: number;
  path?: string[];
  ancestorIds?: string[];
  parentId?: string | null;
}

export class NodeHierarchyService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate all hierarchy fields for a Node being created
   * 
   * @param createData - The node data being created
   * @param branchContext - Branch context for tenant/branch scoping
   * @returns Promise<HierarchyData> - Calculated hierarchy fields
   */
  async calculateHierarchyForCreate(
    createData: any, 
    branchContext: BranchContext
  ): Promise<HierarchyData> {
    console.log('🌳 [NodeHierarchy] Starting hierarchy calculation:', {
      nodeData: {
        id: createData.id,
        name: createData.name,
        parentId: createData.parentId,
        hasParentConnect: !!createData?.parent?.connect?.id
      },
      branchContext: {
        tenantId: branchContext.tenantId,
        currentBranchId: branchContext.currentBranchId,
        defaultBranchId: branchContext.defaultBranchId
      }
    });

    // Support both raw foreign key and relation connect mapping
    const parentIdForHierarchy = createData.parentId || createData?.parent?.connect?.id || null;
    
    if (parentIdForHierarchy) {
      console.log('🌳 [NodeHierarchy] Has parent - calculating child hierarchy');
      return await this.calculateChildHierarchy(
        parentIdForHierarchy, 
        createData, 
        branchContext
      );
    } else {
      console.log('🌳 [NodeHierarchy] No parent - calculating root hierarchy');
      return await this.calculateRootHierarchy(createData, branchContext);
    }
  }

  /**
   * Calculate hierarchy for a child node (has parent)
   */
  private async calculateChildHierarchy(
    parentId: string,
    createData: any,
    branchContext: BranchContext
  ): Promise<HierarchyData> {
    try {
      // Fetch parent node with hierarchy fields
      const parentNode = await this.prisma.node.findFirst({
        where: {
          id: parentId,
          tenantId: branchContext.tenantId,
          // Try current branch first, fallback to default if needed
          branchId: {
            in: [branchContext.currentBranchId, branchContext.defaultBranchId]
          }
        },
        select: {
          id: true,
          level: true,
          path: true,
          ancestorIds: true,
          parentId: true
        }
      });

      console.log('🌳 [NodeHierarchy] Parent node lookup:', {
        searchParentId: parentId,
        foundParent: !!parentNode,
        parentNode: parentNode ? {
          id: parentNode.id,
          level: parentNode.level,
          ancestorIds: parentNode.ancestorIds,
          path: parentNode.path
        } : null
      });

      if (parentNode) {
        // Calculate hierarchy based on parent
        const level = (parentNode.level || 0) + 1;
        const path = Array.isArray(parentNode.path) 
          ? [...parentNode.path, parentNode.id]
          : [parentNode.id];
        const ancestorIds = Array.isArray(parentNode.ancestorIds)
          ? [...parentNode.ancestorIds, parentNode.id]
          : [parentNode.id];

        console.log('🌳 [NodeHierarchy] Calculated child hierarchy:', {
          level,
          path,
          ancestorIds,
          parentData: {
            level: parentNode.level,
            path: parentNode.path,
            ancestorIds: parentNode.ancestorIds
          }
        });

        // Calculate sortOrder among siblings
        const sortOrder = await this.calculateSiblingOrder(
          parentId, 
          createData, 
          branchContext
        );

        return { level, path, ancestorIds, sortOrder };
      } else {
        // Parent not found - treat as orphaned child
        console.log('🌳 [NodeHierarchy] Parent not found - using orphaned defaults');
        return {
          level: 1,
          path: [],
          ancestorIds: [],
          sortOrder: 1
        };
      }
    } catch (error) {
      console.error('🚨 [NodeHierarchy] Error calculating child hierarchy:', error);
      // Return safe defaults on error
      return {
        level: 1,
        path: [],
        ancestorIds: [],
        sortOrder: 1
      };
    }
  }

  /**
   * Calculate hierarchy for a root node (no parent)
   */
  private async calculateRootHierarchy(
    createData: any,
    branchContext: BranchContext
  ): Promise<HierarchyData> {
    console.log('🌳 [NodeHierarchy] Calculating root node hierarchy');

    // Root nodes have simple hierarchy
    const hierarchy: HierarchyData = {
      level: 0,
      path: [],
      ancestorIds: [],
      sortOrder: 1
    };

    // Calculate sortOrder among other root nodes
    try {
      const maxSortOrderResult = await this.prisma.node.aggregate({
        where: {
          parentId: null,
          tenantId: branchContext.tenantId,
          branchId: branchContext.currentBranchId
        },
        _max: {
          sortOrder: true
        }
      });

      hierarchy.sortOrder = (maxSortOrderResult._max.sortOrder || 0) + 1;

      console.log('🌳 [NodeHierarchy] Root hierarchy calculated:', {
        sortOrder: hierarchy.sortOrder,
        maxExisting: maxSortOrderResult._max.sortOrder
      });
    } catch (error) {
      console.error('🚨 [NodeHierarchy] Error calculating root sortOrder:', error);
      hierarchy.sortOrder = 1;
    }

    return hierarchy;
  }

  /**
   * Calculate sortOrder among siblings
   */
  private async calculateSiblingOrder(
    parentId: string,
    createData: any,
    branchContext: BranchContext
  ): Promise<number> {
    try {
      const maxSortOrderResult = await this.prisma.node.aggregate({
        where: {
          parentId: parentId,
          tenantId: branchContext.tenantId,
          branchId: branchContext.currentBranchId
        },
        _max: {
          sortOrder: true
        }
      });

      const sortOrder = (maxSortOrderResult._max.sortOrder || 0) + 1;
      
      console.log('🌳 [NodeHierarchy] Calculated sibling order:', {
        parentId,
        sortOrder,
        maxExisting: maxSortOrderResult._max.sortOrder
      });

      return sortOrder;
    } catch (error) {
      console.error('🚨 [NodeHierarchy] Error calculating sibling order:', error);
      return 1;
    }
  }

  /**
   * Apply calculated hierarchy to create data
   * Mutates the createData object to include hierarchy fields
   */
  applyHierarchyToCreateData(createData: any, hierarchy: HierarchyData): void {
    createData.level = hierarchy.level;
    createData.path = hierarchy.path;
    createData.ancestorIds = hierarchy.ancestorIds;
    createData.sortOrder = hierarchy.sortOrder;

    console.log('🌳 [NodeHierarchy] Applied hierarchy to createData:', {
      level: createData.level,
      path: createData.path,
      ancestorIds: createData.ancestorIds,
      sortOrder: createData.sortOrder
    });
  }
}
