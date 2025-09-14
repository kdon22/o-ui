"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from '@/lib/utils/generalUtils'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui"

const contentVariants = cva(
  "bg-white dark:bg-gray-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]",
  {
    variants: {
      size: {
        default: "w-full max-w-lg",
        sm: "w-full max-w-sm",
        md: "w-full max-w-md",
        lg: "w-full max-w-lg",
        xl: "w-full max-w-xl",
        full: "w-[95vw] h-[90vh] max-w-none"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
)

interface ModalProps extends React.ComponentPropsWithoutRef<typeof Dialog>, 
  VariantProps<typeof contentVariants> {
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  showCloseButton?: boolean
  onClose?: () => void
  contentClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  titleSize?: "sm" | "md" | "lg"
  open?: boolean
  onOpenChange?: (open: boolean) => void
  blurBackground?: boolean
}

export function Modal({
  children,
  title,
  description,
  footer,
  size,
  showCloseButton = true,
  onClose,
  contentClassName,
  titleClassName,
  descriptionClassName,
  titleSize = "md",
  blurBackground = true,
  ...props
}: ModalProps) {
  return (
    <Dialog {...props}>
      <DialogContent 
        className={cn(
          contentVariants({ size }),
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto",
          "border border-gray-200 dark:border-gray-800 shadow-xl",
          "rounded-lg",
          "z-[9999]",
          "!important-modal-element",
          contentClassName
        )}
        style={{
          boxShadow: "0 0 0 5000px rgba(0,0,0,0.5), 0 0 30px rgba(0,0,0,0.7)",
        }}
        onInteractOutside={(e: Event) => {
          e.preventDefault()
          if (onClose) onClose()
        }}
        onEscapeKeyDown={() => {
          if (onClose) onClose()
        }}
        hideCloseButton={true}
        blurBackground={blurBackground}
        accessibleTitle={typeof title === 'string' ? title : 'Modal Dialog'}
        accessibleDescription={typeof description === 'string' ? description : 'Modal content'}
      >
        <div className="p-6">
          {title && (
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-4">
              <DialogTitle className={cn("text-gray-900 dark:text-gray-100", titleClassName)} size={titleSize}>
                {title}
              </DialogTitle>
              
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors duration-200"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              )}
            </div>
          )}
          
          {description && (
            <DialogDescription className={cn("text-base text-gray-600 dark:text-gray-400 mb-4", descriptionClassName)}>
              {description}
            </DialogDescription>
          )}
          
          <div className="space-y-4">
            {children}
          </div>
          
          {footer && (
            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
              {footer}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add a convenience component for action buttons that match the monochrome design
export function ModalAction({
  children,
  variant = "default",
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button>) {
  const buttonClassName = cn(
    variant === "default" && "bg-black hover:bg-gray-800 text-white focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200",
    className
  );
  
  return <Button variant={variant} className={buttonClassName} {...props}>{children}</Button>;
}

// Cancel button component for modals
export function ModalCancelButton({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button>) {
  return (
    <Button 
      variant="outline"
      className={cn(
        "bg-gray-50 text-gray-700 hover:bg-gray-100",
        "focus:ring-2 focus:ring-offset-2 focus:ring-gray-300",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {children || "Cancel"}
    </Button>
  );
} 