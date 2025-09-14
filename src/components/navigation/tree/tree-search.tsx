/**
 * Tree Search Component
 * 
 * Provides fuzzy search functionality for tree navigation with:
 * - Instant search with debouncing
 * - Search result highlighting
 * - Path display for context
 * - Keyboard navigation support
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { TreeSearchProps, TreeSearchResult, TreeNode } from './tree-types';

// Simple utility function for className merging
function cn(...classes: (string | undefined | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// TREE SEARCH COMPONENT
// ============================================================================

export function TreeSearch({
  config,
  query,
  results,
  loading,
  onSearch,
  onResultClick,
  onClear,
  className
}: TreeSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearch(value);
    setSelectedIndex(-1);
  }, [onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          onResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClear();
        setSelectedIndex(-1);
        break;
    }
  }, [results, selectedIndex, onResultClick, onClear]);

  const handleClear = useCallback(() => {
    onClear();
    setSelectedIndex(-1);
  }, [onClear]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const hasQuery = query.length >= config.minQueryLength;
  const hasResults = results.length > 0;
  const showResults = hasQuery && (hasResults || !loading);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderSearchResult = useCallback((result: TreeSearchResult, index: number) => {
    const isSelected = index === selectedIndex;
    const { node, path } = result;

    return (
      <button
        key={node.id}
        className={cn(
          'w-full p-2 text-left hover:bg-muted/50 rounded-sm transition-colors',
          'flex items-center gap-2 min-h-[40px]',
          isSelected && 'bg-muted'
        )}
        onClick={() => onResultClick(result)}
        onMouseEnter={() => setSelectedIndex(index)}
      >
        {/* Node Icon */}
        <div className={cn(
          'w-4 h-4 flex-shrink-0 rounded-sm flex items-center justify-center text-xs',
          node.color === 'blue' && 'bg-blue-100 text-blue-600',
          node.color === 'green' && 'bg-green-100 text-green-600',
          node.color === 'orange' && 'bg-orange-100 text-orange-600',
          !node.color && 'bg-gray-100 text-gray-600'
        )}>
          {node.icon === 'folder' && '📁'}
          {node.icon === 'file' && '📄'}
          {!node.icon && '🔍'}
        </div>

        {/* Node Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {node.name}
          </div>
          
          {/* Path breadcrumb */}
          {path.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              {path.slice(0, -1).map((pathNode, pathIndex) => (
                <React.Fragment key={pathNode.id}>
                  {pathIndex > 0 && <span className="w-3 h-3">›</span>}
                  <span className="truncate max-w-[60px]">
                    {pathNode.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Node Type Badge */}
        {node.type && (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border">
            {node.type}
          </span>
        )}
      </button>
    );
  }, [selectedIndex, onResultClick]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={config.placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (isFocused || selectedIndex >= 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg">
          <ScrollArea className="max-h-[300px]">
            <div className="p-2 space-y-1">
              {loading && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              )}
              
              {!loading && hasResults && (
                <>
                  {results.slice(0, config.maxResults).map((result, index) =>
                    renderSearchResult(result, index)
                  )}
                  {results.length > config.maxResults && (
                    <div className="p-2 text-center text-xs text-muted-foreground border-t">
                      Showing {config.maxResults} of {results.length} results
                    </div>
                  )}
                </>
              )}
              
              {!loading && !hasResults && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
} 