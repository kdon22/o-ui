/**
 * Connection Help Overlay - User Instructions for Drawing Connections
 * 
 * Shows helpful instructions and visual feedback for the connection system.
 * Makes it clear how to draw lines between nodes.
 */

'use client';

import { useState } from 'react';
import { X, Info, Mouse, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';

interface ConnectionHelpOverlayProps {
  isConnecting: boolean;
  className?: string;
}

export function ConnectionHelpOverlay({ 
  isConnecting, 
  className 
}: ConnectionHelpOverlayProps) {
  const [showHelp, setShowHelp] = useState(true);
  const [showDetailedInstructions, setShowDetailedInstructions] = useState(false);

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        title="Show connection help"
      >
        <Info size={16} />
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50",
      className
    )}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Mouse size={16} className="text-blue-500" />
          <span className="font-medium text-sm">Connection Guide</span>
        </div>
        <button
          onClick={() => setShowHelp(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Current Status */}
      {isConnecting && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Drawing connection...</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Move mouse to target node and click to connect
          </p>
        </div>
      )}

      {/* Quick Instructions */}
      <div className="p-3 space-y-2">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          How to connect nodes:
        </div>
        
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 relative">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full absolute inset-0.5 animate-pulse" />
            </div>
            <span>Click the <strong>success</strong> port (green circle)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />
            <span>Drag to the target node's <strong>input</strong> port</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 relative">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute inset-0.5 opacity-60" />
            </div>
            <span>Release on the <strong>input</strong> port (blue circle)</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowDetailedInstructions(!showDetailedInstructions)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {showDetailedInstructions ? 'Hide' : 'Show'} detailed instructions
          </button>
        </div>
      </div>

      {/* Detailed Instructions */}
      {showDetailedInstructions && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
            
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Connection Ports:
              </div>
              <ul className="space-y-1 ml-2">
                <li>• <span className="text-green-600 font-medium">Green circles</span>: Success outputs</li>
                <li>• <span className="text-red-600 font-medium">Red circles</span>: Error outputs</li>
                <li>• <span className="text-blue-600 font-medium">Blue circles</span>: Input ports</li>
              </ul>
            </div>

            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Visual Feedback:
              </div>
              <ul className="space-y-1 ml-2">
                <li>• Ports <strong>pulse</strong> and <strong>scale up</strong> on hover</li>
                <li>• Cursor changes to <strong>crosshair</strong> on connection ports</li>
                <li>• <strong>Dotted line</strong> follows your mouse while connecting</li>
              </ul>
            </div>

            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Tips:
              </div>
              <ul className="space-y-1 ml-2">
                <li>• Start from the <strong>Start</strong> node's output</li>
                <li>• Connect processes in logical order</li>
                <li>• End at the <strong>End</strong> node's input</li>
                <li>• Multiple connections = <strong>Gateway auto-creation</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONNECTION STATUS INDICATOR
// ============================================================================

export function ConnectionStatusIndicator({ 
  isConnecting,
  sourceNodeName,
  sourcePort 
}: { 
  isConnecting: boolean;
  sourceNodeName?: string;
  sourcePort?: string;
}) {
  if (!isConnecting) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <span className="text-sm">
          Connecting from <strong>{sourceNodeName}</strong>
          {sourcePort && ` (${sourcePort})`}
        </span>
      </div>
      <div className="text-xs text-gray-300 mt-1 text-center">
        Click on target input port to complete connection
      </div>
    </div>
  );
}
