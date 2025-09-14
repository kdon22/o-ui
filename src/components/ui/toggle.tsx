import * as React from "react"
import { cn } from '@/lib/utils/generalUtils'
import { VariantProps, cva } from "class-variance-authority"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-2",
        lg: "h-11 px-5",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toggleVariants> {
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, variant, size, pressed, onPressedChange, ...props }, ref) => {
    return (
      <button
        className={cn(
          toggleVariants({ variant, size }),
          pressed
            ? "bg-accent text-accent-foreground"
            : "hover:bg-muted hover:text-muted-foreground",
          className
        )}
        ref={ref}
        role="button"
        aria-pressed={pressed}
        data-state={pressed ? "on" : "off"}
        onClick={() => onPressedChange?.(!(pressed))}
        {...props}
      />
    )
  }
)

Toggle.displayName = "Toggle"

export { Toggle, toggleVariants } 