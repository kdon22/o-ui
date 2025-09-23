/**
 * Parallel Node - Split Into Multiple Branches
 * 
 * Rectangular node that splits workflow execution into multiple parallel paths.
 * All output branches execute simultaneously.
 */

'use client';

import { Split, ArrowRight } from 'lucide-react';
import type { ParallelNode as ParallelNodeType } from '../../../types/workflow-builder';

interface ParallelNodeProps {
  node: ParallelNodeType;
  selected: boolean;
  readOnly: boolean;
  onUpdate: (updates: Partial<ParallelNodeType>) => void;
  onConnectionStart: (port?: string) => void;
  onClick: (event: React.MouseEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
  onMouseDown: (event: React.MouseEvent) => void;
}

export function ParallelNode({
  node,
  selected,
  readOnly,
  onUpdate,
  onConnectionStart,
  onClick,
  onDoubleClick,
  onMouseDown
}: ParallelNodeProps) {

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const width = node.size.width || 120;
  const height = node.size.height || 80;
  const cornerRadius = 8;
  const maxBranches = 4;
  const branchCount = Math.min(node.branches?.length || 2, maxBranches);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    // Input ports don't start connections
  };

  const handleBranchOutputClick = (branchIndex: number) => (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onConnectionStart(`branch-${branchIndex}`);
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
        stroke={selected ? "#3b82f6" : "#8b5cf6"}
        strokeWidth={selected ? "3" : "2"}
        rx={cornerRadius}
        ry={cornerRadius}
        className="cursor-move hover:stroke-violet-400 transition-colors"
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

      {/* Split Icon */}
      <g transform="translate(8, 6)">
        <Split size={16} stroke="#8b5cf6" />
      </g>

      {/* Label */}
      <text
        x={30}
        y={18}
        fontSize="13"
        fontWeight="600"
        fill="#374151"
        className="select-none pointer-events-none"
      >
        {node.label || 'Parallel'}
      </text>

      {/* Branch Count */}
      <text
        x={8}
        y={45}
        fontSize="11"
        fill="#6b7280"
        className="select-none pointer-events-none"
      >
        {branchCount} parallel branch{branchCount === 1 ? '' : 'es'}
      </text>

      {/* Parallel Execution Indicator */}
      <text
        x={width / 2}
        y={height - 12}
        textAnchor="middle"
        fontSize="10"
        fill="#8b5cf6"
        className="select-none pointer-events-none"
      >
        ALL EXECUTE
      </text>

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

      {/* Output Connection Points (Branches) */}
      {Array.from({ length: branchCount }, (_, index) => {
        const y = (height / (branchCount + 1)) * (index + 1);
        const portY = y;

        return (
          <g key={index}>
            {/* Branch Output Port */}
            <circle
              cx={width + 6}
              cy={portY}
              r="5"
              fill="white"
              stroke="#8b5cf6"
              strokeWidth="2"
              className="cursor-pointer hover:fill-violet-50 transition-colors"
              onClick={handleBranchOutputClick(index)}
            />

            {/* Branch Arrow */}
            <g transform={`translate(${width - 15}, ${portY - 6})`}>
              <ArrowRight size={12} stroke="#8b5cf6" />
            </g>

            {/* Branch Label */}
            <text
              x={width + 18}
              y={portY + 2}
              fontSize="9"
              fill="#8b5cf6"
              className="select-none pointer-events-none"
            >
              branch {index + 1}
            </text>
          </g>
        );
      })}

      {/* Visual Split Indicator */}
      <g transform={`translate(${width / 2 - 10}, 35)`} className="pointer-events-none">
        {/* Input line */}
        <line x1="10" y1="0" x2="10" y2="15" stroke="#8b5cf6" strokeWidth="2" />
        
        {/* Split junction */}
        <circle cx="10" cy="15" r="3" fill="#8b5cf6" />
        
        {/* Output branches */}
        {Array.from({ length: Math.min(branchCount, 3) }, (_, index) => {
          const angle = (index - (branchCount - 1) / 2) * (Math.PI / 6);
          const endX = 10 + Math.sin(angle) * 15;
          const endY = 15 + Math.cos(angle) * 15;
          
          return (
            <line 
              key={index}
              x1="10" 
              y1="15" 
              x2={endX} 
              y2={endY} 
              stroke="#8b5cf6" 
              strokeWidth="2"
            />
          );
        })}
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

