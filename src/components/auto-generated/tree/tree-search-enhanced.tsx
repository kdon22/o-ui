/**
 * Enhanced Tree Search Component - Real data integration
 * 
 * This component wraps the existing TreeSearch with real search functionality
 * by accepting search results as props from the parent component.
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Clock, Folder } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { SearchResult } from './tree-search';

export interface TreeSearchEnhancedProps {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  onSelectResult?: (result: SearchResult) => void;
  searchResults?: SearchResult[];
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const TreeSearchEnhanced: React.FC<TreeSearchEnhancedProps> = ({
  onSearch,
  onClear,
  onSelectResult,
  searchResults = [],
  isLoading = false,
  placeholder = "Search nodes...",
  disabled = false,
  className
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.getElementById('tree-search-input') as HTMLInputElement;
        searchInput?.focus();
        setIsExpanded(true);
      }
      
      // Escape to clear search
      if (event.key === 'Escape' && isFocused) {
        handleClear();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  // ============================================================================
  // SEARCH LOGIC
  // ============================================================================
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    onSearch?.(value);
    setIsExpanded(!!value.trim());
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setIsExpanded(false);
    setIsFocused(false);
    onClear?.();
  }, [onClear]);

  const handleResultSelect = useCallback((result: SearchResult) => {
    // Add to recent searches
    setRecentSearches(prev => {
      const updated = [result.name, ...prev.filter(item => item !== result.name)];
      return updated.slice(0, 5); // Keep only 5 recent searches
    });
    
    setQuery(result.name);
    setIsExpanded(false);
    onSelectResult?.(result);
  }, [onSelectResult]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (query.trim()) {
      setIsExpanded(true);
    }
  }, [query]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay collapse to allow for result selection
    setTimeout(() => {
      setIsExpanded(false);
    }, 200);
  }, []);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  const renderSearchResults = () => {
    if (!isExpanded) return null;

    const hasResults = searchResults.length > 0;
    const hasQuery = query.trim().length > 0;

    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
        {/* Search Results */}
        {hasQuery && (
          <div className="p-2">
            {isLoading ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto mb-2"></div>
                Searching...
              </div>
            ) : hasResults ? (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                  Search Results
                </div>
                {searchResults.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultSelect(result)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md text-left transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <Folder className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate text-gray-900">
                        {result.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {result.path}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {result.type}
                      </span>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="p-3 text-sm text-gray-500 text-center">
                No results found for "{query}"
              </div>
            )}
          </div>
        )}

        {/* Recent Searches */}
        {!hasQuery && recentSearches.length > 0 && (
          <div className="p-2 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
              Recent Searches
            </div>
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleSearchChange(search)}
                className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md text-left transition-colors"
              >
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{search}</span>
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!hasQuery && recentSearches.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            Start typing to search nodes...
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          id="tree-search-input"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="pl-10 pr-8 h-9 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 h-9 w-8 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>
      {renderSearchResults()}
    </div>
  );
}; 