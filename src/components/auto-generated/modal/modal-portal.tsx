/**
 * Modal Portal - Renders modals at document root level
 * 
 * This component uses React Portal to render modals outside of the
 * normal component hierarchy, ensuring they appear above all other
 * UI elements regardless of parent container constraints.
 */

"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  id?: string;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({ 
  children, 
  id = 'modal-portal' 
}) => {
  const [mounted, setMounted] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create or get existing portal element
    let element = document.getElementById(id);
    
    if (!element) {
      element = document.createElement('div');
      element.id = id;
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.pointerEvents = 'none'; // Allow clicks to pass through when no modal
      element.style.zIndex = '9999';
      document.body.appendChild(element);
    }

    setPortalElement(element);
    setMounted(true);

    // Cleanup function
    return () => {
      // Don't remove the portal element on unmount as it might be used by other modals
      // It will be cleaned up when the page unloads
    };
  }, [id]);

  // Update pointer events based on whether there are children
  useEffect(() => {
    if (portalElement) {
      portalElement.style.pointerEvents = children ? 'auto' : 'none';
    }
  }, [children, portalElement]);

  // CRITICAL FIX: Immediate cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (portalElement) {
        // Immediately disable pointer events on unmount
        portalElement.style.pointerEvents = 'none';
      }
    };
  }, [portalElement]);

  if (!mounted || !portalElement) {
    return null;
  }

  return createPortal(children, portalElement);
}; 