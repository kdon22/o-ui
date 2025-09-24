"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from '@/lib/utils/generalUtils'

// Helper function to generate classes for color variants
const generateColorClasses = (color: string): string => {
  if (color === "gray") {
    // Special case for gray dark mode
    return `border-transparent bg-gray-100 text-gray-800 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700`;
  }
  // Standard pattern for other colors
  return `border-transparent bg-${color}-100 text-${color}-800 hover:bg-${color}-100/80 dark:bg-${color}-900/20 dark:text-${color}-400 dark:hover:bg-${color}-900/30`;
};

// List of desired color variants
const colorNames = [
    'red', 'orange', 'yellow', 'green', 'teal', 'blue', 
    'cyan', 'indigo', 'purple', 'pink', 'gray'
];

// Generate the color variants dynamically
const colorVariants = colorNames.reduce((acc, color) => {
  acc[color] = generateColorClasses(color);
  return acc;
}, {} as Record<string, string>); // Assert type for accumulator

// Define static variants separately
const staticVariants = {
    default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground border",
    destructive: "border-transparent bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
};

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      // Combine static and generated variants
      variant: {
        ...staticVariants,
        ...colorVariants,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 