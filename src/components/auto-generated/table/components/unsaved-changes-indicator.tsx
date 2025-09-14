/**
 * Unsaved Changes Indicator - Shows batch version tracking status
 * 
 * Features:
 * - Visual indicator for unsaved changes
 * - Save/discard action buttons
 * - Auto-save status display
 * - Enterprise-grade UX
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface UnsavedChangesIndicatorProps {
  hasUnsavedChanges: boolean;
  changeCount: number;
  lastSavedAt?: number;
  isSaving: boolean;
  saveError?: string;
  onSave: () => void;
  onDiscard: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UnsavedChangesIndicator({
  hasUnsavedChanges,
  changeCount,
  lastSavedAt,
  isSaving,
  saveError,
  onSave,
  onDiscard,
  className
}: UnsavedChangesIndicatorProps) {
  
  // Don't show anything if no changes and no error
  if (!hasUnsavedChanges && !saveError && !isSaving) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Alert className="w-80 bg-background border shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isSaving ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Saving changes...</span>
              </>
            ) : saveError ? (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Save failed</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  {changeCount} unsaved change{changeCount !== 1 ? 's' : ''}
                </span>
              </>
            ) : null}
            
            {lastSavedAt && !hasUnsavedChanges && !saveError && (
              <Badge variant="secondary" className="text-xs">
                Saved {formatDistanceToNow(lastSavedAt)} ago
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && !isSaving && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDiscard}
                  className="h-8 px-3"
                >
                  <X className="h-3 w-3 mr-1" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  className="h-8 px-3"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </>
            )}
            
            {saveError && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onSave}
                className="h-8 px-3"
              >
                <Save className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
        
        {saveError && (
          <AlertDescription className="mt-2 text-sm text-muted-foreground">
            {saveError}
          </AlertDescription>
        )}
      </Alert>
    </div>
  );
}

export default UnsavedChangesIndicator;
