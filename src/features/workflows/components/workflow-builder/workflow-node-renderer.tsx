/**
 * Workflow Node Renderer - Node Type Router
 * 
 * Renders different types of workflow nodes based on their type.
 * Handles common node behavior like selection, dragging, and connections.
 */

'use client';

import { useCallback } from 'react';
import { ProcessNode } from './nodes/process-node';
import { StartNode } from './nodes/start-node';
import { EndNode } from './nodes/end-node';
import { GatewayNodeRenderer } from './gateway-node-renderer';
import type { WorkflowNodeProps } from '../../types/workflow-builder';

export function WorkflowNodeRenderer({
  node,
  selected,
  onUpdate,
  onSelect,
  onStartConnection,
  onStartDrag,
  readOnly = false
}: WorkflowNodeProps) {

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(node.id);
  }, [node.id, onSelect]);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    // TODO: Open node properties dialog
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (readOnly) return;
    
    // Calculate the offset within the node element for smooth dragging
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const offset = {
      x: event.clientX - rect.left, // Mouse position relative to the node element
      y: event.clientY - rect.top   // Mouse position relative to the node element
    };
    
    // Start dragging the node
    onStartDrag?.(node.id, node.position, offset);
  }, [node.id, node.position, readOnly]);

  const handleConnectionStart = useCallback((port?: string) => {
    if (!readOnly) {
      onStartConnection(node.id, port);
    }
  }, [node.id, onStartConnection, readOnly]);

  // ============================================================================
  // COMMON PROPS
  // ============================================================================

  const commonProps = {
    node,
    selected,
    readOnly,
    onUpdate: (updates: any) => onUpdate(node.id, updates),
    onConnectionStart: handleConnectionStart,
    onStartDrag,
    onClick: handleClick,
    onDoubleClick: handleDoubleClick,
    onMouseDown: handleMouseDown
  };

  // ============================================================================
  // NODE TYPE RENDERING - SUPPORTS ALL NODE TYPES
  // ============================================================================

  const renderNode = () => {
    // Handle different node types
    switch (node.type) {
      case 'start':
        return <StartNode {...commonProps} node={node as any} />;
      
      case 'end':
        return <EndNode {...commonProps} node={node as any} />;
      
      case 'process':
        return <ProcessNode {...commonProps} node={node as any} />;
      
      case 'parallel-gateway':
      case 'exclusive-gateway':
        return (
          <GatewayNodeRenderer 
            node={node as any}
            selected={selected}
            onUpdate={onUpdate}
            onSelect={onSelect}
            onStartConnection={onStartConnection}
            onStartDrag={onStartDrag}
            readOnly={readOnly}
          />
        );
      
      default:
        // Default fallback for unknown node types
        return (
          <g transform={`translate(${node.position.x}, ${node.position.y})`}>
            <rect
              width={node.size.width}
              height={node.size.height}
              fill="#f3f4f6"
              stroke="#d1d5db"
              strokeWidth="2"
              rx="4"
            />
            <text
              x={node.size.width / 2}
              y={node.size.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6b7280"
              fontSize="12"
            >
              {node.label || node.type}
            </text>
          </g>
        );
    }
  };

  return (
    <g 
      className="workflow-node"
      style={{ 
        cursor: readOnly ? 'default' : 'move',
        filter: selected ? 'drop-shadow(0 0 8px #3b82f6)' : undefined
      }}
    >
      {renderNode()}
    </g>
  );
}

