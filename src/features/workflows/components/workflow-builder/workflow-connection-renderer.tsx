/**
 * Workflow Connection Renderer - Connection Lines Between Nodes
 * 
 * Renders connection lines between workflow nodes with smooth curves.
 * Handles selection, labels, and different connection types.
 */

'use client';

import { X } from 'lucide-react';
import type { WorkflowConnectionProps } from '../../types/workflow-builder';

export function WorkflowConnectionRenderer({
  connection,
  sourceNode,
  targetNode,
  selected,
  onSelect,
  onDelete,
  readOnly = false
}: WorkflowConnectionProps) {

  // ============================================================================
  // CONNECTION POINTS CALCULATION
  // ============================================================================

  const getConnectionPoints = () => {
    // Source point (output of source node)
    let sourceX = sourceNode.position.x + sourceNode.size.width;
    let sourceY = sourceNode.position.y + sourceNode.size.height / 2;

    // Target point (input of target node)  
    let targetX = targetNode.position.x;
    let targetY = targetNode.position.y + targetNode.size.height / 2;

    // Adjust for specific node types and ports
    if (sourceNode.type === 'start') {
      sourceX = sourceNode.position.x + 60; // Start node output port
      sourceY = sourceNode.position.y + 30;
    }

    if (sourceNode.type === 'decision') {
      if (connection.sourcePort === 'true') {
        sourceX = sourceNode.position.x + 80; // Right side for TRUE
        sourceY = sourceNode.position.y + 40;
      } else if (connection.sourcePort === 'false') {
        sourceX = sourceNode.position.x; // Left side for FALSE
        sourceY = sourceNode.position.y + 40;
      }
    }

    if (sourceNode.type === 'process' && connection.sourcePort === 'error') {
      sourceY = sourceNode.position.y + sourceNode.size.height - 15; // Error port
    }

    if (sourceNode.type === 'parallel') {
      // Multiple output ports for parallel node
      const branchIndex = connection.sourcePort?.match(/branch-(\d+)/)?.[1];
      if (branchIndex) {
        const idx = parseInt(branchIndex);
        const branchCount = sourceNode.branches?.length || 2;
        sourceY = sourceNode.position.y + (sourceNode.size.height / (branchCount + 1)) * (idx + 1);
      }
    }

    if (targetNode.type === 'end') {
      targetX = targetNode.position.x; // Left side input
      targetY = targetNode.position.y + 30;
    }

    if (targetNode.type === 'decision') {
      targetX = targetNode.position.x + 40; // Top input
      targetY = targetNode.position.y;
    }

    if (targetNode.type === 'merge') {
      // Multiple input ports for merge node  
      const inputIndex = connection.targetPort?.match(/in-(\d+)/)?.[1] || '0';
      const idx = parseInt(inputIndex);
      const inputCount = 4; // Max inputs
      targetY = targetNode.position.y + (targetNode.size.height / (inputCount + 1)) * (idx + 1);
    }

    return { sourceX, sourceY, targetX, targetY };
  };

  const { sourceX, sourceY, targetX, targetY } = getConnectionPoints();

  // ============================================================================
  // PATH GENERATION
  // ============================================================================

  const generatePath = () => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;

    // Use smooth bezier curves for better visual flow
    const controlDistance = Math.max(Math.abs(dx) * 0.5, 50);
    
    const controlX1 = sourceX + controlDistance;
    const controlY1 = sourceY;
    const controlX2 = targetX - controlDistance;
    const controlY2 = targetY;

    return `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`;
  };

  // ============================================================================
  // STYLING
  // ============================================================================

  const getConnectionStyle = () => {
    // Different colors for different connection types
    if (connection.sourcePort === 'error') {
      return { stroke: '#ef4444', strokeWidth: selected ? 3 : 2 };
    }
    if (connection.sourcePort === 'false') {
      return { stroke: '#ef4444', strokeWidth: selected ? 3 : 2 };
    }
    if (connection.sourcePort === 'true') {
      return { stroke: '#10b981', strokeWidth: selected ? 3 : 2 };
    }
    if (connection.sourcePort?.startsWith('branch-')) {
      return { stroke: '#8b5cf6', strokeWidth: selected ? 3 : 2 };
    }
    
    // Default connection style
    return { 
      stroke: selected ? '#3b82f6' : '#6b7280', 
      strokeWidth: selected ? 3 : 2 
    };
  };

  const style = getConnectionStyle();

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(connection.id);
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onDelete(connection.id);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const pathData = generatePath();
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  return (
    <g className="workflow-connection">
      
      {/* Main Connection Path */}
      <path
        d={pathData}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleClick}
        markerEnd="url(#arrowhead)"
      />

      {/* Selection Indicator */}
      {selected && (
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={style.strokeWidth + 2}
          strokeDasharray="8,4"
          opacity={0.5}
          className="animate-pulse pointer-events-none"
        />
      )}

      {/* Connection Label */}
      {connection.label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x="-20"
            y="-8"
            width="40"
            height="16"
            fill="white"
            stroke="#d1d5db"
            strokeWidth="1"
            rx="8"
            className="pointer-events-none"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#374151"
            className="select-none pointer-events-none"
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Port Type Label */}
      {(connection.sourcePort === 'true' || connection.sourcePort === 'false' || connection.sourcePort === 'error') && (
        <g transform={`translate(${sourceX + 10}, ${sourceY - 5})`}>
          <text
            fontSize="9"
            fill={style.stroke}
            className="select-none pointer-events-none"
          >
            {connection.sourcePort.toUpperCase()}
          </text>
        </g>
      )}

      {/* Delete Button (when selected and not readonly) */}
      {selected && !readOnly && (
        <g 
          transform={`translate(${midX - 8}, ${midY - 8})`}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleDeleteClick}
        >
          <circle
            cx="8"
            cy="8"
            r="10"
            fill="#ef4444"
            stroke="white"
            strokeWidth="2"
          />
          <X size={12} stroke="white" x="2" y="2" />
        </g>
      )}

      {/* Arrow Marker Definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={style.stroke}
          />
        </marker>
      </defs>

    </g>
  );
}

