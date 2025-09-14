"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from '@/lib/utils/generalUtils'

// Helper function to create a lighter version of a hex color
function lightenColor(color: string, percent: number) {
  // Remove the # if present
  const hex = color.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate lighter values
  const lighter = (value: number) => {
    const newValue = Math.floor(value + (255 - value) * (percent / 100));
    return Math.min(255, newValue);
  };

  // Convert back to hex
  const rr = lighter(r).toString(16).padStart(2, '0');
  const gg = lighter(g).toString(16).padStart(2, '0');
  const bb = lighter(b).toString(16).padStart(2, '0');

  return `#${rr}${gg}${bb}`;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox } 