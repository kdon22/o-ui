/**
 * Gateway Toolbar - Manual Gateway Creation Tools
 * 
 * Provides UI controls for manually creating and managing gateway nodes.
 * Includes drag-and-drop creation and quick action buttons.
 */

'use client';

import { useState } from 'react';
import { Zap, Route, Info, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import type { Position } from '../../types/workflow-builder';

interface GatewayToolbarProps {
  onCreateGateway: (type: 'parallel-gateway' | 'exclusive-gateway', position: Position) => string;
  className?: string;
}

export function GatewayToolbar({ onCreateGateway, className }: GatewayToolbarProps) {
  const [draggedType, setDraggedType] = useState<'parallel-gateway' | 'exclusive-gateway' | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // ============================================================================
  // DRAG HANDLERS
  // ============================================================================

  const handleDragStart = (
    event: React.DragEvent,
    type: 'parallel-gateway' | 'exclusive-gateway'
  ) => {
    setDraggedType(type);
    
    const dragData = {
      type: 'gateway',
      gatewayType: type,
      name: type === 'parallel-gateway' ? 'Parallel Gateway' : 'Exclusive Gateway'
    };
    
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedType(null);
  };

  // ============================================================================
  // QUICK CREATE HANDLERS
  // ============================================================================

  const handleQuickCreate = (type: 'parallel-gateway' | 'exclusive-gateway') => {
    // Create at a default position (center-ish)
    const defaultPosition: Position = { x: 400, y: 200 };
    onCreateGateway(type, defaultPosition);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm",
      className
    )}>
      
      {/* Toolbar Title */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Route size={14} />
        Gateway Tools
      </div>

      {/* Gateway Creation Buttons */}
      <div className="grid grid-cols-2 gap-2">
        
        {/* Parallel Gateway */}
        <div className="relative">
          <button
            draggable
            onDragStart={(e) => handleDragStart(e, 'parallel-gateway')}
            onDragEnd={handleDragEnd}
            onMouseEnter={() => setShowTooltip('parallel')}
            onMouseLeave={() => setShowTooltip(null)}
            onClick={() => handleQuickCreate('parallel-gateway')}
            className={cn(
              "w-full h-16 flex flex-col items-center justify-center gap-1",
              "border border-purple-200 dark:border-purple-800 rounded-md",
              "hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300",
              "transition-all duration-200 cursor-grab active:cursor-grabbing",
              "text-purple-600 dark:text-purple-400",
              draggedType === 'parallel-gateway' && "scale-95 opacity-50"
            )}
          >
            {/* Diamond with parallel bars */}
            <div className="relative">
              <div className="w-6 h-6 border-2 border-purple-500 transform rotate-45 bg-white dark:bg-gray-800"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-purple-500"></div>
                <div className="w-0.5 h-3 bg-purple-500 absolute"></div>
              </div>
            </div>
            <span className="text-xs font-medium">Parallel</span>
          </button>

          {/* Tooltip */}
          {showTooltip === 'parallel' && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50">
              Run multiple processes simultaneously
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
            </div>
          )}
        </div>

        {/* Exclusive Gateway */}
        <div className="relative">
          <button
            draggable
            onDragStart={(e) => handleDragStart(e, 'exclusive-gateway')}
            onDragEnd={handleDragEnd}
            onMouseEnter={() => setShowTooltip('exclusive')}
            onMouseLeave={() => setShowTooltip(null)}
            onClick={() => handleQuickCreate('exclusive-gateway')}
            className={cn(
              "w-full h-16 flex flex-col items-center justify-center gap-1",
              "border border-orange-200 dark:border-orange-800 rounded-md",
              "hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300",
              "transition-all duration-200 cursor-grab active:cursor-grabbing",
              "text-orange-600 dark:text-orange-400",
              draggedType === 'exclusive-gateway' && "scale-95 opacity-50"
            )}
          >
            {/* Diamond with X */}
            <div className="relative">
              <div className="w-6 h-6 border-2 border-orange-500 transform rotate-45 bg-white dark:bg-gray-800"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-orange-500 text-xs font-bold transform -rotate-45">×</div>
              </div>
            </div>
            <span className="text-xs font-medium">Exclusive</span>
          </button>

          {/* Tooltip */}
          {showTooltip === 'exclusive' && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50">
              Choose one path based on conditions
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          onClick={() => {
            // TODO: Show gateway help/tutorial
          }}
        >
          <Info size={12} />
          Help
        </button>
        
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
          <span>Drag to canvas</span>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded border">
        <div className="font-medium mb-1">How to use:</div>
        <ul className="space-y-1 text-xs">
          <li>• <strong>Click:</strong> Add at default position</li>
          <li>• <strong>Drag:</strong> Drop anywhere on canvas</li>
          <li>• <strong>Auto:</strong> Connect multiple processes</li>
        </ul>
      </div>
    </div>
  );
}
