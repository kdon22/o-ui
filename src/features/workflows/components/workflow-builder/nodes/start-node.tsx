/**
 * Start Node - Workflow Entry Point
 * 
 * Circular node that represents the start of a workflow.
 * Supports different trigger types (manual, scheduled, event).
 */

'use client';

import { Play } from 'lucide-react';
import type { StartNode as StartNodeType } from '../../../types/workflow-builder';

interface StartNodeProps {
  node: StartNodeType;
  selected: boolean;
  readOnly: boolean;
  onUpdate: (updates: Partial<StartNodeType>) => void;
  onConnectionStart: (port?: string) => void;
  onClick: (event: React.MouseEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
  onMouseDown: (event: React.MouseEvent) => void;
}

export function StartNode({
  node,
  selected,
  readOnly,
  onUpdate,
  onConnectionStart,
  onClick,
  onDoubleClick,
  onMouseDown
}: StartNodeProps) {

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const radius = 30;
  const centerX = node.position.x + radius;
  const centerY = node.position.y + radius;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleOutputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onConnectionStart('output');
    }
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
        fill="#10b981"
        stroke={selected ? "#3b82f6" : "#059669"}
        strokeWidth={selected ? "3" : "2"}
        className="cursor-move hover:stroke-emerald-400 transition-colors"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
      />

      {/* Icon */}
      <g transform={`translate(${radius - 8}, ${radius - 8})`}>
        <Play 
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
        {node.label || 'Start'}
      </text>

      {/* Trigger Type Indicator */}
      {node.trigger && (
        <text
          x={radius}
          y={radius * 2 + 28}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
          className="select-none pointer-events-none"
        >
          {node.trigger.type}
        </text>
      )}

      {/* Output Connection Point */}
      <circle
        cx={radius * 2}
        cy={radius}
        r="6"
        fill="white"
        stroke="#10b981"
        strokeWidth="2"
        className="cursor-pointer hover:fill-emerald-50 transition-colors"
        onClick={handleOutputClick}
      />

      {/* Output Port Label */}
      <text
        x={radius * 2 + 12}
        y={radius + 2}
        fontSize="10"
        fill="#6b7280"
        className="select-none pointer-events-none"
      >
        out
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

