/**
 * Merge Node - Combine Multiple Branches
 * 
 * Rectangular node that merges multiple parallel branches back together.
 * Can wait for all branches or proceed when any branch completes.
 */

'use client';

import { Merge, Users, User } from 'lucide-react';
import type { MergeNode as MergeNodeType } from '../../../types/workflow-builder';

interface MergeNodeProps {
  node: MergeNodeType;
  selected: boolean;
  readOnly: boolean;
  onUpdate: (updates: Partial<MergeNodeType>) => void;
  onConnectionStart: (port?: string) => void;
  onClick: (event: React.MouseEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
  onMouseDown: (event: React.MouseEvent) => void;
}

export function MergeNode({
  node,
  selected,
  readOnly,
  onUpdate,
  onConnectionStart,
  onClick,
  onDoubleClick,
  onMouseDown
}: MergeNodeProps) {

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const width = node.size.width || 120;
  const height = node.size.height || 80;
  const cornerRadius = 8;
  const maxInputs = 4;
  const inputCount = maxInputs; // Fixed for visual consistency

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputClick = (inputIndex: number) => (event: React.MouseEvent) => {
    event.stopPropagation();
    // Input ports don't start connections
  };

  const handleOutputClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!readOnly) {
      onConnectionStart('output');
    }
  };

  const toggleWaitMode = () => {
    if (!readOnly) {
      onUpdate({ waitForAll: !node.waitForAll });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const WaitIcon = node.waitForAll ? Users : User;
  const waitText = node.waitForAll ? 'ALL' : 'ANY';
  const waitColor = node.waitForAll ? '#059669' : '#d97706';

  return (
    <g transform={`translate(${node.position.x}, ${node.position.y})`}>
      
      {/* Main Rectangle */}
      <rect
        width={width}
        height={height}
        fill="white"
        stroke={selected ? "#3b82f6" : "#059669"}
        strokeWidth={selected ? "3" : "2"}
        rx={cornerRadius}
        ry={cornerRadius}
        className="cursor-move hover:stroke-emerald-400 transition-colors"
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

      {/* Merge Icon */}
      <g transform="translate(8, 6)">
        <Merge size={16} stroke="#059669" />
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
        {node.label || 'Merge'}
      </text>

      {/* Wait Mode Indicator */}
      <g 
        transform="translate(8, 35)" 
        className="cursor-pointer hover:opacity-70 transition-opacity"
        onClick={toggleWaitMode}
      >
        <WaitIcon size={14} stroke={waitColor} />
        <text
          x={18}
          y={10}
          fontSize="11"
          fill={waitColor}
          className="select-none"
        >
          Wait for {waitText}
        </text>
      </g>

      {/* Strategy Description */}
      <text
        x={width / 2}
        y={height - 12}
        textAnchor="middle"
        fontSize="9"
        fill="#6b7280"
        className="select-none pointer-events-none"
      >
        {node.waitForAll ? 'All branches must complete' : 'First branch to complete'}
      </text>

      {/* Input Connection Points */}
      {Array.from({ length: inputCount }, (_, index) => {
        const y = (height / (inputCount + 1)) * (index + 1);
        const portY = y;

        return (
          <g key={index}>
            {/* Input Port */}
            <circle
              cx={-6}
              cy={portY}
              r="5"
              fill="white"
              stroke="#059669"
              strokeWidth="2"
              className="cursor-pointer hover:fill-emerald-50 transition-colors"
              onClick={handleInputClick(index)}
            />

            {/* Input Label */}
            <text
              x={-18}
              y={portY + 2}
              fontSize="9"
              fill="#059669"
              className="select-none pointer-events-none"
              textAnchor="end"
            >
              in {index + 1}
            </text>
          </g>
        );
      })}

      {/* Output Connection Point */}
      <circle
        cx={width + 6}
        cy={height / 2}
        r="6"
        fill="white"
        stroke="#059669"
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
        out
      </text>

      {/* Visual Merge Indicator */}
      <g transform={`translate(${width / 2 - 10}, 35)`} className="pointer-events-none">
        {/* Input branches */}
        {Array.from({ length: Math.min(inputCount, 3) }, (_, index) => {
          const angle = (index - (inputCount - 1) / 2) * (Math.PI / 6);
          const startX = 10 - Math.sin(angle) * 15;
          const startY = 0 - Math.cos(angle) * 15;
          
          return (
            <line 
              key={index}
              x1={startX} 
              y1={startY} 
              x2="10" 
              y2="15" 
              stroke="#059669" 
              strokeWidth="2"
            />
          );
        })}
        
        {/* Merge junction */}
        <circle cx="10" cy="15" r="3" fill="#059669" />
        
        {/* Output line */}
        <line x1="10" y1="15" x2="10" y2="30" stroke="#059669" strokeWidth="2" />
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

