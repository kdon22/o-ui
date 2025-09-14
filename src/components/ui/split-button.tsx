/**
 * SplitButton Component
 * 
 * A fresh split button component with inline dropdown - no external dependencies!
 * Combines a primary action button with a chevron dropdown for secondary actions.
 */

"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from '@/lib/utils/generalUtils'

export interface SplitButtonAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
}

export interface SplitButtonProps {
  /** Primary action (main button) */
  primaryAction: SplitButtonAction
  /** Secondary actions (dropdown items) */
  secondaryActions: SplitButtonAction[]
  /** Button variant */
  variant?: "default" | "outline" | "secondary"
  /** Optional className for the container */
  className?: string
}

export const SplitButton = React.forwardRef<HTMLDivElement, SplitButtonProps>(
  ({ primaryAction, secondaryActions, variant = "default", className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Button base styles (copied from button.tsx)
    const baseButtonStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-9 px-3"
    
    // Variant styles
    const variantStyles = {
      default: "bg-black text-white hover:bg-gray-800",
      outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    }

    return (
      <div ref={ref} className={cn("relative inline-flex", className)}>
        {/* Primary Button */}
        <button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className={cn(
            baseButtonStyles,
            variantStyles[variant],
            "rounded-r-none border-r-0"
          )}
        >
          {primaryAction.icon}
          {primaryAction.label}
        </button>

        {/* Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              baseButtonStyles,
              variantStyles[variant],
              "rounded-l-none px-2",
              variant === "default" && "border-l border-l-white/20",
              variant === "outline" && "border-l border-l-gray-200",
              variant === "secondary" && "border-l border-l-gray-300"
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
            >
              {secondaryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick()
                    setIsOpen(false)
                  }}
                  disabled={action.disabled}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-sm text-left",
                    "hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
                    "first:rounded-t-md last:rounded-b-md"
                  )}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
)

SplitButton.displayName = "SplitButton"