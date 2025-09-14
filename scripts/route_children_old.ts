import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/shared/api/prismaClient';

/**
 * API handler for /api/node/children - Retrieves node children formatted for react-complex-tree
 * 
 * Query parameters:
 * - id: The ID of the parent node to get children for
 * - tenantId: The tenant ID
 * - format: If 'tree', returns data formatted for react-complex-tree
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const nodeId = searchParams.get('id');
    const tenantId = searchParams.get('tenantId') || '';
    const format = searchParams.get('format');
    
    // Basic validation
    if (!nodeId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: id' 
        }, 
        { status: 400 }
      );
    }
    
    console.log(`[TreeAPI] Getting children for node ${nodeId} with tenant ${tenantId}`);
    
    // Get the children from the database
    const children = await getNodeChildren(nodeId, tenantId);
    
    if (format === 'tree') {
      // Format data optimized for react-complex-tree (flat structure)
      const treeItems: Record<string, any> = {};
      
      for (const child of children) {
        // Convert child to tree item format
        treeItems[child.id] = {
          index: child.id,
          isFolder: child.hasChildren || (child.children && child.children.length > 0),
          children: child.children ? child.children.map((c: any) => 
            typeof c === 'object' && 'id' in c ? c.id : c
          ) : [],
          data: {
            id: child.id,
            name: child.name || 'Unnamed Node',
            description: child.description || '',
            type: child.type || 'NODE',
            tenantId: child.tenantId,
            parentId: child.parentId || nodeId,
            overrideKey: child.overrideKey || null,
            isActive: child.isActive,
            createdAt: child.createdAt,
            updatedAt: child.updatedAt,
            // Include relationship counts for badges
            relationships: {
              process: getRelationshipIds(child, 'process'),
              rule: getRelationshipIds(child, 'rule'),
              office: getRelationshipIds(child, 'office'),
              workflow: getRelationshipIds(child, 'workflow'),
              settings: getRelationshipIds(child, 'settings')
            }
          },
          canMove: false,
          canRename: false
        };
      }
      
      console.log(`[TreeAPI] Returning ${Object.keys(treeItems).length} children in tree format for node ${nodeId}`);
      
      return NextResponse.json(
        treeItems,
        {
          headers: {
            'Last-Modified': new Date().toUTCString(), 
            'Cache-Control': 'max-age=3600, stale-while-revalidate=300',
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Create a proper response format for non-tree format
    const responseData = {
      success: true,
      data: children.map(normalizeNode),
      status: 200
    };
    
    console.log(`[TreeAPI] Returning ${responseData.data.length} children for node ${nodeId}`);
    
    return NextResponse.json(
      responseData,
      {
        headers: {
          'Last-Modified': new Date().toUTCString(), 
          'Cache-Control': 'max-age=3600, stale-while-revalidate=300',
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in children API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing children request' },
      { status: 500 }
    );
  }
}

/**
 * Gets children of a specific node
 */
async function getNodeChildren(nodeId: string, tenantId: string): Promise<any[]> {
  console.log(`[TreeAPI] getNodeChildren called for nodeId: ${nodeId}, tenantId: ${tenantId}`);
  
  if (!nodeId) {
    console.error(`[TreeAPI] getNodeChildren called without nodeId`);
    return [];
  }
  
  try {
    const children = await prisma.node.findMany({
      where: { 
        parentId: nodeId,
        tenantId: tenantId,
        isActive: true 
      },
      include: {
        children: {
          select: { id: true }
        },
        process: true,
        rule: true,
        nodeWorkflow: {
          include: {
            workflow: true
          }
        },
        office: true,
        settings: true
      }
    });
    
    console.log(`[TreeAPI] Found ${children.length} children for node ${nodeId} with tenant ${tenantId}`);
    
    // If no children found in development mode, create mock children
    if (children.length === 0 && process.env.NODE_ENV === 'development') {
      console.log(`[TreeAPI] DEMO: Creating mock children for node ${nodeId}`);
      return [
        {
          id: `${nodeId}-child1`,
          name: `Child 1 of ${nodeId}`,
          description: 'Automatically generated child node',
          type: 'NODE',
          parentId: nodeId,
          tenantId: tenantId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          children: []
        },
        {
          id: `${nodeId}-child2`,
          name: `Child 2 of ${nodeId}`,
          description: 'Automatically generated child node',
          type: 'NODE',
          parentId: nodeId,
          tenantId: tenantId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          children: []
        }
      ];
    }
    
    return children;
  } catch (error) {
    console.error(`[TreeAPI] Error in getNodeChildren for node ${nodeId}:`, error);
    return [];
  }
}

/**
 * Helper function to get relationship IDs safely
 */
function getRelationshipIds(node: any, relationshipType: string): string[] {
  if (relationshipType === 'workflow' && node.nodeWorkflow) {
    return node.nodeWorkflow.map((nw: any) => nw.workflow.id);
  }
  
  if (!node[relationshipType]) {
    return [];
  }
  
  return node[relationshipType].map((item: any) => item.id);
}

/**
 * Normalizes a node object for consistent API response format
 */
function normalizeNode(node: any) {
  if (!node) return null;
  
  // Extract workflow from nodeWorkflow if present
  const workflow = node.nodeWorkflow 
    ? node.nodeWorkflow.map((nw: any) => nw.workflow)
    : [];
  
  return {
    id: node.id,
    name: node.name,
    description: node.description,
    type: node.type,
    tenantId: node.tenantId,
    parentId: node.parentId,
    overrideKey: node.overrideKey || null,
    isActive: node.isActive,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    createdById: node.createdById,
    updatedById: node.updatedBy,
    path: node.path,
    // Normalize relationships
    children: node.children ? node.children.map((child: any) => 
      typeof child === 'object' && 'id' in child ? normalizeNode(child) : { id: child }
    ) : [],
    relationships: {
      process: getRelationshipIds(node, 'process'),
      rule: getRelationshipIds(node, 'rule'),
      office: getRelationshipIds(node, 'office'),
      workflow: getRelationshipIds(node, 'workflow'),
      settings: getRelationshipIds(node, 'settings')
    },
    // Calculated properties
    hasChildren: node.children ? node.children.length > 0 : false
  };
} 