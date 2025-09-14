import * as React from "react"
import { Button } from "./button"
import { cn } from '@/lib/utils/generalUtils'

interface TableActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "edit" | "delete"
}

export const TableActionButton = React.forwardRef<HTMLButtonElement, TableActionButtonProps>(
  ({ className, variant = "edit", children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        className={cn(
          "group",
          variant === "edit" && "hover:bg-emerald-50",
          variant === "delete" && "hover:bg-red-50",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
TableActionButton.displayName = "TableActionButton" 