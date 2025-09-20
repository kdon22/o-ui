'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { 
  Button,
  Badge,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  SearchField
} from '@/components/ui';
import { 
  Plus, 
  ChevronRight,
  ChevronDown,
  Star,
  Table,
  Folder
} from 'lucide-react';
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { useBranchContextWithLoading } from '@/lib/context/branch-context';
import { useTableInitializer } from '@/lib/data-tables/table-initializer';

interface WorkspaceSidebarProps {
  className?: string;
  onTableSelect?: (tableId: string) => void;
  selectedTableId?: string;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  className,
  onTableSelect,
  selectedTableId
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [creatingItem, setCreatingItem] = useState<{
    type: 'category' | 'table';
    parentCategoryId?: string;
  } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const branchContext = useBranchContextWithLoading();

  // Load categories and tables separately
  const { data: categoriesResponse } = useActionQuery('tableCategory.list', {}, {
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: tablesResponse } = useActionQuery('tables.list', {}, {
    staleTime: 5 * 60 * 1000,
  });

  const createCategory = useActionMutation('tableCategory.create');
  const createTable = useActionMutation('tables.create');
  const { initializeTable, isInitializing } = useTableInitializer();
  
  const categories = (categoriesResponse?.data || []) as any[];
  const tables = (tablesResponse?.data || []) as any[];
  const allItems = [...categories, ...tables];
  
  // Filter items based on search query
  const filteredCategories = categories.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTables = tables.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // If searching, show all matching items regardless of category
  const isSearching = searchQuery.trim().length > 0;
  
  // For normal view (no search)
  const starredItems = allItems.filter((item: any) => starredIds.has(item.id));
  const rootTables = tables.filter((table: any) => !table.categoryId);
  const getTablesForCategory = (categoryId: string) => 
    tables.filter((table: any) => table.categoryId === categoryId);
  
  // For search view - get categories that have matching tables
  const categoriesWithMatchingTables = categories.filter((category: any) => {
    const categoryTables = tables.filter((table: any) => table.categoryId === category.id);
    return categoryTables.some((table: any) => 
      table.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleToggleStar = (id: string) => {
    setStarredIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const startCreating = (type: 'category' | 'table', parentCategoryId?: string) => {
    setCreatingItem({ type, parentCategoryId });
    setNewItemName('');
    
    // Auto-expand the category when adding a table to it
    if (type === 'table' && parentCategoryId) {
      setExpandedCategories(prev => new Set([...prev, parentCategoryId]));
    }
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim() || !branchContext || !creatingItem) return;
    
    const basePayload = {
      name: newItemName.trim(),
      tenantId: branchContext.tenantId,
      branchId: branchContext.currentBranchId
    };

    if (creatingItem.type === 'category') {
      const payload = {
        ...basePayload,
        icon: '📁',
        isActive: true
      };
      await createCategory.mutateAsync(payload);
    } else {
      // Generate a stable UUID client-side so optimistic list and server share the same ID
      const newTableId = (typeof crypto !== 'undefined' && (crypto as any)?.randomUUID)
        ? (crypto as any).randomUUID()
        : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const payload = {
        ...basePayload,
        id: newTableId,
        icon: '📊',
        isActive: true,
        ...(creatingItem.parentCategoryId && { categoryId: creatingItem.parentCategoryId })
      };

      // 🚀 Create table with Airtable-like structure
      const result = await createTable.mutateAsync(payload);
      
      // Initialize with 4 columns × 4 rows
      if (result?.data?.id) {
        await initializeTable(result.data.id);
        // Immediately select the new table using the stable id
        onTableSelect?.(result.data.id);
        console.log('🎉 Table created with Airtable-like structure!');
      }
    }
    
    setNewItemName('');
    setCreatingItem(null);
  };

  const cancelCreating = () => {
    setCreatingItem(null);
    setNewItemName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateItem();
    } else if (e.key === 'Escape') {
      cancelCreating();
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header with unified creation */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Workspace</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={cn(
                  "p-2 rounded-md transition-all duration-200",
                  "hover:bg-primary/10 hover:scale-110",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  "border border-border/50 hover:border-primary/50"
                )}
                title="Add new item"
              >
                <Plus className="w-4 h-4 text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mt-1">
              <DropdownMenuItem onClick={() => startCreating('table')} className="gap-3">
                <Table className="w-4 h-4 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">New Table</span>
                  <span className="text-xs text-muted-foreground">Create an Airtable-like datatable</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => startCreating('category')} className="gap-3">
                <Folder className="w-4 h-4 text-orange-500" />
                <div className="flex flex-col">
                  <span className="font-medium">New Category</span>
                  <span className="text-xs text-muted-foreground">Organize your tables</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Search */}
        <SearchField
          placeholder="Search tables and categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Search Results */}
        {isSearching ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">
                Search Results {(filteredTables.length + filteredCategories.length) > 0 && 
                  `(${filteredTables.length + filteredCategories.length})`}
              </span>
            </div>
            
            {(filteredTables.length + filteredCategories.length) === 0 ? (
              <div className="text-xs text-muted-foreground px-2 py-4 text-center">
                No tables or categories found for "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-2">
                {/* Matching Categories */}
                {filteredCategories
                  .sort((a: any, b: any) => a.name.localeCompare(b.name))
                  .map((category: any) => (
                  <button
                    key={category.id}
                    className="w-full text-left px-2 py-1 rounded text-sm transition-colors group hover:bg-accent"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📁</span>
                        <span className="truncate">{category.name}</span>
                        <Badge variant="outline" className="text-xs">Category</Badge>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStar(category.id);
                        }}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Star 
                          className={cn(
                            "w-3 h-3",
                            starredIds.has(category.id) 
                              ? "fill-yellow-500 text-yellow-500" 
                              : "text-muted-foreground"
                          )} 
                        />
                      </button>
                    </div>
                  </button>
                ))}
                
                {/* Matching Tables */}
                {filteredTables
                  .sort((a: any, b: any) => a.name.localeCompare(b.name))
                  .map((table: any) => {
                  const parentCategory = categories.find((cat: any) => cat.id === table.categoryId);
                  return (
                    <button
                      key={table.id}
                      onClick={() => onTableSelect?.(table.id)}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded text-sm transition-colors group",
                        "hover:bg-accent",
                        selectedTableId === table.id && "bg-accent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">📊</span>
                          <span className="truncate">{table.name}</span>
                          {parentCategory && (
                            <Badge variant="outline" className="text-xs">
                              in {parentCategory.name}
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(table.id);
                          }}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Star 
                            className={cn(
                              "w-3 h-3",
                              starredIds.has(table.id) 
                                ? "fill-yellow-500 text-yellow-500" 
                                : "text-muted-foreground"
                            )} 
                          />
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Starred */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Starred</span>
              </div>
              
              {starredItems.length > 0 ? (
                <div className="space-y-1 ml-6">
                  {starredItems
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
                    .map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => item.icon === '📊' && onTableSelect?.(item.id)}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded text-sm transition-colors group",
                        "hover:bg-accent",
                        selectedTableId === item.id && "bg-accent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{item.icon}</span>
                          <span className="truncate">{item.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="ml-6 text-xs text-muted-foreground">
                  No starred items
                </div>
              )}
            </div>

        {/* Root Tables */}
        {rootTables.length > 0 && (
          <div className="space-y-1">
            {rootTables
              .sort((a: any, b: any) => a.name.localeCompare(b.name))
              .map((table: any) => (
              <button
                key={table.id}
                onClick={() => onTableSelect?.(table.id)}
                className={cn(
                  "w-full text-left px-2 py-1 rounded text-sm transition-colors group",
                  "hover:bg-accent",
                  selectedTableId === table.id && "bg-accent"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">📊</span>
                    <span className="truncate">{table.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(table.id);
                    }}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Star 
                      className={cn(
                        "w-3 h-3",
                        starredIds.has(table.id) 
                          ? "fill-yellow-500 text-yellow-500" 
                          : "text-muted-foreground"
                      )} 
                    />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Categories with nested tables */}
        {categories.map((category: any) => {
          const categoryTables = getTablesForCategory(category.id);
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <div key={category.id}>
              <div className="flex items-center group hover:bg-accent/50 rounded-md transition-colors">
                <button
                  onClick={() => toggleCategoryExpanded(category.id)}
                  className="flex items-center gap-2 p-2 transition-colors flex-1 min-w-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-xs">📁</span>
                  <span className="text-sm font-medium truncate">{category.name}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    {categoryTables.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {categoryTables.length}
                      </Badge>
                    )}
                  </div>
                </button>
                
                <div className="flex items-center pr-2">
                  <button
                    onClick={() => startCreating('table', category.id)}
                    className={cn(
                      "p-1.5 rounded-md transition-all duration-200",
                      "opacity-0 group-hover:opacity-100",
                      "hover:bg-primary/10 hover:scale-110",
                      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    )}
                    title="Add table to category"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(category.id);
                    }}
                    className={cn(
                      "p-1.5 rounded-md transition-all duration-200",
                      starredIds.has(category.id) 
                        ? "opacity-100" 
                        : "opacity-0 group-hover:opacity-100",
                      "hover:bg-yellow-500/10 hover:scale-110",
                      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    )}
                  >
                    <Star 
                      className={cn(
                        "w-4 h-4 transition-colors",
                        starredIds.has(category.id) 
                          ? "fill-yellow-500 text-yellow-500" 
                          : "text-muted-foreground hover:text-yellow-500"
                      )} 
                    />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {/* Inline creation for this category - appears at top */}
                  {creatingItem?.type === 'table' && creatingItem.parentCategoryId === category.id && (
                    <div className="px-2 py-1 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2 p-2 border border-primary/50 rounded-md bg-primary/5">
                        <span className="text-xs">📊</span>
                        <Input
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={handleKeyPress}
                          onBlur={() => {
                            if (newItemName.trim()) {
                              handleCreateItem();
                            } else {
                              cancelCreating();
                            }
                          }}
                          placeholder="Table name"
                          className="h-6 text-sm border-0 bg-transparent focus:ring-0 p-0"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Tables list - sorted alphabetically */}
                  {categoryTables
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
                    .map((table: any) => (
                    <div
                      key={table.id}
                      onClick={() => onTableSelect?.(table.id)}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded text-sm transition-colors group cursor-pointer",
                        "hover:bg-accent",
                        selectedTableId === table.id && "bg-accent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">📊</span>
                          <span className="truncate">{table.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(table.id);
                          }}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Star 
                            className={cn(
                              "w-3 h-3",
                              starredIds.has(table.id) 
                                ? "fill-yellow-500 text-yellow-500" 
                                : "text-muted-foreground"
                            )} 
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {categoryTables.length === 0 && !creatingItem && (
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      No tables in this category
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

          </>
        )}

        {/* Inline creation - only for root-level items */}
        {creatingItem && (creatingItem.type === 'category' || !creatingItem.parentCategoryId) && (
          <div className="px-2 py-1 animate-in fade-in-50 slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 p-2 border border-primary/50 rounded-md bg-primary/5">
              <span className="text-xs">{creatingItem.type === 'category' ? '📁' : '📊'}</span>
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={() => {
                  if (newItemName.trim()) {
                    handleCreateItem();
                  } else {
                    cancelCreating();
                  }
                }}
                placeholder={`${creatingItem.type === 'category' ? 'Category' : 'Table'} name`}
                className="h-6 text-sm border-0 bg-transparent focus:ring-0 p-0"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};