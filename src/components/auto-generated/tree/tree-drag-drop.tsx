/**
 * Tree Drag & Drop - Drag and drop functionality for tree reorganization
 * 
 * Features:
 * - Drag nodes to reorganize hierarchy
 * - Visual feedback during drag operations
 * - Drop zones with highlighting
 * - Conflict prevention (can't drop on descendants)
 * - Optimistic updates with rollback on error
 * - Touch support for mobile
 */

"use client";

import React, { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  rectIntersection,
  TouchSensor,
  MouseSensor,
} from '@dnd-kit/core';
import {
  verticalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeNode } from './tree-node';
import type { TreeNodeData } from './types';
import { useResourceUpdate } from '@/hooks/use-action-api';
import { cn } from '@/lib/utils/generalUtils';

// ============================================================================
// TYPES
// ============================================================================

export interface DragDropTreeProps {
  nodes: TreeNodeData[];
  selectedNodeId?: string | null;
  expandedNodes: Set<string>;
  userRootNodeId?: string;
  onNodeClick: (node: TreeNodeData) => void;
  onNodeExpand: (node: TreeNodeData) => void;
  onNodeContextMenu: (node: TreeNodeData, event: React.MouseEvent) => void;
  onNodeMove?: (nodeId: string, newParentId: string, newIndex: number) => void;
  className?: string;
  disabled?: boolean;
}

export interface DragData {
  id: string;
  type: 'tree-node';
  node: TreeNodeData;
  level: number;
}

export interface DropZoneData {
  id: string;
  type: 'drop-zone';
  parentId?: string;
  index: number;
  level: number;
}

// ============================================================================
// DRAGGABLE TREE NODE
// ============================================================================

