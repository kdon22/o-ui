'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Search, Plus, Folder, Tag as TagIcon, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreateModal, UpdateModal } from '@/components/auto-generated/modal';
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { TAG_SCHEMA } from '../tags.schema';
import { TAG_GROUP_SCHEMA } from '../tag-groups.schema';
import type { TagEntity, TagGroupEntity, TagModalProps } from '../types';

// ============================================================================
// MAIN TAG MODAL COMPONENT
// ============================================================================

export function TagModal({ 
  isOpen, 
  onClose, 
  ruleId,
  selectedTagIds = [], 
  onTagsChange,
  mode = 'select' 
}: TagModalProps) {
  // ============================================================================
  // STATE
  // ============================================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('select');
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedTagIds);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [draggedTagId, setDraggedTagId] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const { data: tagsResponse, isLoading: loadingTags } = useActionQuery(
    'tag.list',
    { filters: { isActive: true } }
  );

  const { data: groupsResponse, isLoading: loadingGroups } = useActionQuery(
    'tagGroup.list',
    { filters: { isActive: true } }
  );

  const tags = useMemo(() => tagsResponse?.data || [], [tagsResponse]);
  const groups = useMemo(() => groupsResponse?.data || [], [groupsResponse]);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Shift+Cmd+T to open/close modal
      if (event.shiftKey && (event.metaKey || event.ctrlKey) && event.key === 't') {
        event.preventDefault();
        if (isOpen) {
          onClose();
        }
        // Note: Opening is handled by parent component
        return;
      }

      // Only handle other shortcuts when modal is open
      if (!isOpen) return;

      // Escape to close
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Enter to create new tag quickly
      if (event.key === 'Enter' && searchQuery.trim() && !isTagNameExists(searchQuery)) {
        event.preventDefault();
        handleQuickCreateTag(searchQuery.trim());
        return;
      }

      // Cmd+Enter to save and close
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSave();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchQuery, onClose]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  const isTagNameExists = (name: string) => {
    return tags.some(tag => tag.name.toLowerCase() === name.toLowerCase());
  };

  const handleQuickCreateTag = async (name: string) => {
    // This would trigger a quick tag creation
    setShowCreateTag(true);
    // Pre-fill the create form with the search query
  };

  const handleSave = () => {
    onTagsChange?.(localSelectedIds);
    onClose();
  };

  const handleCancel = () => {
    setLocalSelectedIds(selectedTagIds); // Reset to original selection
    onClose();
  };

  // ============================================================================
  // TAG SELECTION LOGIC
  // ============================================================================
  const handleTagToggle = (tagId: string) => {
    setLocalSelectedIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSelectAll = (groupId?: string) => {
    const groupTags = groupId 
      ? tags.filter(tag => tag.groupId === groupId)
      : tags.filter(tag => !tag.groupId);
    
    const groupTagIds = groupTags.map(tag => tag.id);
    const allSelected = groupTagIds.every(id => localSelectedIds.includes(id));
    
    if (allSelected) {
      // Deselect all in group
      setLocalSelectedIds(prev => prev.filter(id => !groupTagIds.includes(id)));
    } else {
      // Select all in group
      setLocalSelectedIds(prev => [...new Set([...prev, ...groupTagIds])]);
    }
  };

  // ============================================================================
  // FILTERED AND GROUPED DATA
  // ============================================================================
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    
    const query = searchQuery.toLowerCase();
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(query) ||
      tag.description?.toLowerCase().includes(query) ||
      groups.find(g => g.id === tag.groupId)?.name.toLowerCase().includes(query)
    );
  }, [tags, groups, searchQuery]);

  const groupedTags = useMemo(() => {
    const grouped: Record<string, { group: TagGroupEntity | null; tags: TagEntity[] }> = {};
    
    // Initialize with groups
    groups.forEach(group => {
      grouped[group.id] = { group, tags: [] };
    });
    
    // Add ungrouped section
    grouped['ungrouped'] = { group: null, tags: [] };
    
    // Distribute tags
    filteredTags.forEach(tag => {
      const key = tag.groupId || 'ungrouped';
      if (grouped[key]) {
        grouped[key].tags.push(tag);
      } else {
        // Tag belongs to a group not in current results
        grouped[tag.groupId!] = { 
          group: groups.find(g => g.id === tag.groupId) || null, 
          tags: [tag] 
        };
      }
    });
    
    // Sort tags within each group
    Object.values(grouped).forEach(({ tags: groupTags }) => {
      groupTags.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    });
    
    return grouped;
  }, [filteredTags, groups]);

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================
  const handleDragStart = (tagId: string) => {
    setDraggedTagId(tagId);
  };

  const handleDragEnd = () => {
    setDraggedTagId(null);
  };

  const handleDrop = (targetIndex: number) => {
    if (!draggedTagId) return;
    
    const currentIndex = localSelectedIds.indexOf(draggedTagId);
    if (currentIndex === -1) return;
    
    const newOrder = [...localSelectedIds];
    newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, draggedTagId);
    
    setLocalSelectedIds(newOrder);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  const renderTagGroup = (groupKey: string, { group, tags: groupTags }: { group: TagGroupEntity | null; tags: TagEntity[] }) => {
    if (groupTags.length === 0) return null;

    const selectedInGroup = groupTags.filter(tag => localSelectedIds.includes(tag.id)).length;
    const isAllSelected = selectedInGroup === groupTags.length;
    const isPartialSelected = selectedInGroup > 0 && selectedInGroup < groupTags.length;

    return (
      <div key={groupKey} className="mb-6">
        {/* Group Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isPartialSelected;
              }}
              onCheckedChange={() => handleSelectAll(group?.id)}
            />
            <div className="flex items-center gap-2">
              {group ? (
                <>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: group.color }}
                  />
                  <Folder className="w-4 h-4" />
                  <span className="font-medium">{group.name}</span>
                </>
              ) : (
                <>
                  <TagIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Ungrouped</span>
                </>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {selectedInGroup}/{groupTags.length}
          </Badge>
        </div>

        {/* Tags in Group */}
        <div className="grid grid-cols-1 gap-2">
          {groupTags.map(tag => (
            <div
              key={tag.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                localSelectedIds.includes(tag.id) 
                  ? 'bg-primary/10 border-primary' 
                  : 'border-border'
              }`}
              onClick={() => handleTagToggle(tag.id)}
            >
              <Checkbox 
                checked={localSelectedIds.includes(tag.id)}
                onChange={() => {}} // Handled by parent click
              />
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: tag.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{tag.name}</div>
                {tag.description && (
                  <div className="text-sm text-muted-foreground truncate">
                    {tag.description}
                  </div>
                )}
              </div>
              {tag.usageCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {tag.usageCount}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSelectedTags = () => {
    const selectedTags = localSelectedIds
      .map(id => tags.find(tag => tag.id === id))
      .filter(Boolean) as TagEntity[];

    if (selectedTags.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No tags selected
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {selectedTags.map((tag, index) => (
          <div
            key={tag.id}
            draggable
            onDragStart={() => handleDragStart(tag.id)}
            onDragEnd={handleDragEnd}
            onDrop={() => handleDrop(index)}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-move transition-colors hover:bg-muted/50 ${
              draggedTagId === tag.id ? 'opacity-50' : ''
            }`}
          >
            <Grip className="w-4 h-4 text-muted-foreground" />
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: tag.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{tag.name}</div>
              {tag.group && (
                <div className="text-sm text-muted-foreground">
                  {tag.group.name}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTagToggle(tag.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    );
  };

  // Don't render if not open
  if (!isOpen) return null;

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleCancel}
        />
        
        {/* Modal Content */}
        <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-background rounded-lg shadow-xl border flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold">Manage Tags</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select and organize tags for your rule • Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Shift+⌘+T</kbd> to toggle
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              {/* Tab List */}
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="select">
                    Select Tags ({localSelectedIds.length})
                  </TabsTrigger>
                  <TabsTrigger value="selected">
                    Selected ({localSelectedIds.length})
                  </TabsTrigger>
                  <TabsTrigger value="manage">
                    Manage
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 p-6 min-h-0">
                {/* Select Tab */}
                <TabsContent value="select" className="h-full flex flex-col space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search tags... (Press Enter to create new)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {searchQuery && !isTagNameExists(searchQuery) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickCreateTag(searchQuery)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
                      >
                        Create "{searchQuery}"
                      </Button>
                    )}
                  </div>

                  {/* Tags List */}
                  <ScrollArea className="flex-1">
                    {loadingTags ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading tags...
                      </div>
                    ) : (
                      <div>
                        {Object.entries(groupedTags).map(([groupKey, groupData]) =>
                          renderTagGroup(groupKey, groupData)
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* Selected Tab */}
                <TabsContent value="selected" className="h-full flex flex-col">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Drag to reorder • Click X to remove
                    </p>
                  </div>
                  <ScrollArea className="flex-1">
                    {renderSelectedTags()}
                  </ScrollArea>
                </TabsContent>

                {/* Manage Tab */}
                <TabsContent value="manage" className="h-full flex flex-col space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={() => setShowCreateTag(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Tag
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateGroup(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Group
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Use the main tags interface for comprehensive tag and group management.
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-muted/30">
            <div className="text-sm text-muted-foreground">
              {localSelectedIds.length} tags selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Apply Tags
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Tag Modal */}
      {showCreateTag && (
        <CreateModal
          isOpen={showCreateTag}
          onClose={() => setShowCreateTag(false)}
          config={{
            resource: TAG_SCHEMA.actionPrefix,
            action: 'create',
            width: 'md'
          }}
          schema={TAG_SCHEMA}
          onSuccess={() => {
            setShowCreateTag(false);
            // Tags will auto-refresh via query invalidation
          }}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          config={{
            resource: TAG_GROUP_SCHEMA.actionPrefix,
            action: 'create',
            width: 'md'
          }}
          schema={TAG_GROUP_SCHEMA}
          onSuccess={() => {
            setShowCreateGroup(false);
            // Groups will auto-refresh via query invalidation
          }}
        />
      )}
    </>
  );
} 