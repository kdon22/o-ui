/**
 * Table Tree Selector - Schema-driven table categorization
 * Professional tree view with real categories from table-categories.schema.ts
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Database, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/generalUtils';
import { useEnterpriseActionQuery } from '@/hooks/use-enterprise-action-api';

interface DataTable {
  id: string;
  name: string;
  tableName?: string;
  description?: string;
  isActive: boolean;
  categoryId?: string;
}

interface TableCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  tables: DataTable[];
  isExpanded: boolean;
}

interface TableTreeSelectorProps {
  tables: DataTable[];
  selectedTableId: string;
  onTableSelect: (tableId: string) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function TableTreeSelector({ 
  tables, 
  selectedTableId, 
  onTableSelect, 
  isLoading = false,
  compact = false
}: TableTreeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch table categories from schema
  const { data: categoriesResult, isLoading: categoriesLoading } = useEnterpriseActionQuery(
    'tableCategory.list',
    {},
    { 
      staleTime: 300000,
      refetchOnWindowFocus: false
    }
  );

  const availableCategories = useMemo(() => {
    return categoriesResult?.success ? (categoriesResult.data || []) : [];
  }, [categoriesResult]);

  // Group tables by their actual categories
  const categorizedTables = useMemo(() => {
    const categoryMap = new Map<string, any>();
    
    // Create category entries from schema
    availableCategories.forEach(category => {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        tables: [],
        isExpanded: expandedCategories.has(category.id)
      });
    });

    // Add uncategorized category
    const uncategorizedId = 'uncategorized';
    categoryMap.set(uncategorizedId, {
      id: uncategorizedId,
      name: 'Uncategorized',
      description: 'Tables without a category',
      icon: 'folder',
      tables: [],
      isExpanded: expandedCategories.has(uncategorizedId)
    });

    // Distribute tables into categories
    tables.forEach(table => {
      const categoryId = table.categoryId || uncategorizedId;
      const category = categoryMap.get(categoryId);
      if (category) {
        category.tables.push(table);
      } else {
        // Fallback to uncategorized if category not found
        categoryMap.get(uncategorizedId)?.tables.push(table);
      }
    });

    // Return only categories with tables, sorted by name
    return Array.from(categoryMap.values())
      .filter(category => category.tables.length > 0)
      .sort((a, b) => {
        // Put uncategorized last
        if (a.id === 'uncategorized') return 1;
        if (b.id === 'uncategorized') return -1;
        return a.name.localeCompare(b.name);
      });
  }, [tables, availableCategories, expandedCategories]);

  // Filter categories and tables based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categorizedTables;

    return categorizedTables.map(category => ({
      ...category,
      tables: category.tables.filter(table =>
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(category => category.tables.length > 0);
  }, [categorizedTables, searchTerm]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleTableSelect = (table: DataTable) => {
    onTableSelect(table.id);
  };

  if (isLoading || categoriesLoading) {
    return (
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded animate-pulse ml-4" />
        <div className="h-6 bg-gray-200 rounded animate-pulse ml-4" />
        <div className="h-6 bg-gray-200 rounded animate-pulse ml-4" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search */}
      <Input
        placeholder={compact ? "Search..." : "Search tables and categories..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={cn("text-sm", compact && "text-xs")}
      />

      {/* Tree Structure */}
      <div className={cn(
        "space-y-1 overflow-y-auto",
        compact ? "max-h-48" : "max-h-64"
      )}>
        {filteredCategories.map((category) => (
          <div key={category.id}>
            {/* Category Header */}
            <div
              className={cn(
                "flex items-center gap-1 rounded cursor-pointer hover:bg-gray-50 transition-colors",
                compact ? "p-1 text-xs" : "p-2 text-sm",
                "font-medium"
              )}
              onClick={() => toggleCategory(category.id)}
            >
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "p-0",
                  compact ? "h-3 w-3" : "h-4 w-4"
                )}
              >
                {category.isExpanded ? (
                  <ChevronDown className={compact ? "h-2 w-2" : "h-3 w-3"} />
                ) : (
                  <ChevronRight className={compact ? "h-2 w-2" : "h-3 w-3"} />
                )}
              </Button>
              
              {category.isExpanded ? (
                <FolderOpen className={compact ? "h-3 w-3 text-blue-500" : "h-4 w-4 text-blue-500"} />
              ) : (
                <Folder className={compact ? "h-3 w-3 text-gray-500" : "h-4 w-4 text-gray-500"} />
              )}
              
              <span 
                className={cn(
                  "flex-1 truncate",
                  compact && "max-w-[60px]"
                )}
                title={category.name}
              >
                {category.name}
              </span>
              
              {!compact && (
                <Badge variant="secondary" className="text-xs">
                  {category.tables.length}
                </Badge>
              )}
              {compact && (
                <span className="text-xs text-muted-foreground min-w-[16px] text-center">
                  {category.tables.length}
                </span>
              )}
            </div>

            {/* Category Tables */}
            {category.isExpanded && (
              <div className={compact ? "ml-4 space-y-0.5" : "ml-6 space-y-1"}>
                {category.tables.map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      "flex items-center gap-1 rounded cursor-pointer transition-colors group",
                      compact ? "p-1 hover:bg-gray-50" : "p-2 hover:bg-gray-50",
                      selectedTableId === table.id 
                        ? "bg-blue-50 text-blue-900 border border-blue-200" 
                        : "text-gray-700"
                    )}
                    onClick={() => handleTableSelect(table)}
                    title={compact ? `${table.name}${table.description ? ` - ${table.description}` : ''}` : undefined}
                  >
                    <div className={compact ? "w-2" : "w-4"} /> {/* Spacer for alignment */}
                    
                    <Database className={cn(
                      "text-green-500",
                      compact ? "h-3 w-3" : "h-4 w-4"
                    )} />
                    
                    <div className="flex-1 min-w-0">
                      <div 
                        className={cn(
                          "font-medium truncate",
                          compact ? "text-xs max-w-[80px]" : "text-sm"
                        )}
                        title={table.name}
                      >
                        {table.name}
                      </div>
                      {table.description && !compact && (
                        <div className="text-xs text-gray-500 truncate">
                          {table.description}
                        </div>
                      )}
                    </div>
                    
                    {selectedTableId === table.id && (
                      <div className={cn(
                        "bg-blue-500 rounded-full",
                        compact ? "w-1.5 h-1.5" : "w-2 h-2"
                      )} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Table className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {searchTerm ? 'No tables found matching your search' : 'No tables available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
