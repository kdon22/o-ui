import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import type { ConditionalOption } from '../use-conditional-options';

// ============================================================================
// TYPES
// ============================================================================
interface SearchableSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: ConditionalOption[];
  placeholder?: string;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  className?: string;
  maxHeight?: number;
  searchable?: boolean; // Enable/disable search functionality
}

// ============================================================================
// SEARCHABLE SELECT COMPONENT
// ============================================================================
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  loading = false,
  error = null,
  disabled = false,
  className,
  maxHeight = 200,
  searchable = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query (only if searchable)
  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchQuery) return options;
    
    const query = searchQuery.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(query) ||
      option.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery, searchable]);

  // Get selected option label
  const selectedOption = options.find(option => option.value === value);
  const selectedLabel = selectedOption?.label || '';

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens (only if searchable)
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (disabled || loading) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  const handleOptionClick = (option: ConditionalOption) => {
    if (option.disabled) return;
    
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-left',
          'border border-gray-300 rounded-md shadow-sm bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          error && 'border-red-500',
          isOpen && 'ring-2 ring-blue-500 border-transparent'
        )}
      >
        <div className="flex items-center flex-1 min-w-0">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-400" />}
          {error && <AlertCircle className="h-4 w-4 mr-2 text-red-500" />}
          
          <span className={cn(
            'truncate',
            !selectedLabel && 'text-gray-400'
          )}>
            {selectedLabel || placeholder}
          </span>
        </div>
        
        <div className="flex items-center ml-2">
          {value && !disabled && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange('');
                }
              }}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Clear selection"
            >
              <X className="h-3 w-3" />
            </div>
          )}
          <ChevronDown className={cn(
            'h-4 w-4 text-gray-400 transition-transform ml-1',
            isOpen && 'transform rotate-180'
          )} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          'absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}>
          {/* Search Input - only show if searchable */}
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div 
            className="max-h-60 overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading options...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-6 text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!loading && !error && filteredOptions.length === 0 && (
              <div className="py-6 text-center text-gray-500">
                <span className="text-sm">
                  {searchable && searchQuery ? 'No matching options found' : 'No options available'}
                </span>
              </div>
            )}

            {!loading && !error && filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option)}
                disabled={option.disabled}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                  'disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-white',
                  value === option.value && 'bg-blue-50 text-blue-700'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <span className="text-blue-600 text-xs">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
