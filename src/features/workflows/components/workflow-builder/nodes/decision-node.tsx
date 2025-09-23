/**
 * Decision Node - Conditional Branching
 * 
 * Diamond-shaped node that represents conditional logic.
 * Has one input and two outputs (true/false paths).
 */

'use client';

import { GitBranch, CheckCircle, XCircle } from 'lucide-react';
import type { DecisionNode as DecisionNodeType } from '../../../types/workflow-builder';

interface DecisionNodeProps {
  node: DecisionNodeType;
  selected: boolean;
  readOnly: boolean;
  onUpdate: (updates: Partial<DecisionNodeType>) => void;
  onConnectionStart: (port?: string) => void;
  onClick: (event: React.MouseEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
  onMouseDown: (event: React.MouseEvent) => void;
}

export function DecisionNode({
  node,
  selected,
  readOnly,
  onUpdate,
  onConnectionStart,
  onClick,
  onDoubleClick,
  onMouseDown
}: DecisionNodeProps) {

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const size = 80; // Diamond size
  const centerX = node.position.x + size / 2;
  const centerY = node.position.y + size / 2;

  // Diamond path points
  const diamondPath = `
    M ${size / 2} 5
    L ${size - 5} ${size / 2}
    L ${size / 2} ${size - 5}
    L 5 ${size / 2}
    Z
  `;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    // Input ports don't start connections
  };

  const handleTrueOutputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onConnectionStart('true');
    }
  };

  const handleFalseOutputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onConnectionStart('false');
    }
  };

  // ============================================================================
  // CONDITION TEXT
  // ============================================================================

  const getConditionText = () => {
    if (node.condition.type === 'rule' && node.condition.ruleId) {
      return 'Rule Check';
    }
    if (node.condition.type === 'expression') {
      const expr = node.condition.value;
      return expr.length > 12 ? expr.substring(0, 12) + '...' : expr;
    }
    return node.condition.value || 'Condition';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <g transform={`translate(${node.position.x}, ${node.position.y})`}>
      
      {/* Main Diamond */}
      <path
        d={diamondPath}
        fill="white"
        stroke={selected ? "#3b82f6" : "#f59e0b"}
        strokeWidth={selected ? "3" : "2"}
        className="cursor-move hover:stroke-amber-400 transition-colors"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
      />

      {/* Decision Icon */}
      <g transform={`translate(${size / 2 - 8}, ${size / 2 - 16})`}>
        <GitBranch size={16} stroke="#f59e0b" />
      </g>

      {/* Condition Text */}
      <text
        x={size / 2}
        y={size / 2 + 6}
        textAnchor="middle"
        fontSize="10"
        fontWeight="500"
        fill="#374151"
        className="select-none pointer-events-none"
      >
        {getConditionText()}
      </text>

      {/* Label Below */}
      <text
        x={size / 2}
        y={size + 15}
        textAnchor="middle"
        fontSize="12"
        fill="#374151"
        className="select-none pointer-events-none"
      >
        {node.label || 'Decision'}
      </text>

      {/* Condition Type Indicator */}
      <text
        x={size / 2}
        y={size + 28}
        textAnchor="middle"
        fontSize="10"
        fill="#6b7280"
        className="select-none pointer-events-none"
      >
        {node.condition.type}
      </text>

      {/* Input Connection Point (Top) */}
      <circle
        cx={size / 2}
        cy={-1}
        r="6"
        fill="white"
        stroke="#3b82f6"
        strokeWidth="2"
        className="cursor-pointer hover:fill-blue-50 transition-colors"
        onClick={handleInputClick}
      />

      {/* Input Port Label */}
      <text
        x={size / 2}
        y={-8}
        fontSize="10"
        fill="#6b7280"
        className="select-none pointer-events-none"
        textAnchor="middle"
      >
        in
      </text>

      {/* True Output Connection Point (Right) */}
      <circle
        cx={size + 1}
        cy={size / 2}
        r="6"
        fill="white"
        stroke="#10b981"
        strokeWidth="2"
        className="cursor-pointer hover:fill-emerald-50 transition-colors"
        onClick={handleTrueOutputClick}
      />

      {/* True Output Icon */}
      <g transform={`translate(${size - 2}, ${size / 2 - 8})`}>
        <CheckCircle size={12} stroke="#10b981" fill="white" />
      </g>

      {/* True Port Label */}
      <text
        x={size + 15}
        y={size / 2 - 8}
        fontSize="10"
        fill="#10b981"
        className="select-none pointer-events-none"
      >
        TRUE
      </text>

      {/* False Output Connection Point (Left) */}
      <circle
        cx={-1}
        cy={size / 2}
        r="6"
        fill="white"
        stroke="#ef4444"
        strokeWidth="2"
        className="cursor-pointer hover:fill-red-50 transition-colors"
        onClick={handleFalseOutputClick}
      />

      {/* False Output Icon */}
      <g transform={`translate(${-10}, ${size / 2 - 8})`}>
        <XCircle size={12} stroke="#ef4444" fill="white" />
      </g>

      {/* False Port Label */}
      <text
        x={-15}
        y={size / 2 - 8}
        fontSize="10"
        fill="#ef4444"
        className="select-none pointer-events-none"
        textAnchor="end"
      >
        FALSE
      </text>

      {/* Selection Outline */}
      {selected && (
        <path
          d={`
            M ${size / 2} 0
            L ${size} ${size / 2}
            L ${size / 2} ${size}
            L 0 ${size / 2}
            Z
          `}
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

