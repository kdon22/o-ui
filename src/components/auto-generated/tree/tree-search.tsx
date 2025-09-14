/**
 * Tree Search Component - Integrated search for AutoTree
 * 
 * Features:
 * - Real-time search filtering
 * - Keyboard shortcuts (Ctrl/Cmd + K)
 * - Search history and recent searches
 * - Mobile-first responsive design
 * - Integration with AutoTree filtering
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Clock, Folder } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchResult {
  id: string;
  name: string;
  path: string;
  type: string;
  level: number;
}

export interface TreeSearchProps {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  onSelectResult?: (result: SearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TreeSearch: React.FC<TreeSearchProps> = ({
  onSearch,
  onClear,
  onSelectResult,
  placeholder = "Search nodes...",
  disabled = false,
  className
}) => {
  // ============================================================================
  // STATE
  // ============================================================================
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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
    
    // Mock search results - TODO: Replace with real search via ActionClient
    if (value.trim()) {
      const mockResults: SearchResult[] = [
        {
          id: '2',
          name: 'Finance Department',
          path: '/root/finance',
          type: 'NODE',
          level: 1
        },
        {
          id: '4',
          name: 'Accounting',
          path: '/root/finance/accounting',
          type: 'NODE',
          level: 2
        },
        {
          id: '5',
          name: 'Billing',
          path: '/root/finance/billing',
          type: 'NODE',
          level: 2
        }
      ].filter(result => 
        result.name.toLowerCase().includes(value.toLowerCase()) ||
        result.path.toLowerCase().includes(value.toLowerCase())
      );
      
      setSearchResults(mockResults);
      setIsExpanded(true);
    } else {
      setSearchResults([]);
      setIsExpanded(false);
    }
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchResults([]);
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
    if (query.trim() || recentSearches.length > 0) {
      setIsExpanded(true);
    }
  }, [query, recentSearches]);

  const handleBlur = useCallback(() => {
    // Delay hiding to allow clicks on results
    setTimeout(() => {
      setIsFocused(false);
      setIsExpanded(false);
    }, 150);
  }, []);

  // ============================================================================
  // RENDER SEARCH RESULTS
  // ============================================================================
  const renderSearchResults = () => {
    if (!isExpanded) return null;

    return (
      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Results
            </div>
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultSelect(result)}
                className="w-full text-left p-2 hover:bg-muted/50 rounded-sm flex items-center gap-2 group"
              >
                <Folder className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{result.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{result.path}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Recent Searches */}
        {!query.trim() && recentSearches.length > 0 && (
          <div className="p-2 border-t border-border">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Recent
            </div>
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleSearchChange(search)}
                className="w-full text-left p-2 hover:bg-muted/50 rounded-sm flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{search}</span>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {query.trim() && searchResults.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No results found for "{query}"
          </div>
        )}

        {/* Keyboard Shortcut Hint */}
        <div className="p-2 border-t border-border text-xs text-muted-foreground text-center">
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to close
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="tree-search-input"
          type="text"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-9 h-9 text-sm"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
        
        {/* Keyboard shortcut hint */}
        {!isFocused && !query && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs font-mono">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {renderSearchResults()}
    </div>
  );
}; 