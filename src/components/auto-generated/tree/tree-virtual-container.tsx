/**
 * Virtual Tree Container - High-performance virtualized tree rendering
 * 
 * Features:
 * - Virtualized rendering for 10,000+ nodes
 * - Smooth scrolling with momentum
 * - Dynamic height calculation
 * - Keyboard navigation support
 * - Performance monitoring
 */

"use client";

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeNode } from './tree-node';
import type { TreeNodeData } from './types';
import { cn } from '@/lib/utils/generalUtils';

// ============================================================================
// TYPES
// ============================================================================

export interface VirtualTreeContainerProps {
  nodes: TreeNodeData[];
  height?: number;
  itemHeight?: number;
  overscan?: number;
  selectedNodeId?: string | null;
  expandedNodes: Set<string>;
  userRootNodeId?: string;
  onNodeClick: (node: TreeNodeData) => void;
  onNodeExpand: (node: TreeNodeData) => void;
  onNodeContextMenu: (node: TreeNodeData, event: React.MouseEvent) => void;
  className?: string;
}

export interface FlatTreeNode extends TreeNodeData {
  level: number;
  isVisible: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  isRoot: boolean;
}

// ============================================================================
// UTILS
// ============================================================================

/**
 * Flattens hierarchical tree data into a virtualization-friendly flat array
 */
