/**
 * Base Cell Editor - Foundation for all cell editors
 * 
 * Features:
 * - Common keyboard handling
 * - Save/cancel functionality
 * - Auto-focus management
 * - Error state handling
 * - Base styling
 */

"use client";

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/generalUtils';

// Utilities
import { 
  handleCommonKeyboardPatterns, 
  preventDefaultNavigation 
} from '../utils/keyboard-utils';

// Types
import { BaseCellEditorProps } from '../types';

export const BaseCellEditor: React.FC<BaseCellEditorProps> = ({
  value,
  column,
  onChange,
  onSave,
  onCancel,
  isValid = true,
  error,
  autoFocus = true,
  className,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // KEYBOARD HANDLING
  // ============================================================================

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const handled = handleCommonKeyboardPatterns(event, {
      onSave: () => {
        if (isValid) {
          onSave();
        }
      },
      onCancel: () => {
        onCancel();
      }
    });

    if (!handled) {
      // Allow normal typing and editing
      return;
    }
  };

  // ============================================================================
  // FOCUS MANAGEMENT
  // ============================================================================

  useEffect(() => {
    if (autoFocus && containerRef.current) {
      // Focus the first input/select/textarea in the container
      const focusableElement = containerRef.current.querySelector(
        'input, select, textarea'
      ) as HTMLElement;
      
      if (focusableElement) {
        focusableElement.focus();
        
        // Select text for easy editing
        if (focusableElement instanceof HTMLInputElement && 
            focusableElement.type === 'text') {
          focusableElement.select();
        }
      }
    }
  }, [autoFocus]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full min-h-[32px] flex items-center",
        "bg-white border-2 border-blue-500 rounded",
        "focus-within:ring-1 focus-within:ring-blue-500/20",
        !isValid && "border-red-500",
        className
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Main editor content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Error indicator */}
      {!isValid && error && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-600 bg-white px-1 rounded shadow-sm border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
};
