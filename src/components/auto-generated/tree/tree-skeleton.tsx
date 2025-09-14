/**
 * Tree Skeleton - Advanced loading states for better perceived performance
 * 
 * Features:
 * - Realistic tree structure mimicking
 * - Shimmer animations
 * - Progressive loading states
 * - Hierarchical skeleton structure
 * - Mobile-responsive design
 * - Pulse and shimmer effects
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/generalUtils';

// ============================================================================
// TYPES
// ============================================================================

export interface TreeSkeletonProps {
  nodeCount?: number;
  maxDepth?: number;
  showConnections?: boolean;
  animated?: boolean;
  className?: string;
}

export interface SkeletonNodeProps {
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isLast: boolean;
  showConnections: boolean;
  animated: boolean;
}

// ============================================================================
// SKELETON ANIMATIONS
// ============================================================================

const shimmerVariants = {
  initial: { x: '-100%' },
  animate: { x: '100%' },
};

const pulseVariants = {
  initial: { opacity: 0.5 },
  animate: { opacity: 1 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  },
};

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

/**
 * Shimmer effect overlay
 */
const ShimmerOverlay: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    className={cn(
      "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent",
      className
    )}
    variants={shimmerVariants}
    initial="initial"
    animate="animate"
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

/**
 * Individual skeleton node
 */
const SkeletonNode: React.FC<SkeletonNodeProps> = ({
  level,
  hasChildren,
  isExpanded,
  isLast,
  showConnections,
  animated
}) => {
  const indent = level * 20;
  
  // Generate random but consistent widths for realistic appearance
  const nameWidth = React.useMemo(() => {
    const minWidth = 80;
    const maxWidth = 200;
    const seedWidth = Math.floor(Math.random() * (maxWidth - minWidth) + minWidth);
    return `${seedWidth}px`;
  }, []);

  return (
    <motion.div
      className="relative"
      variants={animated ? fadeInVariants : {}}
      initial={animated ? "initial" : false}
      animate={animated ? "animate" : false}
    >
      {/* Connection lines */}
      {showConnections && level > 0 && (
        <>
          {/* Vertical line */}
          <div 
            className="absolute border-l border-dotted border-gray-300 opacity-30"
            style={{ 
              left: `${indent - 10}px`,
              top: 0,
              bottom: isLast ? '50%' : '100%',
              width: '1px'
            }}
          />
          
          {/* Horizontal line */}
          <div 
            className="absolute border-t border-dotted border-gray-300 opacity-30"
            style={{ 
              left: `${indent - 10}px`,
              top: '50%',
              width: '10px',
              height: '1px'
            }}
          />
        </>
      )}
      
      {/* Node content */}
      <div 
        className="flex items-center py-1 px-2"
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren && (
          <div className="w-4 h-4 mr-2 flex items-center justify-center">
            <motion.div
              className="w-3 h-3 bg-gray-300 rounded-sm relative overflow-hidden"
              variants={animated ? pulseVariants : {}}
              initial={animated ? "initial" : false}
              animate={animated ? "animate" : false}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              {animated && <ShimmerOverlay />}
            </motion.div>
          </div>
        )}
        
        {/* Icon */}
        <div className="w-4 h-4 mr-2 flex items-center justify-center">
          <motion.div
            className="w-4 h-4 bg-gray-300 rounded-sm relative overflow-hidden"
            variants={animated ? pulseVariants : {}}
            initial={animated ? "initial" : false}
            animate={animated ? "animate" : false}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.1
            }}
          >
            {animated && <ShimmerOverlay />}
          </motion.div>
        </div>
        
        {/* Node name */}
        <motion.div
          className="h-4 bg-gray-300 rounded-sm relative overflow-hidden"
          style={{ width: nameWidth }}
          variants={animated ? pulseVariants : {}}
          initial={animated ? "initial" : false}
          animate={animated ? "animate" : false}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.2
          }}
        >
          {animated && <ShimmerOverlay />}
        </motion.div>
        
        {/* Child count badge */}
        {hasChildren && (
          <motion.div
            className="ml-2 w-6 h-3 bg-gray-300 rounded-full relative overflow-hidden"
            variants={animated ? pulseVariants : {}}
            initial={animated ? "initial" : false}
            animate={animated ? "animate" : false}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.3
            }}
          >
            {animated && <ShimmerOverlay />}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Generates a realistic tree structure for skeleton
 */
