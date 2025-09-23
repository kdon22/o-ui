/**
 * End Node - Workflow Exit Point
 * 
 * Circular node that represents the end of a workflow.
 * Supports different exit types (success, failure, custom).
 */

'use client';

import { Square, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { EndNode as EndNodeType } from '../../../types/workflow-builder';

interface EndNodeProps {
  node: EndNodeType;
  selected: boolean;
  readOnly: boolean;
  onUpdate: (updates: Partial<EndNodeType>) => void;
  onConnectionStart: (port?: string) => void;
  onClick: (event: React.MouseEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
  onMouseDown: (event: React.MouseEvent) => void;
}

export function EndNode({
  node,
  selected,
  readOnly,
  onUpdate,
  onConnectionStart,
  onClick,
  onDoubleClick,
  onMouseDown
}: EndNodeProps) {

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const radius = 30;
  const centerX = node.position.x + radius;
  const centerY = node.position.y + radius;

  // ============================================================================
  // STYLING BASED ON ACTION TYPE
  // ============================================================================

  const getNodeStyle = () => {
    // Always use red color for end nodes as requested by user
    return {
      fill: '#ef4444', // Red color for all end nodes
      stroke: selected ? '#3b82f6' : '#dc2626',
      icon: Square
    };
  };

  const style = getNodeStyle();
  const IconComponent = style.icon;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    // End nodes don't typically start connections, but could be used for validation
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <g transform={`translate(${node.position.x}, ${node.position.y})`}>
      
      {/* Main Circle */}
      <circle
        cx={radius}
        cy={radius}
        r={radius}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={selected ? "3" : "2"}
        className="cursor-move hover:opacity-80 transition-opacity"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
      />

      {/* Icon */}
      <g transform={`translate(${radius - 8}, ${radius - 8})`}>
        <IconComponent 
          size={16} 
          fill="white" 
          stroke="none"
        />
      </g>

      {/* Label */}
      <text
        x={radius}
        y={radius * 2 + 15}
        textAnchor="middle"
        fontSize="12"
        fill="#374151"
        className="select-none pointer-events-none"
      >
        {node.label || 'End'}
      </text>

      {/* Action Type Indicator */}
      {node.action?.type && (
        <text
          x={radius}
          y={radius * 2 + 28}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
          className="select-none pointer-events-none"
        >
          {node.action.type}
        </text>
      )}

      {/* Action Message */}
      {node.action?.message && (
        <text
          x={radius}
          y={radius * 2 + 41}
          textAnchor="middle"
          fontSize="9"
          fill="#9ca3af"
          className="select-none pointer-events-none"
        >
          {node.action.message}
        </text>
      )}

      {/* Input Connection Point */}
      <circle
        cx={-6}
        cy={radius}
        r="6"
        fill="white"
        stroke={style.fill}
        strokeWidth="2"
        className="cursor-pointer hover:fill-gray-50 transition-colors"
        onClick={handleInputClick}
      />

      {/* Input Port Label */}
      <text
        x={-18}
        y={radius + 2}
        fontSize="10"
        fill="#6b7280"
        className="select-none pointer-events-none"
        textAnchor="end"
      >
        in
      </text>

      {/* Selection Outline */}
      {selected && (
        <circle
          cx={radius}
          cy={radius}
          r={radius + 5}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="animate-pulse"
        />
      )}

    </g>
  );
}

