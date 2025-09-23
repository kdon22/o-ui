/**
 * Gateway Node Renderer - Visual representation of gateway nodes
 * 
 * Renders parallel and exclusive gateway nodes with professional styling.
 * Handles connection points and visual states for parallel execution flow.
 */

'use client';

import { useState, useCallback } from 'react';
import { MoreVertical, Zap, Route, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import type { 
  ParallelGatewayNode, 
  ExclusiveGatewayNode, 
  Position 
} from '../../types/workflow-builder';

interface GatewayNodeRendererProps {
  node: ParallelGatewayNode | ExclusiveGatewayNode;
  selected: boolean;
  onUpdate: (nodeId: string, updates: Partial<ParallelGatewayNode | ExclusiveGatewayNode>) => void;
  onSelect: (nodeId: string) => void;
  onStartConnection: (nodeId: string, port?: string) => void;
  onStartDrag?: (nodeId: string, startPosition: Position, offset: Position) => void;
  readOnly?: boolean;
}

export function GatewayNodeRenderer({
  node,
  selected,
  onUpdate,
  onSelect,
  onStartConnection,
  onStartDrag,
  readOnly = false
}: GatewayNodeRendererProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(node.id);
  }, [node.id, onSelect]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (readOnly) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    const startPosition = { x: node.position.x, y: node.position.y };
    onStartDrag?.(node.id, startPosition, offset);
  }, [readOnly, node.id, node.position, onStartDrag]);

  // Connection port handlers
  const handleInputPortClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    // Input ports don't start connections
  }, []);

  const handleOutputPortClick = useCallback((event: React.MouseEvent, portIndex?: number) => {
    event.stopPropagation();
    if (!readOnly) {
      const port = portIndex !== undefined ? `out-${portIndex}` : 'output';
      onStartConnection(node.id, port);
    }
  }, [readOnly, node.id, onStartConnection]);

  // ============================================================================
  // VISUAL STYLING
  // ============================================================================

  const getGatewayColors = () => {
    if (node.type === 'parallel-gateway') {
      return {
        main: selected ? '#8b5cf6' : '#a855f7',
        accent: selected ? '#7c3aed' : '#9333ea',
        bg: selected ? '#f3f4f6' : '#ffffff',
        icon: '#ffffff'
      };
    } else {
      return {
        main: selected ? '#f59e0b' : '#f97316',
        accent: selected ? '#d97706' : '#ea580c',
        bg: selected ? '#fef3c7' : '#ffffff',
        icon: '#ffffff'
      };
    }
  };

  const colors = getGatewayColors();

  // ============================================================================
  // GEOMETRY CALCULATIONS
  // ============================================================================

  const getDiamondPath = (size: number) => {
    const half = size / 2;
    return `M ${half} 0 L ${size} ${half} L ${half} ${size} L 0 ${half} Z`;
  };

  // Calculate connection port positions
  const getPortPositions = () => {
    const size = 60; // Gateway node size
    const half = size / 2;
    
    return {
      input: { x: half, y: 0 }, // Top input
      outputs: [
        { x: size, y: half }, // Right output 1
        { x: half, y: size }, // Bottom output 2
        { x: 0, y: half }     // Left output 3 (if needed)
      ]
    };
  };

  const ports = getPortPositions();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <g
      className={cn(
        "workflow-gateway-node cursor-pointer transition-all duration-200",
        selected && "drop-shadow-lg",
        isHovering && !readOnly && "scale-105"
      )}
      transform={`translate(${node.position.x}, ${node.position.y})`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setShowMenu(false);
      }}
    >
      {/* Selection Ring */}
      {selected && (
        <path
          d={getDiamondPath(68)}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeDasharray="8,4"
          opacity={0.6}
          className="animate-pulse pointer-events-none"
          transform="translate(-4, -4)"
        />
      )}

      {/* Main Diamond Shape */}
      <path
        d={getDiamondPath(60)}
        fill={colors.bg}
        stroke={colors.main}
        strokeWidth={selected ? 3 : 2}
        className="transition-all duration-200"
        style={{
          filter: selected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))'
        }}
      />

      {/* Gradient Accent */}
      <defs>
        <linearGradient 
          id={`gateway-gradient-${node.id}`} 
          x1="0%" 
          y1="0%" 
          x2="100%" 
          y2="100%"
        >
          <stop offset="0%" stopColor={colors.main} stopOpacity={0.8} />
          <stop offset="100%" stopColor={colors.accent} stopOpacity={0.6} />
        </linearGradient>
      </defs>

      <path
        d={getDiamondPath(56)}
        fill={`url(#gateway-gradient-${node.id})`}
        opacity={0.1}
        className="pointer-events-none"
        transform="translate(2, 2)"
      />

      {/* Center Icon */}
      <g transform="translate(30, 30)">
        {node.type === 'parallel-gateway' ? (
          <>
            {/* Parallel bars icon */}
            <rect x="-8" y="-12" width="3" height="24" fill={colors.icon} rx="1" />
            <rect x="-3" y="-12" width="3" height="24" fill={colors.icon} rx="1" />
            <rect x="2" y="-12" width="3" height="24" fill={colors.icon} rx="1" />
            <rect x="7" y="-12" width="3" height="24" fill={colors.icon} rx="1" />
            {/* Plus symbol */}
            <circle cx="0" cy="0" r="20" fill={colors.main} opacity={0.9} />
            <rect x="-8" y="-2" width="16" height="4" fill={colors.icon} rx="2" />
            <rect x="-2" y="-8" width="4" height="16" fill={colors.icon} rx="2" />
          </>
        ) : (
          <>
            {/* Exclusive gateway (X) */}
            <circle cx="0" cy="0" r="20" fill={colors.main} opacity={0.9} />
            <path 
              d="M -8 -8 L 8 8 M 8 -8 L -8 8" 
              stroke={colors.icon} 
              strokeWidth="3" 
              strokeLinecap="round"
            />
          </>
        )}
      </g>

      {/* Execution Mode Badge */}
      {node.type === 'parallel-gateway' && (
        <g transform="translate(45, 8)">
          <circle cx="0" cy="0" r="8" fill={colors.accent} />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill={colors.icon}
            className="select-none pointer-events-none font-semibold"
          >
            {node.executionMode === 'all' ? '⊗' : 
             node.executionMode === 'first' ? '◌' : '◐'}
          </text>
        </g>
      )}

      {/* Connection Ports */}
      
      {/* Input Port (Top) */}
      <g transform={`translate(${ports.input.x}, ${ports.input.y})`}>
        <circle
          cx="0"
          cy="0"
          r="4"
          fill={colors.bg}
          stroke={colors.main}
          strokeWidth="2"
          className={cn(
            "transition-all duration-200",
            !readOnly && "hover:scale-125 hover:fill-blue-100"
          )}
          onClick={handleInputPortClick}
        />
      </g>

      {/* Output Ports */}
      {ports.outputs.map((port, index) => (
        <g key={index} transform={`translate(${port.x}, ${port.y})`}>
          <circle
            cx="0"
            cy="0"
            r="4"
            fill={colors.main}
            stroke={colors.accent}
            strokeWidth="2"
            className={cn(
              "cursor-pointer transition-all duration-200",
              !readOnly && "hover:scale-125 hover:fill-green-400"
            )}
            onClick={(e) => handleOutputPortClick(e, index)}
          />
          {/* Port Label */}
          <text
            x="0"
            y="-12"
            textAnchor="middle"
            fontSize="8"
            fill={colors.main}
            className="select-none pointer-events-none"
          >
            {index === 0 ? 'A' : index === 1 ? 'B' : 'C'}
          </text>
        </g>
      ))}

      {/* Node Label */}
      <text
        x="30"
        y="75"
        textAnchor="middle"
        fontSize="11"
        fill="#374151"
        className="select-none pointer-events-none font-medium"
      >
        {node.label}
      </text>

      {/* Type Badge */}
      <text
        x="30"
        y="88"
        textAnchor="middle"
        fontSize="9"
        fill="#6b7280"
        className="select-none pointer-events-none"
      >
        {node.type === 'parallel-gateway' ? 'PARALLEL' : 'EXCLUSIVE'}
      </text>

      {/* Context Menu Trigger */}
      {(isHovering || selected) && !readOnly && (
        <g
          transform="translate(50, 10)"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <circle cx="0" cy="0" r="8" fill="white" stroke="#d1d5db" strokeWidth="1" />
          <MoreVertical size={10} x="-5" y="-5" stroke="#6b7280" />
        </g>
      )}

      {/* Context Menu */}
      {showMenu && !readOnly && (
        <g transform="translate(60, 20)">
          <rect
            x="0"
            y="0"
            width="120"
            height="80"
            fill="white"
            stroke="#d1d5db"
            strokeWidth="1"
            rx="4"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
          />
          
          {/* Settings */}
          <g 
            className="cursor-pointer hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open settings modal
              setShowMenu(false);
            }}
          >
            <rect x="8" y="8" width="104" height="20" fill="transparent" />
            <Settings size={12} x="12" y="14" stroke="#6b7280" />
            <text x="30" y="22" fontSize="10" fill="#374151" className="select-none">
              Settings
            </text>
          </g>

          {/* Configure */}
          <g 
            className="cursor-pointer hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open configuration
              setShowMenu(false);
            }}
          >
            <rect x="8" y="28" width="104" height="20" fill="transparent" />
            <Route size={12} x="12" y="34" stroke="#6b7280" />
            <text x="30" y="42" fontSize="10" fill="#374151" className="select-none">
              Configure
            </text>
          </g>

          {/* Delete */}
          <g 
            className="cursor-pointer hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Delete node
              setShowMenu(false);
            }}
          >
            <rect x="8" y="48" width="104" height="20" fill="transparent" />
            <Trash2 size={12} x="12" y="54" stroke="#ef4444" />
            <text x="30" y="62" fontSize="10" fill="#ef4444" className="select-none">
              Delete
            </text>
          </g>
        </g>
      )}
    </g>
  );
}