function generateSkeletonStructure(nodeCount: number, maxDepth: number) {
  const nodes: Array<{
    id: string;
    level: number;
    hasChildren: boolean;
    isExpanded: boolean;
    isLast: boolean;
  }> = [];
  
  let currentId = 0;
  
  const createNode = (level: number, isLast: boolean = false) => {
    const id = `skeleton-${currentId++}`;
    const hasChildren = level < maxDepth && Math.random() > 0.4;
    const isExpanded = hasChildren && Math.random() > 0.6;
    
    nodes.push({
      id,
      level,
      hasChildren,
      isExpanded,
      isLast
    });
    
    // Add children if expanded
    if (isExpanded && nodes.length < nodeCount) {
      const childCount = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < childCount && nodes.length < nodeCount; i++) {
        createNode(level + 1, i === childCount - 1);
      }
    }
  };
  
  // Generate root nodes
  while (nodes.length < nodeCount) {
    createNode(0, false);
  }
  
  return nodes.slice(0, nodeCount);
}

// ============================================================================
// MAIN SKELETON COMPONENT
// ============================================================================

export const TreeSkeleton: React.FC<TreeSkeletonProps> = ({
  nodeCount = 12,
  maxDepth = 3,
  showConnections = true,
  animated = true,
  className
}) => {
  const skeletonNodes = React.useMemo(() => 
    generateSkeletonStructure(nodeCount, maxDepth), 
    [nodeCount, maxDepth]
  );
  
  return (
    <motion.div
      className={cn("tree-skeleton space-y-1", className)}
      variants={animated ? staggerContainer : {}}
      initial={animated ? "initial" : false}
      animate={animated ? "animate" : false}
    >
      {skeletonNodes.map((node) => (
        <SkeletonNode
          key={node.id}
          level={node.level}
          hasChildren={node.hasChildren}
          isExpanded={node.isExpanded}
          isLast={node.isLast}
          showConnections={showConnections}
          animated={animated}
        />
      ))}
    </motion.div>
  );
};

// ============================================================================
// SPECIALIZED SKELETON VARIANTS
// ============================================================================

/**
 * Compact skeleton for small spaces
 */
export const CompactTreeSkeleton: React.FC<{ nodeCount?: number; className?: string }> = ({
  nodeCount = 8,
  className
}) => (
  <TreeSkeleton
    nodeCount={nodeCount}
    maxDepth={2}
    showConnections={false}
    animated={true}
    className={cn("space-y-0.5", className)}
  />
);

/**
 * Detailed skeleton for main tree views
 */
export const DetailedTreeSkeleton: React.FC<{ nodeCount?: number; className?: string }> = ({
  nodeCount = 15,
  className
}) => (
  <TreeSkeleton
    nodeCount={nodeCount}
    maxDepth={4}
    showConnections={true}
    animated={true}
    className={className}
  />
);

/**
 * Static skeleton for reduced motion preferences
 */
export const StaticTreeSkeleton: React.FC<{ nodeCount?: number; className?: string }> = ({
  nodeCount = 10,
  className
}) => (
  <TreeSkeleton
    nodeCount={nodeCount}
    maxDepth={3}
    showConnections={true}
    animated={false}
    className={className}
  />
);

/**
 * Progressive skeleton that updates as data loads
 */
export const ProgressiveTreeSkeleton: React.FC<{
  loadingProgress?: number; // 0-1
  nodeCount?: number;
  className?: string;
}> = ({ loadingProgress = 0, nodeCount = 12, className }) => {
  const visibleNodes = Math.floor(nodeCount * loadingProgress);
  
  return (
    <motion.div className={cn("space-y-1", className)}>
      {/* Loaded nodes representation */}
      {Array.from({ length: visibleNodes }).map((_, i) => (
        <motion.div
          key={`loaded-${i}`}
          className="h-8 bg-green-100 rounded-md opacity-50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      ))}
      
      {/* Remaining skeleton nodes */}
      <TreeSkeleton
        nodeCount={nodeCount - visibleNodes}
        maxDepth={3}
        showConnections={true}
        animated={true}
      />
    </motion.div>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for managing skeleton loading states
 */
export function useTreeSkeletonState() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [nodeCount, setNodeCount] = React.useState(12);
  
  const startLoading = React.useCallback((count: number = 12) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setNodeCount(count);
  }, []);
  
  const updateProgress = React.useCallback((progress: number) => {
    setLoadingProgress(Math.max(0, Math.min(1, progress)));
  }, []);
  
  const finishLoading = React.useCallback(() => {
    setIsLoading(false);
    setLoadingProgress(1);
  }, []);
  
  return {
    isLoading,
    loadingProgress,
    nodeCount,
    startLoading,
    updateProgress,
    finishLoading,
  };
} 