/**
 * PackageIcon Component - Consistent Package Icon Rendering
 * 
 * Provides consistent icon rendering across all marketplace components.
 * Handles both custom icons and gradient fallbacks with proper sizing.
 */

import React from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils/generalUtils';

interface PackageIconProps {
  iconUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'square' | 'rounded' | 'circle';
  fallbackGradient?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8', 
  xl: 'h-10 w-10'
};

const variantClasses = {
  square: 'rounded-none',
  rounded: 'rounded-lg',
  circle: 'rounded-full'
};

const defaultGradients = [
  'from-blue-500 to-purple-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-purple-500 to-pink-500',
  'from-yellow-500 to-orange-500',
  'from-indigo-500 to-purple-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500'
];

export function PackageIcon({ 
  iconUrl, 
  name, 
  size = 'md',
  variant = 'rounded',
  fallbackGradient,
  className 
}: PackageIconProps) {
  // Generate consistent gradient based on package name
  const gradientIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % defaultGradients.length;
  const gradient = fallbackGradient || defaultGradients[gradientIndex];

  const baseClasses = cn(
    sizeClasses[size],
    variantClasses[variant],
    'flex items-center justify-center flex-shrink-0',
    className
  );

  if (iconUrl) {
    return (
      <img 
        src={iconUrl} 
        alt={name}
        className={cn(
          baseClasses,
          'border border-gray-200 dark:border-gray-700 object-cover'
        )}
      />
    );
  }

  return (
    <div className={cn(baseClasses, `bg-gradient-to-br ${gradient}`)}>
      <Package className={cn(iconSizes[size], 'text-white')} />
    </div>
  );
}
