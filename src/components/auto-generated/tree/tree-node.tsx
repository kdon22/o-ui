/**
 * TreeNode Component - Individual node rendering with enhanced icons and animations
 * 
 * Features:
 * - Professional Lucide React icons (Home, Folder, FileText)
 * - Smooth animations with Framer Motion
 * - Dotted lines connecting to parent
 * - Expand/collapse controls
 * - Selection highlighting
 * - Context menu support
 * - Performance optimized with React.memo
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight,
  Building2,
  User,
  Settings,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import { TreeNodeData } from './auto-tree';

// ============================================================================
// TYPES
// ============================================================================

export interface TreeNodeProps {
  node: TreeNodeData;
  level: number;
  isRoot: boolean;
  hasChildren: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  onClick: (node: TreeNodeData) => void;
  onExpand: (node: TreeNodeData) => void;
  onContextMenu: (node: TreeNodeData, event: React.MouseEvent) => void;
}

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const NodeIcon: React.FC<{ isRoot: boolean; hasChildren: boolean; isExpanded: boolean; nodeType: string }> = ({ 
  isRoot, 
  hasChildren, 
  isExpanded,
  nodeType 
}) => {
  const iconSize = "w-4 h-4";
  
  if (isRoot) {
    return (
      <motion.div 
        className="flex items-center justify-center text-red-600"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Home className={iconSize} />
      </motion.div>
    );
  }
  
  if (hasChildren) {
    return (
      <motion.div 
        className="flex items-center justify-center text-blue-600"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {isExpanded ? <FolderOpen className={iconSize} /> : <Folder className={iconSize} />}
      </motion.div>
    );
  }
  
  // Different icons based on node type
  const getLeafIcon = () => {
    switch (nodeType?.toLowerCase()) {
      case 'customer':
        return <User className={iconSize} />;
      case 'office':
        return <Building2 className={iconSize} />;
      case 'settings':
        return <Settings className={iconSize} />;
      case 'database':
        return <Database className={iconSize} />;
      default:
        return <FileText className={iconSize} />;
    }
  };
  
  return (
    <motion.div 
      className="flex items-center justify-center text-gray-600"
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {getLeafIcon()}
    </motion.div>
  );
};

const ExpandToggle: React.FC<{ 
  hasChildren: boolean; 
  isExpanded: boolean; 
  onToggle: () => void;
}> = ({ hasChildren, isExpanded, onToggle }) => {
  if (!hasChildren) {
    return <div className="w-4 h-4" />; // Spacer for alignment
  }
  
  return (
    <motion.button
      className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-sm hover:bg-gray-100"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      type="button"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{ rotate: isExpanded ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight className="w-3 h-3" />
      </motion.div>
    </motion.button>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TreeNode: React.FC<TreeNodeProps> = React.memo(({
  node,
  level,
  isRoot,
  hasChildren,
  isSelected,
  isExpanded,
  onClick,
  onExpand,
  onContextMenu
}) => {
  const indent = level * 20;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(node);
  };
  
  const handleExpandToggle = () => {
    onExpand(node);
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(node, e);
  };
  
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      layout
    >
      {/* Dotted connection line to parent */}
      {level > 0 && (
        <div 
          className="absolute border-l border-dotted border-gray-300"
          style={{ 
            left: `${indent - 10}px`,
            top: 0,
            bottom: '50%',
            width: '1px'
          }}
        />
      )}
      
      {/* Horizontal connection line */}
      {level > 0 && (
        <div 
          className="absolute border-t border-dotted border-gray-300"
          style={{ 
            left: `${indent - 10}px`,
            top: '50%',
            width: '10px',
            height: '1px'
          }}
        />
      )}
      
      {/* Main node container */}
      <motion.div 
        className={cn(
          "flex items-center py-1 px-2 cursor-pointer transition-colors group relative",
          "hover:bg-gray-50 active:bg-gray-100 rounded-md",
          isSelected && "bg-blue-50 border-r-2 border-blue-500",
          isRoot && "font-medium"
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-level={level + 1}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Expand/collapse toggle */}
        <ExpandToggle 
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggle={handleExpandToggle}
        />
        
        {/* Node icon */}
        <div className="mr-2 flex-shrink-0">
          <NodeIcon 
            isRoot={isRoot}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            nodeType={node.type}
          />
        </div>
        
        {/* Node name */}
        <span className={cn(
          "text-sm truncate flex-1 select-none",
          isRoot && "text-red-800 font-medium",
          isSelected && "text-blue-800"
        )}>
          {node.name}
        </span>
        
        {/* Node badges/indicators */}
        {hasChildren && (
          <motion.span 
            className="ml-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 px-1.5 py-0.5 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            {node.childCount || 0}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.hasChildren === nextProps.hasChildren &&
    prevProps.node.name === nextProps.node.name &&
    prevProps.node.childCount === nextProps.node.childCount
  );
});

TreeNode.displayName = 'TreeNode'; 