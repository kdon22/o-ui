/**
 * Workflow Grid - Background Grid for Canvas
 * 
 * Renders a grid background that helps with node alignment.
 * Supports different grid sizes and zoom levels.
 */

'use client';

import type { Viewport } from '../../types/workflow-builder';

interface WorkflowGridProps {
  viewport: Viewport;
  gridSize: number;
  show: boolean;
}

export function WorkflowGrid({ viewport, gridSize, show }: WorkflowGridProps) {
  if (!show) return null;

  // ============================================================================
  // GRID CALCULATIONS
  // ============================================================================

  const scaledGridSize = gridSize * viewport.zoom;
  
  // Calculate grid offset based on viewport position
  const offsetX = viewport.x % scaledGridSize;
  const offsetY = viewport.y % scaledGridSize;

  // Grid opacity based on zoom level
  const getGridOpacity = () => {
    if (viewport.zoom < 0.5) return 0.1;
    if (viewport.zoom < 1) return 0.2;
    if (viewport.zoom < 2) return 0.3;
    return 0.4;
  };

  // Grid line thickness based on zoom level
  const getStrokeWidth = () => {
    if (viewport.zoom < 0.5) return 0.5;
    if (viewport.zoom < 1) return 1;
    return 1;
  };

  const opacity = getGridOpacity();
  const strokeWidth = getStrokeWidth();

  // ============================================================================
  // PATTERN DEFINITION
  // ============================================================================

  const patternId = 'workflow-grid-pattern';

  return (
    <defs>
      <pattern
        id={patternId}
        x={offsetX}
        y={offsetY}
        width={scaledGridSize}
        height={scaledGridSize}
        patternUnits="userSpaceOnUse"
      >
        {/* Major grid lines (every 5th line) */}
        {scaledGridSize >= 20 && (
          <>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={scaledGridSize}
              stroke="#e5e7eb"
              strokeWidth={strokeWidth * 1.5}
              opacity={opacity * 1.5}
            />
            <line
              x1="0"
              y1="0"
              x2={scaledGridSize}
              y2="0"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth * 1.5}
              opacity={opacity * 1.5}
            />
          </>
        )}

        {/* Minor grid lines */}
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={scaledGridSize}
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
        <line
          x1="0"
          y1="0"
          x2={scaledGridSize}
          y2="0"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          opacity={opacity}
        />

        {/* Dot grid pattern (for small zoom levels) */}
        {scaledGridSize >= 10 && scaledGridSize < 30 && (
          <circle
            cx={scaledGridSize / 2}
            cy={scaledGridSize / 2}
            r="1"
            fill="#d1d5db"
            opacity={opacity}
          />
        )}

        {/* Grid dots at intersections (for larger zoom levels) */}
        {scaledGridSize >= 30 && (
          <>
            <circle cx="0" cy="0" r="1.5" fill="#d1d5db" opacity={opacity * 1.2} />
            <circle 
              cx={scaledGridSize} 
              cy="0" 
              r="1.5" 
              fill="#d1d5db" 
              opacity={opacity * 1.2} 
            />
            <circle 
              cx="0" 
              cy={scaledGridSize} 
              r="1.5" 
              fill="#d1d5db" 
              opacity={opacity * 1.2} 
            />
            <circle 
              cx={scaledGridSize} 
              cy={scaledGridSize} 
              r="1.5" 
              fill="#d1d5db" 
              opacity={opacity * 1.2} 
            />
          </>
        )}
      </pattern>

      {/* Apply the pattern to a large rectangle covering the entire canvas */}
      <rect
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
        fill={`url(#${patternId})`}
        className="pointer-events-none"
      />
    </defs>
  );
}

