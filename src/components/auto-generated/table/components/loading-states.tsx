/**
 * Loading States Component - Loading and Error States
 */

import React from 'react';
import { cn } from '@/lib/utils/generalUtils';
import { Spinner } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';

interface LoadingStatesProps {
  isLoading: boolean;
  error: any;
  className?: string;
}

export const LoadingStates: React.FC<LoadingStatesProps> = ({
  isLoading,
  error,
  className
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("bg-white border border-gray-200 rounded-lg p-6 flex flex-col flex-1 min-h-0", className)}>
        <div className="flex h-[200px] items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return (
      <div className={cn("bg-white border border-gray-200 rounded-lg p-6 flex flex-col flex-1 min-h-0", className)}>
        <div className="flex h-[200px] items-center justify-center text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {errorMessage}
        </div>
      </div>
    );
  }

  return null;
};