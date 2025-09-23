/**
 * Process Node - Business Process Execution
 * 
 * Rectangular node that represents a business process step.
 * Can contain multiple rules and has configurable timeout/retry settings.
 */

'use client';

import { Settings, Clock, RotateCcw, AlertTriangle } from 'lucide-react';
import type { ProcessNode as ProcessNodeType, Position } from '../../../types/workflow-builder';

interface ProcessNodeProps {
  node: ProcessNodeType;
  selected: boolean;
  readOnly: boolean;
  onUpdate: (updates: Partial<ProcessNodeType>) => void;
  onConnectionStart: (port?: string) => void;
  onStartDrag?: (nodeId: string, startPosition: Position, offset: Position) => void;
  onClick: (event: React.MouseEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
  onMouseDown: (event: React.MouseEvent) => void;
}

export function ProcessNode({
  node,
  selected,
  readOnly,
  onUpdate,
  onConnectionStart,
  onStartDrag,
  onClick,
  onDoubleClick,
  onMouseDown
}: ProcessNodeProps) {

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const width = node.size.width;
  const height = node.size.height;
  const cornerRadius = 8;

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    // Input ports don't start connections
  };

  const handleOutputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onConnectionStart('output');
    }
  };

  const handleErrorOutputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onConnectionStart('error');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <g transform={`translate(${node.position.x}, ${node.position.y})`}>
      
      {/* Main Rectangle */}
      <rect
        width={width}
        height={height}
        fill="white"
        stroke={selected ? "#3b82f6" : "#d1d5db"}
        strokeWidth={selected ? "3" : "2"}
        rx={cornerRadius}
        ry={cornerRadius}
        className="cursor-move hover:stroke-blue-300 transition-colors"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
      />

      {/* Header Background */}
      <rect
        width={width}
        height={28}
        fill="#f3f4f6"
        rx={cornerRadius}
        ry={cornerRadius}
        className="pointer-events-none"
      />
      <rect
        width={width}
        height={20}
        y={8}
        fill="#f3f4f6"
        className="pointer-events-none"
      />

      {/* Process Icon */}
      <g transform="translate(8, 6)">
        <Settings size={16} stroke="#6b7280" />
      </g>

      {/* Process Name */}
      <text
        x={30}
        y={18}
        fontSize="13"
        fontWeight="600"
        fill="#374151"
        className="select-none pointer-events-none"
      >
        {node.label || 'Process'}
      </text>

      {/* Process ID/Name */}
      {node.processName && (
        <text
          x={8}
          y={45}
          fontSize="11"
          fill="#6b7280"
          className="select-none pointer-events-none"
        >
          {node.processName}
        </text>
      )}

      {/* Rules Count */}
      {node.rules && node.rules.length > 0 && (
        <text
          x={8}
          y={60}
          fontSize="10"
          fill="#9ca3af"
          className="select-none pointer-events-none"
        >
          {node.rules.length} rule{node.rules.length === 1 ? '' : 's'}
        </text>
      )}

      {/* Timeout Indicator */}
      {node.timeout && (
        <g transform={`translate(${width - 50}, 35)`}>
          <Clock size={12} stroke="#f59e0b" />
          <text
            x={15}
            y={9}
            fontSize="10"
            fill="#f59e0b"
            className="select-none pointer-events-none"
          >
            {node.timeout}s
          </text>
        </g>
      )}

      {/* Retry Indicator */}
      {node.retryCount && node.retryCount > 0 && (
        <g transform={`translate(${width - 50}, 50)`}>
          <RotateCcw size={12} stroke="#8b5cf6" />
          <text
            x={15}
            y={9}
            fontSize="10"
            fill="#8b5cf6"
            className="select-none pointer-events-none"
          >
            x{node.retryCount}
          </text>
        </g>
      )}

      {/* Input Connection Point */}
      <circle
        cx={-6}
        cy={height / 2}
        r="6"
        fill="white"
        stroke="#3b82f6"
        strokeWidth="2"
        className="cursor-pointer hover:fill-blue-50 transition-colors"
        onClick={handleInputClick}
      />

      {/* Input Port Label */}
      <text
        x={-18}
        y={height / 2 + 2}
        fontSize="10"
        fill="#6b7280"
        className="select-none pointer-events-none"
        textAnchor="end"
      >
        in
      </text>

      {/* Output Connection Point */}
      <circle
        cx={width + 6}
        cy={height / 2}
        r="6"
        fill="white"
        stroke="#10b981"
        strokeWidth="2"
        className="cursor-pointer hover:fill-emerald-50 transition-colors"
        onClick={handleOutputClick}
      />

      {/* Output Port Label */}
      <text
        x={width + 18}
        y={height / 2 + 2}
        fontSize="10"
        fill="#6b7280"
        className="select-none pointer-events-none"
      >
        success
      </text>

      {/* Error Output Connection Point */}
      <circle
        cx={width + 6}
        cy={height - 15}
        r="5"
        fill="white"
        stroke="#ef4444"
        strokeWidth="2"
        className="cursor-pointer hover:fill-red-50 transition-colors"
        onClick={handleErrorOutputClick}
      />

      {/* Error Port Label */}
      <text
        x={width + 15}
        y={height - 11}
        fontSize="9"
        fill="#ef4444"
        className="select-none pointer-events-none"
      >
        error
      </text>

      {/* Error Icon */}
      <g transform={`translate(${width - 8}, ${height - 19})`}>
        <AlertTriangle size={10} stroke="#ef4444" />
      </g>

      {/* Selection Outline */}
      {selected && (
        <rect
          x={-5}
          y={-5}
          width={width + 10}
          height={height + 10}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          rx={cornerRadius + 2}
          ry={cornerRadius + 2}
          className="animate-pulse"
        />
      )}

    </g>
  );
}

