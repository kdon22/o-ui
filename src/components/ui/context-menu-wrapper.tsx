'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
} from '@/components/ui/drop-down-menu';

// Infer types from the components themselves
type DropdownMenuProps = React.ComponentPropsWithoutRef<typeof DropdownMenu>;
type DropdownMenuContentProps = React.ComponentPropsWithoutRef<typeof DropdownMenuContent>;

interface ContextMenuWrapperProps extends Omit<DropdownMenuProps, 'open' | 'onOpenChange'> {
    trigger: React.ReactNode;
    children: React.ReactNode;
    contentProps?: DropdownMenuContentProps;
}

export const ContextMenuWrapper: React.FC<ContextMenuWrapperProps> = ({
    trigger,
    children,
    contentProps,
    ...dropdownProps
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const contextMenuTriggeredRef = useRef(false);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        contextMenuTriggeredRef.current = true;
        setIsMenuOpen(true);
    };

    const handleDropdownOpenChange = useCallback((isOpen: boolean) => {
        if (isOpen) {
            if (contextMenuTriggeredRef.current) {
                setIsMenuOpen(true);
            }
            contextMenuTriggeredRef.current = false; 
        } else {
            setIsMenuOpen(false);
            contextMenuTriggeredRef.current = false; 
        }
    }, []);

    return (
        <DropdownMenu 
            open={isMenuOpen} 
            onOpenChange={handleDropdownOpenChange}
            {...dropdownProps}
        >
            <DropdownMenuTrigger asChild onContextMenu={handleContextMenu}>
                {trigger}
            </DropdownMenuTrigger>
            <DropdownMenuContent {...contentProps}>
                {children}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

ContextMenuWrapper.displayName = 'ContextMenuWrapper'; 