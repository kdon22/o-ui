'use client';

import React from 'react';
// Use ContextMenu components instead of DropdownMenu
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
} from '@/components/ui/context-menu'; // Correct path with proper casing
import type { MenuItemDef } from './types';

// Type for props accepted by ContextMenuContent
type ContextMenuContentProps = React.ComponentPropsWithoutRef<typeof ContextMenuContent>;

interface AppContextMenuProps {
    trigger: React.ReactNode;
    menuItems: MenuItemDef[];
    onAction: (actionId: string, context?: any) => void;
    contextData?: any; // Optional data to pass back with the action
    contentProps?: ContextMenuContentProps; // Use ContextMenuContentProps
}

export const AppContextMenu: React.FC<AppContextMenuProps> = ({
    trigger,
    menuItems,
    onAction,
    contextData,
    contentProps,
}) => {
    // Remove isOpen state and manual handlers

    const handleSelect = (actionId: string) => {
        // console.log(`[!!! AppContextMenu handleSelect ENTERED !!!] Action: ${actionId}`); // Remove debug log
        onAction(actionId, contextData);
    };

    // Filter items based on shouldShow condition if provided
    const visibleItems = menuItems.filter(item => !item.shouldShow || item.shouldShow(contextData));

    // Determine if there are any visible items to render besides separators
    const hasVisibleActions = visibleItems.some(item => !item.isSeparator);

    // If no actions are visible, just render the trigger
    if (!hasVisibleActions) {
        return <>{trigger}</>;
    }

    return (
        // Use ContextMenu components
        <ContextMenu>
            <ContextMenuTrigger asChild>
                {/* The trigger element itself handles left-click navigation via its own onClick */}
                {trigger}
            </ContextMenuTrigger>
            <ContextMenuContent {...contentProps}>
                {visibleItems.map((item, index) =>
                    item.isSeparator ? (
                        <ContextMenuSeparator key={`sep-${index}`} />
                    ) : (
                        <ContextMenuItem
                            key={item.id}
                            disabled={item.disabled}
                            // Keep using onClick as it works
                            onClick={() => handleSelect(item.id)} 
                            className={item.className}
                        >
                            {/* Render icon if provided */}
                            {item.icon && (
                                <span className="mr-2 h-4 w-4 flex items-center justify-center">
                                    {React.isValidElement(item.icon)
                                        ? item.icon
                                        : React.createElement(item.icon as React.ElementType)}
                                </span>
                            )}
                            <span>{item.label}</span>
                        </ContextMenuItem>
                    )
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
};

AppContextMenu.displayName = 'AppContextMenu'; 