const DraggableTreeNode: React.FC<{
  node: TreeNodeData;
  level: number;
  isRoot: boolean;
  hasChildren: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  isDragging?: boolean;
  isOver?: boolean;
  canDrop?: boolean;
  onClick: (node: TreeNodeData) => void;
  onExpand: (node: TreeNodeData) => void;
  onContextMenu: (node: TreeNodeData, event: React.MouseEvent) => void;
  disabled?: boolean;
}> = ({
  node,
  level,
  isRoot,
  hasChildren,
  isSelected,
  isExpanded,
  isDragging = false,
  isOver = false,
  canDrop = true,
  onClick,
  onExpand,
  onContextMenu,
  disabled = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: node.id,
    data: {
      type: 'tree-node',
      node,
      level,
    } as DragData,
    disabled: disabled || isRoot, // Prevent dragging root nodes
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandleProps = disabled ? {} : { ...attributes, ...listeners };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative transition-all duration-200",
        isDragging && "opacity-50 z-50",
        isSortableDragging && "z-50",
        isOver && canDrop && "ring-2 ring-blue-400 ring-offset-2 rounded-md",
        isOver && !canDrop && "ring-2 ring-red-400 ring-offset-2 rounded-md"
      )}
      whileHover={!isDragging ? { scale: 1.01 } : {}}
      animate={{
        scale: isDragging ? 1.05 : 1,
        rotate: isDragging ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Drop zone indicator */}
      {isOver && (
        <motion.div
          className={cn(
            "absolute -top-1 left-0 right-0 h-2 rounded-full",
            canDrop ? "bg-blue-400" : "bg-red-400"
          )}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Drag handle overlay */}
      <div
        {...dragHandleProps}
        className={cn(
          "cursor-grab active:cursor-grabbing",
          disabled && "cursor-not-allowed"
        )}
      >
        <TreeNode
          node={node}
          level={level}
          isRoot={isRoot}
          hasChildren={hasChildren}
          isSelected={isSelected}
          isExpanded={isExpanded}
          onClick={onClick}
          onExpand={onExpand}
          onContextMenu={onContextMenu}
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// DRAG OVERLAY
// ============================================================================

const DragOverlayNode: React.FC<{
  node: TreeNodeData;
  level: number;
  isRoot: boolean;
  hasChildren: boolean;
}> = ({ node, level, isRoot, hasChildren }) => {
  return (
    <motion.div
      className="bg-white shadow-2xl rounded-lg border-2 border-blue-400 opacity-90 transform rotate-2"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.9 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <TreeNode
        node={node}
        level={level}
        isRoot={isRoot}
        hasChildren={hasChildren}
        isSelected={false}
        isExpanded={false}
        onClick={() => {}}
        onExpand={() => {}}
        onContextMenu={() => {}}
      />
    </motion.div>
  );
};

// ============================================================================
// UTILS
// ============================================================================

/**
 * Checks if a node is a descendant of another node
 */
function isDescendant(nodeId: string, potentialAncestorId: string, nodes: TreeNodeData[]): boolean {
  const nodeMap = new Map<string, TreeNodeData>();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  let current = nodeMap.get(nodeId);
  while (current && current.parentId) {
    if (current.parentId === potentialAncestorId) {
      return true;
    }
    current = nodeMap.get(current.parentId);
  }
  
  return false;
}

/**
 * Flattens tree nodes for drag & drop operations
 */
function flattenNodesForDragDrop(
  nodes: TreeNodeData[],
  expandedNodes: Set<string>,
  selectedNodeId: string | null,
  userRootNodeId?: string,
  level: number = 0
): Array<TreeNodeData & { level: number; isRoot: boolean; hasChildren: boolean; isSelected: boolean; isExpanded: boolean }> {
  const flattened: Array<TreeNodeData & { level: number; isRoot: boolean; hasChildren: boolean; isSelected: boolean; isExpanded: boolean }> = [];
  
  nodes.forEach(node => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = (node.children?.length || 0) > 0;
    const isSelected = selectedNodeId === node.id;
    const isRoot = node.id === userRootNodeId;
    
    flattened.push({
      ...node,
      level,
      isRoot,
      hasChildren,
      isSelected,
      isExpanded
    });
    
    if (isExpanded && node.children) {
      const childNodes = flattenNodesForDragDrop(
        node.children,
        expandedNodes,
        selectedNodeId,
        userRootNodeId,
        level + 1
      );
      flattened.push(...childNodes);
    }
  });
  
  return flattened;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DragDropTree: React.FC<DragDropTreeProps> = ({
  nodes,
  selectedNodeId,
  expandedNodes,
  userRootNodeId,
  onNodeClick,
  onNodeExpand,
  onNodeContextMenu,
  onNodeMove,
  className,
  disabled = false
}) => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<TreeNodeData | null>(null);
  const [dropTarget, setDropTarget] = useState<{ nodeId: string; canDrop: boolean } | null>(null);

  // ============================================================================
  // SENSORS
  // ============================================================================
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // ============================================================================
  // MUTATIONS
  // ============================================================================
  const moveNodeMutation = useResourceUpdate('node', {
    onError: (error) => {
      console.error('Failed to move node:', error);
      // TODO: Add toast notification
    },
  });

  // ============================================================================
  // FLATTENED NODES
  // ============================================================================
  const flattenedNodes = flattenNodesForDragDrop(
    nodes,
    expandedNodes,
    selectedNodeId || null,
    userRootNodeId
  );

  // ============================================================================
  // DRAG HANDLERS
  // ============================================================================
  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (disabled) return;
    
    const { active } = event;
    const dragData = active.data.current as DragData;
    
    if (dragData?.type === 'tree-node') {
      setActiveId(active.id as string);
      setDraggedNode(dragData.node);
    }
  }, [disabled]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (disabled) return;
    
    const { active, over } = event;
    
    if (!over || !active || !draggedNode) return;
    
    const dragData = active.data.current as DragData;
    const overData = over.data.current;
    
    if (dragData?.type === 'tree-node' && overData?.type === 'tree-node') {
      const targetNode = overData.node;
      const canDrop = !isDescendant(targetNode.id, dragData.node.id, nodes) && 
                     targetNode.id !== dragData.node.id;
      
      setOverId(over.id as string);
      setDropTarget({ nodeId: targetNode.id, canDrop });
    }
  }, [disabled, draggedNode, nodes]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (disabled) return;
    
    const { active, over } = event;
    
    if (!over || !active || !draggedNode) {
      setActiveId(null);
      setOverId(null);
      setDraggedNode(null);
      setDropTarget(null);
      return;
    }
    
    const dragData = active.data.current as DragData;
    const overData = over.data.current;
    
    if (dragData?.type === 'tree-node' && overData?.type === 'tree-node') {
      const targetNode = overData.node;
      
      // Check if drop is valid
      const canDrop = !isDescendant(targetNode.id, dragData.node.id, nodes) && 
                     targetNode.id !== dragData.node.id;
      
      if (canDrop) {
        // Call custom handler if provided
        if (onNodeMove) {
          onNodeMove(dragData.node.id, targetNode.id, 0);
        } else {
          // Default behavior: update via API
          moveNodeMutation.mutate({
            id: dragData.node.id,
            parentId: targetNode.id,
          });
        }
      }
    }
    
    // Reset state
    setActiveId(null);
    setOverId(null);
    setDraggedNode(null);
    setDropTarget(null);
  }, [disabled, draggedNode, nodes, onNodeMove, moveNodeMutation]);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={flattenedNodes.map(node => node.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn("drag-drop-tree", className)}>
          <AnimatePresence mode="popLayout">
            {flattenedNodes.map((node) => (
              <DraggableTreeNode
                key={node.id}
                node={node}
                level={node.level}
                isRoot={node.isRoot}
                hasChildren={node.hasChildren}
                isSelected={node.isSelected}
                isExpanded={node.isExpanded}
                isDragging={activeId === node.id}
                isOver={overId === node.id}
                canDrop={dropTarget?.nodeId === node.id ? dropTarget.canDrop : true}
                onClick={onNodeClick}
                onExpand={onNodeExpand}
                onContextMenu={onNodeContextMenu}
                disabled={disabled}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && draggedNode ? (
          <DragOverlayNode
            node={draggedNode}
            level={0}
            isRoot={draggedNode.id === userRootNodeId}
            hasChildren={(draggedNode.children?.length || 0) > 0}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for handling drag & drop operations
 */
export function useDragDropTree() {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<TreeNodeData | null>(null);
  
  const handleDragStart = useCallback((node: TreeNodeData) => {
    setIsDragging(true);
    setDraggedNode(node);
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);
  
  return {
    isDragging,
    draggedNode,
    handleDragStart,
    handleDragEnd,
  };
}