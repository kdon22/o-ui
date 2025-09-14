/**
 * Advanced Column Filter Component
 * 
 * Modern dropdown filter with immediate cursor focus and clean UX.
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { Button } from '@/components/ui';
import { Filter, X, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/drop-down-menu';
import type { ColumnFilterProps } from './types';

export const ColumnFilter: React.FC<ColumnFilterProps> = ({ 
  column, 
  value, 
  onChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when dropdown opens - with better timing
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Multiple approaches to ensure focus works
      const focusInput = () => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      };
      
      // Try immediately
      focusInput();
      
      // Also try with timeout as fallback
      setTimeout(focusInput, 100);
      
      // And with requestAnimationFrame
      requestAnimationFrame(focusInput);
    }
  }, [isOpen]);

  const handleClear = () => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      setIsOpen(false);
    }
  };

  // Handle dropdown opening to ensure focus
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Extra focus attempt when opening
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 150);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger 
        asChild
        className="!h-auto !w-auto !border-none !bg-transparent !shadow-none !p-0 !rounded-none hover:!bg-transparent focus:!ring-0 focus:!border-none"
      >
        <button
          className={cn(
            "p-0 hover:opacity-70 transition-opacity",
            value ? "text-blue-600" : "text-slate-400"
          )}
        >
          <Filter className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                Filter {column.header}
              </span>
            </div>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-auto p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Input */}
          <div className="p-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Type to filter ${column.header.toLowerCase()}...`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "placeholder:text-slate-400 transition-all"
                )}
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 rounded-b-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {value ? `Filtering by: "${value}"` : 'Enter text to filter'}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs">
                  Enter
                </kbd>
                <span>to apply</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs">
                  Esc
                </kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 