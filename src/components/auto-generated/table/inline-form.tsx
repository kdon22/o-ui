/**
 * Inline Form Component
 * 
 * Slide-down form for creating and editing entities within the table.
 * Uses React Portal to render at the top level (below header tabs).
 */

"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui';
import { X, Loader2 } from 'lucide-react';
import { AutoForm } from '@/components/auto-generated/form/auto-form';
import { getFormWidthClass } from '@/components/auto-generated/form/form-utils';
import { cn } from '@/lib/utils/generalUtils';
import type { InlineFormProps } from './types';

export const InlineForm: React.FC<InlineFormProps> = ({
  resource,
  entity,
  onSubmit,
  onCancel,
  mode,
  parentData,
  navigationContext
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Find the portal container on mount
  useEffect(() => {
    const container = document.getElementById('inline-form-portal');
    setPortalContainer(container);
  }, []);

  // Enhanced focus management and keyboard navigation
  useEffect(() => {
    if (portalContainer) {
      // Auto-focus first input
      const timer = setTimeout(() => {
        const firstInput = document.querySelector('#inline-form-portal input, #inline-form-portal textarea, #inline-form-portal select');
        if (firstInput) {
          (firstInput as HTMLElement).focus();
        }
      }, 100);

      // Enhanced keyboard navigation
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
        
        // Tab trapping - keep focus within form
        if (e.key === 'Tab') {
          trapFocusInForm(e, portalContainer);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [portalContainer, onCancel]);

  // Focus trapping utility
  const trapFocusInForm = useCallback((e: KeyboardEvent, formElement: HTMLElement) => {
    const focusableElements = formElement.querySelectorAll(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (e.shiftKey) {
      // Shift+Tab - going backwards
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab - going forwards
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  // Enhanced form submission with success feedback
  const handleSubmit = useCallback(async (data: any) => {
    console.log('🔥 [InlineForm] Form submission started', {
      resource: resource.actionPrefix,
      mode,
      data,
      entity,
      timestamp: new Date().toISOString()
    });
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(data);
      // Form submission completed successfully
      
      // Show success feedback
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 2000);
      
    } catch (error) {
      console.error('🔥 [InlineForm] Form submission failed:', error);
      throw error; // Re-throw to let parent handle
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, resource.actionPrefix, mode, entity]);

  // Memoize form width class
  const formWidthClass = useMemo(() => getFormWidthClass(resource), [resource]);

  // Create the form content with enhanced UX
  const formContent = (
    <div className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200 shadow-sm w-full animate-in slide-in-from-top-2 duration-300 fade-in-0 relative">
      
      {/* Portal-specific loading overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </p>
              <p className="text-xs text-gray-500">
                {mode === 'create' ? 'Adding new record' : 'Saving changes'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success notification */}
      {justSubmitted && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-in slide-in-from-top-2 duration-300 z-50">
          ✓ Saved
        </div>
      )}

      {/* Form Header with status indicator */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors duration-200",
              isSubmitting ? "bg-yellow-400 animate-pulse" : "bg-green-400"
            )} />
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? `Create ${resource.modelName}` : `Edit ${resource.modelName}`}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className={cn(
              "h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-all duration-200",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className={cn(
          "relative mx-auto",
          formWidthClass
        )}>
          <AutoForm
            schema={resource}
            mode={mode}
            initialData={entity}
            parentData={parentData}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isLoading={isSubmitting}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            compact={true}
            enableAnimations={true}
            enableKeyboardShortcuts={false} // Disabled for portal to avoid conflicts
            navigationContext={navigationContext}
            onError={(error) => {
              console.error('🔥 [InlineForm] AutoForm error:', error);
              // Portal forms handle their own error states
            }}
          />
        </div>
      </div>
    </div>
  );

  // Render via portal if container exists, otherwise render normally (fallback)
  return portalContainer ? createPortal(formContent, portalContainer) : formContent;
};