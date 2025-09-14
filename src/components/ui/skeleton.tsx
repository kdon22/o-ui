/**
 * Skeleton Component
 * 
 * This component creates placeholder loading UI elements that indicate content is loading.
 * Skeletons help maintain layout stability and provide visual feedback during data fetching.
 * 
 * Benefits of using skeleton components:
 * - Reduces perceived loading time
 * - Prevents layout shifts when content loads
 * - Provides consistent loading UI across the application
 * - Can be styled to match the brand's visual identity
 */

import { cn } from '@/lib/utils/generalUtils'
import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-800',
        className
      )}
      {...props}
    />
  )
}

/**
 * Skeleton Container for wrapping multiple skeleton elements
 */
export function SkeletonContainer({ 
  children, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('space-y-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Text Skeleton for displaying loading state for text elements
 */
export function TextSkeleton({ 
  width = 'w-full', 
  height = 'h-4',
  className,
  ...props
}: { width?: string, height?: string } & SkeletonProps) {
  return (
    <Skeleton
      className={cn(width, height, className)}
      {...props} 
    />
  )
}

/**
 * Circle Skeleton for loading avatar or circular UI elements
 */
export function CircleSkeleton({
  size = 'h-12 w-12',
  className,
  ...props
}: { size?: string } & SkeletonProps) {
  return (
    <Skeleton 
      className={cn(size, 'rounded-full', className)} 
      {...props} 
    />
  )
} 