function flattenTreeForVirtualization(
  nodes: TreeNodeData[],
  expandedNodes: Set<string>,
  selectedNodeId: string | null,
  userRootNodeId?: string,
  level: number = 0
): FlatTreeNode[] {
  const flattened: FlatTreeNode[] = [];
  
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.name.localeCompare(b.name);
  });
  
  sortedNodes.forEach(node => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = (node.children?.length || 0) > 0;
    const isSelected = selectedNodeId === node.id;
    const isRoot = node.id === userRootNodeId;
    
    flattened.push({
      ...node,
      level,
      isVisible: true,
      hasChildren,
      isExpanded,
      isSelected,
      isRoot
    });
    
    // Recursively add children if expanded
    if (isExpanded && node.children) {
      const childNodes = flattenTreeForVirtualization(
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

/**
 * Calculates dynamic height based on node content
 */
function calculateNodeHeight(node: FlatTreeNode): number {
  const baseHeight = 32; // Base height in pixels
  const levelPadding = node.level * 2; // Additional padding per level
  
  // Add extra height for root nodes
  if (node.isRoot) {
    return baseHeight + 4;
  }
  
  // Add extra height for nodes with long names
  if (node.name.length > 30) {
    return baseHeight + 8;
  }
  
  return baseHeight + levelPadding;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const VirtualTreeContainer: React.FC<VirtualTreeContainerProps> = ({
  nodes,
  height = 400,
  itemHeight = 32,
  overscan = 5,
  selectedNodeId,
  expandedNodes,
  userRootNodeId,
  onNodeClick,
  onNodeExpand,
  onNodeContextMenu,
  className
}) => {
  // ============================================================================
  // REFS & STATE
  // ============================================================================
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    nodeCount: 0,
    visibleNodes: 0
  });

  // ============================================================================
  // FLATTENED DATA
  // ============================================================================
  const flattenedNodes = useMemo(() => {
    const startTime = performance.now();
    const flattened = flattenTreeForVirtualization(
      nodes,
      expandedNodes,
      selectedNodeId || null,
      userRootNodeId
    );
    const endTime = performance.now();
    
    setPerformanceMetrics(prev => ({
      ...prev,
      renderTime: endTime - startTime,
      nodeCount: flattened.length,
      visibleNodes: flattened.filter(n => n.isVisible).length
    }));
    
    // Virtual tree flattened
    return flattened;
  }, [nodes, expandedNodes, selectedNodeId, userRootNodeId]);

  // ============================================================================
  // VIRTUALIZER
  // ============================================================================
  const virtualizer = useVirtualizer({
    count: flattenedNodes.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: useCallback((index: number) => {
      const node = flattenedNodes[index];
      return node ? calculateNodeHeight(node) : itemHeight;
    }, [flattenedNodes, itemHeight]),
    overscan,
    // Enable smooth scrolling
    scrollMargin: 10,
  });

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedNodeId) return;
    
    const currentIndex = flattenedNodes.findIndex(node => node.id === selectedNodeId);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(flattenedNodes.length - 1, currentIndex + 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        const currentNode = flattenedNodes[currentIndex];
        if (currentNode.hasChildren && !currentNode.isExpanded) {
          onNodeExpand(currentNode);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const currentNodeLeft = flattenedNodes[currentIndex];
        if (currentNodeLeft.hasChildren && currentNodeLeft.isExpanded) {
          onNodeExpand(currentNodeLeft);
        }
        break;
      case 'Enter':
        e.preventDefault();
        onNodeClick(flattenedNodes[currentIndex]);
        break;
      default:
        return;
    }
    
    if (newIndex !== currentIndex) {
      const newNode = flattenedNodes[newIndex];
      if (newNode) {
        onNodeClick(newNode);
        // Scroll to the newly selected item
        virtualizer.scrollToIndex(newIndex, { align: 'center' });
      }
    }
  }, [selectedNodeId, flattenedNodes, onNodeClick, onNodeExpand, virtualizer]);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  useEffect(() => {
    const element = scrollElementRef.current;
    if (element) {
      element.addEventListener('keydown', handleKeyDown);
      return () => element.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  // Auto-scroll to selected node
  useEffect(() => {
    if (selectedNodeId) {
      const selectedIndex = flattenedNodes.findIndex(node => node.id === selectedNodeId);
      if (selectedIndex !== -1) {
        virtualizer.scrollToIndex(selectedIndex, { align: 'center' });
      }
    }
  }, [selectedNodeId, flattenedNodes, virtualizer]);

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================
  useEffect(() => {
    if (performanceMetrics.renderTime > 100) {
      console.warn(`🐌 Virtual tree render took ${performanceMetrics.renderTime.toFixed(2)}ms for ${performanceMetrics.nodeCount} nodes`);
    }
  }, [performanceMetrics]);

  // ============================================================================
  // RENDER
  // ============================================================================
  const virtualItems = virtualizer.getVirtualItems();
  
  return (
    <div className={cn("virtual-tree-container", className)}>
      {/* Performance metrics (dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 p-2 bg-gray-50 border-b">
          Nodes: {performanceMetrics.nodeCount} | Visible: {performanceMetrics.visibleNodes} | 
          Render: {performanceMetrics.renderTime.toFixed(2)}ms | 
          Virtual Items: {virtualItems.length}
        </div>
      )}
      
      {/* Virtualized container */}
      <div
        ref={scrollElementRef}
        className="tree-scroll-container overflow-auto focus:outline-none"
        style={{ height }}
        tabIndex={0}
        role="tree"
        aria-label="File tree"
      >
        <div
          className="tree-virtual-inner relative"
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
          }}
        >
          <AnimatePresence mode="popLayout">
            {virtualItems.map((virtualItem) => {
              const node = flattenedNodes[virtualItem.index];
              if (!node) return null;
              
              return (
                <motion.div
                  key={node.id}
                  className="tree-virtual-item absolute top-0 left-0 w-full"
                  style={{
                    height: virtualItem.size,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <TreeNode
                    node={node}
                    level={node.level}
                    isRoot={node.isRoot}
                    hasChildren={node.hasChildren}
                    isSelected={node.isSelected}
                    isExpanded={node.isExpanded}
                    onClick={onNodeClick}
                    onExpand={onNodeExpand}
                    onContextMenu={onNodeContextMenu}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================

/**
 * Hook for monitoring virtual tree performance
 */
export function useVirtualTreePerformance() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0,
    frameRate: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measurePerformance = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          frameRate: frameCount,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
        }));
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measurePerformance);
    };
    
    requestAnimationFrame(measurePerformance);
  }, []);

  return metrics;
}