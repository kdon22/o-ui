/**
 * Context Menu Component
 * 
 * Dropdown menu for table row actions with customizable menu items.
 */

"use client";

import React from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { Button } from '@/components/ui';
import { 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Copy,
  Wifi,
  Users,
  Activity,
  GitBranch,
  GitMerge,
  History,
  GitCompare,
  RotateCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/drop-down-menu';
import { createContextMenuActions, type ActionContext } from '@/lib/resource-system/context-menu-actions';
import type { ContextMenuItem } from '@/lib/resource-system/schemas';
import type { ContextMenuProps } from './types';
import { useConfirmDialog } from '@/components/ui/hooks/useConfirmDialog';

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  entity, 
  resource, 
  resourceKey, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  customHandlers,
  contextData 
}) => {
  // Add confirmation dialog support
  const { showConfirmDialog, modal } = useConfirmDialog();
  
  const rawContextMenuItems = resource.table?.contextMenu || [];
  
  // Filter context menu items based on entity state
  const contextMenuItems = rawContextMenuItems.filter(item => {
    if (item.separator) return true;
    
    // Special handling for rule ignore/unignore based on current state
    if (item.action === 'ignoreRule') {
      // Only show "Ignore Rule" if rule is NOT currently ignored
      return !entity.isIgnored && entity.displayClass !== 'ignored';
    }
    
    if (item.action === 'unignoreRule') {
      // Only show "Unignore Rule" if rule IS currently ignored
      return entity.isIgnored || entity.displayClass === 'ignored';
    }
    
    return true;
  });
  
  if (contextMenuItems.length === 0) {
    return null;
  }

  // Create action context - filter out null values to match ActionContext interface
  const actionContext: ActionContext = {
    entity,
    resource,
    resourceKey,
    contextData: contextData ? {
      ...contextData,
      nodeId: contextData.nodeId || undefined,
      parentId: contextData.parentId || undefined,
      branchId: contextData.branchId || undefined,
      tenantId: contextData.tenantId || undefined,
      userId: contextData.userId || undefined
    } : undefined,
    onEdit,
    onDelete,
    onDuplicate,
    customHandlers,
    showConfirmDialog // Pass the Stripe-style confirmation dialog
  };

  const actionHandler = createContextMenuActions(actionContext);

  const handleMenuItemClick = async (menuItem: ContextMenuItem, event?: React.MouseEvent) => {
    if (menuItem.separator || !menuItem.action) return;
    
    // Prevent default behavior to avoid scroll interference
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      await actionHandler.executeAction(menuItem.action, menuItem);
    } catch (error) {
      console.error('Context menu action failed:', error);
    }
  };

  // Icon mapping
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      edit: Edit,
      trash: Trash2,
      copy: Copy,
      wifi: Wifi,
      users: Users,
      activity: Activity,
      branch: GitBranch,
      merge: GitMerge,
      history: History,
      compare: GitCompare,
      switch: RotateCw
    };
    
    return icons[iconName] || MoreHorizontal;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex items-center justify-center"
            aria-label="Open menu"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {contextMenuItems.map((item) => {
            if (item.separator) {
              return <DropdownMenuSeparator key={item.id} />;
            }

            const IconComponent = getIcon(item.icon || '');
            
            return (
              <DropdownMenuItem
                key={item.id}
                onClick={(event) => handleMenuItemClick(item, event)}
                className={cn("flex items-center gap-2", item.className)}
              >
                <IconComponent className="h-4 w-4" />
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Render confirmation modal */}
      {modal}
    </>
  );
}; 