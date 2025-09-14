'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActionQuery, useActionMutation } from '@/hooks/use-action-api';
import { useTagContext, type TagEntityType } from '@/components/providers/tag-provider';
import { CreateModal } from '@/components/auto-generated/modal';
import { TAG_SCHEMA } from '@/features/tags/tags.schema';
import { TAG_GROUP_SCHEMA } from '@/features/tags/tag-groups.schema';
import { cn } from '@/lib/utils/generalUtils';

// ============================================================================
// TYPES
// ============================================================================

interface EntityTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: TagEntityType;
  entityId: string;
  selectedTagIds: string[];
  onTagsChange?: (tagIds: string[]) => void;
}

// ============================================================================
// JUNCTION TABLE MAPPING
// ============================================================================

const JUNCTION_TABLE_MAP: Record<TagEntityType, string> = {
  rule: 'ruleTag',
  class: 'classTag',
  office: 'officeTag', 
  node: 'nodeTag',
  process: 'processTag',
  workflow: 'workflowTag'
};

const ENTITY_LABELS: Record<TagEntityType, string> = {
  rule: 'Rule',
  class: 'Class',
  office: 'Office',
  node: 'Node', 
  process: 'Process',
  workflow: 'Workflow'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EntityTagModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  selectedTagIds,
  onTagsChange
}: EntityTagModalProps) {
  // ============================================================================
  // STATE
  // ============================================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('select');
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedTagIds);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  
  // Fetch all available tags
  const { data: tagsResponse, isLoading: loadingTags } = useActionQuery(
    'tag.list',
    { filters: { isActive: true } }
  );

  // Fetch tag groups
  const { data: groupsResponse } = useActionQuery(
    'tagGroup.list',
    { filters: { isActive: true } }
  );

  const tags = useMemo(() => tagsResponse?.data || [], [tagsResponse]);
  const groups = useMemo(() => groupsResponse?.data || [], [groupsResponse]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================
  
  const junctionTableKey = JUNCTION_TABLE_MAP[entityType];
  
  const { mutateAsync: createJunction } = useActionMutation(`${junctionTableKey}.create`);
  const { mutateAsync: deleteJunction } = useActionMutation(`${junctionTableKey}.delete`);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds(selectedTagIds);
      setSearchQuery('');
      setActiveTab('select');
    }
  }, [isOpen, selectedTagIds]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleTagToggle = (tagId: string) => {
    setLocalSelectedIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const currentIds = new Set(selectedTagIds);
      const newIds = new Set(localSelectedIds);
      
      // Tags to add (in newIds but not in currentIds)
      const toAdd = [...newIds].filter(id => !currentIds.has(id));
      
      // Tags to remove (in currentIds but not in newIds)
      const toRemove = [...currentIds].filter(id => !newIds.has(id));

      // Create new junction entries
      for (const tagId of toAdd) {
        await createJunction({
          [`${entityType}Id`]: entityId,
          tagId: tagId
        });
      }

      // Remove old junction entries (would need junction IDs for this)
      // For now, this is a simplified implementation
      // In a real app, you'd fetch current junctions and delete by ID

      onTagsChange?.(localSelectedIds);
      onClose();
    } catch (error) {
      
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalSelectedIds(selectedTagIds);
    onClose();
  };

  // ============================================================================
  // FILTERING
  // ============================================================================
  
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    
    const query = searchQuery.toLowerCase();
    return tags.filter((tag: any) => 
      tag.name.toLowerCase().includes(query) ||
      tag.description?.toLowerCase().includes(query)
    );
  }, [tags, searchQuery]);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop and Container */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleCancel}
        />
        
        <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-background rounded-lg shadow-xl border flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold">
                Manage {ENTITY_LABELS[entityType]} Tags
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+⌘+T</kbd> to toggle • 
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded ml-1">⌘+Enter</kbd> to save
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="select">
                  Select Tags ({localSelectedIds.length})
                </TabsTrigger>
                <TabsTrigger value="manage">
                  Create New
                </TabsTrigger>
              </TabsList>

              {/* Select Tab */}
              <TabsContent value="select" className="flex-1 flex flex-col space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tags List */}
                <ScrollArea className="flex-1">
                  {loadingTags ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading tags...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredTags.map((tag: any) => (
                        <div
                          key={tag.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
                            localSelectedIds.includes(tag.id) 
                              ? 'bg-primary/10 border-primary' 
                              : 'border-border'
                          )}
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
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Manage Tab */}
              <TabsContent value="manage" className="flex-1 flex flex-col space-y-4">
                <Button onClick={() => setShowCreateTag(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Tag
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  Create new tags to organize your {ENTITY_LABELS[entityType].toLowerCase()}s.
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-muted/30">
            <div className="text-sm text-muted-foreground">
              {localSelectedIds.length} tags selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
          }}
        />
      )}
    </>
  );
}