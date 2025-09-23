/**
 * Process Node - Business Process Execution
 * 
 * Rectangular node that represents a business process step.
 * Displays process name, type, and associated rules count.
 */

'use client';

import { Settings, AlertTriangle } from 'lucide-react';
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
      onConnectionStart('success');
    }
  };

  const handleOutputMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onConnectionStart('success');
    }
  };

  const handleErrorOutputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onConnectionStart('error');
    }
  };

  const handleErrorOutputMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onConnectionStart('error');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <g 
      transform={`translate(${node.position.x}, ${node.position.y})`}
      data-node-id={node.id}
    >
      
      {/* Main Rectangle - Grey Body */}
      <rect
        width={width}
        height={height}
        fill="#f9fafb"
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

      {/* Process Name in Header */}
      <text
        x={30}
        y={18}
        fontSize="13"
        fontWeight="600"
        fill="#374151"
        className="select-none pointer-events-none"
      >
        {node.processName || node.label?.replace(' -process', '') || 'Process'}
      </text>

      {/* Process Type in Grey Body */}
      {node.processType && (
        <text
          x={width / 2}
          y={height / 2 + 10}
          fontSize="12"
          fontWeight="500"
          fill="#4b5563"
          textAnchor="middle"
          className="select-none pointer-events-none"
        >
          {node.processType}
        </text>
      )}

      {/* Rules Count */}
      {node.rules && node.rules.length > 0 && (
        <text
          x={8}
          y={height - 8}
          fontSize="10"
          fill="#9ca3af"
          className="select-none pointer-events-none"
        >
          {node.rules.length} rule{node.rules.length === 1 ? '' : 's'}
        </text>
      )}


      {/* Input Connection Point */}
      <circle
        cx={-6}
        cy={height / 2}
        r="6"
        fill="white"
        stroke="#3b82f6"
        strokeWidth="2"
        className="cursor-pointer hover:fill-blue-50 hover:stroke-blue-600 transition-all duration-200 hover:scale-110"
        onClick={handleInputClick}
        data-port-type="input"
        title="Connection input port"
      />
      
      {/* Input Port Indicator */}
      <circle
        cx={-6}
        cy={height / 2}
        r="3"
        fill="#3b82f6"
        className="pointer-events-none opacity-60"
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
      <g className="group">
        <circle
          cx={width + 6}
          cy={height / 2}
          r="6"
          fill="white"
          stroke="#10b981"
          strokeWidth="2"
          className="cursor-pointer hover:fill-emerald-50 hover:stroke-emerald-600 transition-colors"
          onClick={handleOutputClick}
          onMouseDown={handleOutputMouseDown}
          title="Drag to connect to another node"
        />
        
        {/* Success Port Indicator */}
        <circle
          cx={width + 6}
          cy={height / 2}
          r="3"
          fill="#10b981"
          className="pointer-events-none"
        />
      </g>

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
      <g className="group">
        <circle
          cx={width + 6}
          cy={height - 15}
          r="5"
          fill="white"
          stroke="#ef4444"
          strokeWidth="2"
          className="cursor-pointer hover:fill-red-50 hover:stroke-red-600 transition-colors"
          onClick={handleErrorOutputClick}
          onMouseDown={handleErrorOutputMouseDown}
          title="Drag to connect error handling"
        />
        
        {/* Error Port Indicator */}
        <circle
          cx={width + 6}
          cy={height - 15}
          r="2"
          fill="#ef4444"
          className="pointer-events-none"
        />
      </g>

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
        />
      )}

    </g>
  );
}

